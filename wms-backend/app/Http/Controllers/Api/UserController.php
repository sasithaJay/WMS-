<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\RejectUserRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function pendingVerification(Request $request): JsonResponse
    {
        $users = User::with(['staffProfile.role', 'staffProfile.division'])
            ->where('account_type', 'STAFF')
            ->where('account_status', 'PENDING')
            ->latest()
            ->paginate($request->integer('per_page', 20));

        return response()->json($users);
    }

    public function activate(User $user): JsonResponse
    {
        abort_if($user->account_status !== 'PENDING', 422, 'Only pending accounts can be activated.');

        $user->update([
            'account_status' => 'ACTIVE',
            'approved_by' => auth()->id(),
            'approved_at' => now(),
            'rejection_reason' => null,
        ]);

        return response()->json([
            'message' => 'User account activated.',
            'data' => $user->fresh(['staffProfile.role', 'staffProfile.division']),
        ]);
    }

    public function reject(RejectUserRequest $request, User $user): JsonResponse
    {
        abort_if($user->account_status !== 'PENDING', 422, 'Only pending accounts can be rejected.');

        $user->update([
            'account_status' => 'REJECTED',
            'approved_by' => auth()->id(),
            'approved_at' => now(),
            'rejection_reason' => $request->validated()['reason'],
        ]);

        return response()->json([
            'message' => 'User account rejected.',
            'data' => $user->fresh(['staffProfile.role', 'staffProfile.division']),
        ]);
    }
}