"use client";

import { useEffect, useState } from "react";
import { Ticket, Copy, Check } from "lucide-react";
import { createStoreRefreshEffect } from "@/lib/store";
import { apiFetch } from "@/lib/api-client";

type UserCoupon = {
  code: string;
  type: "percent" | "fixed";
  value: number;
  valueLabel: string;
  applyToProducts: boolean;
  freeShipping: boolean;
  source: string;
  createdAt: string;
  expiresAt?: string;
  status: "active" | "used" | "expired";
  usedAt?: string;
};

const STATUS_LABELS: Record<UserCoupon["status"], string> = {
  active: "Activ",
  used: "Folosit",
  expired: "Expirat",
};

const STATUS_COLORS: Record<UserCoupon["status"], string> = {
  active: "bg-emerald-500/15 text-emerald-300",
  used: "bg-gray-500/15 text-gray-400",
  expired: "bg-red-500/15 text-red-300",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ro-RO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function CouponsView() {
  const [coupons, setCoupons] = useState<UserCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    const refresh = async () => {
      const data = await apiFetch<{ coupons: UserCoupon[] }>("/api/store/coupons");
      setCoupons(data?.coupons ?? []);
      setLoading(false);
    };
    return createStoreRefreshEffect(refresh, { scopes: ["discountCodes"] });
  }, []);

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      /* ignore */
    }
  };

  const activeCoupons = coupons.filter((c) => c.status === "active");

  return (
    <div>
      <h2 className="mb-2 text-xl font-semibold text-white">Cupoanele mele</h2>
      <p className="mb-6 text-sm text-gray-400">
        Codurile tale de reducere. Aplică un cod activ la checkout.
      </p>

      {loading ? (
        <p className="text-sm text-gray-500">Se încarcă...</p>
      ) : coupons.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-novra-card/30 py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-purple-600/20">
            <Ticket className="h-7 w-7 text-purple-400" />
          </div>
          <p className="text-lg font-medium text-gray-300">Niciun cupon disponibil</p>
          <p className="mt-1 max-w-sm text-sm text-gray-500">
            Abonează-te la newsletter pentru a primi un cod de reducere exclusiv.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {activeCoupons.length > 0 && (
            <p className="text-xs uppercase tracking-widest text-emerald-400">
              {activeCoupons.length} cupon{activeCoupons.length === 1 ? "" : "e"} active
            </p>
          )}
          {coupons.map((coupon) => (
            <div
              key={coupon.code}
              className="rounded-xl border border-white/10 bg-novra-card/30 p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-lg font-semibold text-purple-300">
                      {coupon.code}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(coupon.code)}
                      className="rounded-lg p-1.5 text-gray-500 hover:bg-white/5 hover:text-purple-300"
                      aria-label="Copiază cod"
                    >
                      {copiedCode === coupon.code ? (
                        <Check size={14} className="text-emerald-400" />
                      ) : (
                        <Copy size={14} />
                      )}
                    </button>
                  </div>
                  <p className="mt-1 text-sm text-gray-400">
                    {coupon.valueLabel} reducere
                    {coupon.freeShipping && " · Livrare gratuită"}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {coupon.source === "newsletter" ? "Newsletter" : "Admin"} · Creat{" "}
                    {formatDate(coupon.createdAt)}
                    {coupon.expiresAt && ` · Expiră ${formatDate(coupon.expiresAt)}`}
                  </p>
                </div>
                <span
                  className={`self-start rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLORS[coupon.status]}`}
                >
                  {STATUS_LABELS[coupon.status]}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
