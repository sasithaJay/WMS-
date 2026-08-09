<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Notifications\AccountStatusChanged;

class AccountApprovalController extends Controller
{
    /**
     * Display all pending registrations.
     */
    public function index(): JsonResponse
    {
        $users = User::query()
            ->where('account_status', 'PENDING')
            ->with([
                'staffProfile.role',
                'staffProfile.division',
                'organization',
            ])
            ->latest()
            ->get();

        return response()->json([
            'message' =>
                'Pending registrations retrieved successfully.',

            'count' => $users->count(),

            'registrations' => $users,
        ]);
    }

    /**
     * Approve a pending registration.
     */
    public function approve(
        Request $request,
        User $user
    ): JsonResponse {
        if ($user->account_status !== 'PENDING') {
            return response()->json([
                'message' =>
                    'Only pending accounts can be approved.',
            ], 422);
        }

        DB::transaction(function () use (
            $request,
            $user
        ) {
            $user->update([
                'account_status' => 'ACTIVE',

                'approved_by' =>
                    $request->user()->id,

                'approved_at' =>
                    now(),

                'rejection_reason' =>
                    null,
            ]);
        });

        $user->notify(new AccountStatusChanged('ACTIVE', null, $request->user()));

        return response()->json([
            'message' =>
                'Account approved successfully.',

            'user' => [
                'id' =>
                    $user->id,

                'username' =>
                    $user->username,

                'email' =>
                    $user->email,

                'account_type' =>
                    $user->account_type,

                'account_status' =>
                    $user->account_status,

                'approved_by' =>
                    $user->approved_by,

                'approved_at' =>
                    $user->approved_at,
            ],
        ]);
    }

    /**
     * Reject a pending registration.
     */
    public function reject(
        Request $request,
        User $user
    ): JsonResponse {
        $validated = $request->validate([
            'rejection_reason' => [
                'required',
                'string',
                'min:5',
                'max:1000',
            ],
        ]);

        if ($user->account_status !== 'PENDING') {
            return response()->json([
                'message' =>
                    'Only pending accounts can be rejected.',
            ], 422);
        }

        DB::transaction(function () use (
            $validated,
            $user
        ) {
            $user->update([
                'account_status' =>
                    'REJECTED',

                'approved_by' =>
                    null,

                'approved_at' =>
                    null,

                'rejection_reason' =>
                    $validated['rejection_reason'],
            ]);
        });

        $user->notify(new AccountStatusChanged('REJECTED', $validated['rejection_reason'], $request->user()));

        return response()->json([
            'message' =>
                'Account rejected successfully.',

            'user' => [
                'id' =>
                    $user->id,

                'username' =>
                    $user->username,

                'account_status' =>
                    $user->account_status,

                'rejection_reason' =>
                    $user->rejection_reason,
            ],
        ]);
    }
}