<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ItemCategory;
use Illuminate\Http\JsonResponse;

class ItemCategoryController extends Controller
{
    public function index(): JsonResponse
    {
        $categories = ItemCategory::query()
            ->where('is_active', true)
            ->orderBy('name_en')
            ->get();

        return response()->json([
            'data' => $categories,
        ]);
    }
}