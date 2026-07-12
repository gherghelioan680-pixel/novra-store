"use client";

import { Clock } from "lucide-react";
import { padTimeUnit } from "@/lib/countdown";
import { useLiveCountdown } from "@/hooks/useLiveCountdown";
import { parseIsoDate } from "@/lib/datetime";

function TimeBlock({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center min-w-[2.5rem] sm:min-w-[3rem]">
      <span
        className="text-lg sm:text-2xl font-bold tabular-nums text-white leading-none"
        suppressHydrationWarning
      >
        {padTimeUnit(value)}
      </span>
      <span className="text-[8px] sm:text-[9px] uppercase tracking-[0.2em] text-purple-200/70 mt-1.5">
        {label}
      </span>
    </div>
  );
}

type CountdownPreviewProps = {
  countdownDate?: string;
};

export default function CountdownPreview({ countdownDate }: CountdownPreviewProps) {
  const target = parseIsoDate(countdownDate);
  const { timeLeft, launched, invalidDate } = useLiveCountdown(target);

  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-purple-200/80">
        <Clock size={14} aria-hidden />
        <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-gray-500">
          Countdown live
        </span>
      </div>

      {invalidDate ? (
        <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          Dată invalidă
        </p>
      ) : launched ? (
        <p className="rounded-xl border border-purple-400/30 bg-purple-600/15 px-4 py-3 text-center text-sm font-semibold text-purple-200">
          Lansare!
        </p>
      ) : (
        <div
          className="flex w-fit items-center gap-2 rounded-2xl border border-purple-400/20 bg-black/25 px-4 py-3 backdrop-blur-sm"
          aria-live="polite"
          suppressHydrationWarning
        >
          <TimeBlock value={timeLeft.days} label="zile" />
          <span className="pb-4 text-lg font-bold text-purple-400/80" aria-hidden>
            :
          </span>
          <TimeBlock value={timeLeft.hours} label="ore" />
          <span className="pb-4 text-lg font-bold text-purple-400/80" aria-hidden>
            :
          </span>
          <TimeBlock value={timeLeft.minutes} label="min" />
          <span className="pb-4 text-lg font-bold text-purple-400/80" aria-hidden>
            :
          </span>
          <TimeBlock value={timeLeft.seconds} label="sec" />
        </div>
      )}
    </div>
  );
}
