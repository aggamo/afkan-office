"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Activity,
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock,
  Database,
  FileText,
  Home,
  UserCheck,
  Users,
  Wallet,
} from "lucide-react";
import type { Locale } from "@/i18n/config";
import { ApiError } from "@/lib/api";
import { fetchDashboard, type ActivityLog, type DashboardData } from "@/lib/admin-api";
import { Link } from "@/i18n/navigation";
import { StatCard } from "./stat-card";

const STATUS_BAR: Record<string, string> = {
  available: "bg-emerald-500",
  reserved_customer: "bg-orange-400",
  reserved_agency: "bg-yellow-500",
  hired: "bg-blue-500",
  unavailable: "bg-gray-400",
};

export function DashboardView() {
  const t = useTranslations("admin");
  const locale = useLocale() as Locale;
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      await Promise.resolve();
      if (cancelled) return;
      try {
        const result = await fetchDashboard();
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "error");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const nf = new Intl.NumberFormat(locale === "ar" ? "ar-EG" : locale);
  const cf = (amount: number, currency: string) =>
    new Intl.NumberFormat(locale === "ar" ? "ar-EG" : locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);

  if (error) return <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>;
  if (!data) return <p className="py-10 text-center text-gray-400">{t("loading")}</p>;

  const w = data.workers;
  const r = data.reservations;
  const f = data.finance;
  const e = data.entities;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-brand-dark">{t("dashboard.title")}</h1>
        <p className="text-sm text-gray-500">{t("dashboard.subtitle")}</p>
      </div>

      {/* Workers */}
      <Section title={t("dashboard.sections.workers")}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard label={t("dashboard.workers.total")} value={nf.format(w.total)} icon={Users} tone="blue" />
          <StatCard label={t("dashboard.workers.available")} value={nf.format(w.available)} icon={CheckCircle2} tone="green" />
          <StatCard label={t("dashboard.workers.reserved_agency")} value={nf.format(w.reserved_agency)} icon={Clock} tone="orange" />
          <StatCard label={t("dashboard.workers.reserved_customer")} value={nf.format(w.reserved_customer)} icon={Clock} tone="orange" />
          <StatCard label={t("dashboard.workers.hired")} value={nf.format(w.hired)} icon={UserCheck} tone="purple" />
          <StatCard label={t("dashboard.workers.unavailable")} value={nf.format(w.unavailable)} icon={Users} tone="gray" />
        </div>
      </Section>

      {/* Reservations */}
      <Section title={t("dashboard.sections.reservations")}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard label={t("dashboard.reservations.active")} value={nf.format(r.active)} icon={Clock} tone="blue" />
          <StatCard label={t("dashboard.reservations.createdToday")} value={nf.format(r.created_today)} icon={CalendarClock} tone="green" />
          <StatCard label={t("dashboard.reservations.expiringToday")} value={nf.format(r.expiring_today)} icon={CalendarClock} tone="red" />
          <StatCard label={t("dashboard.reservations.convertedTotal")} value={nf.format(r.converted_total)} icon={UserCheck} tone="purple" />
          <StatCard
            label={t("dashboard.reservations.conversionRate")}
            value={`${nf.format(r.conversion_rate)}%`}
            sub={`${t("dashboard.reservations.expiredTotal")}: ${nf.format(r.expired_total)}`}
            icon={Activity}
            tone="gray"
          />
        </div>
      </Section>

      {/* Finance */}
      <Section title={t("dashboard.sections.finance")}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            label={t("dashboard.finance.outstanding")}
            value={nf.format(f.outstanding_count)}
            sub={cf(f.outstanding_amount, f.currency)}
            icon={FileText}
            tone="orange"
          />
          <StatCard
            label={t("dashboard.finance.paidThisMonth")}
            value={nf.format(f.paid_this_month_count)}
            sub={cf(f.paid_this_month_amount, f.currency)}
            icon={Wallet}
            tone="green"
          />
          <StatCard label={t("dashboard.finance.revenueTotal")} value={cf(f.revenue_total, f.currency)} icon={Wallet} tone="blue" />
          <StatCard label={t("dashboard.finance.drafts")} value={nf.format(f.draft_count)} icon={FileText} tone="gray" />
        </div>
      </Section>

      {/* Entities */}
      <Section title={t("dashboard.sections.entities")}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            label={t("dashboard.entities.agencies")}
            value={nf.format(e.agencies)}
            sub={`${t("dashboard.entities.verified")}: ${nf.format(e.agencies_verified)}`}
            icon={Building2}
            tone="blue"
          />
          <StatCard label={t("dashboard.entities.customers")} value={nf.format(e.customers)} icon={Users} tone="green" />
          <StatCard label={t("dashboard.entities.employees")} value={nf.format(e.employees)} icon={UserCheck} tone="purple" />
        </div>
      </Section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Worker status distribution */}
        <Section title={t("dashboard.sections.workerStatus")}>
          <div className="space-y-3 rounded-xl border border-gray-100 bg-white p-5">
            {data.charts.worker_status.map((s) => {
              const pct = w.total > 0 ? Math.round((s.count / w.total) * 100) : 0;
              return (
                <div key={s.key}>
                  <div className="mb-1 flex justify-between text-xs text-gray-500">
                    <span>{t(`dashboard.workers.${s.key}`)}</span>
                    <span>{nf.format(s.count)} · {nf.format(pct)}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                    <div className={`h-full ${STATUS_BAR[s.key] ?? "bg-gray-400"}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Section>

        {/* Monthly trend */}
        <Section title={t("dashboard.sections.monthly")}>
          <MonthlyChart data={data.charts.monthly} nf={nf} labels={{ created: t("dashboard.monthly.workersCreated"), completed: t("dashboard.monthly.completed") }} />
        </Section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top agencies */}
        <Section title={t("dashboard.sections.topAgencies")}>
          <div className="rounded-xl border border-gray-100 bg-white p-2">
            {data.charts.top_agencies.length === 0 ? (
              <p className="p-4 text-center text-sm text-gray-400">{t("dashboard.empty")}</p>
            ) : (
              <ul className="divide-y divide-gray-50">
                {data.charts.top_agencies.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-2 p-3 text-sm">
                    <span className="font-medium text-brand-dark">{a.name}</span>
                    <span className="text-xs text-gray-500">
                      {t("dashboard.agency.completedCases")}: {nf.format(a.completed_cases)} · ★ {nf.format(a.rating)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Section>

        {/* Recent activity */}
        <Section title={t("dashboard.sections.recentActivity")}>
          <div className="rounded-xl border border-gray-100 bg-white p-2">
            {data.recent_activity.length === 0 ? (
              <p className="p-4 text-center text-sm text-gray-400">{t("dashboard.noActivity")}</p>
            ) : (
              <ul className="divide-y divide-gray-50">
                {data.recent_activity.map((log) => (
                  <ActivityRow key={log.id} log={log} locale={locale} systemLabel={t("activity.system")} />
                ))}
              </ul>
            )}
            <Link href="/admin/activity" className="mt-1 block p-2 text-center text-xs font-semibold text-brand-green hover:underline">
              {t("dashboard.quick.viewActivity")}
            </Link>
          </div>
        </Section>
      </div>

      {/* Quick actions */}
      <Section title={t("dashboard.sections.quickActions")}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <QuickAction href="/admin/reference" icon={Database} label={t("dashboard.quick.referenceData")} />
          <QuickAction href="/admin/activity" icon={Activity} label={t("dashboard.quick.viewActivity")} />
          <QuickAction href="/workers" icon={Home} label={t("dashboard.quick.browseWorkers")} />
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">{title}</h2>
      {children}
    </section>
  );
}

function MonthlyChart({
  data,
  nf,
  labels,
}: {
  data: DashboardData["charts"]["monthly"];
  nf: Intl.NumberFormat;
  labels: { created: string; completed: string };
}) {
  const max = Math.max(1, ...data.map((d) => Math.max(d.workers_created, d.completed)));
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5">
      <div className="mb-3 flex gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-500" />{labels.created}</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" />{labels.completed}</span>
      </div>
      <div className="flex h-40 items-end justify-between gap-2">
        {data.map((d) => (
          <div key={d.month} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex h-32 w-full items-end justify-center gap-1">
              <div
                className="w-1/2 rounded-t bg-blue-500"
                style={{ height: `${(d.workers_created / max) * 100}%` }}
                title={`${labels.created}: ${nf.format(d.workers_created)}`}
              />
              <div
                className="w-1/2 rounded-t bg-emerald-500"
                style={{ height: `${(d.completed / max) * 100}%` }}
                title={`${labels.completed}: ${nf.format(d.completed)}`}
              />
            </div>
            <span className="text-[10px] text-gray-400">{d.month.slice(5)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivityRow({ log, locale, systemLabel }: { log: ActivityLog; locale: Locale; systemLabel: string }) {
  const date = log.created_at
    ? new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : locale, { dateStyle: "short", timeStyle: "short" }).format(new Date(log.created_at))
    : "";
  return (
    <li className="flex items-center justify-between gap-2 p-3 text-sm">
      <span className="min-w-0">
        <span className="block truncate font-medium text-brand-dark">{log.action}</span>
        <span className="text-xs text-gray-400">{log.user ?? systemLabel}</span>
      </span>
      <span className="shrink-0 text-xs text-gray-400">{date}</span>
    </li>
  );
}

function QuickAction({ href, icon: Icon, label }: { href: string; icon: typeof Database; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-4 transition hover:border-brand-green hover:shadow-sm"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-green/10 text-brand-green">
        <Icon size={20} />
      </span>
      <span className="text-sm font-semibold text-brand-dark">{label}</span>
    </Link>
  );
}
