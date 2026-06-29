<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\NotificationChannel;
use App\Models\Reservation;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class NotificationService
{
    /**
     * Record (and, for the in_app channel, immediately "deliver") a
     * notification for a user. Real SMS/email/WhatsApp dispatch is not
     * wired to a provider yet; rows are persisted as pending for those
     * channels so a queued dispatcher can pick them up later.
     */
    public function send(User $user, string $event, array $titles, array $bodies = [], ?Model $notifiable = null, string $channelSlug = 'in_app'): Notification
    {
        $channel = NotificationChannel::where('slug', $channelSlug)->where('is_active', true)->first();

        return Notification::create([
            'uuid' => (string) Str::uuid(),
            'user_id' => $user->id,
            'notification_channel_id' => $channel?->id,
            'event' => $event,
            'title_ar' => $titles['ar'],
            'title_en' => $titles['en'],
            'title_am' => $titles['am'],
            'body_ar' => $bodies['ar'] ?? null,
            'body_en' => $bodies['en'] ?? null,
            'body_am' => $bodies['am'] ?? null,
            'notifiable_type' => $notifiable ? $notifiable::class : null,
            'notifiable_id' => $notifiable?->getKey(),
            'status' => $channelSlug === 'in_app' ? 'sent' : 'pending',
            'sent_at' => $channelSlug === 'in_app' ? now() : null,
        ]);
    }

    /**
     * Resolve the user who should be notified about a reservation: the
     * customer account holder, or the agency's primary contact.
     */
    public function resolveReservationRecipient(Reservation $reservation): ?User
    {
        if ($reservation->reserved_by_type === 'customer') {
            return $reservation->customer?->user;
        }

        $primaryContact = $reservation->agency?->agencyUsers()->where('is_primary_contact', true)->first()
            ?? $reservation->agency?->agencyUsers()->first();

        return $primaryContact?->user;
    }

    public function notifyReservationEvent(Reservation $reservation, string $event, array $titles, array $bodies = []): ?Notification
    {
        $user = $this->resolveReservationRecipient($reservation);

        if (! $user) {
            return null;
        }

        return $this->send($user, $event, $titles, $bodies, $reservation);
    }
}
