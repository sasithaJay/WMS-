<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateUserRequest;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserManagementController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = User::query()
            ->whereIn('account_status', ['ACTIVE', 'SUSPENDED'])
            ->with([
                'staffProfile.role',
                'staffProfile.division',
                'staffProfile.section',
                'organization.division',
            ]);

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

        if (array_key_exists('email', $data)) {
            $user->update(['email' => $data['email']]);
        }

        if (array_key_exists('account_status', $data)) {
            $user->update(['account_status' => $data['account_status']]);
        }

        if ($user->account_type === 'STAFF' && $user->staffProfile) {
            $user->staffProfile->update(array_filter([
                'full_name' => $data['full_name'] ?? null,
                 'phone' => array_key_exists('phone', $data) ? $data['phone'] : null,
                'role_id' => $data['role_id'] ?? null,
                'division_id' => $data['division_id'] ?? null,
                'section_id' => array_key_exists('section_id', $data) ? $data['section_id'] : null,
            ], fn ($v) => $v !== null));
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