"use client";

import { Ticket } from "lucide-react";

export default function CouponsView() {
  return (
    <div>
      <h2 className="mb-6 text-xl font-semibold text-white">My Coupons</h2>
      <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-novra-card/30 py-16 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-purple-600/20">
          <Ticket className="h-7 w-7 text-purple-400" />
        </div>
        <p className="text-lg font-medium text-gray-300">No coupons available</p>
        <p className="mt-1 max-w-sm text-sm text-gray-500">
          Cupoanele tale vor apărea aici când le vei primi.
        </p>
      </div>
    </div>
  );
}
