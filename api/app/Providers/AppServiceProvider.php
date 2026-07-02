<?php

namespace App\Providers;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Point password-reset links at the SPA rather than a backend route,
        // so the emailed URL lands on the reset form the user actually sees.
        ResetPassword::createUrlUsing(function (object $notifiable, string $token) {
            $base = rtrim((string) env('FRONTEND_URL', 'http://localhost:3000'), '/');
            $email = urlencode($notifiable->getEmailForPasswordReset());

            return "{$base}/reset-password?token={$token}&email={$email}";
        });
    }
}
