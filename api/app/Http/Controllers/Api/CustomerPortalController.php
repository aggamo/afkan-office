<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Resources\ReservationResource;
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
