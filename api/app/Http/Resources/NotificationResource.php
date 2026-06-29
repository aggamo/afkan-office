<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NotificationResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'event' => $this->event,
            'title' => [
                'ar' => $this->title_ar,
                'en' => $this->title_en,
                'am' => $this->title_am,
            ],
            'body' => [
                'ar' => $this->body_ar,
                'en' => $this->body_en,
                'am' => $this->body_am,
            ],
            'status' => $this->status,
            'read_at' => $this->read_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
