"use client";

import { useEffect, useState } from "react";
import { Coins } from "lucide-react";
import { getNovraCredits, refreshCurrentUserFromServer, type User } from "@/lib/auth";
import { createStoreRefreshEffect } from "@/lib/store";

type NovraCreditsViewProps = {
  user: User;
};

export default function NovraCreditsView({ user }: NovraCreditsViewProps) {
  const [refreshedUser, setRefreshedUser] = useState<User | null>(null);
  const liveUser = refreshedUser ?? user;

  useEffect(() => {
    const refresh = async () => {
      const updated = await refreshCurrentUserFromServer();
      if (updated) setRefreshedUser(updated);
    };
    return createStoreRefreshEffect(refresh, { scopes: ["users"] });
  }, []);

  const credits = getNovraCredits(liveUser);

  return (
    <div>
      <h2 className="mb-6 text-xl font-semibold text-white">My NovraCredits</h2>

      <div className="mb-6 rounded-xl border border-purple-500/20 bg-gradient-to-br from-purple-600/20 to-novra-card/40 p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-purple-600/30">
            <Coins className="h-7 w-7 text-purple-300" />
          </div>
          <div>
            <p className="text-sm text-gray-400">Sold curent</p>
            <p className="text-3xl font-bold text-white">{credits}</p>
            <p className="text-xs text-gray-500">NovraCredits</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-novra-card/30 p-5">
        <h3 className="text-sm font-medium text-white">Cum folosești creditele</h3>
        <p className="mt-2 text-sm text-gray-400">
          1 NovraCredit = 1 Leu reducere la următoarea comandă. Câștigă credite completând profilul,
          abonându-te la newsletter sau cumpărând produse NOVRA.
        </p>
      </div>
    </div>
  );
}
