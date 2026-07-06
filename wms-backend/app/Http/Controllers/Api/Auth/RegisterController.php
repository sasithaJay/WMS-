<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class RegisterController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
            ],

            'email' => [
                'required',
                'email',
                'max:255',
                'unique:users,email',
            ],

            'phone' => [
                'required',
                'string',
                'max:20',
            ],

            'employee_number' => [
                'required',
                'string',
                'max:50',
                'unique:users,employee_number',
            ],

            'role_id' => [
                'required',
                'integer',
                Rule::exists('roles', 'id')
                    ->where('is_active', true),
            ],

            'division_id' => [
                'required',
                'integer',
                Rule::exists('divisions', 'id')
                    ->where('is_active', true),
            ],

            'password' => [
                'required',
                'confirmed',
                Password::min(8),
            ],
        ]);

        $role = Role::findOrFail($validated['role_id']);

        // Prevent users from registering themselves
        // as privileged system roles.
        if (in_array($role->code, [
            'COMMISSIONER',
            'ADMIN',
        ])) {
            return response()->json([
                'message' => 'Registration is not allowed for this role.',
            ], 422);
        }

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'],
            'employee_number' => $validated['employee_number'],
            'role_id' => $validated['role_id'],
            'division_id' => $validated['division_id'],
            'password' => $validated['password'],
            'account_status' => 'PENDING',
        ]);

        return response()->json([
            'message' => 'Registration successful. Your account is awaiting Commissioner approval.',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'account_status' => $user->account_status,
            ],
        ], 201);
    }
}
