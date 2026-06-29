<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AgencyResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'name' => $this->name,
            'license_number' => $this->license_number,
            'country' => $this->country,
            'city' => $this->city,
            'rating' => $this->rating,
            'completed_cases' => $this->completed_cases,
            'is_verified' => $this->is_verified,
        ];
    }
}
