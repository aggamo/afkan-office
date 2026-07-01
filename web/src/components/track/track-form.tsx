"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Search, CheckCircle2, Circle, LoaderCircle, AlertTriangle } from "lucide-react";
import { ApiError, trackWorker, type ApiTrackResult } from "@/lib/api";
import type { Locale } from "@/i18n/config";

const STATUS_ICON = {
  completed: <CheckCircle2 size={18} className="text-emerald-600" />,
  current: <LoaderCircle size={18} className="text-blue-600" />,
  delayed: <AlertTriangle size={18} className="text-red-600" />,
  upcoming: <Circle size={18} className="text-gray-300" />,
} as const;

export function TrackForm() {
  const t = useTranslations("track");
  const locale = useLocale() as Locale;
  const [value, setValue] = useState("");
  const [result, setResult] = useState<ApiTrackResult | null>(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSearch() {
    if (!value.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const data = await trackWorker(value.trim());
      setResult(data);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        setResult(null);
      } else {
        setResult(null);
      }
    } finally {
      setLoading(false);
    }
  }

  const eta = result?.eta;

  return (
    <div>
      <h1 className="mb-2 text-center text-2xl font-bold text-brand-dark lg:text-3xl">{t("title")}</h1>
      <p className="mb-8 text-center text-sm text-gray-500">{t("subtitle")}</p>

      <div className="flex items-center gap-2 rounded-md border border-gray-200 p-1.5">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder={t("inputLabel")}
          className="w-full px-2 py-2 text-sm outline-none"
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-md bg-brand-green px-4 py-2 text-sm font-semibold text-white hover:bg-brand-green-dark disabled:opacity-60"
        >
          <Search size={16} /> {t("button")}
        </button>
      </div>
      <p className="mt-2 text-center text-xs text-gray-400">e.g. AFK-2026-000001</p>

      {searched && !loading && !result && (
        <p className="mt-8 rounded-xl border border-gray-100 p-6 text-center text-gray-500">{t("notFound")}</p>
      )}

      {result && (
        <div className="mt-8 rounded-xl border border-gray-100 p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm text-gray-500">{t("currentStage")}</span>
            <span className="font-semibold text-brand-green">
              {result.current_recruitment_stage
                ? result.timeline.find((s) => s.slug === result.current_recruitment_stage?.slug)?.name[locale] ??
                  result.current_recruitment_stage[`name_${locale}`]
                : "—"}
            </span>
          </div>

          {result.tracking_number && (
            <p className="mb-4 text-xs text-gray-400">{result.tracking_number}</p>
          )}

          {result.is_delayed && (
            <p className="mb-4 flex items-center gap-1.5 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
              <AlertTriangle size={15} /> {t("delayed")}
            </p>
          )}

          <div className="mb-6">
            <div className="mb-1 flex items-center justify-between text-xs text-gray-400">
              <span>{t("progress")}</span>
              <span>{result.progress}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-100">
              <div className="h-2 rounded-full bg-brand-green transition-all" style={{ width: `${result.progress}%` }} />
            </div>
          </div>

          <ol className="space-y-3">
            {result.timeline.map((stage) => (
              <li key={stage.slug} className="flex items-center gap-2 text-sm">
                {STATUS_ICON[stage.status]}
                <span
                  className={
                    stage.status === "upcoming"
                      ? "text-gray-400"
                      : stage.status === "delayed"
                        ? "font-medium text-red-600"
                        : stage.status === "current"
                          ? "font-semibold text-blue-700"
                          : "text-brand-dark"
                  }
                >
                  {stage.name[locale]}
                </span>
              </li>
            ))}
          </ol>

          {eta?.estimated_completion && (
            <p className="mt-6 text-sm text-gray-500">
              {t("estimatedCompletion")}: {new Date(eta.estimated_completion).toLocaleDateString(locale)}{" "}
              <span className="text-xs text-gray-400">({t(`confidence.${eta.confidence}`)})</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
