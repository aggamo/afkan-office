import { getTranslations, setRequestLocale } from "next-intl/server";
import { Users, Building2, FileText, Stamp, Plane } from "lucide-react";

const SERVICE_KEYS = ["domestic", "agencyRecruitment", "customerRecruitment", "documents", "visa", "travel"] as const;
const ICONS = [Users, Building2, Users, FileText, Stamp, Plane];

export default async function ServicesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home.services");

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 lg:px-8">
      <h1 className="mb-10 text-center text-2xl font-bold text-brand-dark lg:text-3xl">{t("title")}</h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICE_KEYS.map((key, i) => {
          const Icon = ICONS[i];
          return (
            <div key={key} className="rounded-xl border border-gray-100 p-6 shadow-sm">
              <Icon className="mb-3 text-brand-gold" size={28} />
              <h2 className="font-semibold text-brand-dark">{t(key)}</h2>
            </div>
          );
        })}
      </div>
    </div>
  );
}
