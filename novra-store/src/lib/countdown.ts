import { getCampaignEndDate } from "./site-settings";

/** Campanie 1 lună live — 30 zile de la lansare (suprascris din setări admin) */
export const CAMPAIGN_END_DATE = new Date("2026-08-11T23:59:59+03:00");

export function getActiveCampaignEndDate(): Date {
  if (typeof window !== "undefined") {
    return getCampaignEndDate();
  }
  return CAMPAIGN_END_DATE;
}

export const COUNTDOWN_TIMER_ID = "countdown-timer";

/** Static aria-label for SSR / pre-hydration — avoids time-based mismatch */
export const COUNTDOWN_STATIC_ARIA_LABEL = "Timp rămas: countdown ofertă limitată";

export const EMPTY_TIME_LEFT: TimeLeft = {
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
};

export type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

/** Server-safe initial countdown for a target date. `undefined` = invalid date, `null` = expired. */
export function getInitialTimeLeftForDate(endDate: Date | null): TimeLeft | null | undefined {
  if (!endDate) return undefined;
  return calcTimeLeft(undefined, endDate);
}

export function calcTimeLeft(now = Date.now(), endDate?: Date): TimeLeft | null {
  const target = endDate ?? getActiveCampaignEndDate();
  const diff = target.getTime() - now;
  if (diff <= 0) return null;

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export function padTimeUnit(value: number): string {
  return String(value).padStart(2, "0");
}

export function formatCountdownCompact(time: TimeLeft): string {
  return `${padTimeUnit(time.days)} : ${padTimeUnit(time.hours)} : ${padTimeUnit(time.minutes)} : ${padTimeUnit(time.seconds)}`;
}
