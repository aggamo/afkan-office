<?php

namespace App\Services;

use App\Exceptions\MissingWorkerPriceException;
use App\Models\Agency;
use App\Models\Invoice;
use App\Models\Reservation;
use App\Models\User;
use App\Models\Worker;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class InvoiceService
{
    public function __construct(private readonly NotificationService $notifications = new NotificationService())
    {
    }

    public function createInvoice(
        Worker $worker,
        Agency $agency,
        ?Reservation $reservation = null,
        ?float $amount = null,
        ?User $actor = null,
        string $status = 'issued',
        ?string $notes = null,
    ): Invoice {
        return DB::transaction(function () use ($worker, $agency, $reservation, $amount, $actor, $status, $notes) {
            $amount ??= $worker->price !== null ? (float) $worker->price : null;

            if ($amount === null) {
                throw new MissingWorkerPriceException();
            }

            $invoice = Invoice::create([
                'uuid' => (string) Str::uuid(),
                'invoice_number' => $this->generateInvoiceNumber(),
                'agency_id' => $agency->id,
                'worker_id' => $worker->id,
                'reservation_id' => $reservation?->id,
                'amount' => $amount,
                'currency' => $worker->price_currency ?? 'SAR',
                'status' => $status,
                'issued_at' => $status === 'draft' ? null : now(),
                'notes' => $notes,
                'created_by' => $actor?->id,
            ]);

            $this->notifications->notifyInvoiceEvent($invoice, 'invoice.created', [
                'ar' => 'تم إصدار فاتورة جديدة',
                'en' => 'A new invoice has been issued',
                'am' => 'አዲስ ደረሰኝ ወጥቷል',
            ], [
                'ar' => "تم إصدار فاتورة رقم {$invoice->invoice_number} بمبلغ {$invoice->amount} {$invoice->currency}.",
                'en' => "Invoice {$invoice->invoice_number} for {$invoice->amount} {$invoice->currency} has been issued.",
                'am' => "ደረሰኝ {$invoice->invoice_number} በ{$invoice->amount} {$invoice->currency} ወጥቷል።",
            ]);

            return $invoice;
        });
    }

    public function markPaid(Invoice $invoice, ?User $actor = null): Invoice
    {
        return DB::transaction(function () use ($invoice, $actor) {
            $invoice = Invoice::where('id', $invoice->id)->lockForUpdate()->firstOrFail();

            $invoice->update(['status' => 'paid', 'paid_at' => now()]);

            $this->notifications->notifyInvoiceEvent($invoice, 'invoice.paid', [
                'ar' => 'تم تسجيل دفع الفاتورة',
                'en' => 'Invoice marked as paid',
                'am' => 'ደረሰኝ እንደተከፈለ ተመልክቷል',
            ], [
                'ar' => "تم تسجيل دفع الفاتورة رقم {$invoice->invoice_number}.",
                'en' => "Invoice {$invoice->invoice_number} has been marked as paid.",
                'am' => "ደረሰኝ {$invoice->invoice_number} እንደተከፈለ ተመልክቷል።",
            ]);

            return $invoice;
        });
    }

    public function cancel(Invoice $invoice, ?User $actor = null, string $reason = 'إلغاء يدوي'): Invoice
    {
        return DB::transaction(function () use ($invoice, $actor, $reason) {
            $invoice = Invoice::where('id', $invoice->id)->lockForUpdate()->firstOrFail();

            $invoice->update(['status' => 'cancelled', 'notes' => trim(($invoice->notes ? $invoice->notes . ' | ' : '') . $reason)]);

            $this->notifications->notifyInvoiceEvent($invoice, 'invoice.cancelled', [
                'ar' => 'تم إلغاء الفاتورة',
                'en' => 'Invoice cancelled',
                'am' => 'ደረሰኝ ተሰርዟል',
            ]);

            return $invoice;
        });
    }

    public function generateInvoiceNumber(): string
    {
        $prefix = 'INV-' . now()->format('Ym') . '-';

        do {
            $candidate = $prefix . Str::upper(Str::random(6));
        } while (Invoice::where('invoice_number', $candidate)->exists());

        return $candidate;
    }
}
