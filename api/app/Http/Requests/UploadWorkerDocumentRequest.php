<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UploadWorkerDocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'document_type_id' => ['required', 'integer', 'exists:document_types,id'],
            'file' => ['required', 'file', 'max:10240', 'mimes:pdf,jpg,jpeg,png'],
            'issued_at' => ['nullable', 'date'],
            'expires_at' => ['nullable', 'date'],
        ];
    }
}
