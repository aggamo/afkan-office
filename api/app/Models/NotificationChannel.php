<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['slug', 'name_ar', 'name_en', 'name_am', 'is_active'])]
class NotificationChannel extends Model
{
    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }
}
