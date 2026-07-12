"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Check, Cpu, Layers, Lock, ShieldCheck, ShoppingBag, X, Zap } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import type { CatalogProduct } from "@/lib/catalog";
import {
  BUNDLE_COLORS,
  getAdapterColorImage,
  getAdapterProductImage,
  getBundleColorImage,
  getCableColorImage,
} from "@/lib/catalog";
import ProductImage from "@/components/produse/ProductImage";

type BundleSelection = { adapterIdx: number; cableIdx: number };

type ProductModalProps = {
  product: CatalogProduct;
  activeOptionIdx: number;
  bundleSelection: BundleSelection;
  shakingOptionIdx: number | null;
  addedFeedback: boolean;
  isCurrentVariantUnavailable: boolean;
  closeHref: string;
  onClose: () => void;
  onOptionSelect: (productId: string, optionIndex: number) => void;
  onBundleColorSelect: (productId: string, type: "adapter" | "cable", colorIdx: number) => void;
  onAddToCart: (product: CatalogProduct, optionIndex: number) => void;
  whatsAppUrl: string | null;
  isLockedVariant: (productId: string, optionIndex: number) => boolean;
  isAdapterProduct: (category: string) => boolean;
  isBundleProduct: (category: string) => boolean;
  getBundleVariantLabel: (adapterIdx: number, cableIdx: number) => string;
  bundleColors: readonly string[];
  adapterColorStyles: Record<string, { text: string; border: string; bg: string; selectedBg: string }>;
};

export function ProductModal({
  product,
  activeOptionIdx,
  bundleSelection,
  shakingOptionIdx,
  addedFeedback,
  isCurrentVariantUnavailable,
  closeHref,
  onClose,
  onOptionSelect,
  onBundleColorSelect,
  onAddToCart,
  whatsAppUrl,
  isLockedVariant,
  isAdapterProduct,
  isBundleProduct,
  getBundleVariantLabel,
  bundleColors,
  adapterColorStyles,
}: ProductModalProps) {
  const backdropPressedRef = useRef(false);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const handleBackdropPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    backdropPressedRef.current = event.target === event.currentTarget;
  };

  const handleBackdropPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (backdropPressedRef.current && event.target === event.currentTarget) {
      onClose();
    }
    backdropPressedRef.current = false;
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[10050] flex items-end sm:items-center justify-center bg-black/80 touch-manipulation"
      onPointerDown={handleBackdropPointerDown}
      onPointerUp={handleBackdropPointerUp}
      role="dialog"
      aria-modal="true"
      aria-label="Detalii produs"
    >
      <div
        className="bg-novra-surface border border-white/10 rounded-t-2xl sm:rounded-2xl max-w-4xl w-full max-h-[92dvh] overflow-y-auto p-4 sm:p-6 md:p-8 relative flex flex-col md:flex-row gap-4 md:gap-8 text-left"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
      >
        <Link
          href={closeHref}
          scroll={false}
          onClick={onClose}
          aria-label="Închide detaliile produsului"
          className="absolute top-4 right-4 text-gray-400 hover:text-white bg-novra-card/40 hover:bg-novra-elevated rounded-full transition cursor-pointer z-10 touch-manipulation min-w-11 min-h-11 flex items-center justify-center"
        >
          <X size={20} />
        </Link>

        <div className="shrink-0 bg-gradient-to-br from-purple-500/8 to-transparent border border-white/8 rounded-2xl p-4 sm:p-5 flex items-center justify-center relative min-h-[180px] md:min-h-0 md:w-[38%]">
          <span className="absolute top-4 left-4 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] uppercase tracking-widest px-3 py-1 rounded-full font-medium">
            {product.tag}
          </span>
          <div className="relative w-40 h-40 sm:w-44 sm:h-44 md:w-48 md:h-48">
            {isBundleProduct(product.category) ? (
              <div className="flex h-full items-center justify-center gap-2">
                <div className="relative h-36 w-28 sm:h-40 sm:w-32">
                  <ProductImage
                    src={getAdapterColorImage(bundleSelection.adapterIdx)}
                    category="lightning"
                    alt={`Adaptor ${BUNDLE_COLORS[bundleSelection.adapterIdx]}`}
                    fill
                    className="object-contain"
                    priority
                    draggable={false}
                  />
                </div>
                <div className="relative h-36 w-28 sm:h-40 sm:w-32">
                  <ProductImage
                    src={getCableColorImage(bundleSelection.cableIdx)}
                    category="usb-c"
                    alt={`Cablu ${BUNDLE_COLORS[bundleSelection.cableIdx]}`}
                    fill
                    className="object-contain"
                    priority
                    draggable={false}
                  />
                </div>
              </div>
            ) : (
              <ProductImage
                src={
                  isAdapterProduct(product.category)
                    ? getAdapterProductImage(product.options[activeOptionIdx])
                    : product.imageSrc
                }
                category={product.category}
                alt={product.title}
                fill
                className="object-contain"
                priority
                draggable={false}
              />
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 min-h-0 pr-1">
            <h2 className="font-bold tracking-tight text-white mb-1 text-xl md:text-2xl pr-12">{product.title}</h2>
            <p className="text-purple-500 text-xs uppercase tracking-widest font-semibold mb-3">{product.subtitle}</p>
            <p className="text-gray-400 text-sm font-light leading-relaxed mb-4">{product.description}</p>

            <div className="bg-novra-surface/70 border border-white/8 rounded-xl text-xs grid grid-cols-1 min-[400px]:grid-cols-2 gap-2 p-3 mb-4">
              <div className="flex items-center gap-2 text-gray-300 min-w-0">
                <Zap size={14} className="text-purple-500 shrink-0" />
                <span className="break-words">
                  <strong>Alimentare:</strong> {product.specs.power}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-300 min-w-0">
                <Layers size={14} className="text-purple-500 shrink-0" />
                <span className="break-words">
                  <strong>Sincronizare:</strong> {product.specs.speed}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-300 min-w-0">
                <Cpu size={14} className="text-purple-500 shrink-0" />
                <span className="break-words">
                  <strong>Arhitectură:</strong> {product.specs.chip}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-300 min-w-0">
                <ShieldCheck size={14} className="text-purple-500 shrink-0" />
                <span className="break-words">
                  <strong>Material:</strong> {product.specs.material}
                </span>
              </div>
            </div>

            {isBundleProduct(product.category) ? (
              <div className="mb-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  {(["adapter", "cable"] as const).map((colorType) => {
                    const activeIdx = colorType === "adapter" ? bundleSelection.adapterIdx : bundleSelection.cableIdx;
                    const label = colorType === "adapter" ? "Culoare adaptor" : "Culoare cablu";

                    return (
                      <div key={colorType}>
                        <span className="text-[10px] uppercase tracking-widest text-gray-500 block mb-2 font-bold">{label}</span>
                        <div className="flex flex-wrap gap-2">
                          {bundleColors.map((color, colorIdx) => {
                            const colorStyle = adapterColorStyles[color];
                            const selected = activeIdx === colorIdx;

                            return (
                              <button
                                key={`${colorType}-${color}`}
                                type="button"
                                onClick={() => onBundleColorSelect(product.id, colorType, colorIdx)}
                                className={`min-h-11 px-3 py-2 rounded-xl text-xs font-medium border transition-colors duration-200 flex items-center gap-2 cursor-pointer touch-manipulation ${
                                  selected
                                    ? `${colorStyle.selectedBg} ${colorStyle.border} ${colorStyle.text} shadow-lg font-semibold`
                                    : `${colorStyle.bg} ${colorStyle.border} ${colorStyle.text} hover:opacity-90`
                                }`}
                              >
                                <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-md bg-black/20">
                                  <ProductImage
                                    src={getBundleColorImage(colorType, colorIdx)}
                                    category={colorType === "adapter" ? "lightning" : "usb-c"}
                                    alt={color}
                                    fill
                                    className="object-contain p-0.5"
                                    draggable={false}
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
                <p className="text-[10px] text-gray-500 font-light mt-3">
                  Combinație:{" "}
                  <span className="text-purple-400 font-medium">
                    {getBundleVariantLabel(bundleSelection.adapterIdx, bundleSelection.cableIdx)}
                  </span>
                </p>
              </div>
            ) : (
              <div className="mb-2">
                <span className="text-[10px] uppercase tracking-widest text-gray-500 block mb-2 font-bold">
                  {isAdapterProduct(product.category) ? "Alege Culoarea" : "Alege Varianta"}
                </span>
                <div className="flex flex-wrap gap-2">
                  {product.options.map((option, optionIdx) => {
                    const locked = isLockedVariant(product.id, optionIdx);
                    const selected = activeOptionIdx === optionIdx;
                    const colorStyle = isAdapterProduct(product.category) ? adapterColorStyles[option] : null;

                    return (
                      <button
                        key={option}
                        type="button"
                        disabled={locked}
                        onClick={() => onOptionSelect(product.id, optionIdx)}
                        className={`min-h-11 px-3 py-2 rounded-xl text-xs font-medium border transition-colors duration-200 flex items-center gap-2 touch-manipulation ${
                          shakingOptionIdx === optionIdx ? "animate-[shake_0.4s_ease-in-out]" : ""
                        } ${
                          locked
                            ? "cursor-not-allowed border-red-500/70 text-red-400 bg-red-950/40 shadow-[0_0_14px_rgba(239,68,68,0.2)]"
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
                            <span className="text-[8px] text-red-400 uppercase tracking-wider font-bold sm:whitespace-nowrap">
                              Disponibil în curând
                            </span>
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
          </div>

          <div className="border-t border-white/10 shrink-0 bg-novra-surface pt-4 mt-4 sticky bottom-0">
            <div className="mb-3">
              <span className="text-[9px] uppercase tracking-widest text-gray-500 block font-medium">Preț Final</span>
              <span className="text-2xl font-bold text-white tracking-tight">
                {isBundleProduct(product.category)
                  ? product.basePrice.toFixed(2)
                  : (product.basePrice + product.modifiers[activeOptionIdx]).toFixed(2)}{" "}
                RON
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={() => onAddToCart(product, activeOptionIdx)}
                disabled={isCurrentVariantUnavailable}
                className={`flex-1 flex items-center justify-center gap-2 bg-purple-600 text-white font-semibold px-6 py-3.5 rounded-xl text-xs uppercase tracking-wider transition-colors duration-200 shadow-xl touch-manipulation min-h-11 ${
                  isCurrentVariantUnavailable ? "opacity-50 cursor-not-allowed" : "hover:bg-purple-700 cursor-pointer active:bg-purple-800"
                }`}
              >
                <ShoppingBag size={15} />
                {addedFeedback ? "Adăugat în coș!" : "Adaugă în coș"}
              </button>
              {whatsAppUrl ? (
                <a
                  href={whatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex-1 flex items-center justify-center gap-2 bg-[#25D366] text-white font-semibold px-6 py-3.5 rounded-xl text-xs uppercase tracking-wider transition-colors duration-200 shadow-xl touch-manipulation min-h-11 ${
                    isCurrentVariantUnavailable ? "pointer-events-none opacity-50" : "hover:bg-[#20BA5C] cursor-pointer active:bg-[#1da851]"
                  }`}
                  aria-disabled={isCurrentVariantUnavailable}
                >
                  <FaWhatsapp size={16} />
                  WhatsApp
                </a>
              ) : (
                <span className="flex-1 flex items-center justify-center gap-2 bg-[#25D366]/50 text-white/70 font-semibold px-6 py-3.5 rounded-xl text-xs uppercase tracking-wider min-h-11 opacity-50">
                  <FaWhatsapp size={16} />
                  WhatsApp
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
