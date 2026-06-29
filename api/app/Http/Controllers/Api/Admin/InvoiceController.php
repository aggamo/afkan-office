<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Concerns\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreInvoiceRequest;
use App\Http\Resources\InvoiceResource;
use App\Models\Agency;
use App\Models\Invoice;
use App\Models\Reservation;
use App\Models\Worker;
use App\Services\InvoiceService;
use Illuminate\Http\Request;

class InvoiceController extends Controller
{
    use ApiResponse;

    private const RELATIONS = ['agency', 'worker'];

    public function __construct(private readonly InvoiceService $invoices = new InvoiceService())
    {
    }

    public function index(Request $request)
    {
        $query = Invoice::query()->with(self::RELATIONS);

        if ($request->filled('agency_id')) {
            $query->where('agency_id', $request->integer('agency_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        $perPage = min((int) $request->integer('per_page', 20), 100);
        $invoices = $query->latest('id')->paginate($perPage);

        return $this->success([
            'items' => InvoiceResource::collection($invoices->items()),
            'meta' => [
                'current_page' => $invoices->currentPage(),
                'per_page' => $invoices->perPage(),
                'total' => $invoices->total(),
                'last_page' => $invoices->lastPage(),
            ],
        ]);
    }

    public function store(StoreInvoiceRequest $request)
    {
        $worker = Worker::findOrFail($request->integer('worker_id'));
        $agency = Agency::findOrFail($request->integer('agency_id'));
        $reservation = $request->filled('reservation_id') ? Reservation::find($request->integer('reservation_id')) : null;

        $invoice = $this->invoices->createInvoice(
            $worker,
            $agency,
            $reservation,
            $request->filled('amount') ? (float) $request->input('amount') : null,
            $request->user(),
            $request->input('status', 'issued'),
            $request->input('notes'),
        );

        return $this->success(new InvoiceResource($invoice->load(self::RELATIONS)), 'تم إصدار الفاتورة بنجاح', 201);
    }

    public function show(Invoice $invoice)
    {
        return $this->success(new InvoiceResource($invoice->load(self::RELATIONS)));
    }

    public function markPaid(Request $request, Invoice $invoice)
    {
        $invoice = $this->invoices->markPaid($invoice, $request->user());

        return $this->success(new InvoiceResource($invoice->load(self::RELATIONS)), 'تم تسجيل دفع الفاتورة');
    }

    public function cancel(Request $request, Invoice $invoice)
    {
        $invoice = $this->invoices->cancel($invoice, $request->user());

        return $this->success(new InvoiceResource($invoice->load(self::RELATIONS)), 'تم إلغاء الفاتورة');
    }
}
