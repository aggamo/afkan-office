<?php

namespace App\Services;

use App\Exceptions\WorkerNotAvailableException;
use App\Models\Agency;
use App\Models\Customer;
use App\Models\Reservation;
use App\Models\ReservationHistory;
use App\Models\User;
use App\Models\Worker;
use App\Services\InvoiceService;
use App\Services\NotificationService;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ReservationService
{
    public const CUSTOMER_HOLD_HOURS = 24;
    public const AGENCY_HOLD_HOURS = 72;

    public function __construct(
        private readonly NotificationService $notifications = new NotificationService(),
        private readonly InvoiceService $invoices = new InvoiceService(),
    ) {
    }

    /**
     * An individual customer reserves a worker for 24 hours.
     */
    public function reserveByCustomer(Worker $worker, Customer $customer, ?User $actor = null): Reservation
    {
        return DB::transaction(function () use ($worker, $customer, $actor) {
            $worker = Worker::where('id', $worker->id)->lockForUpdate()->firstOrFail();
            $this->assertAvailable($worker);

            $reservation = Reservation::create([
                'uuid' => (string) Str::uuid(),
                'worker_id' => $worker->id,
                'reserved_by_type' => 'customer',
                'customer_id' => $customer->id,
                'status' => 'active',
                'reserved_at' => now(),
                'expires_at' => now()->addHours(self::CUSTOMER_HOLD_HOURS),
                'created_by' => $actor?->id,
            ]);

            $worker->update(['reservation_status' => 'reserved_customer']);

            $this->logHistory($reservation, null, 'active', $actor, 'حجز عميل جديد');

            $this->notifications->notifyReservationEvent($reservation, 'reservation.created', [
                'ar' => 'تم حجز العاملة بنجاح',
                'en' => 'Worker reserved successfully',
                'am' => 'ሰራተኛው በተሳካ ሁኔታ ተይዟል',
            ], [
                'ar' => 'لديك 24 ساعة لإتمام الإجراءات قبل انتهاء الحجز.',
                'en' => 'You have 24 hours to complete the process before the hold expires.',
                'am' => 'ቦታ ማስያዝ ከማብቃቱ በፊት ሂደቱን ለማጠናቀቅ 24 ሰዓታት አሉዎት።',
            ]);

            return $reservation;
        });
    }

    /**
     * A Saudi agency reserves a worker directly for 72 hours.
     */
    public function reserveByAgency(Worker $worker, Agency $agency, ?User $actor = null): Reservation
    {
        return DB::transaction(function () use ($worker, $agency, $actor) {
            $worker = Worker::where('id', $worker->id)->lockForUpdate()->firstOrFail();
            $this->assertAvailable($worker);

            $reservation = Reservation::create([
                'uuid' => (string) Str::uuid(),
                'worker_id' => $worker->id,
                'reserved_by_type' => 'agency',
                'agency_id' => $agency->id,
                'status' => 'active',
                'reserved_at' => now(),
                'expires_at' => now()->addHours(self::AGENCY_HOLD_HOURS),
                'created_by' => $actor?->id,
            ]);

            $worker->update(['reservation_status' => 'reserved_agency']);

            $this->logHistory($reservation, null, 'active', $actor, 'حجز مكتب مباشر');

            $this->notifications->notifyReservationEvent($reservation, 'reservation.created', [
                'ar' => 'تم حجز العاملة لمكتبكم بنجاح',
                'en' => 'Worker reserved for your agency successfully',
                'am' => 'ሰራተኛው ለኤጀንሲዎ በተሳካ ሁኔታ ተይዟል',
            ], [
                'ar' => 'لديكم 72 ساعة لإتمام الإجراءات قبل انتهاء الحجز.',
                'en' => 'You have 72 hours to complete the process before the hold expires.',
                'am' => 'ቦታ ማስያዝ ከማብቃቱ በፊት ሂደቱን ለማጠናቀቅ 72 ሰዓታት አሎት።',
            ]);

            return $reservation;
        });
    }

    /**
     * An agency accepts a customer's request on a worker that is currently
     * customer-reserved: the existing reservation converts into a fresh
     * 72-hour agency reservation rather than requiring the worker to free up.
     */
    public function convertCustomerReservationToAgency(Reservation $customerReservation, Agency $agency, ?User $actor = null): Reservation
    {
        return DB::transaction(function () use ($customerReservation, $agency, $actor) {
            $customerReservation = Reservation::where('id', $customerReservation->id)->lockForUpdate()->firstOrFail();

            if ($customerReservation->status !== 'active' || $customerReservation->reserved_by_type !== 'customer') {
                throw new WorkerNotAvailableException('لا يمكن تحويل هذا الحجز، فهو غير نشط أو ليس حجز عميل.');
            }

            $worker = Worker::where('id', $customerReservation->worker_id)->lockForUpdate()->firstOrFail();

            $customerReservation->update([
                'status' => 'converted',
                'resolved_at' => now(),
            ]);
            $this->logHistory($customerReservation, 'active', 'converted', $actor, 'تم التحويل إلى حجز مكتب');

            $this->notifications->notifyReservationEvent($customerReservation, 'reservation.converted', [
                'ar' => 'تم تحويل حجزك إلى مكتب التوظيف',
                'en' => 'Your reservation has been transferred to an agency',
                'am' => 'ቦታ ማስያዝዎ ለኤጀንሲ ተላልፏል',
            ]);

            $agencyReservation = Reservation::create([
                'uuid' => (string) Str::uuid(),
                'worker_id' => $worker->id,
                'reserved_by_type' => 'agency',
                'agency_id' => $agency->id,
                'converted_from_reservation_id' => $customerReservation->id,
                'status' => 'active',
                'reserved_at' => now(),
                'expires_at' => now()->addHours(self::AGENCY_HOLD_HOURS),
                'created_by' => $actor?->id,
            ]);
            $this->logHistory($agencyReservation, null, 'active', $actor, 'حجز مكتب ناتج عن تحويل');

            $this->notifications->notifyReservationEvent($agencyReservation, 'reservation.created', [
                'ar' => 'تم تحويل العاملة إلى مكتبكم بنجاح',
                'en' => 'Worker transferred to your agency successfully',
                'am' => 'ሰራተኛው ለኤጀንሲዎ በተሳካ ሁኔታ ተላልፏል',
            ]);

            $worker->update(['reservation_status' => 'reserved_agency']);

            return $agencyReservation;
        });
    }

    public function cancel(Reservation $reservation, ?User $actor = null, string $reason = 'إلغاء يدوي'): Reservation
    {
        return DB::transaction(function () use ($reservation, $actor, $reason) {
            $reservation = Reservation::where('id', $reservation->id)->lockForUpdate()->firstOrFail();

            if ($reservation->status !== 'active') {
                return $reservation;
            }

            $reservation->update(['status' => 'cancelled', 'resolved_at' => now()]);
            $this->logHistory($reservation, 'active', 'cancelled', $actor, $reason);

            $this->notifications->notifyReservationEvent($reservation, 'reservation.cancelled', [
                'ar' => 'تم إلغاء الحجز',
                'en' => 'Reservation cancelled',
                'am' => 'ቦታ ማስያዝ ተሰርዟል',
            ]);

            $this->revertWorkerToAvailable($reservation->worker_id);

            return $reservation;
        });
    }

    /**
     * Complete a reservation (worker hired). For agency reservations, an
     * invoice is auto-issued by default since this is the closest concrete
     * "worker delivered" event in the system; staff can also always create
     * invoices manually at any other time via the InvoiceService directly.
     */
    public function complete(Reservation $reservation, ?User $actor = null, bool $autoInvoice = true): Reservation
    {
        return DB::transaction(function () use ($reservation, $actor, $autoInvoice) {
            $reservation = Reservation::where('id', $reservation->id)->lockForUpdate()->firstOrFail();

            $reservation->update(['status' => 'completed', 'resolved_at' => now()]);
            $this->logHistory($reservation, 'active', 'completed', $actor, 'تم إتمام التوظيف');

            $worker = Worker::where('id', $reservation->worker_id)->lockForUpdate()->firstOrFail();
            $worker->update(['reservation_status' => 'hired']);

            if ($autoInvoice && $reservation->reserved_by_type === 'agency' && $reservation->agency_id && $worker->price !== null) {
                $this->invoices->createInvoice($worker, $reservation->agency, $reservation, null, $actor);
            }

            return $reservation;
        });
    }

    /**
     * Expire every reservation whose deadline has passed and return workers
     * to "available". Intended to be invoked by the scheduled command.
     */
    public function expireDueReservations(): int
    {
        $expired = 0;

        Reservation::where('status', 'active')
            ->where('expires_at', '<=', Carbon::now())
            ->get()
            ->each(function (Reservation $reservation) use (&$expired) {
                DB::transaction(function () use ($reservation) {
                    $reservation = Reservation::where('id', $reservation->id)->lockForUpdate()->first();

                    if (! $reservation || $reservation->status !== 'active') {
                        return;
                    }

                    $reservation->update(['status' => 'expired', 'resolved_at' => now()]);
                    $this->logHistory($reservation, 'active', 'expired', null, 'انتهت المدة الزمنية للحجز تلقائياً');

                    $this->notifications->notifyReservationEvent($reservation, 'reservation.expired', [
                        'ar' => 'انتهت مدة الحجز',
                        'en' => 'Reservation hold expired',
                        'am' => 'ቦታ ማስያዝ ጊዜው አልፎበታል',
                    ]);

                    $this->revertWorkerToAvailable($reservation->worker_id);
                });

                $expired++;
            });

        return $expired;
    }

    private function assertAvailable(Worker $worker): void
    {
        if ($worker->reservation_status !== 'available' || ! $worker->is_active) {
            throw new WorkerNotAvailableException();
        }
    }

    private function revertWorkerToAvailable(int $workerId): void
    {
        Worker::where('id', $workerId)->update(['reservation_status' => 'available']);
    }

    private function logHistory(Reservation $reservation, ?string $from, string $to, ?User $actor, string $reason): void
    {
        ReservationHistory::create([
            'reservation_id' => $reservation->id,
            'from_status' => $from,
            'to_status' => $to,
            'changed_by' => $actor?->id,
            'reason' => $reason,
        ]);
    }
}
