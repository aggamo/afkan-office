<?php

namespace App\Http\Controllers\Api\Agency;

use App\Exceptions\ReservationAuthorizationException;
use App\Http\Controllers\Concerns\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Resources\ReservationResource;
use App\Models\Reservation;
use App\Services\ReservationService;
use Illuminate\Http\Request;

/**
 * Agency side of the customer → agency authorization workflow (Documents 6 & 7):
 * list pending customer requests directed at this agency, and accept or reject
 * them. Every action is scoped to the agency the acting user belongs to.
 */
class AuthorizationController extends Controller
{
    use ApiResponse;

    public function __construct(private readonly ReservationService $reservations)
    {
    }

    public function index(Request $request)
    {
        $agency = $this->resolveAgency($request);
        if (! $agency) {
            return $this->fail('لا يوجد مكتب مرتبط بهذا المستخدم.', null, 403);
        }

        $requests = Reservation::query()
            ->where('authorized_agency_id', $agency->id)
            ->where('authorization_status', 'pending')
            ->where('status', 'active')
            ->with(['worker.nationality', 'customer.user'])
            ->latest('authorized_at')
            ->get()
            ->map(fn (Reservation $reservation) => [
                'reservation' => new ReservationResource($reservation),
                'customer' => [
                    'name' => $reservation->customer?->user?->name,
                    'phone' => $reservation->customer?->user?->phone,
                    'country' => $reservation->customer?->country,
                    'city' => $reservation->customer?->city,
                ],
                'expires_at' => $reservation->expires_at?->toIso8601String(),
            ]);

        return $this->success($requests);
    }

    public function accept(Request $request, Reservation $reservation)
    {
        return $this->respond($request, $reservation, accept: true);
    }

    public function reject(Request $request, Reservation $reservation)
    {
        return $this->respond($request, $reservation, accept: false);
    }

    private function respond(Request $request, Reservation $reservation, bool $accept)
    {
        $agency = $this->resolveAgency($request);
        if (! $agency) {
            return $this->fail('لا يوجد مكتب مرتبط بهذا المستخدم.', null, 403);
        }

        try {
            $result = $accept
                ? $this->reservations->acceptAuthorization($reservation, $agency, $request->user())
                : $this->reservations->rejectAuthorization($reservation, $agency, $request->user());
        } catch (ReservationAuthorizationException $e) {
            return $this->fail($e->getMessage(), null, 422);
        }

        return $this->success(
            new ReservationResource($result->load(['worker', 'authorizedAgency'])),
            $accept ? 'تم قبول الطلب وتحويل الحجز لمكتبكم لمدة 72 ساعة' : 'تم رفض الطلب'
        );
    }

    private function resolveAgency(Request $request): ?\App\Models\Agency
    {
        return $request->user()->agencyUsers()->first()?->agency;
    }
}
