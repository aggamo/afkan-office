import { getTranslations, setRequestLocale } from "next-intl/server";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth");

  return (
    <div className="mx-auto max-w-md px-4 py-20 lg:px-8">
      <h1 className="mb-8 text-center text-2xl font-bold text-brand-dark">{t("reset.title")}</h1>
      <ResetPasswordForm />
    </div>
  );
}
