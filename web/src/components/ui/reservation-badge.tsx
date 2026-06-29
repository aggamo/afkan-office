import { useTranslations } from "next-intl";
import type { ReservationStatus } from "@/types/worker";

const STYLES: Record<ReservationStatus, string> = {
  available: "bg-green-100 text-green-800",
  reserved_agency: "bg-yellow-100 text-yellow-800",
  reserved_customer: "bg-orange-100 text-orange-800",
  in_progress: "bg-blue-100 text-blue-800",
};

export function ReservationBadge({ status }: { status: ReservationStatus }) {
  const t = useTranslations("workers.status");
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${STYLES[status]}`}>
      {t(status)}
    </span>
  );
}
