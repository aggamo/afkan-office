"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ApiError } from "@/lib/api";
import { fetchActivity, type ActivityLog, type ActivityPage } from "@/lib/admin-api";
import type { Locale } from "@/i18n/config";

const PER_PAGE = 25;

export default function ActivityLogPage() {
  const t = useTranslations("admin");
  const locale = useLocale() as Locale;
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("");
  const [filterInput, setFilterInput] = useState("");
  const [data, setData] = useState<ActivityPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      await Promise.resolve();
      if (cancelled) return;
      setLoading(true);
      setError(null);
      try {
        const result = await fetchActivity(page, PER_PAGE, filter || undefined);
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [page, filter]);

  function submitFilter(event: React.FormEvent) {
    event.preventDefault();
    setPage(1);
    setFilter(filterInput.trim());
  }

  const fmtDate = (value: string | null) =>
    value
      ? new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : locale, { dateStyle: "short", timeStyle: "short" }).format(new Date(value))
      : "";

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-brand-dark">{t("activity.title")}</h1>
      <p className="mb-6 text-sm text-gray-500">{t("activity.subtitle")}</p>

      <form onSubmit={submitFilter} className="mb-4 flex gap-2">
        <input
          type="search"
          value={filterInput}
          onChange={(e) => setFilterInput(e.target.value)}
          placeholder={t("activity.filterPlaceholder")}
          className="w-full max-w-xs rounded-md border border-gray-200 px-3 py-2 text-sm"
        />
      </form>

      {error && <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      {loading || !data ? (
        <p className="py-10 text-center text-gray-400">{t("loading")}</p>
      ) : data.items.length === 0 ? (
        <p className="py-10 text-center text-gray-400">{t("activity.empty")}</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="p-3 text-start">{t("activity.action")}</th>
                  <th className="p-3 text-start">{t("activity.type")}</th>
                  <th className="p-3 text-start">{t("activity.user")}</th>
                  <th className="p-3 text-start">{t("activity.ip")}</th>
                  <th className="p-3 text-start">{t("activity.date")}</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((log: ActivityLog) => (
                  <tr key={log.id} className="border-t border-gray-100">
                    <td className="p-3 font-medium text-brand-dark">{log.action}</td>
                    <td className="p-3 text-gray-500">
                      {log.auditable_type}
                      {log.auditable_id != null && <span className="text-gray-300"> #{log.auditable_id}</span>}
                    </td>
                    <td className="p-3 text-gray-500">{log.user ?? t("activity.system")}</td>
                    <td className="p-3 text-gray-400">{log.ip_address ?? "—"}</td>
                    <td className="p-3 text-gray-400">{fmtDate(log.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm">
            <button
              type="button"
              disabled={data.meta.current_page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-md border border-gray-200 px-3 py-1.5 disabled:opacity-40"
            >
              {t("activity.prev")}
            </button>
            <span className="text-gray-500">
              {t("activity.page", { page: data.meta.current_page, total: data.meta.last_page })}
            </span>
            <button
              type="button"
              disabled={data.meta.current_page >= data.meta.last_page}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-md border border-gray-200 px-3 py-1.5 disabled:opacity-40"
            >
              {t("activity.next")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
