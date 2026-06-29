<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WorkerDocumentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'document_type' => $this->whenLoaded('documentType'),
            'issued_at' => $this->issued_at?->toDateString(),
            'expires_at' => $this->expires_at?->toDateString(),
            'uploaded_by' => $this->uploaded_by,
            'download_url' => route('worker-documents.download', $this->id),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
