"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { Locale } from "@/i18n/config";
import { ApiError } from "@/lib/api";
import { fetchReferenceResources, type RefDefinition } from "@/lib/admin-api";
import { ReferenceTable } from "@/components/admin/reference-table";

export default function ReferencePage() {
  const t = useTranslations("admin");
  const locale = useLocale() as Locale;
  const [resources, setResources] = useState<RefDefinition[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      await Promise.resolve();
      if (cancelled) return;
      try {
        const list = await fetchReferenceResources();
        if (cancelled) return;
        setResources(list);
        setSelected((prev) => prev ?? list[0]?.key ?? null);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "error");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-brand-dark">{t("reference.title")}</h1>
      <p className="mb-6 text-sm text-gray-500">{t("reference.subtitle")}</p>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      {!resources && !error && <p className="py-10 text-center text-gray-400">{t("loading")}</p>}

      {resources && (
        <>
          <div className="mb-6 flex flex-wrap gap-2 border-b border-gray-100 pb-3">
            {resources.map((resource) => (
              <button
                key={resource.key}
                type="button"
                onClick={() => setSelected(resource.key)}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                  selected === resource.key
                    ? "bg-brand-green text-white"
                    : "bg-gray-50 text-brand-dark hover:bg-gray-100"
                }`}
              >
                {resource.label[locale]}
              </button>
            ))}
          </div>

          {selected && <ReferenceTable key={selected} resource={selected} />}
        </>
      )}
    </div>
  );
}
