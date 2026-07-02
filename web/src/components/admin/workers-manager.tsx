"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { ApiError } from "@/lib/api";
import {
  createWorker,
  deleteWorker,
  fetchAdminAgencies,
  fetchAdminWorkersFull,
  fetchReferenceItems,
  updateWorker,
  type AdminAgency,
  type AdminWorkerFull,
  type RefRecord,
  type WorkerFormPayload,
} from "@/lib/admin-api";

type Option = { id: number; label: string };

const EMPTY: WorkerFormPayload = {
  internal_number: "",
  full_name_ar: "",
  full_name_en: "",
  full_name_am: "",
  date_of_birth: "",
  gender: "female",
  passport_number: "",
  passport_expiry: "",
  nationality_id: 0,
  worker_type_id: 0,
  experience_years: null,
  height_cm: null,
  weight_kg: null,
  religion: null,
  marital_status: null,
  number_of_children: null,
  agency_id: null,
  price: null,
  price_currency: "SAR",
  is_published: false,
  is_active: true,
};

function refLabel(record: RefRecord, locale: string): string {
  const key = `name_${locale}` as const;
  return (record[key] as string) || (record.name_en as string) || (record.name_ar as string) || `#${record.id}`;
}

export function WorkersManager() {
  const t = useTranslations("admin");
  const locale = useLocale();
  const [workers, setWorkers] = useState<AdminWorkerFull[] | null>(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [nationalities, setNationalities] = useState<Option[]>([]);
  const [workerTypes, setWorkerTypes] = useState<Option[]>([]);
  const [agencies, setAgencies] = useState<Option[]>([]);
  const [editing, setEditing] = useState<AdminWorkerFull | null>(null);
  const [form, setForm] = useState<WorkerFormPayload | null>(null);
  const [saving, setSaving] = useState(false);

  async function reload() {
    const result = await fetchAdminWorkersFull();
    setWorkers(result.items);
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      await Promise.resolve();
      if (cancelled) return;
      try {
        const [ws, countries, types, ags] = await Promise.all([
          fetchAdminWorkersFull(),
          fetchReferenceItems("countries"),
          fetchReferenceItems("worker-types"),
          fetchAdminAgencies(),
        ]);
        if (cancelled) return;
        setWorkers(ws.items);
        setNationalities(countries.items.map((c) => ({ id: c.id, label: refLabel(c, locale) })));
        setWorkerTypes(types.items.map((c) => ({ id: c.id, label: refLabel(c, locale) })));
        setAgencies(ags.map((a: AdminAgency) => ({ id: a.id, label: a.name })));
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "error");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [locale]);

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY });
  }

  function openEdit(w: AdminWorkerFull) {
    setEditing(w);
    setForm({
      internal_number: w.internal_number,
      full_name_ar: w.full_name_ar,
      full_name_en: w.full_name_en,
      full_name_am: w.full_name_am,
      date_of_birth: w.date_of_birth ?? "",
      gender: w.gender,
      passport_number: w.passport_number ?? "",
      passport_expiry: w.passport_expiry ?? "",
      nationality_id: w.nationality?.id ?? 0,
      worker_type_id: w.worker_type?.id ?? 0,
      experience_years: w.experience_years,
      height_cm: w.height_cm != null ? Number(w.height_cm) : null,
      weight_kg: w.weight_kg != null ? Number(w.weight_kg) : null,
      religion: w.religion,
      marital_status: w.marital_status,
      number_of_children: w.number_of_children,
      agency_id: w.agency_id,
      price: w.price != null ? Number(w.price) : null,
      price_currency: w.price_currency ?? "SAR",
      is_published: w.is_published,
      is_active: w.is_active,
    });
  }

  async function save() {
    if (!form) return;
    setSaving(true);
    setError(null);
    try {
      if (editing) {
        await updateWorker(editing.id, form);
      } else {
        await createWorker(form);
      }
      setForm(null);
      setEditing(null);
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "error");
    } finally {
      setSaving(false);
    }
  }

  async function remove(w: AdminWorkerFull) {
    if (!window.confirm(t("workersManage.confirmDelete"))) return;
    try {
      await deleteWorker(w.id);
      await reload();
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
    }
  }

  const filtered = useMemo(() => {
    if (!workers) return [];
    const term = query.trim().toLowerCase();
    if (!term) return workers;
    return workers.filter((w) =>
      [w.internal_number, w.full_name_ar, w.full_name_en, w.passport_number]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [workers, query]);

  function upd<K extends keyof WorkerFormPayload>(key: K, value: WorkerFormPayload[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  const inputClass = "w-full rounded-md border border-gray-200 px-3 py-2 text-sm";

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="mb-1 text-2xl font-bold text-brand-dark">{t("workersManage.title")}</h1>
          <p className="text-sm text-gray-500">{t("workersManage.subtitle")}</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-1 rounded-md bg-brand-green px-3 py-2 text-sm font-semibold text-white"
        >
          <Plus size={16} /> {t("workersManage.add")}
        </button>
      </div>

      {error && <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("workersManage.search")}
        className="mb-4 w-full max-w-xs rounded-md border border-gray-200 px-3 py-2 text-sm"
      />

      {!workers ? (
        <p className="py-10 text-center text-gray-400">{t("loading")}</p>
      ) : filtered.length === 0 ? (
        <p className="py-10 text-center text-gray-400">{t("workersManage.empty")}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="p-3 text-start">{t("workersManage.internalNumber")}</th>
                <th className="p-3 text-start">{t("workersManage.name")}</th>
                <th className="p-3 text-start">{t("workersManage.nationality")}</th>
                <th className="p-3 text-start">{t("workersManage.status")}</th>
                <th className="p-3 text-end">{t("agencies.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((w) => (
                <tr key={w.id} className="border-t border-gray-100">
                  <td className="p-3 font-mono text-xs text-gray-500">{w.internal_number}</td>
                  <td className="p-3 font-medium text-brand-dark">
                    {locale === "ar" ? w.full_name_ar : locale === "am" ? w.full_name_am : w.full_name_en}
                  </td>
                  <td className="p-3 text-gray-500">
                    {w.nationality ? refLabel(w.nationality as unknown as RefRecord, locale) : "—"}
                  </td>
                  <td className="p-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${w.is_published ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
                      {w.is_published ? t("workersManage.published") : t("workersManage.draft")}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(w)} className="rounded-md border border-gray-200 p-1.5 text-brand-green" aria-label="edit">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => remove(w)} className="rounded-md border border-red-200 p-1.5 text-red-600" aria-label="delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {form && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
          <div className="my-8 w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-bold text-brand-dark">
              {editing ? t("workersManage.editTitle") : t("workersManage.add")}
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="text-sm">
                <span className="mb-1 block text-gray-500">{t("workersManage.internalNumber")}</span>
                <input value={form.internal_number} onChange={(e) => upd("internal_number", e.target.value)} className={inputClass} />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-gray-500">{t("workersManage.gender")}</span>
                <select value={form.gender} onChange={(e) => upd("gender", e.target.value as "male" | "female")} className={inputClass}>
                  <option value="female">{t("workersManage.female")}</option>
                  <option value="male">{t("workersManage.male")}</option>
                </select>
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-gray-500">{t("workersManage.nameAr")}</span>
                <input value={form.full_name_ar} onChange={(e) => upd("full_name_ar", e.target.value)} className={inputClass} dir="rtl" />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-gray-500">{t("workersManage.nameEn")}</span>
                <input value={form.full_name_en} onChange={(e) => upd("full_name_en", e.target.value)} className={inputClass} />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-gray-500">{t("workersManage.nameAm")}</span>
                <input value={form.full_name_am} onChange={(e) => upd("full_name_am", e.target.value)} className={inputClass} />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-gray-500">{t("workersManage.dateOfBirth")}</span>
                <input type="date" value={form.date_of_birth} onChange={(e) => upd("date_of_birth", e.target.value)} className={inputClass} />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-gray-500">{t("workersManage.passportNumber")}</span>
                <input value={form.passport_number} onChange={(e) => upd("passport_number", e.target.value)} className={inputClass} />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-gray-500">{t("workersManage.passportExpiry")}</span>
                <input type="date" value={form.passport_expiry} onChange={(e) => upd("passport_expiry", e.target.value)} className={inputClass} />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-gray-500">{t("workersManage.nationality")}</span>
                <select value={form.nationality_id} onChange={(e) => upd("nationality_id", Number(e.target.value))} className={inputClass}>
                  <option value={0}>—</option>
                  {nationalities.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                </select>
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-gray-500">{t("workersManage.workerType")}</span>
                <select value={form.worker_type_id} onChange={(e) => upd("worker_type_id", Number(e.target.value))} className={inputClass}>
                  <option value={0}>—</option>
                  {workerTypes.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                </select>
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-gray-500">{t("workersManage.agency")}</span>
                <select value={form.agency_id ?? 0} onChange={(e) => upd("agency_id", Number(e.target.value) || null)} className={inputClass}>
                  <option value={0}>—</option>
                  {agencies.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                </select>
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-gray-500">{t("workersManage.experienceYears")}</span>
                <input type="number" min={0} value={form.experience_years ?? ""} onChange={(e) => upd("experience_years", e.target.value === "" ? null : Number(e.target.value))} className={inputClass} />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-gray-500">{t("workersManage.price")}</span>
                <input type="number" min={0} value={form.price ?? ""} onChange={(e) => upd("price", e.target.value === "" ? null : Number(e.target.value))} className={inputClass} />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-gray-500">{t("workersManage.currency")}</span>
                <input value={form.price_currency ?? ""} onChange={(e) => upd("price_currency", e.target.value.toUpperCase() || null)} maxLength={3} className={inputClass} />
              </label>
            </div>

            <div className="mt-4 flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm text-brand-dark">
                <input type="checkbox" checked={form.is_published} onChange={(e) => upd("is_published", e.target.checked)} />
                {t("workersManage.published")}
              </label>
              <label className="flex items-center gap-2 text-sm text-brand-dark">
                <input type="checkbox" checked={form.is_active} onChange={(e) => upd("is_active", e.target.checked)} />
                {t("workersManage.active")}
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => { setForm(null); setEditing(null); }} className="rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-brand-dark">
                {t("workersManage.cancel")}
              </button>
              <button onClick={save} disabled={saving} className="rounded-md bg-brand-green px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                {saving ? t("workersManage.saving") : t("workersManage.save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
