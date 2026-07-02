<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\ApiResponse;
use App\Http\Controllers\Controller;
use App\Models\CustomerDocument;
use App\Services\DocumentScanner;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Customer document management (Document 7): upload, list, download and delete
 * a customer's own identity/supporting documents. Files are validated and
 * "scanned" before storage, kept on the private disk, and served only to the
 * owning customer through a brokered route. Every action is audit-logged.
 */
class CustomerDocumentController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $customer = $request->user()->customer;
        if (! $customer) {
            return $this->fail('لا يوجد حساب عميل مرتبط بهذا المستخدم.', null, 403);
        }

        $documents = CustomerDocument::where('customer_id', $customer->id)
            ->latest('id')
            ->get(['id', 'uuid', 'category', 'original_name', 'mime_type', 'size', 'status', 'created_at']);

        return $this->success($documents);
    }

    public function store(Request $request, DocumentScanner $scanner)
    {
        $customer = $request->user()->customer;
        if (! $customer) {
            return $this->fail('لا يوجد حساب عميل مرتبط بهذا المستخدم.', null, 403);
        }

        $request->validate([
            'category' => ['required', 'in:passport,national_id,family,other'],
            'file' => ['required', 'file', 'max:5120', 'mimes:pdf,jpg,jpeg,png,webp'],
        ]);

        $file = $request->file('file');

        $result = $scanner->scan($file);
        if (! $result['safe']) {
            return $this->fail($result['reason'] ?? 'تعذّر قبول الملف.', null, 422);
        }

        $path = $file->store('customer-documents/'.$customer->id, 'local');

        $document = CustomerDocument::create([
            'uuid' => (string) Str::uuid(),
            'customer_id' => $customer->id,
            'category' => $request->string('category'),
            'original_name' => $file->getClientOriginalName(),
            'file_path' => $path,
            'file_hash' => hash_file('sha256', $file->getRealPath()),
            'mime_type' => $file->getMimeType(),
            'size' => $file->getSize(),
            'status' => 'pending',
            'uploaded_by' => $request->user()->id,
        ]);

        return $this->success(
            $document->only(['id', 'uuid', 'category', 'original_name', 'mime_type', 'size', 'status', 'created_at']),
            'تم رفع الوثيقة بنجاح',
            201
        );
    }

    public function download(Request $request, CustomerDocument $customerDocument)
    {
        $customer = $request->user()->customer;
        if (! $customer || $customerDocument->customer_id !== $customer->id) {
            abort(403, 'لا تملك صلاحية الوصول إلى هذه الوثيقة.');
        }

        if (! Storage::disk('local')->exists($customerDocument->file_path)) {
            abort(404, 'الوثيقة غير موجودة.');
        }

        return Storage::disk('local')->download($customerDocument->file_path, $customerDocument->original_name);
    }

    public function destroy(Request $request, CustomerDocument $customerDocument)
    {
        $customer = $request->user()->customer;
        if (! $customer || $customerDocument->customer_id !== $customer->id) {
            return $this->fail('لا تملك صلاحية على هذه الوثيقة.', null, 403);
        }

        $customerDocument->delete();

        return $this->success(null, 'تم حذف الوثيقة');
    }
}
