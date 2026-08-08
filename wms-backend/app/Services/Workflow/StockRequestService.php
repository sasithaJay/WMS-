<?php

// app/Services/Workflow/StockRequestService.php

namespace App\Services\Workflow;

use App\Models\InventoryBalance;
use App\Models\Organization;
use App\Models\StockMovement;
use App\Models\StockRequest;
use App\Models\Store;
use App\Models\User;
use App\Notifications\RequestNeedsAction;
use App\Notifications\RequestStatusChanged;
use App\Services\RequestWorkflowService;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class StockRequestService
{
    public function __construct(
        protected RequestWorkflowService $workflow
    ) {
    }

    public function create(array $data): StockRequest
    {
        return DB::transaction(function () use ($data) {

            $user = auth()->user();
            $requestNumber = $this->generateRequestNumber();
            $requestContext = $this->resolveRequestContext($user, $data);

            [$divisionId, $sectionId, $organizationId, $dsOfficeId] =
                $this->resolveRequesterContext($user, $data);

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
                'request_context'  => $requestContext,
                'notes'            => $data['notes'] ?? null,
            ]);

            foreach ($data['items'] as $item) {
                $request->items()->create([
                    'item_id'             => $item['item_id'],
                    'quantity_requested'  => $item['quantity_requested'],
                    'remarks'             => $item['remarks'] ?? null,
                ]);
            }

            // initiate() handles its own notification (RequestNeedsAction)
            // to the recommender or approver, and its own save().
            $this->workflow->initiate($request);

            return $request->fresh(['requester.staffProfile', 'requester.organization', 'items.item', 'recommender']);
        });
    }

    /**
     * Recommender acts on a request pending recommendation.
     */
    public function recommend(StockRequest $request, array $data): StockRequest
    {
        $updated = DB::transaction(function () use ($request, $data) {

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

            return $request->fresh(['requester.staffProfile', 'requester.organization', 'items.item', 'actions']);
        });

        // Notify requester their request was recommended
        $updated->requester?->notify(new RequestStatusChanged($updated, 'RECOMMENDED', $data['remarks'] ?? null));

        // Notify everyone now eligible to approve
        $this->notifyEligibleApprovers($updated);

        return $updated;
    }

    /**
     * Approver acts on a request pending approval.
     */
    public function approve(StockRequest $request, array $data): StockRequest
    {
        $updated = DB::transaction(function () use ($request, $data) {

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

            return $request->fresh(['requester.staffProfile', 'requester.organization', 'items.item', 'actions']);
        });

        // Notify requester their request was approved
        $updated->requester?->notify(new RequestStatusChanged($updated, 'APPROVED', $data['remarks'] ?? null));

        // Notify Store Keeper(s) in this division that a request is ready to issue
        $this->notifyStoreKeepers($updated);

        return $updated;
    }

    /**
     * Reject a request at whichever stage it's currently in.
     */
    public function reject(StockRequest $request, string $reason): StockRequest
    {
        $updated = DB::transaction(function () use ($request, $reason) {

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

            return $request->fresh(['requester.staffProfile', 'requester.organization', 'actions']);
        });

        $updated->requester?->notify(new RequestStatusChanged($updated, 'REJECTED', $reason));

        return $updated;
    }

    /**
     * Return a request for correction at whichever stage it's currently in.
     */
    public function returnRequest(StockRequest $request, string $reason): StockRequest
    {
        $updated = DB::transaction(function () use ($request, $reason) {

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

            return $request->fresh(['requester.staffProfile', 'requester.organization', 'actions']);
        });

        $updated->requester?->notify(new RequestStatusChanged($updated, 'RETURNED', $reason));

        return $updated;
    }

    /**
     * Store Keeper issues stock against an approved request. Supports partial
     * issuance — back-ordered remainder stays reserved and the request
     * remains in the issuance queue until topped up later.
     */
    public function issue(StockRequest $request, array $data): StockRequest
    {
        $updated = DB::transaction(function () use ($request, $data) {

            $this->assertStage($request, 'ISSUANCE');
            $this->assertEligibleIssuer($request);

            $overridesByItemId = collect($data['items'] ?? [])->keyBy('item_id');
            $allFullyIssued = true;

            foreach ($request->items as $requestItem) {
                $alreadyIssued = (float) ($requestItem->quantity_issued ?? 0);
                $remainingApproved = (float) $requestItem->quantity_approved - $alreadyIssued;

                if ($remainingApproved <= 0) {
                    continue;
                }

                $balance = InventoryBalance::lockForUpdate()->firstOrCreate(
                    ['item_id' => $requestItem->item_id, 'division_id' => $request->division_id],
                    ['quantity_on_hand' => 0, 'reserved_quantity' => 0]
                );

                $override = $overridesByItemId->get($requestItem->item_id);
                $requestedIssueQty = $override['quantity'] ?? $remainingApproved;

                $issueQty = min($requestedIssueQty, $remainingApproved, (float) $balance->quantity_on_hand);

                if ($issueQty <= 0) {
                    $allFullyIssued = false;
                    continue;
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

            return $request->fresh(['requester.staffProfile', 'requester.organization', 'items.item', 'actions']);
        });

        $action = $updated->status === 'ISSUED' ? 'ISSUED' : 'PARTIALLY_ISSUED';
        $updated->requester?->notify(new RequestStatusChanged($updated, $action, $data['remarks'] ?? null));

        return $updated;
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

    private function resolveRequesterContext(User $user, array $data): array
    {
        if (($data['request_context'] ?? null) === 'DS_OFFICE') {
            $profile = $user->staffProfile;

            if (! $profile) {
                abort(403, 'Your account is not assigned to a staff profile.');
            }

            return [$profile->division_id, null, null, $data['ds_office_id']];
        }

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

        $divisionId = $profile->division_id;

        if ($profile->role->code === 'COMMISSIONER' && ! empty($data['division_id'])) {
            $divisionId = $data['division_id'];
        }

        return [$divisionId, $profile->section_id, null, null];
    }

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

    private function assertEligibleIssuer(StockRequest $request): void
    {
        $profile = auth()->user()->staffProfile;

        $isEligible = $profile
            && $profile->role?->code === 'STORE_KEEPER'
            && $profile->division_id === $request->division_id;

        abort_unless($isEligible, 403, 'You are not eligible to issue this request.');
    }

    // ------------------------------------------------------------------
    // Notification helpers
    // ------------------------------------------------------------------

    private function notifyEligibleApprovers(StockRequest $request): void
    {
        $eligibleRoleIds = $this->workflow->resolveApprovalRoleIds($request);

        if ($eligibleRoleIds->isEmpty()) {
            return;
        }

        $approvers = User::whereHas('staffProfile', fn ($q) =>
            $q->whereIn('role_id', $eligibleRoleIds)->where('division_id', $request->division_id)
        )->get();

        foreach ($approvers as $approver) {
            $approver->notify(new RequestNeedsAction($request, 'APPROVAL'));
        }
    }

    private function notifyStoreKeepers(StockRequest $request): void
    {
        $storeKeepers = User::whereHas('staffProfile.role', fn ($q) =>
            $q->where('code', 'STORE_KEEPER')
        )->whereHas('staffProfile', fn ($q) =>
            $q->where('division_id', $request->division_id)
        )->get();

        foreach ($storeKeepers as $storeKeeper) {
            $storeKeeper->notify(new RequestNeedsAction($request, 'ISSUANCE'));
        }
    }
}