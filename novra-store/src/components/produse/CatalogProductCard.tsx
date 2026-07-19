"use client";

import { useState } from "react";
import { ShoppingBag, Star } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import ProductImage from "@/components/produse/ProductImage";
import BundleProductImages from "@/components/produse/BundleProductImages";
import { ProductBadgesOverlay } from "@/components/produse/ProductBadges";
import ScrollReveal from "@/components/home/ScrollReveal";
import { useCart } from "@/context/CartContext";
import {
  buildProductUrl,
  formatStockLabel,
  getProductStockQuantity,
  isBundleProduct,
  isProductInStock,
  type CatalogProduct,
} from "@/lib/catalog";
import { getWhatsAppNumber } from "@/lib/site-settings";
import { buildWhatsAppUrl } from "@/lib/store";
import { useLocalizedCategoryLabel } from "@/hooks/useLocalizedCatalogProducts";

type CatalogProductCardProps = {
  product: CatalogProduct;
  index?: number;
};

export function CatalogProductCard({ product, index = 0 }: CatalogProductCardProps) {
  const tp = useTranslations("products");
  const th = useTranslations("home");
  const tc = useTranslations("common");
  const { addItem } = useCart();
  const [showGoToCart, setShowGoToCart] = useState(false);

  const categoryLabel = useLocalizedCategoryLabel(
    product.category,
    product.category === "usb-c" ? "Cabluri" : product.category === "lightning" ? "Adaptoare" : "Bundle"
  );

  const stockQuantity = getProductStockQuantity(product);
  const stockLabel = formatStockLabel(stockQuantity);
  const inStock = isProductInStock(product);
  const isBundle = isBundleProduct(product.category);
  const variantLabel = product.tag || product.options[0] || "Standard";
  const unitPrice = product.basePrice;
  const price = `${product.basePrice.toFixed(2)} ${tc("ron")}`;

  const handleQuickAdd = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!inStock) return;
    addItem({
      productId: product.id,
      title: product.title,
      variantLabel,
      unitPrice,
      imageSrc: product.imageSrc,
    });
    setShowGoToCart(true);
  };

  const handleWhatsAppOrder = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const message = th("productWhatsappMessage", { title: product.title, category: categoryLabel, price });
    window.open(buildWhatsAppUrl(getWhatsAppNumber(), message), "_blank");
  };

  return (
    <ScrollReveal variant="scale-up" delay={(index % 12) * 60} className="h-full">
      <Link
        href={buildProductUrl(product.id)}
        aria-label={tp("viewProductAria", { title: product.title })}
        className="group relative h-full bg-novra-card/40 border border-white/8 rounded-2xl p-5 sm:p-6 hover:border-purple-500/40 hover:bg-novra-card/60 transition-all duration-500 overflow-hidden flex flex-col touch-manipulation [-webkit-tap-highlight-color:transparent]"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 blur-[40px] rounded-full group-hover:bg-purple-500/10 transition-colors pointer-events-none" />
        <div className="h-48 sm:h-56 rounded-xl mb-4 sm:mb-5 overflow-hidden relative border border-white/5 bg-gradient-to-br from-purple-500/5 to-transparent">
          <div className="absolute inset-0 flex items-center justify-center p-2 sm:p-3">
            <div className="relative h-full w-full min-h-0">
              {isBundle ? (
                <BundleProductImages
                  productId={product.id}
                  imageClassName="object-contain object-center group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              ) : (
                <ProductImage
                  src={product.imageSrc}
                  category={product.category}
                  alt={product.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-contain object-center group-hover:scale-105 transition-transform duration-500"
                />
              )}
            </div>
          </div>
          <ProductBadgesOverlay product={product} />
          <span className="absolute top-3 right-3 text-[10px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full bg-purple-600/80 backdrop-blur-sm border border-purple-500/30">
            {variantLabel}
          </span>
        </div>
        <p className="text-purple-400 text-xs font-semibold uppercase tracking-widest mb-1">{categoryLabel}</p>
        <h3 className="font-bold text-base sm:text-lg mb-2 group-hover:text-purple-300 transition-colors line-clamp-2">
          {product.title}
        </h3>
        <div className="flex items-center gap-1 mb-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} size={12} className="text-yellow-500 fill-yellow-500" aria-hidden />
          ))}
          <span className="text-xs text-gray-500 ml-1">(5.0)</span>
        </div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-3 border-t border-white/8 mt-auto">
          <div>
            <p className="text-purple-400 font-bold text-lg sm:text-xl">{price}</p>
            <p className={`text-xs mt-1 ${inStock ? "text-emerald-400" : "text-red-400"}`}>{stockLabel}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleQuickAdd}
              title={inStock ? th("quickAddTitle") : tc("outOfStock")}
              aria-label={inStock ? th("addToCartAria", { title: product.title }) : th("outOfStockAria", { title: product.title })}
              disabled={!inStock}
              className={`relative z-10 min-h-11 inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-full transition-colors duration-300 shadow-lg touch-manipulation text-[10px] sm:text-xs font-semibold whitespace-nowrap ${
                inStock
                  ? "bg-purple-600 hover:bg-purple-700 shadow-purple-900/30"
                  : "bg-gray-700 text-gray-400 cursor-not-allowed"
              }`}
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              <ShoppingBag size={14} aria-hidden />
              {inStock ? th("quickAdd") : tc("outOfStock")}
            </button>
            {showGoToCart && (
              <Link
                href="/cos"
                onClick={(e) => e.stopPropagation()}
                className="relative z-10 min-h-11 flex items-center justify-center px-3 bg-white/10 border border-white/20 text-white text-[10px] font-semibold uppercase tracking-wider rounded-full hover:bg-white/15 transition-colors touch-manipulation whitespace-nowrap"
              >
                {th("goToCart")}
              </Link>
            )}
            <button
              type="button"
              onClick={handleWhatsAppOrder}
              title={th("orderWhatsappTitle")}
              aria-label={th("orderWhatsappAria", { title: product.title })}
              className="relative z-10 min-w-11 min-h-11 flex items-center justify-center p-3 bg-[#25D366] rounded-full hover:bg-[#20bd5a] transition-colors duration-300 text-white shadow-lg shadow-green-500/20 touch-manipulation"
            >
              <FaWhatsapp size={16} />
            </button>
          </div>
        </div>
      </Link>
    </ScrollReveal>
  );
}
