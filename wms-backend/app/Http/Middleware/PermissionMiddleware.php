<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class PermissionMiddleware
{
    public function handle(
        Request $request,
        Closure $next,
        string ...$requiredPermissions
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

        if ($user->account_type !== 'STAFF') {
            return response()->json([
                'message' => 'This resource is only available to staff accounts.',
            ], 403);
        }

        $role = $user
            ->staffProfile
            ?->role;

        if (! $role) {
            return response()->json([
                'message' => 'No staff role is assigned to this account.',
            ], 403);
        }

        $hasPermission = $role
            ->permissions()
            ->where('is_active', true)
            ->whereIn('code', $requiredPermissions)
            ->exists();

        if (! $hasPermission) {
            return response()->json([
                'message' => 'You do not have permission to access this resource.',
            ], 403);
        }

        return $next($request);
    }
}