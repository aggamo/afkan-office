"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ApiError } from "@/lib/api";
import { fetchCustomerProfile, updateCustomerProfile, type CustomerProfile } from "@/lib/customer-api";

export default function CustomerProfilePage() {
  const t = useTranslations("customer");
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      await Promise.resolve();
      if (cancelled) return;
      try {
        const result = await fetchCustomerProfile();
        if (!cancelled) setProfile(result);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "error");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  function setField(key: keyof CustomerProfile, value: string) {
    setProfile((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!profile) return;
    setSaving(true);
    setNotice(null);
    try {
      await updateCustomerProfile({
        name: profile.name,
        phone: profile.phone ?? "",
        country: profile.country ?? "",
        city: profile.city ?? "",
      });
      setNotice(t("profile.saved"));
    } catch (err) {
      if (err instanceof ApiError) setNotice(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (error) return <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>;
  if (!profile) return <p className="py-10 text-center text-gray-400">{t("loading")}</p>;

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-2xl font-bold text-brand-dark">{t("profile.title")}</h1>

      {notice && <p className="mb-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</p>}

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-gray-100 bg-white p-6">
        <Field label={t("profile.name")} value={profile.name} onChange={(v) => setField("name", v)} />
        <Field label={t("profile.email")} value={profile.email} readOnly />
        <Field label={t("profile.phone")} value={profile.phone ?? ""} onChange={(v) => setField("phone", v)} />
        <Field label={t("profile.country")} value={profile.country ?? ""} onChange={(v) => setField("country", v)} />
        <Field label={t("profile.city")} value={profile.city ?? ""} onChange={(v) => setField("city", v)} />
        {profile.national_id && <Field label={t("profile.nationalId")} value={profile.national_id} readOnly />}

        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-brand-green px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-green-dark disabled:opacity-60"
        >
          {saving ? t("profile.saving") : t("profile.save")}
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  readOnly,
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-brand-dark">{label}</label>
      <input
        type="text"
        value={value}
        readOnly={readOnly}
        onChange={(e) => onChange?.(e.target.value)}
        className={`w-full rounded-md border border-gray-200 px-3 py-2 text-sm ${readOnly ? "bg-gray-50 text-gray-500" : ""}`}
      />
    </div>
  );
}
