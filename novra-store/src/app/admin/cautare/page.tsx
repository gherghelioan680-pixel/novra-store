"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSearch from "@/components/admin/AdminSearch";
import CopyButton from "@/components/CopyButton";
import { requireAdmin } from "@/lib/auth";
import {
  searchOrdersFromApi,
  ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS,
  type Order,
} from "@/lib/orders";

export default function AdminCautarePage() {
  const admin = requireAdmin();
  const searchParams = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const [results, setResults] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (!query.trim()) return;

    let cancelled = false;
    const loadingTimer = window.setTimeout(() => {
      if (!cancelled) setLoading(true);
    }, 0);

    searchOrdersFromApi(query)
      .then((orders) => {
        if (cancelled) return;
        setResults(orders);
        setSearched(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      window.clearTimeout(loadingTimer);
    };
  }, [query]);

  const displayResults = query.trim() ? results : [];
  const displaySearched = query.trim() ? searched : false;

  if (!admin) return null;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString("ro-RO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div>
      <AdminHeader
        user={admin}
        title="Căutare"
        subtitle="Caută după cod comandă, ID comandă sau email client"
      />

      <AdminSearch />

      {loading && <p className="text-sm text-gray-500">Se caută...</p>}

      {displaySearched && !loading && displayResults.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-novra-card/30 py-16 text-center">
          <p className="text-gray-500">Niciun rezultat găsit</p>
        </div>
      )}

      {displayResults.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm text-gray-400">
            {displayResults.length} {displayResults.length === 1 ? "rezultat" : "rezultate"} pentru &ldquo;{query}&rdquo;
          </p>
          {displayResults.map((order) => (
            <div
              key={order.id}
              className="rounded-2xl border border-white/10 bg-novra-card/30 p-5 sm:p-6"
            >
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-lg border border-purple-500/30 bg-purple-600/10 px-2.5 py-1 font-mono text-sm text-purple-300">
                      {order.purchaseCode}
                    </span>
                    <CopyButton text={order.purchaseCode} label="Copiază cod" />
                  </div>
                  <p className="mt-2 font-mono text-xs text-gray-500">{order.id}</p>
                  <p className="mt-2 text-lg font-semibold text-white">{order.userName}</p>
                  <Link
                    href={`/admin/clienti/${encodeURIComponent(order.userEmail)}`}
                    className="text-sm text-purple-400 transition hover:text-purple-300"
                  >
                    {order.userEmail}
                  </Link>
                  <p className="text-xs text-gray-500 mt-1">{formatDate(order.createdAt)}</p>
                </div>
                <div className="flex flex-col items-start gap-2 sm:items-end">
                  <p className="text-xl font-bold text-purple-400">{order.total.toFixed(2)} RON</p>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ORDER_STATUS_COLORS[order.status]}`}
                  >
                    {ORDER_STATUS_LABELS[order.status]}
                  </span>
                  <Link
                    href={`/admin/comenzi#${order.id}`}
                    className="text-xs text-purple-400 transition hover:text-purple-300"
                  >
                    Vezi în comenzi →
                  </Link>
                </div>
              </div>

              <div className="rounded-xl border border-white/8 bg-novra-bg/30 p-4">
                <p className="mb-2 text-[10px] uppercase tracking-widest text-gray-500">Produse</p>
                <ul className="space-y-1 text-sm text-gray-300">
                  {order.items.map((item, i) => (
                    <li key={i} className="flex justify-between gap-4">
                      <span>
                        {item.title} ({item.variantLabel}) ×{item.quantity}
                      </span>
                      <span className="shrink-0 text-white">
                        {(item.unitPrice * item.quantity).toFixed(2)} RON
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
