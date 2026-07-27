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
use App\Http\Controllers\Api\ItemUpdateRequestController;
use App\Http\Controllers\Api\StockReceiptController;
use App\Http\Controllers\Api\StockMovementController;
use App\Http\Controllers\Api\StockRequestController;
use App\Http\Controllers\Api\InventoryBalanceController;
use App\Http\Controllers\Api\OrganizationController;
use App\Http\Controllers\Api\DsOfficeController;

//Public Routes

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
    | Item Creation
    |--------------------------------------------------------------------------
    */

    Route::middleware('permission:inventory.create')->group(function () {

        Route::post('/items', [
            ItemController::class,
            'store',
        ]);
    });

    /*
    |--------------------------------------------------------------------------
    | Item Status Management
    |--------------------------------------------------------------------------
    */

    Route::middleware('permission:inventory.status')->group(function () {

        Route::patch('/items/{item}/status', [
            ItemController::class,
            'toggleStatus',
        ]);
    });

    /*
    |--------------------------------------------------------------------------
    | Store Keeper Item Update Requests
    |--------------------------------------------------------------------------
    */

    Route::middleware(
        'permission:inventory.update.request'
    )->group(function () {

        Route::post(
            '/items/{item}/update-requests',
            [
                ItemUpdateRequestController::class,
                'store',
            ]
        );

        Route::get(
            '/my-item-update-requests',
            [
                ItemUpdateRequestController::class,
                'myRequests',
            ]
        );
    });

    /*
    |--------------------------------------------------------------------------
    | AO / Accountant Item Update Approval
    |--------------------------------------------------------------------------
    */

    Route::middleware(
        'permission:inventory.update.approve'
    )->group(function () {

        Route::get(
            '/item-update-requests/pending',
            [
                ItemUpdateRequestController::class,
                'pending',
            ]
        );

        Route::patch(
            '/item-update-requests/{itemUpdateRequest}/approve',
            [
                ItemUpdateRequestController::class,
                'approve',
            ]
        );

        Route::patch(
            '/item-update-requests/{itemUpdateRequest}/reject',
            [
                ItemUpdateRequestController::class,
                'reject',
            ]
        );
    });

    Route::prefix('stock-receipts')->group(function () {

        Route::get('/', [StockReceiptController::class, 'index']);

        Route::post('/', [StockReceiptController::class, 'store']);

        Route::get('/{stockReceipt}', [StockReceiptController::class, 'show']);

        Route::put('/{stockReceipt}', [StockReceiptController::class, 'update']);

        Route::post('/{stockReceipt}/confirm', [
            StockReceiptController::class,
            'confirm',
        ]);

        Route::post('/{stockReceipt}/cancel', [
            StockReceiptController::class,
            'cancel',
        ]);

        
    });
    Route::get(
            '/stock-movements',
            [StockMovementController::class, 'index']
    );

    // routes/api.php addition

    Route::prefix('stock-requests')->group(function () {
        Route::get('/', [
            StockRequestController::class, 'index']
        );

        Route::get('/pending-recommendation', [
            StockRequestController::class, 'pendingRecommendation']
        );

        Route::get('/pending-approval', [
            StockRequestController::class, 'pendingApproval']
        );

        Route::post('/', [
            StockRequestController::class, 'store']
        );

        Route::get('/{stockRequest}', [
            StockRequestController::class, 'show']
        );

        Route::post('/{stockRequest}/recommend', [
            StockRequestController::class, 'recommend']
        );

        Route::post('/{stockRequest}/approve', [
            StockRequestController::class, 'approve']
        );

        Route::post('/{stockRequest}/reject', [
            StockRequestController::class, 'reject']
        );

        Route::post('/{stockRequest}/return', [
            StockRequestController::class, 'returnRequest']
        );
    });

    // routes/api.php
    Route::get('/inventory-balances', [InventoryBalanceController::class, 'index']);

    Route::get('/organizations', [OrganizationController::class, 'index']);
    Route::get('/ds-offices', [DsOfficeController::class, 'index']);

});
