<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Resources\WorkerResource;
use App\Models\Worker;
use Illuminate\Http\Request;

class FavoriteController extends Controller
{
    use ApiResponse;

    private const MAX_FAVORITES = 50;

    public function index(Request $request)
    {
        $workers = $request->user()
            ->favoriteWorkers()
            ->where('is_published', true)
            ->where('is_active', true)
            ->with(['nationality', 'workerType', 'languages', 'skills'])
            ->orderByDesc('worker_favorites.created_at')
            ->get();

        return $this->success(WorkerResource::collection($workers));
    }

    public function store(Request $request, Worker $worker)
    {
        $user = $request->user();

        if (! $worker->is_published || ! $worker->is_active) {
            return $this->fail('العاملة غير متاحة.', null, 404);
        }

        if ($user->favoriteWorkers()->where('worker_id', $worker->id)->exists()) {
            return $this->success(null, 'العاملة موجودة بالفعل في المفضلة');
        }

        if ($user->favoriteWorkers()->count() >= self::MAX_FAVORITES) {
            return $this->fail('تم الوصول إلى الحد الأقصى لعدد العاملات في المفضلة.', null, 422);
        }

        $user->favoriteWorkers()->attach($worker->id);

        return $this->success(null, 'تمت الإضافة إلى المفضلة', 201);
    }

    public function destroy(Request $request, Worker $worker)
    {
        $request->user()->favoriteWorkers()->detach($worker->id);

        return $this->success(null, 'تمت الإزالة من المفضلة');
    }
}
