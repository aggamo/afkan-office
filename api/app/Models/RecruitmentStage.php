<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'slug', 'name_ar', 'name_en', 'name_am', 'step_number',
    'is_core', 'is_public', 'color', 'sla_days', 'required_document_slugs', 'is_active',
])]
class RecruitmentStage extends Model
{
    use Auditable;

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'is_core' => 'boolean',
            'is_public' => 'boolean',
            'required_document_slugs' => 'array',
        ];
    }

    public function workers(): HasMany
    {
        return $this->hasMany(Worker::class, 'current_recruitment_stage_id');
    }
}
