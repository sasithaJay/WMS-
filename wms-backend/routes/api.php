<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\Auth\RegisterController;
use App\Http\Controllers\Api\Auth\LoginController;
use App\Http\Controllers\Api\Auth\ForgotPasswordController;
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
use App\Http\Controllers\Api\PasswordController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\Admin\UserManagementController;
use App\Http\Controllers\Api\Admin\AdminStatsController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\ItemLabelController;
use App\Http\Controllers\Api\VatRateController;
use App\Http\Controllers\Api\Admin\BackupController;

//Public Routes

Route::post('/register', [
    RegisterController::class,
    'register',
]);

Route::post('/login', [
    LoginController::class,
    'login',
]);

Route::post('/forgot-password', [
    ForgotPasswordController::class,
    'store',
])->middleware('throttle:5,10');

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
            'organization.division',
        ]);
    });

    Route::middleware('permission:users.manage')->group(function () {
        Route::get('/admin/stats', [AdminStatsController::class, 'index']);
        Route::get('/admin/users', [UserManagementController::class, 'index']);
        Route::patch('/admin/users/{user}', [UserManagementController::class, 'update']);
    });

    Route::put('/user/password', [PasswordController::class, 'update']);

    // routes/api.php — inside auth:sanctum group
    Route::get('/dashboard/overview', [DashboardController::class, 'overview']);
    Route::get('/dashboard/my-view', [DashboardController::class, 'myView']);

    //Notifications Routes
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::patch('/notifications/{id}/read', [NotificationController::class, 'markRead']);
    Route::patch('/notifications/read-all', [NotificationController::class, 'markAllRead']);

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

        Route::get('/items/lookup', [
            ItemController::class, 
            'lookup'
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

        Route::get('/items/{item}/qr-code', [ItemLabelController::class, 'qrCode']);

        Route::get('/items/{item}/barcode', [ItemLabelController::class, 'barcode']);
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

    // vatRates routes — store keepers can propose new VAT rates, but only commissioners can approve/reject them.

    Route::middleware('permission:stock.receive')->group(function () {
        Route::get('/vat-rates/current', [VatRateController::class, 'current']);
        Route::get('/vat-rates/my-requests', [VatRateController::class, 'myRequests']);
        Route::post('/vat-rates', [VatRateController::class, 'store']);
    });

    Route::get('/vat-rates/pending', [VatRateController::class, 'pending']);
    Route::patch('/vat-rates/{vatRate}/approve', [VatRateController::class, 'approve']);
    Route::patch('/vat-rates/{vatRate}/reject', [VatRateController::class, 'reject']);

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

        Route::get('/pending-issuance', [
            StockRequestController::class, 'pendingIssuance']
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

        Route::post('/{stockRequest}/issue', [
            StockRequestController::class, 'issue']
        );
    });

    Route::post('/stock-request-items/{stockRequestItem}/approve', [
        StockRequestController::class, 'approveItem'
    ]);
    Route::post('/stock-request-items/{stockRequestItem}/reject', [
        StockRequestController::class, 'rejectItem'
    ]);
    Route::get('/equipment-assignments/mine', [StockRequestController::class, 'myEquipmentAssignments']);
    Route::post('/equipment-assignments/{equipmentAssignment}/return-request', [StockRequestController::class, 'requestEquipmentReturn']);
    Route::get('/equipment-assignments/pending-returns', [StockRequestController::class, 'pendingEquipmentReturns']);
    Route::post('/equipment-assignments/users/{user}/mark-return-required', [StockRequestController::class, 'markOfficerEquipmentReturnRequired']);
    Route::post('/equipment-assignments/{equipmentAssignment}/confirm-return', [StockRequestController::class, 'confirmEquipmentReturn']);

    // routes/api.php
    Route::get('/inventory-balances', [InventoryBalanceController::class, 'index']);

    Route::get('/organizations', [OrganizationController::class, 'index']);
    Route::get('/ds-offices', [DsOfficeController::class, 'index']);

    //Reports Routes

    Route::middleware('permission:reports.view')->prefix('reports')->group(function () {
        Route::get('/stock', [ReportController::class, 'stock']);
        Route::get('/stock/pdf', [ReportController::class, 'stockPdf']);

        Route::get('/issue', [ReportController::class, 'issue']);
        Route::get('/issue/pdf', [ReportController::class, 'issuePdf']);

        Route::get('/receipt', [ReportController::class, 'receipt']);
        Route::get('/receipt/pdf', [ReportController::class, 'receiptPdf']);

        Route::get('/monthly', [ReportController::class, 'monthly']);
        Route::get('/monthly/pdf', [ReportController::class, 'monthlyPdf']);

        Route::get('/annual', [ReportController::class, 'annual']);
        Route::get('/annual/pdf', [ReportController::class, 'annualPdf']);

        Route::get('/officer-requests', [ReportController::class, 'officerRequests']);
        Route::get('/officer-requests/pdf', [ReportController::class, 'officerRequestsPdf']);
    });

    Route::middleware('permission:system.backup')->prefix('admin/backups')->group(function () {
        Route::get('/', [BackupController::class, 'index']);
        Route::post('/database', [BackupController::class, 'backupDatabase']);
        Route::post('/uploads', [BackupController::class, 'backupUploads']);
        Route::get('/{backup}/download', [BackupController::class, 'download']);
        Route::delete('/{backup}', [BackupController::class, 'destroy']);
        Route::post('/{backup}/restore', [BackupController::class, 'restore']);
        Route::get('/maintenance', [BackupController::class, 'maintenanceStatus']);
        Route::patch('/maintenance', [BackupController::class, 'toggleMaintenance']);
    });


});
