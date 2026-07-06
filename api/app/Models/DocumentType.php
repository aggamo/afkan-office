<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['slug', 'name_ar', 'name_en', 'name_am', 'is_required', 'is_public', 'is_active', 'sort_order'])]
class DocumentType extends Model
{
    use Auditable;

    protected function casts(): array
    {
        return [
            'is_required' => 'boolean',
            'is_public' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function documents(): HasMany
    {
        return $this->hasMany(WorkerDocument::class);
    }
}
