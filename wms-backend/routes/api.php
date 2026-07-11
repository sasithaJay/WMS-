<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\Auth\RegisterController;
use App\Http\Controllers\Api\Auth\LoginController;
use App\Http\Controllers\Api\Auth\RegistrationOptionsController;
use App\Http\Controllers\Api\Admin\AccountApprovalController;
use App\Http\Controllers\Api\ItemController;
use App\Http\Controllers\Api\ItemCategoryController;
use App\Http\Controllers\Api\UnitController;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/

Route::post('/register', [
    RegisterController::class,
    'register',
]);

Route::post('/login', [
    LoginController::class,
    'login',
]);

Route::get('/registration-options', [
    RegistrationOptionsController::class,
    'index',
]);

Route::get('/registration-options/sections', [
    RegistrationOptionsController::class,
    'sections',
]);

/*
|--------------------------------------------------------------------------
| Authenticated Routes
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->group(function () {

    /*
    |--------------------------------------------------------------------------
    | Authenticated User
    |--------------------------------------------------------------------------
    */

    Route::get('/user', function (Request $request) {
        return $request->user()->load([
            'staffProfile.role',
            'staffProfile.division',
            'staffProfile.section',
        ]);
    });

    /*
    |--------------------------------------------------------------------------
    | Account Approval
    |--------------------------------------------------------------------------
    */

    Route::prefix('admin/registrations')
        ->middleware('permission:users.approve')
        ->group(function () {

            Route::get('/pending', [
                AccountApprovalController::class,
                'index',
            ]);

            Route::patch('/{user}/approve', [
                AccountApprovalController::class,
                'approve',
            ]);

            Route::patch('/{user}/reject', [
                AccountApprovalController::class,
                'reject',
            ]);
        });

    /*
    |--------------------------------------------------------------------------
    | Inventory Read Routes
    |--------------------------------------------------------------------------
    |
    | Commissioner:
    | - Can view inventory from both divisions
    |
    | Store Keeper:
    | - Can view inventory from their own division
    |
    | Other roles with inventory.view:
    | - Can view inventory according to their permitted division
    |
    */

    Route::middleware('permission:inventory.view')->group(function () {

        Route::get('/items/summary', [
            ItemController::class,
            'summary',
        ]);

        Route::get('/items', [
            ItemController::class,
            'index',
        ]);

        Route::get('/items/{item}', [
            ItemController::class,
            'show',
        ]);

        Route::get('/item-categories', [
            ItemCategoryController::class,
            'index',
        ]);

        Route::get('/units', [
            UnitController::class,
            'index',
        ]);
    });

    /*
    |--------------------------------------------------------------------------
    | Inventory Management Routes
    |--------------------------------------------------------------------------
    |
    | Only Store Keepers should receive inventory.manage.
    | Commissioner must not receive inventory.manage.
    |
    */

    Route::middleware('permission:inventory.manage')->group(function () {

        Route::post('/items', [
            ItemController::class,
            'store',
        ]);

        Route::put('/items/{item}', [
            ItemController::class,
            'update',
        ]);

        Route::patch('/items/{item}/status', [
            ItemController::class,
            'toggleStatus',
        ]);
    });
});