"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Ban, ChevronRight, Search, ShieldOff, Trash2, UserX } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import {
  requireAdmin,
  loadAllUsersFromServer,
  setUserBannedAdmin,
  deleteUserAdmin,
  getNovraCredits,
  type SafeUser,
} from "@/lib/auth";
import { createStoreRefreshEffect } from "@/lib/store";

export default function AdminUtilizatoriPage() {
  const admin = requireAdmin();
  const [users, setUsers] = useState<SafeUser[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "banned" | "active">("all");
  const [loading, setLoading] = useState(true);
  const [actionEmail, setActionEmail] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const refreshUsers = async () => {
    const fromServer = await loadAllUsersFromServer();
    setUsers(fromServer.filter((u) => u.role !== "admin"));
    setLoading(false);
  };

  useEffect(() => {
    return createStoreRefreshEffect(refreshUsers, { scopes: ["users"] });
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((user) => {
      if (filter === "banned" && !user.banned) return false;
      if (filter === "active" && user.banned) return false;
      if (!q) return true;
      return (
        user.email.toLowerCase().includes(q) ||
        user.name.toLowerCase().includes(q) ||
        user.firstName?.toLowerCase().includes(q) ||
        user.lastName?.toLowerCase().includes(q)
      );
    });
  }, [users, search, filter]);

  if (!admin) return null;

  const handleBanToggle = async (email: string, banned: boolean) => {
    setActionEmail(email);
    const result = await setUserBannedAdmin(email, banned);
    setActionEmail(null);
    if (result.success) {
      setMessage(banned ? "Cont blocat." : "Cont deblocat.");
      await refreshUsers();
    } else {
      setMessage(result.message ?? "Acțiune eșuată.");
    }
    setTimeout(() => setMessage(""), 3000);
  };

  const handleDelete = async (email: string, name: string) => {
    if (!window.confirm(`Ștergi definitiv contul ${name} (${email})?`)) return;
    setActionEmail(email);
    const result = await deleteUserAdmin(email);
    setActionEmail(null);
    if (result.success) {
      setMessage("Cont șters.");
      await refreshUsers();
    } else {
      setMessage(result.message ?? "Ștergere eșuată.");
    }
    setTimeout(() => setMessage(""), 3000);
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("ro-RO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const bannedCount = users.filter((u) => u.banned).length;

  return (
    <div>
      <AdminHeader
        user={admin}
        title="Utilizatori"
        subtitle={`${users.length} clienți · ${bannedCount} blocați`}
      />

      {message && (
        <div className="mb-6 rounded-xl border border-purple-500/30 bg-purple-600/10 px-4 py-3 text-sm text-purple-200">
          {message}
        </div>
      )}

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="search"
            placeholder="Caută după nume sau email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-novra-card/30 py-3 pl-11 pr-4 text-sm text-white placeholder:text-gray-500 outline-none focus:border-purple-500/50"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "active", "banned"] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`rounded-xl px-4 py-2.5 text-xs font-semibold transition ${
                filter === key
                  ? "bg-purple-600 text-white"
                  : "border border-white/10 text-gray-400 hover:text-white"
              }`}
            >
              {key === "all" ? "Toți" : key === "active" ? "Activi" : "Blocați"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="py-16 text-center text-sm text-gray-500">Se încarcă utilizatorii...</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-novra-card/30 py-16 text-center">
          <UserX size={32} className="mx-auto mb-4 text-gray-600" />
          <p className="text-gray-500">Niciun utilizator găsit.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-novra-card/30">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-[10px] uppercase tracking-widest text-gray-500">
                <th className="px-4 py-4 sm:px-6">Nume</th>
                <th className="px-4 py-4">Email</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Credite</th>
                <th className="px-4 py-4">Înregistrat</th>
                <th className="px-4 py-4 sm:px-6">Acțiuni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((user) => (
                <tr key={user.id} className="text-gray-300">
                  <td className="px-4 py-4 sm:px-6 font-medium text-white">{user.name}</td>
                  <td className="px-4 py-4">{user.email}</td>
                  <td className="px-4 py-4">
                    {user.banned ? (
                      <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-xs text-red-300">
                        Blocat
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-300">
                        Activ
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-xs">
                    {getNovraCredits(user as Parameters<typeof getNovraCredits>[0])}
                  </td>
                  <td className="px-4 py-4 text-xs text-gray-500">{formatDate(user.createdAt)}</td>
                  <td className="px-4 py-4 sm:px-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/admin/clienti/${encodeURIComponent(user.email)}`}
                        className="inline-flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300"
                      >
                        Detalii
                        <ChevronRight size={14} />
                      </Link>
                      {user.banned ? (
                        <button
                          type="button"
                          disabled={actionEmail === user.email}
                          onClick={() => void handleBanToggle(user.email, false)}
                          className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/20 px-2 py-1 text-xs text-emerald-300 hover:bg-emerald-500/10 disabled:opacity-50"
                        >
                          <ShieldOff size={12} />
                          Deblochează
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={actionEmail === user.email}
                          onClick={() => void handleBanToggle(user.email, true)}
                          className="inline-flex items-center gap-1 rounded-lg border border-amber-500/20 px-2 py-1 text-xs text-amber-300 hover:bg-amber-500/10 disabled:opacity-50"
                        >
                          <Ban size={12} />
                          Blochează
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={actionEmail === user.email}
                        onClick={() => void handleDelete(user.email, user.name)}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-500/20 px-2 py-1 text-xs text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                      >
                        <Trash2 size={12} />
                        Șterge
                      </button>
                    </div>
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
