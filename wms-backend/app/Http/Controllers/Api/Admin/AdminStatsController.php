<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class AdminStatsController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'data' => [
                'total_users' => User::whereIn('account_status', ['ACTIVE', 'SUSPENDED'])->count(),
                'pending_users' => User::where('account_status', 'PENDING')->count(),
                'active_roles' => Role::where('is_active', true)->count(),
                'suspended_users' => User::where('account_status', 'SUSPENDED')->count(),
            ],
        ]);
    }
}