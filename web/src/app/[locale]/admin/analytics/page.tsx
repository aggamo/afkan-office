"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CheckCircle2, Clock } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { ApiError } from "@/lib/api";
import { fetchAnalytics, type Analytics } from "@/lib/admin-api";
import { StatCard } from "@/components/admin/stat-card";

export default function AdminAnalyticsPage() {
  const t = useTranslations("admin");
  const locale = useLocale() as Locale;
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      await Promise.resolve();
      if (cancelled) return;
      try {
        const result = await fetchAnalytics();
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "error");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>;
  if (!data) return <p className="py-10 text-center text-gray-400">{t("loading")}</p>;

  const maxAvg = Math.max(1, ...data.stages.map((s) => s.avg_days));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-brand-dark">{t("analytics.title")}</h1>
        <p className="text-sm text-gray-500">{t("analytics.subtitle")}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
        <StatCard label={t("analytics.overallAvg")} value={`${data.overall_avg_days} ${t("analytics.days")}`} icon={Clock} tone="blue" />
        <StatCard label={t("analytics.completed")} value={data.completed_count} icon={CheckCircle2} tone="green" />
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">{t("analytics.perStage")}</h2>
        {data.stages.length === 0 ? (
          <p className="rounded-xl border border-gray-100 bg-white p-6 text-center text-sm text-gray-400">
            {t("analytics.noData")}
          </p>
        ) : (
          <div className="space-y-3 rounded-xl border border-gray-100 bg-white p-5">
            {data.stages.map((s) => {
              const overSla = s.sla_days != null && s.avg_days > s.sla_days;
              return (
                <div key={s.slug}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-gray-600">{s.name[locale]}</span>
                    <span className={overSla ? "font-semibold text-red-600" : "text-gray-500"}>
                      {s.avg_days} {t("analytics.days")}
                      {s.sla_days != null && <span className="text-gray-400"> / {s.sla_days}</span>}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={`h-full ${overSla ? "bg-red-500" : "bg-brand-green"}`}
                      style={{ width: `${(s.avg_days / maxAvg) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
