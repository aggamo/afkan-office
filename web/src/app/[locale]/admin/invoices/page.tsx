"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CheckCircle2, Plus, XCircle } from "lucide-react";
import { ApiError } from "@/lib/api";
import {
  cancelInvoice,
  createInvoice,
  fetchAdminAgencies,
  fetchAdminInvoices,
  fetchAdminWorkersFull,
  markInvoicePaid,
  type AdminAgency,
  type AdminInvoice,
  type AdminWorkerFull,
} from "@/lib/admin-api";

const STATUSES = ["all", "draft", "issued", "paid", "cancelled"] as const;

function statusClass(status: string): string {
  switch (status) {
    case "paid":
      return "bg-emerald-50 text-emerald-700";
    case "issued":
      return "bg-blue-50 text-blue-700";
    case "cancelled":
      return "bg-red-50 text-red-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

export default function AdminInvoicesPage() {
  const t = useTranslations("admin");
  const locale = useLocale();
  const [items, setItems] = useState<AdminInvoice[] | null>(null);
  const [status, setStatus] = useState<string>("all");
  const [error, setError] = useState<string | null>(null);
  const [agencies, setAgencies] = useState<AdminAgency[]>([]);
  const [workers, setWorkers] = useState<AdminWorkerFull[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ agency_id: 0, worker_id: 0, amount: "", status: "issued" as "draft" | "issued", notes: "" });

  async function reload() {
    const result = await fetchAdminInvoices(status === "all" ? undefined : status);
    setItems(result.items);
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      await Promise.resolve();
      if (cancelled) return;
      setItems(null);
      try {
        const result = await fetchAdminInvoices(status === "all" ? undefined : status);
        if (!cancelled) setItems(result.items);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "error");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [status]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      await Promise.resolve();
      if (cancelled) return;
      try {
        const [ags, ws] = await Promise.all([fetchAdminAgencies(), fetchAdminWorkersFull()]);
        if (cancelled) return;
        setAgencies(ags);
        setWorkers(ws.items);
      } catch {
        // options are non-critical; ignore
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function submit() {
    if (!form.agency_id || !form.worker_id) {
      setError(t("invoices.selectRequired"));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createInvoice({
        agency_id: form.agency_id,
        worker_id: form.worker_id,
        amount: form.amount === "" ? null : Number(form.amount),
        status: form.status,
        notes: form.notes || null,
      });
      setShowForm(false);
      setForm({ agency_id: 0, worker_id: 0, amount: "", status: "issued", notes: "" });
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "error");
    } finally {
      setSaving(false);
    }
  }

  async function act(fn: () => Promise<AdminInvoice>) {
    try {
      await fn();
      await reload();
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
    }
  }

  const workerLabel = useMemo(
    () => (w: AdminWorkerFull) =>
      `${w.internal_number} · ${locale === "ar" ? w.full_name_ar : locale === "am" ? w.full_name_am : w.full_name_en}`,
    [locale],
  );

  const inputClass = "w-full rounded-md border border-gray-200 px-3 py-2 text-sm";

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="mb-1 text-2xl font-bold text-brand-dark">{t("invoices.title")}</h1>
          <p className="text-sm text-gray-500">{t("invoices.subtitle")}</p>
        </div>
        <button onClick={() => setShowForm((v) => !v)} className="flex items-center gap-1 rounded-md bg-brand-green px-3 py-2 text-sm font-semibold text-white">
          <Plus size={16} /> {t("invoices.create")}
        </button>
      </div>

      {error && <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      {showForm && (
        <div className="mb-5 rounded-xl border border-gray-100 p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block text-gray-500">{t("invoices.agency")}</span>
              <select value={form.agency_id} onChange={(e) => setForm((f) => ({ ...f, agency_id: Number(e.target.value) }))} className={inputClass}>
                <option value={0}>—</option>
                {agencies.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-gray-500">{t("invoices.worker")}</span>
              <select value={form.worker_id} onChange={(e) => setForm((f) => ({ ...f, worker_id: Number(e.target.value) }))} className={inputClass}>
                <option value={0}>—</option>
                {workers.map((w) => <option key={w.id} value={w.id}>{workerLabel(w)}</option>)}
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-gray-500">{t("invoices.amount")}</span>
              <input type="number" min={0} value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} placeholder={t("invoices.amountHint")} className={inputClass} />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-gray-500">{t("invoices.status")}</span>
              <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as "draft" | "issued" }))} className={inputClass}>
                <option value="issued">{t("invoices.statuses.issued")}</option>
                <option value="draft">{t("invoices.statuses.draft")}</option>
              </select>
            </label>
            <label className="text-sm sm:col-span-2">
              <span className="mb-1 block text-gray-500">{t("invoices.notes")}</span>
              <input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} className={inputClass} />
            </label>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button onClick={() => setShowForm(false)} className="rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-brand-dark">
              {t("invoices.cancelForm")}
            </button>
            <button onClick={submit} disabled={saving} className="rounded-md bg-brand-green px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
              {saving ? t("invoices.saving") : t("invoices.save")}
            </button>
          </div>
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${status === s ? "bg-brand-green text-white" : "bg-gray-50 text-brand-dark hover:bg-gray-100"}`}
          >
            {t(`invoices.statuses.${s}`)}
          </button>
        ))}
      </div>

      {!items ? (
        <p className="py-10 text-center text-gray-400">{t("loading")}</p>
      ) : items.length === 0 ? (
        <p className="py-10 text-center text-gray-400">{t("invoices.empty")}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="p-3 text-start">{t("invoices.number")}</th>
                <th className="p-3 text-start">{t("invoices.agency")}</th>
                <th className="p-3 text-start">{t("invoices.worker")}</th>
                <th className="p-3 text-start">{t("invoices.amount")}</th>
                <th className="p-3 text-start">{t("invoices.status")}</th>
                <th className="p-3 text-end">{t("agencies.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((inv) => (
                <tr key={inv.id} className="border-t border-gray-100">
                  <td className="p-3 font-mono text-xs text-gray-600">{inv.invoice_number}</td>
                  <td className="p-3 text-gray-600">{inv.agency?.name ?? "—"}</td>
                  <td className="p-3 text-gray-600">
                    {inv.worker
                      ? locale === "ar" ? inv.worker.full_name_ar : locale === "am" ? inv.worker.full_name_am : inv.worker.full_name_en
                      : "—"}
                  </td>
                  <td className="p-3 font-semibold text-brand-dark">
                    {inv.amount != null ? `${Number(inv.amount).toLocaleString(locale)} ${inv.currency ?? ""}` : "—"}
                  </td>
                  <td className="p-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusClass(inv.status)}`}>
                      {t(`invoices.statuses.${inv.status}`)}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-1">
                      {inv.status !== "paid" && inv.status !== "cancelled" && (
                        <button onClick={() => act(() => markInvoicePaid(inv.id))} className="flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white">
                          <CheckCircle2 size={13} /> {t("invoices.markPaid")}
                        </button>
                      )}
                      {inv.status !== "cancelled" && inv.status !== "paid" && (
                        <button onClick={() => act(() => cancelInvoice(inv.id))} className="flex items-center gap-1 rounded-md border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-600">
                          <XCircle size={13} /> {t("invoices.cancel")}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
