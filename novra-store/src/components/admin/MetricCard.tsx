"use client";

type MetricCardProps = {
  emoji: string;
  label: string;
  value: string | number;
  hint?: string;
  accent?: string;
  pulse?: boolean;
};

export default function MetricCard({
  emoji,
  label,
  value,
  hint,
  accent = "text-purple-300",
  pulse = false,
}: MetricCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-novra-card/50 to-purple-950/20 p-5 transition hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-900/10">
      <div className="pointer-events-none absolute -right-4 -top-4 text-5xl opacity-[0.07] transition group-hover:opacity-[0.12]">
        {emoji}
      </div>

      <div className="mb-3 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">
          {label}
        </span>
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600/15 text-lg ${pulse ? "animate-pulse" : ""}`}
          aria-hidden
        >
          {emoji}
        </span>
      </div>

      <p className={`text-2xl font-bold tracking-tight sm:text-3xl ${accent}`}>{value}</p>
      {hint ? <p className="mt-1.5 text-xs text-gray-500">{hint}</p> : null}
    </div>
  );
}
