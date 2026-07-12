import type { NextRequest } from "next/server";

export type SessionData = {
  userId: string;
  email: string;
  role: "admin" | "customer";
};

export function parseSessionRaw(raw: string): SessionData | null {
  try {
    return JSON.parse(decodeURIComponent(raw)) as SessionData;
  } catch {
    try {
      return JSON.parse(raw) as SessionData;
    } catch {
      return null;
    }
  }
}

export function getSessionFromRequest(request: NextRequest): SessionData | null {
  const header = request.headers.get("X-Novra-Session");
  const cookie = request.cookies.get("novra-session")?.value;
  const raw = header ?? cookie;
  if (!raw) return null;
  return parseSessionRaw(raw);
}

export function isAdminRequest(request: NextRequest): boolean {
  const session = getSessionFromRequest(request);
  return session?.role === "admin";
}

export function unauthorizedResponse() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
