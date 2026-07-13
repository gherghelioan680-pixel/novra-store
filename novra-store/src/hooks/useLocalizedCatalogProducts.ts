"use client";

import { useMemo } from "react";
import { useLocale, useMessages } from "next-intl";
import { useCatalogProducts } from "@/hooks/useCatalogProducts";
import { getLocalizedProduct, getLocalizedCategoryLabel } from "@/lib/product-i18n";
import type { AppLocale } from "@/i18n/routing";
import type { CatalogProduct } from "@/lib/catalog";

export function useLocalizedCatalogProducts(category?: string): CatalogProduct[] {
  const products = useCatalogProducts(category);
  const locale = useLocale() as AppLocale;
  const messages = useMessages();

  return useMemo(
    () => products.map((product) => getLocalizedProduct(product, locale, messages)),
    [products, locale, messages]
  );
}

export function useLocalizedCategoryLabel(categoryId: string, fallback: string): string {
  const locale = useLocale() as AppLocale;
  const messages = useMessages();

  return useMemo(
    () => getLocalizedCategoryLabel(categoryId, fallback, locale, messages),
    [categoryId, fallback, locale, messages]
  );
}
