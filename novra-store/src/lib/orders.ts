import { apiFetch, getApiHeaders } from "./api-client";
import { dispatchStoreUpdate, STORAGE_KEYS } from "./store";

export type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled";

export type OrderItem = {
  productId?: string;
  title: string;
  variantLabel: string;
  quantity: number;
  unitPrice: number;
};

export type OrderAddress = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  county?: string;
  postalCode?: string;
  notes: string;
};

/** @deprecated Legacy shape — use OrderAddress */
export type OrderCustomer = OrderAddress;

export type PaymentStatus = "pending" | "paid" | "failed";

export type Order = {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  /** Comandă plasată fără cont (guest checkout). */
  isGuest?: boolean;
  items: OrderItem[];
  total: number;
  shipping: number;
  status: OrderStatus;
  paymentMethod: "card" | "ramburs" | "credits";
  paymentStatus?: PaymentStatus;
  /** NovraCredits aplicați la această comandă. */
  creditsUsed?: number;
  address: OrderAddress;
  purchaseCode: string;
  discountCode?: string;
  discountAmount?: number;
  /** Livrare gratuită aplicată prin cod reducere. */
  discountFreeShipping?: boolean;
  /** Cod afiliat care a generat această comandă. */
  affiliateCode?: string;
  /** Slug campanie landing (reducere automată). */
  campaignSlug?: string;
  campaignDiscountPercent?: number;
  campaignDiscountAmount?: number;
  awbTracking?: string;
  stripeSessionId?: string;
  confirmationEmailSent?: boolean;
  trackingEmailSent?: boolean;
  /** Emailuri de notificare trimise per status (processing, shipped, delivered, cancelled). */
  statusEmailsSent?: Partial<Record<OrderStatus, boolean>>;
  /** Cerere recenzie trimisă după livrare. */
  reviewEmailSent?: boolean;
  /** Data programată pentru trimiterea cererii de recenzie. */
  reviewEmailDueAt?: string;
  createdAt: string;
  updatedAt: string;
  /** @deprecated Legacy field */
  totalPrice?: number;
  /** @deprecated Legacy field */
  customer?: OrderAddress;
};

const PURCHASE_CODE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function randomPurchaseCodeSuffix(length: number): string {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += PURCHASE_CODE_CHARS[Math.floor(Math.random() * PURCHASE_CODE_CHARS.length)];
  }
  return result;
}

export function generatePurchaseCode(existingCodes: string[] = [], date = new Date()): string {
  const datePart = [
    String(date.getDate()).padStart(2, "0"),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getFullYear()).slice(-2),
  ].join("");

  const existingSet = new Set(existingCodes.map((code) => code.toUpperCase()));
  let code = "";
  for (let attempt = 0; attempt < 100; attempt++) {
    code = `NV-${datePart}-${randomPurchaseCodeSuffix(6)}`;
    if (!existingSet.has(code.toUpperCase())) break;
  }
  return code;
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "În așteptare",
  processing: "În procesare",
  shipped: "Expediată",
  delivered: "Livrată",
  cancelled: "Anulată",
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-yellow-500/15 text-yellow-300",
  processing: "bg-blue-500/15 text-blue-300",
  shipped: "bg-green-500/15 text-green-300",
  delivered: "bg-emerald-500/15 text-emerald-300",
  cancelled: "bg-red-500/15 text-red-300",
};

export const ORDER_STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: "pending", label: ORDER_STATUS_LABELS.pending },
  { value: "processing", label: ORDER_STATUS_LABELS.processing },
  { value: "shipped", label: ORDER_STATUS_LABELS.shipped },
  { value: "delivered", label: ORDER_STATUS_LABELS.delivered },
  { value: "cancelled", label: ORDER_STATUS_LABELS.cancelled },
];

function normalizeStatus(status: string | undefined): OrderStatus {
  if (status === "processed") return "processing";
  if (
    status === "pending" ||
    status === "processing" ||
    status === "shipped" ||
    status === "delivered" ||
    status === "cancelled"
  ) {
    return status;
  }
  return "pending";
}

/** Resolve the customer inbox for order emails (userEmail, address, legacy customer). */
export function resolveOrderCustomerEmail(order: Partial<Order>): string {
  const address = order.address ?? order.customer;
  return (order.userEmail ?? address?.email ?? "").trim().toLowerCase();
}

export function normalizeOrder(raw: Partial<Order>): Order {
  const address = raw.address ?? raw.customer;
  const userEmail = resolveOrderCustomerEmail(raw);
  const userName = raw.userName ?? address?.name ?? "";
  const total = raw.total ?? raw.totalPrice ?? 0;
  const createdAt = raw.createdAt ?? new Date().toISOString();

  const purchaseCode =
    raw.purchaseCode ??
    generatePurchaseCode([], new Date(createdAt));

  return {
    id: raw.id ?? `order-${Date.now()}`,
    userId: raw.userId ?? userEmail,
    userEmail,
    userName,
    items: raw.items ?? [],
    total,
    shipping: raw.shipping ?? 0,
    status: normalizeStatus(raw.status),
    paymentMethod: raw.paymentMethod ?? "ramburs",
    paymentStatus: raw.paymentStatus ?? (raw.paymentMethod === "card" ? "pending" : undefined),
    creditsUsed: raw.creditsUsed,
    discountCode: raw.discountCode,
    discountAmount: raw.discountAmount,
    discountFreeShipping: raw.discountFreeShipping,
    affiliateCode: raw.affiliateCode,
    isGuest: raw.isGuest ?? raw.userId?.startsWith("guest-"),
    awbTracking: raw.awbTracking,
    stripeSessionId: raw.stripeSessionId,
    confirmationEmailSent: raw.confirmationEmailSent,
    trackingEmailSent: raw.trackingEmailSent,
    statusEmailsSent: raw.statusEmailsSent,
    reviewEmailSent: raw.reviewEmailSent,
    reviewEmailDueAt: raw.reviewEmailDueAt,
    address: {
      name: address?.name ?? userName,
      email: address?.email ?? userEmail,
      phone: address?.phone ?? "",
      address: address?.address ?? "",
      city: address?.city ?? "",
      county: address?.county ?? "",
      postalCode: address?.postalCode ?? "",
      notes: address?.notes ?? "",
    },
    purchaseCode,
    createdAt,
    updatedAt: raw.updatedAt ?? createdAt,
    totalPrice: total,
    customer: address,
  };
}

export function searchOrders(orders: Order[], query: string): Order[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  return orders.filter((order) => {
    const code = order.purchaseCode?.toLowerCase() ?? "";
    const id = order.id.toLowerCase();
    const email = order.userEmail.toLowerCase();
    return (
      code === normalized ||
      code.includes(normalized) ||
      id === normalized ||
      id.includes(normalized) ||
      email.includes(normalized)
    );
  });
}

function isBrowser() {
  return typeof window !== "undefined";
}

function cacheOrders(orders: Order[]): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(orders.slice(0, 100)));
  } catch {
    /* ignore */
  }
}

function mergeOrdersIntoCache(incoming: Order[]): void {
  if (!isBrowser() || incoming.length === 0) return;

  const byId = new Map(getStoredOrders().map((order) => [order.id, order]));
  for (const order of incoming) {
    byId.set(order.id, order);
  }

  const merged = Array.from(byId.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  cacheOrders(merged);
}

function buildOrdersQuery(email?: string): string {
  const params = new URLSearchParams();
  if (email) params.set("email", email);
  params.set("_", String(Date.now()));
  return `?${params.toString()}`;
}

export function getStoredOrders(): Order[] {
  if (!isBrowser()) return [];

  try {
    const stored = window.localStorage.getItem(STORAGE_KEYS.orders);
    if (!stored) return [];
    const parsed = JSON.parse(stored) as Array<Partial<Order>>;
    return parsed.map(normalizeOrder);
  } catch {
    return [];
  }
}

export async function loadOrders(email?: string): Promise<Order[]> {
  const fromApi = await apiFetch<{ orders: Partial<Order>[] }>(
    `/api/store/orders${buildOrdersQuery(email)}`
  );
  if (fromApi?.orders) {
    const orders = fromApi.orders.map(normalizeOrder);
    if (email) {
      mergeOrdersIntoCache(orders);
    } else {
      cacheOrders(orders);
    }
    return orders;
  }
  const stored = getStoredOrders();
  if (email) {
    const normalizedEmail = email.toLowerCase();
    return stored.filter(
      (order) =>
        order.userEmail === normalizedEmail ||
        order.address.email.toLowerCase() === normalizedEmail
    );
  }
  return stored;
}

export function getOrdersForUser(email: string): Order[] {
  const normalizedEmail = email.toLowerCase();
  return getStoredOrders().filter(
    (order) =>
      order.userEmail === normalizedEmail ||
      order.address.email.toLowerCase() === normalizedEmail
  );
}

export async function getOrdersForUserFromApi(email: string): Promise<Order[]> {
  return loadOrders(email);
}

export async function saveOrder(
  order: Order
): Promise<{ ok: true; order: Order } | { ok: false; message: string }> {
  if (!isBrowser()) {
    return { ok: false, message: "Acțiunea nu poate fi efectuată în acest moment." };
  }

  const normalized = normalizeOrder(order);

  try {
    const response = await fetch("/api/store/orders", {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify({ order: normalized }),
    });

    const data = (await response.json().catch(() => ({}))) as {
      order?: Partial<Order>;
      error?: string;
    };

    if (!response.ok) {
      return {
        ok: false,
        message: data.error ?? "Comanda nu a putut fi salvată. Verifică conexiunea și încearcă din nou.",
      };
    }

    const saved = normalizeOrder(data.order ?? normalized);

    mergeOrdersIntoCache([saved]);
    dispatchStoreUpdate({ scope: "orders" });
    dispatchStoreUpdate({ scope: "products" });
    return { ok: true, order: saved };
  } catch {
    return {
      ok: false,
      message: "Comanda nu a putut fi salvată. Verifică conexiunea și încearcă din nou.",
    };
  }
}

export async function deleteOrder(orderId: string): Promise<boolean> {
  if (!isBrowser()) return false;

  try {
    const response = await fetch("/api/store/orders", {
      method: "DELETE",
      headers: getApiHeaders(),
      body: JSON.stringify({ orderId }),
    });

    if (!response.ok) return false;

    const orders = getStoredOrders().filter((order) => order.id !== orderId);
    cacheOrders(orders);
    dispatchStoreUpdate({ scope: "orders" });
    return true;
  } catch {
    return false;
  }
}

export async function searchOrdersFromApi(query: string): Promise<Order[]> {
  const fromApi = await apiFetch<{ orders: Partial<Order>[] }>(
    `/api/store/orders?search=${encodeURIComponent(query)}`
  );
  if (fromApi?.orders) {
    return fromApi.orders.map(normalizeOrder);
  }
  return searchOrders(getStoredOrders(), query);
}

export async function updateOrderAwb(orderId: string, awbTracking: string): Promise<boolean> {
  if (!isBrowser()) return false;

  try {
    const response = await fetch("/api/store/orders", {
      method: "PATCH",
      headers: getApiHeaders(),
      cache: "no-store",
      body: JSON.stringify({ orderId, awbTracking }),
    });

    if (!response.ok) return false;

    const data = (await response.json()) as { orders: Partial<Order>[]; order?: Partial<Order> };
    const updatedOrders = data.orders?.map(normalizeOrder) ?? [];
    if (updatedOrders.length > 0) {
      mergeOrdersIntoCache(updatedOrders);
    } else if (data.order) {
      mergeOrdersIntoCache([normalizeOrder(data.order)]);
    }
    dispatchStoreUpdate({ scope: "orders" });
    return true;
  } catch {
    return false;
  }
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<boolean> {
  if (!isBrowser()) return false;

  try {
    const response = await fetch("/api/store/orders", {
      method: "PATCH",
      headers: getApiHeaders(),
      cache: "no-store",
      body: JSON.stringify({ orderId, status }),
    });

    if (!response.ok) return false;

    const data = (await response.json()) as { orders: Partial<Order>[]; order?: Partial<Order> };
    const updatedOrders = data.orders?.map(normalizeOrder) ?? [];
    if (updatedOrders.length > 0) {
      mergeOrdersIntoCache(updatedOrders);
    } else if (data.order) {
      mergeOrdersIntoCache([normalizeOrder(data.order)]);
    }
    dispatchStoreUpdate({ scope: "orders" });
    return true;
  } catch {
    return false;
  }
}

export function isGuestOrder(order: Pick<Order, "isGuest" | "userId">): boolean {
  return Boolean(order.isGuest || order.userId.startsWith("guest-"));
}

export async function bulkUpdateOrderStatus(
  orderIds: string[],
  status: OrderStatus
): Promise<boolean> {
  if (!isBrowser() || orderIds.length === 0) return false;

  try {
    const response = await fetch("/api/store/orders", {
      method: "PATCH",
      headers: getApiHeaders(),
      cache: "no-store",
      body: JSON.stringify({ orderIds, status }),
    });

    if (!response.ok) return false;

    const data = (await response.json()) as { orders?: Partial<Order>[] };
    if (data.orders) {
      mergeOrdersIntoCache(data.orders.map(normalizeOrder));
    }
    dispatchStoreUpdate({ scope: "orders" });
    return true;
  } catch {
    return false;
  }
}

export async function bulkDeleteOrders(orderIds: string[]): Promise<boolean> {
  if (!isBrowser() || orderIds.length === 0) return false;

  try {
    const response = await fetch("/api/store/orders", {
      method: "DELETE",
      headers: getApiHeaders(),
      body: JSON.stringify({ orderIds }),
    });

    if (!response.ok) return false;

    const data = (await response.json()) as { orders?: Partial<Order>[] };
    if (data.orders) {
      cacheOrders(data.orders.map(normalizeOrder));
    } else {
      cacheOrders(getStoredOrders().filter((order) => !orderIds.includes(order.id)));
    }
    dispatchStoreUpdate({ scope: "orders" });
    return true;
  } catch {
    return false;
  }
}

export function getOrderStats() {
  const orders = getStoredOrders();
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  return {
    totalOrders: orders.length,
    totalRevenue,
    pendingOrders: orders.filter((order) => order.status === "pending").length,
    processingOrders: orders.filter((order) => order.status === "processing").length,
    shippedOrders: orders.filter((order) => order.status === "shipped").length,
    deliveredOrders: orders.filter((order) => order.status === "delivered").length,
    cancelledOrders: orders.filter((order) => order.status === "cancelled").length,
  };
}
