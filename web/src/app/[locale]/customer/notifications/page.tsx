"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Bell, BellRing } from "lucide-react";
import { ApiError } from "@/lib/api";
import { fetchNotifications, markNotificationRead, type Notification } from "@/lib/customer-api";
import type { Locale } from "@/i18n/config";

export default function CustomerNotificationsPage() {
  const t = useTranslations("customer");
  const locale = useLocale() as Locale;
  const [items, setItems] = useState<Notification[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      await Promise.resolve();
      if (cancelled) return;
      try {
        const page = await fetchNotifications(1, 50);
        if (!cancelled) setItems(page.items);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "error");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleRead(id: number) {
    try {
      const updated = await markNotificationRead(id);
      setItems((prev) => (prev ? prev.map((n) => (n.id === id ? updated : n)) : prev));
    } catch {
      /* ignore */
    }
  }

  const fmtDate = (value: string | null) =>
    value ? new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "";

  if (error) return <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>;
  if (!items) return <p className="py-10 text-center text-gray-400">{t("loading")}</p>;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-brand-dark">{t("notifications.title")}</h1>

      {items.length === 0 ? (
        <p className="py-10 text-center text-gray-400">{t("notifications.empty")}</p>
      ) : (
        <ul className="space-y-3">
          {items.map((n) => {
            const unread = n.status !== "read";
            return (
              <li
                key={n.id}
                className={`flex items-start gap-3 rounded-xl border p-4 ${
                  unread ? "border-brand-green/30 bg-brand-green/5" : "border-gray-100 bg-white"
                }`}
              >
                <span className={`mt-0.5 ${unread ? "text-brand-green" : "text-gray-300"}`}>
                  {unread ? <BellRing size={18} /> : <Bell size={18} />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-brand-dark">{n.title[locale]}</p>
                  {n.body[locale] && <p className="mt-0.5 text-sm text-gray-600">{n.body[locale]}</p>}
                  <p className="mt-1 text-xs text-gray-400">{fmtDate(n.created_at)}</p>
                </div>
                {unread && (
                  <button
                    onClick={() => handleRead(n.id)}
                    className="shrink-0 rounded-md border border-gray-200 px-2.5 py-1 text-xs font-semibold text-brand-green hover:bg-brand-green/10"
                  >
                    {t("notifications.markRead")}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
