import "server-only";

import {
  CATALOG_PRODUCTS,
  VALID_CATEGORY_IDS,
  withProductImagesFromStored,
  type CatalogProduct,
  type StoredCustomProduct,
} from "@/lib/catalog";
import { readJsonFile, writeJsonFile } from "@/lib/server-data";

export const CUSTOM_PRODUCTS_FILE = "custom-products.json";

export type CustomProductInput = {
  id?: string;
  title: string;
  subtitle?: string;
  category: string;
  basePrice: number;
  oldPrice?: number | null;
  stockQuantity?: number;
  imageSrc?: string;
  tag?: string;
  description: string;
  bestseller?: boolean;
  active?: boolean;
  specs?: Partial<CatalogProduct["specs"]>;
  options?: string[];
  modifiers?: number[];
};

function nowIso(): string {
  return new Date().toISOString();
}

export function normalizeProductSlug(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function slugFromTitle(title: string): string {
  const slug = normalizeProductSlug(title.trim());
  return slug || `produs-${Date.now()}`;
}

const DEFAULT_SPECS: CatalogProduct["specs"] = {
  power: "—",
  speed: "—",
  material: "—",
  chip: "—",
};

export async function readCustomProducts(): Promise<StoredCustomProduct[]> {
  return readJsonFile<StoredCustomProduct[]>(CUSTOM_PRODUCTS_FILE, []);
}

export async function writeCustomProducts(products: StoredCustomProduct[]): Promise<void> {
  await writeJsonFile(CUSTOM_PRODUCTS_FILE, products);
}

export function getAllKnownProductIds(customProducts: StoredCustomProduct[]): Set<string> {
  const ids = new Set(CATALOG_PRODUCTS.map((product) => product.id));
  for (const product of customProducts) {
    ids.add(product.id);
  }
  return ids;
}

export async function getActiveCustomProducts(): Promise<CatalogProduct[]> {
  const stored = await readCustomProducts();
  return stored
    .filter((product) => product.active !== false)
    .map(withProductImagesFromStored);
}

export async function getAllCustomCatalogProducts(): Promise<CatalogProduct[]> {
  const stored = await readCustomProducts();
  return stored.map(withProductImagesFromStored);
}

function isSlugTaken(slug: string, products: StoredCustomProduct[], excludeId?: string): boolean {
  if (CATALOG_PRODUCTS.some((product) => product.id === slug)) return true;
  return products.some((product) => product.id === slug && product.id !== excludeId);
}

function resolveUniqueId(
  requestedId: string | undefined,
  title: string,
  products: StoredCustomProduct[],
  excludeId?: string
): string {
  const base = normalizeProductSlug(requestedId?.trim() || slugFromTitle(title));
  if (!base) return `produs-${Date.now()}`;

  if (!isSlugTaken(base, products, excludeId)) return base;

  let index = 2;
  while (isSlugTaken(`${base}-${index}`, products, excludeId)) {
    index += 1;
  }
  return `${base}-${index}`;
}

function normalizeCustomProductInput(
  input: CustomProductInput,
  products: StoredCustomProduct[],
  existing?: StoredCustomProduct
): StoredCustomProduct {
  const ts = nowIso();
  const title = input.title.trim();
  const category = VALID_CATEGORY_IDS.has(input.category) ? input.category : "usb-c";

  return {
    id: existing?.id ?? resolveUniqueId(input.id, title, products, existing?.id),
    title,
    subtitle: input.subtitle?.trim() || title,
    category,
    basePrice: Math.max(0, Number(input.basePrice) || 0),
    oldPrice:
      input.oldPrice === null || input.oldPrice === undefined
        ? undefined
        : Math.max(0, Number(input.oldPrice) || 0),
    stockQuantity: Math.max(0, Math.floor(input.stockQuantity ?? existing?.stockQuantity ?? 100)),
    imageSrc: input.imageSrc?.trim() || existing?.imageSrc,
    tag: input.tag?.trim() || "Nou",
    description: input.description.trim(),
    bestseller: input.bestseller ?? existing?.bestseller ?? false,
    active: input.active ?? existing?.active ?? true,
    specs: {
      ...DEFAULT_SPECS,
      ...existing?.specs,
      ...input.specs,
    },
    options: input.options ?? existing?.options ?? [],
    modifiers: input.modifiers ?? existing?.modifiers ?? [],
    createdAt: existing?.createdAt ?? ts,
    updatedAt: ts,
  };
}

export async function createCustomProduct(
  input: CustomProductInput
): Promise<{ ok: true; product: StoredCustomProduct } | { ok: false; message: string }> {
  if (!input.title?.trim()) {
    return { ok: false, message: "Numele produsului este obligatoriu." };
  }
  if (!input.description?.trim()) {
    return { ok: false, message: "Descrierea este obligatorie." };
  }
  if (!VALID_CATEGORY_IDS.has(input.category)) {
    return { ok: false, message: "Categoria selectată nu este validă." };
  }
  if (!Number.isFinite(input.basePrice) || input.basePrice <= 0) {
    return { ok: false, message: "Introdu un preț valid." };
  }

  const products = await readCustomProducts();
  const product = normalizeCustomProductInput(input, products);
  product.id = resolveUniqueId(input.id, product.title, products);

  products.unshift(product);
  await writeCustomProducts(products);
  return { ok: true, product };
}

export async function updateCustomProduct(
  input: CustomProductInput & { id: string }
): Promise<{ ok: true; product: StoredCustomProduct } | { ok: false; message: string }> {
  const products = await readCustomProducts();
  const index = products.findIndex((product) => product.id === input.id);
  if (index === -1) {
    return { ok: false, message: "Produsul personalizat nu a fost găsit." };
  }

  const existing = products[index];
  const product = normalizeCustomProductInput(input, products, existing);
  const normalizedId = product.id;

  if (normalizedId !== existing.id) {
    products.splice(index, 1);
    products.unshift(product);
  } else {
    products[index] = product;
  }

  await writeCustomProducts(products);
  return { ok: true, product };
}

export async function deleteCustomProduct(
  id: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  const products = await readCustomProducts();
  const filtered = products.filter((product) => product.id !== id);
  if (filtered.length === products.length) {
    return { ok: false, message: "Produsul personalizat nu a fost găsit." };
  }
  await writeCustomProducts(filtered);
  return { ok: true };
}

export function isBuiltInProductId(id: string): boolean {
  return CATALOG_PRODUCTS.some((product) => product.id === id);
}

export async function findCustomProductById(id: string): Promise<StoredCustomProduct | null> {
  const products = await readCustomProducts();
  return products.find((product) => product.id === id) ?? null;
}
