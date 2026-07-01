import { getTranslations, setRequestLocale } from "next-intl/server";
import { Database } from "lucide-react";
import { Link } from "@/i18n/navigation";

export default async function AdminHomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-brand-dark">{t("welcome")}</h1>
      <p className="mb-8 text-gray-500">{t("welcomeSubtitle")}</p>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/reference"
          className="flex items-start gap-4 rounded-xl border border-gray-100 p-5 transition hover:border-brand-green hover:shadow-sm"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-green/10 text-brand-green">
            <Database size={22} />
          </span>
          <span>
            <span className="block font-semibold text-brand-dark">{t("nav.referenceData")}</span>
            <span className="mt-1 block text-sm text-gray-500">{t("reference.subtitle")}</span>
          </span>
        </Link>
      </div>
    </div>
  );
}
