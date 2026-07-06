"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ApiError, forgotPassword } from "@/lib/api";

export function ForgotPasswordForm() {
  const t = useTranslations("auth");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("error"));
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="space-y-4 rounded-xl border border-gray-100 p-6 text-center">
        <p className="rounded-md bg-emerald-50 px-3 py-3 text-sm text-emerald-700">{t("forgot.sent")}</p>
        <Link href="/login" className="text-sm font-semibold text-brand-green hover:underline">
          {t("submit")}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-gray-100 p-6">
      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      <p className="text-sm text-gray-500">{t("forgot.hint")}</p>
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={t("email")}
        className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-brand-green px-4 py-3 text-sm font-semibold text-white hover:bg-brand-green-dark disabled:opacity-60"
      >
        {loading ? t("forgot.submitting") : t("forgot.submit")}
      </button>
      <Link href="/login" className="block text-center text-sm text-gray-500 hover:text-brand-green">
        {t("forgot.backToLogin")}
      </Link>
    </form>
  );
}
