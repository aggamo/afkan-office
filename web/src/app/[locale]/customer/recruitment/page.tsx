"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AlertTriangle, CheckCircle2, Circle, LoaderCircle } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { ApiError } from "@/lib/api";
import { fetchCustomerRecruitment, type CustomerRecruitment } from "@/lib/customer-api";
import { Link } from "@/i18n/navigation";

const STATUS_ICON = {
  completed: <CheckCircle2 size={18} className="text-emerald-600" />,
  current: <LoaderCircle size={18} className="text-blue-600" />,
  delayed: <AlertTriangle size={18} className="text-red-600" />,
  upcoming: <Circle size={18} className="text-gray-300" />,
} as const;

export default function CustomerRecruitmentPage() {
  const t = useTranslations("customer");
  const locale = useLocale() as Locale;
  const [data, setData] = useState<CustomerRecruitment | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      await Promise.resolve();
      if (cancelled) return;
      try {
        const result = await fetchCustomerRecruitment();
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
  if (data === undefined) return <p className="py-10 text-center text-gray-400">{t("loading")}</p>;

  if (data === null) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold text-brand-dark">{t("recruitment.title")}</h1>
        <div className="rounded-xl border border-gray-100 p-8 text-center">
          <p className="mb-4 text-gray-500">{t("recruitment.empty")}</p>
          <Link href="/workers" className="rounded-md bg-brand-green px-4 py-2 text-sm font-semibold text-white">
            {t("reservations.browse")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-brand-dark">{t("recruitment.title")}</h1>
      <p className="mb-6 text-sm text-gray-500">{data.worker.full_name[locale]}</p>

      <div className="rounded-xl border border-gray-100 bg-white p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="text-gray-500">
            {t("recruitment.currentStage")}:{" "}
            <span className="font-semibold text-brand-green">{data.current_stage?.name[locale] ?? "—"}</span>
          </span>
          {data.agency && (
            <span className="text-gray-500">
              {t("recruitment.agency")}: <span className="font-medium text-brand-dark">{data.agency.name}</span>
            </span>
          )}
        </div>

        {data.worker.tracking_number && <p className="mb-4 text-xs text-gray-400">{data.worker.tracking_number}</p>}

        <div className="mb-6">
          <div className="mb-1 flex justify-between text-xs text-gray-400">
            <span>{t("recruitment.progress")}</span>
            <span>{data.progress}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-100">
            <div className="h-2 rounded-full bg-brand-green" style={{ width: `${data.progress}%` }} />
          </div>
        </div>

        <ol className="space-y-3">
          {data.timeline.map((s) => (
            <li key={s.slug} className="flex items-center gap-2 text-sm">
              {STATUS_ICON[s.status]}
              <span className={s.status === "upcoming" ? "text-gray-400" : "text-brand-dark"}>{s.name[locale]}</span>
            </li>
          ))}
        </ol>

        {data.eta.estimated_completion && (
          <p className="mt-6 text-sm text-gray-500">
            {t("recruitment.eta")}: {new Date(data.eta.estimated_completion).toLocaleDateString(locale)}
          </p>
        )}
      </div>
    </div>
  );
}
