"use client";

import EmptyOrdersState from "../EmptyOrdersState";

export default function MyReturnsView() {
  return (
    <div>
      <h2 className="mb-6 text-xl font-semibold text-white">Returns and refunds</h2>
      <div className="rounded-xl border border-white/10 bg-novra-card/30">
        <EmptyOrdersState title="No records found" showShopButton={false} />
      </div>
    </div>
  );
}
