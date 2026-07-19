"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  CURRENCY_COOKIE,
  CURRENCY_STORAGE_KEY,
  type DisplayCurrency,
  isDisplayCurrency,
} from "@/lib/currency";

type CurrencyContextValue = {
  currency: DisplayCurrency;
  setCurrency: (currency: DisplayCurrency) => void;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

function persistCurrency(currency: DisplayCurrency): void {
  try {
    window.localStorage.setItem(CURRENCY_STORAGE_KEY, currency);
    document.cookie = `${CURRENCY_COOKIE}=${currency}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
  } catch {
    /* ignore */
  }
}

export function CurrencyProvider({
  children,
  initialCurrency = "RON",
}: {
  children: ReactNode;
  initialCurrency?: DisplayCurrency;
}) {
  const [currency, setCurrencyState] = useState<DisplayCurrency>(initialCurrency);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(CURRENCY_STORAGE_KEY);
      if (isDisplayCurrency(stored)) {
        setCurrencyState(stored);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const setCurrency = useCallback((next: DisplayCurrency) => {
    setCurrencyState(next);
    persistCurrency(next);
  }, []);

  const value = useMemo(() => ({ currency, setCurrency }), [currency, setCurrency]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency(): CurrencyContextValue {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within CurrencyProvider");
  }
  return context;
}
