<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('reservations:expire')->everyMinute()->withoutOverlapping();

// Detect delayed recruitment files and announce ended warranties (Document 8).
Schedule::command('workflow:maintain')->hourly()->withoutOverlapping();
