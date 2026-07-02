<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Concerns\ApiResponse;
use App\Http\Controllers\Controller;
use App\Models\Agency;
use Illuminate\Http\Request;

/**
 * Staff management of Saudi agencies (Document 9): list all agencies (including
 * unverified ones), verify/suspend, and view basic performance. Only approved
 * (verified + active) agencies are selectable by customers.
 */
class AgencyController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $agencies = Agency::query()
            ->withCount([
                'workers',
                'reservations as active_reservations' => fn ($q) => $q->where('status', 'active'),
            ])
            ->when($request->filled('q'), function ($query) use ($request) {
                $term = '%'.$request->string('q').'%';
                $query->where(function ($q) use ($term) {
                    $q->where('name', 'like', $term)
                        ->orWhere('license_number', 'like', $term)
                        ->orWhere('city', 'like', $term);
                });
            })
            ->when($request->filled('status'), function ($query) use ($request) {
                match ($request->string('status')->value()) {
                    'verified' => $query->where('is_verified', true),
                    'pending' => $query->where('is_verified', false),
                    'suspended' => $query->where('is_active', false),
                    default => null,
                };
            })
            ->latest('id')
            ->get()
            ->map(fn (Agency $a) => $this->present($a));

        return $this->success($agencies);
    }

    public function update(Request $request, Agency $agency)
    {
        $data = $request->validate([
            'is_verified' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $agency->update($data);

        return $this->success($this->present($agency->loadCount([
            'workers',
            'reservations as active_reservations' => fn ($q) => $q->where('status', 'active'),
        ])), 'تم تحديث حالة المكتب');
    }

    private function present(Agency $a): array
    {
        return [
            'id' => $a->id,
            'name' => $a->name,
            'license_number' => $a->license_number,
            'country' => $a->country,
            'city' => $a->city,
            'phone' => $a->phone,
            'email' => $a->email,
            'rating' => (float) $a->rating,
            'completed_cases' => (int) $a->completed_cases,
            'is_verified' => (bool) $a->is_verified,
            'is_active' => (bool) $a->is_active,
            'workers_count' => (int) ($a->workers_count ?? 0),
            'active_reservations' => (int) ($a->active_reservations ?? 0),
            'created_at' => $a->created_at?->toIso8601String(),
        ];
    }
}
