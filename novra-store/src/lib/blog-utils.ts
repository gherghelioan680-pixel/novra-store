/** Estimează timpul de citire (cuvinte / 200 wpm), minim 1 minut. */
export function estimateReadingTime(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export function formatReadingTime(minutes: number): string {
  return `${minutes} min de citit`;
}
