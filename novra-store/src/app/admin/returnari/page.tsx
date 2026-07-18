"use client";

import { useEffect, useState } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import { requireAdmin } from "@/lib/auth";
import { getApiHeaders } from "@/lib/api-client";
import { RETURN_STATUS_LABELS, type ReturnRequest, type ReturnStatus } from "@/lib/returns-types";
import { createStoreRefreshEffect, dispatchStoreUpdate } from "@/lib/store";

const STATUS_OPTIONS: ReturnStatus[] = ["pending", "approved", "rejected", "completed"];

export default function AdminReturnariPage() {
  const admin = requireAdmin();
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [workingId, setWorkingId] = useState<string | null>(null);

  const refreshReturns = async () => {
    const response = await fetch("/api/store/returns", { headers: getApiHeaders() });
    if (!response.ok) return;
    const data = (await response.json()) as { returns?: ReturnRequest[] };
    setReturns(data.returns ?? []);
  };

  useEffect(() => {
    return createStoreRefreshEffect(refreshReturns, { scopes: ["returns"] });
  }, []);

  if (!admin) return null;

  const updateStatus = async (id: string, status: ReturnStatus) => {
    setWorkingId(id);
    await fetch("/api/store/returns", {
      method: "PATCH",
      headers: getApiHeaders(),
      body: JSON.stringify({ id, status, adminNote: notes[id] }),
    });
    setWorkingId(null);
    dispatchStoreUpdate({ scope: "returns" });
    await refreshReturns();
  };

  return (
    <div>
      <AdminHeader
        user={admin}
        title="Returnări"
        subtitle="Cereri de retur și rambursare de la clienți"
      />

      {returns.length === 0 ? (
        <p className="rounded-xl border border-white/10 bg-novra-card/30 px-5 py-10 text-sm text-gray-400">
          Nu există cereri de retur.
        </p>
      ) : (
        <div className="space-y-4">
          {returns.map((item) => (
            <article
              key={item.id}
              className="rounded-xl border border-white/10 bg-novra-card/30 p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-sm text-purple-300">{item.orderCode}</p>
                  <p className="mt-1 text-sm text-white">{item.userName ?? item.userEmail}</p>
                  <p className="text-xs text-gray-500">{item.userEmail}</p>
                </div>
                <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-gray-300">
                  {RETURN_STATUS_LABELS[item.status]}
                </span>
              </div>

              <div className="mt-4 grid gap-2 text-sm">
                <p>
                  <span className="text-gray-500">Motiv:</span>{" "}
                  <span className="text-gray-200">{item.reason}</span>
                </p>
                <p>
                  <span className="text-gray-500">Descriere:</span>{" "}
                  <span className="text-gray-200">{item.description}</span>
                </p>
                <p className="text-xs text-gray-600">
                  {new Date(item.createdAt).toLocaleString("ro-RO")}
                </p>
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <label className="mb-1 block text-xs text-gray-500">Notă admin (opțional)</label>
                  <input
                    type="text"
                    value={notes[item.id] ?? item.adminNote ?? ""}
                    onChange={(e) => setNotes((prev) => ({ ...prev, [item.id]: e.target.value }))}
                    className="w-full min-h-10 rounded-lg border border-white/10 bg-novra-bg/50 px-3 py-2 text-sm"
                    placeholder="Mesaj pentru client"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {STATUS_OPTIONS.filter((status) => status !== item.status).map((status) => (
                    <button
                      key={status}
                      type="button"
                      disabled={workingId === item.id}
                      onClick={() => updateStatus(item.id, status)}
                      className="min-h-10 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-gray-200 hover:bg-white/5 disabled:opacity-50"
                    >
                      {RETURN_STATUS_LABELS[status]}
                    </button>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
