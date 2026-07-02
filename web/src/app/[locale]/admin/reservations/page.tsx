"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ApiError } from "@/lib/api";
import { fetchAdminReservations, type AdminReservation } from "@/lib/admin-api";

const STATUSES = ["all", "reserved", "authorized", "expired", "cancelled", "completed"] as const;

function statusClass(status: string): string {
  switch (status) {
    case "reserved":
      return "bg-amber-50 text-amber-700";
    case "authorized":
    case "completed":
      return "bg-emerald-50 text-emerald-700";
    case "expired":
    case "cancelled":
      return "bg-red-50 text-red-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

export default function AdminReservationsPage() {
  const t = useTranslations("admin");
  const locale = useLocale();
  const [items, setItems] = useState<AdminReservation[] | null>(null);
  const [status, setStatus] = useState<string>("all");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      await Promise.resolve();
      if (cancelled) return;
      setItems(null);
      try {
        const result = await fetchAdminReservations(status === "all" ? undefined : status);
        if (!cancelled) setItems(result.items);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "error");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [status]);

  function workerName(r: AdminReservation): string {
    if (!r.worker) return "—";
    return locale === "ar" ? r.worker.full_name_ar : locale === "am" ? r.worker.full_name_am : r.worker.full_name_en;
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-brand-dark">{t("reservations.title")}</h1>
      <p className="mb-6 text-sm text-gray-500">{t("reservations.subtitle")}</p>

      {error && <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <div className="mb-4 flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${
              status === s ? "bg-brand-green text-white" : "bg-gray-50 text-brand-dark hover:bg-gray-100"
            }`}
          >
            {t(`reservations.statuses.${s}`)}
          </button>
        ))}
      </div>

      {!items ? (
        <p className="py-10 text-center text-gray-400">{t("loading")}</p>
      ) : items.length === 0 ? (
        <p className="py-10 text-center text-gray-400">{t("reservations.empty")}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="p-3 text-start">{t("reservations.worker")}</th>
                <th className="p-3 text-start">{t("reservations.reservedBy")}</th>
                <th className="p-3 text-start">{t("reservations.party")}</th>
                <th className="p-3 text-start">{t("reservations.status")}</th>
                <th className="p-3 text-start">{t("reservations.expiresAt")}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id} className="border-t border-gray-100">
                  <td className="p-3 font-medium text-brand-dark">
                    {workerName(r)}
                    {r.worker && <span className="ms-2 font-mono text-xs text-gray-400">{r.worker.internal_number}</span>}
                  </td>
                  <td className="p-3 text-gray-500">{t(`reservations.by.${r.reserved_by_type}`)}</td>
                  <td className="p-3 text-gray-500">
                    {r.reserved_by_type === "customer" ? r.customer?.name ?? "—" : r.agency?.name ?? "—"}
                    {r.authorized_agency && (
                      <span className="ms-1 text-xs text-emerald-600">→ {r.authorized_agency.name}</span>
                    )}
                  </td>
                  <td className="p-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusClass(r.status)}`}>
                      {t(`reservations.statuses.${r.status}`)}
                    </span>
                  </td>
                  <td className="p-3 text-xs text-gray-500">
                    {r.expires_at ? new Date(r.expires_at).toLocaleString(locale) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
