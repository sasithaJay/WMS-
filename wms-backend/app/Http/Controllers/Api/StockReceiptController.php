<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CancelStockReceiptRequest;
use App\Http\Requests\StoreStockReceiptRequest;
use App\Http\Requests\UpdateStockReceiptRequest;
use App\Models\StockReceipt;
use App\Services\Inventory\StockReceiptService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StockReceiptController extends Controller
{
    public function __construct(
        protected StockReceiptService $service
    ) {
    }

   public function index(Request $request): JsonResponse
    {
        $user = auth()->user();
        $isCommissioner = $user->staffProfile?->role?->code === 'COMMISSIONER';

        $query = StockReceipt::with(['division', 'creator'])
            ->withCount('items')
            ->latest();

        if (! $isCommissioner) {
            $query->where('division_id', $user->staffProfile?->division_id);
        }

        return response()->json(
            $query->paginate($request->integer('per_page', 15))
        );
    }

    public function store(
        StoreStockReceiptRequest $request
    ): JsonResponse {

        $this->authorize('create', StockReceipt::class);

        $receipt = $this->service->create(
            $request->validated()
        );

        return response()->json([
            'message' => 'Stock receipt created successfully.',
            'data' => $receipt,
        ], 201);
    }

    // protected function authorizeDivision(StockReceipt $receipt): void
    // {
    //     $divisionId = auth()->user()->staffProfile->division_id;

    //     abort_if(
    //         $receipt->division_id !== $divisionId,
    //         403,
    //         'You are not authorized to access this stock receipt.'
    //     );
    // }

    public function show(
        StockReceipt $stockReceipt
    ): JsonResponse {

        $this->authorize('view', $stockReceipt);

        $stockReceipt->load([
            'division',
            'creator',
            'confirmer',
            'items.item',
        ]);

        return response()->json([
            'data' => $stockReceipt,
        ]);
    }

    public function update(
        UpdateStockReceiptRequest $request,
        StockReceipt $stockReceipt
    ): JsonResponse {

        $this->authorize('update', $stockReceipt);

        $receipt = $this->service->update(
            $stockReceipt,
            $request->validated()
        );

        return response()->json([
            'message' => 'Stock receipt updated.',
            'data' => $receipt,
        ]);
    }

    public function confirm(
        StockReceipt $stockReceipt
    ): JsonResponse {

        $this->authorize('confirm', $stockReceipt);

        $receipt = $this->service->confirm(
            $stockReceipt
        );

        return response()->json([
            'message' => 'Receipt confirmed successfully.',
            'data' => $receipt,
        ]);
    }

    public function cancel(
        CancelStockReceiptRequest $request,
        StockReceipt $stockReceipt
    ): JsonResponse {

        $this->authorize('cancel', $stockReceipt);

        $receipt = $this->service->cancel(
            $stockReceipt,
            $request->validated()['reason']
        );

        return response()->json([
            'message' => 'Receipt cancelled.',
            'data' => $receipt,
        ]);
    }
}