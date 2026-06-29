<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

#[Fillable([
    'uuid', 'user_id', 'notification_channel_id', 'event',
    'title_ar', 'title_en', 'title_am', 'body_ar', 'body_en', 'body_am',
    'notifiable_type', 'notifiable_id', 'status', 'read_at', 'sent_at',
])]
class Notification extends Model
{
    protected function casts(): array
    {
        return [
            'read_at' => 'datetime',
            'sent_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function channel(): BelongsTo
    {
        return $this->belongsTo(NotificationChannel::class, 'notification_channel_id');
    }

    public function notifiable(): MorphTo
    {
        return $this->morphTo();
    }
}
