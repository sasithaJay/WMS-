<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreStockRequestRequest;
use App\Http\Requests\StockRequestActionRequest;
use App\Http\Requests\StockRequestReasonRequest;
use App\Http\Requests\StockRequestItemApproveRequest;
use App\Http\Requests\EquipmentReturnRequest;
use App\Http\Requests\EquipmentConfirmReturnRequest;
use App\Models\EquipmentAssignment;
use App\Models\Store;
use App\Models\StockRequestItem;
use App\Models\StockRequest;
use App\Services\RequestWorkflowService;
use App\Services\Workflow\StockRequestService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StockRequestController extends Controller
{
    public function __construct(
        protected StockRequestService $service
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $user = auth()->user();

        $query = StockRequest::with(['requester', 'organization', 'dsOffice', 'items.item'])
            ->withCount('items')
            ->latest();

        // Own requests, unless the user holds a recommend/approve permission
        // (in which case they may also want to see their queue — handle via
        // separate endpoints below rather than overloading index()).
        $query->where('requester_id', $user->id);

        $context = $request->string('request_context')->toString();
        if (in_array($context, ['PERSONAL', 'SECTION_COMMON', 'DS_OFFICE', 'INSTITUTION'], true)) {
            $query->where('request_context', $context);
        }

        return response()->json(
            $query->paginate($request->integer('per_page', 15))
        );
    }

    public function pendingRecommendation(): JsonResponse
    {
        $requests = StockRequest::with(['requester.staffProfile', 'requester.organization', 'dsOffice', 'items.item'])
            ->where('current_stage', 'RECOMMENDATION')
            ->where('recommender_id', auth()->id())
            ->latest()
            ->paginate(15);

        return response()->json($requests);
    }

    public function pendingApproval(Request $request): JsonResponse
    {
        $user = auth()->user();
        $roleId = $user->staffProfile?->role_id;
        $isCommissioner = $user->staffProfile?->role?->code === 'COMMISSIONER';

        $query = StockRequest::with(['requester.staffProfile', 'requester.organization', 'items.item'])
            ->whereIn('current_stage', ['APPROVAL', 'ISSUANCE'])
            ->latest();

        if (! $isCommissioner) {
            $query->where('division_id', $user->staffProfile?->division_id);
        }

        // Pull every candidate first — filtering must happen before pagination,
        // since eligibility depends on per-request rule resolution, not a
        // column we can filter with SQL directly.
        $allCandidates = $query->get();

        $eligible = $allCandidates->filter(function (StockRequest $r) use ($roleId) {
            $isEligible = app(\App\Services\RequestWorkflowService::class)
                ->resolveApprovalRoleIds($r)
                ->contains($roleId);

            if (! $isEligible) {
                return false;
            }

            $pendingItems = $r->items
                ->where('approval_status', 'pending')
                ->values();

            if ($pendingItems->isEmpty()) {
                return false;
            }

            $r->setRelation('items', $pendingItems);

            return true;
        })->values();

        $perPage = $request->integer('per_page', 15);
        $page = $request->integer('page', 1);

        $paged = $eligible->slice(($page - 1) * $perPage, $perPage)->values();

        $paginator = new \Illuminate\Pagination\LengthAwarePaginator(
            $paged,
            $eligible->count(), // ← now the TRUE eligible total, not the pre-filter count
            $perPage,
            $page,
            ['path' => $request->url(), 'query' => $request->query()]
        );

        return response()->json($paginator);
    }

    public function pendingApprovalItemSummary(Request $request): JsonResponse
    {
        $user = auth()->user();
        $profile = $user->staffProfile;
        abort_unless($profile && $profile->role, 403, 'An authorized staff profile is required.');

        $isCommissioner = $profile->role->code === 'COMMISSIONER';
        $storesQuery = Store::query()->with('division')->where('is_active', true);
        if ($isCommissioner) {
            $storesQuery->whereHas('division', fn ($query) => $query->whereIn('code', ['SOCIAL_SERVICES', 'CHILD_SERVICES']));
        } else {
            $storesQuery->where('division_id', $profile->division_id);
        }

        $stores = $storesQuery->get()->sortBy(fn (Store $store) => match ($store->division?->code) {
            'SOCIAL_SERVICES' => 0,
            'CHILD_SERVICES' => 1,
            default => 2,
        })->values();

        $requestedStoreId = $request->integer('store_id') ?: null;
        $selectedStore = $requestedStoreId
            ? $stores->firstWhere('id', $requestedStoreId)
            : $stores->first();
        if ($requestedStoreId && ! $selectedStore) {
            abort(403, 'You are not authorized to view this store.');
        }

        $storePayload = fn (Store $store) => [
            'id' => $store->id,
            'name_en' => $store->name_en,
            'name_si' => $store->name_si,
            'division_code' => $store->division?->code,
        ];

        $items = [];
        $officers = [];
        $totals = [];

        if ($selectedStore) {
            $workflow = app(RequestWorkflowService::class);
            $eligibleRequestIds = StockRequest::query()
                ->with('requester.staffProfile')
                ->where('store_id', $selectedStore->id)
                ->whereIn('current_stage', ['APPROVAL', 'ISSUANCE'])
                ->whereHas('items', fn ($query) => $query->where('approval_status', 'pending'))
                ->get()
                ->filter(fn (StockRequest $stockRequest) => $stockRequest->requester_id === $user->id
                    || $workflow->resolveApprovalRoleIds($stockRequest)->contains($profile->role_id))
                ->pluck('id');

            if ($eligibleRequestIds->isNotEmpty()) {
                $rows = DB::table('stock_request_items as sri')
                    ->join('stock_requests as sr', 'sr.id', '=', 'sri.stock_request_id')
                    ->join('users as u', 'u.id', '=', 'sr.requester_id')
                    ->join('items as i', 'i.id', '=', 'sri.item_id')
                    ->leftJoin('staff_profiles as sp', 'sp.user_id', '=', 'u.id')
                    ->leftJoin('roles as requester_role', 'requester_role.id', '=', 'sp.role_id')
                    ->leftJoin('organizations as org', 'org.user_id', '=', 'u.id')
                    ->whereIn('sri.stock_request_id', $eligibleRequestIds)
                    ->where('sri.approval_status', 'pending')
                    ->select([
                        'sr.requester_id as officer_id',
                        'sp.full_name as staff_name',
                        'org.name as organization_name',
                        'u.username',
                        'requester_role.name_en as role_label',
                        'i.id as item_id',
                        'i.item_code',
                        'i.name_en as item_name',
                        DB::raw('SUM(sri.quantity_requested) as requested_quantity'),
                    ])
                    ->groupBy('sr.requester_id', 'sp.full_name', 'org.name', 'u.username', 'requester_role.name_en', 'i.id', 'i.item_code', 'i.name_en')
                    ->orderBy('staff_name')
                    ->orderBy('organization_name')
                    ->orderBy('u.username')
                    ->get();

                foreach ($rows as $row) {
                    $itemId = (int) $row->item_id;
                    $quantity = (float) $row->requested_quantity;
                    $items[$itemId] ??= [
                        'id' => $itemId,
                        'item_code' => $row->item_code,
                        'name_en' => $row->item_name,
                        'available_quantity' => 0,
                    ];
                    $officerId = (int) $row->officer_id;
                    $officers[$officerId] ??= [
                        'id' => $officerId,
                        'name' => $row->staff_name ?: ($row->organization_name ?: $row->username),
                        'role_label' => $row->role_label,
                        'quantities' => [],
                    ];
                    $officers[$officerId]['quantities'][$itemId] = $quantity;
                    $totals[$itemId] = ($totals[$itemId] ?? 0) + $quantity;
                }

                $balances = DB::table('inventory_balances')
                    ->where('division_id', $selectedStore->division_id)
                    ->whereIn('item_id', array_keys($items))
                    ->get(['item_id', 'quantity_on_hand', 'reserved_quantity'])
                    ->keyBy('item_id');
                foreach ($items as $itemId => &$itemSummary) {
                    $balance = $balances->get($itemId);
                    $itemSummary['available_quantity'] = $balance
                        ? max(0, (float) $balance->quantity_on_hand - (float) $balance->reserved_quantity)
                        : 0;
                }
                unset($itemSummary);
            }
        }

        return response()->json([
            'data' => [
                'store' => $selectedStore ? $storePayload($selectedStore) : null,
                'stores' => $stores->map($storePayload)->all(),
                'items' => array_values($items),
                'officers' => array_values($officers),
                'totals' => $totals,
            ],
        ]);
    }

    public function store(StoreStockRequestRequest $request): JsonResponse
    {
        $stockRequest = $this->service->create($request->validated());

        return response()->json([
            'message' => 'Request submitted successfully.',
            'data'    => $stockRequest,
        ], 201);
    }

    public function show(StockRequest $stockRequest): JsonResponse
    {
        $stockRequest->load(['items.item', 'requester', 'recommender', 'approver', 'actions.actor']);

        return response()->json(['data' => $stockRequest]);
    }

    public function recommend(StockRequestActionRequest $request, StockRequest $stockRequest): JsonResponse
    {
        $updated = $this->service->recommend($stockRequest, $request->validated());

        return response()->json([
            'message' => 'Request recommended successfully.',
            'data'    => $updated,
        ]);
    }

    public function recommendItem(StockRequestItemApproveRequest $request, StockRequestItem $stockRequestItem): JsonResponse
    {
        $updated = $this->service->recommendItem($stockRequestItem, $request->validated());

        return response()->json([
            'message' => 'Stock request item recommendation saved successfully.',
            'data' => $updated,
        ]);
    }

    public function approve(StockRequestActionRequest $request, StockRequest $stockRequest): JsonResponse
    {
        abort(422, 'Approval must be performed for each stock request item.');
    }

    public function approveItem(StockRequestItemApproveRequest $request, StockRequestItem $stockRequestItem): JsonResponse
    {
        $updated = $this->service->approveItem($stockRequestItem, $request->validated());

        return response()->json([
            'message' => 'Stock request item approved successfully.',
            'data' => $updated,
        ]);
    }

    public function rejectItem(StockRequestReasonRequest $request, StockRequestItem $stockRequestItem): JsonResponse
    {
        $updated = $this->service->rejectItem($stockRequestItem, $request->validated()['reason']);

        return response()->json([
            'message' => 'Stock request item rejected.',
            'data' => $updated,
        ]);
    }

    public function reject(StockRequestReasonRequest $request, StockRequest $stockRequest): JsonResponse
    {
        $updated = $this->service->reject($stockRequest, $request->validated()['reason']);

        return response()->json([
            'message' => 'Request rejected.',
            'data'    => $updated,
        ]);
    }

    public function returnRequest(StockRequestReasonRequest $request, StockRequest $stockRequest): JsonResponse
    {
        $updated = $this->service->returnRequest($stockRequest, $request->validated()['reason']);

        return response()->json([
            'message' => 'Request returned.',
            'data'    => $updated,
        ]);
    }

    public function pendingIssuance(Request $request): JsonResponse
    {
        $profile = auth()->user()->staffProfile;

        abort_unless(
            $profile?->role?->code === 'STORE_KEEPER',
            403,
            'Only Store Keepers can view the issuance queue.'
        );

        $candidates = StockRequest::with([
                'requester.staffProfile',
                'requester.organization',
                'dsOffice',
                'organization',
                'items.item',
            ])
            ->whereIn('current_stage', ['APPROVAL', 'ISSUANCE'])
            ->where('division_id', $profile->division_id)
            ->latest()
            ->get();

        $eligible = $candidates->filter(function (StockRequest $stockRequest) {
            $approvedItems = $stockRequest->items->filter(
                fn ($item) => $item->approval_status === 'approved'
                    && (float) $item->quantity_approved > (float) ($item->quantity_issued ?? 0)
            )->values();

            if ($approvedItems->isEmpty()) {
                return false;
            }

            $stockRequest->setRelation('items', $approvedItems);
            return true;
        })->values();

        $perPage = $request->integer('per_page', 50);
        $page = $request->integer('page', 1);
        $paged = $eligible->slice(($page - 1) * $perPage, $perPage)->values();
        $requests = new \Illuminate\Pagination\LengthAwarePaginator(
            $paged,
            $eligible->count(),
            $perPage,
            $page,
            ['path' => $request->url(), 'query' => $request->query()]
        );

        return response()->json($requests);
    }

    public function issue(StockRequestActionRequest $request, StockRequest $stockRequest): JsonResponse
    {
        $updated = $this->service->issue($stockRequest, $request->validated());

        return response()->json([
            'message' => 'Stock issued successfully.',
            'data'    => $updated,
        ]);
    }

    public function myEquipmentAssignments(): JsonResponse
    {
        StockRequestItem::with(['item.category', 'stockRequest'])
            ->whereHas('stockRequest', fn ($query) => $query->where('requester_id', auth()->id()))
            ->where('quantity_issued', '>', 0)
            ->get()
            ->each(function (StockRequestItem $requestItem) {
                if (! $requestItem->item?->category?->is_returnable) {
                    return;
                }

                $issuedUnits = (int) floor((float) $requestItem->quantity_issued);
                $recordedUnits = EquipmentAssignment::where('stock_request_item_id', $requestItem->id)->count();

                for ($unit = $recordedUnits; $unit < $issuedUnits; $unit++) {
                    EquipmentAssignment::create([
                        'item_id' => $requestItem->item_id,
                        'stock_request_item_id' => $requestItem->id,
                        'assigned_to' => $requestItem->stockRequest->requester_id,
                        'issued_by' => $requestItem->stockRequest->approver_id
                            ?? $requestItem->stockRequest->requester_id,
                        'issued_at' => $requestItem->stockRequest->updated_at ?? now(),
                        'status' => 'ASSIGNED',
                    ]);
                }
            });

        return response()->json([
            'data' => EquipmentAssignment::with(['item.category'])
                ->where('assigned_to', auth()->id())
                ->whereIn('status', ['ASSIGNED', 'RETURN_REQUIRED', 'RETURN_PENDING'])
                ->latest('issued_at')->get(),
        ]);
    }

    public function requestEquipmentReturn(EquipmentReturnRequest $request, EquipmentAssignment $equipmentAssignment): JsonResponse
    {
        abort_unless($equipmentAssignment->assigned_to === auth()->id(), 403);
        abort_if($equipmentAssignment->status === 'RETURNED', 422, 'This equipment has already been returned.');

        $equipmentAssignment->update([
            'status' => 'RETURN_PENDING',
            'return_reason' => $request->validated()['reason'],
            'return_requested_at' => now(),
        ]);

        return response()->json(['data' => $equipmentAssignment->fresh(['item.category'])]);
    }

    public function pendingEquipmentReturns(): JsonResponse
    {
        $profile = auth()->user()->staffProfile;
        abort_unless($profile?->role?->code === 'STORE_KEEPER', 403);

        $assignments = EquipmentAssignment::with(['item.category', 'assignedTo.staffProfile', 'stockRequestItem.stockRequest'])
            ->whereHas('item', fn ($query) => $query->where('division_id', $profile->division_id))
            ->whereIn('status', ['RETURN_REQUIRED', 'RETURN_PENDING'])
            ->latest('return_requested_at')->get();

        return response()->json(['data' => $assignments]);
    }

    public function markOfficerEquipmentReturnRequired(\App\Models\User $user): JsonResponse
    {
        $profile = auth()->user()->staffProfile;
        abort_unless($profile?->role?->code === 'STORE_KEEPER', 403);

        $count = EquipmentAssignment::where('assigned_to', $user->id)
            ->whereHas('item', fn ($query) => $query->where('division_id', $profile->division_id))
            ->where('status', 'ASSIGNED')
            ->update([
                'status' => 'RETURN_REQUIRED',
                'return_reason' => 'Officer transfer or retirement',
                'return_requested_at' => now(),
            ]);

        return response()->json(['message' => 'Officer equipment marked for return.', 'count' => $count]);
    }

    public function confirmEquipmentReturn(EquipmentConfirmReturnRequest $request, EquipmentAssignment $equipmentAssignment): JsonResponse
    {
        $profile = auth()->user()->staffProfile;
        abort_unless($profile?->role?->code === 'STORE_KEEPER', 403);
        abort_unless($equipmentAssignment->item()->where('division_id', $profile->division_id)->exists(), 403);
        abort_if($equipmentAssignment->status === 'RETURNED', 422, 'This equipment has already been returned.');

        $equipmentAssignment->update([
            'status' => 'RETURNED',
            'returned_by' => auth()->id(),
            'returned_at' => now(),
            'return_condition' => $request->validated()['condition'],
            'return_remarks' => $request->validated()['remarks'] ?? null,
        ]);

        return response()->json(['data' => $equipmentAssignment->fresh(['item.category', 'assignedTo'])]);
    }
}
