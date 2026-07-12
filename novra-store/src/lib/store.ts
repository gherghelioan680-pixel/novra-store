export const NOVRA_STORE_UPDATED = "novra-store-updated";

export const STORAGE_KEYS = {
  products: "novra-admin-products",
  settings: "novra-site-settings",
  reviews: "novra-reviews",
  orders: "novra-orders",
  newsletter: "novra-newsletter",
  discountCodes: "novra-discount-codes",
  users: "novra-users",
} as const;

export type StoreUpdateDetail = {
  scope?: "products" | "settings" | "reviews" | "orders" | "newsletter" | "discountCodes" | "users" | "credits" | "affiliates" | "campaigns" | "blog" | "referrals" | "push";
};

const STORE_STORAGE_KEYS = new Set<string>(Object.values(STORAGE_KEYS));
const REFRESH_DEBOUNCE_MS = 150;
const DISPATCH_DEBOUNCE_MS = 50;

function isBrowser() {
  return typeof window !== "undefined";
}

let dispatchTimer: number | null = null;
let pendingDetail: StoreUpdateDetail | undefined;

export function dispatchStoreUpdate(detail?: StoreUpdateDetail): void {
  if (!isBrowser()) return;

  pendingDetail = detail ?? pendingDetail;
  if (dispatchTimer) return;

  dispatchTimer = window.setTimeout(() => {
    dispatchTimer = null;
    const eventDetail = pendingDetail;
    pendingDetail = undefined;
    window.dispatchEvent(new CustomEvent(NOVRA_STORE_UPDATED, { detail: eventDetail }));
  }, DISPATCH_DEBOUNCE_MS);
}

type RefreshEntry = {
  refresh: () => void | Promise<void>;
  scopes: Set<StoreUpdateDetail["scope"]> | null;
};

const refreshEntries = new Set<RefreshEntry>();
let globalPollInterval: number | null = null;
let globalDebounceTimer: number | null = null;
let pendingRefresh: { mode: "all" } | { mode: "event"; detail?: StoreUpdateDetail } | null = null;

function matchesScope(
  scopes: Set<StoreUpdateDetail["scope"]> | null,
  detail?: StoreUpdateDetail
): boolean {
  if (!scopes) return true;
  if (!detail?.scope) return true;
  return scopes.has(detail.scope);
}

function runRefreshEntry(entry: RefreshEntry): void {
  void Promise.resolve(entry.refresh());
}

function flushPendingRefresh(): void {
  const current = pendingRefresh ?? { mode: "all" as const };
  pendingRefresh = null;

  if (current.mode === "all") {
    for (const entry of refreshEntries) {
      runRefreshEntry(entry);
    }
    return;
  }

  for (const entry of refreshEntries) {
    if (matchesScope(entry.scopes, current.detail)) {
      runRefreshEntry(entry);
    }
  }
}

function queueRefresh(next: { mode: "all" } | { mode: "event"; detail?: StoreUpdateDetail }): void {
  if (next.mode === "all") {
    pendingRefresh = { mode: "all" };
  } else if (pendingRefresh?.mode !== "all") {
    pendingRefresh = next;
  }

  if (globalDebounceTimer) return;
  globalDebounceTimer = window.setTimeout(() => {
    globalDebounceTimer = null;
    flushPendingRefresh();
  }, REFRESH_DEBOUNCE_MS);
}

function ensureGlobalPoll(): void {
  if (globalPollInterval !== null) return;
  globalPollInterval = window.setInterval(() => queueRefresh({ mode: "all" }), STORE_POLL_INTERVAL_MS);
}

function stopGlobalPoll(): void {
  if (globalPollInterval !== null) {
    window.clearInterval(globalPollInterval);
    globalPollInterval = null;
  }
}

export function subscribeToStoreUpdates(
  callback: () => void,
  options?: { scope?: StoreUpdateDetail["scope"] }
): () => void {
  if (!isBrowser()) return () => {};

  let debounceTimer: number | null = null;

  const invoke = () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(() => {
      debounceTimer = null;
      callback();
    }, REFRESH_DEBOUNCE_MS);
  };

  const handler = (event: Event) => {
    const detail = (event as CustomEvent<StoreUpdateDetail>).detail;
    if (options?.scope && detail?.scope && detail.scope !== options.scope) return;
    invoke();
  };

  window.addEventListener(NOVRA_STORE_UPDATED, handler);
  return () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    window.removeEventListener(NOVRA_STORE_UPDATED, handler);
  };
}

export const STORE_POLL_INTERVAL_MS = 30_000;

export function createStoreRefreshEffect(
  refresh: () => void | Promise<void>,
  options?: { scopes?: StoreUpdateDetail["scope"][] }
): () => void {
  if (!isBrowser()) return () => {};

  const entry: RefreshEntry = {
    refresh,
    scopes: options?.scopes ? new Set(options.scopes) : null,
  };

  refreshEntries.add(entry);
  runRefreshEntry(entry);
  ensureGlobalPoll();

  const onStoreUpdate = (event: Event) => {
    const detail = (event as CustomEvent<StoreUpdateDetail>).detail;
    queueRefresh({ mode: "event", detail });
  };

  const onStorage = (event: StorageEvent) => {
    if (event.key && STORE_STORAGE_KEYS.has(event.key)) {
      queueRefresh({ mode: "all" });
    }
  };

  window.addEventListener(NOVRA_STORE_UPDATED, onStoreUpdate);
  window.addEventListener("storage", onStorage);

  return () => {
    refreshEntries.delete(entry);
    window.removeEventListener(NOVRA_STORE_UPDATED, onStoreUpdate);
    window.removeEventListener("storage", onStorage);
    if (refreshEntries.size === 0) {
      stopGlobalPoll();
      if (globalDebounceTimer) {
        clearTimeout(globalDebounceTimer);
        globalDebounceTimer = null;
      }
    }
  };
}

export function formatWhatsAppDisplay(number: string): string {
  const digits = number.replace(/\D/g, "");
  if (digits.startsWith("40") && digits.length >= 11) {
    const rest = digits.slice(2);
    return `+40 ${rest.slice(0, 3)} ${rest.slice(3, 6)} ${rest.slice(6)}`;
  }
  return digits ? `+${digits}` : "";
}

export function buildWhatsAppUrl(number: string, message?: string): string {
  const base = `https://wa.me/${number.replace(/\D/g, "")}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}
