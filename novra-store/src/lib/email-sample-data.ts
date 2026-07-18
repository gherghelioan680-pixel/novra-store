import type { Order, OrderStatus } from "@/lib/orders";

/** Realistic sample order for Email Center preview and test sends. */
export function buildSampleOrder(recipientEmail = "client@example.com"): Order {
  const now = new Date().toISOString();
  const items = [
    {
      productId: "usb-c-100w-2m",
      title: "Cablu USB-C la USB-C 100W",
      variantLabel: "2m · Negru",
      quantity: 1,
      unitPrice: 89.99,
    },
    {
      productId: "hdmi-21-3m",
      title: "Cablu HDMI 2.1 Ultra High Speed",
      variantLabel: "3m",
      quantity: 1,
      unitPrice: 129.99,
    },
  ];
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  return {
    id: "sample-order-preview",
    purchaseCode: "NV-190726-ABC123",
    userId: "guest-sample",
    userEmail: recipientEmail,
    userName: "Andrei Popescu",
    isGuest: true,
    items,
    address: {
      name: "Andrei Popescu",
      email: recipientEmail,
      phone: "0721234567",
      address: "Str. Aviatorilor 42, Ap. 5",
      city: "București",
      county: "București",
      notes: "",
    },
    total: subtotal,
    shipping: 0,
    status: "processing",
    paymentMethod: "ramburs",
    paymentStatus: "pending",
    createdAt: now,
    updatedAt: now,
    confirmationEmailSent: false,
  };
}

const ORDER_EMAIL_TEMPLATE_STATUSES: Partial<Record<string, OrderStatus>> = {
  order_confirmation: "processing",
  order_processing: "processing",
  order_shipped: "shipped",
  order_delivered: "delivered",
  order_cancelled: "cancelled",
  review_request: "delivered",
  admin_new_order: "processing",
  admin_order_cancelled: "cancelled",
};

export function buildSampleOrderForTemplate(
  templateId: string,
  recipientEmail = "client@example.com"
): Order {
  const order = buildSampleOrder(recipientEmail);
  const status = ORDER_EMAIL_TEMPLATE_STATUSES[templateId];
  if (status) order.status = status;
  if (templateId === "order_shipped") {
    order.awbTracking = "FC1234567890";
  }
  return order;
}
