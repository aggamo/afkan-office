"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Star } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { ApiError } from "@/lib/api";
import { fetchCustomerReviews, submitCustomerReview, type CustomerReview } from "@/lib/customer-api";

const STATUS_TONE: Record<string, string> = {
  pending: "bg-orange-50 text-orange-700",
  approved: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-700",
};

export default function CustomerReviewsPage() {
  const t = useTranslations("customer");
  const locale = useLocale() as Locale;
  const [reviews, setReviews] = useState<CustomerReview[] | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      await Promise.resolve();
      if (cancelled) return;
      try {
        const result = await fetchCustomerReviews();
        if (!cancelled) setReviews(result);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "error");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (rating < 1) return;
    setSubmitting(true);
    setError(null);
    try {
      const created = await submitCustomerReview(rating, comment);
      setReviews((prev) => (prev ? [created, ...prev] : [created]));
      setRating(0);
      setComment("");
      setNotice(t("reviews.submitted"));
      window.setTimeout(() => setNotice(null), 3000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-brand-dark">{t("reviews.title")}</h1>
      <p className="mb-6 text-sm text-gray-500">{t("reviews.subtitle")}</p>

      {notice && <p className="mb-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</p>}

      <form onSubmit={handleSubmit} className="mb-8 rounded-xl border border-gray-100 bg-white p-5">
        <label className="mb-2 block text-sm font-medium text-brand-dark">{t("reviews.yourRating")}</label>
        <div className="mb-3 flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              aria-label={`${n}`}
              className={n <= rating ? "text-brand-gold" : "text-gray-300"}
            >
              <Star size={26} fill={n <= rating ? "currentColor" : "none"} />
            </button>
          ))}
        </div>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t("reviews.commentPlaceholder")}
          rows={3}
          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
        />
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting || rating < 1}
          className="mt-3 rounded-md bg-brand-green px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {submitting ? t("reviews.submitting") : t("reviews.submit")}
        </button>
      </form>

      <h2 className="mb-3 text-sm font-semibold uppercase text-gray-400">{t("reviews.mine")}</h2>
      {!reviews ? (
        <p className="py-6 text-center text-gray-400">{t("loading")}</p>
      ) : reviews.length === 0 ? (
        <p className="py-6 text-center text-gray-400">{t("reviews.empty")}</p>
      ) : (
        <ul className="space-y-3">
          {reviews.map((r) => (
            <li key={r.id} className="rounded-xl border border-gray-100 bg-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex gap-0.5 text-brand-gold">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} size={16} fill={n <= r.rating ? "currentColor" : "none"} className={n <= r.rating ? "" : "text-gray-300"} />
                  ))}
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_TONE[r.status]}`}>
                  {t(`reviews.status.${r.status}`)}
                </span>
              </div>
              {r.comment && <p className="mt-2 text-sm text-brand-dark">{r.comment}</p>}
              <p className="mt-1 text-xs text-gray-400">
                {r.agency ?? ""} {r.created_at ? `· ${new Date(r.created_at).toLocaleDateString(locale)}` : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
