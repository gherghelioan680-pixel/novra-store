"use client";

import { useSearchParams } from "next/navigation";
import { ArrowLeft, SlidersHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ClientErrorBoundary } from "@/components/ClientErrorBoundary";
import { ProductGrid } from "@/components/produse/ProductGrid";
import { CATALOG_CATEGORIES, VALID_CATEGORY_IDS, buildProduseUrl } from "@/lib/catalog";
import { useLocalizedCatalogProducts, useLocalizedCategoryLabel } from "@/hooks/useLocalizedCatalogProducts";

export function ProdusePageClient() {
  const t = useTranslations("products");
  const tc = useTranslations("common");
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");
  const activeFilter = categoryParam && VALID_CATEGORY_IDS.has(categoryParam) ? categoryParam : "usb-c";
  const allProducts = useLocalizedCatalogProducts();
  const filteredProducts = allProducts.filter((p) => p.category === activeFilter);

  return (
    <div className="min-h-screen bg-novra-bg text-white selection:bg-purple-500/30">
      <Navbar />

      <main className="pb-page px-4 sm:px-6 max-w-5xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs text-gray-500 hover:text-purple-400 uppercase tracking-widest mb-6 transition-colors group touch-manipulation"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> {tc("backHome")}
        </Link>

        <div className="relative border-b border-white/10 pb-8 mb-8 text-center">
          <div className="max-w-xl mx-auto">
            <span className="text-purple-500 text-xs font-semibold tracking-[0.3em] uppercase block mb-2">
              {t("catalogLabel")}
            </span>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tighter mb-3">{t("title")}</h1>
            <p className="text-gray-400 text-sm font-light leading-relaxed">{t("subtitle")}</p>
          </div>
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-center gap-3 mb-6 bg-novra-card/30 border border-white/8 p-3 rounded-xl">
          <div className="flex items-center justify-center gap-2 text-xs text-gray-400 font-medium uppercase tracking-wider">
            <SlidersHorizontal size={14} className="text-purple-500" />
            <span>{t("filterBy")}</span>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {CATALOG_CATEGORIES.map((cat) => (
              <CategoryFilterLink key={cat.id} categoryId={cat.id} label={cat.label} activeFilter={activeFilter} />
            ))}
          </div>
        </div>

        <ClientErrorBoundary>
          <ProductGrid products={filteredProducts} activeCategory={activeFilter} />
        </ClientErrorBoundary>

        {filteredProducts.length === 0 && (
          <div className="text-center py-24 border border-dashed border-white/10 rounded-3xl">
            <p className="text-gray-500 text-sm font-light">{tc("noProductsFound")}</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

function CategoryFilterLink({
  categoryId,
  label,
  activeFilter,
}: {
  categoryId: string;
  label: string;
  activeFilter: string;
}) {
  const localizedLabel = useLocalizedCategoryLabel(categoryId, label);

  return (
    <Link
      href={buildProduseUrl({ category: categoryId })}
      scroll={false}
      className={`relative z-10 min-h-11 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-300 cursor-pointer touch-manipulation [-webkit-tap-highlight-color:transparent] inline-flex items-center ${
        activeFilter === categoryId
          ? "bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-600/20"
          : "bg-transparent text-gray-400 border-white/8 hover:border-white/20 hover:text-white active:border-white/30 active:text-white"
      }`}
    >
      {localizedLabel}
    </Link>
  );
}
