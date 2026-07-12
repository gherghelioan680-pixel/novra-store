"use client";

import Link from "next/link";
import { Eye } from "lucide-react";

export default function ComingSoonAdminBanner() {
  return (
    <div className="fixed top-0 inset-x-0 z-[10000] flex items-center justify-center gap-2 border-b border-amber-500/30 bg-amber-950/90 px-4 py-2 text-center text-xs sm:text-sm text-amber-100 backdrop-blur-md pt-[max(0.5rem,env(safe-area-inset-top))]">
      <Eye size={14} className="shrink-0 text-amber-400" aria-hidden />
      <span>
        <strong className="font-semibold text-white">Coming Soon este activ</strong> — vizitatorii văd pagina de
        așteptare.
      </span>
      <Link
        href="/admin/setari"
        className="ml-1 shrink-0 font-semibold text-amber-300 underline-offset-2 hover:text-white hover:underline"
      >
        Setări
      </Link>
    </div>
  );
}
