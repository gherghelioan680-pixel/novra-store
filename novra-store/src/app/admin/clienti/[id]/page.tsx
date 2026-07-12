"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Coins, Mail, ShoppingBag, User } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import {
  requireAdmin,
  loadUserFromServer,
  updateUserCreditsAdmin,
  updateUserProfileAdmin,
  addAdminNote,
  getNovraCredits,
  type SafeUser,
} from "@/lib/auth";
import {
  loadOrders,
  updateOrderStatus,
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

export default function AdminClientDetailPage() {
  const admin = requireAdmin();
  const params = useParams();
  const router = useRouter();
  const email = decodeURIComponent(params.id as string);

  const [customer, setCustomer] = useState<SafeUser | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [creditsAmount, setCreditsAmount] = useState("50");
  const [creditsReason, setCreditsReason] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    dateOfBirth: "",
    country: "",
  });

  const refresh = async () => {
    const user = await loadUserFromServer(email);
    if (!user) {
      router.replace("/admin/clienti");
      return;
    }
    setCustomer(user);
    setProfileForm({
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
      phone: user.phone ?? "",
      dateOfBirth: user.dateOfBirth ?? "",
      country: user.country ?? "Romania",
    });

    const allOrders = await loadOrders(email);
    setOrders(allOrders);
  };

  useEffect(() => {
    return createStoreRefreshEffect(refresh, { scopes: ["users", "orders"] });
  }, [email]);

  if (!admin) return null;

  if (!customer) {
    return (
      <div>
        <AdminHeader user={admin} title="Client" subtitle="Se încarcă..." />
        <p className="text-center text-gray-500 py-16">Se încarcă datele clientului...</p>
      </div>
    );
  }

  const handleCreditsUpdate = async (delta: number) => {
    setSaving(true);
    const result = await updateUserCreditsAdmin(email, delta, creditsReason || undefined);
    setSaving(false);
    if (result.success && result.user) {
      setCustomer(result.user);
      setMessage(`Credite actualizate: ${getNovraCredits(result.user as Parameters<typeof getNovraCredits>[0])} NovraCredits`);
      setCreditsReason("");
    } else {
      setMessage(result.message ?? "Eroare la actualizare.");
    }
  };

  const handleProfileSave = async () => {
    setSaving(true);
    const result = await updateUserProfileAdmin(email, profileForm);
    setSaving(false);
    if (result.success && result.user) {
      setCustomer(result.user);
      setMessage("Profil actualizat cu succes.");
    } else {
      setMessage(result.message ?? "Eroare la salvare.");
    }
  };

  const handleAddNote = async () => {
    if (!adminNote.trim()) return;
    setSaving(true);
    const result = await addAdminNote(email, adminNote);
    setSaving(false);
    if (result.success && result.user) {
      setCustomer(result.user);
      setMessage("Notă adăugată.");
      setAdminNote("");
    } else {
      setMessage(result.message ?? "Eroare la adăugarea notei.");
    }
  };

  const handleOrderStatus = async (orderId: string, status: OrderStatus) => {
    await updateOrderStatus(orderId, status);
    await refresh();
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("ro-RO", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

  return (
    <div>
      <Link
        href="/admin/clienti"
        className="mb-4 inline-flex items-center gap-2 text-xs text-gray-500 hover:text-purple-400"
      >
        <ArrowLeft size={14} />
        Înapoi la clienți
      </Link>

      <AdminHeader
        user={admin}
        title={customer.name}
        subtitle={customer.email}
      />

      {message && (
        <div className="mb-6 rounded-xl border border-purple-500/30 bg-purple-600/10 px-4 py-3 text-sm text-purple-200">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-novra-card/30 p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <User size={18} className="text-purple-400" />
            <h2 className="font-semibold text-white">Profil client</h2>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Prenume" value={profileForm.firstName} onChange={(v) => setProfileForm({ ...profileForm, firstName: v })} />
              <Field label="Nume" value={profileForm.lastName} onChange={(v) => setProfileForm({ ...profileForm, lastName: v })} />
            </div>
            <Field label="Telefon" value={profileForm.phone} onChange={(v) => setProfileForm({ ...profileForm, phone: v })} />
            <Field label="Data nașterii" value={profileForm.dateOfBirth} onChange={(v) => setProfileForm({ ...profileForm, dateOfBirth: v })} type="date" />
            <Field label="Țară" value={profileForm.country} onChange={(v) => setProfileForm({ ...profileForm, country: v })} />
            <div className="pt-2 text-xs text-gray-500">
              <p>Cont creat: {formatDate(customer.createdAt)}</p>
              <p className="mt-1">
                Newsletter: {customer.subscribedToNewsletter ? "Abonat" : "Neabonat"}
              </p>
            </div>
            <button
              type="button"
              disabled={saving}
              onClick={handleProfileSave}
              className="mt-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
            >
              Salvează profil
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-novra-card/30 p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <Coins size={18} className="text-purple-400" />
            <h2 className="font-semibold text-white">NovraCredits</h2>
          </div>
          <p className="mb-4 text-3xl font-bold text-white">
            {getNovraCredits(customer as Parameters<typeof getNovraCredits>[0])}
          </p>
          <div className="space-y-3">
            <input
              type="number"
              value={creditsAmount}
              onChange={(e) => setCreditsAmount(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-novra-bg/50 px-3 py-2 text-sm text-white outline-none focus:border-purple-500/50"
              placeholder="Sumă"
            />
            <input
              type="text"
              value={creditsReason}
              onChange={(e) => setCreditsReason(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-novra-bg/50 px-3 py-2 text-sm text-white outline-none focus:border-purple-500/50"
              placeholder="Motiv (opțional)"
            />
            <div className="flex flex-wrap gap-2">
              {[50, 100, -20].map((amount) => (
                <button
                  key={amount}
                  type="button"
                  disabled={saving}
                  onClick={() => handleCreditsUpdate(amount)}
                  className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-gray-300 hover:border-purple-500/50 hover:text-purple-300 disabled:opacity-50"
                >
                  {amount > 0 ? `+${amount}` : amount}
                </button>
              ))}
              <button
                type="button"
                disabled={saving}
                onClick={() => handleCreditsUpdate(Number(creditsAmount) || 0)}
                className="rounded-lg bg-purple-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
              >
                Aplică sumă
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-novra-card/30 p-5 sm:p-6 lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <ShoppingBag size={18} className="text-purple-400" />
            <h2 className="font-semibold text-white">Comenzi ({orders.length})</h2>
          </div>
          {orders.length === 0 ? (
            <p className="text-sm text-gray-500">Nicio comandă pentru acest client.</p>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div key={order.id} className="rounded-xl border border-white/8 bg-novra-bg/30 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-mono text-xs text-purple-300">{order.id}</p>
                      <p className="text-sm text-gray-400">{formatDate(order.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-white">{order.total.toFixed(2)} RON</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs ${ORDER_STATUS_COLORS[order.status]}`}>
                        {ORDER_STATUS_LABELS[order.status]}
                      </span>
                      <select
                        value={order.status}
                        onChange={(e) => handleOrderStatus(order.id, e.target.value as OrderStatus)}
                        className="rounded-lg border border-white/10 bg-novra-bg/50 px-2 py-1 text-xs text-white outline-none"
                      >
                        {statusOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-white/10 bg-novra-card/30 p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <Mail size={18} className="text-purple-400" />
            <h2 className="font-semibold text-white">Cupoane & Gift Cards</h2>
          </div>
          <p className="text-sm text-gray-500">Funcționalitate în dezvoltare — 0 cupoane, 0 gift cards.</p>
        </section>

        <section className="rounded-2xl border border-white/10 bg-novra-card/30 p-5 sm:p-6">
          <h2 className="mb-4 font-semibold text-white">Notă internă admin</h2>
          <textarea
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-white/10 bg-novra-bg/50 px-3 py-2 text-sm text-white outline-none focus:border-purple-500/50 resize-none"
            placeholder="Adaugă o notă internă..."
          />
          {customer.adminNotes && (
            <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-novra-bg/30 p-3 text-xs text-gray-400">
              {customer.adminNotes}
            </pre>
          )}
          <button
            type="button"
            disabled={saving || !adminNote.trim()}
            onClick={handleAddNote}
            className="mt-3 rounded-lg bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15 disabled:opacity-50"
          >
            Adaugă notă
          </button>
        </section>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-[10px] uppercase tracking-widest text-gray-500">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-white/10 bg-novra-bg/50 px-3 py-2 text-sm text-white outline-none focus:border-purple-500/50"
      />
    </div>
  );
}
