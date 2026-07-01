<?php

use App\Http\Controllers\Api\Admin\InvoiceController as AdminInvoiceController;
use App\Http\Controllers\Api\Admin\ReferenceDataController;
use App\Http\Controllers\Api\Admin\WorkerAdminController;
use App\Http\Controllers\Api\Admin\WorkerDocumentController;
use App\Http\Controllers\Api\Agency\InvoiceController as AgencyInvoiceController;
use App\Http\Controllers\Api\AgencyController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\FavoriteController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\ReservationController;
use App\Http\Controllers\Api\WorkerController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::post('/auth/register', [AuthController::class, 'registerCustomer']);
    Route::post('/auth/register-agency', [AuthController::class, 'registerAgency']);
    Route::post('/auth/login', [AuthController::class, 'login']);

    Route::get('/workers', [WorkerController::class, 'index']);
    Route::get('/workers/track', [WorkerController::class, 'track']);
    Route::get('/workers/{worker}', [WorkerController::class, 'show']);

    Route::get('/agencies', [AgencyController::class, 'index']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/auth/me', [AuthController::class, 'me']);

        Route::get('/reservations/{reservation}', [ReservationController::class, 'show']);
        Route::post('/reservations/{reservation}/cancel', [ReservationController::class, 'cancel']);

        Route::get('/notifications', [NotificationController::class, 'index']);
        Route::post('/notifications/{notification}/read', [NotificationController::class, 'markAsRead']);

        Route::middleware('role:customer')->group(function () {
            Route::post('/reservations/customer', [ReservationController::class, 'storeAsCustomer']);

            Route::get('/favorites', [FavoriteController::class, 'index']);
            Route::post('/favorites/{worker}', [FavoriteController::class, 'store']);
            Route::delete('/favorites/{worker}', [FavoriteController::class, 'destroy']);
        });

        Route::middleware('role:agency')->group(function () {
            Route::post('/reservations/agency', [ReservationController::class, 'storeAsAgency']);
            Route::post('/reservations/{reservation}/convert-to-agency', [ReservationController::class, 'convertToAgency']);

            Route::get('/agency/invoices', [AgencyInvoiceController::class, 'index']);
            Route::get('/agency/invoices/{invoice}', [AgencyInvoiceController::class, 'show']);
        });

        Route::get('/worker-documents/{workerDocument}/download', [WorkerDocumentController::class, 'download'])
            ->name('worker-documents.download');

        Route::middleware('role:employee,super_admin')->prefix('admin')->group(function () {
            Route::get('/workers', [WorkerAdminController::class, 'index']);
            Route::post('/workers', [WorkerAdminController::class, 'store']);
            Route::get('/workers/{worker}', [WorkerAdminController::class, 'show']);
            Route::put('/workers/{worker}', [WorkerAdminController::class, 'update']);
            Route::delete('/workers/{worker}', [WorkerAdminController::class, 'destroy']);

            Route::post('/workers/{worker}/documents', [WorkerDocumentController::class, 'store']);
            Route::delete('/worker-documents/{workerDocument}', [WorkerDocumentController::class, 'destroy']);

            Route::get('/invoices', [AdminInvoiceController::class, 'index']);
            Route::post('/invoices', [AdminInvoiceController::class, 'store']);
            Route::get('/invoices/{invoice}', [AdminInvoiceController::class, 'show']);
            Route::post('/invoices/{invoice}/mark-paid', [AdminInvoiceController::class, 'markPaid']);
            Route::post('/invoices/{invoice}/cancel', [AdminInvoiceController::class, 'cancel']);

            // Dynamic reference (master) data management — one controller for all types.
            Route::get('/reference', [ReferenceDataController::class, 'resources']);
            Route::get('/reference/{resource}', [ReferenceDataController::class, 'index']);
            Route::post('/reference/{resource}', [ReferenceDataController::class, 'store']);
            Route::put('/reference/{resource}/reorder', [ReferenceDataController::class, 'reorder']);
            Route::put('/reference/{resource}/{id}', [ReferenceDataController::class, 'update']);
            Route::post('/reference/{resource}/{id}/toggle', [ReferenceDataController::class, 'toggle']);
            Route::delete('/reference/{resource}/{id}', [ReferenceDataController::class, 'destroy']);
        });
    });
});
