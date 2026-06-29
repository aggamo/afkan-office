<?php

namespace App\Http\Controllers\Concerns;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

trait ApiResponse
{
    protected function success(mixed $data = null, string $message = 'ok', int $status = 200): JsonResponse
    {
        return response()->json([
            'status' => 'success',
            'message' => $message,
            'data' => $data,
            'errors' => null,
            'timestamp' => now()->toIso8601String(),
            'request_id' => (string) Str::uuid(),
        ], $status);
    }

    protected function fail(string $message, mixed $errors = null, int $status = 422): JsonResponse
    {
        return response()->json([
            'status' => 'error',
            'message' => $message,
            'data' => null,
            'errors' => $errors,
            'timestamp' => now()->toIso8601String(),
            'request_id' => (string) Str::uuid(),
        ], $status);
    }
}
