<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\ReservationAuthorizationException;
use App\Exceptions\WorkerNotAvailableException;
use App\Http\Controllers\Concerns\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreReservationRequest;
use App\Http\Resources\ReservationResource;
use App\Models\Agency;
use App\Models\Reservation;
use App\Models\Worker;
use App\Services\ReservationService;
use Illuminate\Http\Request;

class ReservationController extends Controller
{
    use ApiResponse;

    public function __construct(private readonly ReservationService $reservations)
    {
    }

    public function storeAsCustomer(StoreReservationRequest $request)
    {
        $user = $request->user();
        $customer = $user->customer;

        if (! $customer) {
            return $this->fail('لا يوجد حساب عميل مرتبط بهذا المستخدم.', null, 403);
        }

        $worker = Worker::findOrFail($request->integer('worker_id'));

        try {
            $reservation = $this->reservations->reserveByCustomer($worker, $customer, $user);
        } catch (WorkerNotAvailableException $e) {
            return $this->fail($e->getMessage(), null, 409);
        }

        return $this->success(new ReservationResource($reservation), 'تم حجز العاملة لمدة 24 ساعة', 201);
    }

    public function storeAsAgency(StoreReservationRequest $request)
    {
        $user = $request->user();
        $agencyUser = $user->agencyUsers()->first();

        if (! $agencyUser) {
            return $this->fail('لا يوجد مكتب مرتبط بهذا المستخدم.', null, 403);
        }

        $worker = Worker::findOrFail($request->integer('worker_id'));

        try {
            $reservation = $this->reservations->reserveByAgency($worker, $agencyUser->agency, $user);
        } catch (WorkerNotAvailableException $e) {
            return $this->fail($e->getMessage(), null, 409);
        }

        return $this->success(new ReservationResource($reservation), 'تم حجز العاملة لمدة 72 ساعة', 201);
    }

    public function convertToAgency(Request $request, Reservation $reservation)
    {
        $user = $request->user();
        $agencyUser = $user->agencyUsers()->first();

        if (! $agencyUser) {
            return $this->fail('لا يوجد مكتب مرتبط بهذا المستخدم.', null, 403);
        }

        try {
            $converted = $this->reservations->convertCustomerReservationToAgency($reservation, $agencyUser->agency, $user);
        } catch (WorkerNotAvailableException $e) {
            return $this->fail($e->getMessage(), null, 409);
        }

        return $this->success(new ReservationResource($converted), 'تم تحويل الحجز إلى المكتب لمدة 72 ساعة');
    }

    /**
     * Customer authorizes one approved Saudi agency for their active hold.
     */
    public function authorizeAgency(Request $request, Reservation $reservation)
    {
        $user = $request->user();
        $customer = $user->customer;

        if (! $customer || $reservation->customer_id !== $customer->id) {
            return $this->fail('لا تملك صلاحية على هذا الحجز.', null, 403);
        }

        $data = $request->validate(['agency_id' => ['required', 'integer', 'exists:agencies,id']]);
        $agency = Agency::findOrFail($data['agency_id']);

        try {
            $reservation = $this->reservations->authorizeAgency($reservation, $agency, $user);
        } catch (ReservationAuthorizationException $e) {
            return $this->fail($e->getMessage(), null, 422);
        }

        return $this->success(
            new ReservationResource($reservation->load(['worker', 'authorizedAgency'])),
            'تم تفويض المكتب، بانتظار موافقته'
        );
    }

    public function cancel(Request $request, Reservation $reservation)
    {
        $user = $request->user();

        // A customer may only cancel their own reservation.
        if ($user->customer && $reservation->customer_id !== $user->customer->id && ! $user->hasRole('employee', 'super_admin')) {
            return $this->fail('لا تملك صلاحية على هذا الحجز.', null, 403);
        }

        $this->reservations->cancel($reservation, $user);

        return $this->success(new ReservationResource($reservation->fresh()), 'تم إلغاء الحجز');
    }

    public function show(Request $request, Reservation $reservation)
    {
        return $this->success(new ReservationResource($reservation));
    }
}
