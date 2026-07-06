<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Concerns\ApiResponse;
use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Message;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Staff support inbox (Document 9): list customer conversation threads and
 * reply to a customer. Every customer thread is visible to support staff.
 */
class MessageController extends Controller
{
    use ApiResponse;

    public function __construct(private readonly NotificationService $notifications = new NotificationService())
    {
    }

    public function index()
    {
        // Customers who have at least one message, with last activity + unread count.
        $threads = Customer::query()
            ->whereHas('messages')
            ->with(['user:id,name,email'])
            ->withCount(['messages as unread_count' => fn ($q) => $q->where('is_from_staff', false)->whereNull('read_at')])
            ->get()
            ->map(function (Customer $customer) {
                $last = Message::where('customer_id', $customer->id)->latest('created_at')->first();

                return [
                    'customer_id' => $customer->id,
                    'name' => $customer->user?->name ?? $customer->user?->email,
                    'unread' => (int) $customer->unread_count,
                    'last_body' => $last?->body,
                    'last_at' => $last?->created_at?->toIso8601String(),
                ];
            })
            ->sortByDesc('last_at')
            ->values();

        return $this->success($threads);
    }

    public function show(Customer $customer)
    {
        Message::where('customer_id', $customer->id)
            ->where('is_from_staff', false)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        $messages = Message::where('customer_id', $customer->id)
            ->with('sender:id,name')
            ->orderBy('created_at')
            ->get()
            ->map(fn (Message $m) => $this->present($m));

        return $this->success([
            'customer' => ['id' => $customer->id, 'name' => $customer->user?->name ?? $customer->user?->email],
            'messages' => $messages,
        ]);
    }

    public function store(Request $request, Customer $customer)
    {
        $data = $request->validate(['body' => ['required', 'string', 'max:2000']]);

        $message = Message::create([
            'uuid' => (string) Str::uuid(),
            'customer_id' => $customer->id,
            'sender_id' => $request->user()->id,
            'is_from_staff' => true,
            'body' => $data['body'],
        ]);

        if ($customer->user) {
            $this->notifications->send($customer->user, 'message.received', [
                'ar' => 'رد جديد من الدعم',
                'en' => 'New reply from support',
                'am' => 'ከድጋፍ አዲስ ምላሽ',
            ], [
                'ar' => 'لديك رد جديد من فريق الدعم.',
                'en' => 'You have a new reply from the support team.',
                'am' => 'ከድጋፍ ቡድን አዲስ ምላሽ አለዎት።',
            ]);
        }

        return $this->success($this->present($message->load('sender:id,name')), 'تم إرسال الرد', 201);
    }

    private function present(Message $m): array
    {
        return [
            'id' => $m->id,
            'body' => $m->body,
            'is_from_staff' => $m->is_from_staff,
            'sender' => $m->sender?->name,
            'created_at' => $m->created_at?->toIso8601String(),
        ];
    }
}
