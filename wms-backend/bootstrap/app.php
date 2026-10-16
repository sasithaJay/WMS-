<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Auth\AuthenticationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use App\Http\Middleware\RoleMiddleware;
use App\Http\Middleware\AccountTypeMiddleware;
use App\Http\Middleware\PermissionMiddleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )

    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->append(\Illuminate\Http\Middleware\HandleCors::class);
        $middleware->preventRequestsDuringMaintenance(except: [
            'api/admin/backups/maintenance',
        ]);

        $middleware->alias([
            'role' => RoleMiddleware::class,
            'account.type' => AccountTypeMiddleware::class,
            'permission' => PermissionMiddleware::class,
        ]);

    })

    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (
            AuthenticationException $exception,
            Request $request
        ) {
            if ($request->is('api/*')) {
                return response()->json([
                    'message' => 'Unauthenticated.',
                ], 401);
            }
        });

        $exceptions->render(function (
            HttpExceptionInterface $exception,
            Request $request
        ) {
            if (
                $exception->getStatusCode() === 503
                && app()->isDownForMaintenance()
                && $request->is('api/*')
            ) {
                return response()->json([
                    'message' => 'The system is currently under maintenance. Please try again later.',
                ], 503);
            }
        });
    })

    ->create();
