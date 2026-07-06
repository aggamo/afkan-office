"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { ApiError } from "@/lib/api";
import {
  deleteReferenceItem,
  fetchReferenceItems,
  toggleReferenceItem,
  type RefDefinition,
  type RefOption,
  type RefRecord,
} from "@/lib/admin-api";
import { ReferenceForm } from "./reference-form";

export function ReferenceTable({ resource }: { resource: string }) {
  const t = useTranslations("admin");
  const locale = useLocale() as Locale;

  const [definition, setDefinition] = useState<RefDefinition | null>(null);
  const [items, setItems] = useState<RefRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<RefRecord | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchReferenceItems(resource);
      setDefinition(data.definition);
      setItems(data.items);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "error");
    } finally {
      setLoading(false);
    }
  }, [resource]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await Promise.resolve();
      if (!cancelled) reload();
    })();
    return () => {
      cancelled = true;
    };
  }, [reload]);

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 2500);
  }

  async function handleToggle(record: RefRecord) {
    try {
      const updated = await toggleReferenceItem(resource, record.id);
      setItems((prev) => prev.map((it) => (it.id === record.id ? updated : it)));
    } catch (err) {
      if (err instanceof ApiError) flash(err.message);
    }
  }

  async function handleDelete(record: RefRecord) {
    setConfirmId(null);
    try {
      await deleteReferenceItem(resource, record.id);
      setItems((prev) => prev.filter((it) => it.id !== record.id));
      flash(t("reference.deleted"));
    } catch (err) {
      if (err instanceof ApiError) flash(err.message);
    }
  }

  function handleSaved(saved: RefRecord, isNew: boolean) {
    setItems((prev) => (isNew ? [...prev, saved] : prev.map((it) => (it.id === saved.id ? saved : it))));
    setFormOpen(false);
    setEditRecord(null);
    flash(isNew ? t("reference.created") : t("reference.updated"));
  }

  const nameKey = `name_${locale}` as const;

  const columns = useMemo(() => {
    if (!definition) return null;
    return {
      identifier: definition.fields.find((f) => f.type === "slug") ?? null,
      relation: definition.fields.find((f) => f.type === "relation") ?? null,
      flags: definition.fields.filter((f) => f.type === "boolean" && f.key !== "is_active"),
      hasActive: definition.fields.some((f) => f.key === "is_active"),
      sortable: definition.sortable,
    };
  }, [definition]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return items;
    return items.filter((it) => {
      const haystack = [it[nameKey], it.name_ar, it.name_en, it.name_am, it.slug, it.iso_code]
        .filter((v) => typeof v === "string")
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [items, query, nameKey]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("reference.search")}
          className="w-full max-w-xs rounded-md border border-gray-200 px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={() => {
            setEditRecord(null);
            setFormOpen(true);
          }}
          className="ms-auto flex items-center gap-2 rounded-md bg-brand-green px-4 py-2 text-sm font-semibold text-white hover:bg-brand-green-dark"
        >
          <Plus size={16} />
          {t("reference.add")}
        </button>
      </div>

      {notice && (
        <p className="mb-3 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</p>
      )}
      {error && <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      {loading || !columns ? (
        <p className="py-10 text-center text-gray-400">{t("loading")}</p>
      ) : filtered.length === 0 ? (
        <p className="py-10 text-center text-gray-400">{t("reference.empty")}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-gray-50 text-start text-xs uppercase text-gray-500">
              <tr>
                <th className="p-3 text-start">{t("reference.name")}</th>
                {(columns.identifier || columns.relation) && (
                  <th className="p-3 text-start">{t("reference.identifier")}</th>
                )}
                {columns.flags.map((f) => (
                  <th key={f.key} className="p-3 text-start">
                    {t(`reference.fields.${f.key}`)}
                  </th>
                ))}
                {columns.sortable && <th className="p-3 text-start">{t("reference.order")}</th>}
                {columns.hasActive && <th className="p-3 text-start">{t("reference.status")}</th>}
                <th className="p-3 text-end">{t("reference.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((record) => {
                const relatedName = columns.relation
                  ? (record[columns.relation.key.replace(/_id$/, "")] as RefOption | undefined)?.[nameKey]
                  : undefined;
                const isActive = Boolean(record.is_active);
                return (
                  <tr key={record.id} className="border-t border-gray-100">
                    <td className="p-3 font-medium text-brand-dark">
                      {String(record[nameKey] ?? "—")}
                      {Boolean(record.in_use) && (
                        <span className="ms-2 rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-600">
                          {t("reference.inUse")}
                        </span>
                      )}
                    </td>
                    {(columns.identifier || columns.relation) && (
                      <td className="p-3 text-gray-500">
                        {columns.identifier ? String(record[columns.identifier.key] ?? "—") : relatedName ?? "—"}
                      </td>
                    )}
                    {columns.flags.map((f) => (
                      <td key={f.key} className="p-3">
                        {record[f.key] ? (
                          <Check size={16} className="text-emerald-600" />
                        ) : (
                          <X size={16} className="text-gray-300" />
                        )}
                      </td>
                    ))}
                    {columns.sortable && <td className="p-3 text-gray-500">{String(record.sort_order ?? 0)}</td>}
                    {columns.hasActive && (
                      <td className="p-3">
                        <button
                          type="button"
                          onClick={() => handleToggle(record)}
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            isActive ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {isActive ? t("reference.active") : t("reference.inactive")}
                        </button>
                      </td>
                    )}
                    <td className="p-3">
                      {confirmId === record.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-xs text-gray-500">{t("reference.deleteConfirm")}</span>
                          <button
                            type="button"
                            onClick={() => handleDelete(record)}
                            className="rounded bg-red-600 px-2 py-1 text-xs font-semibold text-white"
                          >
                            {t("reference.confirm")}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmId(null)}
                            className="rounded border border-gray-200 px-2 py-1 text-xs"
                          >
                            {t("reference.cancel")}
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditRecord(record);
                              setFormOpen(true);
                            }}
                            aria-label={t("reference.edit")}
                            className="rounded p-1.5 text-gray-500 hover:bg-gray-50 hover:text-brand-green"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmId(record.id)}
                            aria-label={t("reference.delete")}
                            className="rounded p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {formOpen && definition && (
        <ReferenceForm
          resource={resource}
          definition={definition}
          record={editRecord}
          onClose={() => {
            setFormOpen(false);
            setEditRecord(null);
          }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
