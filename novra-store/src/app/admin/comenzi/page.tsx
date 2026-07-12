"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trash2, Mail, MailCheck } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import CopyButton from "@/components/CopyButton";
import { requireAdmin } from "@/lib/auth";
import {
  loadOrders,
  updateOrderStatus,
  updateOrderAwb,
  deleteOrder,
  isGuestOrder,
  ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS,
  type Order,
  type OrderStatus,
} from "@/lib/orders";
import { createStoreRefreshEffect } from "@/lib/store";

const statusOptions: { value: OrderStatus; label: string }[] = [
  { value: "pending", label: "În așteptare" },
  { value: "processing", label: "În procesare" },
  { value: "shipped", label: "Expediată" },
  { value: "cancelled", label: "Anulată" },
];

export default function AdminComenziPage() {
  const admin = requireAdmin();
  const [orders, setOrders] = useState<Order[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<Order | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [awbDrafts, setAwbDrafts] = useState<Record<string, string>>({});
  const [savingAwb, setSavingAwb] = useState<string | null>(null);
  const [awbMessage, setAwbMessage] = useState<Record<string, string>>({});

  const refreshOrders = async () => {
    const data = await loadOrders();
    setOrders(data);
  };

  useEffect(() => {
    return createStoreRefreshEffect(refreshOrders, { scopes: ["orders"] });
  }, []);

  if (!admin) return null;

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    await updateOrderStatus(orderId, status);
    await refreshOrders();
  };

  const handleSaveAwb = async (order: Order) => {
    const awb = (awbDrafts[order.id] ?? order.awbTracking ?? "").trim();
    setSavingAwb(order.id);
    const ok = await updateOrderAwb(order.id, awb);
    if (ok) {
      setAwbMessage((prev) => ({
        ...prev,
        [order.id]: awb
          ? "AWB salvat. Email de tracking trimis (dacă Resend este configurat)."
          : "AWB șters.",
      }));
      setTimeout(() => {
        setAwbMessage((prev) => {
          const next = { ...prev };
          delete next[order.id];
          return next;
        });
      }, 5000);
    }
    setSavingAwb(null);
    await refreshOrders();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await deleteOrder(deleteTarget.id);
    setDeleteTarget(null);
    setDeleting(false);
    await refreshOrders();
  };

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
      <AdminHeader user={admin} title="Comenzi" subtitle="Toate comenzile plasate pe site" />

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-novra-card/30 py-16 text-center">
          <p className="text-gray-500">Nicio comandă încă.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              id={order.id}
              className="scroll-mt-24 rounded-2xl border border-white/10 bg-novra-card/30 p-5 sm:p-6"
            >
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/admin/cautare?q=${encodeURIComponent(order.purchaseCode)}`}
                      className="rounded-lg border border-purple-500/30 bg-purple-600/10 px-2.5 py-1 font-mono text-sm text-purple-300 transition hover:border-purple-500/50"
                    >
                      {order.purchaseCode}
                    </Link>
                    {isGuestOrder(order) && (
                      <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-300">
                        Guest
                      </span>
                    )}
                    <CopyButton text={order.purchaseCode} label="Copiază cod" />
                  </div>
                  <p className="mt-2 font-mono text-xs text-purple-300">{order.id}</p>
                  <p className="mt-1 text-lg font-semibold text-white">{order.userName}</p>
                  <p className="text-sm text-gray-400">
                    {order.userEmail} · {order.address.phone}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{formatDate(order.createdAt)}</p>
                </div>
                <div className="flex flex-col items-start gap-2 sm:items-end">
                  <p className="text-xl font-bold text-purple-400">
                    {order.total.toFixed(2)} RON
                  </p>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ORDER_STATUS_COLORS[order.status]}`}
                  >
                    {ORDER_STATUS_LABELS[order.status]}
                  </span>
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                    className="rounded-lg border border-white/10 bg-novra-bg/50 px-3 py-1.5 text-xs text-white outline-none focus:border-purple-500/50"
                  >
                    {statusOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(order)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs text-red-300 transition hover:border-red-500/40 hover:text-red-200"
                  >
                    <Trash2 size={14} />
                    Șterge comandă
                  </button>
                </div>
              </div>

              <div className="mb-3 text-sm text-gray-400">
                <span className="text-gray-500">Livrare: </span>
                {order.address.address}, {order.address.city}
                {order.address.notes && (
                  <span className="block mt-1 text-xs">Obs: {order.address.notes}</span>
                )}
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
                <p className="mt-2 text-xs text-gray-500">
                  Plată: {order.paymentMethod === "card" ? "Plată cu cardul" : "Ramburs"}
                  {order.paymentStatus === "paid" && " · Plătit"}
                  {order.shipping > 0 && ` · Livrare: ${order.shipping.toFixed(2)} RON`}
                  {order.discountAmount && order.discountAmount > 0 && (
                    <> · Reducere: −{order.discountAmount.toFixed(2)} RON</>
                  )}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] ${
                      order.confirmationEmailSent
                        ? "bg-emerald-500/15 text-emerald-300"
                        : "bg-gray-500/10 text-gray-500"
                    }`}
                  >
                    {order.confirmationEmailSent ? <MailCheck size={10} /> : <Mail size={10} />}
                    Email {order.confirmationEmailSent ? "trimis" : "netrimis"}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] ${
                      order.trackingEmailSent
                        ? "bg-emerald-500/15 text-emerald-300"
                        : "bg-gray-500/10 text-gray-500"
                    }`}
                  >
                    {order.trackingEmailSent ? <MailCheck size={10} /> : <Mail size={10} />}
                    Tracking {order.trackingEmailSent ? "trimis" : "netrimis"}
                  </span>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-white/8 bg-novra-bg/30 p-4">
                <p className="mb-2 text-[10px] uppercase tracking-widest text-gray-500">AWB / Tracking</p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    type="text"
                    value={awbDrafts[order.id] ?? order.awbTracking ?? ""}
                    onChange={(e) =>
                      setAwbDrafts((prev) => ({ ...prev, [order.id]: e.target.value }))
                    }
                    placeholder="Număr AWB Fan Courier"
                    className="flex-1 rounded-lg border border-white/10 bg-novra-bg/50 px-3 py-2 text-sm text-white outline-none focus:border-purple-500/50"
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveAwb(order)}
                    disabled={savingAwb === order.id}
                    className="rounded-lg bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
                  >
                    {savingAwb === order.id ? "Se salvează..." : "Salvează AWB"}
                  </button>
                </div>
                {order.awbTracking && (
                  <p className="mt-2 text-xs text-emerald-400">AWB activ: {order.awbTracking}</p>
                )}
                {awbMessage[order.id] && (
                  <p className="mt-2 text-xs text-purple-300">{awbMessage[order.id]}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-novra-card p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white">Șterge comandă</h3>
            <p className="mt-2 text-sm text-gray-400">
              Ești sigur că vrei să ștergi comanda{" "}
              <span className="font-mono text-purple-300">{deleteTarget.purchaseCode}</span> de la{" "}
              {deleteTarget.userName}? Această acțiune nu poate fi anulată.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-300 transition hover:bg-white/5"
              >
                Anulează
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "Se șterge..." : "Șterge"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
