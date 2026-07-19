"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { buildProduseUrl, type ProductSortOption } from "@/lib/catalog";

type ProductPaginationProps = {
  currentPage: number;
  totalPages: number;
  categoryId: string | null;
  sort: ProductSortOption;
};

function getVisiblePages(currentPage: number, totalPages: number): (number | "ellipsis")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | "ellipsis")[] = [1];

  if (currentPage > 3) pages.push("ellipsis");

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  if (currentPage < totalPages - 2) pages.push("ellipsis");

  pages.push(totalPages);
  return pages;
}

export function ProductPagination({ currentPage, totalPages, categoryId, sort }: ProductPaginationProps) {
  const t = useTranslations("products");

  if (totalPages <= 1) return null;

  const pages = getVisiblePages(currentPage, totalPages);
  const prevHref =
    currentPage > 1
      ? buildProduseUrl({ category: categoryId, page: currentPage - 1, sort })
      : undefined;
  const nextHref =
    currentPage < totalPages
      ? buildProduseUrl({ category: categoryId, page: currentPage + 1, sort })
      : undefined;

  const pageLinkClass = (active: boolean) =>
    `min-h-11 min-w-11 inline-flex items-center justify-center rounded-xl text-sm font-medium border transition-all duration-200 touch-manipulation ${
      active
        ? "bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-600/20"
        : "bg-transparent text-gray-400 border-white/8 hover:border-white/20 hover:text-white"
    }`;

  return (
    <nav
      className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-10"
      aria-label={t("paginationAria")}
    >
      {prevHref ? (
        <Link
          href={prevHref}
          scroll={false}
          className="inline-flex items-center gap-2 min-h-11 px-4 py-2 rounded-xl text-xs font-medium border border-white/8 text-gray-400 hover:border-purple-500/30 hover:text-white transition-all touch-manipulation"
        >
          <ChevronLeft size={16} aria-hidden />
          {t("paginationPrev")}
        </Link>
      ) : (
        <span className="inline-flex items-center gap-2 min-h-11 px-4 py-2 rounded-xl text-xs font-medium border border-white/5 text-gray-600 cursor-not-allowed">
          <ChevronLeft size={16} aria-hidden />
          {t("paginationPrev")}
        </span>
      )}

      <div className="flex flex-wrap items-center justify-center gap-2">
        {pages.map((page, index) =>
          page === "ellipsis" ? (
            <span key={`ellipsis-${index}`} className="px-2 text-gray-600 select-none" aria-hidden>
              …
            </span>
          ) : (
            <Link
              key={page}
              href={buildProduseUrl({ category: categoryId, page, sort })}
              scroll={false}
              aria-label={t("paginationPageAria", { page })}
              aria-current={page === currentPage ? "page" : undefined}
              className={pageLinkClass(page === currentPage)}
            >
              {page}
            </Link>
          )
        )}
      </div>

      {nextHref ? (
        <Link
          href={nextHref}
          scroll={false}
          className="inline-flex items-center gap-2 min-h-11 px-4 py-2 rounded-xl text-xs font-medium border border-white/8 text-gray-400 hover:border-purple-500/30 hover:text-white transition-all touch-manipulation"
        >
          {t("paginationNext")}
          <ChevronRight size={16} aria-hidden />
        </Link>
      ) : (
        <span className="inline-flex items-center gap-2 min-h-11 px-4 py-2 rounded-xl text-xs font-medium border border-white/5 text-gray-600 cursor-not-allowed">
          {t("paginationNext")}
          <ChevronRight size={16} aria-hidden />
        </span>
      )}
    </nav>
  );
}
