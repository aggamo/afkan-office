"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { BadgeCheck, Ban, CheckCircle2 } from "lucide-react";
import { ApiError } from "@/lib/api";
import { fetchAdminAgencies, updateAgencyStatus, type AdminAgency } from "@/lib/admin-api";

const FILTERS = ["all", "pending", "verified", "suspended"] as const;

export default function AdminAgenciesPage() {
  const t = useTranslations("admin");
  const [agencies, setAgencies] = useState<AdminAgency[] | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      await Promise.resolve();
      if (cancelled) return;
      try {
        const result = await fetchAdminAgencies();
        if (!cancelled) setAgencies(result);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "error");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function patch(id: number, payload: { is_verified?: boolean; is_active?: boolean }) {
    try {
      const updated = await updateAgencyStatus(id, payload);
      setAgencies((prev) => (prev ? prev.map((a) => (a.id === id ? updated : a)) : prev));
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
    }
  }

  const filtered = useMemo(() => {
    if (!agencies) return [];
    const term = query.trim().toLowerCase();
    return agencies.filter((a) => {
      const matchTerm = !term || [a.name, a.license_number, a.city].filter(Boolean).join(" ").toLowerCase().includes(term);
      const matchStatus =
        filter === "all" ||
        (filter === "verified" && a.is_verified) ||
        (filter === "pending" && !a.is_verified) ||
        (filter === "suspended" && !a.is_active);
      return matchTerm && matchStatus;
    });
  }, [agencies, query, filter]);

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-brand-dark">{t("agencies.title")}</h1>
      <p className="mb-6 text-sm text-gray-500">{t("agencies.subtitle")}</p>

      {error && <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("agencies.search")}
          className="w-full max-w-xs rounded-md border border-gray-200 px-3 py-2 text-sm"
        />
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${
              filter === f ? "bg-brand-green text-white" : "bg-gray-50 text-brand-dark hover:bg-gray-100"
            }`}
          >
            {t(`agencies.filters.${f}`)}
          </button>
        ))}
      </div>

      {!agencies ? (
        <p className="py-10 text-center text-gray-400">{t("loading")}</p>
      ) : filtered.length === 0 ? (
        <p className="py-10 text-center text-gray-400">{t("agencies.empty")}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="p-3 text-start">{t("agencies.name")}</th>
                <th className="p-3 text-start">{t("agencies.license")}</th>
                <th className="p-3 text-start">{t("agencies.city")}</th>
                <th className="p-3 text-start">{t("agencies.workers")}</th>
                <th className="p-3 text-start">{t("agencies.status")}</th>
                <th className="p-3 text-end">{t("agencies.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} className="border-t border-gray-100">
                  <td className="p-3 font-medium text-brand-dark">{a.name}</td>
                  <td className="p-3 text-gray-500">{a.license_number}</td>
                  <td className="p-3 text-gray-500">{a.city ?? "—"}</td>
                  <td className="p-3 text-gray-500">{a.workers_count}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${a.is_verified ? "bg-emerald-50 text-emerald-700" : "bg-orange-50 text-orange-700"}`}>
                        {a.is_verified ? t("agencies.verified") : t("agencies.pending")}
                      </span>
                      {!a.is_active && (
                        <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">
                          {t("agencies.suspended")}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-1">
                      {!a.is_verified && (
                        <button
                          onClick={() => patch(a.id, { is_verified: true, is_active: true })}
                          className="flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white"
                        >
                          <BadgeCheck size={13} /> {t("agencies.verify")}
                        </button>
                      )}
                      {a.is_active ? (
                        <button
                          onClick={() => patch(a.id, { is_active: false })}
                          className="flex items-center gap-1 rounded-md border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-600"
                        >
                          <Ban size={13} /> {t("agencies.suspend")}
                        </button>
                      ) : (
                        <button
                          onClick={() => patch(a.id, { is_active: true })}
                          className="flex items-center gap-1 rounded-md border border-gray-200 px-2.5 py-1 text-xs font-semibold text-brand-green"
                        >
                          <CheckCircle2 size={13} /> {t("agencies.activate")}
                        </button>
                      )}
                    </div>
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
