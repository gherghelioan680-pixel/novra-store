"use client";

import { useEffect, useState } from "react";
import { Coins, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { getNovraCredits, refreshCurrentUserFromServer, type User } from "@/lib/auth";
import { createStoreRefreshEffect } from "@/lib/store";
import {
  loadCreditTransactions,
  CREDIT_TRANSACTION_LABELS,
  type CreditTransactionClient,
} from "@/lib/credits";

type NovraCreditsViewProps = {
  user: User;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ro-RO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NovraCreditsView({ user }: NovraCreditsViewProps) {
  const [refreshedUser, setRefreshedUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<CreditTransactionClient[]>([]);
  const [loading, setLoading] = useState(true);
  const liveUser = refreshedUser ?? user;

  useEffect(() => {
    const refresh = async () => {
      const updated = await refreshCurrentUserFromServer();
      if (updated) setRefreshedUser(updated);
      const txs = await loadCreditTransactions();
      setTransactions(txs);
      setLoading(false);
    };
    return createStoreRefreshEffect(refresh, { scopes: ["users", "credits"] });
  }, []);

  const credits = getNovraCredits(liveUser);

  return (
    <div>
      <h2 className="mb-6 text-xl font-semibold text-white">NovraCredits</h2>

      <div className="mb-6 rounded-xl border border-purple-500/20 bg-gradient-to-br from-purple-600/20 to-novra-card/40 p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-purple-600/30">
            <Coins className="h-7 w-7 text-purple-300" />
          </div>
          <div>
            <p className="text-sm text-gray-400">Sold curent</p>
            <p className="text-3xl font-bold text-white">{credits}</p>
            <p className="text-xs text-gray-500">NovraCredits (= {credits} Lei reducere)</p>
          </div>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-white/10 bg-novra-card/30 p-5">
        <h3 className="text-sm font-medium text-white">Cum folosești creditele</h3>
        <p className="mt-2 text-sm text-gray-400">
          1 NovraCredit = 1 Leu reducere la checkout. Câștigă credite completând profilul,
          abonându-te la newsletter sau cumpărând pachete Gift Card.
        </p>
      </div>

      <div>
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-gray-500">
          Istoric tranzacții
        </h3>

        {loading ? (
          <p className="text-sm text-gray-500">Se încarcă...</p>
        ) : transactions.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-novra-card/30 px-4 py-8 text-center">
            <p className="text-sm text-gray-500">Nicio tranzacție încă.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => {
              const isCredit = tx.amount > 0;
              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-white/8 bg-novra-card/20 px-4 py-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                        isCredit ? "bg-emerald-500/15" : "bg-red-500/15"
                      }`}
                    >
                      {isCredit ? (
                        <ArrowDownLeft className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <ArrowUpRight className="h-4 w-4 text-red-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">
                        {tx.description || CREDIT_TRANSACTION_LABELS[tx.type]}
                      </p>
                      <p className="text-xs text-gray-500">{formatDate(tx.createdAt)}</p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p
                      className={`text-sm font-semibold ${
                        isCredit ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      {isCredit ? "+" : ""}
                      {tx.amount}
                    </p>
                    <p className="text-[10px] text-gray-500">Sold: {tx.balanceAfter}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
