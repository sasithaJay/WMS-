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
use App\Models\StockRequestItem;
use App\Models\StockRequest;
use App\Services\Workflow\StockRequestService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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