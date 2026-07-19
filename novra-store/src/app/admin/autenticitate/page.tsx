"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Download,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Wand2,
  Ban,
} from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import CopyButton from "@/components/CopyButton";
import { requireAdmin } from "@/lib/auth";
import { getApiHeaders } from "@/lib/api-client";
import {
  AUTHENTICITY_STATUS_LABELS,
  type AuthenticityCode,
  type AuthenticityCodeStatus,
} from "@/lib/authenticity";
import { CATALOG_PRODUCTS } from "@/lib/catalog";

type ProductOption = { id: string; title: string };

const STATUS_OPTIONS: AuthenticityCodeStatus[] = ["unused", "verified", "revoked"];

export default function AdminAutenticitatePage() {
  const admin = requireAdmin();
  const [codes, setCodes] = useState<AuthenticityCode[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [batchCount, setBatchCount] = useState("25");
  const [productId, setProductId] = useState("");
  const [filter, setFilter] = useState<"all" | AuthenticityCodeStatus>("all");

  const refresh = async () => {
    const [codesRes, productsRes] = await Promise.all([
      fetch("/api/store/authenticity", { headers: getApiHeaders() }),
      fetch("/api/store/products", { headers: getApiHeaders() }),
    ]);

    if (codesRes.ok) {
      const data = (await codesRes.json()) as { codes?: AuthenticityCode[] };
      setCodes(data.codes ?? []);
    }

    const catalogOptions = CATALOG_PRODUCTS.filter((product) => product.active !== false).map(
      (product) => ({ id: product.id, title: product.title })
    );

    if (productsRes.ok) {
      const data = (await productsRes.json()) as {
        customProducts?: { id: string; title: string; active?: boolean }[];
      };
      const customOptions = (data.customProducts ?? [])
        .filter((product) => product.active !== false)
        .map((product) => ({ id: product.id, title: product.title }));
      setProducts([...catalogOptions, ...customOptions]);
    } else {
      setProducts(catalogOptions);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const filteredCodes = useMemo(() => {
    if (filter === "all") return codes;
    return codes.filter((code) => code.status === filter);
  }, [codes, filter]);

  const selectedProduct = products.find((product) => product.id === productId);

  if (!admin) return null;

  const showMessage = (text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 4000);
  };

  const formatDate = (iso?: string) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("ro-RO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleGenerateBatch = async () => {
    setLoading(true);
    const response = await fetch("/api/store/authenticity", {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify({
        action: "generate",
        count: Number(batchCount) || 10,
        productId: productId || undefined,
        productName: selectedProduct?.title,
      }),
    });
    setLoading(false);

    const data = (await response.json()) as { ok?: boolean; message?: string; created?: number };
    if (!response.ok || !data.ok) {
      showMessage(data.message ?? "Generare eșuată.");
      return;
    }

    await refresh();
    showMessage(`${data.created ?? 0} coduri generate.`);
  };

  const handleRevoke = async (id: string) => {
    const response = await fetch("/api/store/authenticity", {
      method: "PATCH",
      headers: getApiHeaders(),
      body: JSON.stringify({ id, action: "revoke" }),
    });
    if (!response.ok) {
      showMessage("Revocare eșuată.");
      return;
    }
    await refresh();
    showMessage("Cod revocat.");
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Ștergi acest cod definitiv?")) return;
    const response = await fetch(`/api/store/authenticity?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: getApiHeaders(),
    });
    if (!response.ok) {
      showMessage("Ștergere eșuată.");
      return;
    }
    await refresh();
    showMessage("Cod șters.");
  };

  const exportCsv = () => {
    const rows = [
      ["Cod", "Produs", "Status", "Verificat la", "Creat la"],
      ...filteredCodes.map((code) => [
        code.code,
        code.productName ?? "",
        AUTHENTICITY_STATUS_LABELS[code.status],
        code.verifiedAt ?? "",
        code.createdAt,
      ]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `novra-autenticitate-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <AdminHeader
        user={admin}
        title="Autenticitate produse"
        subtitle="Generează și gestionează codurile de verificare NOVRA de pe ambalaje."
      />

      {message ? (
        <p className="mb-4 rounded-xl border border-purple-500/20 bg-purple-500/10 px-4 py-3 text-sm text-purple-200">
          {message}
        </p>
      ) : null}

      <section className="mb-8 rounded-2xl border border-white/10 bg-novra-card/40 p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Wand2 size={18} className="text-purple-400" />
          Generare lot coduri
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="block text-sm">
            <span className="mb-2 block text-gray-400">Număr coduri</span>
            <input
              type="number"
              min={1}
              max={500}
              value={batchCount}
              onChange={(event) => setBatchCount(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-novra-bg px-4 py-3 text-white"
            />
          </label>
          <label className="block text-sm md:col-span-2">
            <span className="mb-2 block text-gray-400">Produs asociat (opțional)</span>
            <select
              value={productId}
              onChange={(event) => setProductId(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-novra-bg px-4 py-3 text-white"
            >
              <option value="">— Fără produs —</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.title}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void handleGenerateBatch()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold hover:bg-purple-700 disabled:opacity-50"
          >
            <Plus size={16} />
            Generează lot
          </button>
          <button
            type="button"
            onClick={() => void refresh()}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5"
          >
            <RefreshCw size={16} />
            Reîmprospătează
          </button>
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5"
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </section>

      <div className="mb-4 flex flex-wrap gap-2">
        {(["all", ...STATUS_OPTIONS] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              filter === value
                ? "bg-purple-600/25 text-purple-200 border border-purple-500/30"
                : "border border-white/10 text-gray-400 hover:text-white"
            }`}
          >
            {value === "all" ? "Toate" : AUTHENTICITY_STATUS_LABELS[value]}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="min-w-full text-sm">
          <thead className="bg-white/5 text-left text-gray-400">
            <tr>
              <th className="px-4 py-3 font-medium">Cod</th>
              <th className="px-4 py-3 font-medium">Produs</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Verificat</th>
              <th className="px-4 py-3 font-medium">Creat</th>
              <th className="px-4 py-3 font-medium">Acțiuni</th>
            </tr>
          </thead>
          <tbody>
            {filteredCodes.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  Niciun cod înregistrat.
                </td>
              </tr>
            ) : (
              filteredCodes.map((code) => (
                <tr key={code.id} className="border-t border-white/5">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-purple-200">{code.code}</span>
                      <CopyButton text={code.code} label="Copiază" copiedLabel="Copiat" className="px-2 py-1" />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-300">{code.productName ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        code.status === "verified"
                          ? "bg-green-500/10 text-green-300"
                          : code.status === "revoked"
                            ? "bg-red-500/10 text-red-300"
                            : "bg-yellow-500/10 text-yellow-300"
                      }`}
                    >
                      {AUTHENTICITY_STATUS_LABELS[code.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{formatDate(code.verifiedAt)}</td>
                  <td className="px-4 py-3 text-gray-400">{formatDate(code.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {code.status !== "revoked" ? (
                        <button
                          type="button"
                          onClick={() => void handleRevoke(code.id)}
                          className="rounded-lg border border-amber-500/20 p-2 text-amber-300 hover:bg-amber-500/10"
                          title="Revocă"
                        >
                          <Ban size={14} />
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => void handleDelete(code.id)}
                        className="rounded-lg border border-red-500/20 p-2 text-red-300 hover:bg-red-500/10"
                        title="Șterge"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
