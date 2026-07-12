"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Minus, Plus, ShoppingBag, Trash2, ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useCart } from "@/context/CartContext";
import {
  getProductById,
  getProductStockQuantity,
  formatStockLabel,
  loadProductOverrides,
  validateCartStock,
} from "@/lib/catalog";
import { subscribeToStoreUpdates } from "@/lib/store";

function CartAddFromUrl() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addItem, hydrated } = useCart();
  const processedRef = useRef(false);

  useEffect(() => {
    if (!hydrated || processedRef.current) return;

    const add = searchParams.get("add");
    if (!add) return;

    processedRef.current = true;

    void (async () => {
      await loadProductOverrides();

      const variant = searchParams.get("variant") ?? "";
      const price = parseFloat(searchParams.get("price") ?? "0");
      const product = getProductById(add);

      if (product) {
        addItem({
          productId: add,
          title: product.title,
          variantLabel: variant || product.options[0],
          unitPrice: price > 0 ? price : product.basePrice,
          imageSrc: product.imageSrc,
        });
      }

      router.replace("/cos");
    })();
  }, [hydrated, searchParams, addItem, router]);

  return null;
}

function CosPageContent() {
  const { items, updateQuantity, removeItem, totalPrice, totalItems, hydrated } = useCart();
  const [, setStockTick] = useState(0);

  useEffect(() => {
    void loadProductOverrides();
    const unsubscribe = subscribeToStoreUpdates(() => {
      void loadProductOverrides().then(() => setStockTick((value) => value + 1));
    });
    return unsubscribe;
  }, []);

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-novra-bg text-white selection:bg-purple-500/30">
        <Navbar />
        <main className="pb-page px-4 sm:px-6 md:px-12 max-w-4xl mx-auto">
          <p className="text-gray-500 text-sm">Se încarcă coșul...</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-novra-bg text-white selection:bg-purple-500/30">
      <Navbar />

      <main className="pb-page px-4 sm:px-6 md:px-12 max-w-4xl mx-auto">
        <Link
          href="/produse"
          className="inline-flex items-center gap-2 text-xs text-gray-500 hover:text-purple-400 uppercase tracking-widest mb-8 transition-colors group touch-manipulation min-h-11"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          Continuă cumpărăturile
        </Link>

        <div className="border-b border-white/10 pb-10 mb-10">
          <span className="text-purple-500 text-xs font-semibold tracking-[0.3em] uppercase block mb-3">
            Coșul tău
          </span>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter">
            {totalItems > 0 ? `${totalItems} ${totalItems === 1 ? "produs" : "produse"}` : "Coș gol"}
          </h1>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-white/10 rounded-3xl">
            <ShoppingBag size={40} className="mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400 mb-6">Nu ai adăugat încă produse în coș.</p>
            <Link
              href="/produse"
              className="inline-flex items-center justify-center min-h-11 bg-purple-600 hover:bg-purple-700 text-white font-semibold px-8 py-3 rounded-xl text-sm transition-all touch-manipulation"
            >
              Vezi produsele
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-10">
              {items.map((item) => {
                const product = getProductById(item.productId);
                const available = product ? getProductStockQuantity(product) : 0;
                const totalForProduct = items
                  .filter((entry) => entry.productId === item.productId)
                  .reduce((sum, entry) => sum + entry.quantity, 0);
                const canIncrease = totalForProduct < available;

                return (
                <div
                  key={item.id}
                  className="flex gap-4 p-4 bg-novra-card/30 border border-white/8 rounded-2xl"
                >
                  <div className="relative w-20 h-20 shrink-0 bg-novra-card/40 rounded-xl flex items-center justify-center">
                    <Image
                      src={item.imageSrc}
                      alt={item.title}
                      fill
                      sizes="80px"
                      className="object-contain p-2"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white truncate">{item.title}</h3>
                    <p className="text-gray-500 text-xs mt-0.5">{item.variantLabel}</p>
                    <p className="text-purple-400 font-bold text-sm mt-2">
                      {item.unitPrice.toFixed(2)} RON
                    </p>
                    {product && (
                      <p className={`text-[11px] mt-1 ${available > 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {formatStockLabel(available)}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-end justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="min-w-11 min-h-11 flex items-center justify-center text-gray-500 hover:text-red-400 transition-colors touch-manipulation"
                      aria-label="Elimină produs"
                    >
                      <Trash2 size={16} />
                    </button>

                    <div className="flex items-center gap-1 bg-novra-elevated rounded-lg">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="min-w-11 min-h-11 flex items-center justify-center hover:text-purple-400 transition-colors touch-manipulation"
                        aria-label="Scade cantitatea"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={!canIncrease}
                        className="min-w-11 min-h-11 flex items-center justify-center hover:text-purple-400 transition-colors touch-manipulation disabled:opacity-40 disabled:cursor-not-allowed"
                        aria-label="Crește cantitatea"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
              })}
            </div>

            <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-gray-500 block font-medium">
                  Total
                </span>
                <span className="text-3xl font-bold text-white tracking-tight">
                  {totalPrice.toFixed(2)} RON
                </span>
              </div>

              <Link
                href="/checkout"
                className="w-full sm:w-auto text-center min-h-11 flex items-center justify-center bg-purple-600 hover:bg-purple-700 text-white font-semibold px-10 py-4 rounded-xl text-sm uppercase tracking-wider transition-all shadow-xl touch-manipulation"
              >
                Finalizează comanda
              </Link>
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function CosPage() {
  return (
    <>
      <Suspense fallback={null}>
        <CartAddFromUrl />
      </Suspense>
      <CosPageContent />
    </>
  );
}
