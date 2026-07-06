"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { ApiError, resetPassword } from "@/lib/api";

export function ResetPasswordForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function read() {
      await Promise.resolve();
      if (cancelled) return;
      const params = new URLSearchParams(window.location.search);
      setToken(params.get("token") ?? "");
      setEmail(params.get("email") ?? "");
    }
    read();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError(t("reset.mismatch"));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await resetPassword({ token, email, password, password_confirmation: confirm });
      setDone(true);
      setTimeout(() => router.push("/login"), 1500);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("error"));
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-xl border border-gray-100 p-6 text-center">
        <p className="rounded-md bg-emerald-50 px-3 py-3 text-sm text-emerald-700">{t("reset.done")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-gray-100 p-6">
      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={t("email")}
        className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
      />
      <input
        type="password"
        required
        minLength={8}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder={t("reset.newPassword")}
        className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
      />
      <input
        type="password"
        required
        minLength={8}
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        placeholder={t("reset.confirmPassword")}
        className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
      />
      <button
        type="submit"
        disabled={loading || !token}
        className="w-full rounded-md bg-brand-green px-4 py-3 text-sm font-semibold text-white hover:bg-brand-green-dark disabled:opacity-60"
      >
        {loading ? t("reset.submitting") : t("reset.submit")}
      </button>
      {!token && <p className="text-center text-xs text-red-500">{t("reset.invalidLink")}</p>}
    </form>
  );
}
