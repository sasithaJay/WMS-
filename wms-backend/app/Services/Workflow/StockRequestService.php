<?php

// app/Services/Workflow/StockRequestService.php

namespace App\Services\Workflow;

use App\Models\StockRequest;
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

            [$divisionId, $sectionId, $organizationId] =
                $this->resolveRequesterContext($user, $data);

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
                'request_context'  => $data['request_context'],
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
     * Determines division/section/organization for the new request based
     * on who's submitting it and what context they selected.
     */
    private function resolveRequesterContext(User $user, array $data): array
    {
        if ($user->account_type === 'INSTITUTION' || $user->account_type === 'DS_OFFICE') {
            $org = $user->organization;

            if (! $org) {
                abort(422, 'This account has no linked organization record.');
            }

            return [$org->division_id, null, $org->id];
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

        return [$divisionId, $profile->section_id, null];
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
}