import { getTranslations, setRequestLocale } from "next-intl/server";
import { LoginForm } from "@/components/auth/login-form";

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
      <LoginForm />
    </div>
  );
}
