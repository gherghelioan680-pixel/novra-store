"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Package, SlidersHorizontal, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ClientErrorBoundary } from "@/components/ClientErrorBoundary";
import { CatalogProductCard } from "@/components/produse/CatalogProductCard";
import { ProductPagination } from "@/components/produse/ProductPagination";
import {
  CATALOG_CATEGORIES,
  buildProduseUrl,
  getTotalPages,
  normalizeCategoryParam,
  normalizePageParam,
  normalizeSortParam,
  paginateProducts,
  sortCatalogProducts,
  type ProductSortOption,
} from "@/lib/catalog";
import { useLocalizedCatalogProducts, useLocalizedCategoryLabel } from "@/hooks/useLocalizedCatalogProducts";

export function ProdusePageClient() {
  const t = useTranslations("products");
  const tc = useTranslations("common");
  const searchParams = useSearchParams();

  const categoryParam = searchParams.get("category");
  const activeCategoryId = normalizeCategoryParam(categoryParam);
  const currentPage = normalizePageParam(searchParams.get("page"));
  const sort = normalizeSortParam(searchParams.get("sort"));

  const allProducts = useLocalizedCatalogProducts();
  const filteredProducts = useMemo(
    () =>
      activeCategoryId
        ? allProducts.filter((product) => product.category === activeCategoryId)
        : allProducts,
    [allProducts, activeCategoryId]
  );

  const sortedProducts = useMemo(
    () => sortCatalogProducts(filteredProducts, sort),
    [filteredProducts, sort]
  );

  const totalPages = getTotalPages(sortedProducts.length);
  const safePage = Math.min(currentPage, totalPages);
  const paginatedProducts = paginateProducts(sortedProducts, safePage);

  const activeCategoryLabel = activeCategoryId
    ? CATALOG_CATEGORIES.find((cat) => cat.id === activeCategoryId)?.label ?? activeCategoryId
    : null;

  return (
    <div className="min-h-screen bg-novra-bg text-white selection:bg-purple-500/30">
      <Navbar />

      <main className="pb-page site-container">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs text-gray-500 hover:text-purple-400 uppercase tracking-widest mb-6 transition-colors group touch-manipulation"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> {tc("backHome")}
        </Link>

        <section className="relative overflow-hidden rounded-3xl border border-purple-500/20 bg-gradient-to-br from-purple-950/50 via-novra-card/40 to-novra-surface mb-10 px-6 py-10 sm:px-10 sm:py-14 text-center">
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-96 h-48 bg-purple-600/15 blur-[100px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-500/5 blur-[80px] rounded-full pointer-events-none" />
          <div className="relative z-10 max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-2 text-purple-400 text-xs font-semibold tracking-[0.25em] uppercase mb-4">
              <Sparkles size={14} aria-hidden />
              {t("catalogLabel")}
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tighter mb-4">{t("title")}</h1>
            <p className="text-gray-400 text-sm sm:text-base font-light leading-relaxed mb-6">{t("subtitle")}</p>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-gray-300">
              <Package size={14} className="text-purple-400" aria-hidden />
              {t("productCount", { count: filteredProducts.length })}
            </div>
          </div>
        </section>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-novra-card/30 border border-white/8 p-3 rounded-xl">
            <div className="flex items-center gap-2 text-xs text-gray-400 font-medium uppercase tracking-wider shrink-0">
              <SlidersHorizontal size={14} className="text-purple-500" />
              <span>{t("filterBy")}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <CategoryFilterLink categoryId={null} label={t("allCategories")} activeCategoryId={activeCategoryId} sort={sort} />
              {CATALOG_CATEGORIES.map((cat) => (
                <CategoryFilterLink
                  key={cat.id}
                  categoryId={cat.id}
                  label={cat.label}
                  activeCategoryId={activeCategoryId}
                  sort={sort}
                />
              ))}
            </div>
          </div>

          <SortSelect activeCategoryId={activeCategoryId} sort={sort} />
        </div>

        <ClientErrorBoundary>
          {paginatedProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8">
                {paginatedProducts.map((product, index) => (
                  <CatalogProductCard key={product.id} product={product} index={index} />
                ))}
              </div>
              <ProductPagination
                currentPage={safePage}
                totalPages={totalPages}
                categoryId={activeCategoryId}
                sort={sort}
              />
            </>
          ) : (
            <EmptyCategoryState categoryLabel={activeCategoryLabel} />
          )}
        </ClientErrorBoundary>
      </main>

      <Footer />
    </div>
  );
}

function CategoryFilterLink({
  categoryId,
  label,
  activeCategoryId,
  sort,
}: {
  categoryId: string | null;
  label: string;
  activeCategoryId: string | null;
  sort: ProductSortOption;
}) {
  const localizedFromHook = useLocalizedCategoryLabel(categoryId ?? "usb-c", label);
  const localizedLabel = categoryId ? localizedFromHook : label;
  const isActive = categoryId === activeCategoryId;

  return (
    <Link
      href={buildProduseUrl({ category: categoryId, sort })}
      scroll={false}
      className={`relative z-10 min-h-11 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-300 cursor-pointer touch-manipulation [-webkit-tap-highlight-color:transparent] inline-flex items-center ${
        isActive
          ? "bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-600/20"
          : "bg-transparent text-gray-400 border-white/8 hover:border-white/20 hover:text-white active:border-white/30 active:text-white"
      }`}
    >
      {localizedLabel}
    </Link>
  );
}

function SortSelect({
  activeCategoryId,
  sort,
}: {
  activeCategoryId: string | null;
  sort: ProductSortOption;
}) {
  const t = useTranslations("products");
  const router = useRouter();

  return (
    <label className="flex items-center gap-2 text-xs text-gray-400 font-medium uppercase tracking-wider bg-novra-card/30 border border-white/8 p-3 rounded-xl">
      <span className="shrink-0">{t("sortBy")}</span>
      <select
        value={sort}
        onChange={(event) => {
          const nextSort = normalizeSortParam(event.target.value);
          router.push(
            buildProduseUrl({
              category: activeCategoryId,
              sort: nextSort,
            })
          );
        }}
        className="min-h-11 flex-1 sm:flex-none bg-novra-surface border border-white/10 rounded-lg px-3 py-2 text-sm text-white normal-case tracking-normal cursor-pointer focus:outline-none focus:border-purple-500/50"
        aria-label={t("sortBy")}
      >
        <option value="featured">{t("sortFeatured")}</option>
        <option value="price-asc">{t("sortPriceAsc")}</option>
        <option value="price-desc">{t("sortPriceDesc")}</option>
        <option value="name">{t("sortName")}</option>
      </select>
    </label>
  );
}

function EmptyCategoryState({ categoryLabel }: { categoryLabel: string | null }) {
  const t = useTranslations("products");
  const tc = useTranslations("common");

  return (
    <div className="text-center py-24 border border-dashed border-white/10 rounded-3xl bg-novra-card/20">
      <Package size={40} className="mx-auto text-gray-600 mb-4" aria-hidden />
      <p className="text-gray-400 text-base font-light mb-2">
        {categoryLabel ? t("emptyCategory", { category: categoryLabel }) : tc("noProductsFound")}
      </p>
      <p className="text-gray-600 text-sm mb-6">{t("emptyCategoryHint")}</p>
      <Link
        href={buildProduseUrl({})}
        className="inline-flex items-center justify-center min-h-11 px-5 py-2 rounded-full bg-purple-600 hover:bg-purple-700 text-sm font-semibold transition-colors touch-manipulation"
      >
        {t("allCategories")}
      </Link>
    </div>
  );
}
