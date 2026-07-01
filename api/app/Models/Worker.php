<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\Concerns\Auditable;

#[Fillable([
    'uuid', 'internal_number', 'full_name_ar', 'full_name_en', 'full_name_am',
    'date_of_birth', 'gender', 'passport_number', 'passport_expiry',
    'nationality_id', 'worker_type_id', 'experience_years', 'height_cm', 'weight_kg',
    'religion', 'marital_status', 'number_of_children', 'reservation_status',
    'readiness_score', 'agency_id', 'current_recruitment_stage_id',
    'tracking_number', 'warranty_started_at', 'warranty_ends_at',
    'is_published', 'is_active', 'price', 'price_currency',
])]
// Passport number and price are sensitive: never expose them through public-facing API resources.
#[Hidden(['passport_number', 'price', 'price_currency'])]
class Worker extends Model
{
    use SoftDeletes, Auditable;

    protected array $auditHidden = ['password', 'passport_number'];

    protected function casts(): array
    {
        return [
            'date_of_birth' => 'date',
            'passport_expiry' => 'date',
            'height_cm' => 'decimal:1',
            'weight_kg' => 'decimal:1',
            'readiness_score' => 'decimal:2',
            'price' => 'decimal:2',
            'is_published' => 'boolean',
            'is_active' => 'boolean',
            'warranty_started_at' => 'datetime',
            'warranty_ends_at' => 'datetime',
        ];
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    public function nationality(): BelongsTo
    {
        return $this->belongsTo(Country::class, 'nationality_id');
    }

    public function workerType(): BelongsTo
    {
        return $this->belongsTo(WorkerType::class);
    }

    public function agency(): BelongsTo
    {
        return $this->belongsTo(Agency::class);
    }

    public function currentRecruitmentStage(): BelongsTo
    {
        return $this->belongsTo(RecruitmentStage::class, 'current_recruitment_stage_id');
    }

    public function stageHistory(): HasMany
    {
        return $this->hasMany(WorkerStageHistory::class)->orderBy('entered_at');
    }

    public function languages(): BelongsToMany
    {
        return $this->belongsToMany(Language::class, 'worker_languages')->withPivot('proficiency')->withTimestamps();
    }

    public function skills(): BelongsToMany
    {
        return $this->belongsToMany(Skill::class, 'worker_skills')->withPivot('level')->withTimestamps();
    }

    public function documents(): HasMany
    {
        return $this->hasMany(WorkerDocument::class);
    }

    public function reservations(): HasMany
    {
        return $this->hasMany(Reservation::class);
    }

    public function activeReservation(): HasMany
    {
        return $this->reservations()->where('status', 'active');
    }

    public function favoritedBy(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'worker_favorites')->withTimestamps();
    }
}
