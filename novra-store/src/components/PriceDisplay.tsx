"use client";

import { useFormatPrice } from "@/hooks/useFormatPrice";

type PriceDisplayProps = {
  amountRon: number;
  className?: string;
  secondaryClassName?: string;
  showSecondary?: boolean;
};

export default function PriceDisplay({
  amountRon,
  className = "",
  secondaryClassName = "text-xs text-gray-500 mt-0.5",
  showSecondary = true,
}: PriceDisplayProps) {
  const { currency, formatRon, formatApprox } = useFormatPrice();

  return (
    <div className={className}>
      <span>{formatRon(amountRon)}</span>
      {showSecondary && currency === "RON" && (
        <span className={secondaryClassName}>{formatApprox(amountRon)}</span>
      )}
    </div>
  );
}
