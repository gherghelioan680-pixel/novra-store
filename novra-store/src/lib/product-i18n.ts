import type { CatalogProduct } from "@/lib/catalog";
import type { AppLocale } from "@/i18n/routing";

type ProductMessages = {
  title?: string;
  subtitle?: string;
  description?: string;
  tag?: string;
  specs?: Partial<CatalogProduct["specs"]>;
};

type MessagesWithProducts = {
  catalogProducts?: Record<string, ProductMessages>;
  categories?: Record<string, string>;
};

export function getLocalizedProduct(
  product: CatalogProduct,
  locale: AppLocale,
  messages: MessagesWithProducts
): CatalogProduct {
  if (locale === "ro") return product;

  const localized = messages.catalogProducts?.[product.id];
  if (!localized) return product;

  return {
    ...product,
    title: localized.title ?? product.title,
    subtitle: localized.subtitle ?? product.subtitle,
    description: localized.description ?? product.description,
    tag: localized.tag ?? product.tag,
    specs: {
      ...product.specs,
      ...localized.specs,
    },
  };
}

export function getLocalizedCategoryLabel(
  categoryId: string,
  fallback: string,
  locale: AppLocale,
  messages: MessagesWithProducts
): string {
  if (locale === "ro") return fallback;
  return messages.categories?.[categoryId] ?? fallback;
}
