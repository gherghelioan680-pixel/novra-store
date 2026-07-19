export type AuthenticityCodeStatus = "unused" | "verified" | "revoked";

export type AuthenticityCode = {
  id: string;
  code: string;
  productId?: string;
  productName?: string;
  status: AuthenticityCodeStatus;
  verifiedAt?: string;
  createdAt: string;
};

export type AuthenticityVerifyResult =
  | { ok: true; status: "verified"; productName?: string; message: string }
  | { ok: false; status: "invalid" | "used" | "revoked"; message: string };

export const AUTHENTICITY_STATUS_LABELS: Record<AuthenticityCodeStatus, string> = {
  unused: "Neutilizat",
  verified: "Verificat",
  revoked: "Revocat",
};

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomSegment(length: number): string {
  let result = "";
  for (let i = 0; i < length; i += 1) {
    result += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return result;
}

export function normalizeAuthenticityCodeInput(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

export function generateAuthenticityCode(existingCodes: string[] = []): string {
  const existing = new Set(existingCodes.map((code) => normalizeAuthenticityCodeInput(code)));
  for (let attempt = 0; attempt < 200; attempt += 1) {
    const code = `NOVRA-${randomSegment(4)}-${randomSegment(4)}`;
    if (!existing.has(code)) return code;
  }
  return `NOVRA-${randomSegment(4)}-${randomSegment(4)}-${Date.now().toString(36).slice(-4).toUpperCase()}`;
}

export function generateAuthenticityId(): string {
  return `auth-${Date.now().toString(36)}-${randomSegment(4).toLowerCase()}`;
}
