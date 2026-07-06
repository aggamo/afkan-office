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
            'authorized_agency_id' => $this->authorized_agency_id,
            'authorization_status' => $this->authorization_status,
            'authorized_at' => $this->authorized_at?->toIso8601String(),
            'status' => $this->status,
            'reserved_at' => $this->reserved_at?->toIso8601String(),
            'expires_at' => $this->expires_at?->toIso8601String(),
            'resolved_at' => $this->resolved_at?->toIso8601String(),
            'worker' => $this->whenLoaded('worker', fn () => [
                'id' => $this->worker->id,
                'internal_number' => $this->worker->internal_number,
                'full_name' => [
                    'ar' => $this->worker->full_name_ar,
                    'en' => $this->worker->full_name_en,
                    'am' => $this->worker->full_name_am,
                ],
                'reservation_status' => $this->worker->reservation_status,
            ]),
            'authorized_agency' => $this->whenLoaded('authorizedAgency', fn () => $this->authorizedAgency ? [
                'id' => $this->authorizedAgency->id,
                'name' => $this->authorizedAgency->name,
                'city' => $this->authorizedAgency->city,
                'rating' => $this->authorizedAgency->rating,
            ] : null),
        ];
    }
}
