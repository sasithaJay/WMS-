<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrganizationController extends Controller
{
    /**
     * List organizations, optionally filtered by kind (INSTITUTION / DS_OFFICE).
     * Non-Commissioner users only see organizations in their own division.
     */
    public function index(Request $request): JsonResponse
    {
        $user = auth()->user();
        $isCommissioner = $user->staffProfile?->role?->code === 'COMMISSIONER';

        $query = Organization::query();

        if ($request->filled('kind')) {
            $query->where('organization_kind', $request->input('kind'));
        }

        if (! $isCommissioner) {
            $query->where('division_id', $user->staffProfile?->division_id);
        }

        return response()->json(['data' => $query->get()]);
    }
}