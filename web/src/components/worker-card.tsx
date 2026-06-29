import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { AvatarPlaceholder } from "@/components/ui/avatar-placeholder";
import { ReservationBadge } from "@/components/ui/reservation-badge";
import type { Locale } from "@/i18n/config";
import type { Worker } from "@/types/worker";

export function WorkerCard({ worker }: { worker: Worker }) {
  const t = useTranslations("workers.card");
  const locale = useLocale() as Locale;

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition hover:shadow-md">
      <div className="relative h-48 w-full overflow-hidden">
        <AvatarPlaceholder name={worker.photo} className="h-full w-full text-3xl" />
        <div className="absolute top-2 end-2">
          <ReservationBadge status={worker.reservationStatus} />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>{worker.internalNumber}</span>
          <span>{t("age")}: {worker.age}</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {worker.languages.slice(0, 3).map((lang) => (
            <span key={lang.name.en} className="rounded-full bg-brand-light px-2 py-0.5 text-xs text-brand-dark">
              {lang.name[locale]}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {worker.skills.slice(0, 3).map((skill) => (
            <span key={skill.name.en} className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-brand-gold">
              {skill.name[locale]}
            </span>
          ))}
        </div>
        <div className="text-sm text-gray-500">
          {t("experience")}: {worker.experienceYears}
        </div>
        <Link
          href={`/workers/${worker.id}`}
          className="mt-auto rounded-md bg-brand-green px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-brand-green-dark"
        >
          {t("viewDetails")}
        </Link>
      </div>
    </div>
  );
}
