<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\Section;
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
            'division_id' => [
                'required',
                'integer',
                Rule::exists('divisions', 'id')
                    ->where('is_active', true),
            ],

            'section_id' => [
                'required',
                'integer',
                Rule::exists('sections', 'id')
                    ->where('is_active', true),
            ],

            'role_id' => [
                'required',
                'integer',
                Rule::exists('roles', 'id')
                    ->where('is_active', true),
            ],

            'name' => [
                'required',
                'string',
                'max:255',
            ],

            'nic_number' => [
                'required',
                'string',
                'max:20',
                'unique:users,nic_number',
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

            'username' => [
                'required',
                'string',
                'min:4',
                'max:50',
                'unique:users,username',
            ],

            'password' => [
                'required',
                'confirmed',
                Password::min(8),
            ],
        ]);

        $role = Role::findOrFail($validated['role_id']);

        if (in_array($role->code, [
            'COMMISSIONER',
            'ADMIN',
        ])) {
            return response()->json([
                'message' => 'Registration is not allowed for this role.',
            ], 422);
        }

        $section = Section::findOrFail($validated['section_id']);

        if ($section->division_id !== (int) $validated['division_id']) {
            return response()->json([
                'message' => 'The selected section does not belong to the selected division.',
            ], 422);
        }

        $user = User::create([
            'division_id' => $validated['division_id'],
            'section_id' => $validated['section_id'],
            'role_id' => $validated['role_id'],
            'name' => $validated['name'],
            'nic_number' => $validated['nic_number'],
            'email' => $validated['email'],
            'phone' => $validated['phone'],
            'employee_number' => $validated['employee_number'],
            'username' => $validated['username'],
            'password' => $validated['password'],
            'account_status' => 'PENDING',
        ]);

        return response()->json([
            'message' => 'Registration successful. Your account is awaiting Commissioner approval.',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'email' => $user->email,
                'account_status' => $user->account_status,
            ],
        ], 201);
    }
}