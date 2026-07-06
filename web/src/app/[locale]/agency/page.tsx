"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ClipboardCheck, FileText, Wallet } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { ApiError } from "@/lib/api";
import { fetchAgencyAuthorizations, fetchAgencyInvoices } from "@/lib/agency-api";

type Stats = { pending: number; invoices: number; unpaid: number };

export default function AgencyDashboardPage() {
  const t = useTranslations("agency");
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      await Promise.resolve();
      if (cancelled) return;
      try {
        const [auths, invoices] = await Promise.all([fetchAgencyAuthorizations(), fetchAgencyInvoices()]);
        if (cancelled) return;
        setStats({
          pending: auths.length,
          invoices: invoices.items.length,
          unpaid: invoices.items.filter((i) => i.status === "issued").length,
        });
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "error");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const cards = [
    { key: "pending", value: stats?.pending, icon: ClipboardCheck, href: "/agency/authorizations", color: "text-amber-600" },
    { key: "unpaid", value: stats?.unpaid, icon: Wallet, href: "/agency/invoices", color: "text-blue-600" },
    { key: "invoices", value: stats?.invoices, icon: FileText, href: "/agency/invoices", color: "text-emerald-600" },
  ] as const;

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-brand-dark">{t("dashboard.title")}</h1>
      <p className="mb-6 text-sm text-gray-500">{t("dashboard.subtitle")}</p>

      {error && <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link key={c.key} href={c.href} className="rounded-xl border border-gray-100 p-5 transition hover:border-brand-green">
              <Icon className={c.color} size={24} />
              <p className="mt-3 text-3xl font-bold text-brand-dark">{stats ? c.value : "—"}</p>
              <p className="mt-1 text-sm text-gray-500">{t(`dashboard.${c.key}`)}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
