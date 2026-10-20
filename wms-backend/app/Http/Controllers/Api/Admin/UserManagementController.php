<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateUserRequest;
use App\Models\Role;
use App\Models\User;
use App\Models\AdminActivityLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserManagementController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $isAdmin = $request->user()?->account_type === 'STAFF'
            && $request->user()?->staffProfile?->role?->code === 'ADMIN';
        $query = User::query()
            ->whereIn('account_status', ['ACTIVE', 'SUSPENDED'])
            ->with([
                'staffProfile.role',
                'staffProfile.division',
                'staffProfile.section',
                'organization.division',
            ]);

        if (! $isAdmin) {
            $query->whereDoesntHave('staffProfile.role', fn ($roles) => $roles->where('code', 'COMMISSIONER'));
        }

        if ($request->filled('type')) {
            match ($request->input('type')) {
                'staff' => $query->where('account_type', 'STAFF'),
                'institution' => $query->where('account_type', 'INSTITUTION'),
                'ds_office' => $query->where('account_type', 'DS_OFFICE'),
                default => null,
            };
        }

        if ($request->filled('search')) {
            $search = $request->input('search');

            $query->where(function ($q) use ($search) {
                $q->where('username', 'like', "%{$search}%")
                    ->orWhereHas('staffProfile', function ($sq) use ($search) {
                        $sq->where('full_name', 'like', "%{$search}%");
                    })
                    ->orWhereHas('organization', function ($oq) use ($search) {
                        $oq->where('name', 'like', "%{$search}%");
                    });
            });
        }

        $users = $query->latest()->paginate($request->integer('per_page', 50));

        return response()->json($users);
    }

    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        $data = $request->validated();
        $isAdmin = $request->user()?->account_type === 'STAFF'
            && $request->user()?->staffProfile?->role?->code === 'ADMIN';

        if ($user->staffProfile?->role?->code === 'COMMISSIONER' && ! $isAdmin) {
            abort(403, 'Only Admin users can manage Commissioner accounts.');
        }

        if (array_key_exists('role_id', $data) && ! $isAdmin) {
            abort(403, 'Only Admin users can change staff roles.');
        }

        if (array_key_exists('email', $data)) {
            $user->update(['email' => $data['email']]);
        }

        if (array_key_exists('account_status', $data)) {
            $previousStatus = $user->account_status;
            $user->update(['account_status' => $data['account_status']]);
            if ($previousStatus !== $user->account_status) {
                AdminActivityLog::create([
                    'actor_id' => $request->user()->id,
                    'target_user_id' => $user->id,
                    'action' => 'ACCOUNT_STATUS_CHANGED',
                    'details' => ['from' => $previousStatus, 'to' => $user->account_status],
                ]);
            }
        }

        if ($user->account_type === 'STAFF' && $user->staffProfile) {
            $previousRoleId = $user->staffProfile->role_id;
            $user->staffProfile->update(array_filter([
                'full_name' => $data['full_name'] ?? null,
                'nic_number' => $data['nic_number'] ?? null,
                 'phone' => array_key_exists('phone', $data) ? $data['phone'] : null,
                'role_id' => $data['role_id'] ?? null,
                'division_id' => $data['division_id'] ?? null,
                'section_id' => array_key_exists('section_id', $data) ? $data['section_id'] : null,
            ], fn ($v) => $v !== null));
            if (array_key_exists('role_id', $data) && $previousRoleId !== $user->staffProfile->role_id) {
                AdminActivityLog::create([
                    'actor_id' => $request->user()->id,
                    'target_user_id' => $user->id,
                    'action' => 'USER_ROLE_CHANGED',
                    'details' => ['from_role_id' => $previousRoleId, 'to_role_id' => $user->staffProfile->role_id],
                ]);
            }
        } elseif (in_array($user->account_type, ['INSTITUTION', 'DS_OFFICE']) && $user->organization) {
            $user->organization->update(array_filter([
                'name' => $data['full_name'] ?? null,
                'contact_number' => array_key_exists('phone', $data) ? $data['phone'] : null,
                'division_id' => $data['division_id'] ?? null,
            ], fn ($v) => $v !== null));
        }

        return response()->json([
            'message' => 'User updated successfully.',
            'data' => $user->fresh(['staffProfile.role', 'staffProfile.division', 'staffProfile.section', 'organization.division']),
        ]);
    }
}
