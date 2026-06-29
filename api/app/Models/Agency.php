<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\Concerns\Auditable;

#[Fillable([
    'uuid', 'name', 'license_number', 'country', 'city', 'phone', 'email',
    'rating', 'completed_cases', 'is_verified', 'is_active',
])]
class Agency extends Model
{
    use SoftDeletes, Auditable;

    protected function casts(): array
    {
        return [
            'rating' => 'decimal:2',
            'is_verified' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function agencyUsers(): HasMany
    {
        return $this->hasMany(AgencyUser::class);
    }

    public function workers(): HasMany
    {
        return $this->hasMany(Worker::class);
    }

    public function reservations(): HasMany
    {
        return $this->hasMany(Reservation::class);
    }
}
