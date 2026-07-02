"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, X } from "lucide-react";
import { ApiError } from "@/lib/api";
import { acceptAuthorization, fetchAgencyAuthorizations, rejectAuthorization, type AgencyAuthorization } from "@/lib/agency-api";

export default function AgencyAuthorizationsPage() {
  const t = useTranslations("agency");
  const locale = useLocale();
  const [items, setItems] = useState<AgencyAuthorization[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<number | null>(null);

  async function reload() {
    const result = await fetchAgencyAuthorizations();
    setItems(result);
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      await Promise.resolve();
      if (cancelled) return;
      try {
        const result = await fetchAgencyAuthorizations();
        if (!cancelled) setItems(result);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "error");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function respond(reservationId: number, accept: boolean) {
    setBusy(reservationId);
    setError(null);
    try {
      if (accept) await acceptAuthorization(reservationId);
      else await rejectAuthorization(reservationId);
      await reload();
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
    } finally {
      setBusy(null);
    }
  }

  function workerName(a: AgencyAuthorization): string {
    const w = a.reservation.worker;
    if (!w) return "—";
    return locale === "ar" ? w.full_name.ar : locale === "am" ? w.full_name.am : w.full_name.en;
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-brand-dark">{t("authorizations.title")}</h1>
      <p className="mb-6 text-sm text-gray-500">{t("authorizations.subtitle")}</p>

      {error && <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      {!items ? (
        <p className="py-10 text-center text-gray-400">{t("loading")}</p>
      ) : items.length === 0 ? (
        <p className="py-10 text-center text-gray-400">{t("authorizations.empty")}</p>
      ) : (
        <div className="space-y-3">
          {items.map((a) => (
            <div key={a.reservation.id} className="rounded-xl border border-gray-100 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-brand-dark">{workerName(a)}</p>
                  <p className="text-xs text-gray-400">{a.reservation.worker?.internal_number}</p>
                  <p className="mt-2 text-sm text-gray-600">
                    {t("authorizations.customer")}: {a.customer.name ?? "—"}
                    {a.customer.city ? ` · ${a.customer.city}` : ""}
                    {a.customer.country ? ` · ${a.customer.country}` : ""}
                  </p>
                  {a.expires_at && (
                    <p className="mt-1 text-xs text-amber-600">
                      {t("authorizations.expiresAt")}: {new Date(a.expires_at).toLocaleString(locale)}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => respond(a.reservation.id, true)}
                    disabled={busy === a.reservation.id}
                    className="flex items-center gap-1 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                  >
                    <Check size={14} /> {t("authorizations.accept")}
                  </button>
                  <button
                    onClick={() => respond(a.reservation.id, false)}
                    disabled={busy === a.reservation.id}
                    className="flex items-center gap-1 rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 disabled:opacity-60"
                  >
                    <X size={14} /> {t("authorizations.reject")}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
