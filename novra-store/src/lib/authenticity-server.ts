import "server-only";

import { readJsonFile, writeJsonFile } from "@/lib/server-data";
import {
  generateAuthenticityCode,
  generateAuthenticityId,
  normalizeAuthenticityCodeInput,
  type AuthenticityCode,
  type AuthenticityCodeStatus,
  type AuthenticityVerifyResult,
} from "@/lib/authenticity";

const FILE = "authenticity-codes.json";

export async function readAuthenticityCodes(): Promise<AuthenticityCode[]> {
  return readJsonFile<AuthenticityCode[]>(FILE, []);
}

export async function writeAuthenticityCodes(codes: AuthenticityCode[]): Promise<void> {
  await writeJsonFile(FILE, codes);
}

function normalizeEntry(raw: Partial<AuthenticityCode>): AuthenticityCode {
  const status: AuthenticityCodeStatus =
    raw.status === "verified" || raw.status === "revoked" ? raw.status : "unused";

  return {
    id: raw.id ?? generateAuthenticityId(),
    code: normalizeAuthenticityCodeInput(raw.code ?? ""),
    productId: raw.productId?.trim() || undefined,
    productName: raw.productName?.trim() || undefined,
    status,
    verifiedAt: raw.verifiedAt,
    createdAt: raw.createdAt ?? new Date().toISOString(),
  };
}

export async function verifyAuthenticityCode(rawCode: string): Promise<AuthenticityVerifyResult> {
  const code = normalizeAuthenticityCodeInput(rawCode);
  if (!code || code.length < 8) {
    return { ok: false, status: "invalid", message: "Cod invalid. Verifică și încearcă din nou." };
  }

  const codes = await readAuthenticityCodes();
  const index = codes.findIndex((entry) => normalizeAuthenticityCodeInput(entry.code) === code);

  if (index === -1) {
    return { ok: false, status: "invalid", message: "Cod invalid sau inexistent." };
  }

  const entry = codes[index];

  if (entry.status === "revoked") {
    return { ok: false, status: "revoked", message: "Acest cod a fost revocat. Contactează suportul NOVRA." };
  }

  if (entry.status === "verified") {
    return {
      ok: false,
      status: "used",
      message: "Acest cod a fost deja verificat anterior.",
    };
  }

  const verifiedAt = new Date().toISOString();
  codes[index] = {
    ...entry,
    status: "verified",
    verifiedAt,
  };
  await writeAuthenticityCodes(codes);

  return {
    ok: true,
    status: "verified",
    productName: entry.productName,
    message: entry.productName
      ? `Produs original NOVRA — ${entry.productName}`
      : "Produs original NOVRA",
  };
}

export type GenerateAuthenticityBatchInput = {
  count: number;
  productId?: string;
  productName?: string;
};

export async function generateAuthenticityBatch(
  input: GenerateAuthenticityBatchInput
): Promise<AuthenticityCode[]> {
  const count = Math.min(Math.max(Math.round(input.count), 1), 500);
  const codes = await readAuthenticityCodes();
  const existing = codes.map((entry) => entry.code);
  const createdAt = new Date().toISOString();
  const created: AuthenticityCode[] = [];

  for (let i = 0; i < count; i += 1) {
    const code = generateAuthenticityCode([...existing, ...created.map((entry) => entry.code)]);
    const entry: AuthenticityCode = {
      id: generateAuthenticityId(),
      code,
      productId: input.productId?.trim() || undefined,
      productName: input.productName?.trim() || undefined,
      status: "unused",
      createdAt,
    };
    created.push(entry);
  }

  await writeAuthenticityCodes([...created, ...codes]);
  return created;
}

export async function updateAuthenticityCode(
  id: string,
  updates: Partial<Pick<AuthenticityCode, "productId" | "productName" | "status">>
): Promise<AuthenticityCode | null> {
  const codes = await readAuthenticityCodes();
  const index = codes.findIndex((entry) => entry.id === id);
  if (index === -1) return null;

  const current = codes[index];
  let status = current.status;
  if (updates.status === "unused" || updates.status === "verified" || updates.status === "revoked") {
    status = updates.status;
  }

  codes[index] = {
    ...current,
    productId: updates.productId !== undefined ? updates.productId?.trim() || undefined : current.productId,
    productName:
      updates.productName !== undefined ? updates.productName?.trim() || undefined : current.productName,
    status,
    verifiedAt:
      status === "verified"
        ? current.verifiedAt ?? new Date().toISOString()
        : status === "unused"
          ? undefined
          : current.verifiedAt,
  };

  await writeAuthenticityCodes(codes);
  return codes[index];
}

export async function deleteAuthenticityCode(id: string): Promise<boolean> {
  const codes = await readAuthenticityCodes();
  const next = codes.filter((entry) => entry.id !== id);
  if (next.length === codes.length) return false;
  await writeAuthenticityCodes(next);
  return true;
}

export async function revokeAuthenticityCode(id: string): Promise<AuthenticityCode | null> {
  return updateAuthenticityCode(id, { status: "revoked" });
}

export async function createAuthenticityCode(input: {
  code?: string;
  productId?: string;
  productName?: string;
}): Promise<AuthenticityCode> {
  const codes = await readAuthenticityCodes();
  const existing = codes.map((entry) => entry.code);
  const code = input.code?.trim()
    ? normalizeAuthenticityCodeInput(input.code)
    : generateAuthenticityCode(existing);

  if (!code) {
    throw new Error("Cod invalid.");
  }

  if (codes.some((entry) => normalizeAuthenticityCodeInput(entry.code) === code)) {
    throw new Error("Acest cod există deja.");
  }

  const entry = normalizeEntry({
    id: generateAuthenticityId(),
    code,
    productId: input.productId,
    productName: input.productName,
    status: "unused",
    createdAt: new Date().toISOString(),
  });

  await writeAuthenticityCodes([entry, ...codes]);
  return entry;
}
