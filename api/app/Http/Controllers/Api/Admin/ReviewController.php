<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Concerns\ApiResponse;
use App\Http\Controllers\Controller;
use App\Models\Review;
use Illuminate\Http\Request;

/**
 * Review moderation (Document 7 / BR: reviews visible only after moderation).
 */
class ReviewController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $reviews = Review::query()
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->with(['agency:id,name', 'customer.user:id,name'])
            ->latest('id')
            ->get()
            ->map(fn (Review $r) => [
                'id' => $r->id,
                'rating' => $r->rating,
                'comment' => $r->comment,
                'status' => $r->status,
                'agency' => $r->agency?->name,
                'customer' => $r->customer?->user?->name,
                'created_at' => $r->created_at?->toIso8601String(),
            ]);

        return $this->success($reviews);
    }

    public function moderate(Request $request, Review $review)
    {
        $data = $request->validate(['status' => ['required', 'in:approved,rejected']]);

        $review->update([
            'status' => $data['status'],
            'moderated_by' => $request->user()->id,
            'moderated_at' => now(),
        ]);

        return $this->success(['id' => $review->id, 'status' => $review->status], 'تم تحديث حالة التقييم');
    }
}
