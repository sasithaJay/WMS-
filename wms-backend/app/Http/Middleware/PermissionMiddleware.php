<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class PermissionMiddleware
{
    /**
     * Permissions that institution/DS-office accounts are allowed to use,
     * even though they have no staff role to check against. Kept narrow
     * and explicit — these accounts should only touch a small, known slice
     * of the system.
     */
    private const NON_STAFF_ALLOWED_PERMISSIONS = [
        'inventory.view',
        // add others here as institution-facing features are built,
        // e.g. 'requests.create', 'requests.own.view'
    ];

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
            $isAllowed = ! empty(array_intersect(
                $requiredPermissions,
                self::NON_STAFF_ALLOWED_PERMISSIONS
            ));

            if (! $isAllowed) {
                return response()->json([
                    'message' => 'This resource is only available to staff accounts.',
                ], 403);
            }

            return $next($request);
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