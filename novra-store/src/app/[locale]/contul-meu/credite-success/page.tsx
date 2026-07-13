"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { verifyCreditPurchaseSession } from "@/lib/credits";
import { refreshCurrentUserFromServer } from "@/lib/auth";

function CrediteSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [amount, setAmount] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      setMessage("Sesiune de plată invalidă.");
      return;
    }

    void verifyCreditPurchaseSession(sessionId).then(async (result) => {
      if (result.ok && result.credited) {
        setAmount(result.amount ?? null);
        setStatus("success");
        await refreshCurrentUserFromServer();
        return;
      }
      setStatus("error");
      setMessage(result.message ?? "Plata nu a putut fi confirmată.");
    });
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-novra-bg text-white selection:bg-purple-500/30">
      <Navbar />
      <main className="pb-page px-4 sm:px-6 md:px-12 max-w-2xl mx-auto text-center">
        {status === "loading" && (
          <>
            <Loader2 size={48} className="mx-auto text-purple-400 mb-6 animate-spin" />
            <h1 className="text-2xl font-bold mb-2">Se verifică plata...</h1>
            <p className="text-gray-400 text-sm">Creditele vor fi încărcate automat.</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle size={56} className="mx-auto text-green-500 mb-6" />
            <h1 className="text-4xl font-bold tracking-tighter mb-4">Plată reușită!</h1>
            <p className="text-gray-300 mb-6 leading-relaxed px-2">
              {amount
                ? `${amount} NovraCredits au fost adăugate în contul tău.`
                : "NovraCredits au fost adăugate în contul tău."}
            </p>
            <button
              type="button"
              onClick={() => router.push("/contul-meu?section=my-novra-credits")}
              className="min-h-11 bg-purple-600 hover:bg-purple-700 text-white font-semibold px-10 py-4 rounded-xl text-sm transition-all touch-manipulation mr-3"
            >
              Vezi soldul
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
            <p className="text-gray-400 mb-6 text-sm">{message}</p>
            <button
              type="button"
              onClick={() => router.push("/contul-meu?section=gift-cards")}
              className="min-h-11 bg-purple-600 hover:bg-purple-700 text-white font-semibold px-8 py-3 rounded-xl text-sm"
            >
              Înapoi la Gift Cards
            </button>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default function CrediteSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-novra-bg text-white flex items-center justify-center">
          <Loader2 size={32} className="animate-spin text-purple-400" />
        </div>
      }
    >
      <CrediteSuccessContent />
    </Suspense>
  );
}
