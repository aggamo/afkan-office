<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Concerns\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\UploadWorkerDocumentRequest;
use App\Http\Resources\WorkerDocumentResource;
use App\Models\DocumentType;
use App\Models\Worker;
use App\Models\WorkerDocument;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class WorkerDocumentController extends Controller
{
    use ApiResponse;

    public function store(UploadWorkerDocumentRequest $request, Worker $worker)
    {
        $file = $request->file('file');
        $path = $file->store('worker-documents/'.$worker->id, 'local');

        $document = WorkerDocument::create([
            'uuid' => (string) Str::uuid(),
            'worker_id' => $worker->id,
            'document_type_id' => $request->integer('document_type_id'),
            'file_path' => $path,
            'file_hash' => hash_file('sha256', $file->getRealPath()),
            'issued_at' => $request->date('issued_at'),
            'expires_at' => $request->date('expires_at'),
            'uploaded_by' => $request->user()->id,
        ]);

        return $this->success(new WorkerDocumentResource($document->load('documentType')), 'تم رفع الوثيقة بنجاح', 201);
    }

    public function download(Request $request, WorkerDocument $workerDocument)
    {
        $documentType = DocumentType::find($workerDocument->document_type_id);

        if (! $documentType?->is_public && ! $request->user()?->hasRole('employee', 'super_admin')) {
            abort(403, 'لا تملك صلاحية الوصول إلى هذه الوثيقة.');
        }

        if (! Storage::disk('local')->exists($workerDocument->file_path)) {
            abort(404, 'الوثيقة غير موجودة.');
        }

        return Storage::disk('local')->download($workerDocument->file_path);
    }

    public function destroy(WorkerDocument $workerDocument)
    {
        $workerDocument->delete();

        return $this->success(null, 'تم حذف الوثيقة');
    }
}
