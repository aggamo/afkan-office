"use client";

import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useCompare } from "./compare-context";

export function CompareBar() {
  const t = useTranslations("compare");
  const { compareIds, removeFromCompare, clearCompare } = useCompare();

  if (compareIds.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white px-4 py-3 shadow-lg">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-brand-dark">
            {t("selected", { count: compareIds.length })}
          </span>
          <div className="flex gap-1.5">
            {compareIds.map((id) => (
              <span
                key={id}
                className="flex items-center gap-1 rounded-full bg-brand-light px-2.5 py-1 text-xs text-brand-dark"
              >
                #{id}
                <button type="button" onClick={() => removeFromCompare(id)} aria-label={t("remove")}>
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={clearCompare} className="text-xs text-gray-500 hover:underline">
            {t("clear")}
          </button>
          <Link
            href="/compare"
            className="rounded-md bg-brand-green px-4 py-2 text-sm font-semibold text-white hover:bg-brand-green-dark"
          >
            {t("viewComparison")}
          </Link>
        </div>
      </div>
    </div>
  );
}
