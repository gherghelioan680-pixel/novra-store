"use client";

import { useEffect, useState } from "react";
import { Save, RotateCcw, Pencil, X, Star, Upload, ImageIcon, Plus, Trash2 } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import { requireAdmin } from "@/lib/auth";
import { getApiHeaders } from "@/lib/api-client";
import { toImageApiUrl } from "@/lib/images";
import {
  CATALOG_CATEGORIES,
  getCatalogProducts,
  getProductOverrides,
  getProductStockQuantity,
  loadProductOverrides,
  saveProductOverride,
  saveProductPriceOverride,
  createCustomProduct,
  updateCustomProduct,
  deleteCustomProduct,
  getBundleSavings,
  getProductImageFolder,
  getProductImagePath,
  getCustomProductImagePath,
  isBundleProduct,
  isCustomProductId,
  slugFromTitle,
  BUNDLE_COLOR_SLUGS,
  type CatalogProduct,
  type ProductOverride,
} from "@/lib/catalog";
import { subscribeToStoreUpdates } from "@/lib/store";

type EditForm = {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  description: string;
  category: string;
  basePrice: string;
  oldPrice: string;
  stockQuantity: string;
  bestseller: boolean;
  active: boolean;
  specPower: string;
  specMaterial: string;
  bundleSavingsOverride: string;
  useAutoBundleSavings: boolean;
};

const EMPTY_EDIT_FORM: EditForm = {
  id: "",
  title: "",
  subtitle: "",
  tag: "",
  description: "",
  category: "usb-c",
  basePrice: "",
  oldPrice: "",
  stockQuantity: "100",
  bestseller: false,
  active: true,
  specPower: "—",
  specMaterial: "—",
  bundleSavingsOverride: "",
  useAutoBundleSavings: true,
};

function getProductImageTargets(product: CatalogProduct): Array<{ label: string; path: string }> {
  if (product.isCustom) {
    const path = getCustomProductImagePath(product.id);
    return [{ label: "Imagine principală", path }];
  }

  const folder = getProductImageFolder(product.category);
  const mainPath = getProductImagePath(product).replace(/^\//, "");
  const targets: Array<{ label: string; path: string }> = [
    { label: "Imagine principală", path: mainPath },
  ];

  if (folder === "adaptoare" || folder === "cabluri") {
    for (const slug of BUNDLE_COLOR_SLUGS) {
      targets.push({
        label: `Variantă ${slug}`,
        path: `products/${folder}/${slug}.png`,
      });
    }
  }

  return targets;
}

async function uploadImageFile(path: string, file: File): Promise<{ ok: boolean; message: string }> {
  const maxBytes = 2 * 1024 * 1024;
  if (file.size > maxBytes) {
    return { ok: false, message: "Fișierul depășește 2 MB." };
  }

  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("invalid"));
        return;
      }
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(new Error("read"));
    reader.readAsDataURL(file);
  }).catch(() => "");

  if (!base64) {
    return { ok: false, message: "Nu am putut citi fișierul." };
  }

  const response = await fetch("/api/store/images", {
    method: "POST",
    headers: getApiHeaders(),
    body: JSON.stringify({
      path,
      base64,
      contentType: file.type,
    }),
  });

  const data = (await response.json().catch(() => ({}))) as { error?: string };
  if (!response.ok) {
    return { ok: false, message: data.error ?? "Upload eșuat." };
  }

  return { ok: true, message: "Imagine salvată." };
}

export default function AdminProdusePage() {
  const admin = requireAdmin();
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [stockEdits, setStockEdits] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [editingProduct, setEditingProduct] = useState<CatalogProduct | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [uploadingImagePath, setUploadingImagePath] = useState<string | null>(null);
  const [imageVersion, setImageVersion] = useState(0);
  const [editForm, setEditForm] = useState<EditForm>(EMPTY_EDIT_FORM);

  const applyProductList = () => {
    const list = getCatalogProducts(true);
    const overrides = getProductOverrides();
    const initial: Record<string, string> = {};
    const initialStock: Record<string, string> = {};
    list.forEach((p) => {
      initial[p.id] = (overrides[p.id]?.basePrice ?? p.basePrice).toFixed(2);
      initialStock[p.id] = String(getProductStockQuantity(p));
    });
    setProducts(list);
    setEdits(initial);
    setStockEdits(initialStock);
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

  const handleSaveStock = async (productId: string) => {
    const stock = parseInt(stockEdits[productId], 10);
    if (isNaN(stock) || stock < 0) {
      showMessage("Introdu o cantitate de stoc validă (0 sau mai mult).");
      return;
    }

    const result = await saveProductOverride(productId, { stockQuantity: stock });
    if (!result.ok) {
      showMessage(result.message);
      return;
    }

    await reloadProducts();
    showMessage("Stoc salvat! Modificarea este activă imediat pe site.");
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

  const openCreateModal = () => {
    setEditingProduct(null);
    setIsCreating(true);
    setEditForm({ ...EMPTY_EDIT_FORM });
  };

  const closeEditorModal = () => {
    setEditingProduct(null);
    setIsCreating(false);
    setEditForm({ ...EMPTY_EDIT_FORM });
  };

  const openEditModal = (product: CatalogProduct) => {
    const overrides = getProductOverrides()[product.id];
    const autoSavings = getBundleSavings(product);
    setIsCreating(false);
    setEditingProduct(product);
    setEditForm({
      id: product.id,
      title: product.title,
      subtitle: product.subtitle,
      tag: product.tag,
      description: product.description,
      category: product.category,
      basePrice: product.basePrice.toFixed(2),
      oldPrice: product.oldPrice != null ? product.oldPrice.toFixed(2) : "",
      stockQuantity: String(getProductStockQuantity(product)),
      bestseller: product.bestseller === true,
      active: product.active !== false && overrides?.active !== false,
      specPower: product.specs.power,
      specMaterial: product.specs.material,
      bundleSavingsOverride:
        overrides?.bundleSavingsOverride != null
          ? String(overrides.bundleSavingsOverride)
          : autoSavings != null
            ? autoSavings.toFixed(0)
            : "",
      useAutoBundleSavings: overrides?.bundleSavingsOverride == null,
    });
  };

  const handleImageUpload = async (path: string, file: File) => {
    setUploadingImagePath(path);
    const result = await uploadImageFile(path, file);
    setUploadingImagePath(null);
    if (!result.ok) {
      showMessage(result.message);
      return;
    }
    setImageVersion((value) => value + 1);
    showMessage(result.message);
  };

  const handleDeleteProduct = async (product: CatalogProduct) => {
    if (!isCustomProductId(product.id)) {
      showMessage("Doar produsele adăugate manual pot fi șterse.");
      return;
    }

    if (!window.confirm(`Ștergi produsul „${product.title}”?`)) return;

    const result = await deleteCustomProduct(product.id);
    if (!result.ok) {
      showMessage(result.message);
      return;
    }

    await reloadProducts();
    showMessage("Produs șters.");
  };

  const handleSaveFullEdit = async () => {
    const price = parseFloat(editForm.basePrice);
    if (isNaN(price) || price <= 0) {
      showMessage("Introdu un preț valid.");
      return;
    }

    if (!editForm.title.trim() || !editForm.description.trim()) {
      showMessage("Titlul și descrierea sunt obligatorii.");
      return;
    }

    const stock = parseInt(editForm.stockQuantity, 10);
    if (isNaN(stock) || stock < 0) {
      showMessage("Introdu o cantitate de stoc validă (0 sau mai mult).");
      return;
    }

    const oldPrice = editForm.oldPrice.trim()
      ? parseFloat(editForm.oldPrice)
      : undefined;
    if (oldPrice !== undefined && (isNaN(oldPrice) || oldPrice < 0)) {
      showMessage("Introdu un preț vechi valid sau lasă câmpul gol.");
      return;
    }

    if (isCreating) {
      const productId = editForm.id.trim() || slugFromTitle(editForm.title);
      const result = await createCustomProduct({
        id: productId,
        title: editForm.title.trim(),
        subtitle: editForm.subtitle.trim() || editForm.title.trim(),
        category: editForm.category,
        basePrice: price,
        oldPrice,
        stockQuantity: stock,
        tag: editForm.tag.trim() || "Nou",
        description: editForm.description.trim(),
        bestseller: editForm.bestseller,
        active: editForm.active,
        imageSrc: `/products/custom/${productId}.png`,
        specs: {
          power: editForm.specPower.trim() || "—",
          speed: "—",
          material: editForm.specMaterial.trim() || "—",
          chip: "—",
        },
        options: [],
        modifiers: [],
      });

      if (!result.ok) {
        showMessage(result.message);
        return;
      }

      closeEditorModal();
      await reloadProducts();
      showMessage("Produs creat! Apare imediat pe site.");
      return;
    }

    if (editingProduct && isCustomProductId(editingProduct.id)) {
      const result = await updateCustomProduct({
        id: editingProduct.id,
        title: editForm.title.trim(),
        subtitle: editForm.subtitle.trim() || editForm.title.trim(),
        category: editForm.category,
        basePrice: price,
        oldPrice,
        stockQuantity: stock,
        tag: editForm.tag.trim() || "Nou",
        description: editForm.description.trim(),
        bestseller: editForm.bestseller,
        active: editForm.active,
        imageSrc: editingProduct.imageSrc,
        specs: {
          power: editForm.specPower.trim() || "—",
          speed: editingProduct.specs.speed,
          material: editForm.specMaterial.trim() || "—",
          chip: editingProduct.specs.chip,
        },
        options: editingProduct.options,
        modifiers: editingProduct.modifiers,
      });

      if (!result.ok) {
        showMessage(result.message);
        return;
      }

      closeEditorModal();
      await reloadProducts();
      showMessage("Produs actualizat! Modificările sunt active imediat pe site.");
      return;
    }

    if (!editingProduct) return;

    const updates: ProductOverride = {
      title: editForm.title.trim(),
      tag: editForm.tag.trim(),
      description: editForm.description.trim(),
      basePrice: price,
      stockQuantity: stock,
      bestseller: editForm.bestseller,
      active: editForm.active,
    };

    if (oldPrice !== undefined) {
      updates.oldPrice = oldPrice;
    }

    if (isBundleProduct(editingProduct.category)) {
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

    closeEditorModal();
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

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-500">
          Editează prețuri, titluri, tag-uri și descrieri. Modificările se salvează pe server și
          apar pe toate dispozitivele (desktop, telefon) după reîncărcare sau în max. 30 secunde.
        </p>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-purple-700"
        >
          <Plus size={16} />
          Adaugă produs nou
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-novra-card/30">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-[10px] uppercase tracking-widest text-gray-500">
              <th className="px-4 py-4 sm:px-6">Produs</th>
              <th className="px-4 py-4">Categorie</th>
              <th className="px-4 py-4">Tag</th>
              <th className="px-4 py-4">Imagine</th>
              <th className="px-4 py-4">Bestseller</th>
              <th className="px-4 py-4">Stoc</th>
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
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    <p className="text-[10px] text-gray-600">{product.id}</p>
                    {product.isCustom && (
                      <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] text-emerald-300">
                        Personalizat
                      </span>
                    )}
                    {product.active === false && (
                      <span className="rounded-full bg-gray-500/15 px-2 py-0.5 text-[10px] text-gray-400">
                        Ascuns
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className="rounded-full bg-purple-600/15 px-2 py-0.5 text-xs text-purple-300">
                    {categoryLabel(product.category)}
                  </span>
                </td>
                <td className="px-4 py-4 text-xs text-purple-200">{product.tag}</td>
                <td className="px-4 py-4">
                  <div className="flex items-start gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`${toImageApiUrl(getProductImagePath(product))}&v=${imageVersion}`}
                      alt={product.title}
                      className="h-12 w-12 rounded-lg border border-white/10 object-cover bg-novra-bg/50"
                    />
                    <div>
                      <p className="font-mono text-[10px] text-gray-400 break-all max-w-[180px]">
                        {getProductImagePath(product)}
                      </p>
                      <label className="mt-2 inline-flex cursor-pointer items-center gap-1 text-[10px] text-purple-300 hover:text-purple-200">
                        <Upload size={10} />
                        <span>Încarcă</span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const path = getProductImagePath(product).replace(/^\//, "");
                            void handleImageUpload(path, file);
                            e.target.value = "";
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </td>
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
                    step="1"
                    min="0"
                    value={stockEdits[product.id] ?? String(getProductStockQuantity(product))}
                    onChange={(e) =>
                      setStockEdits((prev) => ({ ...prev, [product.id]: e.target.value }))
                    }
                    className="w-24 rounded-lg border border-white/10 bg-novra-bg/50 px-3 py-2 text-sm text-white outline-none focus:border-purple-500/50"
                  />
                  <button
                    type="button"
                    onClick={() => void handleSaveStock(product.id)}
                    className="mt-2 inline-flex items-center gap-1 rounded-lg border border-white/10 bg-novra-bg/50 px-2 py-1 text-[10px] font-semibold text-gray-200 transition hover:border-purple-500/40"
                  >
                    <Save size={12} />
                    Salvează stoc
                  </button>
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
                    {product.isCustom && (
                      <button
                        type="button"
                        onClick={() => void handleDeleteProduct(product)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-300 transition hover:border-red-500/40"
                      >
                        <Trash2 size={14} />
                        Șterge
                      </button>
                    )}
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

      {(editingProduct || isCreating) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-novra-card p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {isCreating ? "Adaugă produs nou" : "Editează produs"}
                </h3>
                <p className="text-xs text-gray-500">
                  {isCreating ? "Produs nou în catalog" : editingProduct?.id}
                </p>
              </div>
              <button
                type="button"
                onClick={closeEditorModal}
                className="rounded-lg p-1 text-gray-400 hover:bg-white/10 hover:text-white"
                aria-label="Închide"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {isCreating && (
                <div>
                  <label className="mb-1 block text-xs uppercase tracking-widest text-gray-500">
                    Slug / ID
                  </label>
                  <input
                    value={editForm.id}
                    onChange={(e) => setEditForm({ ...editForm, id: e.target.value })}
                    placeholder={slugFromTitle(editForm.title || "produs-nou")}
                    className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-sm outline-none focus:border-purple-500/50"
                  />
                  <p className="mt-1 text-[10px] text-gray-500">
                    Se generează automat din nume dacă lași gol.
                  </p>
                </div>
              )}
              <div>
                <label className="mb-1 block text-xs uppercase tracking-widest text-gray-500">Nume</label>
                <input
                  value={editForm.title}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      title: e.target.value,
                      id: isCreating && !editForm.id.trim() ? slugFromTitle(e.target.value) : editForm.id,
                    })
                  }
                  className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-sm outline-none focus:border-purple-500/50"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs uppercase tracking-widest text-gray-500">Subtitlu</label>
                <input
                  value={editForm.subtitle}
                  onChange={(e) => setEditForm({ ...editForm, subtitle: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-sm outline-none focus:border-purple-500/50"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs uppercase tracking-widest text-gray-500">Categorie</label>
                <select
                  value={editForm.category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  disabled={!isCreating && editingProduct != null && !editingProduct.isCustom}
                  className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-sm outline-none focus:border-purple-500/50 disabled:opacity-60"
                >
                  {CATALOG_CATEGORIES.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs uppercase tracking-widest text-gray-500">Tag</label>
                <input
                  value={editForm.tag}
                  onChange={(e) => setEditForm({ ...editForm, tag: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-sm outline-none focus:border-purple-500/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
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
                  <label className="mb-1 block text-xs uppercase tracking-widest text-gray-500">Preț vechi (opțional)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editForm.oldPrice}
                    onChange={(e) => setEditForm({ ...editForm, oldPrice: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-sm outline-none focus:border-purple-500/50"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs uppercase tracking-widest text-gray-500">Stoc (bucăți)</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={editForm.stockQuantity}
                  onChange={(e) => setEditForm({ ...editForm, stockQuantity: e.target.value })}
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

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editForm.active}
                  onChange={(e) => setEditForm({ ...editForm, active: e.target.checked })}
                  className="h-4 w-4 rounded border-white/20 bg-novra-bg/50 text-purple-500 focus:ring-purple-500/50"
                />
                <span className="text-sm text-gray-300">Produs activ / vizibil pe site</span>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs uppercase tracking-widest text-gray-500">Specificație putere</label>
                  <input
                    value={editForm.specPower}
                    onChange={(e) => setEditForm({ ...editForm, specPower: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-sm outline-none focus:border-purple-500/50"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs uppercase tracking-widest text-gray-500">Specificație material</label>
                  <input
                    value={editForm.specMaterial}
                    onChange={(e) => setEditForm({ ...editForm, specMaterial: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-sm outline-none focus:border-purple-500/50"
                  />
                </div>
              </div>

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

              {(editingProduct || isCreating) && (
                <div className="rounded-xl border border-white/8 bg-novra-bg/30 p-4 space-y-3">
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-gray-500">
                    <ImageIcon size={14} className="text-purple-400" />
                    Imagini produs
                  </p>
                  <div className="space-y-3">
                    {(editingProduct
                      ? getProductImageTargets(editingProduct)
                      : [
                          {
                            label: "Imagine principală",
                            path: getCustomProductImagePath(editForm.id.trim() || slugFromTitle(editForm.title || "produs-nou")),
                          },
                        ]
                    ).map((target) => (
                      <div
                        key={target.path}
                        className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border border-white/8 bg-novra-bg/40 p-3"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`${toImageApiUrl(`/${target.path}`)}&v=${imageVersion}`}
                            alt={target.label}
                            className="h-14 w-14 rounded-lg border border-white/10 object-cover"
                          />
                          <div className="min-w-0">
                            <p className="text-sm text-white">{target.label}</p>
                            <p className="text-[10px] text-gray-500 font-mono truncate">{target.path}</p>
                          </div>
                        </div>
                        <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-purple-500/30 bg-purple-600/10 px-3 py-2 text-xs font-semibold text-purple-200 hover:bg-purple-600/20">
                          <Upload size={12} />
                          {uploadingImagePath === target.path ? "Se încarcă..." : "Încarcă"}
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            className="hidden"
                            disabled={uploadingImagePath === target.path}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              void handleImageUpload(target.path, file);
                              e.target.value = "";
                            }}
                          />
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => void handleSaveFullEdit()}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-3 text-sm font-semibold text-white hover:bg-purple-700"
              >
                <Save size={16} />
                {isCreating ? "Creează produsul" : "Salvează modificările"}
              </button>
              <button
                type="button"
                onClick={closeEditorModal}
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
