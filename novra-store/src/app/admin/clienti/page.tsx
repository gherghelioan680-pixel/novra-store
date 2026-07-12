"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, ChevronRight } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import {
  requireAdmin,
  loadAllUsersFromServer,
  getNovraCredits,
  syncUserToServer,
  getStoredUsers,
  type SafeUser,
} from "@/lib/auth";
import { createStoreRefreshEffect } from "@/lib/store";

export default function AdminClientiPage() {
  const admin = requireAdmin();
  const [customers, setCustomers] = useState<SafeUser[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const refreshCustomers = async () => {
    const localUsers = getStoredUsers().filter((u) => u.role !== "admin");
    for (const user of localUsers) {
      await syncUserToServer(user);
    }

    const fromServer = await loadAllUsersFromServer();
    setCustomers(fromServer.filter((u) => u.role !== "admin"));
    setLoading(false);
  };

  useEffect(() => {
    return createStoreRefreshEffect(refreshCustomers, { scopes: ["users"] });
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.email.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.firstName?.toLowerCase().includes(q) ||
        c.lastName?.toLowerCase().includes(q)
    );
  }, [customers, search]);

  if (!admin) return null;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("ro-RO", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

  return (
    <div>
      <AdminHeader
        user={admin}
        title="Clienți"
        subtitle={`${customers.length} utilizatori înregistrați`}
      />

      <div className="mb-6 relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="search"
          placeholder="Caută după nume sau email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-novra-card/30 py-3 pl-11 pr-4 text-sm text-white placeholder:text-gray-500 outline-none focus:border-purple-500/50"
        />
      </div>

      {loading ? (
        <p className="py-16 text-center text-sm text-gray-500">Se încarcă clienții...</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-novra-card/30 py-16 text-center">
          <p className="text-gray-500">
            {search ? "Niciun client găsit pentru căutarea ta." : "Niciun client înregistrat încă."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-novra-card/30">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-[10px] uppercase tracking-widest text-gray-500">
                <th className="px-4 py-4 sm:px-6">Nume</th>
                <th className="px-4 py-4">Email</th>
                <th className="px-4 py-4">NovraCredits</th>
                <th className="px-4 py-4">Comenzi</th>
                <th className="px-4 py-4 sm:px-6">Înregistrat</th>
                <th className="px-4 py-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((customer) => (
                <tr key={customer.id} className="text-gray-300">
                  <td className="px-4 py-4 sm:px-6 font-medium text-white">{customer.name}</td>
                  <td className="px-4 py-4">{customer.email}</td>
                  <td className="px-4 py-4">
                    <span className="rounded-full bg-purple-600/15 px-2 py-0.5 text-xs text-purple-300">
                      {getNovraCredits(customer as Parameters<typeof getNovraCredits>[0])}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-xs">{customer.orders?.length ?? 0}</td>
                  <td className="px-4 py-4 sm:px-6 text-xs text-gray-500">
                    {formatDate(customer.createdAt)}
                  </td>
                  <td className="px-4 py-4">
                    <Link
                      href={`/admin/clienti/${encodeURIComponent(customer.email)}`}
                      className="inline-flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300"
                    >
                      Detalii
                      <ChevronRight size={14} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
