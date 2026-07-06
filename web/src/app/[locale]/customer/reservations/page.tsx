"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ApiError, fetchAgencies, type ApiAgency } from "@/lib/api";
import {
  authorizeReservationAgency,
  cancelReservation,
  fetchCustomerReservations,
  type CustomerReservation,
} from "@/lib/customer-api";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/config";

const AUTH_TONE: Record<string, string> = {
  none: "bg-gray-100 text-gray-600",
  pending: "bg-orange-50 text-orange-700",
  accepted: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-700",
};

const STATUS_TONE: Record<string, string> = {
  active: "bg-blue-50 text-blue-700",
  converted: "bg-purple-50 text-purple-700",
  expired: "bg-gray-100 text-gray-500",
  cancelled: "bg-gray-100 text-gray-500",
  completed: "bg-emerald-50 text-emerald-700",
};

export default function CustomerReservationsPage() {
  const t = useTranslations("customer");
  const locale = useLocale() as Locale;
  const [reservations, setReservations] = useState<CustomerReservation[] | null>(null);
  const [agencies, setAgencies] = useState<ApiAgency[]>([]);
  const [selected, setSelected] = useState<Record<number, string>>({});
  const [changing, setChanging] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState<number | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      await Promise.resolve();
      if (cancelled) return;
      try {
        const [res, ags] = await Promise.all([fetchCustomerReservations(), fetchAgencies()]);
        if (cancelled) return;
        setReservations(res);
        setAgencies(ags.filter((a) => a.is_verified));
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "error");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 2500);
  }

  function replace(updated: CustomerReservation) {
    setReservations((prev) => (prev ? prev.map((r) => (r.id === updated.id ? updated : r)) : prev));
  }

  async function handleAuthorize(reservationId: number) {
    const agencyId = Number(selected[reservationId]);
    if (!agencyId) return;
    setBusy(reservationId);
    try {
      const updated = await authorizeReservationAgency(reservationId, agencyId);
      replace(updated);
      setChanging((prev) => {
        const next = new Set(prev);
        next.delete(reservationId);
        return next;
      });
      flash(t("reservations.awaitingResponse"));
    } catch (err) {
      if (err instanceof ApiError) flash(err.message);
    } finally {
      setBusy(null);
    }
  }

  async function handleCancel(reservationId: number) {
    setConfirmCancel(null);
    setBusy(reservationId);
    try {
      const updated = await cancelReservation(reservationId);
      replace(updated);
      flash(t("reservations.status.cancelled"));
    } catch (err) {
      if (err instanceof ApiError) flash(err.message);
    } finally {
      setBusy(null);
    }
  }

  if (error) return <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>;
  if (!reservations) return <p className="py-10 text-center text-gray-400">{t("loading")}</p>;

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-brand-dark">{t("reservations.title")}</h1>
      <p className="mb-6 text-sm text-gray-500">{t("reservations.selectAgencyHint")}</p>

      {notice && <p className="mb-3 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</p>}

      {reservations.length === 0 ? (
        <div className="rounded-xl border border-gray-100 p-8 text-center">
          <p className="mb-4 text-gray-500">{t("reservations.empty")}</p>
          <Link href="/workers" className="rounded-md bg-brand-green px-4 py-2 text-sm font-semibold text-white">
            {t("reservations.browse")}
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {reservations.map((r) => (
            <ReservationCard
              key={r.id}
              reservation={r}
              agencies={agencies}
              locale={locale}
              t={t}
              busy={busy === r.id}
              selectedAgency={selected[r.id] ?? ""}
              showSelector={changing.has(r.id)}
              onSelectAgency={(value) => setSelected((prev) => ({ ...prev, [r.id]: value }))}
              onChangeAgency={() => setChanging((prev) => new Set(prev).add(r.id))}
              onAuthorize={() => handleAuthorize(r.id)}
              confirmingCancel={confirmCancel === r.id}
              onAskCancel={() => setConfirmCancel(r.id)}
              onCancel={() => handleCancel(r.id)}
              onDismissCancel={() => setConfirmCancel(null)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function remaining(expiresAt: string | null): string | null {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return null;
  const hours = Math.floor(diff / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  return `${hours}h ${minutes}m`;
}

type CardProps = {
  reservation: CustomerReservation;
  agencies: ApiAgency[];
  locale: Locale;
  t: ReturnType<typeof useTranslations>;
  busy: boolean;
  selectedAgency: string;
  showSelector: boolean;
  onSelectAgency: (value: string) => void;
  onChangeAgency: () => void;
  onAuthorize: () => void;
  confirmingCancel: boolean;
  onAskCancel: () => void;
  onCancel: () => void;
  onDismissCancel: () => void;
};

function ReservationCard({
  reservation: r,
  agencies,
  locale,
  t,
  busy,
  selectedAgency,
  showSelector,
  onSelectAgency,
  onChangeAgency,
  onAuthorize,
  confirmingCancel,
  onAskCancel,
  onCancel,
  onDismissCancel,
}: CardProps) {
  const timeLeft = r.status === "active" ? remaining(r.expires_at) : null;
  const workerName = r.worker ? r.worker.full_name[locale] : `#${r.worker_id}`;
  const isPending = r.status === "active" && r.authorization_status === "pending";
  const needsAgency =
    r.status === "active" && (r.authorization_status === "none" || r.authorization_status === "rejected" || (isPending && showSelector));

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-brand-dark">{workerName}</span>
            {r.worker && <span className="text-xs text-gray-400">{r.worker.internal_number}</span>}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_TONE[r.status] ?? "bg-gray-100"}`}>
              {t(`reservations.status.${r.status}`)}
            </span>
            {r.status === "active" && (
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${AUTH_TONE[r.authorization_status] ?? "bg-gray-100"}`}>
                {t(`reservations.authStatus.${r.authorization_status}`)}
              </span>
            )}
            {timeLeft && (
              <span className="text-xs text-gray-400">
                {t("reservations.expiresIn")} {timeLeft}
              </span>
            )}
          </div>
        </div>

        {r.status === "active" && r.authorization_status !== "accepted" && (
          <div>
            {confirmingCancel ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">{t("reservations.cancelConfirm")}</span>
                <button onClick={onCancel} disabled={busy} className="rounded bg-red-600 px-2 py-1 text-xs font-semibold text-white">
                  {t("reservations.confirm")}
                </button>
                <button onClick={onDismissCancel} className="rounded border border-gray-200 px-2 py-1 text-xs">
                  {t("reservations.back")}
                </button>
              </div>
            ) : (
              <button onClick={onAskCancel} className="text-xs font-semibold text-red-500 hover:underline">
                {t("reservations.cancel")}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Agency selection / authorization state */}
      <div className="mt-4 border-t border-gray-50 pt-4">
        {needsAgency && (
          <div>
            {r.authorization_status === "rejected" && (
              <p className="mb-2 text-sm text-red-600">{t("reservations.rejectedRetry")}</p>
            )}
            <label className="mb-1 block text-sm font-medium text-brand-dark">{t("reservations.selectAgency")}</label>
            <div className="flex flex-wrap gap-2">
              <select
                value={selectedAgency}
                onChange={(e) => onSelectAgency(e.target.value)}
                className="min-w-56 flex-1 rounded-md border border-gray-200 px-3 py-2 text-sm"
              >
                <option value="">{t("reservations.chooseAgencyPlaceholder")}</option>
                {agencies.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                    {a.city ? ` — ${a.city}` : ""} · ★ {a.rating}
                  </option>
                ))}
              </select>
              <button
                onClick={onAuthorize}
                disabled={busy || !selectedAgency}
                className="rounded-md bg-brand-green px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {busy ? t("reservations.authorizing") : t("reservations.authorize")}
              </button>
            </div>
          </div>
        )}

        {isPending && !showSelector && (
          <div className="text-sm">
            <p className="text-gray-600">
              {t("reservations.authorizedTo")}:{" "}
              <span className="font-semibold text-brand-dark">{r.authorized_agency?.name ?? "—"}</span>
            </p>
            <p className="mt-1 text-orange-600">{t("reservations.awaitingResponse")}</p>
            <button onClick={onChangeAgency} className="mt-2 text-xs font-semibold text-brand-green hover:underline">
              {t("reservations.changeAgency")}
            </button>
          </div>
        )}

        {r.status === "converted" && <p className="text-sm text-emerald-700">{t("reservations.acceptedInfo")}</p>}
      </div>
    </div>
  );
}
