export type ReturnStatus = "pending" | "approved" | "rejected" | "completed";

export type ReturnRequest = {
  id: string;
  orderCode: string;
  userEmail: string;
  userName?: string;
  reason: string;
  description: string;
  status: ReturnStatus;
  adminNote?: string;
  refundAmount?: number;
  createdAt: string;
  updatedAt: string;
};

export const RETURN_REASON_KEYS = [
  "defective",
  "notAsDescribed",
  "wrongProduct",
  "changedMind",
  "other",
] as const;

export type ReturnReasonKey = (typeof RETURN_REASON_KEYS)[number];

/** Admin UI labels (Romanian). */
export const RETURN_STATUS_LABELS: Record<ReturnStatus, string> = {
  pending: "În așteptare",
  approved: "Aprobat",
  rejected: "Respins",
  completed: "Finalizat",
};

/** Legacy Romanian labels stored on older return requests. */
export const LEGACY_RETURN_REASON_LABELS: Record<ReturnReasonKey, string> = {
  defective: "Produs defect",
  notAsDescribed: "Nu corespunde descrierii",
  wrongProduct: "Am primit alt produs",
  changedMind: "Nu mai doresc produsul",
  other: "Alt motiv",
};

const LEGACY_REASON_TO_KEY = Object.fromEntries(
  Object.entries(LEGACY_RETURN_REASON_LABELS).map(([key, label]) => [label, key])
) as Record<string, ReturnReasonKey>;

export function resolveReturnReasonKey(reason: string): ReturnReasonKey | null {
  if ((RETURN_REASON_KEYS as readonly string[]).includes(reason)) {
    return reason as ReturnReasonKey;
  }
  return LEGACY_REASON_TO_KEY[reason] ?? null;
}

/** @deprecated Use RETURN_REASON_KEYS in store UI. Kept for admin compatibility. */
export const RETURN_REASONS = RETURN_REASON_KEYS.map((key) => LEGACY_RETURN_REASON_LABELS[key]);
