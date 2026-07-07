<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureApprovalManager
{
    public function handle(
        Request $request,
        Closure $next
    ): Response {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'message' => 'Unauthenticated.',
            ], 401);
        }

        if ($user->account_status !== 'ACTIVE') {
            return response()->json([
                'message' =>
                    'Your account is not active.',
            ], 403);
        }

        $roleCode = $user
            ->staffProfile
            ?->role
            ?->code;

        $allowedRoles = [
            'COMMISSIONER',
            'ADMIN',
        ];

        if (
            ! in_array(
                $roleCode,
                $allowedRoles,
                true
            )
        ) {
            return response()->json([
                'message' =>
                    'You are not authorized to manage account approvals.',
            ], 403);
        }

        return $next($request);
    }
}