<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Concerns\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreWorkerRequest;
use App\Http\Requests\UpdateWorkerRequest;
use App\Http\Resources\AdminWorkerResource;
use App\Models\Worker;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class WorkerAdminController extends Controller
{
    use ApiResponse;

    private const RELATIONS = ['nationality', 'workerType', 'currentRecruitmentStage', 'languages', 'skills', 'documents.documentType'];

    public function index(Request $request)
    {
        $query = Worker::query()->with(self::RELATIONS);

        if ($request->filled('reservation_status')) {
            $query->where('reservation_status', $request->string('reservation_status'));
        }

        if ($request->filled('q')) {
            $term = '%'.$request->string('q').'%';
            $query->where(function ($q) use ($term) {
                $q->where('full_name_ar', 'like', $term)
                    ->orWhere('full_name_en', 'like', $term)
                    ->orWhere('internal_number', 'like', $term)
                    ->orWhere('passport_number', 'like', $term);
            });
        }

        $perPage = min((int) $request->integer('per_page', 20), 100);
        $workers = $query->latest('id')->paginate($perPage);

        return $this->success([
            'items' => AdminWorkerResource::collection($workers->items()),
            'meta' => [
                'current_page' => $workers->currentPage(),
                'per_page' => $workers->perPage(),
                'total' => $workers->total(),
                'last_page' => $workers->lastPage(),
            ],
        ]);
    }

    public function store(StoreWorkerRequest $request)
    {
        $worker = DB::transaction(function () use ($request) {
            $worker = Worker::create([
                'uuid' => (string) Str::uuid(),
                ...$request->only([
                    'internal_number', 'full_name_ar', 'full_name_en', 'full_name_am',
                    'date_of_birth', 'gender', 'passport_number', 'passport_expiry',
                    'nationality_id', 'worker_type_id', 'experience_years', 'height_cm', 'weight_kg',
                    'religion', 'marital_status', 'number_of_children', 'agency_id',
                    'current_recruitment_stage_id', 'price', 'price_currency',
                ]),
                'is_published' => $request->boolean('is_published'),
                'is_active' => $request->boolean('is_active', true),
            ]);

            $this->syncLanguagesAndSkills($worker, $request);

            return $worker;
        });

        return $this->success(new AdminWorkerResource($worker->fresh()->load(self::RELATIONS)), 'تم إنشاء ملف العاملة بنجاح', 201);
    }

    public function show(Worker $worker)
    {
        return $this->success(new AdminWorkerResource($worker->load(self::RELATIONS)));
    }

    public function update(UpdateWorkerRequest $request, Worker $worker)
    {
        DB::transaction(function () use ($request, $worker) {
            $worker->update($request->only([
                'internal_number', 'full_name_ar', 'full_name_en', 'full_name_am',
                'date_of_birth', 'gender', 'passport_number', 'passport_expiry',
                'nationality_id', 'worker_type_id', 'experience_years', 'height_cm', 'weight_kg',
                'religion', 'marital_status', 'number_of_children', 'agency_id',
                'current_recruitment_stage_id', 'price', 'price_currency', 'is_published', 'is_active',
            ]));

            $this->syncLanguagesAndSkills($worker, $request);
        });

        return $this->success(new AdminWorkerResource($worker->fresh()->load(self::RELATIONS)), 'تم تحديث ملف العاملة بنجاح');
    }

    public function destroy(Worker $worker)
    {
        $worker->delete();

        return $this->success(null, 'تم حذف ملف العاملة (حذف ناعم)');
    }

    private function syncLanguagesAndSkills(Worker $worker, Request $request): void
    {
        if ($request->has('languages')) {
            $worker->languages()->sync(
                collect($request->input('languages'))->mapWithKeys(
                    fn (array $row) => [$row['language_id'] => ['proficiency' => $row['proficiency'] ?? null]]
                )
            );
        }

        if ($request->has('skills')) {
            $worker->skills()->sync(
                collect($request->input('skills'))->mapWithKeys(
                    fn (array $row) => [$row['skill_id'] => ['level' => $row['level'] ?? null]]
                )
            );
        }
    }
}
