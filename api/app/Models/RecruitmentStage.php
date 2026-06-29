<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['slug', 'name_ar', 'name_en', 'name_am', 'step_number', 'is_active'])]
class RecruitmentStage extends Model
{
    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    public function workers(): HasMany
    {
        return $this->hasMany(Worker::class, 'current_recruitment_stage_id');
    }
}
