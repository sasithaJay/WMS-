<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\StaffProfile;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class CommissionerAccountController extends Controller
{
    private function ensureAdmin(Request $request): void
    {
        abort_unless(
            $request->user()?->account_type === 'STAFF'
            && $request->user()?->staffProfile?->role?->code === 'ADMIN',
            403,
            'Only Admin users can manage Commissioner accounts.'
        );
    }

    public function index(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);

        $accounts = User::query()
            ->where('account_type', 'STAFF')
            ->whereHas('staffProfile.role', fn ($query) => $query->where('code', 'COMMISSIONER'))
            ->with('staffProfile.role')
            ->orderBy('id')
            ->get(['id', 'username', 'email', 'account_status', 'created_at']);

        return response()->json(['data' => $accounts]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);

        $data = $request->validate([
            'full_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'nic_number' => ['required', 'string', 'max:255', 'unique:staff_profiles,nic_number'],
            'phone' => ['required', 'string', 'max:30'],
            'employee_number' => ['required', 'string', 'max:255', 'unique:staff_profiles,employee_number'],
            'salary_number' => ['required', 'string', 'max:255', 'unique:staff_profiles,salary_number'],
            'password' => ['required', 'confirmed', 'string', 'min:8'],
        ]);

        $username = 'SWPCS-'.$data['salary_number'];
        if (User::where('username', $username)->exists()) {
            throw ValidationException::withMessages([
                'salary_number' => ['The generated username is already in use.'],
            ]);
        }

        $commissionerRole = Role::where('code', 'COMMISSIONER')->where('is_active', true)->firstOrFail();

        $account = DB::transaction(function () use ($data, $username, $request, $commissionerRole) {
            // A new successor becomes active in the same transaction that disables the prior one.
            User::where('account_type', 'STAFF')
                ->where('account_status', 'ACTIVE')
                ->whereHas('staffProfile', fn ($query) => $query->where('role_id', $commissionerRole->id))
                ->get()->each(function (User $outgoing) use ($request) {
                    $outgoing->update(['account_status' => 'SUSPENDED']);
                    $outgoing->tokens()->delete();
                    DB::table('commissioner_account_events')->insert([
                        'user_id' => $outgoing->id,
                        'actor_id' => $request->user()->id,
                        'event' => 'DEACTIVATED_FOR_SUCCESSOR',
                        'from_status' => 'ACTIVE',
                        'to_status' => 'SUSPENDED',
                        'created_at' => now(), 'updated_at' => now(),
                    ]);
                });

            $user = User::create([
                'username' => $username,
                'email' => $data['email'],
                'password' => $data['password'],
                'account_type' => 'STAFF',
                'account_status' => 'ACTIVE',
                'approved_by' => $request->user()->id,
                'approved_at' => now(),
            ]);

            StaffProfile::create([
                'user_id' => $user->id,
                'division_id' => null,
                'section_id' => null,
                'role_id' => $commissionerRole->id,
                'full_name' => $data['full_name'],
                'nic_number' => $data['nic_number'],
                'phone' => $data['phone'],
                'employee_number' => $data['employee_number'],
                'salary_number' => $data['salary_number'],
            ]);

            DB::table('commissioner_account_events')->insert([
                'user_id' => $user->id,
                'actor_id' => $request->user()->id,
                'event' => 'CREATED',
                'from_status' => null,
                'to_status' => 'ACTIVE',
                'created_at' => now(), 'updated_at' => now(),
            ]);

            return $user;
        });

        return response()->json([
            'message' => 'Commissioner account created successfully.',
            'data' => $account->load('staffProfile.role'),
        ], 201);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $this->ensureAdmin($request);

        abort_unless($user->account_type === 'STAFF'
            && $user->staffProfile?->role?->code === 'COMMISSIONER', 404);

        $data = $request->validate([
            'account_status' => ['required', Rule::in(['ACTIVE', 'SUSPENDED'])],
        ]);

        DB::transaction(function () use ($user, $data, $request) {
            if ($data['account_status'] === 'ACTIVE') {
                $outgoing = User::where('account_type', 'STAFF')
                    ->where('account_status', 'ACTIVE')
                    ->whereHas('staffProfile', fn ($query) => $query->where('role_id', $user->staffProfile->role_id))
                    ->whereKeyNot($user->id)
                    ->get();
                foreach ($outgoing as $previous) {
                    $previous->update(['account_status' => 'SUSPENDED']);
                    $previous->tokens()->delete();
                    DB::table('commissioner_account_events')->insert([
                        'user_id' => $previous->id, 'actor_id' => $request->user()->id,
                        'event' => 'DEACTIVATED_FOR_SUCCESSOR', 'from_status' => 'ACTIVE', 'to_status' => 'SUSPENDED',
                        'created_at' => now(), 'updated_at' => now(),
                    ]);
                }
            }

            $previousStatus = $user->account_status;
            $user->update(['account_status' => $data['account_status']]);
            if ($data['account_status'] === 'SUSPENDED') {
                $user->tokens()->delete();
            }
            if ($previousStatus !== $data['account_status']) {
                DB::table('commissioner_account_events')->insert([
                    'user_id' => $user->id, 'actor_id' => $request->user()->id,
                    'event' => $data['account_status'] === 'ACTIVE' ? 'ACTIVATED' : 'DEACTIVATED',
                    'from_status' => $previousStatus, 'to_status' => $data['account_status'],
                    'created_at' => now(), 'updated_at' => now(),
                ]);
            }
        });

        return response()->json([
            'message' => 'Commissioner account status updated.',
            'data' => $user->fresh(['staffProfile.role']),
        ]);
    }
}
