"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { useCurrency } from "@/context/CurrencyContext";
import { formatApproxEur, formatPrice } from "@/lib/currency";

export function useFormatPrice() {
  const { currency } = useCurrency();
  const tc = useTranslations("common");
  const tcur = useTranslations("currency");

  const labels = {
    ron: tc("ron"),
    eur: tc("eur"),
    approx: tcur("approx"),
  };

  const formatRon = useCallback(
    (amountRon: number) => formatPrice(amountRon, currency, labels),
    [currency, labels.ron, labels.eur],
  );

  const formatApprox = useCallback(
    (amountRon: number) => formatApproxEur(amountRon, labels),
    [labels.approx, labels.eur],
  );

  return { currency, formatRon, formatApprox };
}
