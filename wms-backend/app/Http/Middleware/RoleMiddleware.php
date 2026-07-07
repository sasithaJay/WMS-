<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    public function handle(
        Request $request,
        Closure $next,
        string ...$allowedRoles
    ): Response {
        $user = $request->user();

        //check if user is authenticated
        if (! $user) {
            return response()->json([
                'message' => 'Unauthenticated.',
            ], 401);
        }

        //check if user account is active
        if ($user->account_status !== 'ACTIVE') {
            return response()->json([
                'message' => 'Your account is not active.',
            ], 403);
        }

        //get user role code
        $roleCode = $user
            ->staffProfile
            ?->role
            ?->code;

        //check if user has a staff role
        if (! $roleCode) {
            return response()->json([
                'message' => 'You do not have a staff role.',
            ], 403);
        }

        //check if user role is in the allowed roles 
        if (! in_array($roleCode, $allowedRoles, true)) {
            return response()->json([
                'message' => 'You are not authorized to access this resource.',
            ], 403);
        }

        return $next($request);
    }
}