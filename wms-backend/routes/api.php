<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\Auth\RegisterController;
use App\Http\Controllers\Api\Auth\LoginController;
use App\Http\Controllers\Api\Admin\AccountApprovalController; 
use App\Http\Controllers\Api\Auth\RegistrationOptionsController;
use App\Http\Controllers\Api\ItemController;
use App\Http\Controllers\Api\ItemCategoryController;
use App\Http\Controllers\Api\UnitController;

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
            ->middleware('permission:users.approve')
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

        // Item Routes
        Route::get('/items', [ItemController::class, 'index']);
        Route::post('/items', [ItemController::class, 'store']);
        Route::get('/items/{item}', [ItemController::class, 'show']);
        Route::put('/items/{item}', [ItemController::class, 'update']);

        Route::patch(
            '/items/{item}/status',
            [ItemController::class, 'toggleStatus']
        );


    });

Route::get('/item-categories', [
    ItemCategoryController::class,
    'index',
]);

Route::get('/units', [
    UnitController::class,
    'index',
]);

Route::get(
    '/registration-options',
    [
        RegistrationOptionsController::class,
        'index',
    ]
);

Route::get(
    '/registration-options/sections',
    [
        RegistrationOptionsController::class,
        'sections',
    ]
);
