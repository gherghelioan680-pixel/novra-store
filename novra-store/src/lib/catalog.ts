import { apiFetch, getApiHeaders } from "./api-client";
import { dispatchStoreUpdate, STORAGE_KEYS } from "./store";

export const DEFAULT_STOCK_QUANTITY = 100;

export type CatalogProduct = {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  basePrice: number;
  stockQuantity: number;
  imageSrc: string;
  image: string;
  tag: string;
  description: string;
  bestseller?: boolean;
  specs: {
    power: string;
    speed: string;
    material: string;
    chip: string;
  };
  options: string[];
  modifiers: number[];
};

export const PRODUCT_IMAGE_FOLDER: Record<string, string> = {
  "usb-c": "cabluri",
  lightning: "adaptoare",
  accesorii: "bundle",
};

export const PRODUCT_IMAGE_FILES: Record<string, string> = {
  "usb-c-100w": "violet.png",
  "usb-c-pro-240w": "albastru.png",
  "usb-a-c-100w": "roz.png",
  "usb-c-lightning-pd": "violet.png",
  "usb-a-lightning-classic": "albastru.png",
  "usb-c-lightning-flex": "roz.png",
  "incarcator-gan-65w": "novra-bundle-preview.png",
  "incarcator-auto-metal": "novra-bundle-preview.png",
  "bundle-travel-pack": "novra-bundle-preview.png",
};

/** Slug-uri fișiere pentru variantele de culoare (index aliniat cu BUNDLE_COLORS). */
export const BUNDLE_COLOR_SLUGS = ["violet", "albastru", "roz"] as const;

export function getAdapterColorImage(colorIdx: number): string {
  const slug = BUNDLE_COLOR_SLUGS[colorIdx] ?? BUNDLE_COLOR_SLUGS[0];
  return `/products/adaptoare/${slug}.png`;
}

export function getCableColorImage(colorIdx: number): string {
  const slug = BUNDLE_COLOR_SLUGS[colorIdx] ?? BUNDLE_COLOR_SLUGS[0];
  return `/products/cabluri/${slug}.png`;
}

export function getBundleColorImage(type: "adapter" | "cable", colorIdx: number): string {
  return type === "adapter" ? getAdapterColorImage(colorIdx) : getCableColorImage(colorIdx);
}

const CATEGORY_PLACEHOLDERS: Record<string, string> = {
  cabluri: "/products/placeholders/cabluri.svg",
  adaptoare: "/products/placeholders/adaptoare.svg",
  bundle: "/products/placeholders/bundle.svg",
};

export function getProductImageFolder(category: string): string {
  return PRODUCT_IMAGE_FOLDER[category] ?? "cabluri";
}

export function getProductImagePath(product: Pick<CatalogProduct, "id" | "category">): string {
  const folder = getProductImageFolder(product.category);
  const filename = PRODUCT_IMAGE_FILES[product.id];
  if (filename) return `/products/${folder}/${filename}`;
  return getProductImageFallback(product.category);
}

export function getProductImageFallback(category: string): string {
  const folder = getProductImageFolder(category);
  return CATEGORY_PLACEHOLDERS[folder] ?? CATEGORY_PLACEHOLDERS.cabluri;
}

function withProductImages(
  product: Omit<CatalogProduct, "image" | "imageSrc" | "stockQuantity"> &
    Partial<Pick<CatalogProduct, "image" | "imageSrc" | "stockQuantity">>
): CatalogProduct {
  const imageSrc = product.imageSrc ?? getProductImagePath(product as Pick<CatalogProduct, "id" | "category">);
  return {
    ...product,
    stockQuantity: product.stockQuantity ?? DEFAULT_STOCK_QUANTITY,
    imageSrc,
    image: product.image ?? imageSrc,
  };
}

export const CATALOG_PRODUCTS: CatalogProduct[] = [
  withProductImages({
    id: "usb-c-100w",
    title: "NOVRA UltraCharge 100W",
    subtitle: "USB-C to USB-C Premium Cable",
    category: "usb-c",
    basePrice: 79.99,
    tag: "Popular",
    description:
      "Cablu de înaltă performanță echipat cu cip inteligent E-Mark. Ideal pentru MacBook Pro, laptopuri, iPad-uri și smartphone-uri de ultimă generație care necesită Power Delivery masiv.",
    specs: {
      power: "100W Power Delivery (20V/5A)",
      speed: "480 Mbps Sincronizare Date",
      material: "Nylon Balistic Împletit + Aliaj Aluminiu",
      chip: "E-Mark Smart Chip Integrat",
    },
    options: ["1M", "2M"],
    modifiers: [0, 0],
  }),
  withProductImages({
    id: "usb-c-pro-240w",
    title: "NOVRA HyperPower 240W",
    subtitle: "Next-Gen PD 3.1 USB-C Cable",
    category: "usb-c",
    basePrice: 79.99,
    tag: "Performanță Extremă",
    description:
      "Pregătit pentru viitor. Suportă noul standard USB Power Delivery 3.1 de până la 240W. Creat special pentru stații de lucru grafice și cele mai gurande laptopuri de gaming.",
    specs: {
      power: "240W Extended Power Range (48V/5A)",
      speed: "480 Mbps Sincronizare Date",
      material: "Kevlar Core + Înveliș Dublu Împletit",
      chip: "PD 3.1 E-Mark Pro Chip",
    },
    options: ["1M", "2M"],
    modifiers: [0, 0],
  }),
  withProductImages({
    id: "usb-a-c-100w",
    title: "NOVRA Hybrid 100W",
    subtitle: "USB-A to USB-C Fast Charge",
    category: "usb-c",
    basePrice: 79.99,
    tag: "Versatil",
    description:
      "Conexiunea perfectă între încărcătoarele clasice USB-A și dispozitivele moderne USB-C. Suportă protocoale de încărcare rapidă Quick Charge și SuperCharge.",
    specs: {
      power: "100W Max (Compatibilitate Multi-Protocol)",
      speed: "480 Mbps Sincronizare Date",
      material: "Nylon împletit de înaltă densitate",
      chip: "Cip inteligent de reglare a tensiunii",
    },
    options: ["1M", "2M"],
    modifiers: [0, 0],
  }),
  withProductImages({
    id: "usb-c-lightning-pd",
    title: "NOVRA AppleCharge Pro",
    subtitle: "USB-C to Lightning Fast Charge",
    category: "lightning",
    basePrice: 99.99,
    tag: "iOS Recomandat",
    bestseller: true,
    description:
      "Cablu premium de mare viteză, complet compatibil cu standardul Apple Power Delivery. Permite încărcarea rapidă a iPhone-ului de la 0% la 50% în doar 30 de minute folosind un adaptor PD.",
    specs: {
      power: "27W Max Power Delivery Fast Charge",
      speed: "480 Mbps Sincronizare de mare viteză",
      material: "Nylon împletit în 48 de straturi + Conectori Zinc",
      chip: "Cip Smart iChip pentru protecția bateriei iOS",
    },
    options: ["Violet"],
    modifiers: [0],
  }),
  withProductImages({
    id: "usb-a-lightning-classic",
    title: "NOVRA Lightning Classic",
    subtitle: "USB-A to Lightning Durable Cable",
    category: "lightning",
    basePrice: 99.99,
    tag: "Ultra-Durabil",
    description:
      "Conexiunea clasică, optimizată pentru durabilitate extremă. Structura internă ranforsată previne ruperea la îmbinări, fiind perfect pentru utilizarea zilnică acasă sau în mașină prin Apple CarPlay.",
    specs: {
      power: "12W / 2.4A Standard Charge",
      speed: "480 Mbps Transfer stabil de date",
      material: "TPE Flexibil + Ranforsare cu fibră aramidică",
      chip: "Cip inteligent anti-supraîncălzire",
    },
    options: ["Blue"],
    modifiers: [0],
  }),
  withProductImages({
    id: "usb-c-lightning-flex",
    title: "NOVRA FlexLink Nova",
    subtitle: "USB-C to Lightning MagSafe Ready",
    category: "lightning",
    basePrice: 99.99,
    tag: "Design Compact",
    description:
      "Adaptor premium ultra-subțire, optimizat pentru încărcare wireless MagSafe și Power Delivery simultan. Conectori din aliaj anodizat și cablu flexibil din silicon medical pentru utilizare zilnică fără încurcare.",
    specs: {
      power: "20W Max PD + Compatibilitate MagSafe",
      speed: "480 Mbps Sincronizare stabilă de date",
      material: "Silicon Premium + Conectori Aluminiu Anodizat",
      chip: "Cip MFi certificat cu protecție termică activă",
    },
    options: ["Roz"],
    modifiers: [0],
  }),
  withProductImages({
    id: "incarcator-gan-65w",
    title: "NOVRA GaN Nova 65W",
    subtitle: "Triple-Port Fast Wall Charger + Cable",
    category: "accesorii",
    basePrice: 159.99,
    tag: "Tehnologie GaN",
    description:
      "Încărcător de rețea ultra-compact alimentat de tehnologia de ultimă generație GaN (Galiu Nitrură). Dispune de 3 porturi inteligente (2x USB-C + 1x USB-A) capabile să încarce simultan un MacBook Pro, un iPhone și o pereche de căști la viteză maximă. Personalizează independent culoarea adaptorului și a cablului inclus.",
    specs: {
      power: "65W Max Smart Allocation",
      speed: "Power Delivery 3.0 / Quick Charge 4.0",
      material: "Policarbonat Ignifug + Cablu Nylon",
      chip: "GaNSafe cip pentru controlul temperaturii",
    },
    options: [],
    modifiers: [],
  }),
  withProductImages({
    id: "incarcator-auto-metal",
    title: "NOVRA DriveSpeed 45W",
    subtitle: "Dual USB-C Metal Car Charger + Cable",
    category: "accesorii",
    basePrice: 159.99,
    tag: "Metal Premium",
    description:
      "Creat integral dintr-un aliaj premium de aluminiu pentru o disipare optimă a căldurii. Se potrivește perfect în bricheta mașinii tale și oferă două porturi USB-C independente, asigurând încărcare ultra-rapidă chiar și în cele mai scurte călătorii. Alege orice combinație de culori pentru adaptor și cablu.",
    specs: {
      power: "45W Total (25W + 20W Dual PD)",
      speed: "Suport stabil pentru sisteme GPS și iOS/Android",
      material: "Aliaj de Aluminiu Anodizat + Cablu Premium",
      chip: "Protecție inteligentă la supratensiune auto",
    },
    options: [],
    modifiers: [],
  }),
  withProductImages({
    id: "bundle-travel-pack",
    title: "NOVRA TravelPack Duo",
    subtitle: "GaN Travel Charger + Braided Cable Kit",
    category: "accesorii",
    basePrice: 159.99,
    tag: "Kit Călătorie",
    bestseller: true,
    description:
      "Set complet pentru mobilitate: încărcător GaN compact cu cablu premium împletit, ambalate într-un kit elegant. Ideal pentru birou, călătorii sau cadou — configurează independent culoarea adaptorului și a cablului din paleta NOVRA.",
    specs: {
      power: "65W PD + Cablu 100W compatibil",
      speed: "Power Delivery 3.0 / Transfer 480 Mbps",
      material: "GaN Shell + Nylon Balistic Cablu",
      chip: "GaNSafe + E-Mark Smart Chip",
    },
    options: [],
    modifiers: [],
  }),
];

export const CATALOG_CATEGORIES = [
  { id: "usb-c", label: "Cabluri" },
  { id: "lightning", label: "Adaptoare" },
  { id: "accesorii", label: "Cablu + Adaptor" },
] as const;

export const VALID_CATEGORY_IDS = new Set<string>(CATALOG_CATEGORIES.map((cat) => cat.id));

const USB_C_CABLE_IDS = new Set(["usb-c-100w", "usb-c-pro-240w", "usb-a-c-100w"]);

export const isUsbCCable = (productId: string) => USB_C_CABLE_IDS.has(productId);

export const isLockedVariant = (productId: string, optionIndex: number) =>
  isUsbCCable(productId) && optionIndex >= 1;

export const isAdapterProduct = (category: string) => category === "lightning";

export const isBundleProduct = (category: string) => category === "accesorii";

export const BUNDLE_COLORS = ["Violet", "Blue", "Roz"] as const;

export function getAdapterProductImage(option: string): string {
  const colorIdx = BUNDLE_COLORS.indexOf(option as (typeof BUNDLE_COLORS)[number]);
  return getAdapterColorImage(colorIdx >= 0 ? colorIdx : 0);
}

export const DEFAULT_BUNDLE_SELECTIONS: Record<string, { adapterIdx: number; cableIdx: number }> = {
  "incarcator-gan-65w": { adapterIdx: 0, cableIdx: 1 },
  "incarcator-auto-metal": { adapterIdx: 0, cableIdx: 0 },
  "bundle-travel-pack": { adapterIdx: 2, cableIdx: 2 },
};

export const ADAPTER_COLOR_STYLES: Record<
  string,
  { text: string; border: string; bg: string; selectedBg: string }
> = {
  Violet: {
    text: "text-violet-400",
    border: "border-violet-400/60",
    bg: "bg-violet-500/10",
    selectedBg: "bg-violet-500/20",
  },
  Blue: {
    text: "text-blue-400",
    border: "border-blue-400/60",
    bg: "bg-blue-500/10",
    selectedBg: "bg-blue-500/20",
  },
  Roz: {
    text: "text-pink-400",
    border: "border-pink-400/60",
    bg: "bg-pink-500/10",
    selectedBg: "bg-pink-500/20",
  },
};

export const getBundleVariantLabel = (adapterIdx: number, cableIdx: number) =>
  `Adaptor: ${BUNDLE_COLORS[adapterIdx]} / Cablu: ${BUNDLE_COLORS[cableIdx]}`;

export type ProductOverride = Partial<
  Pick<
    CatalogProduct,
    "title" | "description" | "tag" | "basePrice" | "bestseller" | "stockQuantity"
  >
> & {
  /** Suprascrie economiile bundle calculate automat; null = folosește calculul automat */
  bundleSavingsOverride?: number | null;
};

export function getProductStockQuantity(
  product: Pick<CatalogProduct, "id" | "stockQuantity">
): number {
  const override = getProductOverrides()[product.id]?.stockQuantity;
  if (override !== undefined) return Math.max(0, Math.floor(override));
  return product.stockQuantity ?? DEFAULT_STOCK_QUANTITY;
}

export function formatStockLabel(quantity: number): string {
  const normalized = Math.max(0, Math.floor(quantity));
  if (normalized <= 0) return "Stoc epuizat";
  if (normalized === 1) return "1 bucată în stoc";
  return `${normalized} bucăți în stoc`;
}

export function isProductInStock(product: Pick<CatalogProduct, "id" | "stockQuantity">): boolean {
  return getProductStockQuantity(product) > 0;
}

export function getCartQuantityForProduct(
  items: Array<{ productId: string; quantity: number }>,
  productId: string
): number {
  return items
    .filter((item) => item.productId === productId)
    .reduce((sum, item) => sum + item.quantity, 0);
}

export function validateCartStock(
  items: Array<{ productId: string; quantity: number }>
): { ok: true } | { ok: false; message: string } {
  const required = new Map<string, number>();

  for (const item of items) {
    required.set(item.productId, (required.get(item.productId) ?? 0) + item.quantity);
  }

  const shortages: string[] = [];

  for (const [productId, quantity] of required) {
    const product = getProductById(productId);
    if (!product) {
      return { ok: false, message: "Un produs din coș nu mai este disponibil." };
    }

    const available = getProductStockQuantity(product);
    if (quantity > available) {
      shortages.push(
        `${product.title}: solicitat ${quantity}, disponibil ${available}`
      );
    }
  }

  if (shortages.length === 0) return { ok: true };
  return { ok: false, message: `Stoc insuficient. ${shortages.join("; ")}` };
}

function isBrowser() {
  return typeof window !== "undefined";
}

function normalizeOverrides(
  parsed: Record<string, ProductOverride | number>
): Record<string, ProductOverride> {
  const normalized: Record<string, ProductOverride> = {};
  for (const [id, value] of Object.entries(parsed)) {
    if (typeof value === "number") {
      normalized[id] = { basePrice: value };
    } else {
      normalized[id] = value;
    }
  }
  return normalized;
}

function cacheProductOverrides(overrides: Record<string, ProductOverride>): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEYS.products, JSON.stringify(overrides));
  } catch {
    /* ignore */
  }
}

export function getProductOverrides(): Record<string, ProductOverride> {
  if (!isBrowser()) return {};

  try {
    const stored = window.localStorage.getItem(STORAGE_KEYS.products);
    if (!stored) return {};
    return normalizeOverrides(JSON.parse(stored) as Record<string, ProductOverride | number>);
  } catch {
    return {};
  }
}

export async function loadProductOverrides(): Promise<Record<string, ProductOverride>> {
  const fromApi = await apiFetch<{ overrides: Record<string, ProductOverride> }>("/api/store/products");
  if (fromApi?.overrides) {
    cacheProductOverrides(fromApi.overrides);
    return fromApi.overrides;
  }
  return getProductOverrides();
}

/** @deprecated Use getProductOverrides */
export function getProductPriceOverrides(): Record<string, number> {
  const overrides = getProductOverrides();
  const prices: Record<string, number> = {};
  for (const [id, override] of Object.entries(overrides)) {
    if (override.basePrice !== undefined) prices[id] = override.basePrice;
  }
  return prices;
}

export async function saveProductOverride(
  productId: string,
  updates: ProductOverride
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!isBrowser()) {
    return { ok: false, message: "Acțiunea nu poate fi efectuată în acest moment." };
  }

  try {
    const response = await fetch("/api/store/products", {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify({ productId, updates }),
    });

    if (!response.ok) {
      return { ok: false, message: "Nu s-au putut salva modificările pe server." };
    }

    const data = (await response.json()) as { overrides: Record<string, ProductOverride> };
    cacheProductOverrides(data.overrides);
    dispatchStoreUpdate({ scope: "products" });
    return { ok: true };
  } catch {
    return { ok: false, message: "Nu s-au putut salva modificările." };
  }
}

export async function saveProductPriceOverride(
  productId: string,
  price: number
): Promise<{ ok: true } | { ok: false; message: string }> {
  return saveProductOverride(productId, { basePrice: price });
}

export function applyProductOverrides(product: CatalogProduct): CatalogProduct {
  const override = getProductOverrides()[product.id];
  if (!override) return product;
  const applicable: Partial<CatalogProduct> = { ...override };
  delete (applicable as ProductOverride).bundleSavingsOverride;
  return { ...product, ...applicable };
}

/** @deprecated Use applyProductOverrides */
export function applyPriceOverrides(product: CatalogProduct): CatalogProduct {
  return applyProductOverrides(product);
}

export function getCatalogProducts(): CatalogProduct[] {
  return CATALOG_PRODUCTS.map(applyProductOverrides);
}

export function getProductsByCategory(category: string): CatalogProduct[] {
  return getCatalogProducts().filter((p) => p.category === category);
}

export function getProductById(id: string): CatalogProduct | undefined {
  const product = CATALOG_PRODUCTS.find((p) => p.id === id);
  return product ? applyProductOverrides(product) : undefined;
}

/** Economii bundle = preț cablu + adaptor minus preț pachet (sau override admin) */
export function getBundleSavings(product: CatalogProduct): number | null {
  if (!isBundleProduct(product.category)) return null;

  const override = getProductOverrides()[product.id]?.bundleSavingsOverride;
  if (override !== undefined && override !== null) {
    return override > 0 ? override : null;
  }

  const cablePrices = getCatalogProducts()
    .filter((p) => p.category === "usb-c")
    .map((p) => p.basePrice);
  const adapterPrices = getCatalogProducts()
    .filter((p) => p.category === "lightning")
    .map((p) => p.basePrice);

  if (!cablePrices.length || !adapterPrices.length) return null;

  const separateTotal = Math.min(...cablePrices) + Math.min(...adapterPrices);
  const savings = Math.round((separateTotal - product.basePrice) * 100) / 100;
  return savings > 0 ? savings : null;
}

export function buildProductUrl(productId: string) {
  return `/produse/${productId}`;
}

export function buildCartAddUrl(params: {
  productId: string;
  variantLabel: string;
  unitPrice: number;
}) {
  const search = new URLSearchParams({
    add: params.productId,
    variant: params.variantLabel,
    price: params.unitPrice.toFixed(2),
  });
  return `/cos?${search.toString()}`;
}

export function buildProduseUrl(params: { category?: string }) {
  const search = new URLSearchParams();
  if (params.category) search.set("category", params.category);
  const query = search.toString();
  return query ? `/produse?${query}` : "/produse";
}
