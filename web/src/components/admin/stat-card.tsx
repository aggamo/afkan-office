import type { LucideIcon } from "lucide-react";

const TONES = {
  green: "bg-emerald-50 text-emerald-700",
  blue: "bg-blue-50 text-blue-700",
  orange: "bg-orange-50 text-orange-700",
  purple: "bg-purple-50 text-purple-700",
  gray: "bg-gray-100 text-gray-600",
  red: "bg-red-50 text-red-700",
} as const;

export type StatTone = keyof typeof TONES;

export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  tone = "gray",
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon?: LucideIcon;
  tone?: StatTone;
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm text-gray-500">{label}</span>
        {Icon && (
          <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${TONES[tone]}`}>
            <Icon size={16} />
          </span>
        )}
      </div>
      <div className="mt-2 text-2xl font-bold text-brand-dark">{value}</div>
      {sub && <div className="mt-1 text-xs text-gray-400">{sub}</div>}
    </div>
  );
}
