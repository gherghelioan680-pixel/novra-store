"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Gift, Loader2, CreditCard } from "lucide-react";
import { GIFT_CARD_AMOUNTS, createCreditPurchaseCheckout } from "@/lib/credits";
import { createStoreRefreshEffect } from "@/lib/store";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function GiftCardsView() {
  const t = useTranslations("accountGiftCards");
  const searchParams = useSearchParams();
  const cancelled = searchParams.get("cancelled") === "1";
  const [loadingAmount, setLoadingAmount] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [stripeConfig, setStripeConfig] = useState<{ available: boolean } | null>(null);

  useEffect(() => {
    void fetch("/api/store/stripe/config")
      .then((res) => res.json())
      .then((data: { available?: boolean }) => setStripeConfig({ available: Boolean(data.available) }))
      .catch(() => setStripeConfig({ available: false }));
  }, []);

  useEffect(() => {
    return createStoreRefreshEffect(() => {}, { scopes: ["credits"] });
  }, []);

  const handlePurchase = async (amount: number) => {
    setError("");
    setLoadingAmount(amount);
    const result = await createCreditPurchaseCheckout(amount);
    setLoadingAmount(null);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    window.location.assign(result.url);
  };

  const cardAvailable = stripeConfig?.available ?? false;

  return (
    <div>
      <h2 className="mb-2 text-xl font-semibold text-white">{t("title")}</h2>
      <p className="mb-6 text-sm text-gray-400">{t("subtitle")}</p>

      {cancelled && (
        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {t("paymentCancelled")}
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {GIFT_CARD_AMOUNTS.map((amount) => (
          <button
            key={amount}
            type="button"
            disabled={!cardAvailable || loadingAmount !== null}
            onClick={() => handlePurchase(amount)}
            className="group relative flex flex-col items-center rounded-xl border border-white/10 bg-gradient-to-br from-purple-600/10 to-novra-card/40 p-5 transition hover:border-purple-500/40 hover:from-purple-600/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Gift className="mb-3 h-8 w-8 text-purple-400 transition group-hover:scale-110" />
            <span className="text-2xl font-bold text-white">{amount}</span>
            <span className="text-xs text-gray-500">{t("lei")}</span>
            <span className="mt-2 text-[10px] uppercase tracking-widest text-purple-300">
              NovraCredits
            </span>
            {loadingAmount === amount && (
              <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-novra-bg/60">
                <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="mt-6 rounded-xl border border-white/10 bg-novra-card/30 p-5">
        <div className="flex items-start gap-3">
          <CreditCard className="mt-0.5 h-5 w-5 shrink-0 text-purple-400" />
          <div>
            <h3 className="text-sm font-medium text-white">{t("securePaymentTitle")}</h3>
            <p className="mt-1 text-sm text-gray-400">
              {cardAvailable ? t("creditsAutoLoad") : t("cardUnavailableContact")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
