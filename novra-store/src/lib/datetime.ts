/** Parse `datetime-local` value (YYYY-MM-DDTHH:mm) as local time. Returns null if empty/partial/invalid. */
export function parseDatetimeLocal(value: string): Date | null {
  if (!value?.trim() || value.length < 16) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

/** Format ISO date string for `datetime-local` input (local YYYY-MM-DDTHH:mm). */
export function isoToDatetimeLocal(iso: string | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Format Date as ISO string with local timezone offset (e.g. 2026-08-11T23:59:59+03:00). */
export function dateToIsoWithOffset(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const offsetMin = -date.getTimezoneOffset();
  const sign = offsetMin >= 0 ? "+" : "-";
  const abs = Math.abs(offsetMin);
  const offH = pad(Math.floor(abs / 60));
  const offM = pad(abs % 60);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}${sign}${offH}:${offM}`;
}

/** Safely parse an ISO date string. Returns null if empty or invalid. */
export function parseIsoDate(iso: string | undefined): Date | null {
  if (!iso?.trim()) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}
