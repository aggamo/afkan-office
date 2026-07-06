"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { AvatarPlaceholder } from "@/components/ui/avatar-placeholder";
import { ReservationBadge } from "@/components/ui/reservation-badge";
import { useCompare } from "@/components/collections/compare-context";
import { fetchWorker } from "@/lib/api";
import { adaptWorker } from "@/lib/worker-adapter";
import type { Locale } from "@/i18n/config";
import type { Worker } from "@/types/worker";

export default function ComparePage() {
  const t = useTranslations("compare");
  const locale = useLocale() as Locale;
  const { compareIds, removeFromCompare } = useCompare();
  const [workers, setWorkers] = useState<Worker[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      await Promise.resolve();
      if (compareIds.length === 0) {
        if (!cancelled) setWorkers([]);
        return;
      }
      const results = await Promise.all(
        compareIds.map((id) => fetchWorker(id).then(adaptWorker).catch(() => null)),
      );
      if (!cancelled) setWorkers(results.filter((w): w is Worker => w !== null));
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [compareIds]);

  if (compareIds.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center lg:px-8">
        <h1 className="mb-4 text-2xl font-bold text-brand-dark lg:text-3xl">{t("title")}</h1>
        <p className="mb-6 text-gray-500">{t("empty")}</p>
        <Link href="/workers" className="rounded-md bg-brand-green px-4 py-2 text-sm font-semibold text-white">
          {t("browse")}
        </Link>
      </div>
    );
  }

  const rows: { label: string; render: (w: Worker) => React.ReactNode }[] = [
    { label: t("fields.age"), render: (w) => w.age },
    { label: t("fields.experience"), render: (w) => w.experienceYears },
    { label: t("fields.languages"), render: (w) => w.languages.map((l) => l.name[locale]).join(", ") || "—" },
    { label: t("fields.skills"), render: (w) => w.skills.map((s) => s.name[locale]).join(", ") || "—" },
    { label: t("fields.education"), render: (w) => w.education?.[locale] ?? "—" },
    { label: t("fields.readinessScore"), render: (w) => w.readinessScore },
    { label: t("fields.reservationStatus"), render: (w) => <ReservationBadge status={w.reservationStatus} /> },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 lg:px-8">
      <h1 className="mb-8 text-center text-2xl font-bold text-brand-dark lg:text-3xl">{t("title")}</h1>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse">
          <thead>
            <tr>
              <th className="w-40" />
              {workers.map((worker) => (
                <th key={worker.id} className="p-3 text-center">
                  <AvatarPlaceholder name={worker.photo} className="mx-auto mb-2 h-20 w-20 text-xl" />
                  <div className="text-sm font-semibold text-brand-dark">{worker.internalNumber}</div>
                  <button
                    type="button"
                    onClick={() => removeFromCompare(worker.id)}
                    className="mt-1 text-xs text-red-500 hover:underline"
                  >
                    {t("remove")}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-t border-gray-100">
                <td className="p-3 text-sm font-semibold text-gray-500">{row.label}</td>
                {workers.map((worker) => (
                  <td key={worker.id} className="p-3 text-center text-sm text-brand-dark">
                    {row.render(worker)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
