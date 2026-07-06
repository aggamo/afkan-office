import { getTranslations, setRequestLocale } from "next-intl/server";
import { ShieldCheck } from "lucide-react";

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("about");

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 lg:px-8">
      <h1 className="mb-10 text-center text-2xl font-bold text-brand-dark lg:text-3xl">{t("title")}</h1>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-100 p-6">
          <h2 className="mb-2 font-semibold text-brand-green">{t("mission")}</h2>
          <p className="text-sm text-gray-500">{t("missionText")}</p>
        </div>
        <div className="rounded-xl border border-gray-100 p-6">
          <h2 className="mb-2 font-semibold text-brand-green">{t("vision")}</h2>
          <p className="text-sm text-gray-500">{t("visionText")}</p>
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-gray-100 p-6">
        <div className="mb-2 flex items-center gap-2 font-semibold text-brand-green">
          <ShieldCheck size={20} /> {t("license")}
        </div>
        <p className="text-sm text-gray-500">Afkan Foreign Employment Agency — Addis Ababa, Ethiopia</p>
      </div>
    </div>
  );
}
