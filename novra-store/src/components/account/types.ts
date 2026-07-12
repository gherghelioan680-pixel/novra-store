export type AccountSection =
  | "overview"
  | "my-orders"
  | "my-returns"
  | "my-profile"
  | "shipping-address"
  | "manage-account"
  | "my-coupons"
  | "my-novra-credits"
  | "gift-cards"
  | "email-preferences"
  | "support-center"
  | "affiliate-program"
  | "refer-friend";

export type OrderFilterType = "all" | "regular" | "subscription";
export type OrderStatusFilter = "all" | "pending" | "processing" | "shipped" | "delivered" | "cancelled";
