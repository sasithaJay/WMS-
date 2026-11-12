<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ItemCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Illuminate\Database\QueryException;
use Illuminate\Support\Str;

class ItemCategoryController extends Controller
{
    public function index(): JsonResponse
    {
        $categories = ItemCategory::query()
            ->where('is_active', true)
            ->where(function ($query) {
                $query->whereNull('parent_category_id')
                    ->orWhereHas('parent', fn ($parent) => $parent->where('is_active', true));
            })
            ->with('parent:id,name_en,name_si')
            ->orderBy('name_en')
            ->get();

        return response()->json([
            'data' => $categories,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $name = preg_replace('/\\s+/u', ' ', trim((string) $request->input('name')));
        $normalizedName = mb_strtolower($name ?? '');

        $validator = Validator::make([
            'main_category_id' => $request->input('main_category_id'),
            'name' => $name,
            'description' => $request->input('description'),
        ], [
            'main_category_id' => [
                'required', 'integer',
                Rule::exists('item_categories', 'id')->where('is_active', true)->whereNull('parent_category_id'),
            ],
            'name' => ['required', 'string', 'min:2', 'max:100'],
            'description' => ['nullable', 'string', 'max:500'],
        ]);

        $validator->after(function ($validator) use ($request, $normalizedName) {
            if ($request->filled('main_category_id') && $normalizedName !== '') {
                $duplicate = ItemCategory::query()
                    ->where('parent_category_id', $request->input('main_category_id'))
                    ->where('normalized_name', $normalizedName)
                    ->exists();
                if ($duplicate) {
                    $validator->errors()->add('name', 'A secondary category with this name already exists under the selected main category.');
                }
            }
        });

        $validated = $validator->validate();

        try {
            $category = DB::transaction(fn () => ItemCategory::query()->create([
                'parent_category_id' => $validated['main_category_id'],
                'name_en' => $name,
                'normalized_name' => $normalizedName,
                'description' => isset($validated['description']) && trim($validated['description']) !== ''
                    ? trim($validated['description'])
                    : null,
                'code' => 'SC-' . $validated['main_category_id'] . '-' . Str::upper(Str::random(10)),
                'is_active' => true,
            ]));
        } catch (QueryException $exception) {
            $databaseMessage = strtolower($exception->getMessage());
            $isDuplicateName = str_contains($databaseMessage, 'item_categories_parent_normalized_unique')
                || str_contains($databaseMessage, 'item_categories.parent_category_id, item_categories.normalized_name')
                || (str_contains($databaseMessage, 'duplicate entry') && str_contains($databaseMessage, 'normalized_name'));
            if (! $isDuplicateName) {
                throw $exception;
            }

            return response()->json([
                'message' => 'A secondary category with this name already exists under the selected main category.',
                'errors' => ['name' => ['A secondary category with this name already exists under the selected main category.']],
            ], 422);
        }

        return response()->json([
            'message' => 'Secondary category created successfully.',
            'data' => $category->load('parent:id,name_en,name_si'),
        ], 201);
    }
}
