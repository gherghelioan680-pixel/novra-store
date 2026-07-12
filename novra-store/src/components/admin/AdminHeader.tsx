"use client";

import { Shield } from "lucide-react";
import type { User } from "@/lib/auth";

type AdminHeaderProps = {
  user: User;
  title: string;
  subtitle?: string;
};

export default function AdminHeader({ user, title, subtitle }: AdminHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-600/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-purple-300">
            <Shield size={12} />
            Admin NOVRA
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-gray-400">{subtitle}</p>}
        </div>
        <div className="rounded-xl border border-white/10 bg-novra-card/30 px-4 py-3 text-right">
          <p className="text-[10px] uppercase tracking-widest text-gray-500">Conectat ca</p>
          <p className="text-sm font-medium text-white">{user.name}</p>
          <p className="text-xs text-gray-400">{user.email}</p>
        </div>
      </div>
    </div>
  );
}
