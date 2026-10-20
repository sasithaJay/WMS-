<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class LoginController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'username' => [
                'required',
                'string',
            ],

            'password' => [
                'required',
                'string',
            ],
        ]);

        $user = User::where(
            'username',
            $validated['username']
        )->first();

        if (
            ! $user ||
            ! Hash::check(
                $validated['password'],
                $user->password
            )
        ) {
            throw ValidationException::withMessages([
                'username' => [
                    'The provided credentials are incorrect.',
                ],
            ]);
        }

        if ($user->account_status === 'PENDING') {
            return response()->json([
                'message' =>
                    'Your account is awaiting approval.',
            ], 403);
        }

        if ($user->account_status === 'REJECTED') {
            return response()->json([
                'message' =>
                    'Your account registration has been rejected.',
                'rejection_reason' =>
                    $user->rejection_reason,
            ], 403);
        }

        if ($user->account_status !== 'ACTIVE') {
            return response()->json([
                'message' =>
                    'Your account is not active.',
            ], 403);
        }

        $user->tokens()->delete();

        $token = $user->createToken(
            'auth-token'
        )->plainTextToken;

        $user->load([
            'staffProfile.role',
            'organization',
        ]);

        return response()->json([
            'message' => 'Login successful.',

            'token' => $token,

            'user' => [
                'id' => $user->id,
                'username' => $user->username,
                'email' => $user->email,
                'account_type' => $user->account_type,
                'account_status' => $user->account_status,
                'role' => $user->staffProfile?->role?->code,
            ],
        ]);
    }

}