<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Division;
use App\Models\Item;
use App\Models\StockMovement;
use App\Models\StockRequest;
use App\Models\StockReceipt;
use App\Services\RequestWorkflowService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function overview(Request $request): JsonResponse
    {
        $user = $request->user();
        $isCommissioner = $user->staffProfile?->role?->code === 'COMMISSIONER';

        if ($isCommissioner) {
            $divisionIds = $request->filled('division_id')
                ? collect([$request->integer('division_id')])
                : Division::pluck('id');
        } else {
            $divisionId = $this->resolveUserDivisionId($user);
            abort_unless($divisionId, 403, 'Your account is not assigned to a division.');
            $divisionIds = collect([$divisionId]);
        }

        $divisions = Division::whereIn('id', $divisionIds)->get();
        $data = $divisions->map(fn ($division) => $this->buildDivisionSummary($division));

        return response()->json(['data' => $data]);
    }

    public function myView(Request $request): JsonResponse
    {
        $user = $request->user();
        $roleCode = $user->staffProfile?->role?->code;
        $isCommissioner = $roleCode === 'COMMISSIONER';
        $divisionId = $this->resolveUserDivisionId($user);

        $myRequestsThisMonth = StockRequest::where('requester_id', $user->id)
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->count();

        $myPendingIssuance = StockRequest::where('requester_id', $user->id)
            ->where('current_stage', 'ISSUANCE')
            ->count();

        $myIssuedThisMonth = StockRequest::where('requester_id', $user->id)
            ->where('status', 'ISSUED')
            ->whereMonth('updated_at', now()->month)
            ->whereYear('updated_at', now()->year)
            ->count();

        $relations = ['requester.staffProfile', 'requester.organization', 'items.item'];

        $recommendCount = StockRequest::where('current_stage', 'RECOMMENDATION')
            ->where('recommender_id', $user->id)
            ->count();

        $recommendList = StockRequest::with($relations)
            ->where('current_stage', 'RECOMMENDATION')
            ->where('recommender_id', $user->id)
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn ($r) => $this->toActionItem($r, 'RECOMMENDATION'));

        // Approval queue — Commissioner isn't restricted to one division,
        // everyone else is scoped to their own.
        $approvalQuery = StockRequest::with($relations)
            ->where('current_stage', 'APPROVAL')
            ->latest();

        if (! $isCommissioner) {
            $approvalQuery->where('division_id', $divisionId);
        }

        $approveCount = 0;
        $approveList = collect();

        $workflow = app(RequestWorkflowService::class);
        $roleId = $user->staffProfile?->role_id;

        $approvalCandidates = $approvalQuery->get();

        $eligible = $approvalCandidates->filter(
            fn ($r) => $roleId && $workflow->resolveApprovalRoleIds($r)->contains($roleId)
        )->values();

        $approveCount = $eligible->count();
        $approveList = $eligible->take(5)->map(fn ($r) => $this->toActionItem($r, 'APPROVAL'));

        // Issuance queue — Store Keepers only, unaffected by this fix
        $issueCount = 0;
        $issueList = collect();

        if ($roleCode === 'STORE_KEEPER' && $divisionId) {
            $issueCount = StockRequest::where('current_stage', 'ISSUANCE')
                ->where('division_id', $divisionId)
                ->count();

            $issueList = StockRequest::with($relations)
                ->where('current_stage', 'ISSUANCE')
                ->where('division_id', $divisionId)
                ->latest()
                ->limit(5)
                ->get()
                ->map(fn ($r) => $this->toActionItem($r, 'ISSUANCE'));
        }

        $actionItems = $recommendList->concat($approveList)->concat($issueList)
            ->sortByDesc('submitted_at')
            ->take(5)
            ->values();

        // Recent movements — Commissioner sees both divisions combined,
        // everyone else sees only their own.
        $movementsQuery = StockMovement::with(['item', 'performer'])->latest()->limit(8);

        if (! $isCommissioner) {
            $movementsQuery->where('division_id', $divisionId);
        }

        $recentMovements = $isCommissioner || $divisionId
            ? $movementsQuery->get()
            : collect();

        return response()->json([
            'data' => [
                'my_requests_this_month_count' => $myRequestsThisMonth,
                'my_pending_issuance_count' => $myPendingIssuance,
                'my_issued_this_month_count' => $myIssuedThisMonth,
                'action_required_count' => $recommendCount + $approveCount + $issueCount,
                'action_required_items' => $actionItems,
                'recent_movements' => $recentMovements,
            ],
        ]);
    }

    private function toActionItem(StockRequest $r, string $stage): array
    {
        $items = $r->items ?? collect();
        $codes = $items->take(2)->map(fn ($it) => $it->item->item_code)->implode(', ');
        $extra = $items->count() > 2 ? ' +' . ($items->count() - 2) : '';

        return [
            'id' => $r->id,
            'request_number' => $r->request_number,
            'requester_name' => $r->requester->name ?? $r->requester->username,
            'request_context' => $r->request_context,
            'stage' => $stage,
            'submitted_at' => $r->submitted_at,
            'item_summary' => $codes . $extra,
        ];
    }

    private function buildDivisionSummary(Division $division): array
    {
        $divisionId = $division->id;

        // Single left-joined query gives correct out-of-stock counting even
        // for items that have never received a balance row at all.
        $itemStock = Item::query()
            ->where('items.division_id', $divisionId)
            ->where('items.is_active', true)
            ->leftJoin('inventory_balances', function ($join) use ($divisionId) {
                $join->on('inventory_balances.item_id', '=', 'items.id')
                    ->where('inventory_balances.division_id', '=', $divisionId);
            })
            ->select([
                'items.id',
                'items.item_code',
                'items.name_en',
                'items.reorder_level',
                DB::raw('COALESCE(inventory_balances.quantity_on_hand, 0) as quantity_on_hand'),
            ])
            ->get();

        $totalItems = $itemStock->count();

        $outCount = $itemStock->where('quantity_on_hand', 0)->count();
        $lowCount = $itemStock->filter(
            fn ($i) => $i->quantity_on_hand > 0 && $i->quantity_on_hand <= $i->reorder_level
        )->count();
        $normalCount = max(0, $totalItems - $outCount - $lowCount);

        $lowStockItems = $itemStock
            ->filter(fn ($i) => $i->quantity_on_hand <= $i->reorder_level)
            ->sortBy('quantity_on_hand')
            ->take(10)
            ->values();

        $pendingRecommendation = StockRequest::where('division_id', $divisionId)
            ->where('current_stage', 'RECOMMENDATION')->count();

        $pendingApproval = StockRequest::where('division_id', $divisionId)
            ->where('current_stage', 'APPROVAL')->count();

        $pendingIssuance = StockRequest::where('division_id', $divisionId)
            ->where('current_stage', 'ISSUANCE')->count();

        $issuedThisMonth = StockRequest::where('division_id', $divisionId)
            ->where('status', 'ISSUED')
            ->whereMonth('updated_at', now()->month)
            ->whereYear('updated_at', now()->year)
            ->count();

        $receiptsThisMonth = StockReceipt::where('division_id', $divisionId)
            ->where('status', 'CONFIRMED')
            ->whereMonth('confirmed_at', now()->month)
            ->whereYear('confirmed_at', now()->year)
            ->count();

        $recentMovements = StockMovement::with(['item', 'performer'])
            ->where('division_id', $divisionId)
            ->latest()
            ->limit(8)
            ->get();

        $monthlyChart = $this->buildMonthlyChart($divisionId);

        return [
            'division_id' => $divisionId,
            'division_name_en' => $division->name_en,
            'division_name_si' => $division->name_si,
            'total_items' => $totalItems,
            'low_stock_count' => $lowCount + $outCount,
            'low_stock_items' => $lowStockItems,
            'stock_status' => [
                'out' => $outCount,
                'low' => $lowCount,
                'normal' => $normalCount,
            ],
            'pending_recommendation_count' => $pendingRecommendation,
            'pending_approval_count' => $pendingApproval,
            'pending_issuance_count' => $pendingIssuance,
            'issued_this_month_count' => $issuedThisMonth,
            'receipts_this_month_count' => $receiptsThisMonth,
            'recent_movements' => $recentMovements,
            'monthly_chart' => $monthlyChart,
        ];
    }

    /**
     * Last 6 months of received vs. issued quantity totals, for the bar chart.
     */
    private function buildMonthlyChart(int $divisionId): array
    {
        $start = now()->subMonths(5)->startOfMonth();

        $rows = StockMovement::where('division_id', $divisionId)
            ->where('created_at', '>=', $start)
            ->selectRaw("DATE_FORMAT(created_at, '%Y-%m') as ym, movement_type, SUM(quantity) as total")
            ->groupBy('ym', 'movement_type')
            ->get();

        $incomingTypes = ['RECEIPT', 'RETURN', 'ADJUSTMENT_IN'];
        $outgoingTypes = ['ISSUE', 'ADJUSTMENT_OUT'];

        $months = [];
        for ($i = 5; $i >= 0; $i--) {
            $date = now()->subMonths($i);
            $ym = $date->format('Y-m');

            $received = $rows->where('ym', $ym)->whereIn('movement_type', $incomingTypes)->sum('total');
            $issued = $rows->where('ym', $ym)->whereIn('movement_type', $outgoingTypes)->sum('total');

            $months[] = [
                'month' => $date->format('M'),
                'received' => (float) $received,
                'issued' => (float) $issued,
            ];
        }

        return $months;
    }

    private function resolveUserDivisionId($user): ?int
    {
        if ($user->account_type === 'INSTITUTION' || $user->account_type === 'DS_OFFICE') {
            return $user->organization?->division_id;
        }

        return $user->staffProfile?->division_id;
    }
}