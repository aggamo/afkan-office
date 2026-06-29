<?php

namespace App\Console\Commands;

use App\Services\ReservationService;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('reservations:expire')]
#[Description('Expire active reservations past their deadline and return workers to available')]
class ExpireReservationsCommand extends Command
{
    public function handle(ReservationService $service): int
    {
        $count = $service->expireDueReservations();

        $this->info("تم إنهاء {$count} حجز/حجوزات منتهية الصلاحية.");

        return self::SUCCESS;
    }
}
