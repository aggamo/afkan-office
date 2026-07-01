"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { Locale } from "@/i18n/config";
import { ApiError } from "@/lib/api";
import {
  fetchAdminWorkers,
  fetchWorkflowStages,
  type AdminWorkerListItem,
  type WorkflowStage,
} from "@/lib/admin-api";
import { WorkflowPanel } from "@/components/admin/workflow-panel";

export default function AdminWorkflowPage() {
  const t = useTranslations("admin");
  const locale = useLocale() as Locale;
  const [workers, setWorkers] = useState<AdminWorkerListItem[] | null>(null);
  const [stages, setStages] = useState<WorkflowStage[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      await Promise.resolve();
      if (cancelled) return;
      try {
        const [w, s] = await Promise.all([fetchAdminWorkers(), fetchWorkflowStages()]);
        if (cancelled) return;
        setWorkers(w.items);
        setStages(s);
        setSelected((prev) => prev ?? w.items[0]?.id ?? null);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "error");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!workers) return [];
    const term = query.trim().toLowerCase();
    if (!term) return workers;
    return workers.filter((w) =>
      [w.internal_number, w.tracking_number, w.full_name_ar, w.full_name_en, w.full_name_am]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [workers, query]);

  const nameKey = `full_name_${locale}` as const;

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-brand-dark">{t("workflow.title")}</h1>
      <p className="mb-6 text-sm text-gray-500">{t("workflow.subtitle")}</p>

      {error && <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      {!workers && !error && <p className="py-10 text-center text-gray-400">{t("loading")}</p>}

      {workers && (
        <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
          <div>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("workflow.search")}
              className="mb-3 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            />
            <ul className="max-h-[70vh] space-y-1 overflow-y-auto rounded-xl border border-gray-100 p-2">
              {filtered.length === 0 ? (
                <li className="p-3 text-center text-sm text-gray-400">{t("workflow.noWorkers")}</li>
              ) : (
                filtered.map((w) => (
                  <li key={w.id}>
                    <button
                      onClick={() => setSelected(w.id)}
                      className={`w-full rounded-md px-3 py-2 text-start text-sm ${
                        selected === w.id ? "bg-brand-green text-white" : "hover:bg-gray-50"
                      }`}
                    >
                      <span className="block font-medium">{w[nameKey]}</span>
                      <span className={`block text-xs ${selected === w.id ? "text-white/80" : "text-gray-400"}`}>
                        {w.internal_number}
                        {w.current_recruitment_stage ? ` · ${w.current_recruitment_stage[`name_${locale}`]}` : ""}
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div>{selected ? <WorkflowPanel key={selected} workerId={selected} stages={stages} /> : null}</div>
        </div>
      )}
    </div>
  );
}
