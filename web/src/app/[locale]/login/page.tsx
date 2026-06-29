import { getTranslations, setRequestLocale } from "next-intl/server";

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("nav");

  return (
    <div className="mx-auto max-w-md px-4 py-20 lg:px-8">
      <h1 className="mb-8 text-center text-2xl font-bold text-brand-dark">{t("login")}</h1>
      <form className="space-y-4 rounded-xl border border-gray-100 p-6">
        <input type="email" placeholder="Email" className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm" />
        <input type="password" placeholder="Password" className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm" />
        <button type="submit" className="w-full rounded-md bg-brand-green px-4 py-3 text-sm font-semibold text-white hover:bg-brand-green-dark">
          {t("login")}
        </button>
      </form>
    </div>
  );
}
