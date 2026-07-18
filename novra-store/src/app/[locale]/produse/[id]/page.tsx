"use client";

import { use, useState, useRef, useEffect } from "react";
import { notFound } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import ProductImage from "@/components/produse/ProductImage";
import BundleProductImages from "@/components/produse/BundleProductImages";
import ProductGalleryBox from "@/components/produse/ProductGalleryBox";
import { ArrowLeft, Check, Cpu, Layers, Lock, ShieldCheck, ShoppingBag, Zap } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useCart } from "@/context/CartContext";
import {
  getProductById,
  loadProductOverrides,
  buildProduseUrl,
  DEFAULT_BUNDLE_SELECTIONS,
  ADAPTER_COLOR_STYLES,
  BUNDLE_COLORS,
  getBundleVariantLabel,
  getAdapterColorImage,
  getCableColorImage,
  getAdapterProductImage,
  isLockedVariant,
  isAdapterProduct,
  isBundleProduct,
  isUsbCCable,
  getProductStockQuantity,
  type CatalogProduct,
} from "@/lib/catalog";
import ProductStockLabel from "@/components/produse/ProductStockLabel";
import ProductBadges, { ProductBadgesOverlay } from "@/components/produse/ProductBadges";
import { getWhatsAppNumber } from "@/lib/site-settings";
import { buildWhatsAppUrl as buildWhatsAppLink, createStoreRefreshEffect } from "@/lib/store";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function ProductDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const [product, setProduct] = useState<CatalogProduct | undefined>(() => getProductById(id));

  useEffect(() => {
    return createStoreRefreshEffect(async () => {
      await loadProductOverrides();
      setProduct(getProductById(id));
    }, { scopes: ["products"] });
  }, [id]);

  if (!product) {
    notFound();
  }

  return <ProductDetailContent product={product} />;
}

function ProductDetailContent({ product }: { product: CatalogProduct }) {
  const t = useTranslations("productModal");
  const tp = useTranslations("products");
  const tc = useTranslations("common");
  const tw = useTranslations("whatsapp");
  const { addItem } = useCart();
  const [activeOptionIdx, setActiveOptionIdx] = useState(0);
  const [bundleSelections, setBundleSelections] = useState(DEFAULT_BUNDLE_SELECTIONS);
  const [shakingOptionIdx, setShakingOptionIdx] = useState<number | null>(null);
  const lastAddRef = useRef(0);

  const getBundleSelection = (pid: string) => bundleSelections[pid] ?? { adapterIdx: 0, cableIdx: 0 };
  const bundleSelection = getBundleSelection(product.id);
  const isCurrentVariantUnavailable = isLockedVariant(product.id, activeOptionIdx);
  const stockQuantity = getProductStockQuantity(product);
  const isOutOfStock = stockQuantity <= 0;

  const handleOptionSelect = (pid: string, optionIndex: number) => {
    if (isLockedVariant(pid, optionIndex)) return;
    setActiveOptionIdx(optionIndex);
    if (isUsbCCable(pid) && optionIndex === 0) {
      setShakingOptionIdx(optionIndex);
      window.setTimeout(() => setShakingOptionIdx(null), 400);
    }
  };

  const handleBundleColorSelect = (pid: string, type: "adapter" | "cable", colorIdx: number) => {
    setBundleSelections((prev) => ({
      ...prev,
      [pid]: {
        ...prev[pid],
        [type === "adapter" ? "adapterIdx" : "cableIdx"]: colorIdx,
      },
    }));
  };

  const buildWhatsAppUrl = (p: CatalogProduct, optionIndex: number) => {
    if (isLockedVariant(p.id, optionIndex)) return null;

    let variantLabel: string;
    let finalPrice: string;

    if (isBundleProduct(p.category)) {
      const sel = getBundleSelection(p.id);
      variantLabel = getBundleVariantLabel(sel.adapterIdx, sel.cableIdx);
      finalPrice = p.basePrice.toFixed(2);
    } else {
      variantLabel = p.options[optionIndex];
      finalPrice = (p.basePrice + p.modifiers[optionIndex]).toFixed(2);
    }

    const variantField = isBundleProduct(p.category)
      ? t("variantConfiguration")
      : isAdapterProduct(p.category)
        ? t("variantColor")
        : t("variantLength");
    const message = t("whatsappOrderMessage", {
      title: p.title,
      variantField,
      variantLabel,
      price: finalPrice,
    });

    return buildWhatsAppLink(getWhatsAppNumber(), message);
  };

  const getCurrentProductImage = () => {
    if (isBundleProduct(product.category)) {
      return getAdapterColorImage(bundleSelection.adapterIdx);
    }
    if (isAdapterProduct(product.category)) {
      return getAdapterProductImage(product.options[activeOptionIdx]);
    }
    return product.imageSrc;
  };

  const getCurrentVariantLabel = () => {
    if (isBundleProduct(product.category)) {
      const sel = getBundleSelection(product.id);
      return getBundleVariantLabel(sel.adapterIdx, sel.cableIdx);
    }
    return product.options[activeOptionIdx];
  };

  const getCurrentPrice = () => {
    if (isBundleProduct(product.category)) {
      return product.basePrice;
    }
    return product.basePrice + product.modifiers[activeOptionIdx];
  };

  const handleAddToCart = () => {
    if (isLockedVariant(product.id, activeOptionIdx) || isOutOfStock) return;

    const now = Date.now();
    if (now - lastAddRef.current < 600) return;
    lastAddRef.current = now;

    addItem({
      productId: product.id,
      title: product.title,
      variantLabel: getCurrentVariantLabel(),
      unitPrice: getCurrentPrice(),
      imageSrc: product.imageSrc,
    });
  };

  const addToCartButtonClass = `flex-1 flex items-center justify-center gap-2 bg-purple-600 text-white font-semibold px-6 py-3.5 rounded-xl text-xs uppercase tracking-wider transition-colors duration-200 shadow-xl touch-manipulation min-h-11 w-full cursor-pointer ${
    isCurrentVariantUnavailable || isOutOfStock ? "opacity-50 cursor-not-allowed pointer-events-none" : "hover:bg-purple-700 active:bg-purple-800"
  }`;

  const whatsAppUrl = buildWhatsAppUrl(product, activeOptionIdx);

  return (
    <div className="min-h-screen bg-novra-bg text-white">
      <Navbar />

      <main className="mx-auto w-full max-w-3xl px-4 sm:px-6 pb-[calc(6rem+env(safe-area-inset-bottom,0px))] md:pb-8">
        <Link
          href={buildProduseUrl({ category: product.category })}
          className="inline-flex items-center gap-2 text-xs text-gray-500 hover:text-purple-400 uppercase tracking-widest mb-4 sm:mb-6 transition-colors group touch-manipulation"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> {tp("backToCatalog")}
        </Link>

        <article className="bg-novra-surface border border-white/10 rounded-t-2xl sm:rounded-xl p-3 sm:p-5 md:p-6 flex flex-col md:flex-row gap-3 md:gap-6 -mx-4 sm:mx-0">
          <ProductGalleryBox
            className="w-full md:w-[38%] md:min-h-[320px]"
            overlay={
              <>
                <ProductBadgesOverlay product={product} />
                <span className="absolute top-3 right-3 z-10 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[9px] uppercase tracking-widest px-2.5 py-0.5 rounded-full font-medium">
                  {product.tag}
                </span>
              </>
            }
          >
            {isBundleProduct(product.category) ? (
              <BundleProductImages
                productId={product.id}
                adapterIdx={bundleSelection.adapterIdx}
                cableIdx={bundleSelection.cableIdx}
                imageClassName="object-contain object-center rounded-lg"
                priority
              />
            ) : (
              <ProductImage
                src={getCurrentProductImage()}
                category={product.category}
                alt={product.title}
                fill
                sizes="(max-width: 768px) 100vw, 38vw"
                className="object-contain object-center rounded-lg"
                priority
                draggable={false}
              />
            )}
          </ProductGalleryBox>

          <div className="flex-1 flex flex-col">
            <h1 className="font-bold tracking-tight text-white mb-1 text-lg md:text-xl">{product.title}</h1>
            <ProductBadges product={product} className="mb-2" />
            <p className="text-purple-500 text-[11px] uppercase tracking-widest font-semibold mb-2">{product.subtitle}</p>
            <p className="text-gray-400 text-sm font-light leading-relaxed mb-3">{product.description}</p>
            <ProductStockLabel product={product} className="mb-3 block" />

            <div className="bg-novra-surface/70 border border-white/8 rounded-lg text-[11px] grid grid-cols-1 min-[400px]:grid-cols-2 gap-1.5 p-2.5 mb-3">
              <div className="flex items-center gap-2 text-gray-300 min-w-0">
                <Zap size={14} className="text-purple-500 shrink-0" />
                <span className="break-words">
                  <strong>{t("specPower")}</strong> {product.specs.power}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-300 min-w-0">
                <Layers size={14} className="text-purple-500 shrink-0" />
                <span className="break-words">
                  <strong>{t("specSync")}</strong> {product.specs.speed}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-300 min-w-0">
                <Cpu size={14} className="text-purple-500 shrink-0" />
                <span className="break-words">
                  <strong>{t("specArch")}</strong> {product.specs.chip}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-300 min-w-0">
                <ShieldCheck size={14} className="text-purple-500 shrink-0" />
                <span className="break-words">
                  <strong>{t("specMaterial")}</strong> {product.specs.material}
                </span>
              </div>
            </div>

            {isBundleProduct(product.category) ? (
              <div className="mb-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 md:gap-3">
                  {(["adapter", "cable"] as const).map((colorType) => {
                    const activeIdx = colorType === "adapter" ? bundleSelection.adapterIdx : bundleSelection.cableIdx;
                    const label = colorType === "adapter" ? t("adapterColor") : t("cableColor");

                    return (
                      <div key={colorType}>
                        <span className="text-[10px] uppercase tracking-widest text-gray-500 block mb-2 font-bold">{label}</span>
                        <div className="flex flex-wrap gap-2">
                          {BUNDLE_COLORS.map((color, colorIdx) => {
                            const colorStyle = ADAPTER_COLOR_STYLES[color];
                            const selected = activeIdx === colorIdx;

                            return (
                              <button
                                key={`${colorType}-${color}`}
                                type="button"
                                onClick={() => handleBundleColorSelect(product.id, colorType, colorIdx)}
                                className={`min-h-11 px-3 py-2 rounded-xl text-xs font-medium border transition-colors duration-200 flex items-center gap-2 cursor-pointer touch-manipulation ${
                                  selected
                                    ? `${colorStyle.selectedBg} ${colorStyle.border} ${colorStyle.text} shadow-lg font-semibold`
                                    : `${colorStyle.bg} ${colorStyle.border} ${colorStyle.text} hover:opacity-90`
                                }`}
                              >
                                <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-md bg-black/20">
                                  <BundleProductImages
                                    productId={product.id}
                                    adapterIdx={colorType === "adapter" ? colorIdx : bundleSelection.adapterIdx}
                                    cableIdx={colorType === "cable" ? colorIdx : bundleSelection.cableIdx}
                                    className="flex flex-col h-full w-full gap-0 min-h-0"
                                    adapterClassName="relative h-[55%] w-full min-h-0 shrink-0"
                                    cableClassName="relative h-[45%] w-full min-h-0 shrink-0"
                                    imageClassName="object-contain object-center"
                                    sizes="32px"
                                  />
                                </span>
                                {selected && <Check size={12} className={colorStyle.text} />}
                                <span className={colorStyle.text}>{color}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="mb-3">
                <span className="text-[10px] uppercase tracking-widest text-gray-500 block mb-2 font-bold">
                  {isAdapterProduct(product.category) ? t("chooseColor") : t("chooseVariant")}
                </span>
                <div className="flex flex-wrap gap-2">
                  {product.options.map((option, optionIdx) => {
                    const locked = isLockedVariant(product.id, optionIdx);
                    const selected = activeOptionIdx === optionIdx;
                    const colorStyle = isAdapterProduct(product.category) ? ADAPTER_COLOR_STYLES[option] : null;

                    return (
                      <button
                        key={option}
                        type="button"
                        disabled={locked}
                        onClick={() => handleOptionSelect(product.id, optionIdx)}
                        className={`min-h-11 px-3 py-2 rounded-xl text-xs font-medium border transition-colors duration-200 flex items-center gap-2 touch-manipulation ${
                          shakingOptionIdx === optionIdx ? "animate-[shake_0.4s_ease-in-out]" : ""
                        } ${
                          locked
                            ? "cursor-not-allowed border-red-500/70 text-red-400 bg-red-950/40"
                            : colorStyle
                              ? selected
                                ? `${colorStyle.selectedBg} ${colorStyle.border} ${colorStyle.text} shadow-lg cursor-pointer font-semibold`
                                : `${colorStyle.bg} ${colorStyle.border} ${colorStyle.text} hover:opacity-90 cursor-pointer`
                              : selected
                                ? "bg-white text-black border-white shadow-xl cursor-pointer"
                                : "bg-transparent text-gray-400 border-white/10 hover:border-white/30 cursor-pointer"
                        }`}
                      >
                        {locked ? (
                          <>
                            <Lock size={11} className="text-red-500 shrink-0" />
                            <span className="text-red-400 font-semibold">{option}</span>
                          </>
                        ) : (
                          <>
                            {colorStyle && (
                              <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-md bg-black/20">
                                <ProductImage
                                  src={getAdapterProductImage(option)}
                                  category="lightning"
                                  alt={option}
                                  fill
                                  className="object-contain p-0.5"
                                  draggable={false}
                                />
                              </span>
                            )}
                            {selected && <Check size={12} className={colorStyle?.text} />}
                            <span className={colorStyle?.text}>{option}</span>
                          </>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Desktop-only inline price + actions */}
            <div className="border-t border-white/10 pt-3 mt-auto hidden md:block">
              <div className="mb-2.5">
                <span className="text-[9px] uppercase tracking-widest text-gray-500 block font-medium">{t("finalPrice")}</span>
                <span className="text-xl font-bold text-white tracking-tight">
                  {getCurrentPrice().toFixed(2)} {tc("ron")}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={isCurrentVariantUnavailable || isOutOfStock}
                  className={addToCartButtonClass}
                  style={{ WebkitTapHighlightColor: "transparent" }}
                >
                  <ShoppingBag size={15} />
                  {isOutOfStock ? tc("outOfStock") : tc("addToCart")}
                </button>
                {whatsAppUrl && (
                  <a
                    href={whatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] text-white font-semibold px-6 py-3.5 rounded-xl text-xs uppercase tracking-wider transition-colors duration-200 shadow-xl touch-manipulation min-h-11 hover:bg-[#20BA5C] active:bg-[#1da851]"
                  >
                    <FaWhatsapp size={16} />
                    {tw("label")}
                  </a>
                )}
              </div>
            </div>
          </div>
        </article>
      </main>

      {/* Mobile sticky bottom bar — single CTA area */}
      <div className="fixed bottom-0 left-0 right-0 z-[200] bg-novra-surface/98 backdrop-blur-sm border-t border-white/10 px-4 pt-2.5 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] md:hidden">
        <div className="mb-2">
          <span className="text-[9px] uppercase tracking-widest text-gray-500 block font-medium">{t("finalPrice")}</span>
          <span className="text-xl font-bold text-white tracking-tight">
            {getCurrentPrice().toFixed(2)} {tc("ron")}
          </span>
        </div>

        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isCurrentVariantUnavailable || isOutOfStock}
            className={addToCartButtonClass}
            style={{ WebkitTapHighlightColor: "transparent" }}
          >
            <ShoppingBag size={15} />
            {isOutOfStock ? tc("outOfStock") : tc("addToCart")}
          </button>
          {whatsAppUrl && (
            <a
              href={whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] text-white font-semibold px-4 py-3 rounded-xl text-xs uppercase tracking-wider transition-colors duration-200 shadow-xl touch-manipulation min-h-11 hover:bg-[#20BA5C] active:bg-[#1da851]"
            >
              <FaWhatsapp size={16} />
              {tw("label")}
            </a>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
