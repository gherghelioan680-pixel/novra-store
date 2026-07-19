"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useIsClient } from "@/hooks/useIsClient";
import { motion, AnimatePresence } from "framer-motion";

const POLL_MIN_MS = 30_000;
const POLL_MAX_MS = 60_000;

function randomPollDelay(): number {
  return Math.floor(Math.random() * (POLL_MAX_MS - POLL_MIN_MS + 1)) + POLL_MIN_MS;
}

type LiveVisitorsProps = {
  className?: string;
};

export default function LiveVisitors({ className = "" }: LiveVisitorsProps) {
  const t = useTranslations("liveVisitors");
  const mounted = useIsClient();
  const [count, setCount] = useState<number | null>(null);
  const [pulse, setPulse] = useState(false);

  const fetchCount = useCallback(async () => {
    try {
      const response = await fetch("/api/store/visitors/live", { cache: "no-store" });
      if (!response.ok) return;
      const data = (await response.json()) as { count?: number };
      const nextCount = data.count;
      if (typeof nextCount === "number") {
        setCount((prev) => {
          if (prev !== null && prev !== nextCount) {
            setPulse(true);
            window.setTimeout(() => setPulse(false), 600);
          }
          return nextCount;
        });
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;

    void fetchCount();

    let timerId: ReturnType<typeof setTimeout>;
    const scheduleNext = () => {
      timerId = setTimeout(() => {
        void fetchCount().finally(scheduleNext);
      }, randomPollDelay());
    };
    scheduleNext();

    return () => clearTimeout(timerId);
  }, [mounted, fetchCount]);

  if (!mounted || count === null || count <= 0) return null;

  return (
    <motion.div
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.5, duration: 0.5 }}
      className={`fixed z-[9989] pointer-events-none right-3 top-[calc(var(--header-height,148px)+0.375rem)] ${className}`}
      aria-live="polite"
      aria-label={t("ariaLabel", { count })}
    >
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-novra-surface/70 backdrop-blur-sm border border-purple-500/20 shadow-lg shadow-purple-950/20">
        <div className="relative shrink-0">
          <span
            className={`absolute inset-0 rounded-full bg-purple-500/40 ${pulse ? "animate-ping" : "animate-pulse"}`}
            aria-hidden
          />
          <span className="relative block w-1.5 h-1.5 rounded-full bg-purple-400" />
        </div>

        <div className="flex items-center gap-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.span
              key={count}
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="text-[10px] font-semibold text-purple-200 tabular-nums"
            >
              {count}
            </motion.span>
          </AnimatePresence>
          <span className="text-[10px] text-gray-400 whitespace-nowrap">{t("viewingNow")}</span>
        </div>
      </div>
    </motion.div>
  );
}
