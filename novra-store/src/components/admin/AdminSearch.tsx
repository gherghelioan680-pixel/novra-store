"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

type AdminSearchProps = {
  compact?: boolean;
};

export default function AdminSearch({ compact = false }: AdminSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    router.push(`/admin/cautare?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={compact ? "flex w-full gap-2" : "mb-6 flex flex-col gap-2 sm:flex-row sm:items-center"}
    >
      <div className="relative flex-1">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Caută cod comandă..."
          className="w-full rounded-xl border border-white/10 bg-novra-card/30 py-2.5 pl-10 pr-4 text-sm text-white outline-none transition focus:border-purple-500/50"
        />
      </div>
      <button
        type="submit"
        className="shrink-0 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-700"
      >
        Caută
      </button>
    </form>
  );
}
