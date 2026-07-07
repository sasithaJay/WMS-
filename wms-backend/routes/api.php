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
    });
