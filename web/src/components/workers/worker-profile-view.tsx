"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, ArrowLeft, Share2, Printer } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { AvatarPlaceholder } from "@/components/ui/avatar-placeholder";
import { ReservationBadge } from "@/components/ui/reservation-badge";
import { ApiError } from "@/lib/api";
import { getAuthRole, getAuthToken } from "@/lib/auth-client";
import { reserveWorker } from "@/lib/customer-api";
import type { Locale } from "@/i18n/config";
import type { Worker } from "@/types/worker";

export function WorkerProfileView({ worker, backLabel }: { worker: Worker; backLabel: string }) {
  const t = useTranslations("workerProfile");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const isRtl = locale === "ar";
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;

  const [reserving, setReserving] = useState(false);
  const [reserveError, setReserveError] = useState<string | null>(null);

  const reserveDisabled = worker.reservationStatus !== "available" || reserving;

  async function handleReserve() {
    if (!getAuthToken() || getAuthRole() !== "customer") {
      router.push("/login");
      return;
    }
    setReserving(true);
    setReserveError(null);
    try {
      await reserveWorker(Number(worker.id));
      router.push("/customer/reservations");
    } catch (err) {
      setReserveError(err instanceof ApiError ? err.message : "error");
      setReserving(false);
    }
  }

  return (
    <div>
      <Link href="/workers" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-brand-green">
        <BackIcon size={16} /> {backLabel}
      </Link>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <AvatarPlaceholder name={worker.photo} className="h-64 w-full rounded-xl text-5xl" />
          <div className="mt-4 flex flex-col gap-2">
            <ReservationBadge status={worker.reservationStatus} />
            {worker.reservedUntil && (worker.reservationStatus === "reserved_agency" || worker.reservationStatus === "reserved_customer") && (
              <p className="text-sm text-gray-500">
                {t("reservedUntil")}: {new Date(worker.reservedUntil).toLocaleString(locale)}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleReserve}
            disabled={reserveDisabled}
            className={`mt-4 w-full rounded-md px-4 py-3 text-sm font-semibold text-white ${
              reserveDisabled ? "cursor-not-allowed bg-gray-300" : "bg-brand-green hover:bg-brand-green-dark"
            }`}
          >
            {t("reserve")}
          </button>
          {reserveError && <p className="mt-2 text-sm text-red-600">{reserveError}</p>}

          <div className="mt-3 flex gap-2">
            <button type="button" className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-gray-200 py-2 text-sm text-brand-dark hover:bg-brand-light">
              <Share2 size={15} /> {t("share")}
            </button>
            <button type="button" className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-gray-200 py-2 text-sm text-brand-dark hover:bg-brand-light">
              <Printer size={15} /> {t("print")}
            </button>
          </div>
        </div>

        <div className="space-y-8 lg:col-span-2">
          <section>
            <h2 className="mb-3 text-lg font-bold text-brand-dark">{t("personalInfo")}</h2>
            <dl className="grid grid-cols-2 gap-3 rounded-xl border border-gray-100 p-5 text-sm sm:grid-cols-3">
              <Field label={t("fields.workerId")} value={worker.internalNumber} />
              <Field label={t("fields.age")} value={String(worker.age)} />
              <Field label={t("fields.nationality")} value={worker.nationality[locale]} />
              <Field label={t("fields.maritalStatus")} value={worker.maritalStatus[locale]} />
              <Field label={t("fields.children")} value={String(worker.childrenCount)} />
              {worker.education && <Field label={t("fields.education")} value={worker.education[locale]} />}
              <Field label={t("fields.religion")} value={worker.religion[locale]} />
              <Field label={t("fields.experienceYears")} value={String(worker.experienceYears)} />
            </dl>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-brand-dark">{t("languages")}</h2>
            <div className="flex flex-wrap gap-2">
              {worker.languages.map((lang) => (
                <span key={lang.name.en} className="rounded-full bg-brand-light px-3 py-1 text-sm text-brand-dark">
                  {lang.name[locale]}
                </span>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-brand-dark">{t("skills")}</h2>
            <div className="flex flex-wrap gap-2">
              {worker.skills.map((skill) => (
                <span key={skill.name.en} className="rounded-full bg-amber-50 px-3 py-1 text-sm text-brand-gold">
                  {skill.name[locale]}
                </span>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-brand-dark">{t("availability")}</h2>
            <div className="rounded-xl border border-gray-100 p-5">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-gray-500">Readiness Score</span>
                <span className="font-semibold text-brand-green">{worker.readinessScore}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-100">
                <div className="h-2 rounded-full bg-brand-green" style={{ width: `${worker.readinessScore}%` }} />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-gray-400">{label}</div>
      <div className="font-medium text-brand-dark">{value}</div>
    </div>
  );
}
