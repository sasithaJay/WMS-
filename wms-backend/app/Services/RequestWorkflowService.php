<?php

// app/Services/RequestWorkflowService.php

namespace App\Services;

use App\Models\ApprovalRule;
use App\Models\RecommendationRule;
use App\Models\Role;
use App\Models\StaffProfile;
use App\Models\StockRequest;
use App\Models\User;
use Illuminate\Support\Collection;

class RequestWorkflowService
{
    /**
     * Called right after a StockRequest row + its items are created.
     * Determines whether it needs recommendation first, or goes
     * straight to approval, and resolves the actual recommender.
     */
    public function initiate(StockRequest $request): void
    {
        $rule = $this->findRecommendationRule($request);

        if ($rule && $rule->recommender_role_id) {
            $request->current_stage = 'RECOMMENDATION';
            $request->status = 'PENDING_RECOMMENDATION';
            $request->recommender_id = $this->resolveRecommenderUser($rule, $request)?->id;
        } else {
            $request->current_stage = 'APPROVAL';
            $request->status = 'PENDING_APPROVAL';
        }

        $request->submitted_at = now();
        $request->save();
    }

    /**
     * Finds the single applicable recommendation rule.
     * Prefers an exact requester_role_id match over a wildcard (null) row,
     * then highest priority.
     */
    protected function findRecommendationRule(StockRequest $request): ?RecommendationRule
    {
        if ($request->organization_id) {
            $orgKind = $request->organization->organization_kind;

            return RecommendationRule::where('organization_kind', $orgKind)
                ->orderByDesc('priority')
                ->first();
        }

        $roleId = $request->requester->staffProfile?->role_id;

        return RecommendationRule::whereNull('organization_kind')
            ->where('request_context', $request->request_context)
            ->where(function ($q) use ($roleId) {
                $q->where('requester_role_id', $roleId)
                    ->orWhereNull('requester_role_id');
            })
            // exact role match (0) sorts before wildcard (1)
            ->orderByRaw('requester_role_id IS NULL')
            ->orderByDesc('priority')
            ->first();
    }

    /**
     * Resolves the specific person who should recommend this request,
     * given the rule's recommender_role_id. This is identity resolution
     * (who holds this role in this section/division), not policy —
     * policy lives in the rule table, this just finds the person.
     */
    protected function resolveRecommenderUser(RecommendationRule $rule, StockRequest $request): ?User
    {
        $recommenderRole = Role::find($rule->recommender_role_id);

        $query = StaffProfile::where('role_id', $rule->recommender_role_id);

        if ($recommenderRole->code === 'SECTION_HEAD') {
            // CC/FA — tied to the requester's specific section
            $query->where('section_id', $request->section_id);
        } else {
            // e.g. ADMINISTRATIVE_OFFICER — tied to the division
            $query->where('division_id', $request->division_id);
        }

        return $query->first()?->user;
    }

    /**
     * Returns the set of roles allowed to approve this request right now.
     * Multiple rows at the same (highest) priority = "any one of these".
     */
    public function resolveApprovalRoleIds(StockRequest $request): Collection
    {
        $orgKind = $request->organization?->organization_kind;

        if ($orgKind) {
            return ApprovalRule::where('organization_kind', $orgKind)
                ->where('division_id', $request->division_id)
                ->orderByDesc('priority')
                ->get()
                ->groupBy('priority')
                ->sortKeysDesc()
                ->first()
                ?->pluck('approver_role_id')
                ?->filter()
                ?->values() ?? collect();
        }

        $roleId = $request->requester->staffProfile?->role_id;

        $exact = ApprovalRule::whereNull('organization_kind')
            ->where('request_context', $request->request_context)
            ->where('requester_role_id', $roleId)
            ->orderByDesc('priority')
            ->get();

        $rows = $exact->isNotEmpty()
            ? $exact
            : ApprovalRule::whereNull('organization_kind')
                ->where('request_context', $request->request_context)
                ->whereNull('requester_role_id')
                ->orderByDesc('priority')
                ->get();

        if ($rows->isEmpty()) {
            return collect();
        }

        $topPriority = $rows->max('priority');

        return $rows->where('priority', $topPriority)
            ->pluck('approver_role_id')
            ->filter() // drop nulls (auto-approve rows)
            ->values();
    }

    /**
     * True if this request's approval step is auto-skipped
     * (e.g. Commissioner's own personal request).
     */
    public function isAutoApproved(StockRequest $request): bool
    {
        $roleId = $request->requester->staffProfile?->role_id;

        $rule = ApprovalRule::whereNull('organization_kind')
            ->where('request_context', $request->request_context)
            ->where('requester_role_id', $roleId)
            ->orderByDesc('priority')
            ->first();

        return $rule !== null && $rule->approver_role_id === null;
    }
}