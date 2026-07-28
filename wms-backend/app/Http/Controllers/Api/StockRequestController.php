<?php

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

        $query = StockRequest::with(['requester', 'organization', 'dsOffice', 'items.item'])
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
            ->where('current_stage', 'APPROVAL')
            ->latest();

        if (! $isCommissioner) {
            $query->where('division_id', $user->staffProfile?->division_id);
        }

        // Pull every candidate first — filtering must happen before pagination,
        // since eligibility depends on per-request rule resolution, not a
        // column we can filter with SQL directly.
        $allCandidates = $query->get();

        $eligible = $allCandidates->filter(
            fn (StockRequest $r) => app(\App\Services\RequestWorkflowService::class)
                ->resolveApprovalRoleIds($r)
                ->contains($roleId)
        )->values();

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

    public function pendingIssuance(Request $request): JsonResponse
    {
        $profile = auth()->user()->staffProfile;

        abort_unless(
            $profile?->role?->code === 'STORE_KEEPER',
            403,
            'Only Store Keepers can view the issuance queue.'
        );

        $requests = StockRequest::with([
                'requester.staffProfile',
                'requester.organization',
                'dsOffice',
                'organization',
                'items.item',
            ])
            ->where('current_stage', 'ISSUANCE')
            ->where('division_id', $profile->division_id)
            ->latest()
            ->paginate($request->integer('per_page', 50));

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
}