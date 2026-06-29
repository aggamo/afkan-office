"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { ApiError, login } from "@/lib/api";
import { setAuthToken } from "@/lib/auth-client";

export function LoginForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { token } = await login(email, password);
      setAuthToken(token);
      router.push("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("error"));
    } finally {
      setLoading(false);
    }
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
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder={t("password")}
        className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-brand-green px-4 py-3 text-sm font-semibold text-white hover:bg-brand-green-dark disabled:opacity-60"
      >
        {loading ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}
