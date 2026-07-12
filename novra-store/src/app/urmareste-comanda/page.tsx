"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Package,
  Search,
  Truck,
  CheckCircle2,
  Clock3,
  XCircle,
  Loader2,
  ExternalLink,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

type TrackedOrder = {
  purchaseCode: string;
  status: string;
  statusLabel: string;
  createdAt: string;
  updatedAt: string;
  total: number;
  shipping: number;
  items: Array<{
    title: string;
    variantLabel: string;
    quantity: number;
    unitPrice: number;
  }>;
  awbTracking?: string;
  trackingUrl?: string;
  timeline: Array<{ status: string; label: string; at: string }>;
  paymentMethod: string;
  paymentStatus: string;
};

const STATUS_ICONS: Record<string, typeof Clock3> = {
  pending: Clock3,
  processing: Package,
  shipped: Truck,
  delivered: CheckCircle2,
  cancelled: XCircle,
};

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const initialCode = searchParams.get("code") ?? "";
  const [code, setCode] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<TrackedOrder | null>(null);

  const fetchOrder = async (searchCode: string) => {
    const trimmed = searchCode.trim().toUpperCase();
    if (!trimmed) {
      setError("Introdu codul comenzii.");
      return;
    }

    setLoading(true);
    setError("");
    setOrder(null);

    try {
      const response = await fetch(`/api/store/orders/track?code=${encodeURIComponent(trimmed)}`);
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Comanda nu a fost găsită.");
        return;
      }
      setOrder(data.order as TrackedOrder);
    } catch {
      setError("Nu am putut verifica comanda. Încearcă din nou.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialCode.trim()) return;
    void fetchOrder(initialCode);
  }, [initialCode]);

  const handleSearch = async (event?: React.FormEvent) => {
    event?.preventDefault();
    await fetchOrder(code);
  };

  return (
    <div className="min-h-screen bg-novra-bg text-white">
      <Navbar />
      <main className="pt-[var(--header-height,148px)] px-4 sm:px-8 pb-16">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Urmărește comanda</h1>
            <p className="mt-3 text-gray-400 text-sm sm:text-base">
              Introdu codul comenzii (ex: NV-120726-ABC123) pentru a vedea statusul și detaliile livrării.
            </p>
          </div>

          <form
            onSubmit={handleSearch}
            className="rounded-2xl border border-purple-500/20 bg-novra-card/40 p-5 sm:p-6 mb-8"
          >
            <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">
              Cod comandă
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="NV-DDMMYY-XXXXXX"
                className="flex-1 rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 font-mono text-sm outline-none focus:border-purple-500/50"
              />
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-6 py-3 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-60"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                Caută
              </button>
            </div>
            {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
          </form>

          {order && (
            <div className="space-y-6">
              <section className="rounded-2xl border border-white/10 bg-novra-card/30 p-5 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-gray-500">Cod comandă</p>
                    <p className="mt-1 font-mono text-xl text-purple-300">{order.purchaseCode}</p>
                  </div>
                  <div className="rounded-full bg-purple-600/15 px-4 py-2 text-sm font-medium text-purple-200">
                    {order.statusLabel}
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  <div className="rounded-xl border border-white/8 bg-novra-bg/30 p-3">
                    <p className="text-xs text-gray-500">Plată</p>
                    <p className="mt-1 text-white">{order.paymentMethod}</p>
                    <p className="text-xs text-gray-400">{order.paymentStatus}</p>
                  </div>
                  <div className="rounded-xl border border-white/8 bg-novra-bg/30 p-3">
                    <p className="text-xs text-gray-500">Total</p>
                    <p className="mt-1 text-white font-semibold">{order.total.toFixed(2)} RON</p>
                  </div>
                  <div className="rounded-xl border border-white/8 bg-novra-bg/30 p-3">
                    <p className="text-xs text-gray-500">Plasată la</p>
                    <p className="mt-1 text-white">
                      {new Date(order.createdAt).toLocaleString("ro-RO")}
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-white/10 bg-novra-card/30 p-5 sm:p-6">
                <h2 className="text-lg font-semibold mb-4">Produse comandate</h2>
                <ul className="space-y-2 text-sm text-gray-300">
                  {order.items.map((item, index) => (
                    <li key={index} className="flex justify-between gap-4">
                      <span>
                        {item.title} ({item.variantLabel}) ×{item.quantity}
                      </span>
                      <span className="text-white shrink-0">
                        {(item.unitPrice * item.quantity).toFixed(2)} RON
                      </span>
                    </li>
                  ))}
                </ul>
              </section>

              {order.awbTracking && (
                <section className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 sm:p-6">
                  <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                    <Truck size={18} className="text-emerald-400" />
                    AWB Fan Courier
                  </h2>
                  <p className="font-mono text-purple-200">{order.awbTracking}</p>
                  {order.trackingUrl && (
                    <a
                      href={order.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-700"
                    >
                      Urmărește coletul
                      <ExternalLink size={14} />
                    </a>
                  )}
                </section>
              )}

              <section className="rounded-2xl border border-white/10 bg-novra-card/30 p-5 sm:p-6">
                <h2 className="text-lg font-semibold mb-4">Istoric comandă</h2>
                <ol className="space-y-4">
                  {order.timeline.map((entry, index) => {
                    const Icon = STATUS_ICONS[entry.status] ?? Clock3;
                    return (
                      <li key={`${entry.status}-${index}`} className="flex gap-3">
                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-600/15 text-purple-300">
                          <Icon size={14} />
                        </span>
                        <div>
                          <p className="font-medium text-white">{entry.label}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(entry.at).toLocaleString("ro-RO")}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </section>

              <p className="text-center text-sm text-gray-500">
                Ai nevoie de ajutor?{" "}
                <Link href="/contact" className="text-purple-400 hover:text-purple-300">
                  Contactează-ne
                </Link>
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-novra-bg text-white flex items-center justify-center">
          <Loader2 className="animate-spin text-purple-400" />
        </div>
      }
    >
      <TrackOrderContent />
    </Suspense>
  );
}
