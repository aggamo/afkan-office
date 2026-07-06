<?php

namespace App\Http\Controllers\Api\Admin;

use App\Exceptions\WorkflowException;
use App\Http\Controllers\Concerns\ApiResponse;
use App\Http\Controllers\Controller;
use App\Models\RecruitmentStage;
use App\Models\Worker;
use App\Models\WorkerStageHistory;
use App\Services\RecruitmentWorkflowService;
use Illuminate\Http\Request;

/**
 * Staff-facing recruitment workflow management (Document 8): view a worker's
 * full timeline and history, and advance stages.
 */
class WorkflowController extends Controller
{
    use ApiResponse;

    public function __construct(private readonly RecruitmentWorkflowService $workflow)
    {
    }

    public function stages()
    {
        $stages = RecruitmentStage::where('is_active', true)
            ->orderBy('step_number')
            ->get(['id', 'slug', 'step_number', 'name_ar', 'name_en', 'name_am', 'color', 'sla_days', 'is_core', 'is_public']);

        return $this->success($stages);
    }

    public function show(Worker $worker)
    {
        $worker->load('currentRecruitmentStage');

        return $this->success($this->workflowPayload($worker, publicOnly: false));
    }

    public function advance(Request $request, Worker $worker)
    {
        $data = $request->validate([
            'stage_id' => ['required', 'integer', 'exists:recruitment_stages,id'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $stage = RecruitmentStage::findOrFail($data['stage_id']);

        try {
            $worker = $this->workflow->advance($worker, $stage, $request->user(), $data['notes'] ?? null);
        } catch (WorkflowException $e) {
            return $this->fail($e->getMessage(), null, 422);
        }

        return $this->success($this->workflowPayload($worker->load('currentRecruitmentStage'), publicOnly: false), 'تم تحديث المرحلة');
    }

    public function start(Request $request, Worker $worker)
    {
        try {
            $worker = $this->workflow->start($worker, $request->user());
        } catch (WorkflowException $e) {
            return $this->fail($e->getMessage(), null, 422);
        }

        return $this->success($this->workflowPayload($worker->load('currentRecruitmentStage'), publicOnly: false), 'تم بدء ملف التوظيف');
    }

    private function workflowPayload(Worker $worker, bool $publicOnly): array
    {
        $history = WorkerStageHistory::where('worker_id', $worker->id)
            ->with(['fromStage:id,name_ar,name_en,name_am', 'toStage:id,name_ar,name_en,name_am', 'changedBy:id,name'])
            ->orderByDesc('entered_at')
            ->get()
            ->map(fn (WorkerStageHistory $h) => [
                'id' => $h->id,
                'from' => $h->fromStage ? ['ar' => $h->fromStage->name_ar, 'en' => $h->fromStage->name_en, 'am' => $h->fromStage->name_am] : null,
                'to' => $h->toStage ? ['ar' => $h->toStage->name_ar, 'en' => $h->toStage->name_en, 'am' => $h->toStage->name_am] : null,
                'by' => $h->changedBy?->name,
                'notes' => $h->notes,
                'entered_at' => $h->entered_at?->toIso8601String(),
            ]);

        return [
            'worker' => [
                'id' => $worker->id,
                'internal_number' => $worker->internal_number,
                'tracking_number' => $worker->tracking_number,
                'full_name' => ['ar' => $worker->full_name_ar, 'en' => $worker->full_name_en, 'am' => $worker->full_name_am],
            ],
            'current_stage' => $worker->currentRecruitmentStage ? [
                'step_number' => $worker->currentRecruitmentStage->step_number,
                'slug' => $worker->currentRecruitmentStage->slug,
                'name' => [
                    'ar' => $worker->currentRecruitmentStage->name_ar,
                    'en' => $worker->currentRecruitmentStage->name_en,
                    'am' => $worker->currentRecruitmentStage->name_am,
                ],
            ] : null,
            'progress' => $this->workflow->progress($worker),
            'eta' => $this->workflow->eta($worker),
            'is_delayed' => $this->workflow->isDelayed($worker),
            'warranty' => [
                'started_at' => $worker->warranty_started_at?->toIso8601String(),
                'ends_at' => $worker->warranty_ends_at?->toIso8601String(),
                'remaining_days' => $worker->warranty_ends_at && $worker->warranty_ends_at->isFuture()
                    ? (int) ceil(now()->diffInDays($worker->warranty_ends_at, absolute: true))
                    : 0,
            ],
            'required_documents' => $this->requiredDocuments($worker),
            'timeline' => $this->workflow->timeline($worker, $publicOnly),
            'history' => $history,
        ];
    }

    /**
     * Required document types for the current stage, each flagged present or
     * missing based on the worker's uploaded documents (Document 8).
     *
     * @return array<int, array<string, mixed>>
     */
    private function requiredDocuments(Worker $worker): array
    {
        $slugs = $worker->currentRecruitmentStage?->required_document_slugs ?? [];
        if (empty($slugs)) {
            return [];
        }

        $types = \App\Models\DocumentType::whereIn('slug', $slugs)->get()->keyBy('slug');

        $ownedTypeIds = $worker->documents()->pluck('document_type_id')->all();

        return collect($slugs)->map(function (string $slug) use ($types, $ownedTypeIds) {
            $type = $types->get($slug);

            return [
                'slug' => $slug,
                'name' => $type ? ['ar' => $type->name_ar, 'en' => $type->name_en, 'am' => $type->name_am] : ['ar' => $slug, 'en' => $slug, 'am' => $slug],
                'present' => $type ? in_array($type->id, $ownedTypeIds, true) : false,
            ];
        })->all();
    }
}
