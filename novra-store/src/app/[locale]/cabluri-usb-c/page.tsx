"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Zap, ShieldCheck, Cpu, Layers, ArrowLeft, Check, ShoppingBag, Lock } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useCart } from "@/context/CartContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { buildWhatsAppUrl } from "@/lib/store";

// Date detaliate pentru gama de cabluri USB-C
const usbProducts = [
  {
    id: "usb-c-100w",
    title: "NOVRA UltraCharge 100W",
    subtitle: "USB-C to USB-C Premium Cable",
    basePrice: 79.99,
    imageSrc: "/cablu.png",
    tag: "Cel mai popular",
    description: "Cablu de înaltă performanță echipat cu cip inteligent E-Mark. Ideal pentru MacBook Pro, laptopuri, iPad-uri și smartphone-uri de ultimă generație care necesită Power Delivery masiv.",
    specs: {
      power: "100W Power Delivery (20V/5A)",
      speed: "480 Mbps Sincronizare Date",
      material: "Nylon Balistic Împletit + Aliaj Aluminiu",
      chip: "E-Mark Smart Chip Integrat",
    },
    lengths: [
      { label: "1M", priceModifier: 0 },
      { label: "2M", priceModifier: 0 },
    ]
  },
  {
    id: "usb-c-pro-240w",
    title: "NOVRA HyperPower 240W",
    subtitle: "Next-Gen PD 3.1 USB-C Cable",
    basePrice: 79.99,
    imageSrc: "/cablu.png",
    tag: "Performanță Extremă",
    description: "Pregătit pentru viitor. Suportă noul standard USB Power Delivery 3.1 de până la 240W. Creat special pentru stații de lucru grafice și cele mai gurande laptopuri de gaming.",
    specs: {
      power: "240W Extended Power Range (48V/5A)",
      speed: "480 Mbps Sincronizare Date",
      material: "Kevlar Core + Înveliș Dublu Împletit",
      chip: "PD 3.1 E-Mark Pro Chip",
    },
    lengths: [
      { label: "1M", priceModifier: 0 },
      { label: "2M", priceModifier: 0 },
    ]
  },
  {
    id: "usb-a-c-100w",
    title: "NOVRA Hybrid 100W",
    subtitle: "USB-A to USB-C Fast Charge",
    basePrice: 79.99,
    imageSrc: "/cablu.png",
    tag: "Versatilitate Maximă",
    description: "Conexiunea perfectă între încărcătoarele clasice USB-A și dispozitivele moderne USB-C. Suportă protocoale de încărcare rapidă Quick Charge și SuperCharge.",
    specs: {
      power: "100W Max (Compatibilitate Multi-Protocol)",
      speed: "480 Mbps Sincronizare Date",
      material: "Nylon împletit de înaltă densitate",
      chip: "Cip inteligent de reglare a tensiunii",
    },
    lengths: [
      { label: "1M", priceModifier: 0 },
      { label: "2M", priceModifier: 0 },
    ]
  }
];

const USB_C_CABLE_IDS = new Set(["usb-c-100w", "usb-c-pro-240w", "usb-a-c-100w"]);

const isUsbCCable = (productId: string) => USB_C_CABLE_IDS.has(productId);

const isLockedVariant = (productId: string, optionIndex: number) =>
  isUsbCCable(productId) && optionIndex >= 1;

export default function CabluriUsbC() {
  const { addItem } = useCart();
  const { whatsappNumber } = useSiteSettings();
  // Păstrăm starea pentru lungimea selectată la fiecare produs
  const [selectedLengths, setSelectedLengths] = useState<{ [key: string]: number }>({
    "usb-c-100w": 0,
    "usb-c-pro-240w": 0,
    "usb-a-c-100w": 0,
  });
  const [shakingProductId, setShakingProductId] = useState<string | null>(null);
  const [addedProductId, setAddedProductId] = useState<string | null>(null);

  const handleLengthChange = (productId: string, index: number) => {
    if (isLockedVariant(productId, index)) return;
    setSelectedLengths((prev) => ({ ...prev, [productId]: index }));
    if (isUsbCCable(productId) && index === 0) {
      setShakingProductId(productId);
      window.setTimeout(() => setShakingProductId(null), 400);
    }
  };

  const handleOrder = (product: typeof usbProducts[0]) => {
    const lengthIndex = selectedLengths[product.id] || 0;
    if (isLockedVariant(product.id, lengthIndex)) return;
    const chosenLength = product.lengths[lengthIndex];
    const finalPrice = (product.basePrice + chosenLength.priceModifier).toFixed(2);
    
    const message = `Salut echipa NOVRA! Aș dori să comand:\n\n- Produs: ${product.title}\n- Tip: ${product.subtitle}\n- Lungime: ${chosenLength.label}\n- Preț: ${finalPrice} RON`;
    
    window.open(buildWhatsAppUrl(whatsappNumber, message), "_blank");
  };

  const handleAddToCart = (product: typeof usbProducts[0]) => {
    const lengthIndex = selectedLengths[product.id] || 0;
    if (isLockedVariant(product.id, lengthIndex)) return;
    const chosenLength = product.lengths[lengthIndex];
    addItem({
      productId: product.id,
      title: product.title,
      variantLabel: chosenLength.label,
      unitPrice: product.basePrice + chosenLength.priceModifier,
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

        {/* Hero-ul Paginii de Categorie */}
        <div className="relative border-b border-white/10 pb-16 mb-20 overflow-hidden">
          <div className="absolute top-10 right-10 w-72 h-72 bg-purple-600/10 blur-[100px] rounded-full pointer-events-none"></div>
          <div className="max-w-3xl">
            <span className="text-purple-500 text-xs font-semibold tracking-[0.3em] uppercase block mb-3">Colecția Tehnologică</span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold tracking-tighter mb-6">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-600">Cabluri</span> High-End
            </h1>
            <p className="text-gray-400 text-lg font-light leading-relaxed">
              Standardul suprem în materie de alimentare și transfer de date. Proiectate cu materiale balistice, conectori ranforsați și cipuri inteligente de protecție pentru dispozitivele tale de lux.
            </p>
          </div>
        </div>

        {/* Grid-ul de Produse Detaliate */}
        <div className="space-y-24">
          {usbProducts.map((product, idx) => {
            const currentLengthIdx = selectedLengths[product.id] || 0;
            const currentLength = product.lengths[currentLengthIdx];
            const currentPrice = (product.basePrice + currentLength.priceModifier).toFixed(2);
            const isVariantUnavailable = isLockedVariant(product.id, currentLengthIdx);

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
                {/* Zona Vizuală Produs */}
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

                {/* Zona de Configurare și Specificații */}
                <div className="flex-1 w-full flex flex-col justify-between">
                  <div>
                    <h2 className="text-3xl font-bold tracking-tight text-white">{product.title}</h2>
                    <h3 className="text-sm text-purple-500 font-medium tracking-wide uppercase mt-1 mb-4">{product.subtitle}</h3>
                    <p className="text-gray-400 text-sm font-light leading-relaxed mb-6">{product.description}</p>

                    {/* Specificații sub formă de mini-grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-novra-card/40 border border-white/8 p-4 rounded-2xl mb-6 text-xs">
                      <div className="flex items-center gap-2.5 text-gray-300">
                        <Zap size={16} className="text-purple-500 shrink-0" />
                        <span><strong>Putere:</strong> {product.specs.power}</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-gray-300">
                        <Layers size={16} className="text-purple-500 shrink-0" />
                        <span><strong>Sincronizare:</strong> {product.specs.speed}</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-gray-300">
                        <Cpu size={16} className="text-purple-500 shrink-0" />
                        <span><strong>Protecție:</strong> {product.specs.chip}</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-gray-300">
                        <ShieldCheck size={16} className="text-purple-500 shrink-0" />
                        <span><strong>Înveliș:</strong> {product.specs.material}</span>
                      </div>
                    </div>

                    {/* Selector interactiv de lungime */}
                    <div className="mb-8">
                      <span className="text-[10px] uppercase tracking-widest text-gray-500 block mb-3 font-semibold">Selectează lungimea</span>
                      <div className="flex flex-wrap gap-3">
                        {product.lengths.map((len, lIdx) => {
                          const locked = isLockedVariant(product.id, lIdx);
                          const selected = currentLengthIdx === lIdx;

                          return (
                            <button
                              key={len.label}
                              type="button"
                              disabled={locked}
                              onClick={() => handleLengthChange(product.id, lIdx)}
                              className={`min-h-11 px-4 py-2 rounded-xl text-xs font-medium border transition-colors duration-300 flex items-center gap-2 touch-manipulation ${
                                shakingProductId === product.id && lIdx === 0 ? "animate-[shake_0.4s_ease-in-out]" : ""
                              } ${
                                locked
                                  ? "cursor-not-allowed border-red-500/70 text-red-400 bg-red-950/40 shadow-[0_0_14px_rgba(239,68,68,0.2)]"
                                  : selected
                                    ? "bg-white text-black border-white shadow-xl cursor-pointer"
                                    : "bg-transparent text-gray-400 border-white/10 hover:border-white/30 cursor-pointer"
                              }`}
                            >
                              {locked ? (
                                <>
                                  <Lock size={11} className="text-red-500 shrink-0" />
                                  <span className="text-red-400 font-semibold">{len.label}</span>
                                  <span className="text-[8px] text-red-400 uppercase tracking-wider whitespace-nowrap font-bold">
                                    Disponibil în curând
                                  </span>
                                </>
                              ) : (
                                <>
                                  {selected && <Check size={12} />}
                                  {len.label}
                                </>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Preț și Buton de Comandă */}
                  <div className="border-t border-white/10 pt-6">
                    <div className="mb-4">
                      <span className="text-[10px] uppercase tracking-widest text-gray-500 block font-medium">Preț final</span>
                      <span className="text-2xl font-bold text-white tracking-tight">{currentPrice} RON</span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleAddToCart(product)}
                        disabled={isVariantUnavailable}
                        className={`flex-1 flex items-center justify-center gap-2 bg-purple-600 text-white font-semibold px-6 py-3.5 rounded-xl text-sm transition-all duration-300 shadow-xl min-h-11 touch-manipulation ${
                          isVariantUnavailable
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:bg-purple-700 cursor-pointer"
                        }`}
                      >
                        <ShoppingBag size={16} />
                        {addedProductId === product.id ? "Adăugat în coș!" : "Adaugă în coș"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOrder(product)}
                        disabled={isVariantUnavailable}
                        className={`flex-1 flex items-center justify-center gap-2 bg-[#25D366] text-white font-semibold px-6 py-3.5 rounded-xl text-sm transition-all duration-300 shadow-xl min-h-11 touch-manipulation ${
                          isVariantUnavailable
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:bg-[#20BA5C] cursor-pointer"
                        }`}
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