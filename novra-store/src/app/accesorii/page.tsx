"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Zap, ShieldCheck, Cpu, Layers, ArrowLeft, Check, ShoppingBag } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BundleProductImages from "@/components/produse/BundleProductImages";
import { useCart } from "@/context/CartContext";
import {
  BUNDLE_COLORS,
  ADAPTER_COLOR_STYLES,
  DEFAULT_BUNDLE_SELECTIONS,
  getAdapterColorImage,
  getBundleVariantLabel,
  getProductsByCategory,
  type CatalogProduct,
} from "@/lib/catalog";
import { getWhatsAppNumber } from "@/lib/site-settings";
import { buildWhatsAppUrl as buildWhatsAppLink } from "@/lib/store";

export default function Accesorii() {
  const { addItem } = useCart();
  const accessoryProducts = getProductsByCategory("accesorii");
  const [colorSelections, setColorSelections] = useState(DEFAULT_BUNDLE_SELECTIONS);
  const [addedProductId, setAddedProductId] = useState<string | null>(null);

  const getSelection = (productId: string) =>
    colorSelections[productId] ?? { adapterIdx: 0, cableIdx: 0 };

  const handleColorChange = (productId: string, type: "adapter" | "cable", colorIdx: number) => {
    setColorSelections((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [type === "adapter" ? "adapterIdx" : "cableIdx"]: colorIdx,
      },
    }));
  };

  const handleOrder = (product: CatalogProduct) => {
    const { adapterIdx, cableIdx } = getSelection(product.id);
    const variantLabel = getBundleVariantLabel(adapterIdx, cableIdx);
    const finalPrice = product.basePrice.toFixed(2);

    const message = `Salut echipa NOVRA! Aș dori să comand din gama Cablu + Adaptor:\n\n- Produs: ${product.title}\n- Tip: ${product.subtitle}\n- Configurație: ${variantLabel}\n- Preț: ${finalPrice} RON`;

    const url = buildWhatsAppLink(getWhatsAppNumber(), message);
    if (url) window.open(url, "_blank");
  };

  const handleAddToCart = (product: CatalogProduct) => {
    const { adapterIdx, cableIdx } = getSelection(product.id);
    addItem({
      productId: product.id,
      title: product.title,
      variantLabel: getBundleVariantLabel(adapterIdx, cableIdx),
      unitPrice: product.basePrice,
      imageSrc: getAdapterColorImage(adapterIdx),
    });
    setAddedProductId(product.id);
    window.setTimeout(() => setAddedProductId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-novra-bg text-white selection:bg-purple-500/30">
      <Navbar />

      <main className="pb-page px-4 sm:px-6 md:px-12 max-w-7xl mx-auto">
        {/* Link Înapoi */}
        <Link href="/#produse" className="inline-flex items-center gap-2 text-xs text-gray-500 hover:text-purple-400 uppercase tracking-widest mb-8 transition-colors group">
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Înapoi la catalog
        </Link>

        {/* Hero Categorie */}
        <div className="relative border-b border-white/10 pb-16 mb-20 overflow-hidden">
          <div className="absolute top-10 right-10 w-72 h-72 bg-purple-600/10 blur-[100px] rounded-full pointer-events-none"></div>
          <div className="max-w-3xl">
            <span className="text-purple-500 text-xs font-semibold tracking-[0.3em] uppercase block mb-3">Ecosistemul Hardware</span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold tracking-tighter mb-6">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-600">Cablu + Adaptor</span> de Înaltă Găsire
            </h1>
            <p className="text-gray-400 text-lg font-light leading-relaxed">
              Completează-ți arsenalul tehnologic. Încărcătoare compacte de rețea și adaptoare auto proiectate din materiale de top, menite să livreze energie curată, eficientă și sigură cablurilor tale NOVRA.
            </p>
          </div>
        </div>

        {/* Catalog Produse */}
        <div className="space-y-24">
          {accessoryProducts.map((product, idx) => {
            const selection = getSelection(product.id);
            const currentPrice = product.basePrice.toFixed(2);

            return (
              <motion.div
                key={product.id}
                initial={false}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                viewport={{ once: true }}
                className={`flex flex-col lg:flex-row items-center gap-12 lg:gap-16 border-b border-white/8 pb-20 last:border-0 ${
                  idx % 2 === 1 ? "lg:flex-row-reverse" : ""
                }`}
              >
                {/* Imagine Produs */}
                <div className="flex-1 w-full bg-gradient-to-br from-purple-500/8 to-transparent border border-white/8 rounded-3xl relative overflow-hidden aspect-square sm:aspect-[4/5] lg:aspect-auto lg:h-[400px] group">
                  <span className="absolute top-4 left-4 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] uppercase tracking-widest px-3 py-1 rounded-full font-medium z-10">
                    {product.tag}
                  </span>

                  <div className="absolute inset-0 bg-purple-500/0 group-hover:bg-purple-500/5 blur-xl transition-all duration-700 rounded-full scale-75 pointer-events-none" />

                  <div className="absolute inset-0 flex items-center justify-center p-3 sm:p-4">
                    <div className="relative h-full w-full min-h-0 transition-transform duration-700 group-hover:scale-[1.02]">
                      <BundleProductImages
                        productId={product.id}
                        adapterIdx={selection.adapterIdx}
                        cableIdx={selection.cableIdx}
                        imageClassName="object-contain object-center"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    </div>
                  </div>
                </div>

                {/* Configurator & Specificații */}
                <div className="flex-1 w-full flex flex-col justify-between">
                  <div>
                    <h2 className="text-3xl font-bold tracking-tight text-white">{product.title}</h2>
                    <h3 className="text-sm text-purple-500 font-medium tracking-wide uppercase mt-1 mb-4">{product.subtitle}</h3>
                    <p className="text-gray-400 text-sm font-light leading-relaxed mb-6">{product.description}</p>

                    {/* Specificații tehnice */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-novra-card/40 border border-white/8 p-4 rounded-2xl mb-6 text-xs">
                      <div className="flex items-center gap-2.5 text-gray-300">
                        <Zap size={16} className="text-purple-500 shrink-0" />
                        <span><strong>Performanță:</strong> {product.specs.power}</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-gray-300">
                        <Layers size={16} className="text-purple-500 shrink-0" />
                        <span><strong>Protocoale:</strong> {product.specs.speed}</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-gray-300">
                        <Cpu size={16} className="text-purple-500 shrink-0" />
                        <span><strong>Tehnologie:</strong> {product.specs.chip}</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-gray-300">
                        <ShieldCheck size={16} className="text-purple-500 shrink-0" />
                        <span><strong>Material:</strong> {product.specs.material}</span>
                      </div>
                    </div>

                    {/* Selectoare Culoare Adaptor + Cablu */}
                    <div className="space-y-5 mb-8">
                      {(["adapter", "cable"] as const).map((colorType) => {
                        const activeIdx = colorType === "adapter" ? selection.adapterIdx : selection.cableIdx;
                        const label = colorType === "adapter" ? "Culoare adaptor" : "Culoare cablu";

                        return (
                          <div key={colorType}>
                            <span className="text-[10px] uppercase tracking-widest text-gray-500 block mb-3 font-semibold">
                              {label}
                            </span>
                            <div className="flex flex-wrap gap-2.5">
                              {BUNDLE_COLORS.map((color, cIdx) => {
                                const colorStyle = ADAPTER_COLOR_STYLES[color];
                                const selected = activeIdx === cIdx;

                                return (
                                  <button
                                    key={`${product.id}-${colorType}-${color}`}
                                    type="button"
                                    onClick={() => handleColorChange(product.id, colorType, cIdx)}
                                    className={`min-h-11 px-3 py-2 rounded-xl text-xs font-medium border transition-all duration-300 flex items-center gap-2 cursor-pointer touch-manipulation ${
                                      selected
                                        ? `${colorStyle.selectedBg} ${colorStyle.border} ${colorStyle.text} shadow-lg font-semibold`
                                        : `${colorStyle.bg} ${colorStyle.border} ${colorStyle.text} hover:opacity-90`
                                    }`}
                                  >
                                    <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-md bg-black/20">
                                      <BundleProductImages
                                        productId={product.id}
                                        adapterIdx={colorType === "adapter" ? cIdx : selection.adapterIdx}
                                        cableIdx={colorType === "cable" ? cIdx : selection.cableIdx}
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
                      <p className="text-[10px] text-gray-500 font-light">
                        Combinație selectată:{" "}
                        <span className="text-purple-400 font-medium">
                          {getBundleVariantLabel(selection.adapterIdx, selection.cableIdx)}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Preț și Trimitere Comandă */}
                  <div className="border-t border-white/10 pt-6">
                    <div className="mb-4">
                      <span className="text-[10px] uppercase tracking-widest text-gray-500 block font-medium">Preț final</span>
                      <span className="text-2xl font-bold text-white tracking-tight">{currentPrice} RON</span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleAddToCart(product)}
                        className="flex-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-3.5 rounded-xl text-sm transition-all duration-300 shadow-xl cursor-pointer min-h-11 touch-manipulation"
                      >
                        <ShoppingBag size={16} />
                        {addedProductId === product.id ? "Adăugat în coș!" : "Adaugă în coș"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOrder(product)}
                        className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20BA5C] text-white font-semibold px-6 py-3.5 rounded-xl text-sm transition-all duration-300 shadow-xl cursor-pointer min-h-11 touch-manipulation"
                      >
                        <FaWhatsapp size={16} />
                        WhatsApp
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </main>

      <Footer />
    </div>
  );
}
