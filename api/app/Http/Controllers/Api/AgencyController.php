<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Resources\AgencyResource;
use App\Models\Agency;

class AgencyController extends Controller
{
    use ApiResponse;

    public function index()
    {
        $agencies = Agency::query()
            ->where('is_active', true)
            ->where('is_verified', true)
            ->latest('rating')
            ->get();

        return $this->success(AgencyResource::collection($agencies));
    }
}
