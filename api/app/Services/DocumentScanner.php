<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;

/**
 * Lightweight upload safety gate (Document 7 "virus scan / validation").
 *
 * This performs allowlist-based validation and rejects anything that is not a
 * genuine document/image. It is intentionally provider-agnostic: swap the body
 * of scan() for a real AV engine (e.g. ClamAV) without changing callers.
 */
class DocumentScanner
{
    private const ALLOWED_MIME = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/webp',
    ];

    private const BLOCKED_EXTENSIONS = [
        'exe', 'bat', 'cmd', 'sh', 'php', 'phtml', 'js', 'jar', 'msi', 'com', 'scr', 'vbs', 'html', 'htm',
    ];

    /**
     * @return array{safe: bool, reason: ?string}
     */
    public function scan(UploadedFile $file): array
    {
        $extension = strtolower($file->getClientOriginalExtension());
        if (in_array($extension, self::BLOCKED_EXTENSIONS, true)) {
            return ['safe' => false, 'reason' => 'نوع الملف غير مسموح به.'];
        }

        // Detect the real MIME from file contents (not the client-supplied type).
        $mime = $file->getMimeType();
        if (! in_array($mime, self::ALLOWED_MIME, true)) {
            return ['safe' => false, 'reason' => 'صيغة الملف غير مدعومة. المسموح: PDF أو صورة.'];
        }

        return ['safe' => true, 'reason' => null];
    }
}
