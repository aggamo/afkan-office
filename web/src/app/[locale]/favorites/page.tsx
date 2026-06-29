"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { WorkerCard } from "@/components/worker-card";
import { fetchFavorites, ApiError, type ApiWorker } from "@/lib/api";
import { adaptWorker } from "@/lib/worker-adapter";
import { getAuthRole, getAuthToken } from "@/lib/auth-client";
import type { Worker } from "@/types/worker";

export default function FavoritesPage() {
  const t = useTranslations("favorites");
  const [workers, setWorkers] = useState<Worker[] | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      await Promise.resolve();
      const token = getAuthToken();
      const role = getAuthRole();
      if (cancelled) return;
      if (!token || role !== "customer") {
        setNeedsLogin(true);
        setWorkers([]);
        return;
      }
      try {
        const items: ApiWorker[] = await fetchFavorites(token);
        if (!cancelled) setWorkers(items.map(adaptWorker));
      } catch (err) {
        if (!cancelled && err instanceof ApiError) setWorkers([]);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <h1 className="mb-8 text-center text-2xl font-bold text-brand-dark lg:text-3xl">{t("title")}</h1>

      {needsLogin && (
        <p className="rounded-xl border border-gray-100 p-6 text-center text-gray-500">{t("loginRequired")}</p>
      )}

      {!needsLogin && workers && workers.length === 0 && (
        <div className="rounded-xl border border-gray-100 p-6 text-center">
          <p className="mb-4 text-gray-500">{t("empty")}</p>
          <Link href="/workers" className="rounded-md bg-brand-green px-4 py-2 text-sm font-semibold text-white">
            {t("browse")}
          </Link>
        </div>
      )}

      {!needsLogin && workers && workers.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {workers.map((worker) => (
            <WorkerCard key={worker.id} worker={worker} />
          ))}
        </div>
      )}
    </div>
  );
}
