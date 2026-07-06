<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Resources\ReservationResource;
use App\Services\RecruitmentWorkflowService;
use Illuminate\Http\Request;

/**
 * Customer Portal read endpoints (Document 7): dashboard summary, the
 * customer's own reservations, and profile. All data is strictly scoped to
 * the authenticated customer.
 */
class CustomerPortalController extends Controller
{
    use ApiResponse;

    public function dashboard(Request $request)
    {
        $user = $request->user();
        $customer = $user->customer;

        if (! $customer) {
            return $this->fail('لا يوجد حساب عميل مرتبط بهذا المستخدم.', null, 403);
        }

        $reservations = $customer->reservations();

        return $this->success([
            'active_reservations' => (clone $reservations)->where('status', 'active')->count(),
            'pending_authorization' => (clone $reservations)->where('status', 'active')
                ->where('authorization_status', 'pending')->count(),
            'in_recruitment' => (clone $reservations)->where('status', 'converted')->count(),
            'completed' => (clone $reservations)->where('status', 'completed')->count(),
            'favorites' => $user->favoriteWorkers()->count(),
        ]);
    }

    public function reservations(Request $request)
    {
        $user = $request->user();
        $customer = $user->customer;

        if (! $customer) {
            return $this->fail('لا يوجد حساب عميل مرتبط بهذا المستخدم.', null, 403);
        }

        $reservations = $customer->reservations()
            ->with(['worker.nationality', 'authorizedAgency'])
            ->latest('id')
            ->get();

        return $this->success(ReservationResource::collection($reservations));
    }

    /**
     * "My Recruitment" — the workflow status of the worker the customer is
     * currently recruiting (their handed-over or active reservation). Only
     * public-safe, customer-facing fields are returned.
     */
    public function recruitment(Request $request, RecruitmentWorkflowService $workflow)
    {
        $user = $request->user();
        $customer = $user->customer;

        if (! $customer) {
            return $this->fail('لا يوجد حساب عميل مرتبط بهذا المستخدم.', null, 403);
        }

        $reservation = $customer->reservations()
            ->whereIn('status', ['converted', 'active', 'completed'])
            ->with(['worker.currentRecruitmentStage', 'authorizedAgency', 'agency'])
            ->orderByRaw("CASE status WHEN 'converted' THEN 0 WHEN 'active' THEN 1 ELSE 2 END")
            ->latest('id')
            ->first();

        if (! $reservation || ! $reservation->worker) {
            return $this->success(null);
        }

        $worker = $reservation->worker;
        $agency = $reservation->agency ?? $reservation->authorizedAgency;

        return $this->success([
            'worker' => [
                'internal_number' => $worker->internal_number,
                'tracking_number' => $worker->tracking_number,
                'full_name' => ['ar' => $worker->full_name_ar, 'en' => $worker->full_name_en, 'am' => $worker->full_name_am],
            ],
            'agency' => $agency ? ['name' => $agency->name, 'city' => $agency->city] : null,
            'reservation_status' => $reservation->status,
            'progress' => $workflow->progress($worker),
            'current_stage' => $worker->currentRecruitmentStage ? [
                'name' => [
                    'ar' => $worker->currentRecruitmentStage->name_ar,
                    'en' => $worker->currentRecruitmentStage->name_en,
                    'am' => $worker->currentRecruitmentStage->name_am,
                ],
            ] : null,
            'eta' => $workflow->eta($worker),
            'timeline' => $workflow->timeline($worker, publicOnly: true),
        ]);
    }

    public function profile(Request $request)
    {
        $user = $request->user();
        $customer = $user->customer;

        if (! $customer) {
            return $this->fail('لا يوجد حساب عميل مرتبط بهذا المستخدم.', null, 403);
        }

        return $this->success([
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'national_id' => $customer->national_id,
            'country' => $customer->country,
            'city' => $customer->city,
        ]);
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();
        $customer = $user->customer;

        if (! $customer) {
            return $this->fail('لا يوجد حساب عميل مرتبط بهذا المستخدم.', null, 403);
        }

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:30'],
            'preferred_language' => ['sometimes', 'nullable', 'in:ar,en,am'],
            'country' => ['sometimes', 'nullable', 'string', 'max:100'],
            'city' => ['sometimes', 'nullable', 'string', 'max:100'],
        ]);

        $user->fill(array_intersect_key($data, array_flip(['name', 'phone', 'preferred_language'])))->save();
        $customer->fill(array_intersect_key($data, array_flip(['country', 'city'])))->save();

        return $this->success(null, 'تم تحديث الملف الشخصي');
    }
}
