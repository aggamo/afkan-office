<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReservationResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'worker_id' => $this->worker_id,
            'reserved_by_type' => $this->reserved_by_type,
            'customer_id' => $this->customer_id,
            'agency_id' => $this->agency_id,
            'status' => $this->status,
            'reserved_at' => $this->reserved_at?->toIso8601String(),
            'expires_at' => $this->expires_at?->toIso8601String(),
            'resolved_at' => $this->resolved_at?->toIso8601String(),
        ];
    }
}
