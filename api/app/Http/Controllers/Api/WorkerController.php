<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Resources\WorkerResource;
use App\Models\Worker;
use Illuminate\Http\Request;

class WorkerController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $query = Worker::query()
            ->where('is_published', true)
            ->where('is_active', true)
            ->with(['nationality', 'workerType', 'languages', 'skills']);

        if ($request->filled('reservation_status')) {
            $query->where('reservation_status', $request->string('reservation_status'));
        }

        if ($request->filled('worker_type_id')) {
            $query->where('worker_type_id', $request->integer('worker_type_id'));
        }

        if ($request->filled('nationality_id')) {
            $query->where('nationality_id', $request->integer('nationality_id'));
        }

        if ($request->filled('q')) {
            $term = '%'.$request->string('q').'%';
            $query->where(function ($q) use ($term) {
                $q->where('full_name_ar', 'like', $term)
                    ->orWhere('full_name_en', 'like', $term)
                    ->orWhere('full_name_am', 'like', $term)
                    ->orWhere('internal_number', 'like', $term);
            });
        }

        $perPage = min((int) $request->integer('per_page', 12), 50);
        $workers = $query->latest('id')->paginate($perPage);

        return $this->success([
            'items' => WorkerResource::collection($workers->items()),
            'meta' => [
                'current_page' => $workers->currentPage(),
                'per_page' => $workers->perPage(),
                'total' => $workers->total(),
                'last_page' => $workers->lastPage(),
            ],
        ]);
    }

    public function show(Worker $worker)
    {
        if (! $worker->is_published || ! $worker->is_active) {
            return $this->fail('العاملة غير متاحة.', null, 404);
        }

        $worker->load(['nationality', 'workerType', 'languages', 'skills']);

        return $this->success(new WorkerResource($worker));
    }

    /**
     * Public tracking lookup by internal number: exposes only recruitment
     * progress, never passport, price, or other sensitive worker data.
     */
    public function track(Request $request)
    {
        $request->validate(['internal_number' => ['required', 'string']]);

        $worker = Worker::where('internal_number', $request->string('internal_number'))
            ->where('is_active', true)
            ->with('currentRecruitmentStage')
            ->first();

        if (! $worker) {
            return $this->fail('لم يتم العثور على طلب بهذا الرقم.', null, 404);
        }

        return $this->success([
            'internal_number' => $worker->internal_number,
            'reservation_status' => $worker->reservation_status,
            'current_recruitment_stage' => $worker->currentRecruitmentStage ? [
                'slug' => $worker->currentRecruitmentStage->slug,
                'step_number' => $worker->currentRecruitmentStage->step_number,
                'name_ar' => $worker->currentRecruitmentStage->name_ar,
                'name_en' => $worker->currentRecruitmentStage->name_en,
                'name_am' => $worker->currentRecruitmentStage->name_am,
            ] : null,
        ]);
    }
}
