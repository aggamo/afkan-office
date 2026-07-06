"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { CalendarClock, CheckCircle2, Clock, Heart, UserCheck, Search, ClipboardList, User } from "lucide-react";
import { ApiError } from "@/lib/api";
import { fetchCustomerDashboard, type CustomerDashboard } from "@/lib/customer-api";
import { Link } from "@/i18n/navigation";
import { StatCard } from "@/components/admin/stat-card";

export default function CustomerDashboardPage() {
  const t = useTranslations("customer");
  const [data, setData] = useState<CustomerDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      await Promise.resolve();
      if (cancelled) return;
      try {
        const result = await fetchCustomerDashboard();
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

  if (error) return <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>;
  if (!data) return <p className="py-10 text-center text-gray-400">{t("loading")}</p>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-brand-dark">{t("dashboard.welcome")}</h1>
        <p className="text-sm text-gray-500">{t("dashboard.subtitle")}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label={t("dashboard.activeReservations")} value={data.active_reservations} icon={Clock} tone="blue" />
        <StatCard label={t("dashboard.pendingAuthorization")} value={data.pending_authorization} icon={CalendarClock} tone="orange" />
        <StatCard label={t("dashboard.inRecruitment")} value={data.in_recruitment} icon={UserCheck} tone="purple" />
        <StatCard label={t("dashboard.completed")} value={data.completed} icon={CheckCircle2} tone="green" />
        <StatCard label={t("dashboard.favorites")} value={data.favorites} icon={Heart} tone="red" />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <QuickAction href="/workers" icon={Search} label={t("dashboard.quick.browse")} />
        <QuickAction href="/customer/reservations" icon={ClipboardList} label={t("dashboard.quick.reservations")} />
        <QuickAction href="/favorites" icon={Heart} label={t("dashboard.quick.favorites")} />
        <QuickAction href="/customer/profile" icon={User} label={t("dashboard.quick.profile")} />
      </div>
    </div>
  );
}

function QuickAction({ href, icon: Icon, label }: { href: string; icon: typeof Search; label: string }) {
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
