"use client";

import { useLayoutEffect, useState } from "react";
import { useIsClient } from "@/hooks/useIsClient";
import {
  calcTimeLeft,
  EMPTY_TIME_LEFT,
  type TimeLeft,
} from "@/lib/countdown";

type UseLiveCountdownOptions = {
  /** Server-computed values for hydration-safe SSR. `null` = expired, `undefined` = invalid date. */
  initialTimeLeft?: TimeLeft | null;
};

type UseLiveCountdownResult = {
  timeLeft: TimeLeft;
  launched: boolean;
  mounted: boolean;
  invalidDate: boolean;
};

function resolveInitialState(
  targetDate: Date | null,
  initialTimeLeft: TimeLeft | null | undefined
): { timeLeft: TimeLeft; launched: boolean } {
  if (initialTimeLeft !== undefined) {
    return {
      timeLeft: initialTimeLeft ?? EMPTY_TIME_LEFT,
      launched: initialTimeLeft === null,
    };
  }

  if (!targetDate) {
    return { timeLeft: EMPTY_TIME_LEFT, launched: false };
  }

  if (typeof window === "undefined") {
    return { timeLeft: EMPTY_TIME_LEFT, launched: false };
  }

  const next = calcTimeLeft(undefined, targetDate);
  return {
    timeLeft: next ?? EMPTY_TIME_LEFT,
    launched: next === null,
  };
}

export function useLiveCountdown(
  targetDate: Date | null,
  options: UseLiveCountdownOptions = {}
): UseLiveCountdownResult {
  const { initialTimeLeft } = options;
  const mounted = useIsClient();
  const invalidDate = !targetDate;
  const endTime = targetDate?.getTime();

  const [state, setState] = useState(() =>
    resolveInitialState(targetDate, initialTimeLeft)
  );

  useLayoutEffect(() => {
    if (!targetDate || endTime === undefined) {
      setState({ timeLeft: EMPTY_TIME_LEFT, launched: false });
      return;
    }

    const tick = () => {
      const next = calcTimeLeft(undefined, targetDate);
      if (!next) {
        setState({ timeLeft: EMPTY_TIME_LEFT, launched: true });
      } else {
        setState({ timeLeft: next, launched: false });
      }
    };

    tick();
    const timer = window.setInterval(tick, 1000);

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") tick();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [endTime, targetDate]);

  return {
    timeLeft: state.timeLeft,
    launched: state.launched,
    mounted,
    invalidDate,
  };
}
