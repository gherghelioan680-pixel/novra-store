const ORDER_DATE_FORMATTER = new Intl.DateTimeFormat("ro-RO", {
  timeZone: "Europe/Bucharest",
  dateStyle: "long",
  timeStyle: "short",
});

/** Format an ISO UTC timestamp for order display in Romania (Europe/Bucharest). */
export function formatOrderDate(isoString: string | undefined | null): string {
  const raw = isoString?.trim();
  if (!raw) return "";
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;
  return ORDER_DATE_FORMATTER.format(parsed);
}
