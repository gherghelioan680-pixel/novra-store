"use client";

import { useEffect, useState } from "react";
import {
  getCatalogProducts,
  getProductsByCategory,
  loadProductOverrides,
  type CatalogProduct,
} from "@/lib/catalog";
import { createStoreRefreshEffect } from "@/lib/store";

function productsEqual(a: CatalogProduct[], b: CatalogProduct[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((product, index) => {
    const other = b[index];
    return (
      product.id === other.id &&
      product.basePrice === other.basePrice &&
      product.title === other.title &&
      product.tag === other.tag
    );
  });
}

export function useCatalogProducts(category?: string): CatalogProduct[] {
  const [products, setProducts] = useState<CatalogProduct[]>(() =>
    category ? getProductsByCategory(category) : getCatalogProducts()
  );

  useEffect(() => {
    return createStoreRefreshEffect(async () => {
      await loadProductOverrides();
      const next = category ? getProductsByCategory(category) : getCatalogProducts();
      setProducts((prev) => (productsEqual(prev, next) ? prev : next));
    }, { scopes: ["products"] });
  }, [category]);

  return products;
}
