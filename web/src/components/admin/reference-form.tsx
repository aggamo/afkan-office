"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { X } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { ApiError } from "@/lib/api";
import {
  createReferenceItem,
  updateReferenceItem,
  type RefDefinition,
  type RefField,
  type RefRecord,
} from "@/lib/admin-api";

type FieldValue = string | number | boolean;

function initialValue(field: RefField, record: RefRecord | null): FieldValue {
  if (record && field.key in record) {
    const raw = record[field.key];
    if (field.type === "boolean") return Boolean(raw);
    if (field.type === "number") return Number(raw ?? 0);
    if (field.type === "relation") return raw == null ? "" : Number(raw);
    return raw == null ? "" : String(raw);
  }
  if (field.default !== undefined) return field.default;
  if (field.type === "boolean") return false;
  if (field.type === "number") return 0;
  return "";
}

export function ReferenceForm({
  resource,
  definition,
  record,
  onClose,
  onSaved,
}: {
  resource: string;
  definition: RefDefinition;
  record: RefRecord | null;
  onClose: () => void;
  onSaved: (saved: RefRecord, isNew: boolean) => void;
}) {
  const t = useTranslations("admin");
  const locale = useLocale() as Locale;
  const isNew = record === null;

  const [values, setValues] = useState<Record<string, FieldValue>>(() => {
    const init: Record<string, FieldValue> = {};
    for (const field of definition.fields) init[field.key] = initialValue(field, record);
    return init;
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function setValue(key: string, value: FieldValue) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setErrors({});
    setGeneralError(null);

    const payload: Record<string, unknown> = {};
    for (const field of definition.fields) {
      const value = values[field.key];
      if (field.type === "relation") {
        payload[field.key] = value === "" ? null : Number(value);
      } else if (field.type === "number") {
        payload[field.key] = Number(value);
      } else {
        payload[field.key] = value;
      }
    }

    try {
      const saved = isNew
        ? await createReferenceItem(resource, payload)
        : await updateReferenceItem(resource, record.id, payload);
      onSaved(saved, isNew);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.errors && typeof err.errors === "object") {
          const fieldErrors: Record<string, string> = {};
          for (const [key, messages] of Object.entries(err.errors as Record<string, string[]>)) {
            fieldErrors[key] = Array.isArray(messages) ? messages[0] : String(messages);
          }
          setErrors(fieldErrors);
        }
        setGeneralError(err.message);
      } else {
        setGeneralError(t("reference.save"));
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-brand-dark">
            {isNew ? t("reference.addTitle") : t("reference.editTitle")}
          </h3>
          <button type="button" onClick={onClose} aria-label={t("reference.cancel")} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {generalError && (
          <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{generalError}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {definition.fields.map((field) => (
            <FormField
              key={field.key}
              field={field}
              value={values[field.key]}
              error={errors[field.key]}
              label={t(`reference.fields.${field.key}`)}
              locale={locale}
              onChange={(value) => setValue(field.key, value)}
            />
          ))}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-brand-dark">
              {t("reference.cancel")}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-brand-green px-4 py-2 text-sm font-semibold text-white hover:bg-brand-green-dark disabled:opacity-60"
            >
              {saving ? t("reference.saving") : t("reference.save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FormField({
  field,
  value,
  error,
  label,
  locale,
  onChange,
}: {
  field: RefField;
  value: FieldValue;
  error?: string;
  label: string;
  locale: Locale;
  onChange: (value: FieldValue) => void;
}) {
  if (field.type === "boolean") {
    return (
      <label className="flex items-center gap-2 text-sm font-medium text-brand-dark">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-brand-green"
        />
        {label}
      </label>
    );
  }

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-brand-dark">
        {label}
        {field.required && <span className="text-red-500"> *</span>}
      </label>
      {field.type === "relation" ? (
        <select
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
        >
          <option value="">—</option>
          {(field.options ?? []).map((option) => (
            <option key={option.id} value={option.id}>
              {option[`name_${locale}`]}
            </option>
          ))}
        </select>
      ) : field.type === "number" ? (
        <input
          type="number"
          min={0}
          value={Number(value)}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
        />
      ) : (
        <input
          type="text"
          value={String(value ?? "")}
          maxLength={field.max}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
        />
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
