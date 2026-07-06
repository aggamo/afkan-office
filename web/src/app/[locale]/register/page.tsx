import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { RegisterForm } from "@/components/auth/register-form";

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth");

  return (
    <div className="mx-auto max-w-lg px-4 py-16 lg:px-8">
      <h1 className="mb-2 text-center text-2xl font-bold text-brand-dark">{t("register.title")}</h1>
      <p className="mb-8 text-center text-sm text-gray-500">{t("register.subtitle")}</p>
      <RegisterForm />
      <p className="mt-6 text-center text-sm text-gray-500">
        {t("register.haveAccount")}{" "}
        <Link href="/login" className="font-semibold text-brand-green hover:underline">
          {t("submit")}
        </Link>
      </p>
    </div>
  );
}
