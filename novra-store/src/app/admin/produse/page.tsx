"use client";

import { useEffect, useState } from "react";
import { Save, RotateCcw, Pencil, X, Star } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import { requireAdmin } from "@/lib/auth";
import {
  CATALOG_CATEGORIES,
  getCatalogProducts,
  getProductOverrides,
  loadProductOverrides,
  saveProductOverride,
  saveProductPriceOverride,
  getBundleSavings,
  isBundleProduct,
  type CatalogProduct,
  type ProductOverride,
} from "@/lib/catalog";
import { subscribeToStoreUpdates } from "@/lib/store";

type EditForm = {
  title: string;
  tag: string;
  description: string;
  basePrice: string;
  bestseller: boolean;
  bundleSavingsOverride: string;
  useAutoBundleSavings: boolean;
};

export default function AdminProdusePage() {
  const admin = requireAdmin();
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [editingProduct, setEditingProduct] = useState<CatalogProduct | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    title: "",
    tag: "",
    description: "",
    basePrice: "",
    bestseller: false,
    bundleSavingsOverride: "",
    useAutoBundleSavings: true,
  });

  const applyProductList = () => {
    const list = getCatalogProducts();
    const overrides = getProductOverrides();
    const initial: Record<string, string> = {};
    list.forEach((p) => {
      initial[p.id] = (overrides[p.id]?.basePrice ?? p.basePrice).toFixed(2);
    });
    setProducts(list);
    setEdits(initial);
  };

  const reloadProducts = async () => {
    await loadProductOverrides();
    applyProductList();
  };

  useEffect(() => {
    let cancelled = false;
    void loadProductOverrides().then(() => {
      if (cancelled) return;
      applyProductList();
    });
    const unsubscribe = subscribeToStoreUpdates(() => {
      void loadProductOverrides().then(applyProductList);
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  if (!admin) return null;

  const showMessage = (text: string) => {
    setMessage(text);
    setTimeout(() => setMessage(""), 3000);
  };

  const handleSavePrice = async (productId: string) => {
    const price = parseFloat(edits[productId]);
    if (isNaN(price) || price <= 0) {
      showMessage("Introdu un preț valid.");
      return;
    }

    const result = await saveProductPriceOverride(productId, price);
    if (!result.ok) {
      showMessage(result.message);
      return;
    }

    await reloadProducts();
    showMessage("Preț salvat! Modificarea este activă imediat pe site.");
  };

  const handleToggleBestseller = async (product: CatalogProduct) => {
    const next = !product.bestseller;
    const result = await saveProductOverride(product.id, { bestseller: next });
    if (!result.ok) {
      showMessage(result.message);
      return;
    }
    await reloadProducts();
    showMessage(next ? "Produs marcat ca Bestseller." : "Badge Bestseller dezactivat.");
  };

  const openEditModal = (product: CatalogProduct) => {
    const overrides = getProductOverrides()[product.id];
    const autoSavings = getBundleSavings(product);
    setEditingProduct(product);
    setEditForm({
      title: product.title,
      tag: product.tag,
      description: product.description,
      basePrice: product.basePrice.toFixed(2),
      bestseller: product.bestseller === true,
      bundleSavingsOverride:
        overrides?.bundleSavingsOverride != null
          ? String(overrides.bundleSavingsOverride)
          : autoSavings != null
            ? autoSavings.toFixed(0)
            : "",
      useAutoBundleSavings: overrides?.bundleSavingsOverride == null,
    });
  };

  const handleSaveFullEdit = async () => {
    if (!editingProduct) return;

    const price = parseFloat(editForm.basePrice);
    if (isNaN(price) || price <= 0) {
      showMessage("Introdu un preț valid.");
      return;
    }

    if (!editForm.title.trim() || !editForm.description.trim()) {
      showMessage("Titlul și descrierea sunt obligatorii.");
      return;
    }

    const updates: ProductOverride = {
      title: editForm.title.trim(),
      tag: editForm.tag.trim(),
      description: editForm.description.trim(),
      basePrice: price,
      bestseller: editForm.bestseller,
    };

    if (editingProduct && isBundleProduct(editingProduct.category)) {
      if (editForm.useAutoBundleSavings) {
        updates.bundleSavingsOverride = null;
      } else {
        const savings = parseFloat(editForm.bundleSavingsOverride);
        if (isNaN(savings) || savings < 0) {
          showMessage("Introdu o valoare validă pentru economii bundle.");
          return;
        }
        updates.bundleSavingsOverride = savings;
      }
    }

    const result = await saveProductOverride(editingProduct.id, updates);
    if (!result.ok) {
      showMessage(result.message);
      return;
    }

    setEditingProduct(null);
    await reloadProducts();
    showMessage("Produs actualizat! Modificările sunt active imediat pe site.");
  };

  const categoryLabel = (id: string) =>
    CATALOG_CATEGORIES.find((c) => c.id === id)?.label ?? id;

  return (
    <div>
      <AdminHeader
        user={admin}
        title="Produse"
        subtitle="Gestionează catalogul — modificările se aplică live pe site"
      />

      {message && (
        <div className="mb-6 rounded-xl border border-purple-500/30 bg-purple-600/10 px-4 py-3 text-sm text-purple-200">
          {message}
        </div>
      )}

      <p className="mb-6 text-sm text-gray-500">
        Editează prețuri, titluri, tag-uri și descrieri. Modificările se salvează pe server și
        apar pe toate dispozitivele (desktop, telefon) după reîncărcare sau în max. 30 secunde.
      </p>

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-novra-card/30">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-[10px] uppercase tracking-widest text-gray-500">
              <th className="px-4 py-4 sm:px-6">Produs</th>
              <th className="px-4 py-4">Categorie</th>
              <th className="px-4 py-4">Tag</th>
              <th className="px-4 py-4">Bestseller</th>
              <th className="px-4 py-4">Preț (RON)</th>
              <th className="px-4 py-4 sm:px-6">Acțiuni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {products.map((product) => (
              <tr key={product.id} className="text-gray-300">
                <td className="px-4 py-4 sm:px-6">
                  <p className="font-medium text-white">{product.title}</p>
                  <p className="text-xs text-gray-500 line-clamp-2 max-w-xs">{product.description}</p>
                  <p className="text-[10px] text-gray-600 mt-1">{product.id}</p>
                </td>
                <td className="px-4 py-4">
                  <span className="rounded-full bg-purple-600/15 px-2 py-0.5 text-xs text-purple-300">
                    {categoryLabel(product.category)}
                  </span>
                </td>
                <td className="px-4 py-4 text-xs text-purple-200">{product.tag}</td>
                <td className="px-4 py-4">
                  <label className="inline-flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={product.bestseller === true}
                      onChange={() => void handleToggleBestseller(product)}
                      className="h-4 w-4 rounded border-white/20 bg-novra-bg/50 text-amber-500 focus:ring-amber-500/50"
                    />
                    <span className="inline-flex items-center gap-1 text-xs text-amber-300">
                      <Star size={12} className={product.bestseller ? "fill-amber-400" : ""} />
                      {product.bestseller ? "Da" : "Nu"}
                    </span>
                  </label>
                  {isBundleProduct(product.category) && (() => {
                    const savings = getBundleSavings(product);
                    return savings != null && savings > 0 ? (
                      <p className="mt-1 text-[10px] text-emerald-400">−{savings.toFixed(0)} lei</p>
                    ) : null;
                  })()}
                </td>
                <td className="px-4 py-4">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={edits[product.id] ?? product.basePrice.toFixed(2)}
                    onChange={(e) =>
                      setEdits((prev) => ({ ...prev, [product.id]: e.target.value }))
                    }
                    className="w-28 rounded-lg border border-white/10 bg-novra-bg/50 px-3 py-2 text-sm text-white outline-none focus:border-purple-500/50"
                  />
                </td>
                <td className="px-4 py-4 sm:px-6">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleSavePrice(product.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-purple-700"
                    >
                      <Save size={14} />
                      Salvează preț
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditModal(product)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-novra-bg/50 px-3 py-2 text-xs font-semibold text-gray-200 transition hover:border-purple-500/40"
                    >
                      <Pencil size={14} />
                      Editează
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={() => void reloadProducts()}
        className="mt-4 inline-flex items-center gap-2 text-sm text-gray-400 hover:text-purple-400"
      >
        <RotateCcw size={14} />
        Reîncarcă
      </button>

      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-novra-card p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-white">Editează produs</h3>
                <p className="text-xs text-gray-500">{editingProduct.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="rounded-lg p-1 text-gray-400 hover:bg-white/10 hover:text-white"
                aria-label="Închide"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs uppercase tracking-widest text-gray-500">Titlu</label>
                <input
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-sm outline-none focus:border-purple-500/50"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs uppercase tracking-widest text-gray-500">Tag</label>
                <input
                  value={editForm.tag}
                  onChange={(e) => setEditForm({ ...editForm, tag: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-sm outline-none focus:border-purple-500/50"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs uppercase tracking-widest text-gray-500">Preț (RON)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editForm.basePrice}
                  onChange={(e) => setEditForm({ ...editForm, basePrice: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-sm outline-none focus:border-purple-500/50"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs uppercase tracking-widest text-gray-500">Descriere</label>
                <textarea
                  rows={4}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-sm outline-none focus:border-purple-500/50 resize-none"
                />
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editForm.bestseller}
                  onChange={(e) => setEditForm({ ...editForm, bestseller: e.target.checked })}
                  className="h-4 w-4 rounded border-white/20 bg-novra-bg/50 text-amber-500 focus:ring-amber-500/50"
                />
                <span className="text-sm text-gray-300">Afișează badge „Bestseller” pe site</span>
              </label>

              {editingProduct && isBundleProduct(editingProduct.category) && (
                <div className="rounded-xl border border-white/8 bg-novra-bg/30 p-4 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                    Economii bundle (badge)
                  </p>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.useAutoBundleSavings}
                      onChange={(e) =>
                        setEditForm({ ...editForm, useAutoBundleSavings: e.target.checked })
                      }
                      className="h-4 w-4 rounded border-white/20 bg-novra-bg/50 text-emerald-500 focus:ring-emerald-500/50"
                    />
                    <span className="text-sm text-gray-300">Calculează automat din prețuri</span>
                  </label>
                  {!editForm.useAutoBundleSavings && (
                    <div>
                      <label className="mb-1 block text-xs uppercase tracking-widest text-gray-500">
                        Valoare manuală (lei)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={editForm.bundleSavingsOverride}
                        onChange={(e) =>
                          setEditForm({ ...editForm, bundleSavingsOverride: e.target.value })
                        }
                        className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-sm outline-none focus:border-purple-500/50"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={handleSaveFullEdit}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-3 text-sm font-semibold text-white hover:bg-purple-700"
              >
                <Save size={16} />
                Salvează modificările
              </button>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="rounded-xl border border-white/10 px-4 py-3 text-sm text-gray-400 hover:text-white"
              >
                Anulează
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
