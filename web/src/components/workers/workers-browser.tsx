"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { WorkerCard } from "@/components/worker-card";
import type { Locale } from "@/i18n/config";
import type { ReservationStatus, Worker } from "@/types/worker";

const PAGE_SIZE = 8;

export function WorkersBrowser({ workers }: { workers: Worker[] }) {
  const t = useTranslations("workers");
  const locale = useLocale() as Locale;

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | "all">("all");
  const [minAge, setMinAge] = useState(18);
  const [maxAge, setMaxAge] = useState(60);
  const [page, setPage] = useState(1);

  const allSkills = useMemo(() => {
    const set = new Map<string, { ar: string; en: string; am: string }>();
    workers.forEach((w) => w.skills.forEach((s) => set.set(s.name.en, s.name)));
    return Array.from(set.values());
  }, [workers]);
  const [skillFilter, setSkillFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    return workers.filter((w) => {
      const matchesQuery =
        query.trim() === "" ||
        w.internalNumber.toLowerCase().includes(query.toLowerCase()) ||
        w.skills.some((s) => s.name[locale].toLowerCase().includes(query.toLowerCase())) ||
        w.languages.some((l) => l.name[locale].toLowerCase().includes(query.toLowerCase()));

      const matchesStatus = statusFilter === "all" || w.reservationStatus === statusFilter;
      const matchesAge = w.age >= minAge && w.age <= maxAge;
      const matchesSkill = skillFilter === "all" || w.skills.some((s) => s.name.en === skillFilter);

      return matchesQuery && matchesStatus && matchesAge && matchesSkill;
    });
  }, [workers, query, statusFilter, minAge, maxAge, skillFilter, locale]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-brand-dark lg:text-3xl">{t("title")}</h1>

      <div className="mb-8 grid gap-6 lg:grid-cols-4">
        {/* Filters */}
        <aside className="rounded-xl border border-gray-100 p-5 shadow-sm lg:col-span-1">
          <h2 className="mb-4 font-semibold text-brand-dark">{t("filters.title")}</h2>

          <div className="mb-4">
            <label className="mb-1 block text-xs font-medium text-gray-500">{t("search")}</label>
            <div className="flex items-center gap-2 rounded-md border border-gray-200 px-2">
              <Search size={16} className="text-gray-400" />
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full py-2 text-sm outline-none"
                placeholder={t("search")}
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-xs font-medium text-gray-500">{t("filters.reservationStatus")}</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as ReservationStatus | "all");
                setPage(1);
              }}
              className="w-full rounded-md border border-gray-200 px-2 py-2 text-sm"
            >
              <option value="all">—</option>
              <option value="available">{t("status.available")}</option>
              <option value="reserved_agency">{t("status.reserved_agency")}</option>
              <option value="reserved_customer">{t("status.reserved_customer")}</option>
              <option value="in_progress">{t("status.in_progress")}</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-xs font-medium text-gray-500">{t("filters.skills")}</label>
            <select
              value={skillFilter}
              onChange={(e) => {
                setSkillFilter(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-md border border-gray-200 px-2 py-2 text-sm"
            >
              <option value="all">—</option>
              {allSkills.map((skill) => (
                <option key={skill.en} value={skill.en}>
                  {skill[locale]}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-xs font-medium text-gray-500">
              {t("filters.age")}: {minAge} - {maxAge}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={18}
                max={60}
                value={minAge}
                onChange={(e) => {
                  setMinAge(Number(e.target.value));
                  setPage(1);
                }}
                className="w-full"
              />
              <input
                type="range"
                min={18}
                max={60}
                value={maxAge}
                onChange={(e) => {
                  setMaxAge(Number(e.target.value));
                  setPage(1);
                }}
                className="w-full"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setQuery("");
              setStatusFilter("all");
              setSkillFilter("all");
              setMinAge(18);
              setMaxAge(60);
              setPage(1);
            }}
            className="w-full rounded-md border border-gray-200 py-2 text-sm font-medium text-brand-dark hover:bg-brand-light"
          >
            {t("filters.reset")}
          </button>
        </aside>

        {/* Results */}
        <div className="lg:col-span-3">
          {pageItems.length === 0 ? (
            <p className="rounded-xl border border-gray-100 p-10 text-center text-gray-500">{t("noResults")}</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {pageItems.map((worker) => (
                <WorkerCard key={worker.id} worker={worker} />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-8 flex justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  className={`h-9 w-9 rounded-md text-sm font-medium ${
                    p === page ? "bg-brand-green text-white" : "border border-gray-200 text-brand-dark"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
