"use client";

import QRCode from "react-qr-code";

/**
 * Renders a QR code that opens the given URL/value (Document 8: every tracking
 * page is reachable via QR).
 */
export function TrackingQr({ value, size = 116 }: { value: string; size?: number }) {
  return (
    <div className="inline-block rounded-lg border border-gray-100 bg-white p-2">
      <QRCode value={value} size={size} />
    </div>
  );
}
