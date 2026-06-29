<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ReservationController;
use App\Http\Controllers\Api\WorkerController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::post('/auth/register', [AuthController::class, 'registerCustomer']);
    Route::post('/auth/register-agency', [AuthController::class, 'registerAgency']);
    Route::post('/auth/login', [AuthController::class, 'login']);

    Route::get('/workers', [WorkerController::class, 'index']);
    Route::get('/workers/{worker}', [WorkerController::class, 'show']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/auth/me', [AuthController::class, 'me']);

        Route::get('/reservations/{reservation}', [ReservationController::class, 'show']);
        Route::post('/reservations/{reservation}/cancel', [ReservationController::class, 'cancel']);

        Route::middleware('role:customer')->group(function () {
            Route::post('/reservations/customer', [ReservationController::class, 'storeAsCustomer']);
        });

        Route::middleware('role:agency')->group(function () {
            Route::post('/reservations/agency', [ReservationController::class, 'storeAsAgency']);
            Route::post('/reservations/{reservation}/convert-to-agency', [ReservationController::class, 'convertToAgency']);
        });
    });
});
