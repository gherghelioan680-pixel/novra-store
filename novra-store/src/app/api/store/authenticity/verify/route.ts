import type { NextRequest } from "next/server";
import { verifyAuthenticityCode } from "@/lib/authenticity-server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const code = typeof body?.code === "string" ? body.code : "";
    if (!code.trim()) {
      return Response.json(
        { ok: false, status: "invalid", message: "Introdu codul de pe ambalaj." },
        { status: 400 }
      );
    }

    const result = await verifyAuthenticityCode(code);
    return Response.json(result, { status: result.ok ? 200 : 200 });
  } catch {
    return Response.json(
      { ok: false, status: "invalid", message: "Nu am putut verifica codul. Încearcă din nou." },
      { status: 500 }
    );
  }
}
