"use client";

import { useTranslations } from "next-intl";
import { useCurrency } from "@/context/CurrencyContext";
import type { DisplayCurrency } from "@/lib/currency";

const CURRENCIES: DisplayCurrency[] = ["RON", "EUR"];

type CurrencySwitcherProps = {
  variant?: "desktop" | "mobile";
};

export default function CurrencySwitcher({ variant = "desktop" }: CurrencySwitcherProps) {
  const t = useTranslations("currency");
  const { currency, setCurrency } = useCurrency();

  if (variant === "mobile") {
    return (
      <div className="px-4 py-3 border-t border-white/10 mt-2">
        <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">{t("label")}</p>
        <div className="flex gap-2">
          {CURRENCIES.map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => setCurrency(code)}
              className={`min-h-10 flex-1 rounded-lg text-sm font-semibold border transition-colors touch-manipulation ${
                currency === code
                  ? "bg-purple-600 border-purple-600 text-white"
                  : "border-white/10 text-gray-400 hover:border-purple-500/40 hover:text-white"
              }`}
            >
              {code}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="hidden sm:flex items-center gap-0.5 rounded-lg border border-white/10 bg-novra-card/40 p-0.5"
      role="group"
      aria-label={t("label")}
    >
      {CURRENCIES.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setCurrency(code)}
          className={`min-w-9 min-h-8 px-2 rounded-md text-xs font-semibold transition-colors ${
            currency === code
              ? "bg-purple-600 text-white"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          }`}
        >
          {code}
        </button>
      ))}
    </div>
  );
}
