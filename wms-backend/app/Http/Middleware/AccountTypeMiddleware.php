<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AccountTypeMiddleware
{
    public function handle(
        Request $request,
        Closure $next,
        string ...$allowedAccountTypes
    ): Response {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'message' => 'Unauthenticated.',
            ], 401);
        }

        if ($user->account_status !== 'ACTIVE') {
            return response()->json([
                'message' => 'Your account is not active.',
            ], 403);
        }

        if (
            ! in_array(
                $user->account_type,
                $allowedAccountTypes,
                true
            )
        ) {
            return response()->json([
                'message' =>
                    'Your account type is not authorized to access this resource.',
            ], 403);
        }

        return $next($request);
    }
}