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
  createdAt: string;
  updatedAt: string;
};

export const RETURN_STATUS_LABELS: Record<ReturnStatus, string> = {
  pending: "În așteptare",
  approved: "Aprobat",
  rejected: "Respins",
  completed: "Finalizat",
};

export const RETURN_REASONS = [
  "Produs defect",
  "Nu corespunde descrierii",
  "Am primit alt produs",
  "Nu mai doresc produsul",
  "Alt motiv",
] as const;
