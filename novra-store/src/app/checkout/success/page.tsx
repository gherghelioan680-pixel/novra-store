"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CopyButton from "@/components/CopyButton";
import type { Order } from "@/lib/orders";
import { normalizeOrder } from "@/lib/orders";
import { useCart } from "@/context/CartContext";

function CheckoutSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { clearCart } = useCart();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      return;
    }

    void fetch(`/api/store/stripe/verify-session?session_id=${encodeURIComponent(sessionId)}`)
      .then(async (res) => {
        const data = (await res.json()) as {
          ok?: boolean;
          paid?: boolean;
          order?: Partial<Order>;
          purchaseCode?: string;
          message?: string;
        };
        if (data.ok && data.paid) {
          if (data.order) setOrder(normalizeOrder(data.order));
          setStatus("success");
          return;
        }
        setStatus("error");
      })
      .catch(() => setStatus("error"));
  }, [sessionId]);

  useEffect(() => {
    if (status === "success") {
      clearCart();
    }
  }, [status, clearCart]);

  return (
    <div className="min-h-screen bg-novra-bg text-white selection:bg-purple-500/30">
      <Navbar />
      <main className="pb-page px-4 sm:px-6 md:px-12 max-w-2xl mx-auto text-center">
        {status === "loading" && (
          <>
            <Loader2 size={48} className="mx-auto text-purple-400 mb-6 animate-spin" />
            <h1 className="text-2xl font-bold mb-2">Se verifică plata...</h1>
            <p className="text-gray-400 text-sm">Te rugăm să aștepți câteva secunde.</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle size={56} className="mx-auto text-green-500 mb-6" />
            <h1 className="text-4xl font-bold tracking-tighter mb-4">Plată reușită!</h1>
            <p className="text-gray-300 mb-4 leading-relaxed px-2">
              Mulțumim! Plata cu cardul a fost procesată cu succes. Vei primi un email de confirmare cu detaliile comenzii.
            </p>
            {order?.purchaseCode && (
              <div className="mb-8 inline-flex flex-col items-center gap-2 rounded-xl border border-purple-500/30 bg-purple-600/10 px-6 py-4">
                <p className="text-xs uppercase tracking-widest text-gray-400">Cod comandă</p>
                <p className="font-mono text-lg font-semibold text-purple-300">{order.purchaseCode}</p>
                <CopyButton text={order.purchaseCode} label="Copiază cod" />
              </div>
            )}
            {!order?.purchaseCode && (
              <p className="text-gray-400 text-sm mb-8">
                Plata a fost procesată. Dacă nu primești emailul de confirmare în câteva minute, contactează-ne.
              </p>
            )}
            <button
              type="button"
              onClick={() => router.push("/contul-meu")}
              className="min-h-11 bg-purple-600 hover:bg-purple-700 text-white font-semibold px-10 py-4 rounded-xl text-sm transition-all touch-manipulation mr-3"
            >
              Comenzile mele
            </button>
            <button
              type="button"
              onClick={() => router.push("/produse")}
              className="min-h-11 border border-white/10 hover:bg-white/5 text-white font-semibold px-10 py-4 rounded-xl text-sm transition-all touch-manipulation"
            >
              Continuă cumpărăturile
            </button>
          </>
        )}

        {status === "error" && (
          <>
            <h1 className="text-2xl font-bold mb-4 text-red-300">Plata nu a putut fi confirmată</h1>
            <p className="text-gray-400 mb-6 text-sm">
              Dacă ai fost taxat, contactează-ne pe WhatsApp cu dovada plății.
            </p>
            <button
              type="button"
              onClick={() => router.push("/checkout")}
              className="min-h-11 bg-purple-600 hover:bg-purple-700 text-white font-semibold px-8 py-3 rounded-xl text-sm"
            >
              Înapoi la checkout
            </button>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-novra-bg text-white flex items-center justify-center">
          <Loader2 size={32} className="animate-spin text-purple-400" />
        </div>
      }
    >
      <CheckoutSuccessContent />
    </Suspense>
  );
}
