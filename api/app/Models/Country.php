<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['iso_code', 'name_ar', 'name_en', 'name_am', 'is_active', 'sort_order'])]
class Country extends Model
{
    use Auditable;

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    public function cities(): HasMany
    {
        return $this->hasMany(City::class);
    }

    public function workers(): HasMany
    {
        return $this->hasMany(Worker::class, 'nationality_id');
    }
}
