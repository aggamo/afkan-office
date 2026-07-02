<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\ApiResponse;
use App\Http\Controllers\Controller;
use App\Models\Review;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

/**
 * Customer reviews (Document 7): a customer may rate their recruitment once it
 * has been handed to / completed by an agency. Reviews are held for moderation.
 */
class CustomerReviewController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $customer = $request->user()->customer;
        if (! $customer) {
            return $this->fail('لا يوجد حساب عميل مرتبط بهذا المستخدم.', null, 403);
        }

        $reviews = Review::where('customer_id', $customer->id)
            ->with('agency:id,name')
            ->latest('id')
            ->get()
            ->map(fn (Review $r) => $this->present($r));

        return $this->success($reviews);
    }

    public function store(Request $request)
    {
        $customer = $request->user()->customer;
        if (! $customer) {
            return $this->fail('لا يوجد حساب عميل مرتبط بهذا المستخدم.', null, 403);
        }

        $data = $request->validate([
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'comment' => ['nullable', 'string', 'max:1000'],
        ]);

        // Eligibility: the customer must have gone through a recruitment (a
        // reservation that was handed to an agency or completed).
        $reservation = $customer->reservations()
            ->whereIn('status', ['converted', 'completed'])
            ->latest('id')
            ->first();

        if (! $reservation) {
            return $this->fail('يمكنك التقييم بعد بدء الاستقدام مع مكتب فقط.', null, 422);
        }

        $review = Review::create([
            'uuid' => (string) Str::uuid(),
            'customer_id' => $customer->id,
            'agency_id' => $reservation->agency_id ?? $reservation->authorized_agency_id,
            'rating' => $data['rating'],
            'comment' => $data['comment'] ?? null,
            'status' => 'pending',
        ]);

        return $this->success($this->present($review->load('agency:id,name')), 'تم إرسال تقييمك وسيظهر بعد المراجعة', 201);
    }

    private function present(Review $r): array
    {
        return [
            'id' => $r->id,
            'rating' => $r->rating,
            'comment' => $r->comment,
            'status' => $r->status,
            'agency' => $r->agency?->name,
            'created_at' => $r->created_at?->toIso8601String(),
        ];
    }
}
