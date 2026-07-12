"use client";

import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent?: string;
};

export default function StatCard({ label, value, icon: Icon, accent = "text-purple-400" }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-novra-card/30 p-5 transition hover:border-purple-500/25">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">{label}</span>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-600/15">
          <Icon size={18} className={accent} />
        </div>
      </div>
      <p className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{value}</p>
    </div>
  );
}
