import { getTranslations, setRequestLocale } from "next-intl/server";

const PROCESS_KEYS = ["step1", "step2", "step3", "step4", "step5", "step6", "step7"] as const;

export default async function ProcessPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home.process");

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 lg:px-8">
      <h1 className="mb-10 text-center text-2xl font-bold text-brand-dark lg:text-3xl">{t("title")}</h1>
      <ol className="space-y-4">
        {PROCESS_KEYS.map((key, i) => (
          <li key={key} className="flex items-center gap-4 rounded-xl border border-gray-100 p-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-green font-bold text-white">
              {i + 1}
            </span>
            <span className="font-medium text-brand-dark">{t(key)}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
