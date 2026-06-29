<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminWorkerResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'internal_number' => $this->internal_number,
            'full_name_ar' => $this->full_name_ar,
            'full_name_en' => $this->full_name_en,
            'full_name_am' => $this->full_name_am,
            'date_of_birth' => $this->date_of_birth?->toDateString(),
            'gender' => $this->gender,
            'passport_number' => $this->passport_number,
            'passport_expiry' => $this->passport_expiry?->toDateString(),
            'nationality' => $this->whenLoaded('nationality'),
            'worker_type' => $this->whenLoaded('workerType'),
            'experience_years' => $this->experience_years,
            'height_cm' => $this->height_cm,
            'weight_kg' => $this->weight_kg,
            'religion' => $this->religion,
            'marital_status' => $this->marital_status,
            'number_of_children' => $this->number_of_children,
            'reservation_status' => $this->reservation_status,
            'readiness_score' => $this->readiness_score,
            'agency_id' => $this->agency_id,
            'current_recruitment_stage' => $this->whenLoaded('currentRecruitmentStage'),
            'is_published' => $this->is_published,
            'is_active' => $this->is_active,
            'languages' => $this->whenLoaded('languages'),
            'skills' => $this->whenLoaded('skills'),
            'documents' => WorkerDocumentResource::collection($this->whenLoaded('documents')),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
