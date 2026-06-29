"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Search, CheckCircle2, Circle } from "lucide-react";
import { ApiError, trackWorker } from "@/lib/api";

const STAGE_KEYS = ["step1", "step2", "step3", "step4", "step5", "step6", "step7"] as const;

export function TrackForm() {
  const t = useTranslations("track");
  const tProcess = useTranslations("home.process");
  const [value, setValue] = useState("");
  const [result, setResult] = useState<{ stageIndex: number; progress: number; estimatedCompletion: number } | null>(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSearch() {
    if (!value.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const data = await trackWorker(value.trim());
      const stepNumber = data.current_recruitment_stage?.step_number ?? 1;
      const stageIndex = Math.min(Math.max(stepNumber - 1, 0), STAGE_KEYS.length - 1);
      setResult({
        stageIndex,
        progress: Math.round(((stageIndex + 1) / STAGE_KEYS.length) * 100),
        estimatedCompletion: Date.now() + 14 * 86400000,
      });
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        setResult(null);
      } else {
        throw error;
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="mb-2 text-center text-2xl font-bold text-brand-dark lg:text-3xl">{t("title")}</h1>
      <p className="mb-8 text-center text-sm text-gray-500">{t("subtitle")}</p>

      <div className="flex items-center gap-2 rounded-md border border-gray-200 p-1.5">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder={t("inputLabel")}
          className="w-full px-2 py-2 text-sm outline-none"
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-md bg-brand-green px-4 py-2 text-sm font-semibold text-white hover:bg-brand-green-dark disabled:opacity-60"
        >
          <Search size={16} /> {t("button")}
        </button>
      </div>
      <p className="mt-2 text-center text-xs text-gray-400">e.g. AFK-1000</p>

      {searched && !result && (
        <p className="mt-8 rounded-xl border border-gray-100 p-6 text-center text-gray-500">{t("notFound")}</p>
      )}

      {result && (
        <div className="mt-8 rounded-xl border border-gray-100 p-6">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm text-gray-500">{t("currentStage")}</span>
            <span className="font-semibold text-brand-green">{tProcess(STAGE_KEYS[result.stageIndex])}</span>
          </div>

          <div className="mb-6">
            <div className="mb-1 flex items-center justify-between text-xs text-gray-400">
              <span>{t("progress")}</span>
              <span>{result.progress}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-100">
              <div className="h-2 rounded-full bg-brand-green" style={{ width: `${result.progress}%` }} />
            </div>
          </div>

          <ol className="space-y-3">
            {STAGE_KEYS.map((key, i) => (
              <li key={key} className="flex items-center gap-2 text-sm">
                {i <= result.stageIndex ? (
                  <CheckCircle2 size={18} className="text-brand-green" />
                ) : (
                  <Circle size={18} className="text-gray-300" />
                )}
                <span className={i <= result.stageIndex ? "text-brand-dark" : "text-gray-400"}>
                  {tProcess(key)}
                </span>
              </li>
            ))}
          </ol>

          <p className="mt-6 text-sm text-gray-500">
            {t("estimatedCompletion")}: {new Date(result.estimatedCompletion).toLocaleDateString()}
          </p>
        </div>
      )}
    </div>
  );
}
