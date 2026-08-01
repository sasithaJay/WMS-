<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreItemRequest;
use App\Http\Requests\UpdateItemRequest;
use App\Models\Item;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ItemController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Item::query()
            ->with([
                'division:id,name_en,name_si',
                'category:id,name_en,name_si,code',
                'unit:id,name_en,name_si,symbol',
                'balance:item_id,quantity_on_hand,reserved_quantity',
            ]);

        $this->applyDivisionScope($query, $request);

        $query
            ->when($request->filled('search'), function ($query) use ($request) {
                $search = trim($request->string('search')->toString());

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
                $request->has('is_active'),
                fn ($query) => $query->where(
                    'is_active',
                    $request->boolean('is_active')
                )
            );

        $items = $query
            ->orderBy('name_en')
            ->paginate($request->integer('per_page', 15));

        return response()->json($items);
    }

    public function store(StoreItemRequest $request): JsonResponse
    {
        $data = $request->validated();
        $user = $request->user();

        if (!$this->canChooseDivision($user)) {
            $data['division_id'] = $user->staffProfile->division_id;
        }

        $item = DB::transaction(function () use ($data, $user) {
            $item = Item::create([
                ...$data,
                'created_by' => $user->id,
            ]);

            $item->balance()->create([
                'division_id' => $item->division_id,
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

    public function show(
        Request $request,
        Item $item
    ): JsonResponse {
        $this->ensureItemAccess($request, $item);

        return response()->json([
            'data' => $item->load([
                'division',
                'category',
                'unit',
                'balance',
            ]),
        ]);
    }

    public function update(
        UpdateItemRequest $request,
        Item $item
    ): JsonResponse {
        $this->ensureItemAccess($request, $item);

        $item->update($request->validated());

        return response()->json([
            'message' => 'Item updated successfully.',
            'data' => $item->load([
                'division',
                'category',
                'unit',
                'balance',
            ]),
        ]);
    }

    public function toggleStatus(
        Request $request,
        Item $item
    ): JsonResponse {
        $this->ensureItemAccess($request, $item);

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

    public function summary(Request $request): JsonResponse
    {
        $query = Item::query()
            ->where('is_active', true);

        $this->applyDivisionScope($query, $request);

        $items = $query
            ->with('balance:item_id,quantity_on_hand')
            ->get();

        $lowStock = $items->filter(function (Item $item) {
            $quantity = $item->balance?->quantity_on_hand ?? 0;

            return $quantity <= $item->reorder_level;
        })->count();

        return response()->json([
            'data' => [
                'total_items' => $items->count(),
                'low_stock' => $lowStock,
                'normal_stock' => $items->count() - $lowStock,
            ],
        ]);
    }

    private function applyDivisionScope(
        $query,
        Request $request
    ): void {
        $user = $request->user();

        if ($this->canChooseDivision($user)) {
            if ($request->filled('division_id')) {
                $query->where(
                    'division_id',
                    $request->integer('division_id')
                );
            }

            return;
        }

        $query->where(
            'division_id',
            $this->resolveUserDivisionId($user)
        );
    }

    private function ensureItemAccess(
        Request $request,
        Item $item
    ): void {
        $user = $request->user();

        if ($this->canChooseDivision($user)) {
            return;
        }

        abort_unless(
            $item->division_id === $this->resolveUserDivisionId($user),
            403,
            'You cannot access this item.'
        );
    }

    private function canChooseDivision($user): bool
    {
        return $user->account_type === 'admin'
            || $user->staffProfile?->role?->code === 'COMMISSIONER';
    }

    /**
     * Resolves a user's division regardless of account type — staff
     * accounts get it from their staff profile, institution/DS office
     * accounts get it from their linked organization.
     */
    private function resolveUserDivisionId($user): ?int
    {
        if (in_array($user->account_type, ['INSTITUTION', 'DS_OFFICE'], true)) {
            return $user->organization?->division_id;
        }

        return $user->staffProfile?->division_id;
    }
}