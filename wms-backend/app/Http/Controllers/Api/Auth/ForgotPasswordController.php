<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Notifications\TemporaryPasswordIssued;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class ForgotPasswordController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'username' => ['required', 'string', 'max:255'],
        ]);

        $user = User::query()
            ->with(['staffProfile', 'organization'])
            ->where('username', $validated['username'])
            ->first();

        // Use the same response for every valid request so this endpoint does
        // not disclose whether a username is registered.
        $message = 'If the username is registered and has a phone number, a temporary password has been sent by SMS.';

        if (! $user || ! $this->hasPhoneNumber($user)) {
            return response()->json(['message' => $message]);
        }

        $temporaryPassword = Str::password(12, true, true, false, false);

        $user->forceFill([
            'password' => Hash::make($temporaryPassword),
        ])->save();

        $user->notify(new TemporaryPasswordIssued($temporaryPassword));

        return response()->json(['message' => $message]);
    }

    private function hasPhoneNumber(User $user): bool
    {
        return filled(
            $user->staffProfile?->phone
                ?? $user->organization?->contact_number,
        );
    }
}
