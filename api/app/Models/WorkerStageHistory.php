<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Immutable record of a single recruitment stage transition (Document 8).
 * Rows are never updated or deleted.
 */
#[Fillable(['worker_id', 'from_stage_id', 'to_stage_id', 'changed_by', 'notes', 'entered_at'])]
class WorkerStageHistory extends Model
{
    protected $table = 'worker_stage_history';

    protected function casts(): array
    {
        return ['entered_at' => 'datetime'];
    }

    public function worker(): BelongsTo
    {
        return $this->belongsTo(Worker::class);
    }

    public function fromStage(): BelongsTo
    {
        return $this->belongsTo(RecruitmentStage::class, 'from_stage_id');
    }

    public function toStage(): BelongsTo
    {
        return $this->belongsTo(RecruitmentStage::class, 'to_stage_id');
    }

    public function changedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'changed_by');
    }
}
