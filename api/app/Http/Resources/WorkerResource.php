<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WorkerResource extends JsonResource
{
    /**
     * Public-safe worker representation. Never exposes passport number,
     * document files, prices, or internal notes — per business rules.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'internal_number' => $this->internal_number,
            'full_name' => [
                'ar' => $this->full_name_ar,
                'en' => $this->full_name_en,
                'am' => $this->full_name_am,
            ],
            'date_of_birth' => $this->date_of_birth?->toDateString(),
            'gender' => $this->gender,
            'nationality' => $this->whenLoaded('nationality', fn () => [
                'id' => $this->nationality->id,
                'name_ar' => $this->nationality->name_ar,
                'name_en' => $this->nationality->name_en,
                'name_am' => $this->nationality->name_am,
            ]),
            'worker_type' => $this->whenLoaded('workerType', fn () => [
                'id' => $this->workerType->id,
                'name_ar' => $this->workerType->name_ar,
                'name_en' => $this->workerType->name_en,
                'name_am' => $this->workerType->name_am,
            ]),
            'experience_years' => $this->experience_years,
            'height_cm' => $this->height_cm,
            'weight_kg' => $this->weight_kg,
            'religion' => $this->religion,
            'marital_status' => $this->marital_status,
            'number_of_children' => $this->number_of_children,
            'reservation_status' => $this->reservation_status,
            'readiness_score' => $this->readiness_score,
            'languages' => $this->whenLoaded('languages', fn () => $this->languages->map(fn ($l) => [
                'slug' => $l->slug,
                'name_ar' => $l->name_ar,
                'name_en' => $l->name_en,
                'name_am' => $l->name_am,
                'proficiency' => $l->pivot->proficiency,
            ])),
            'skills' => $this->whenLoaded('skills', fn () => $this->skills->map(fn ($s) => [
                'slug' => $s->slug,
                'name_ar' => $s->name_ar,
                'name_en' => $s->name_en,
                'name_am' => $s->name_am,
                'level' => $s->pivot->level,
            ])),
        ];
    }
}
