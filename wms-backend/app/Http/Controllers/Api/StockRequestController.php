<?php

// app/Http/Controllers/Api/StockRequestController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreStockRequestRequest;
use App\Http\Requests\StockRequestActionRequest;
use App\Http\Requests\StockRequestReasonRequest;
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

        $query = StockRequest::with(['requester', 'items.item'])
            ->withCount('items')
            ->latest();

        // Own requests, unless the user holds a recommend/approve permission
        // (in which case they may also want to see their queue — handle via
        // separate endpoints below rather than overloading index()).
        $query->where('requester_id', $user->id);

        return response()->json(
            $query->paginate($request->integer('per_page', 15))
        );
    }

    public function pendingRecommendation(): JsonResponse
    {
        $requests = StockRequest::with(['requester', 'items.item'])
            ->where('current_stage', 'RECOMMENDATION')
            ->where('recommender_id', auth()->id())
            ->latest()
            ->paginate(15);

        return response()->json($requests);
    }

    public function pendingApproval(): JsonResponse
    {
        $roleId = auth()->user()->staffProfile?->role_id;
        $isCommissioner = auth()->user()->staffProfile?->role?->code === 'COMMISSIONER';

        $query = StockRequest::with(['requester.staffProfile', 'requester.organization', 'items.item'])
            ->where('current_stage', 'APPROVAL')
            ->latest();

        if (!$isCommissioner) {
            // Non-commissioners can only see requests from their own division.
            $query->where('division_id', auth()->user()->staffProfile?->division_id);
        }

        $requests = $query
            ->paginate(15);

        // Further filtered in-memory by eligibility since it depends on
        // per-request rule resolution, not a simple column match.
        $eligible = $requests->getCollection()->filter(
            fn (StockRequest $r) => app(\App\Services\RequestWorkflowService::class)
                ->resolveApprovalRoleIds($r)
                ->contains($roleId)
        )->values();

        $requests->setCollection($eligible);

        return response()->json($requests);
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
        $updated = $this->service->approve($stockRequest, $request->validated());

        return response()->json([
            'message' => 'Request approved successfully.',
            'data'    => $updated,
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
}