"use client";

import { Gift } from "lucide-react";

export default function GiftCardsView() {
  return (
    <div>
      <h2 className="mb-6 text-xl font-semibold text-white">Gift Cards</h2>
      <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-novra-card/30 py-16 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-purple-600/20">
          <Gift className="h-7 w-7 text-purple-400" />
        </div>
        <p className="text-lg font-medium text-gray-300">No gift cards yet</p>
        <p className="mt-1 max-w-sm text-sm text-gray-500">
          Cardurile cadou primite vor fi afișate aici.
        </p>
      </div>
    </div>
  );
}
