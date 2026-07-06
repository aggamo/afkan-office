"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, Star, X } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { ApiError } from "@/lib/api";
import { fetchReviews, moderateReview, type AdminReview } from "@/lib/admin-api";

const FILTERS = ["pending", "approved", "rejected", "all"] as const;
const STATUS_TONE: Record<string, string> = {
  pending: "bg-orange-50 text-orange-700",
  approved: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-700",
};

export default function AdminReviewsPage() {
  const t = useTranslations("admin");
  const locale = useLocale() as Locale;
  const [filter, setFilter] = useState<string>("pending");
  const [reviews, setReviews] = useState<AdminReview[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (status: string) => {
    setReviews(null);
    setError(null);
    try {
      const result = await fetchReviews(status === "all" ? undefined : status);
      setReviews(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "error");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await Promise.resolve();
      if (!cancelled) load(filter);
    })();
    return () => {
      cancelled = true;
    };
  }, [filter, load]);

  async function handleModerate(id: number, status: "approved" | "rejected") {
    try {
      await moderateReview(id, status);
      setReviews((prev) => (prev ? prev.filter((r) => (filter === "all" ? true : r.id !== id)) : prev));
    } catch {
      /* ignore */
    }
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-brand-dark">{t("reviews.title")}</h1>
      <p className="mb-6 text-sm text-gray-500">{t("reviews.subtitle")}</p>

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium ${
              filter === f ? "bg-brand-green text-white" : "bg-gray-50 text-brand-dark hover:bg-gray-100"
            }`}
          >
            {t(`reviews.filters.${f}`)}
          </button>
        ))}
      </div>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      {!reviews ? (
        <p className="py-10 text-center text-gray-400">{t("loading")}</p>
      ) : reviews.length === 0 ? (
        <p className="py-10 text-center text-gray-400">{t("reviews.empty")}</p>
      ) : (
        <ul className="space-y-3">
          {reviews.map((r) => (
            <li key={r.id} className="rounded-xl border border-gray-100 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5 text-brand-gold">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} size={15} fill={n <= r.rating ? "currentColor" : "none"} className={n <= r.rating ? "" : "text-gray-300"} />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-brand-dark">{r.customer}</span>
                  {r.agency && <span className="text-xs text-gray-400">· {r.agency}</span>}
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_TONE[r.status]}`}>
                  {t(`reviews.status.${r.status}`)}
                </span>
              </div>
              {r.comment && <p className="mt-2 text-sm text-brand-dark">{r.comment}</p>}
              <p className="mt-1 text-xs text-gray-400">
                {r.created_at ? new Date(r.created_at).toLocaleDateString(locale) : ""}
              </p>
              {r.status === "pending" && (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => handleModerate(r.id, "approved")}
                    className="flex items-center gap-1 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    <Check size={14} /> {t("reviews.approve")}
                  </button>
                  <button
                    onClick={() => handleModerate(r.id, "rejected")}
                    className="flex items-center gap-1 rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600"
                  >
                    <X size={14} /> {t("reviews.reject")}
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
