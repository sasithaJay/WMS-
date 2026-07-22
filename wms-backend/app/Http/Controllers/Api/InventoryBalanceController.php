<?php

// app/Http/Controllers/Api/InventoryBalanceController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\InventoryBalance;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InventoryBalanceController extends Controller
{
    /**
     * Returns available quantity (on_hand - reserved) for a set of items.
     * Used by recommendation/approval queues to show live stock context.
     */
    public function index(Request $request): JsonResponse
    {
        $itemIds = collect($request->input('item_ids', []))
            ->map(fn ($id) => (int) $id)
            ->filter()
            ->unique()
            ->values();

        $balances = InventoryBalance::whereIn('item_id', $itemIds)->get()
            ->keyBy('item_id');

        $result = $itemIds->mapWithKeys(function ($itemId) use ($balances) {
            $balance = $balances->get($itemId);

            $onHand = $balance ? (float) $balance->quantity_on_hand : 0.0;
            $reserved = $balance ? (float) $balance->reserved_quantity : 0.0;

            return [$itemId => [
                'item_id' => $itemId,
                'quantity_on_hand' => $onHand,
                'reserved_quantity' => $reserved,
                'available' => max(0, $onHand - $reserved),
            ]];
        });

        return response()->json(['data' => $result->values()]);
    }
}