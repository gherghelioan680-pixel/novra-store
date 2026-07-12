"use client";

import { useState, useEffect, useCallback } from "react";
import { useIsClient } from "@/hooks/useIsClient";
import { motion, AnimatePresence } from "framer-motion";

function randomInRange(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function fluctuate(current: number, min = 12, max = 47): number {
  const delta = randomInRange(-3, 3);
  const next = current + delta;
  if (next < min) return min + randomInRange(0, 2);
  if (next > max) return max - randomInRange(0, 2);
  return next;
}

export default function LiveVisitors() {
  const mounted = useIsClient();
  const [count, setCount] = useState<number | null>(null);
  const [pulse, setPulse] = useState(false);

  const updateCount = useCallback(() => {
    setCount((prev) => (prev === null ? randomInRange(12, 47) : fluctuate(prev)));
    setPulse(true);
    setTimeout(() => setPulse(false), 600);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const initialTimer = window.setTimeout(updateCount, 0);

    const scheduleNext = () => {
      const delay = randomInRange(30000, 60000);
      return setTimeout(() => {
        updateCount();
        timerId = scheduleNext();
      }, delay);
    };

    let timerId = scheduleNext();
    return () => {
      window.clearTimeout(initialTimer);
      clearTimeout(timerId);
    };
  }, [mounted, updateCount]);

  if (!mounted || count === null) return null;

  return (
    <motion.div
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.5, duration: 0.5 }}
      className="fixed z-[9989] pointer-events-none right-3 top-[calc(var(--header-height,148px)+0.375rem)]"
      aria-live="polite"
      aria-label={`${count} clienți live pe site`}
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
          <span className="text-[9px] text-gray-500">live</span>
        </div>
      </div>
    </motion.div>
  );
}
