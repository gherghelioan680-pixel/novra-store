export function buildFanCourierTrackingUrl(awb: string): string {
  const trimmed = awb.trim();
  return `https://www.fancourier.ro/awb-tracking/?tracking=${encodeURIComponent(trimmed)}`;
}
