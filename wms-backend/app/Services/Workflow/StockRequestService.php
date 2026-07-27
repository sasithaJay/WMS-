<?php

// app/Services/Workflow/StockRequestService.php

namespace App\Services\Workflow;

use App\Models\InventoryBalance;
use App\Models\Organization;
use App\Models\StockRequest;
use App\Models\StockMovement;
use App\Models\Store;
use App\Models\User;
use App\Services\RequestWorkflowService;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;


class StockRequestService
{
    public function __construct(
        protected RequestWorkflowService $workflow
    ) {
    }

    /**
     * Create a new stock request and route it to the correct first stage.
     */
    public function create(array $data): StockRequest
    {
        return DB::transaction(function () use ($data) {

            $user = auth()->user();
            $requestNumber = $this->generateRequestNumber();
            $requestContext = $this->resolveRequestContext($user, $data);

            [$divisionId, $sectionId, $organizationId, $dsOfficeId] =
                $this->resolveRequesterContext($user, $data);

            // DS Offices may only submit once per calendar year.
            $this->assertDsOfficeFrequency($dsOfficeId, $divisionId);

            $store = Store::where('division_id', $divisionId)->first();

            if (! $store) {
                abort(422, 'No store found for the selected division.');
            }

            $request = StockRequest::create([
                'request_number'   => $requestNumber,
                'requester_id'     => $user->id,
                'division_id'      => $divisionId,
                'store_id'         => $store->id,
                'section_id'       => $sectionId,
                'organization_id'  => $organizationId,
                'ds_office_id'     => $dsOfficeId,
                'request_context'  => $requestContext, // ← backend-derived, not client-trusted
                'notes'            => $data['notes'] ?? null,
            ]);

            foreach ($data['items'] as $item) {
                $request->items()->create([
                    'item_id'             => $item['item_id'],
                    'quantity_requested'  => $item['quantity_requested'],
                    'remarks'             => $item['remarks'] ?? null,
                ]);
            }

            $this->workflow->initiate($request);

            return $request->fresh(['items.item', 'requester', 'recommender']);
        });
    }

    /**
     * Recommender acts on a request pending recommendation.
     */
    public function recommend(StockRequest $request, array $data): StockRequest
    {
        return DB::transaction(function () use ($request, $data) {

            $this->assertStage($request, 'RECOMMENDATION');
            $this->assertRecommender($request);

            $this->applyQuantities($request, $data['items'] ?? [], 'quantity_recommended', 'quantity_requested');

            $request->actions()->create([
                'stage'    => 'RECOMMENDATION',
                'actor_id' => auth()->id(),
                'action'   => 'RECOMMENDED',
                'remarks'  => $data['remarks'] ?? null,
                'acted_at' => now(),
            ]);

            $request->update([
                'current_stage' => 'APPROVAL',
                'status'        => 'PENDING_APPROVAL',
            ]);

            return $request->fresh(['items.item', 'actions']);
        });
    }

    /**
     * Approver acts on a request pending approval.
     */
    public function approve(StockRequest $request, array $data): StockRequest
    {
        return DB::transaction(function () use ($request, $data) {

            $this->assertStage($request, 'APPROVAL');
            $this->assertEligibleApprover($request);

            $this->applyQuantities($request, $data['items'] ?? [], 'quantity_approved', 'quantity_recommended');

            foreach ($request->items as $requestItem) {
                $balance = InventoryBalance::lockForUpdate()->firstOrCreate(
                    [
                        'item_id' => $requestItem->item_id,
                        'division_id' => $request->division_id,
                    ],
                    ['quantity_on_hand' => 0, 'reserved_quantity' => 0]
                );

                $balance->increment('reserved_quantity', $requestItem->quantity_approved);
            }

            $request->actions()->create([
                'stage'    => 'APPROVAL',
                'actor_id' => auth()->id(),
                'action'   => 'APPROVED',
                'remarks'  => $data['remarks'] ?? null,
                'acted_at' => now(),
            ]);

            $request->update([
                'current_stage' => 'ISSUANCE',
                'status'        => 'APPROVED',
                'approver_id'   => auth()->id(),
            ]);

            return $request->fresh(['items.item', 'actions']);
        });
    }

    /**
     * Reject a request at whichever stage it's currently in.
     */
    public function reject(StockRequest $request, string $reason): StockRequest
    {
        return DB::transaction(function () use ($request, $reason) {

            $stage = $request->current_stage;

            if ($stage === 'RECOMMENDATION') {
                $this->assertRecommender($request);
            } elseif ($stage === 'APPROVAL') {
                $this->assertEligibleApprover($request);
            } else {
                abort(422, 'This request cannot be rejected at its current stage.');
            }

            $request->actions()->create([
                'stage'    => $stage,
                'actor_id' => auth()->id(),
                'action'   => 'REJECTED',
                'remarks'  => $reason,
                'acted_at' => now(),
            ]);

            $request->update([
                'status'        => 'REJECTED',
                'current_stage' => null,
            ]);

            return $request->fresh('actions');
        });
    }

    /**
     * Return a request for correction at whichever stage it's currently in.
     */
    public function returnRequest(StockRequest $request, string $reason): StockRequest
    {
        return DB::transaction(function () use ($request, $reason) {

            $stage = $request->current_stage;

            if ($stage === 'RECOMMENDATION') {
                $this->assertRecommender($request);
            } elseif ($stage === 'APPROVAL') {
                $this->assertEligibleApprover($request);
            } else {
                abort(422, 'This request cannot be returned at its current stage.');
            }

            $request->actions()->create([
                'stage'    => $stage,
                'actor_id' => auth()->id(),
                'action'   => 'RETURNED',
                'remarks'  => $reason,
                'acted_at' => now(),
            ]);

            $request->update([
                'status'        => 'RETURNED',
                'current_stage' => null,
            ]);

            return $request->fresh('actions');
        });
    }

    // ------------------------------------------------------------------
    // Internal helpers
    // ------------------------------------------------------------------

    private function generateRequestNumber(): string
    {
        $year = now()->year;

        $last = StockRequest::whereYear('created_at', $year)
            ->latest('id')
            ->first();

        $number = $last
            ? (int) explode('-', $last->request_number)[2] + 1
            : 1;

        return sprintf('REQ-%s-%06d', $year, $number);
    }

    /**
     * Authoritatively determines the request context based on account type
     * and role, rather than trusting whatever the client sent. Institutions
     * always have a fixed context; DS Office requests are identified by the
     * AO's chosen context in the payload; everything else falls back to
     * whatever the staff member selected (PERSONAL / SECTION_COMMON).
     */
    private function resolveRequestContext(User $user, array $data): string
    {
        if ($user->account_type === 'INSTITUTION') {
            return 'INSTITUTION';
        }

        if (($data['request_context'] ?? null) === 'DS_OFFICE') {
            return 'DS_OFFICE';
        }

        return $data['request_context'];
    }

    /**
     * Determines division/section/organization for the new request based
     * on who's submitting it and what context they selected.
     */
    private function resolveRequesterContext(User $user, array $data): array
    {
        // AO submitting on behalf of a DS Office — organization comes from
        // the request payload, not from the submitting user's own account.
        if (($data['request_context'] ?? null) === 'DS_OFFICE') {
            $profile = $user->staffProfile;

            if (! $profile) {
                abort(403, 'Your account is not assigned to a staff profile.');
            }

            return [$profile->division_id, null, null, $data['ds_office_id']];
        }

        // Institution/DS Office accounts logging in and submitting directly
        // (institutions still do this; DS offices no longer have accounts,
        // but this branch stays harmless for institutions).
        if ($user->account_type === 'INSTITUTION' || $user->account_type === 'DS_OFFICE') {
            $org = $user->organization;

            if (! $org) {
                abort(422, 'This account has no linked organization record.');
            }

            return [$org->division_id, null, $org->id, null];
        }

        $profile = $user->staffProfile;

        if (! $profile) {
            abort(403, 'Your account is not assigned to a staff profile.');
        }

        // Commissioner may request from either division; everyone else is
        // locked to their own division.
        $divisionId = $profile->division_id;

        if ($profile->role->code === 'COMMISSIONER' && ! empty($data['division_id'])) {
            $divisionId = $data['division_id'];
        }

        return [$divisionId, $profile->section_id, null, null];
    }

    /**
     * DS Offices may only submit one active request per calendar year.
     * Rejected/cancelled/returned requests don't count against the limit.
     */
    private function assertDsOfficeFrequency(?int $dsOfficeId, int $divisionId): void
    {
        if (! $dsOfficeId) {
            return;
        }

        $alreadyRequestedThisYear = StockRequest::where('ds_office_id', $dsOfficeId)
            ->where('division_id', $divisionId)
            ->whereYear('created_at', now()->year)
            ->whereNotIn('status', ['REJECTED', 'CANCELLED', 'RETURNED'])
            ->exists();

        if ($alreadyRequestedThisYear) {
            abort(422, 'This Divisional Secretary Office has already submitted a request to this division this year.');
        }
    }

    private function applyQuantities(
        StockRequest $request,
        array $overrides,
        string $targetColumn,
        string $fallbackColumn
    ): void {
        $overridesByItemId = collect($overrides)->keyBy('item_id');

        foreach ($request->items as $requestItem) {
            $override = $overridesByItemId->get($requestItem->item_id);

            $requestItem->update([
                $targetColumn => $override['quantity'] ?? $requestItem->{$fallbackColumn},
            ]);
        }
    }

    private function assertStage(StockRequest $request, string $expected): void
    {
        if ($request->current_stage !== $expected) {
            throw ValidationException::withMessages([
                'stage' => "This request is not currently pending {$expected}.",
            ]);
        }
    }

    private function assertRecommender(StockRequest $request): void
    {
        if ($request->recommender_id !== auth()->id()) {
            abort(403, 'You are not the assigned recommender for this request.');
        }
    }

    private function assertEligibleApprover(StockRequest $request): void
    {
        $roleId = auth()->user()->staffProfile?->role_id;
        $eligibleRoleIds = $this->workflow->resolveApprovalRoleIds($request);

        if (! $roleId || ! $eligibleRoleIds->contains($roleId)) {
            abort(403, 'You are not eligible to approve this request.');
        }
    }

    public function issue(StockRequest $request, array $data): StockRequest
    {
        return DB::transaction(function () use ($request, $data) {

            $this->assertStage($request, 'ISSUANCE');
            $this->assertEligibleIssuer($request);

            $overridesByItemId = collect($data['items'] ?? [])->keyBy('item_id');
            $allFullyIssued = true;

            foreach ($request->items as $requestItem) {
                $alreadyIssued = (float) ($requestItem->quantity_issued ?? 0);
                $remainingApproved = (float) $requestItem->quantity_approved - $alreadyIssued;

                if ($remainingApproved <= 0) {
                    continue; // this item is already fully issued
                }

                $balance = InventoryBalance::lockForUpdate()->firstOrCreate(
                    ['item_id' => $requestItem->item_id, 'division_id' => $request->division_id],
                    ['quantity_on_hand' => 0, 'reserved_quantity' => 0]
                );

                $override = $overridesByItemId->get($requestItem->item_id);
                $requestedIssueQty = $override['quantity'] ?? $remainingApproved;

                // Cap by what's actually left to fulfil AND what's physically on hand.
                $issueQty = min($requestedIssueQty, $remainingApproved, (float) $balance->quantity_on_hand);

                if ($issueQty <= 0) {
                    $allFullyIssued = false;
                    continue; // nothing available for this item right now — stays back-ordered
                }

                $before = (float) $balance->quantity_on_hand;
                $after = $before - $issueQty;

                $balance->update([
                    'quantity_on_hand' => $after,
                    'reserved_quantity' => max(0, (float) $balance->reserved_quantity - $issueQty),
                ]);

                StockMovement::create([
                    'division_id'      => $request->division_id,
                    'item_id'          => $requestItem->item_id,
                    'movement_type'    => 'ISSUE',
                    'quantity'         => $issueQty,
                    'balance_before'   => $before,
                    'balance_after'    => $after,
                    'reference_type'   => 'STOCK_REQUEST',
                    'reference_id'     => $request->id,
                    'reference_number' => $request->request_number,
                    'performed_by'     => auth()->id(),
                    'remarks'          => $requestItem->remarks,
                ]);

                $requestItem->update([
                    'quantity_issued' => $alreadyIssued + $issueQty,
                ]);

                if (($alreadyIssued + $issueQty) < (float) $requestItem->quantity_approved) {
                    $allFullyIssued = false;
                }
            }

            $request->actions()->create([
                'stage'    => 'ISSUANCE',
                'actor_id' => auth()->id(),
                'action'   => $allFullyIssued ? 'ISSUED' : 'PARTIALLY_ISSUED',
                'remarks'  => $data['remarks'] ?? null,
                'acted_at' => now(),
            ]);

            $request->update([
                'status'        => $allFullyIssued ? 'ISSUED' : 'APPROVED',
                'current_stage' => $allFullyIssued ? null : 'ISSUANCE',
            ]);

            return $request->fresh([
                'requester.staffProfile',
                'requester.organization',
                'items.item', 
                'actions',
            ]);
        });
    }

    private function assertEligibleIssuer(StockRequest $request): void
    {
        $profile = auth()->user()->staffProfile;

        $isEligible = $profile
            && $profile->role?->code === 'STORE_KEEPER'
            && $profile->division_id === $request->division_id;

        abort_unless($isEligible, 403, 'You are not eligible to issue this request.');
    }
}