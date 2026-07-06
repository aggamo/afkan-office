<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreInvoiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'agency_id' => ['required', 'integer', 'exists:agencies,id'],
            'worker_id' => ['required', 'integer', 'exists:workers,id'],
            'reservation_id' => ['nullable', 'integer', 'exists:reservations,id'],
            'amount' => ['nullable', 'numeric', 'min:0'],
            'status' => ['nullable', 'in:draft,issued'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
