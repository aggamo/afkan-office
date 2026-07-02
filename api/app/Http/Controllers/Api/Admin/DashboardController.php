<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Concerns\ApiResponse;
use App\Http\Controllers\Controller;
use App\Models\Agency;
use App\Models\AuditLog;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Reservation;
use App\Models\User;
use App\Models\Worker;
use App\Services\RecruitmentWorkflowService;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Aggregated statistics for the staff / management dashboard (Document 9).
 * All figures are computed live from operational data. Cards that depend on
 * the 17-stage recruitment workflow (medical/embassy/flights/warranty) are
 * intentionally deferred until that module (Task #27) exists.
 */
class DashboardController extends Controller
{
    use ApiResponse;

    private const FINANCE_CURRENCY = 'SAR';

    public function index(Request $request, RecruitmentWorkflowService $workflow)
    {
        return $this->success([
            'workers' => $this->workerStats(),
            'reservations' => $this->reservationStats(),
            'finance' => $this->financeStats(),
            'entities' => $this->entityStats(),
            'workflow' => $workflow->operationsOverview(),
            'charts' => [
                'worker_status' => $this->workerStatusDistribution(),
                'monthly' => $this->monthlyTrend(),
                'top_agencies' => $this->topAgencies(),
            ],
            'recent_activity' => $this->recentActivity(),
        ]);
    }

    /**
     * Recruitment performance analytics (Documents 8 & 9).
     */
    public function analytics(RecruitmentWorkflowService $workflow)
    {
        return $this->success($workflow->analytics());
    }

    /**
     * Paginated audit-log feed for the activity page (Doc 9 — Audit Log,
     * readable by staff, immutable).
     */
    public function activity(Request $request)
    {
        $perPage = min((int) $request->integer('per_page', 25), 100);

        $logs = AuditLog::query()
            ->with('user:id,name,email')
            ->when($request->filled('action'), fn ($q) => $q->where('action', 'like', '%'.$request->string('action').'%'))
            ->latest('id')
            ->paginate($perPage);

        return $this->success([
            'items' => collect($logs->items())->map(fn (AuditLog $log) => $this->presentLog($log)),
            'meta' => [
                'current_page' => $logs->currentPage(),
                'per_page' => $logs->perPage(),
                'total' => $logs->total(),
                'last_page' => $logs->lastPage(),
            ],
        ]);
    }

    private function workerStats(): array
    {
        $byStatus = Worker::query()
            ->groupBy('reservation_status')
            ->select('reservation_status', DB::raw('count(*) as aggregate'))
            ->pluck('aggregate', 'reservation_status');

        return [
            'total' => (int) $byStatus->sum(),
            'available' => (int) ($byStatus['available'] ?? 0),
            'reserved_customer' => (int) ($byStatus['reserved_customer'] ?? 0),
            'reserved_agency' => (int) ($byStatus['reserved_agency'] ?? 0),
            'hired' => (int) ($byStatus['hired'] ?? 0),
            'unavailable' => (int) ($byStatus['unavailable'] ?? 0),
            'published' => Worker::where('is_published', true)->count(),
            'unpublished' => Worker::where('is_published', false)->count(),
        ];
    }

    private function reservationStats(): array
    {
        $activeByType = Reservation::query()
            ->where('status', 'active')
            ->groupBy('reserved_by_type')
            ->select('reserved_by_type', DB::raw('count(*) as aggregate'))
            ->pluck('aggregate', 'reserved_by_type');

        $customerTotal = Reservation::where('reserved_by_type', 'customer')->count();
        $convertedTotal = Reservation::where('status', 'converted')->count();

        return [
            'active' => (int) $activeByType->sum(),
            'active_customer' => (int) ($activeByType['customer'] ?? 0),
            'active_agency' => (int) ($activeByType['agency'] ?? 0),
            'created_today' => Reservation::whereDate('reserved_at', Carbon::today())->count(),
            'expiring_today' => Reservation::where('status', 'active')
                ->whereBetween('expires_at', [Carbon::now(), Carbon::today()->endOfDay()])
                ->count(),
            'expired_total' => Reservation::where('status', 'expired')->count(),
            'converted_total' => $convertedTotal,
            'conversion_rate' => $customerTotal > 0 ? round(($convertedTotal / $customerTotal) * 100, 1) : 0.0,
        ];
    }

    private function financeStats(): array
    {
        return [
            'currency' => self::FINANCE_CURRENCY,
            'outstanding_count' => Invoice::where('status', 'issued')->count(),
            'outstanding_amount' => (float) Invoice::where('status', 'issued')->sum('amount'),
            'paid_this_month_count' => Invoice::where('status', 'paid')
                ->whereBetween('paid_at', [Carbon::now()->startOfMonth(), Carbon::now()->endOfMonth()])
                ->count(),
            'paid_this_month_amount' => (float) Invoice::where('status', 'paid')
                ->whereBetween('paid_at', [Carbon::now()->startOfMonth(), Carbon::now()->endOfMonth()])
                ->sum('amount'),
            'revenue_total' => (float) Invoice::where('status', 'paid')->sum('amount'),
            'draft_count' => Invoice::where('status', 'draft')->count(),
        ];
    }

    private function entityStats(): array
    {
        return [
            'agencies' => Agency::count(),
            'agencies_verified' => Agency::where('is_verified', true)->count(),
            'customers' => Customer::count(),
            'employees' => User::whereHas('role', fn ($q) => $q->whereIn('slug', ['employee', 'super_admin']))->count(),
        ];
    }

    private function workerStatusDistribution(): array
    {
        $statuses = ['available', 'reserved_customer', 'reserved_agency', 'hired', 'unavailable'];
        $counts = Worker::query()
            ->groupBy('reservation_status')
            ->select('reservation_status', DB::raw('count(*) as aggregate'))
            ->pluck('aggregate', 'reservation_status');

        return array_map(fn ($status) => [
            'key' => $status,
            'count' => (int) ($counts[$status] ?? 0),
        ], $statuses);
    }

    /**
     * Last 6 months of intake (workers created) and completed recruitments.
     * Month bucketing is done in PHP to stay database-agnostic (dev runs on
     * SQLite, production on MySQL) rather than relying on vendor date functions.
     */
    private function monthlyTrend(): array
    {
        $start = Carbon::now()->startOfMonth()->subMonths(5);

        $workersByMonth = Worker::query()
            ->where('created_at', '>=', $start)
            ->pluck('created_at')
            ->countBy(fn ($date) => Carbon::parse($date)->format('Y-m'));

        $completedByMonth = Reservation::query()
            ->where('status', 'completed')
            ->where('resolved_at', '>=', $start)
            ->pluck('resolved_at')
            ->countBy(fn ($date) => Carbon::parse($date)->format('Y-m'));

        $months = [];
        for ($i = 0; $i < 6; $i++) {
            $month = (clone $start)->addMonths($i);
            $key = $month->format('Y-m');
            $months[] = [
                'month' => $key,
                'workers_created' => (int) ($workersByMonth[$key] ?? 0),
                'completed' => (int) ($completedByMonth[$key] ?? 0),
            ];
        }

        return $months;
    }

    private function topAgencies(): array
    {
        return Agency::query()
            ->withCount([
                'reservations as active_reservations' => fn ($q) => $q->where('status', 'active'),
            ])
            ->orderByDesc('completed_cases')
            ->orderByDesc('active_reservations')
            ->limit(5)
            ->get(['id', 'name', 'completed_cases', 'rating'])
            ->map(fn (Agency $agency) => [
                'id' => $agency->id,
                'name' => $agency->name,
                'completed_cases' => (int) $agency->completed_cases,
                'rating' => (float) $agency->rating,
                'active_reservations' => (int) $agency->active_reservations,
            ])
            ->all();
    }

    private function recentActivity(int $limit = 8): array
    {
        return AuditLog::query()
            ->with('user:id,name,email')
            ->latest('id')
            ->limit($limit)
            ->get()
            ->map(fn (AuditLog $log) => $this->presentLog($log))
            ->all();
    }

    private function presentLog(AuditLog $log): array
    {
        return [
            'id' => $log->id,
            'action' => $log->action,
            'auditable_type' => class_basename((string) $log->auditable_type),
            'auditable_id' => $log->auditable_id,
            'user' => $log->user?->name ?? $log->user?->email,
            'ip_address' => $log->ip_address,
            'created_at' => $log->created_at?->toIso8601String(),
        ];
    }
}
