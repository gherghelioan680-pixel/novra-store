"use client";

import { useEffect, useState } from "react";
import { Mail, Check, Tag } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import CopyButton from "@/components/CopyButton";
import { requireAdmin, getStoredUsers } from "@/lib/auth";
import { loadNewsletterSubscribers } from "@/lib/newsletter";
import { loadDiscountCodes, formatDiscountValue, type DiscountCode } from "@/lib/discount-codes";
import { loadSiteSettings } from "@/lib/site-settings";
import { subscribeToStoreUpdates } from "@/lib/store";

type SubscriberRow = {
  email: string;
  name: string;
  date: string;
  source: string;
  discountCode?: string;
};

export default function AdminNewsletterPage() {
  const admin = requireAdmin();
  const [subscribers, setSubscribers] = useState<SubscriberRow[]>([]);
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
  const [discountPercent, setDiscountPercent] = useState(10);

  const mergeSubscribers = (fromStorage: Awaited<ReturnType<typeof loadNewsletterSubscribers>>) => {
    const fromUsers = getStoredUsers()
      .filter((u) => u.role !== "admin" && u.subscribedToNewsletter)
      .map((u) => ({
        email: u.email,
        name: u.name,
        date: u.createdAt,
        source: "account" as const,
      }));

    const merged = new Map<string, SubscriberRow>();

    for (const sub of fromStorage) {
      merged.set(sub.email, {
        email: sub.email,
        name: sub.name ?? "—",
        date: sub.subscribedAt,
        source: sub.source,
        discountCode: sub.discountCode,
      });
    }

    for (const sub of fromUsers) {
      if (!merged.has(sub.email)) {
        merged.set(sub.email, {
          email: sub.email,
          name: sub.name,
          date: sub.date,
          source: sub.source,
        });
      }
    }

    return Array.from(merged.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  };

  const refresh = async () => {
    const [fromStorage, codes, siteSettings] = await Promise.all([
      loadNewsletterSubscribers(),
      loadDiscountCodes(),
      loadSiteSettings(),
    ]);
    setSubscribers(mergeSubscribers(fromStorage));
    setDiscountCodes(codes);
    setDiscountPercent(siteSettings.newsletterDiscountPercent);
  };

  useEffect(() => {
    let cancelled = false;
    void refresh().then(() => {
      if (cancelled) return;
    });
    const unsubscribe = subscribeToStoreUpdates(() => {
      void refresh();
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  if (!admin) return null;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("ro-RO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const sourceLabel = (source: string) => {
    if (source === "homepage") return "Homepage";
    if (source === "account") return "Cont utilizator";
    return "Altele";
  };

  return (
    <div>
      <AdminHeader
        user={admin}
        title="Newsletter"
        subtitle={`${subscribers.length} abonați · ${discountCodes.length} coduri reducere`}
      />

      <div className="mb-8 overflow-x-auto rounded-2xl border border-white/10 bg-novra-card/30">
        <div className="border-b border-white/10 px-4 py-3 sm:px-6">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
            <Tag size={16} className="text-amber-400" />
            Coduri reducere newsletter
          </h3>
          <p className="mt-1 text-xs text-gray-500">
            Reducere implicită pentru coduri noi: {discountPercent}% · gestionează toate codurile în{" "}
            <a href="/admin/coduri-reducere" className="text-purple-300 hover:text-white underline">
              Coduri reducere
            </a>
          </p>
        </div>
        {discountCodes.length > 0 ? (
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-[10px] uppercase tracking-widest text-gray-500">
                <th className="px-4 py-3 sm:px-6">Cod</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Reducere</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 sm:px-6">Creat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {discountCodes.map((code) => (
                <tr key={code.code} className="text-gray-300">
                  <td className="px-4 py-3 sm:px-6">
                    <span className="inline-flex items-center gap-2 font-mono text-purple-300">
                      {code.code}
                      <CopyButton text={code.code} label="Copiază" />
                    </span>
                  </td>
                  <td className="px-4 py-3">{code.email}</td>
                  <td className="px-4 py-3">{formatDiscountValue(code.type, code.value)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        code.used
                          ? "bg-gray-500/15 text-gray-400"
                          : "bg-emerald-500/15 text-emerald-300"
                      }`}
                    >
                      {code.used ? "Folosit" : "Activ"}
                    </span>
                  </td>
                  <td className="px-4 py-3 sm:px-6 text-xs text-gray-500">{formatDate(code.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="px-4 py-8 text-center sm:px-6">
            <Tag size={28} className="mx-auto mb-3 text-gray-600" />
            <p className="text-sm text-gray-500">Niciun cod de reducere generat încă.</p>
            <p className="mt-2 text-xs text-gray-600">
              Codurile apar automat la abonare newsletter ({discountPercent}% reducere implicită).
            </p>
          </div>
        )}
      </div>

      {subscribers.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-novra-card/30 py-16 text-center">
          <Mail size={32} className="mx-auto mb-4 text-gray-600" />
          <p className="text-gray-500">Niciun abonat la newsletter încă.</p>
          <p className="mt-2 text-xs text-gray-600">
            Abonații apar când se înscriu pe homepage sau din contul de utilizator.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-novra-card/30">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-[10px] uppercase tracking-widest text-gray-500">
                <th className="px-4 py-4 sm:px-6">Nume</th>
                <th className="px-4 py-4">Email</th>
                <th className="px-4 py-4">Cod reducere</th>
                <th className="px-4 py-4">Sursă</th>
                <th className="px-4 py-4 sm:px-6">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {subscribers.map((sub) => (
                <tr key={sub.email} className="text-gray-300">
                  <td className="px-4 py-4 sm:px-6 font-medium text-white">
                    <span className="inline-flex items-center gap-2">
                      {sub.name}
                      <Check size={14} className="text-green-400" />
                    </span>
                  </td>
                  <td className="px-4 py-4">{sub.email}</td>
                  <td className="px-4 py-4 font-mono text-xs text-purple-300">
                    {sub.discountCode ?? "—"}
                  </td>
                  <td className="px-4 py-4 text-xs text-purple-300">{sourceLabel(sub.source)}</td>
                  <td className="px-4 py-4 sm:px-6 text-xs text-gray-500">{formatDate(sub.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
