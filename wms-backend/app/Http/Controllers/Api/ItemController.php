<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreItemRequest;
use App\Models\Item;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ItemController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $items = Item::query()
            ->with([
                'division:id,name_en,name_si',
                'category:id,name_en,name_si',
                'unit:id,name_en,name_si,symbol',
                'balance:item_id,quantity_on_hand,reserved_quantity',
            ])
            ->when(
                $user->account_type !== 'admin'
                && !$user->hasRole('COMMISSIONER'),
                function ($query) use ($user) {
                    $query->where(
                        'division_id',
                        $user->staffProfile->division_id
                    );
                }
            )
            ->when($request->filled('search'), function ($query) use ($request) {
                $search = trim($request->string('search'));

                $query->where(function ($subQuery) use ($search) {
                    $subQuery
                        ->where('item_code', 'like', "%{$search}%")
                        ->orWhere('name_en', 'like', "%{$search}%")
                        ->orWhere('name_si', 'like', "%{$search}%")
                        ->orWhereHas('category', function ($categoryQuery) use ($search) {
                            $categoryQuery
                                ->where('name_en', 'like', "%{$search}%")
                                ->orWhere('name_si', 'like', "%{$search}%");
                        });
                });
            })
            ->when(
                $request->filled('category_id'),
                fn ($query) => $query->where(
                    'category_id',
                    $request->integer('category_id')
                )
            )
            ->when(
                $request->filled('division_id'),
                fn ($query) => $query->where(
                    'division_id',
                    $request->integer('division_id')
                )
            )
            ->when(
                $request->has('is_active'),
                fn ($query) => $query->where(
                    'is_active',
                    $request->boolean('is_active')
                )
            )
            ->latest()
            ->paginate($request->integer('per_page', 15));

        return response()->json($items);
    }

    public function store(StoreItemRequest $request): JsonResponse
    {
        $user = $request->user();

        $data = $request->validated();

        if (
            $user->account_type !== 'admin'
            && !$user->hasRole('COMMISSIONER')
        ) {
            $data['division_id'] = $user->staffProfile->division_id;
        }

        $item = DB::transaction(function () use ($data, $user) {
            $item = Item::create([
                ...$data,
                'created_by' => $user->id,
            ]);

            $item->balance()->create([
                'quantity_on_hand' => 0,
                'reserved_quantity' => 0,
            ]);

            return $item;
        });

        $item->load([
            'division',
            'category',
            'unit',
            'balance',
        ]);

        return response()->json([
            'message' => 'Item created successfully.',
            'data' => $item,
        ], 201);
    }

    public function show(Item $item): JsonResponse
    {
        $item->load([
            'division',
            'category',
            'unit',
            'balance',
        ]);

        return response()->json([
            'data' => $item,
        ]);
    }

    public function update(
        StoreItemRequest $request,
        Item $item
    ): JsonResponse {
        $item->update($request->validated());

        $item->load([
            'division',
            'category',
            'unit',
            'balance',
        ]);

        return response()->json([
            'message' => 'Item updated successfully.',
            'data' => $item,
        ]);
    }

    public function toggleStatus(Item $item): JsonResponse
    {
        $item->update([
            'is_active' => !$item->is_active,
        ]);

        return response()->json([
            'message' => $item->is_active
                ? 'Item activated successfully.'
                : 'Item deactivated successfully.',
            'data' => $item,
        ]);
    }
}