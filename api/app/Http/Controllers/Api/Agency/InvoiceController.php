<?php

namespace App\Http\Controllers\Api\Agency;

use App\Http\Controllers\Concerns\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Resources\InvoiceResource;
use App\Models\Invoice;
use Illuminate\Http\Request;

class InvoiceController extends Controller
{
    use ApiResponse;

    private const RELATIONS = ['agency', 'worker'];

    public function index(Request $request)
    {
        $agencyIds = $request->user()->agencyUsers()->pluck('agency_id');

        $query = Invoice::query()->with(self::RELATIONS)->whereIn('agency_id', $agencyIds);

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

    public function show(Request $request, Invoice $invoice)
    {
        $agencyIds = $request->user()->agencyUsers()->pluck('agency_id');

        if (! $agencyIds->contains($invoice->agency_id)) {
            return $this->fail('غير مصرح بالوصول إلى هذه الفاتورة', null, 403);
        }

        return $this->success(new InvoiceResource($invoice->load(self::RELATIONS)));
    }
}
