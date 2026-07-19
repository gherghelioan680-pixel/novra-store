"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, MapPin, RefreshCw, RotateCcw } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import RomaniaDeliveryMap from "@/components/delivery/RomaniaDeliveryMap";
import { requireAdmin } from "@/lib/auth";
import { getApiHeaders } from "@/lib/api-client";
import type { DeliveryCountyStat } from "@/lib/delivery-map";

type AdminDeliveryMapPayload = {
  counties: DeliveryCountyStat[];
  updatedAt: string;
  publicEnabled: boolean;
};

export default function AdminHartaLivrariPage() {
  const admin = requireAdmin();
  const [data, setData] = useState<AdminDeliveryMapPayload | null>(null);
  const [message, setMessage] = useState("");
  const [working, setWorking] = useState(false);

  const refresh = async () => {
    const response = await fetch("/api/store/delivery-map", { headers: getApiHeaders() });
    if (!response.ok) return;
    const payload = (await response.json()) as AdminDeliveryMapPayload;
    setData(payload);
  };

  useEffect(() => {
    void refresh();
  }, []);

  const totalOrders = useMemo(
    () => data?.counties.reduce((sum, county) => sum + county.orderCount, 0) ?? 0,
    [data]
  );

  if (!admin) return null;

  const showMessage = (text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 4000);
  };

  const patchAction = async (body: Record<string, unknown>) => {
    setWorking(true);
    const response = await fetch("/api/store/delivery-map", {
      method: "PATCH",
      headers: getApiHeaders(),
      body: JSON.stringify(body),
    });
    setWorking(false);

    const payload = (await response.json()) as { ok?: boolean; message?: string };
    if (!response.ok || !payload.ok) {
      showMessage(payload.message ?? "Acțiune eșuată.");
      return;
    }

    await refresh();
  };

  const togglePublic = async () => {
    const currentlyEnabled = data?.publicEnabled !== false;
    await patchAction({ action: "togglePublic", enabled: !currentlyEnabled });
    showMessage(currentlyEnabled ? "Harta ascunsă de pe site." : "Harta afișată pe site.");
  };

  const resetStats = async () => {
    if (!window.confirm("Resetezi toate statisticile de livrare?")) return;
    await patchAction({ action: "reset" });
    showMessage("Statistici resetate.");
  };

  const toggleExclude = async (county: DeliveryCountyStat) => {
    await patchAction({
      action: "exclude",
      countyCode: county.countyCode,
      excluded: !county.excluded,
    });
    showMessage(county.excluded ? "Județ inclus din nou." : "Județ exclus de pe harta publică.");
  };

  const adjustCount = async (county: DeliveryCountyStat) => {
    const raw = window.prompt(`Număr comenzi pentru ${county.countyName}:`, String(county.orderCount));
    if (raw === null) return;
    const orderCount = Number(raw);
    if (!Number.isFinite(orderCount) || orderCount < 0) {
      showMessage("Valoare invalidă.");
      return;
    }
    await patchAction({ action: "adjustCount", countyCode: county.countyCode, orderCount });
    showMessage("Număr actualizat.");
  };

  return (
    <div>
      <AdminHeader
        user={admin}
        title="Harta livrărilor"
        subtitle="Statistici agregate pe județe — fără date personale ale clienților."
      />

      {message ? (
        <p className="mb-4 rounded-xl border border-purple-500/20 bg-purple-500/10 px-4 py-3 text-sm text-purple-200">
          {message}
        </p>
      ) : null}

      <div className="mb-6 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={working}
          onClick={() => void togglePublic()}
          className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold hover:bg-purple-700 disabled:opacity-50"
        >
          {data?.publicEnabled !== false ? <EyeOff size={16} /> : <Eye size={16} />}
          {data?.publicEnabled !== false ? "Ascunde de pe site" : "Afișează pe site"}
        </button>
        <button
          type="button"
          disabled={working}
          onClick={() => void refresh()}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 disabled:opacity-50"
        >
          <RefreshCw size={16} />
          Reîmprospătează
        </button>
        <button
          type="button"
          disabled={working}
          onClick={() => void resetStats()}
          className="inline-flex items-center gap-2 rounded-xl border border-red-500/20 px-4 py-2.5 text-sm text-red-300 hover:bg-red-500/10 disabled:opacity-50"
        >
          <RotateCcw size={16} />
          Reset statistici
        </button>
      </div>

      <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-white/10 bg-novra-card/40 p-4">
          <p className="text-xs uppercase tracking-widest text-gray-500">Total comenzi</p>
          <p className="mt-1 text-2xl font-bold text-white">{totalOrders}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-novra-card/40 p-4">
          <p className="text-xs uppercase tracking-widest text-gray-500">Județe active</p>
          <p className="mt-1 text-2xl font-bold text-white">
            {data?.counties.filter((county) => county.orderCount > 0 && !county.excluded).length ?? 0}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-novra-card/40 p-4">
          <p className="text-xs uppercase tracking-widest text-gray-500">Vizibilitate publică</p>
          <p className="mt-1 text-lg font-semibold text-purple-300">
            {data?.publicEnabled !== false ? "Activă" : "Ascunsă"}
          </p>
        </div>
      </div>

      {data ? (
        <>
          <RomaniaDeliveryMap counties={data.counties.filter((county) => !county.excluded)} />

          <div className="mt-8 overflow-x-auto rounded-2xl border border-white/10">
            <table className="min-w-full text-sm">
              <thead className="bg-white/5 text-left text-gray-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Județ</th>
                  <th className="px-4 py-3 font-medium">Cod</th>
                  <th className="px-4 py-3 font-medium">Comenzi</th>
                  <th className="px-4 py-3 font-medium">Ultima livrare</th>
                  <th className="px-4 py-3 font-medium">Public</th>
                  <th className="px-4 py-3 font-medium">Acțiuni</th>
                </tr>
              </thead>
              <tbody>
                {[...data.counties]
                  .sort((a, b) => b.orderCount - a.orderCount)
                  .map((county) => (
                    <tr key={county.countyCode} className="border-t border-white/5">
                      <td className="px-4 py-3 text-white">{county.countyName}</td>
                      <td className="px-4 py-3 text-gray-400">{county.countyCode}</td>
                      <td className="px-4 py-3 text-purple-300 font-semibold">{county.orderCount}</td>
                      <td className="px-4 py-3 text-gray-400">
                        {county.lastDeliveryAt
                          ? new Date(county.lastDeliveryAt).toLocaleDateString("ro-RO")
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs ${
                            county.excluded
                              ? "bg-red-500/10 text-red-300"
                              : "bg-green-500/10 text-green-300"
                          }`}
                        >
                          {county.excluded ? "Exclus" : "Vizibil"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={working}
                            onClick={() => void toggleExclude(county)}
                            className="rounded-lg border border-white/10 px-2.5 py-1.5 text-xs hover:bg-white/5"
                          >
                            {county.excluded ? "Include" : "Exclude"}
                          </button>
                          <button
                            type="button"
                            disabled={working}
                            onClick={() => void adjustCount(county)}
                            className="rounded-lg border border-white/10 px-2.5 py-1.5 text-xs hover:bg-white/5"
                          >
                            Editează nr.
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <p className="text-gray-500 text-sm">Se încarcă harta...</p>
      )}
    </div>
  );
}
