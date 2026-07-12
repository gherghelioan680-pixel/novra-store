"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Zap, ShieldCheck, Cpu, Layers, ArrowLeft, Check, ShoppingBag } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useCart } from "@/context/CartContext";

const ADAPTER_COLOR_STYLES: Record<string, { text: string; border: string; bg: string; selectedBg: string }> = {
  Violet: { text: "text-violet-400", border: "border-violet-400/60", bg: "bg-violet-500/10", selectedBg: "bg-violet-500/20" },
  Blue: { text: "text-blue-400", border: "border-blue-400/60", bg: "bg-blue-500/10", selectedBg: "bg-blue-500/20" },
  Roz: { text: "text-pink-400", border: "border-pink-400/60", bg: "bg-pink-500/10", selectedBg: "bg-pink-500/20" },
};

// Date detaliate pentru gama de adaptoare Lightning
const lightningProducts = [
  {
    id: "usb-c-lightning-pd",
    title: "NOVRA AppleCharge Pro",
    subtitle: "USB-C to Lightning Fast Charge",
    basePrice: 99.99,
    imageSrc: "/cablu.png",
    tag: "Recomandat iPhone",
    description: "Cablu premium de mare viteză, complet compatibil cu standardul Apple Power Delivery. Permite încărcarea rapidă a iPhone-ului de la 0% la 50% în doar 30 de minute folosind un adaptor PD.",
    specs: {
      power: "27W Max Power Delivery Fast Charge",
      speed: "480 Mbps Sincronizare de mare viteză",
      material: "Nylon împletit în 48 de straturi + Conectori Zinc",
      chip: "Cip Smart iChip pentru protecția bateriei iOS",
    },
    colors: [{ label: "Violet", priceModifier: 0 }],
  },
  {
    id: "usb-a-lightning-classic",
    title: "NOVRA Lightning Classic",
    subtitle: "USB-A to Lightning Durable Cable",
    basePrice: 99.99,
    imageSrc: "/cablu.png",
    tag: "Ultra-Rezistent",
    description: "Conexiunea clasică, optimizată pentru durabilitate extremă. Structura internă ranforsată previne ruperea la îmbinări, fiind perfect pentru utilizarea zilnică acasă sau în mașină prin Apple CarPlay.",
    specs: {
      power: "12W / 2.4A Standard Charge",
      speed: "480 Mbps Transfer stabil de date",
      material: "TPE Flexibil + Ranforsare cu fibră aramidică",
      chip: "Cip inteligent anti-supraîncălzire",
    },
    colors: [{ label: "Blue", priceModifier: 0 }],
  },
  {
    id: "usb-c-lightning-flex",
    title: "NOVRA FlexLink Nova",
    subtitle: "USB-C to Lightning MagSafe Ready",
    basePrice: 99.99,
    imageSrc: "/cablu.png",
    tag: "Design Compact",
    description: "Adaptor premium ultra-subțire, optimizat pentru încărcare wireless MagSafe și Power Delivery simultan. Conectori din aliaj anodizat și cablu flexibil din silicon medical pentru utilizare zilnică fără încurcare.",
    specs: {
      power: "20W Max PD + Compatibilitate MagSafe",
      speed: "480 Mbps Sincronizare stabilă de date",
      material: "Silicon Premium + Conectori Aluminiu Anodizat",
      chip: "Cip MFi certificat cu protecție termică activă",
    },
    colors: [{ label: "Roz", priceModifier: 0 }],
  },
];

export default function CabluriLightning() {
  const { addItem } = useCart();
  const [selectedColors, setSelectedColors] = useState<{ [key: string]: number }>({
    "usb-c-lightning-pd": 0,
    "usb-a-lightning-classic": 0,
    "usb-c-lightning-flex": 0,
  });
  const [addedProductId, setAddedProductId] = useState<string | null>(null);

  const handleColorChange = (productId: string, index: number) => {
    setSelectedColors((prev) => ({ ...prev, [productId]: index }));
  };

  const handleOrder = (product: typeof lightningProducts[0]) => {
    const colorIndex = selectedColors[product.id] || 0;
    const chosenColor = product.colors[colorIndex];
    const finalPrice = (product.basePrice + chosenColor.priceModifier).toFixed(2);

    const message = `Salut echipa NOVRA! Aș dori să comand din gama Adaptoare:\n\n- Produs: ${product.title}\n- Tip: ${product.subtitle}\n- Culoare: ${chosenColor.label}\n- Preț: ${finalPrice} RON`;

    window.open(`https://wa.me/407XXXXXXXXX?text=${encodeURIComponent(message)}`, "_blank");
  };

  const handleAddToCart = (product: typeof lightningProducts[0]) => {
    const colorIndex = selectedColors[product.id] || 0;
    const chosenColor = product.colors[colorIndex];
    addItem({
      productId: product.id,
      title: product.title,
      variantLabel: chosenColor.label,
      unitPrice: product.basePrice + chosenColor.priceModifier,
      imageSrc: product.imageSrc,
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
            <span className="text-purple-500 text-xs font-semibold tracking-[0.3em] uppercase block mb-3">Compatibilitate Apple</span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold tracking-tighter mb-6">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-600">Adaptoare</span> Premium
            </h1>
            <p className="text-gray-400 text-lg font-light leading-relaxed">
              Alimentare sigură și stabilă pentru dispozitivele tale iOS. Proiectate pentru a preveni erorile de accesorii necompatibile, oferind în același timp rezistența structurală pe care cablurile standard nu o au.
            </p>
          </div>
        </div>

        {/* Catalog Produse */}
        <div className="space-y-24">
          {lightningProducts.map((product, idx) => {
            const currentColorIdx = selectedColors[product.id] || 0;
            const currentColor = product.colors[currentColorIdx];
            const currentPrice = (product.basePrice + currentColor.priceModifier).toFixed(2);
            const colorStyle = ADAPTER_COLOR_STYLES[currentColor.label];

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
                <div className="flex-1 w-full bg-gradient-to-br from-purple-500/8 to-transparent border border-white/8 rounded-3xl p-6 sm:p-8 relative flex items-center justify-center overflow-hidden h-[280px] sm:h-[340px] lg:h-[400px] group">
                  <span className="absolute top-4 left-4 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] uppercase tracking-widest px-3 py-1 rounded-full font-medium z-10">
                    {product.tag}
                  </span>

                  <div className="absolute inset-0 bg-purple-500/0 group-hover:bg-purple-500/5 blur-xl transition-all duration-700 rounded-full scale-75"></div>

                  <div className="relative w-72 h-72 transition-transform duration-700 group-hover:scale-105">
                    <Image
                      src={product.imageSrc}
                      alt={product.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-contain"
                    />
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
                        <span><strong>Energie:</strong> {product.specs.power}</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-gray-300">
                        <Layers size={16} className="text-purple-500 shrink-0" />
                        <span><strong>Data Rate:</strong> {product.specs.speed}</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-gray-300">
                        <Cpu size={16} className="text-purple-500 shrink-0" />
                        <span><strong>Arhitectură:</strong> {product.specs.chip}</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-gray-300">
                        <ShieldCheck size={16} className="text-purple-500 shrink-0" />
                        <span><strong>Finisaj:</strong> {product.specs.material}</span>
                      </div>
                    </div>

                    {/* Selector Culoare */}
                    <div className="mb-8">
                      <span className="text-[10px] uppercase tracking-widest text-gray-500 block mb-3 font-semibold">Alege culoarea</span>
                      <div className="flex gap-3">
                        {product.colors.map((color, cIdx) => {
                          const style = ADAPTER_COLOR_STYLES[color.label];
                          const selected = currentColorIdx === cIdx;

                          return (
                            <button
                              key={color.label}
                              type="button"
                              onClick={() => handleColorChange(product.id, cIdx)}
                              className={`min-h-11 px-4 py-2 rounded-xl text-xs font-medium border transition-all duration-300 flex items-center gap-2 cursor-pointer touch-manipulation ${
                                selected
                                  ? `${style.selectedBg} ${style.border} ${style.text} shadow-lg font-semibold`
                                  : `${style.bg} ${style.border} ${style.text} hover:opacity-90`
                              }`}
                            >
                              {selected && <Check size={12} className={style.text} />}
                              <span className={style.text}>{color.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Preț și Trimitere Comandă */}
                  <div className="border-t border-white/10 pt-6">
                    <div className="mb-4">
                      <span className="text-[10px] uppercase tracking-widest text-gray-500 block font-medium">Preț final</span>
                      <span className="text-2xl font-bold text-white tracking-tight">{currentPrice} RON</span>
                      {colorStyle && (
                        <span className={`text-xs font-medium ml-2 ${colorStyle.text}`}>{currentColor.label}</span>
                      )}
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
