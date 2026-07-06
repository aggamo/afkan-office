<?php

namespace App\Models\Concerns;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

trait Auditable
{
    public static function bootAuditable(): void
    {
        static::created(function (Model $model) {
            $model->writeAuditLog('created', null, $model->getAttributes());
        });

        static::updated(function (Model $model) {
            $changes = $model->getChanges();
            unset($changes['updated_at']);

            if (empty($changes)) {
                return;
            }

            $model->writeAuditLog('updated', array_intersect_key($model->getOriginal(), $changes), $changes);
        });

        static::deleted(function (Model $model) {
            $action = method_exists($model, 'isForceDeleting') && $model->isForceDeleting()
                ? 'force_deleted'
                : 'deleted';

            $model->writeAuditLog($action, $model->getAttributes(), null);
        });
    }

    protected function writeAuditLog(string $action, ?array $oldValues, ?array $newValues): void
    {
        AuditLog::create([
            'user_id' => Auth::id(),
            'action' => $action.'_'.class_basename($this),
            'auditable_type' => static::class,
            'auditable_id' => $this->getKey(),
            'old_values' => $this->hideSensitiveAuditFields($oldValues),
            'new_values' => $this->hideSensitiveAuditFields($newValues),
            'ip_address' => Request::ip(),
        ]);
    }

    private function hideSensitiveAuditFields(?array $values): ?array
    {
        if ($values === null) {
            return null;
        }

        $hidden = property_exists($this, 'auditHidden') ? $this->auditHidden : ['password'];

        return array_diff_key($values, array_flip($hidden));
    }
}
