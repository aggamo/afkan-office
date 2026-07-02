"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { ApiError, registerAgency, registerCustomer } from "@/lib/api";
import { setAuthToken, setAuthRole } from "@/lib/auth-client";

type Mode = "customer" | "agency";

const fieldClass = "w-full rounded-md border border-gray-200 px-3 py-2 text-sm";

export function RegisterForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("customer");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    password_confirmation: "",
    country: "",
    city: "",
    agency_name: "",
    license_number: "",
    agency_phone: "",
    agency_email: "",
    position: "",
  });

  function set(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.password_confirmation) {
      setError(t("register.passwordMismatch"));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result =
        mode === "customer"
          ? await registerCustomer({
              name: form.name,
              email: form.email,
              phone: form.phone || undefined,
              password: form.password,
              password_confirmation: form.password_confirmation,
              country: form.country || undefined,
              city: form.city || undefined,
            })
          : await registerAgency({
              agency_name: form.agency_name,
              license_number: form.license_number,
              country: form.country || undefined,
              city: form.city || undefined,
              agency_phone: form.agency_phone || undefined,
              agency_email: form.agency_email || undefined,
              name: form.name,
              email: form.email,
              phone: form.phone || undefined,
              password: form.password,
              password_confirmation: form.password_confirmation,
              position: form.position || undefined,
            });

      setAuthToken(result.token);
      setAuthRole(result.user.role.slug);
      window.dispatchEvent(new Event("afkan-auth-changed"));
      router.push(mode === "customer" ? "/customer" : "/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-gray-100 p-6">
      <div className="flex gap-2 rounded-lg bg-gray-50 p-1">
        {(["customer", "agency"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold transition ${
              mode === m ? "bg-brand-green text-white" : "text-brand-dark hover:bg-gray-100"
            }`}
          >
            {t(`register.${m}`)}
          </button>
        ))}
      </div>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      {mode === "agency" && (
        <div className="space-y-4 rounded-lg border border-gray-100 p-4">
          <p className="text-xs font-semibold uppercase text-gray-400">{t("register.agencyInfo")}</p>
          <input required value={form.agency_name} onChange={set("agency_name")} placeholder={t("register.agencyName")} className={fieldClass} />
          <input required value={form.license_number} onChange={set("license_number")} placeholder={t("register.licenseNumber")} className={fieldClass} />
          <div className="grid grid-cols-2 gap-3">
            <input value={form.agency_phone} onChange={set("agency_phone")} placeholder={t("register.agencyPhone")} className={fieldClass} />
            <input type="email" value={form.agency_email} onChange={set("agency_email")} placeholder={t("register.agencyEmail")} className={fieldClass} />
          </div>
          <input value={form.position} onChange={set("position")} placeholder={t("register.position")} className={fieldClass} />
        </div>
      )}

      <div className="space-y-4">
        {mode === "agency" && <p className="text-xs font-semibold uppercase text-gray-400">{t("register.contactInfo")}</p>}
        <input required value={form.name} onChange={set("name")} placeholder={t("register.name")} className={fieldClass} />
        <input type="email" required value={form.email} onChange={set("email")} placeholder={t("email")} className={fieldClass} />
        <input value={form.phone} onChange={set("phone")} placeholder={t("register.phone")} className={fieldClass} />
        <div className="grid grid-cols-2 gap-3">
          <input value={form.country} onChange={set("country")} placeholder={t("register.country")} className={fieldClass} />
          <input value={form.city} onChange={set("city")} placeholder={t("register.city")} className={fieldClass} />
        </div>
        <input type="password" required minLength={8} value={form.password} onChange={set("password")} placeholder={t("password")} className={fieldClass} />
        <input type="password" required minLength={8} value={form.password_confirmation} onChange={set("password_confirmation")} placeholder={t("register.confirmPassword")} className={fieldClass} />
      </div>

      {mode === "agency" && <p className="text-xs text-gray-400">{t("register.agencyNotice")}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-brand-green px-4 py-3 text-sm font-semibold text-white hover:bg-brand-green-dark disabled:opacity-60"
      >
        {loading ? t("register.submitting") : t("register.submit")}
      </button>
    </form>
  );
}
