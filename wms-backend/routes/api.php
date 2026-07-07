<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\Auth\RegisterController;
use App\Http\Controllers\Api\Auth\LoginController;
use App\Http\Controllers\Api\Admin\AccountApprovalController; 

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::post('/register', [
    RegisterController::class,
    'register',
]);

Route::post('/login', [
    LoginController::class,
    'login',
]);

Route::middleware('auth:sanctum')
    ->group(function () {

        Route::get('/user', function (Request $request) {
            return $request->user();
        });

        // Account Approval Routes
        Route::prefix('admin/registrations')
            ->middleware('approval.manager')
            ->group(function () {

                Route::get(
                    '/pending',
                    [
                        AccountApprovalController::class,
                        'index',
                    ]
                );

                Route::patch(
                    '/{user}/approve',
                    [
                        AccountApprovalController::class,
                        'approve',
                    ]
                );

                Route::patch(
                    '/{user}/reject',
                    [
                        AccountApprovalController::class,
                        'reject',
                    ]
                );
            });

        // Test route for role-based access control
        Route::get(
            '/test/commissioner-only',
            function () {
                return response()->json([
                    'message' =>
                        'You have Commissioner access.',
                ]);
            }
        )->middleware('role:COMMISSIONER');

        // Test route for institution-only access
        Route::get(
            '/test/institution-only',
            function () {
                return response()->json([
                    'message' =>
                        'You have Institution access.',
                ]);
            }
        )->middleware('account.type:INSTITUTION');
    });
