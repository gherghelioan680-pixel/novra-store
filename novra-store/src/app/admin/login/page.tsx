"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Shield, ArrowLeft } from "lucide-react";
import { loginAdmin } from "@/lib/auth";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await loginAdmin(email, password);
    if (!result.success) {
      setError(result.message);
      setLoading(false);
      return;
    }

    router.replace("/admin");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-novra-bg px-4 text-white selection:bg-purple-500/30">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(139,92,246,0.15),transparent)] pointer-events-none" />

      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <Image src="/logo.png" alt="NOVRA" width={180} height={60} className="mx-auto h-10 w-auto" priority />
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-600/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-purple-300">
            <Shield size={12} />
            Panou Admin
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-novra-card/40 p-6 shadow-2xl shadow-purple-900/20 sm:p-8">
          <h1 className="mb-2 text-xl font-bold tracking-tight">Autentificare Admin</h1>
          <p className="mb-6 text-sm text-gray-400">Acces restricționat — doar administratorii NOVRA.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="admin-email" className="mb-2 block text-xs uppercase tracking-widest text-gray-500">
                Email
              </label>
              <input
                id="admin-email"
                type="email"
                required
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full min-h-11 rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-base sm:text-sm outline-none transition focus:border-purple-500/50"
                placeholder="admin@novra.ro"
              />
            </div>

            <div>
              <label htmlFor="admin-password" className="mb-2 block text-xs uppercase tracking-widest text-gray-500">
                Parolă
              </label>
              <input
                id="admin-password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full min-h-11 rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-base sm:text-sm outline-none transition focus:border-purple-500/50"
              />
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-11 rounded-xl bg-purple-600 py-3 text-sm font-semibold uppercase tracking-wider transition hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? "Se autentifică..." : "Intră în panou"}
            </button>
          </form>
        </div>

        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 text-xs text-gray-500 transition hover:text-purple-400 uppercase tracking-widest"
        >
          <ArrowLeft size={14} />
          Înapoi pe site
        </Link>
      </div>
    </div>
  );
}
