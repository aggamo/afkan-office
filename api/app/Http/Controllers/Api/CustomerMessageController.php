<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\ApiResponse;
use App\Http\Controllers\Controller;
use App\Models\Message;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

/**
 * Customer side of the support conversation (Document 7). The customer sees
 * only their own thread with Afkan support.
 */
class CustomerMessageController extends Controller
{
    use ApiResponse;

    public function __construct(private readonly NotificationService $notifications = new NotificationService())
    {
    }

    public function index(Request $request)
    {
        $customer = $request->user()->customer;
        if (! $customer) {
            return $this->fail('لا يوجد حساب عميل مرتبط بهذا المستخدم.', null, 403);
        }

        // Mark incoming (staff) messages as read.
        Message::where('customer_id', $customer->id)
            ->where('is_from_staff', true)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        $messages = Message::where('customer_id', $customer->id)
            ->with('sender:id,name')
            ->orderBy('created_at')
            ->get()
            ->map(fn (Message $m) => $this->present($m));

        return $this->success($messages);
    }

    public function store(Request $request)
    {
        $customer = $request->user()->customer;
        if (! $customer) {
            return $this->fail('لا يوجد حساب عميل مرتبط بهذا المستخدم.', null, 403);
        }

        $data = $request->validate(['body' => ['required', 'string', 'max:2000']]);

        $message = Message::create([
            'uuid' => (string) Str::uuid(),
            'customer_id' => $customer->id,
            'sender_id' => $request->user()->id,
            'is_from_staff' => false,
            'body' => $data['body'],
        ]);

        $this->notifyStaff($request->user()->name);

        return $this->success($this->present($message->load('sender:id,name')), 'تم إرسال الرسالة', 201);
    }

    private function notifyStaff(?string $customerName): void
    {
        $staff = User::whereHas('role', fn ($q) => $q->whereIn('slug', ['employee', 'super_admin']))->get();
        foreach ($staff as $user) {
            $this->notifications->send($user, 'message.received', [
                'ar' => 'رسالة جديدة من عميل',
                'en' => 'New message from a customer',
                'am' => 'ከደንበኛ አዲስ መልእክት',
            ], [
                'ar' => 'وصلت رسالة دعم جديدة'.($customerName ? ' من '.$customerName : '').'.',
                'en' => 'A new support message has arrived'.($customerName ? ' from '.$customerName : '').'.',
                'am' => 'አዲስ የድጋፍ መልእክት ደርሷል'.($customerName ? ' ከ '.$customerName : '').'።',
            ]);
        }
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
