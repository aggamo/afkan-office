<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Concerns\ApiResponse;
use App\Http\Controllers\Controller;
use App\Models\Reservation;
use Illuminate\Http\Request;

class ReservationController extends Controller
{
    use ApiResponse;

    private const RELATIONS = ['worker', 'customer.user', 'agency', 'authorizedAgency'];

    public function index(Request $request)
    {
        $query = Reservation::query()->with(self::RELATIONS);

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('reserved_by_type')) {
            $query->where('reserved_by_type', $request->string('reserved_by_type'));
        }

        $perPage = min((int) $request->integer('per_page', 20), 100);
        $reservations = $query->latest('id')->paginate($perPage);

        return $this->success([
            'items' => collect($reservations->items())->map(fn (Reservation $r) => $this->present($r)),
            'meta' => [
                'current_page' => $reservations->currentPage(),
                'per_page' => $reservations->perPage(),
                'total' => $reservations->total(),
                'last_page' => $reservations->lastPage(),
            ],
        ]);
    }

    private function present(Reservation $r): array
    {
        return [
            'id' => $r->id,
            'uuid' => $r->uuid,
            'status' => $r->status,
            'reserved_by_type' => $r->reserved_by_type,
            'authorization_status' => $r->authorization_status,
            'reserved_at' => $r->reserved_at?->toIso8601String(),
            'expires_at' => $r->expires_at?->toIso8601String(),
            'worker' => $r->worker ? [
                'id' => $r->worker->id,
                'internal_number' => $r->worker->internal_number,
                'full_name_ar' => $r->worker->full_name_ar,
                'full_name_en' => $r->worker->full_name_en,
                'full_name_am' => $r->worker->full_name_am,
            ] : null,
            'customer' => $r->customer ? [
                'id' => $r->customer->id,
                'name' => $r->customer->user?->name,
            ] : null,
            'agency' => $r->agency ? ['id' => $r->agency->id, 'name' => $r->agency->name] : null,
            'authorized_agency' => $r->authorizedAgency ? ['id' => $r->authorizedAgency->id, 'name' => $r->authorizedAgency->name] : null,
        ];
    }
}
