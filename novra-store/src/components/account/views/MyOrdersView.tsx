"use client";

import { useEffect, useState } from "react";
import { ChevronDown, X, Package, MapPin, CreditCard, Truck, ExternalLink } from "lucide-react";
import CopyButton from "@/components/CopyButton";
import {
  getOrdersForUserFromApi,
  ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS,
  type Order,
  type OrderStatus,
} from "@/lib/orders";
import { buildFanCourierTrackingUrl } from "@/lib/tracking";
import { createStoreRefreshEffect } from "@/lib/store";
import type { OrderStatusFilter } from "../types";
import EmptyOrdersState from "../EmptyOrdersState";

type MyOrdersViewProps = {
  userEmail: string;
};

export default function MyOrdersView({ userEmail }: MyOrdersViewProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<OrderStatusFilter>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const refreshOrders = async () => {
    const data = await getOrdersForUserFromApi(userEmail);
    setOrders(data);
    setLoading(false);
  };

  useEffect(() => {
    return createStoreRefreshEffect(refreshOrders, { scopes: ["orders"] });
  }, [userEmail]);

  const filteredOrders = orders.filter((order) => {
    if (statusFilter === "all") return true;
    return order.status === statusFilter;
  });

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("ro-RO", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold text-white">Comenzile mele</h2>
        <FilterDropdown
          label="Toate"
          value={statusFilter}
          options={[
            { value: "all", label: "Toate" },
            { value: "pending", label: "În așteptare" },
            { value: "processing", label: "În procesare" },
            { value: "shipped", label: "Expediată" },
            { value: "cancelled", label: "Anulată" },
          ]}
          onChange={(v) => setStatusFilter(v as OrderStatusFilter)}
        />
      </div>

      <div className="rounded-xl border border-white/10 bg-novra-card/30">
        {loading ? (
          <p className="p-8 text-center text-sm text-gray-500">Se încarcă comenzile...</p>
        ) : filteredOrders.length > 0 ? (
          <ul className="divide-y divide-white/10">
            {filteredOrders.map((order) => (
              <li key={order.id}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedOrder(order)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedOrder(order);
                    }
                  }}
                  className="w-full cursor-pointer p-4 text-left transition hover:bg-white/5 sm:p-5"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-mono text-xs text-purple-300">{order.purchaseCode}</p>
                        <CopyButton text={order.purchaseCode} label="Copiază" />
                      </div>
                      <p className="mt-1 font-mono text-[10px] text-gray-500">{order.id}</p>
                      <p className="mt-1 text-sm text-gray-400">{formatDate(order.createdAt)}</p>
                      <p className="mt-1 text-sm text-gray-300">
                        {order.items.length} {order.items.length === 1 ? "produs" : "produse"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ORDER_STATUS_COLORS[order.status]}`}
                      >
                        {ORDER_STATUS_LABELS[order.status]}
                      </span>
                      <span className="text-lg font-bold text-white">{order.total.toFixed(2)} RON</span>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyOrdersState shopHref="/produse" />
        )}
      </div>

      {selectedOrder && (
        <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </div>
  );
}

function OrderDetailModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleString("ro-RO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const timeline: { status: OrderStatus; label: string; active: boolean }[] = [
    { status: "pending", label: "În așteptare", active: true },
    { status: "processing", label: "În procesare", active: false },
    { status: "shipped", label: "Expediată", active: false },
    { status: "cancelled", label: "Anulată", active: false },
  ];

  const statusOrder: OrderStatus[] = ["pending", "processing", "shipped"];
  const currentIndex =
    order.status === "cancelled" ? -1 : statusOrder.indexOf(order.status);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-novra-card shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-white/10 bg-novra-card px-5 py-4">
          <h3 className="font-semibold text-white">Detalii comandă</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-5 p-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs text-gray-500">Cod comandă:</p>
              <p className="font-mono text-sm text-purple-300">{order.purchaseCode}</p>
              <CopyButton text={order.purchaseCode} label="Copiază cod" />
            </div>
            <p className="mt-2 font-mono text-xs text-gray-500">{order.id}</p>
            <p className="mt-1 text-sm text-gray-400">Plasată: {formatDateTime(order.createdAt)}</p>
            {order.updatedAt !== order.createdAt && (
              <p className="text-xs text-gray-500">Actualizată: {formatDateTime(order.updatedAt)}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Package size={16} className="text-purple-400" />
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ORDER_STATUS_COLORS[order.status]}`}
            >
              {ORDER_STATUS_LABELS[order.status]}
            </span>
          </div>

          {order.status !== "cancelled" && (
            <div className="flex items-center gap-2">
              {timeline.slice(0, 3).map((step, i) => (
                <div key={step.status} className="flex flex-1 items-center gap-1">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      i <= currentIndex ? "bg-purple-500" : "bg-white/20"
                    }`}
                  />
                  {i < 2 && (
                    <div
                      className={`h-0.5 flex-1 ${i < currentIndex ? "bg-purple-500" : "bg-white/10"}`}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="rounded-xl border border-white/8 bg-novra-bg/30 p-4">
            <p className="mb-2 text-[10px] uppercase tracking-widest text-gray-500">Produse</p>
            <ul className="space-y-2 text-sm text-gray-300">
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
            <div className="mt-3 space-y-1 border-t border-white/10 pt-3 text-sm">
              {order.discountAmount && order.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Reducere{order.discountCode ? ` (${order.discountCode})` : ""}</span>
                  <span>−{order.discountAmount.toFixed(2)} RON</span>
                </div>
              )}
              {order.shipping > 0 && (
                <div className="flex justify-between text-gray-400">
                  <span>Livrare</span>
                  <span>{order.shipping.toFixed(2)} RON</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-white">
                <span>Total</span>
                <span>{order.total.toFixed(2)} RON</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/8 bg-novra-bg/30 p-4 text-sm">
            <div className="mb-2 flex items-center gap-2 text-gray-500">
              <MapPin size={14} />
              <span className="text-[10px] uppercase tracking-widest">Adresă livrare</span>
            </div>
            <p className="text-white">{order.address.name}</p>
            <p className="text-gray-400">{order.address.address}, {order.address.city}</p>
            <p className="text-gray-400">{order.address.phone}</p>
            {order.address.notes && (
              <p className="mt-2 text-xs text-gray-500">Obs: {order.address.notes}</p>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-400">
            <CreditCard size={14} />
            <span>{order.paymentMethod === "card" ? "Plată cu cardul" : "Ramburs (numerar la livrare)"}</span>
            {order.paymentStatus === "paid" && (
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] text-emerald-300">Plătit</span>
            )}
          </div>

          {order.awbTracking && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm">
              <div className="mb-2 flex items-center gap-2 text-emerald-400">
                <Truck size={14} />
                <span className="text-[10px] uppercase tracking-widest">Urmărire colet</span>
              </div>
              <p className="font-mono text-white">{order.awbTracking}</p>
              <a
                href={buildFanCourierTrackingUrl(order.awbTracking)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-300 hover:text-emerald-200"
              >
                Urmărește pe Fan Courier
                <ExternalLink size={12} />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

type FilterDropdownProps = {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
};

function FilterDropdown({ label, value, options, onChange }: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-lg border border-white/10 bg-novra-bg/40 px-3 py-2 text-sm text-gray-300 transition hover:border-white/20"
      >
        {selected?.label || label}
        <ChevronDown size={16} className={`transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <ul className="absolute right-0 top-full z-20 mt-1 min-w-[160px] rounded-lg border border-white/10 bg-novra-card py-1 shadow-xl">
            {options.map((opt) => (
              <li key={opt.value}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`w-full px-4 py-2 text-left text-sm transition hover:bg-white/5 ${
                    value === opt.value ? "text-purple-400" : "text-gray-300"
                  }`}
                >
                  {opt.label}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
