"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Copy, Check, Tag, ArrowRight } from "lucide-react";
import type { PublicPromoCode } from "@/lib/discount-codes-server";
import { formatDiscountValue } from "@/lib/discount-codes";

type PromoCodesSectionProps = {
  codes: PublicPromoCode[];
};

export default function PromoCodesSection({ codes }: PromoCodesSectionProps) {
  const t = useTranslations("promotions");
  const tCopy = useTranslations("copy");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  if (codes.length === 0) return null;

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      window.setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <section className="mb-14">
      <div className="mb-6 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-600/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-purple-300">
          <Tag size={14} />
          {t("couponBadge")}
        </span>
        <h2 className="mt-4 text-xl sm:text-2xl font-bold text-white">{t("couponTitle")}</h2>
        <p className="mt-2 text-sm text-gray-400 max-w-lg mx-auto">{t("couponSubtitle")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {codes.map((promo) => (
          <div
            key={promo.code}
            className="group relative overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-950/40 via-novra-card/40 to-novra-bg p-5 transition hover:border-purple-500/40"
          >
            <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-purple-500/15 blur-2xl" />
            <div className="relative">
              <p className="text-xs uppercase tracking-widest text-purple-400 mb-2">{t("couponLabel")}</p>
              <div className="flex items-center gap-2 mb-3">
                <span className="font-mono text-lg font-bold text-white tracking-wide">{promo.code}</span>
                <button
                  type="button"
                  onClick={() => void handleCopy(promo.code)}
                  className="inline-flex items-center justify-center rounded-lg border border-white/10 p-2 text-gray-400 hover:text-white hover:bg-white/5 transition"
                  aria-label={tCopy("copy")}
                >
                  {copiedCode === promo.code ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                </button>
              </div>
              <p className="text-sm text-gray-300">
                {formatDiscountValue(promo.type, promo.value)} {t("couponDiscount")}
                {promo.freeShipping && ` · ${t("couponFreeShipping")}`}
              </p>
              <Link
                href={`/checkout?code=${encodeURIComponent(promo.code)}`}
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-purple-400 hover:text-purple-300 transition group-hover:gap-2"
              >
                {t("useAtCheckout")}
                <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
