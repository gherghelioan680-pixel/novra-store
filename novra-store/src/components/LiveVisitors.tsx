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

export default function LiveVisitors() {
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

  if (!mounted || count === null) return null;

  return (
    <motion.div
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.5, duration: 0.5 }}
      className="fixed z-[9989] pointer-events-none right-3 top-[calc(var(--header-height,148px)+0.375rem)]"
      aria-live="polite"
      aria-label={t("ariaLabel", { count })}
    >
      <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-novra-surface/60 backdrop-blur-sm border border-white/5 opacity-80">
        <div className="relative shrink-0">
          <span
            className={`absolute inset-0 rounded-full bg-green-500/30 ${pulse ? "animate-ping" : ""}`}
            aria-hidden
          />
          <span className="relative block w-1.5 h-1.5 rounded-full bg-green-500/80" />
        </div>

        <div className="flex items-center gap-0.5 min-w-0">
          <AnimatePresence mode="wait">
            <motion.span
              key={count}
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="text-[10px] font-medium text-gray-300 tabular-nums"
            >
              {count}
            </motion.span>
          </AnimatePresence>
          <span className="text-[9px] text-gray-500">{t("live")}</span>
        </div>
      </div>
    </motion.div>
  );
}
