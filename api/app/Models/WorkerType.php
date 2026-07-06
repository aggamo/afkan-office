<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['slug', 'name_ar', 'name_en', 'name_am', 'is_active', 'sort_order'])]
class WorkerType extends Model
{
    use Auditable;

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    public function workers(): HasMany
    {
        return $this->hasMany(Worker::class);
    }
}
