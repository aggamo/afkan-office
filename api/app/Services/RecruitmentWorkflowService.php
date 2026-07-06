<?php

namespace App\Services;

use App\Exceptions\WorkflowException;
use App\Models\Notification;
use App\Models\RecruitmentStage;
use App\Models\User;
use App\Models\Worker;
use App\Models\WorkerStageHistory;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Operational engine for the 17-stage recruitment workflow (Document 8):
 * permanent tracking numbers, immutable stage history, automatic progress /
 * Smart ETA / delay detection, and warranty management.
 */
class RecruitmentWorkflowService
{
    public const WARRANTY_STAGE = 'warranty_period';
    public const WARRANTY_DAYS = 90;
    public const FIRST_STAGE = 'file_received';

    public function __construct(
        private readonly NotificationService $notifications = new NotificationService(),
    ) {
    }

    /**
     * Ensure the worker has a permanent tracking number (AFK-YYYY-000123).
     */
    public function ensureTrackingNumber(Worker $worker): string
    {
        if ($worker->tracking_number) {
            return $worker->tracking_number;
        }

        $number = sprintf('AFK-%s-%06d', now()->format('Y'), $worker->id);
        $worker->forceFill(['tracking_number' => $number])->save();

        return $number;
    }

    /**
     * Move a worker into a stage, recording immutable history and running all
     * automatic side effects (warranty, notifications).
     */
    public function advance(Worker $worker, RecruitmentStage $toStage, ?User $actor = null, ?string $notes = null): Worker
    {
        return DB::transaction(function () use ($worker, $toStage, $actor, $notes) {
            $worker = Worker::where('id', $worker->id)->lockForUpdate()->firstOrFail();

            if (! $toStage->is_active) {
                throw new WorkflowException('لا يمكن الانتقال إلى مرحلة غير مفعّلة.');
            }
            if ($worker->current_recruitment_stage_id === $toStage->id) {
                throw new WorkflowException('العاملة موجودة بالفعل في هذه المرحلة.');
            }

            $this->ensureTrackingNumber($worker);
            $fromStageId = $worker->current_recruitment_stage_id;

            WorkerStageHistory::create([
                'worker_id' => $worker->id,
                'from_stage_id' => $fromStageId,
                'to_stage_id' => $toStage->id,
                'changed_by' => $actor?->id,
                'notes' => $notes,
                'entered_at' => now(),
            ]);

            $updates = ['current_recruitment_stage_id' => $toStage->id];

            if ($toStage->slug === self::WARRANTY_STAGE && ! $worker->warranty_started_at) {
                $updates['warranty_started_at'] = now();
                $updates['warranty_ends_at'] = now()->addDays(self::WARRANTY_DAYS);
            }

            $worker->forceFill($updates)->save();

            $this->notifyStageChange($worker->fresh(), $toStage);

            return $worker->fresh();
        });
    }

    /**
     * Start the workflow at the first official stage.
     */
    public function start(Worker $worker, ?User $actor = null): Worker
    {
        $first = RecruitmentStage::where('slug', self::FIRST_STAGE)->firstOrFail();

        return $this->advance($worker, $first, $actor, 'بدء ملف التوظيف');
    }

    /**
     * Progress percentage based on the current stage position among core stages.
     */
    public function progress(Worker $worker): int
    {
        $total = RecruitmentStage::where('is_core', true)->count();
        if ($total === 0 || ! $worker->currentRecruitmentStage) {
            return 0;
        }

        return (int) round(($worker->currentRecruitmentStage->step_number / $total) * 100);
    }

    /**
     * Smart ETA: sum of SLA days for the remaining stages, plus a confidence
     * level derived from whether the current stage is already overdue.
     *
     * @return array{estimated_completion: ?string, remaining_days: int, confidence: string}
     */
    public function eta(Worker $worker): array
    {
        $current = $worker->currentRecruitmentStage;
        if (! $current) {
            return ['estimated_completion' => null, 'remaining_days' => 0, 'confidence' => 'low'];
        }

        $remainingDays = (int) RecruitmentStage::where('is_active', true)
            ->where('step_number', '>=', $current->step_number)
            ->sum('sla_days');

        $confidence = match (true) {
            $this->isDelayed($worker) => 'low',
            $remainingDays > 30 => 'medium',
            default => 'high',
        };

        return [
            'estimated_completion' => now()->addDays($remainingDays)->toDateString(),
            'remaining_days' => $remainingDays,
            'confidence' => $confidence,
        ];
    }

    /**
     * Whether the worker has spent longer than the current stage SLA.
     */
    public function isDelayed(Worker $worker): bool
    {
        $current = $worker->currentRecruitmentStage;
        if (! $current || ! $current->sla_days) {
            return false;
        }

        $enteredAt = $this->currentStageEnteredAt($worker);
        if (! $enteredAt) {
            return false;
        }

        return $enteredAt->copy()->addDays($current->sla_days)->isPast();
    }

    public function currentStageEnteredAt(Worker $worker): ?Carbon
    {
        $last = WorkerStageHistory::where('worker_id', $worker->id)
            ->where('to_stage_id', $worker->current_recruitment_stage_id)
            ->latest('entered_at')
            ->first();

        return $last?->entered_at;
    }

    /**
     * Build the full timeline. Each stage is completed / current / upcoming,
     * with the current one flagged delayed when overdue.
     *
     * @return array<int, array<string, mixed>>
     */
    public function timeline(Worker $worker, bool $publicOnly = false): array
    {
        $currentStep = $worker->currentRecruitmentStage?->step_number ?? 0;

        $enteredMap = WorkerStageHistory::where('worker_id', $worker->id)
            ->get()
            ->groupBy('to_stage_id')
            ->map(fn ($rows) => $rows->max('entered_at'));

        $delayed = $this->isDelayed($worker);

        return RecruitmentStage::where('is_active', true)
            ->when($publicOnly, fn ($q) => $q->where('is_public', true))
            ->orderBy('step_number')
            ->get()
            ->map(function (RecruitmentStage $stage) use ($currentStep, $enteredMap, $delayed) {
                $status = match (true) {
                    $stage->step_number < $currentStep => 'completed',
                    $stage->step_number === $currentStep => $delayed ? 'delayed' : 'current',
                    default => 'upcoming',
                };

                return [
                    'step_number' => $stage->step_number,
                    'slug' => $stage->slug,
                    'name' => ['ar' => $stage->name_ar, 'en' => $stage->name_en, 'am' => $stage->name_am],
                    'color' => $stage->color,
                    'status' => $status,
                    'entered_at' => $enteredMap->get($stage->id)?->toIso8601String(),
                ];
            })
            ->all();
    }

    /**
     * Performance analytics (Documents 8 & 9): average time spent in each
     * stage and the overall average recruitment duration, derived from the
     * immutable stage history. Durations are computed in PHP (DB-agnostic).
     *
     * @return array{stages: array<int, array<string, mixed>>, overall_avg_days: float, completed_count: int}
     */
    public function analytics(): array
    {
        $stages = RecruitmentStage::orderBy('step_number')->get()->keyBy('id');

        $history = WorkerStageHistory::query()
            ->orderBy('worker_id')
            ->orderBy('entered_at')
            ->get(['worker_id', 'to_stage_id', 'entered_at'])
            ->groupBy('worker_id');

        $durations = [];       // stage_id => [days, ...]
        $completedTotals = []; // total file→arrival days per completed worker

        foreach ($history as $rows) {
            $rows = $rows->values();
            for ($i = 0; $i < $rows->count() - 1; $i++) {
                $stageId = $rows[$i]->to_stage_id;
                if (! $stageId) {
                    continue;
                }
                $days = Carbon::parse($rows[$i]->entered_at)->diffInHours(Carbon::parse($rows[$i + 1]->entered_at)) / 24;
                $durations[$stageId][] = $days;
            }

            // Overall duration for workers that reached the arrival stage.
            $arrival = $rows->first(fn ($r) => optional($stages->get($r->to_stage_id))->slug === 'worker_arrived');
            if ($arrival) {
                $completedTotals[] = Carbon::parse($rows->first()->entered_at)->diffInHours(Carbon::parse($arrival->entered_at)) / 24;
            }
        }

        $stageStats = [];
        foreach ($stages as $stage) {
            if (! isset($durations[$stage->id])) {
                continue;
            }
            $arr = $durations[$stage->id];
            $stageStats[] = [
                'slug' => $stage->slug,
                'name' => ['ar' => $stage->name_ar, 'en' => $stage->name_en, 'am' => $stage->name_am],
                'avg_days' => round(array_sum($arr) / count($arr), 1),
                'sla_days' => $stage->sla_days,
                'count' => count($arr),
            ];
        }

        return [
            'stages' => $stageStats,
            'overall_avg_days' => $completedTotals ? round(array_sum($completedTotals) / count($completedTotals), 1) : 0.0,
            'completed_count' => count($completedTotals),
        ];
    }

    /**
     * Management operations overview (Documents 8 & 9): counts of files in
     * recruitment, delayed and under warranty, plus an "attention" list of the
     * most overdue files. Computed in a bounded, N+1-free way.
     *
     * @return array{in_recruitment: int, delayed: int, warranty_active: int, attention: array<int, array<string, mixed>>}
     */
    public function operationsOverview(int $attentionLimit = 8): array
    {
        $inWorkflow = Worker::query()
            ->whereNotNull('current_recruitment_stage_id')
            ->whereNull('warranty_ends_at')
            ->with('currentRecruitmentStage')
            ->get();

        $historyByWorker = WorkerStageHistory::query()
            ->whereIn('worker_id', $inWorkflow->pluck('id'))
            ->get()
            ->groupBy('worker_id');

        $delayed = [];
        foreach ($inWorkflow as $worker) {
            $stage = $worker->currentRecruitmentStage;
            if (! $stage || ! $stage->sla_days) {
                continue;
            }

            $enteredAt = optional($historyByWorker->get($worker->id))
                ->where('to_stage_id', $worker->current_recruitment_stage_id)
                ->max('entered_at');

            if (! $enteredAt) {
                continue;
            }

            $due = Carbon::parse($enteredAt)->addDays($stage->sla_days);
            if ($due->isPast()) {
                $delayed[] = [
                    'worker_id' => $worker->id,
                    'internal_number' => $worker->internal_number,
                    'tracking_number' => $worker->tracking_number,
                    'full_name' => ['ar' => $worker->full_name_ar, 'en' => $worker->full_name_en, 'am' => $worker->full_name_am],
                    'stage' => ['ar' => $stage->name_ar, 'en' => $stage->name_en, 'am' => $stage->name_am],
                    'days_overdue' => (int) ceil($due->diffInDays(now(), absolute: true)),
                ];
            }
        }

        usort($delayed, fn ($a, $b) => $b['days_overdue'] <=> $a['days_overdue']);

        return [
            'in_recruitment' => $inWorkflow->count(),
            'delayed' => count($delayed),
            'warranty_active' => Worker::whereNotNull('warranty_ends_at')->where('warranty_ends_at', '>', now())->count(),
            'attention' => array_slice($delayed, 0, $attentionLimit),
        ];
    }

    /**
     * Scheduled maintenance (Document 8 automation): flag overdue stages to
     * staff and announce warranties that have reached their 90-day end. Both
     * are de-duplicated so the same alert is not repeated.
     *
     * @return array{delays_notified: int, warranties_closed: int}
     */
    public function runDailyMaintenance(): array
    {
        $staff = $this->staffUsers();

        return [
            'delays_notified' => $this->notifyDelays($staff),
            'warranties_closed' => $this->notifyEndedWarranties($staff),
        ];
    }

    private function notifyDelays(Collection $staff): int
    {
        $since = now()->startOfDay();
        $count = 0;

        Worker::query()
            ->whereNotNull('current_recruitment_stage_id')
            ->whereNull('warranty_ends_at')
            ->with('currentRecruitmentStage')
            ->get()
            ->each(function (Worker $worker) use ($staff, $since, &$count) {
                if (! $this->isDelayed($worker)) {
                    return;
                }

                $notified = false;
                foreach ($staff as $user) {
                    if ($this->notificationExists($user->id, 'workflow.delayed', $worker, $since)) {
                        continue;
                    }
                    $this->notifications->send($user, 'workflow.delayed', [
                        'ar' => 'ملف متأخر يحتاج متابعة',
                        'en' => 'Delayed file needs attention',
                        'am' => 'የዘገየ ፋይል ትኩረት ይፈልጋል',
                    ], [
                        'ar' => 'العاملة '.$worker->internal_number.' متأخرة في مرحلة: '.($worker->currentRecruitmentStage?->name_ar ?? ''),
                        'en' => 'Worker '.$worker->internal_number.' is delayed at stage: '.($worker->currentRecruitmentStage?->name_en ?? ''),
                        'am' => 'ሰራተኛ '.$worker->internal_number.' በደረጃ ዘግይታለች: '.($worker->currentRecruitmentStage?->name_am ?? ''),
                    ], $worker);
                    $notified = true;
                }

                if ($notified) {
                    $count++;
                }
            });

        return $count;
    }

    private function notifyEndedWarranties(Collection $staff): int
    {
        $count = 0;

        Worker::query()
            ->whereNotNull('warranty_ends_at')
            ->where('warranty_ends_at', '<=', now())
            ->get()
            ->each(function (Worker $worker) use ($staff, &$count) {
                $notified = false;
                foreach ($staff as $user) {
                    // One-time closure notice (deduped for the lifetime of the file).
                    if ($this->notificationExists($user->id, 'workflow.warranty_ended', $worker)) {
                        continue;
                    }
                    $this->notifications->send($user, 'workflow.warranty_ended', [
                        'ar' => 'انتهت فترة الضمان',
                        'en' => 'Warranty period ended',
                        'am' => 'የዋስትና ጊዜ አብቅቷል',
                    ], [
                        'ar' => 'انتهت فترة ضمان العاملة '.$worker->internal_number.' (90 يوماً).',
                        'en' => 'Warranty period for worker '.$worker->internal_number.' has ended (90 days).',
                        'am' => 'የሰራተኛ '.$worker->internal_number.' የዋስትና ጊዜ አብቅቷል (90 ቀናት)።',
                    ], $worker);
                    $notified = true;
                }

                if ($notified) {
                    $count++;
                }
            });

        return $count;
    }

    private function staffUsers(): Collection
    {
        return User::whereHas('role', fn ($q) => $q->whereIn('slug', ['employee', 'super_admin']))->get();
    }

    private function notificationExists(int $userId, string $event, Worker $worker, ?Carbon $since = null): bool
    {
        return Notification::query()
            ->where('user_id', $userId)
            ->where('event', $event)
            ->where('notifiable_type', Worker::class)
            ->where('notifiable_id', $worker->id)
            ->when($since, fn ($q) => $q->where('created_at', '>=', $since))
            ->exists();
    }

    private function notifyStageChange(Worker $worker, RecruitmentStage $stage): void
    {
        $titles = [
            'ar' => 'تحديث مرحلة الاستقدام',
            'en' => 'Recruitment stage updated',
            'am' => 'የቅጥር ደረጃ ተዘምኗል',
        ];
        $bodies = [
            'ar' => 'المرحلة الحالية: '.$stage->name_ar,
            'en' => 'Current stage: '.$stage->name_en,
            'am' => 'የአሁኑ ደረጃ: '.$stage->name_am,
        ];

        // Notify the assigned agency's primary contact.
        if ($worker->agency) {
            $agencyUser = $this->notifications->resolveAgencyPrimaryContact($worker->agency);
            if ($agencyUser) {
                $this->notifications->send($agencyUser, 'workflow.stage_changed', $titles, $bodies, $worker);
            }
        }

        // Notify the customer tied to the latest reservation, if any.
        $customerUser = $worker->reservations()
            ->whereIn('status', ['active', 'converted', 'completed'])
            ->whereNotNull('customer_id')
            ->latest('id')
            ->first()?->customer?->user;

        if ($customerUser) {
            $this->notifications->send($customerUser, 'workflow.stage_changed', $titles, $bodies, $worker);
        }
    }
}
