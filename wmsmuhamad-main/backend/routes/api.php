<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\GoodsReceiptController;
use App\Http\Controllers\MaterialRequestController;
use App\Http\Controllers\StockOpnameController;
use App\Http\Controllers\MasterDataController;
use App\Http\Controllers\PurchaseOrderController;
use App\Http\Controllers\PutawayController;
use App\Http\Controllers\GoodsIssueController;
use App\Http\Controllers\ActivityLogController;
use App\Http\Controllers\SuperadminController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

// --- 1. Authentication Routes (Public) ---
Route::prefix('auth')->group(function () {
    Route::post('login', [AuthController::class, 'login']);
    // Route::post('register', [AuthController::class, 'register']);
    Route::post('forgot-password', [AuthController::class, 'requestPasswordReset']);
});

// --- 2. Authenticated Routes (Protected by Sanctum) ---
Route::middleware('auth:sanctum')->group(function () {
    
    // Auth Session Endpoints
    Route::prefix('auth')->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get('profile', [AuthController::class, 'profile']);
        Route::post('change-password', [AuthController::class, 'changePassword']);
        Route::post('reset-password/{id}', [AuthController::class, 'resetPassword'])->middleware('role:Master');
        Route::get('password-reset-requests', [AuthController::class, 'listPasswordResetRequests'])->middleware('role:Master');
    });

    // Dashboard Statistics Endpoint
    Route::get('dashboard/summary', [DashboardController::class, 'summary']);

    // Master Data Endpoints
    Route::prefix('master')->group(function () {
        Route::get('warehouses', [MasterDataController::class, 'warehouses']);
        Route::post('warehouses', [MasterDataController::class, 'storeWarehouse']);
        Route::put('warehouses/{id}', [MasterDataController::class, 'updateWarehouse']);
        Route::delete('warehouses/{id}', [MasterDataController::class, 'destroyWarehouse']);

        Route::get('departments', [MasterDataController::class, 'departments']);
        Route::post('departments', [MasterDataController::class, 'storeDepartment']);
        Route::put('departments/{id}', [MasterDataController::class, 'updateDepartment']);
        Route::delete('departments/{id}', [MasterDataController::class, 'destroyDepartment']);

        Route::get('vendors', [MasterDataController::class, 'vendors']);
        Route::post('vendors', [MasterDataController::class, 'storeVendor']);
        Route::put('vendors/{id}', [MasterDataController::class, 'updateVendor']);
        Route::delete('vendors/{id}', [MasterDataController::class, 'destroyVendor']);

        Route::get('categories', [MasterDataController::class, 'categories']);

        Route::get('products', [MasterDataController::class, 'products']);
        Route::post('products', [MasterDataController::class, 'storeProduct']);
        Route::put('products/{id}', [MasterDataController::class, 'updateProduct']);
        Route::delete('products/{id}', [MasterDataController::class, 'destroyProduct']);
        Route::get('vendor-products', [MasterDataController::class, 'vendorProducts']);

        // User CRUD endpoints gated by Master role only
        Route::get('users', [MasterDataController::class, 'users'])->middleware('role:Master');
        Route::post('users', [MasterDataController::class, 'storeUser'])->middleware('role:Master');
        Route::put('users/{id}', [MasterDataController::class, 'updateUser'])->middleware('role:Master');
        Route::delete('users/{id}', [MasterDataController::class, 'destroyUser'])->middleware('role:Master');

        Route::get('warehouse-signatures', [MasterDataController::class, 'warehouseSignatures']);
        Route::post('warehouse-signatures', [MasterDataController::class, 'saveWarehouseSignatures']);
    });

    // --- Inbound & Quality Control Subsystem ---
    Route::prefix('goods-receipt')->group(function () {
        Route::get('/', [GoodsReceiptController::class, 'index']);
        Route::get('{id}', [GoodsReceiptController::class, 'show']);
        
        // Only Master or PIC can record incoming goods receipt
        Route::post('/', [GoodsReceiptController::class, 'store'])->middleware('role:Master,PIC');

        // Only Master can update/delete goods receipt
        Route::put('{id}', [GoodsReceiptController::class, 'update'])->middleware('role:Master');
        Route::delete('{id}', [GoodsReceiptController::class, 'destroy'])->middleware('role:Master');
        
        // Only Master or QC can record Quality Control findings
        Route::post('{id}/qc', [GoodsReceiptController::class, 'recordQC'])->middleware('role:Master,QC');
        Route::post('item/{itemId}/add-qc-qty', [GoodsReceiptController::class, 'addQcQty'])->middleware('role:Master,QC');
        Route::post('item/{itemId}/edit-qc-proportion', [GoodsReceiptController::class, 'editQcProportion'])->middleware('role:Master,QC');
    });
    
    // Returns List Endpoint
    Route::get('returns', [GoodsReceiptController::class, 'returnsList']);

    // --- Outbound & Material Requests Subsystem ---
    Route::prefix('material-request')->group(function () {
        Route::get('/', [MaterialRequestController::class, 'index']);
        Route::get('{id}', [MaterialRequestController::class, 'show']);
        
        // Only Master or PIC can submit department stock requests
        Route::post('/', [MaterialRequestController::class, 'store'])->middleware('role:Master,PIC');
        
        // Only Master or PIC can approve/reject request and mutates stock
        Route::post('{id}/approve', [MaterialRequestController::class, 'approve'])->middleware('role:Master,PIC');
        Route::post('{id}/reject', [MaterialRequestController::class, 'reject'])->middleware('role:Master,PIC');
    });

    // --- Inventory Audit / Stock Opname Subsystem ---
    Route::prefix('stock-opname')->group(function () {
        Route::get('/', [StockOpnameController::class, 'index']);
        Route::get('{id}', [StockOpnameController::class, 'show']);
        
        // Only Master or PIC can initiate count session and save counts
        Route::post('start', [StockOpnameController::class, 'start'])->middleware('role:Master,PIC');
        Route::post('{id}/count', [StockOpnameController::class, 'saveCounts'])->middleware('role:Master,PIC');
        
        // Only Master can reconcile and sign off discrepancies, mutating stock
        Route::post('{id}/approve', [StockOpnameController::class, 'approve'])->middleware('role:Master');
        Route::post('{id}/reject', [StockOpnameController::class, 'reject'])->middleware('role:Master');
    });

    // --- Purchase Orders ---
    Route::prefix('purchase-orders')->group(function () {
        Route::get('/', [PurchaseOrderController::class, 'index']);
        Route::get('{id}', [PurchaseOrderController::class, 'show']);
        Route::post('/', [PurchaseOrderController::class, 'store'])->middleware('role:Master');
        Route::post('{id}/receive', [PurchaseOrderController::class, 'receive'])->middleware('role:Master,PIC');
    });

    // --- Putaway Placements ---
    Route::prefix('putaway')->group(function () {
        Route::get('/', [PutawayController::class, 'index']);
        Route::post('/', [PutawayController::class, 'store'])->middleware('role:Master,PIC');
        Route::put('/{id}', [PutawayController::class, 'update'])->middleware('role:Master,PIC');
    });

    // --- Goods Issues ---
    Route::prefix('goods-issue')->group(function () {
        Route::get('/', [GoodsIssueController::class, 'index']);
        Route::post('/', [GoodsIssueController::class, 'store'])->middleware('role:Master,PIC');
    });

    // --- Activity Logs & Reports ---
    Route::prefix('reports')->group(function () {
        Route::get('activity-logs', [ActivityLogController::class, 'index'])->middleware('role:Master');
        Route::get('stock-movements', [ActivityLogController::class, 'stockMovements']);
    });

    // --- 10. Superadmin Subsystem (Only Super Admin) ---
    Route::prefix('superadmin')->middleware('role:Super Admin')->group(function () {
        Route::get('dashboard-summary', [SuperadminController::class, 'dashboardSummary']);
        Route::get('warehouses', [SuperadminController::class, 'warehouses']);
        Route::post('warehouses', [SuperadminController::class, 'createWarehouse']);
        Route::put('warehouses/{id}', [SuperadminController::class, 'updateWarehouse']);
        Route::delete('warehouses/{id}', [SuperadminController::class, 'deleteWarehouse']);
        
        Route::get('users', [SuperadminController::class, 'users']);
        Route::post('users', [SuperadminController::class, 'createUser']);
        Route::put('users/{id}', [SuperadminController::class, 'updateUser']);
        Route::delete('users/{id}', [SuperadminController::class, 'deleteUser']);
        Route::post('users/{id}/activate', [SuperadminController::class, 'activateUser']);
        Route::post('users/{id}/deactivate', [SuperadminController::class, 'deactivateUser']);
        Route::post('users/{id}/reject', [SuperadminController::class, 'rejectUser']);
        
        Route::get('goods-receipts', [SuperadminController::class, 'goodsReceipts']);
        Route::put('goods-receipts/{id}', [SuperadminController::class, 'updateGoodsReceipt']);

        // Product Catalog CRUD
        Route::get('products', [SuperadminController::class, 'products']);
        Route::post('products', [SuperadminController::class, 'storeProduct']);
        Route::put('products/{id}', [SuperadminController::class, 'updateProduct']);
        Route::delete('products/{id}', [SuperadminController::class, 'destroyProduct']);

        // Product Categories CRUD
        Route::get('categories', [SuperadminController::class, 'categories']);
        Route::post('categories', [SuperadminController::class, 'storeCategory']);
        Route::put('categories/{id}', [SuperadminController::class, 'updateCategory']);
        Route::delete('categories/{id}', [SuperadminController::class, 'destroyCategory']);

        // Vendors CRUD
        Route::get('vendors', [SuperadminController::class, 'vendors']);
        Route::post('vendors', [SuperadminController::class, 'storeVendor']);
        Route::put('vendors/{id}', [SuperadminController::class, 'updateVendor']);
        Route::delete('vendors/{id}', [SuperadminController::class, 'destroyVendor']);

        // Departments CRUD
        Route::get('departments', [SuperadminController::class, 'departments']);
        Route::post('departments', [SuperadminController::class, 'storeDepartment']);
        Route::put('departments/{id}', [SuperadminController::class, 'updateDepartment']);
        Route::delete('departments/{id}', [SuperadminController::class, 'destroyDepartment']);

        // Audit Logs
        Route::get('audit-logs', [SuperadminController::class, 'auditLogs']);
    });

    // Master list roles
    Route::get('master/roles', [SuperadminController::class, 'roles']);
});
