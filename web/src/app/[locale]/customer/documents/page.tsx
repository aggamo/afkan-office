"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Download, FileText, Trash2, Upload } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { ApiError } from "@/lib/api";
import {
  deleteCustomerDocument,
  downloadCustomerDocument,
  fetchCustomerDocuments,
  uploadCustomerDocument,
  type CustomerDocument,
} from "@/lib/customer-api";

const CATEGORIES = ["passport", "national_id", "family", "other"] as const;
const STATUS_TONE: Record<string, string> = {
  pending: "bg-orange-50 text-orange-700",
  verified: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-700",
};

export default function CustomerDocumentsPage() {
  const t = useTranslations("customer");
  const locale = useLocale() as Locale;
  const [docs, setDocs] = useState<CustomerDocument[] | null>(null);
  const [category, setCategory] = useState<string>("passport");
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      await Promise.resolve();
      if (cancelled) return;
      try {
        const result = await fetchCustomerDocuments();
        if (!cancelled) setDocs(result);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "error");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 2500);
  }

  async function handleUpload(event: React.FormEvent) {
    event.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const created = await uploadCustomerDocument(category, file);
      setDocs((prev) => (prev ? [created, ...prev] : [created]));
      if (fileRef.current) fileRef.current.value = "";
      flash(t("documents.uploaded"));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "error");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteCustomerDocument(id);
      setDocs((prev) => (prev ? prev.filter((d) => d.id !== id) : prev));
      flash(t("documents.deleted"));
    } catch (err) {
      if (err instanceof ApiError) flash(err.message);
    }
  }

  const fmtSize = (bytes: number) => (bytes < 1024 ? `${bytes} B` : `${Math.round(bytes / 1024)} KB`);

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-brand-dark">{t("documents.title")}</h1>
      <p className="mb-6 text-sm text-gray-500">{t("documents.hint")}</p>

      <form onSubmit={handleUpload} className="mb-6 rounded-xl border border-gray-100 bg-white p-5">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-brand-dark">{t("documents.category")}</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-md border border-gray-200 px-3 py-2 text-sm"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {t(`documents.categories.${c}`)}
                </option>
              ))}
            </select>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            className="text-sm"
            required
          />
          <button
            type="submit"
            disabled={uploading}
            className="flex items-center gap-1.5 rounded-md bg-brand-green px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            <Upload size={15} /> {uploading ? t("documents.uploading") : t("documents.upload")}
          </button>
        </div>
        <p className="mt-2 text-xs text-gray-400">{t("documents.allowed")}</p>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </form>

      {notice && <p className="mb-3 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</p>}

      {!docs ? (
        <p className="py-10 text-center text-gray-400">{t("loading")}</p>
      ) : docs.length === 0 ? (
        <p className="py-10 text-center text-gray-400">{t("documents.empty")}</p>
      ) : (
        <ul className="space-y-3">
          {docs.map((doc) => (
            <li key={doc.id} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-4">
              <FileText size={20} className="shrink-0 text-brand-green" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-brand-dark">{doc.original_name}</p>
                <p className="text-xs text-gray-400">
                  {t(`documents.categories.${doc.category}`)} · {fmtSize(doc.size)} ·{" "}
                  {doc.created_at ? new Date(doc.created_at).toLocaleDateString(locale) : ""}
                </p>
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_TONE[doc.status]}`}>
                {t(`documents.status.${doc.status}`)}
              </span>
              <button
                type="button"
                onClick={() => downloadCustomerDocument(doc)}
                aria-label={t("documents.download")}
                className="rounded p-1.5 text-gray-500 hover:bg-gray-50 hover:text-brand-green"
              >
                <Download size={16} />
              </button>
              <button
                type="button"
                onClick={() => handleDelete(doc.id)}
                aria-label={t("documents.delete")}
                className="rounded p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
