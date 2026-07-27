<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DsOffice;
use Illuminate\Http\JsonResponse;

class DsOfficeController extends Controller
{
    public function index(): JsonResponse
    {
        $offices = DsOffice::where('is_active', true)
            ->orderBy('name_en')
            ->get();

        return response()->json(['data' => $offices]);
    }
}