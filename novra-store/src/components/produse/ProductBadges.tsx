"use client";

import { useTranslations } from "next-intl";
import type { CatalogProduct } from "@/lib/catalog";
import { getBundleSavings, isBundleProduct } from "@/lib/catalog";

type ProductBadgesProps = {
  product: CatalogProduct;
  className?: string;
};

export default function ProductBadges({ product, className = "" }: ProductBadgesProps) {
  const t = useTranslations("products");
  const savings = getBundleSavings(product);
  const showBestseller = product.bestseller === true;
  const showSavings = isBundleProduct(product.category) && savings !== null && savings > 0;

  if (!showBestseller && !showSavings) return null;

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {showBestseller && (
        <span className="inline-flex items-center rounded-full border border-amber-500/40 bg-gradient-to-r from-amber-500/20 to-orange-500/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-amber-300 shadow-sm shadow-amber-900/20">
          {t("bestseller")}
        </span>
      )}
      {showSavings && (
        <span className="inline-flex items-center rounded-full border border-emerald-500/35 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-emerald-300">
          {t("bundleSavings", { amount: savings!.toFixed(0) })}
        </span>
      )}
    </div>
  );
}

export function ProductBadgesOverlay({ product }: { product: CatalogProduct }) {
  const t = useTranslations("products");
  const savings = getBundleSavings(product);
  const showBestseller = product.bestseller === true;
  const showSavings = isBundleProduct(product.category) && savings !== null && savings > 0;

  if (!showBestseller && !showSavings) return null;

  return (
    <div className="absolute top-2 left-2 z-10 flex flex-col items-start gap-1">
      {showBestseller && (
        <span className="inline-flex items-center rounded-md border border-amber-500/40 bg-gradient-to-r from-amber-600/90 to-orange-500/85 px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest text-white shadow-lg shadow-amber-900/30">
          {t("bestseller")}
        </span>
      )}
      {showSavings && (
        <span className="inline-flex items-center rounded-md border border-emerald-500/40 bg-emerald-600/85 px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest text-white shadow-lg shadow-emerald-900/20">
          {t("bundleSavingsShort", { amount: savings!.toFixed(0) })}
        </span>
      )}
    </div>
  );
}
