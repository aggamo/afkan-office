<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

#[Fillable(['slug', 'name_ar', 'name_en', 'name_am', 'is_active', 'sort_order'])]
class Skill extends Model
{
    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    public function workers(): BelongsToMany
    {
        return $this->belongsToMany(Worker::class, 'worker_skills')->withPivot('level')->withTimestamps();
    }
}
