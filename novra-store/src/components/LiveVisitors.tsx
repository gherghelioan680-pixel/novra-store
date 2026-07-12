"use client";

import { useState, useEffect, useCallback } from "react";
import { useIsClient } from "@/hooks/useIsClient";
import { motion, AnimatePresence } from "framer-motion";
import { Users } from "lucide-react";

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
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 1.5, duration: 0.5, type: "spring" }}
      className="fixed z-[70] pointer-events-none left-3 sm:left-auto sm:right-8 bottom-[calc(10rem+env(safe-area-inset-bottom,0px))] sm:bottom-[calc(10.5rem+env(safe-area-inset-bottom,0px))]"
      aria-live="polite"
      aria-label={`${count} clienți live pe site`}
    >
      <div className="flex items-center gap-1.5 sm:gap-2.5 px-2.5 sm:px-3.5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl bg-novra-surface/90 backdrop-blur-md border border-novra-border/80 shadow-xl shadow-black/30 max-w-[calc(100vw-6rem)]">
        <div className="relative shrink-0">
          <span
            className={`absolute inset-0 rounded-full bg-green-500/40 ${pulse ? "animate-ping" : ""}`}
            aria-hidden
          />
          <span className="relative block w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
          <Users size={13} className="text-purple-400 shrink-0 hidden sm:block" aria-hidden />
          <AnimatePresence mode="wait">
            <motion.span
              key={count}
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="text-[11px] sm:text-sm font-semibold text-white tabular-nums"
            >
              {count}
            </motion.span>
          </AnimatePresence>
          <span className="text-[9px] sm:text-xs text-gray-400 truncate">live</span>
        </div>
      </div>
    </motion.div>
  );
}
