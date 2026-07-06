<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable([
    'uuid', 'customer_id', 'category', 'original_name', 'file_path',
    'file_hash', 'mime_type', 'size', 'status', 'uploaded_by',
])]
// Storage path/hash must never leak; downloads are brokered by an owned route.
#[Hidden(['file_path', 'file_hash'])]
class CustomerDocument extends Model
{
    use SoftDeletes, Auditable;

    protected array $auditHidden = ['file_path', 'file_hash'];

    protected function casts(): array
    {
        return ['size' => 'integer'];
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function uploadedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
