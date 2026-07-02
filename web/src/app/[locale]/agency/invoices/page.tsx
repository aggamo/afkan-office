"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ApiError } from "@/lib/api";
import { fetchAgencyInvoices, type AgencyInvoice } from "@/lib/agency-api";

const STATUSES = ["all", "issued", "paid", "cancelled"] as const;

function statusClass(status: string): string {
  switch (status) {
    case "paid":
      return "bg-emerald-50 text-emerald-700";
    case "issued":
      return "bg-blue-50 text-blue-700";
    case "cancelled":
      return "bg-red-50 text-red-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

export default function AgencyInvoicesPage() {
  const t = useTranslations("agency");
  const locale = useLocale();
  const [items, setItems] = useState<AgencyInvoice[] | null>(null);
  const [status, setStatus] = useState<string>("all");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      await Promise.resolve();
      if (cancelled) return;
      setItems(null);
      try {
        const result = await fetchAgencyInvoices(status === "all" ? undefined : status);
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

  function workerName(inv: AgencyInvoice): string {
    if (!inv.worker) return "—";
    return locale === "ar" ? inv.worker.full_name_ar : locale === "am" ? inv.worker.full_name_am : inv.worker.full_name_en;
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-brand-dark">{t("invoices.title")}</h1>
      <p className="mb-6 text-sm text-gray-500">{t("invoices.subtitle")}</p>

      {error && <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <div className="mb-4 flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${status === s ? "bg-brand-green text-white" : "bg-gray-50 text-brand-dark hover:bg-gray-100"}`}
          >
            {t(`invoices.statuses.${s}`)}
          </button>
        ))}
      </div>

      {!items ? (
        <p className="py-10 text-center text-gray-400">{t("loading")}</p>
      ) : items.length === 0 ? (
        <p className="py-10 text-center text-gray-400">{t("invoices.empty")}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="p-3 text-start">{t("invoices.number")}</th>
                <th className="p-3 text-start">{t("invoices.worker")}</th>
                <th className="p-3 text-start">{t("invoices.amount")}</th>
                <th className="p-3 text-start">{t("invoices.status")}</th>
                <th className="p-3 text-start">{t("invoices.issuedAt")}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((inv) => (
                <tr key={inv.id} className="border-t border-gray-100">
                  <td className="p-3 font-mono text-xs text-gray-600">{inv.invoice_number}</td>
                  <td className="p-3 text-gray-600">{workerName(inv)}</td>
                  <td className="p-3 font-semibold text-brand-dark">
                    {inv.amount != null ? `${Number(inv.amount).toLocaleString(locale)} ${inv.currency ?? ""}` : "—"}
                  </td>
                  <td className="p-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusClass(inv.status)}`}>
                      {t(`invoices.statuses.${inv.status}`)}
                    </span>
                  </td>
                  <td className="p-3 text-xs text-gray-500">
                    {inv.issued_at ? new Date(inv.issued_at).toLocaleDateString(locale) : "—"}
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
