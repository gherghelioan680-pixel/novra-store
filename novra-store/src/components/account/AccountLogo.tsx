"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ArrowLeft } from "lucide-react";

type AccountLogoProps = {
  showBackLink?: boolean;
  compact?: boolean;
};

export default function AccountLogo({ showBackLink = true, compact = false }: AccountLogoProps) {
  const t = useTranslations("account");

  return (
    <div className={`flex flex-col ${compact ? "gap-3" : "gap-4"}`}>
      <Link href="/" className="inline-flex items-center group">
        <Image
          src="/logo.png"
          alt={t("logoAlt")}
          width={180}
          height={60}
          className={`${compact ? "h-8" : "h-10"} w-auto transition-opacity group-hover:opacity-90`}
          priority
        />
      </Link>
      {showBackLink && (
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs text-gray-500 hover:text-purple-400 uppercase tracking-widest transition-colors group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          {t("backToSite")}
        </Link>
      )}
    </div>
  );
}
