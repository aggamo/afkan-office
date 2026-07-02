<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Concerns\ApiResponse;
use App\Http\Controllers\Controller;
use App\Models\Reservation;
use App\Models\Review;
use App\Models\Worker;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * CSV exports (Documents 8 & 9). Dependency-free streamed CSV so it works on
 * shared hosting; sensitive fields (passport, price) are never included.
 */
class ExportController extends Controller
{
    use ApiResponse;

    public function csv(Request $request, string $resource): StreamedResponse
    {
        [$headers, $rows] = match ($resource) {
            'workers' => $this->workers(),
            'reservations' => $this->reservations(),
            'reviews' => $this->reviews(),
            default => abort(404, 'نوع التصدير غير معروف.'),
        };

        $filename = "afkan-{$resource}-".now()->format('Ymd-His').'.csv';

        return response()->streamDownload(function () use ($headers, $rows) {
            $out = fopen('php://output', 'w');
            // UTF-8 BOM so Excel renders Arabic correctly.
            fwrite($out, "\xEF\xBB\xBF");
            fputcsv($out, $headers);
            foreach ($rows as $row) {
                fputcsv($out, $row);
            }
            fclose($out);
        }, $filename, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    private function workers(): array
    {
        $headers = ['internal_number', 'tracking_number', 'full_name_en', 'nationality', 'reservation_status', 'current_stage', 'is_published'];
        $rows = Worker::query()
            ->with(['nationality:id,name_en', 'currentRecruitmentStage:id,name_en'])
            ->orderBy('id')
            ->get()
            ->map(fn (Worker $w) => [
                $w->internal_number,
                $w->tracking_number,
                $w->full_name_en,
                $w->nationality?->name_en,
                $w->reservation_status,
                $w->currentRecruitmentStage?->name_en,
                $w->is_published ? 'yes' : 'no',
            ]);

        return [$headers, $rows];
    }

    private function reservations(): array
    {
        $headers = ['id', 'worker', 'type', 'status', 'authorization_status', 'reserved_at', 'expires_at'];
        $rows = Reservation::query()
            ->with('worker:id,internal_number')
            ->orderBy('id')
            ->get()
            ->map(fn (Reservation $r) => [
                $r->id,
                $r->worker?->internal_number,
                $r->reserved_by_type,
                $r->status,
                $r->authorization_status,
                $r->reserved_at?->toDateTimeString(),
                $r->expires_at?->toDateTimeString(),
            ]);

        return [$headers, $rows];
    }

    private function reviews(): array
    {
        $headers = ['id', 'customer', 'agency', 'rating', 'status', 'created_at'];
        $rows = Review::query()
            ->with(['customer.user:id,name', 'agency:id,name'])
            ->orderBy('id')
            ->get()
            ->map(fn (Review $r) => [
                $r->id,
                $r->customer?->user?->name,
                $r->agency?->name,
                $r->rating,
                $r->status,
                $r->created_at?->toDateTimeString(),
            ]);

        return [$headers, $rows];
    }
}
