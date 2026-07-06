"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AlertTriangle, CheckCircle2, Circle, LoaderCircle, ShieldCheck } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { ApiError } from "@/lib/api";
import {
  advanceWorkerStage,
  fetchWorkerWorkflow,
  startWorkerWorkflow,
  type WorkerWorkflow,
  type WorkflowStage,
} from "@/lib/admin-api";
import { TrackingQr } from "@/components/ui/tracking-qr";

const STATUS_ICON = {
  completed: <CheckCircle2 size={16} className="text-emerald-600" />,
  current: <LoaderCircle size={16} className="text-blue-600" />,
  delayed: <AlertTriangle size={16} className="text-red-600" />,
  upcoming: <Circle size={16} className="text-gray-300" />,
} as const;

export function WorkflowPanel({ workerId, stages }: { workerId: number; stages: WorkflowStage[] }) {
  const t = useTranslations("admin");
  const locale = useLocale() as Locale;
  const [data, setData] = useState<WorkerWorkflow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stageId, setStageId] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      await Promise.resolve();
      if (cancelled) return;
      setData(null);
      setError(null);
      try {
        const result = await fetchWorkerWorkflow(workerId);
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "error");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [workerId]);

  async function handleStart() {
    setBusy(true);
    setError(null);
    try {
      setData(await startWorkerWorkflow(workerId));
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleAdvance() {
    if (!stageId) return;
    setBusy(true);
    setError(null);
    try {
      const updated = await advanceWorkerStage(workerId, Number(stageId), notes);
      setData(updated);
      setStageId("");
      setNotes("");
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (error && !data) return <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>;
  if (!data) return <p className="py-10 text-center text-gray-400">{t("loading")}</p>;

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-gray-100 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="font-bold text-brand-dark">{data.worker.full_name[locale]}</h3>
            <p className="text-xs text-gray-400">
              {data.worker.internal_number}
              {data.worker.tracking_number ? ` · ${data.worker.tracking_number}` : ""}
            </p>
          </div>
          {data.is_delayed && (
            <span className="flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">
              <AlertTriangle size={13} /> {t("workflow.delayed")}
            </span>
          )}
        </div>

        <div className="mt-4">
          <div className="mb-1 flex justify-between text-xs text-gray-400">
            <span>
              {t("workflow.currentStage")}:{" "}
              <span className="font-semibold text-brand-green">{data.current_stage?.name[locale] ?? "—"}</span>
            </span>
            <span>{data.progress}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-100">
            <div className="h-2 rounded-full bg-brand-green" style={{ width: `${data.progress}%` }} />
          </div>
        </div>

        {data.eta.estimated_completion && (
          <p className="mt-3 text-xs text-gray-500">
            {t("workflow.eta")}: {new Date(data.eta.estimated_completion).toLocaleDateString(locale)}{" "}
            ({t(`workflow.confidence.${data.eta.confidence}`)})
          </p>
        )}
        {data.warranty.ends_at && (
          <p className="mt-1 flex items-center gap-1 text-xs text-purple-600">
            <ShieldCheck size={13} /> {t("workflow.warranty")}: {data.warranty.remaining_days} {t("workflow.days")}
          </p>
        )}

        {data.worker.tracking_number && (
          <div className="mt-4 flex items-center gap-3 border-t border-gray-50 pt-4">
            <TrackingQr
              value={`${window.location.origin}/${locale}/track?tracking=${data.worker.tracking_number}`}
              size={92}
            />
            <span className="text-xs text-gray-400">{t("workflow.scanToTrack")}</span>
          </div>
        )}
      </div>

      {/* Advance controls */}
      <div className="rounded-xl border border-gray-100 bg-white p-5">
        {error && <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        {!data.current_stage ? (
          <button
            onClick={handleStart}
            disabled={busy}
            className="rounded-md bg-brand-green px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {t("workflow.start")}
          </button>
        ) : (
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-52 flex-1">
              <label className="mb-1 block text-xs font-medium text-brand-dark">{t("workflow.moveTo")}</label>
              <select
                value={stageId}
                onChange={(e) => setStageId(e.target.value)}
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              >
                <option value="">—</option>
                {stages.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.step_number}. {s[`name_${locale}`]}
                  </option>
                ))}
              </select>
            </div>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("workflow.notes")}
              className="min-w-40 flex-1 rounded-md border border-gray-200 px-3 py-2 text-sm"
            />
            <button
              onClick={handleAdvance}
              disabled={busy || !stageId}
              className="rounded-md bg-brand-green px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {t("workflow.advance")}
            </button>
          </div>
        )}
      </div>

      {/* Required documents for the current stage */}
      {data.required_documents.length > 0 && (
        <div className="rounded-xl border border-gray-100 bg-white p-5">
          <h4 className="mb-3 text-sm font-semibold text-gray-500">{t("workflow.requiredDocuments")}</h4>
          <ul className="space-y-2">
            {data.required_documents.map((doc) => (
              <li key={doc.slug} className="flex items-center gap-2 text-sm">
                {doc.present ? (
                  <CheckCircle2 size={16} className="text-emerald-600" />
                ) : (
                  <AlertTriangle size={16} className="text-orange-500" />
                )}
                <span className={doc.present ? "text-brand-dark" : "text-orange-600"}>{doc.name[locale]}</span>
                <span className="text-xs text-gray-400">
                  {doc.present ? t("workflow.docPresent") : t("workflow.docMissing")}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Timeline */}
      <div className="rounded-xl border border-gray-100 bg-white p-5">
        <h4 className="mb-3 text-sm font-semibold text-gray-500">{t("workflow.timeline")}</h4>
        <ol className="space-y-2.5">
          {data.timeline.map((s) => (
            <li key={s.slug} className="flex items-center gap-2 text-sm">
              {STATUS_ICON[s.status]}
              <span className="text-xs text-gray-300">{s.step_number}</span>
              <span className={s.status === "upcoming" ? "text-gray-400" : "text-brand-dark"}>{s.name[locale]}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* History */}
      {data.history.length > 0 && (
        <div className="rounded-xl border border-gray-100 bg-white p-5">
          <h4 className="mb-3 text-sm font-semibold text-gray-500">{t("workflow.history")}</h4>
          <ul className="space-y-3">
            {data.history.map((h) => (
              <li key={h.id} className="text-sm">
                <div className="flex flex-wrap items-center gap-1 text-brand-dark">
                  {h.from && <span className="text-gray-400">{h.from[locale]} →</span>}
                  <span className="font-medium">{h.to?.[locale]}</span>
                </div>
                <div className="text-xs text-gray-400">
                  {h.entered_at ? new Date(h.entered_at).toLocaleString(locale) : ""}
                  {h.by ? ` · ${h.by}` : ""}
                  {h.notes ? ` · ${h.notes}` : ""}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
