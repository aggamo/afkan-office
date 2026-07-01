"use client";

import { useTranslations } from "next-intl";
import { Activity, Database, LayoutDashboard, Route } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";

const NAV_ITEMS = [
  { href: "/admin", key: "dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/workflow", key: "workflow", icon: Route, exact: false },
  { href: "/admin/reference", key: "referenceData", icon: Database, exact: false },
  { href: "/admin/activity", key: "activity", icon: Activity, exact: false },
] as const;

export function AdminShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations("admin");
  const pathname = usePathname();

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 lg:flex-row lg:px-8">
      <aside className="lg:w-60 lg:shrink-0">
        <h2 className="mb-4 text-lg font-bold text-brand-dark">{t("title")}</h2>
        <nav className="flex gap-2 overflow-x-auto lg:flex-col">
          {NAV_ITEMS.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-brand-green text-white"
                    : "text-brand-dark hover:bg-gray-50"
                }`}
              >
                <Icon size={18} />
                {t(`nav.${item.key}`)}
              </Link>
            );
          })}
        </nav>
      </aside>
      <section className="min-w-0 flex-1">{children}</section>
    </div>
  );
}
