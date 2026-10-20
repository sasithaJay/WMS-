<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\AdminActivityLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class AccountApprovalController extends Controller
{
    /**
     * Display all pending registrations. AC/AD only see accounts within
     * their own division; Commissioner/Admin see everything.
     */
    public function index(Request $request): JsonResponse
    {
        $actor = $request->user();
        $roleCode = $actor->staffProfile?->role?->code;
        $actorDivisionId = $actor->staffProfile?->division_id;

        $query = User::query()
            ->where('account_status', 'PENDING')
            ->with([
                'staffProfile.role',
                'staffProfile.division',
                'organization.division', // ← was missing, fixes the empty division display
            ]);

        if (in_array($roleCode, ['ASSISTANT_COMMISSIONER', 'ASSISTANT_DIRECTOR'], true)) {
            $query->where(function ($q) use ($actorDivisionId) {
                $q->whereHas('staffProfile', fn ($sq) => $sq->where('division_id', $actorDivisionId))
                    ->orWhereHas('organization', fn ($oq) => $oq->where('division_id', $actorDivisionId));
            });
        }

        $users = $query->latest()->get();

        return response()->json([
            'message' => 'Pending registrations retrieved successfully.',
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
                'message' => 'Only pending accounts can be approved.',
            ], 422);
        }

        $this->assertDivisionAccess($request->user(), $user);

        DB::transaction(function () use (
            $request,
            $user
        ) {
            $user->update([
                'account_status' => 'ACTIVE',
                'approved_by' => $request->user()->id,
                'approved_at' => now(),
                'rejection_reason' => null,
            ]);
        });

        $user->notify(new \App\Notifications\AccountStatusChanged('ACTIVE', null, $request->user()));
        AdminActivityLog::create([
            'actor_id' => $request->user()->id,
            'target_user_id' => $user->id,
            'action' => 'ACCOUNT_APPROVED',
        ]);

        return response()->json([
            'message' => 'Account approved successfully.',
            'user' => [
                'id' => $user->id,
                'username' => $user->username,
                'email' => $user->email,
                'account_type' => $user->account_type,
                'account_status' => $user->account_status,
                'approved_by' => $user->approved_by,
                'approved_at' => $user->approved_at,
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
                'message' => 'Only pending accounts can be rejected.',
            ], 422);
        }

        $this->assertDivisionAccess($request->user(), $user);

        DB::transaction(function () use (
            $validated,
            $user
        ) {
            $user->update([
                'account_status' => 'REJECTED',
                'approved_by' => null,
                'approved_at' => null,
                'rejection_reason' => $validated['rejection_reason'],
            ]);
        });

        $user->notify(new \App\Notifications\AccountStatusChanged('REJECTED', $validated['rejection_reason'], $request->user()));
        AdminActivityLog::create([
            'actor_id' => $request->user()->id,
            'target_user_id' => $user->id,
            'action' => 'ACCOUNT_REJECTED',
        ]);

        return response()->json([
            'message' => 'Account rejected successfully.',
            'user' => [
                'id' => $user->id,
                'username' => $user->username,
                'account_status' => $user->account_status,
                'rejection_reason' => $user->rejection_reason,
            ],
        ]);
    }

    /**
     * AC/AD may only act on accounts within their own division.
     * Commissioner and Admin are unrestricted.
     */
    private function assertDivisionAccess(User $actor, User $target): void
    {
        $roleCode = $actor->staffProfile?->role?->code;

        if (! in_array($roleCode, ['ASSISTANT_COMMISSIONER', 'ASSISTANT_DIRECTOR'], true)) {
            return;
        }

        $actorDivisionId = $actor->staffProfile?->division_id;

        $target->loadMissing(['staffProfile', 'organization']);
        $targetDivisionId = $target->staffProfile?->division_id ?? $target->organization?->division_id;

        abort_unless(
            $targetDivisionId !== null && $targetDivisionId === $actorDivisionId,
            403,
            'You can only manage accounts within your own division.'
        );
    }
}
