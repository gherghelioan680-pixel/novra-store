export type DisplayCurrency = "RON" | "EUR";

export const CURRENCY_STORAGE_KEY = "novra_currency";
export const CURRENCY_COOKIE = "novra_currency";

/** 1 RON → EUR multiplier (default ~0.20 when 5 RON = 1 EUR). */
export function getEurRate(): number {
  const exchangeRate =
    process.env.EUR_EXCHANGE_RATE?.trim() ||
    process.env.NEXT_PUBLIC_EUR_EXCHANGE_RATE?.trim();

  if (exchangeRate) {
    const ronPerEur = Number.parseFloat(exchangeRate);
    if (Number.isFinite(ronPerEur) && ronPerEur > 0) {
      return 1 / ronPerEur;
    }
  }

  const directRate = process.env.NEXT_PUBLIC_EUR_RATE?.trim();
  if (directRate) {
    const rate = Number.parseFloat(directRate);
    if (Number.isFinite(rate) && rate > 0) {
      return rate;
    }
  }

  return 0.2;
}

export function convertRonToEur(amountRon: number): number {
  return amountRon * getEurRate();
}

export function isDisplayCurrency(value: string | null | undefined): value is DisplayCurrency {
  return value === "RON" || value === "EUR";
}

export function formatPrice(
  amountRon: number,
  currency: DisplayCurrency,
  labels: { ron: string; eur: string } = { ron: "RON", eur: "EUR" },
): string {
  if (currency === "EUR") {
    return `${convertRonToEur(amountRon).toFixed(2)} ${labels.eur}`;
  }
  return `${amountRon.toFixed(2)} ${labels.ron}`;
}

export function formatApproxEur(
  amountRon: number,
  labels: { eur: string; approx: string } = { eur: "EUR", approx: "≈" },
): string {
  return `${labels.approx} ${convertRonToEur(amountRon).toFixed(2)} ${labels.eur}`;
}
