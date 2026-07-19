"use client";

import { useMemo, useState } from "react";
import type { DeliveryCountyStat } from "@/lib/delivery-map";

type RomaniaDeliveryMapProps = {
  counties: DeliveryCountyStat[];
  className?: string;
  labels?: {
    orders: string;
    noData: string;
  };
};

const COLS = 7;
const CELL_W = 52;
const CELL_H = 40;
const GAP = 4;
const PAD = 12;

function intensityColor(count: number, max: number): string {
  if (count <= 0 || max <= 0) return "rgba(255,255,255,0.06)";
  const ratio = Math.min(count / max, 1);
  const alpha = 0.25 + ratio * 0.65;
  return `rgba(139, 92, 246, ${alpha.toFixed(2)})`;
}

export default function RomaniaDeliveryMap({ counties, className = "", labels }: RomaniaDeliveryMapProps) {
  const [activeCode, setActiveCode] = useState<string | null>(null);

  const sorted = useMemo(
    () => [...counties].sort((a, b) => a.countyName.localeCompare(b.countyName, "ro")),
    [counties]
  );

  const maxCount = useMemo(
    () => Math.max(1, ...sorted.map((county) => county.orderCount)),
    [sorted]
  );

  const width = PAD * 2 + COLS * CELL_W + (COLS - 1) * GAP;
  const rows = Math.ceil(sorted.length / COLS);
  const height = PAD * 2 + rows * CELL_H + (rows - 1) * GAP;

  const activeCounty = sorted.find((county) => county.countyCode === activeCode);

  return (
    <div className={className}>
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-novra-card/40 p-4 sm:p-6">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,rgba(139,92,246,0.12),transparent)] pointer-events-none" />

        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="relative z-10 mx-auto w-full max-w-3xl"
          role="img"
          aria-label="Harta livrărilor NOVRA în România"
        >
          {sorted.map((county, index) => {
            const col = index % COLS;
            const row = Math.floor(index / COLS);
            const x = PAD + col * (CELL_W + GAP);
            const y = PAD + row * (CELL_H + GAP);
            const isActive = activeCode === county.countyCode;

            return (
              <g
                key={county.countyCode}
                onMouseEnter={() => setActiveCode(county.countyCode)}
                onMouseLeave={() => setActiveCode(null)}
                onFocus={() => setActiveCode(county.countyCode)}
                onBlur={() => setActiveCode(null)}
                className="cursor-pointer"
              >
                <rect
                  x={x}
                  y={y}
                  width={CELL_W}
                  height={CELL_H}
                  rx={8}
                  fill={intensityColor(county.orderCount, maxCount)}
                  stroke={isActive ? "rgba(196,181,253,0.9)" : "rgba(255,255,255,0.08)"}
                  strokeWidth={isActive ? 2 : 1}
                />
                <text
                  x={x + CELL_W / 2}
                  y={y + CELL_H / 2 - 4}
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.85)"
                  fontSize="9"
                  fontWeight="600"
                >
                  {county.countyCode}
                </text>
                <text
                  x={x + CELL_W / 2}
                  y={y + CELL_H / 2 + 10}
                  textAnchor="middle"
                  fill="rgba(196,181,253,0.95)"
                  fontSize="10"
                  fontWeight="700"
                >
                  {county.orderCount}
                </text>
              </g>
            );
          })}
        </svg>

        <div className="relative z-10 mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <span className="inline-block h-3 w-8 rounded bg-white/10" />
            <span>{labels?.noData ?? "Fără comenzi"}</span>
            <span className="inline-block h-3 w-8 rounded bg-purple-500/80" />
            <span>{labels?.orders ?? "Mai multe comenzi"}</span>
          </div>
          {activeCounty ? (
            <p className="text-purple-300">
              <span className="font-semibold text-white">{activeCounty.countyName}</span>
              {" · "}
              {activeCounty.orderCount} {labels?.orders?.toLowerCase() ?? "comenzi"}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
