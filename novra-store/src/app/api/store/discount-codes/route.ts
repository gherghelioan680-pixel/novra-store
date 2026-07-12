import type { NextRequest } from "next/server";
import { isAdminRequest, unauthorizedResponse } from "@/lib/server-auth";
import {
  markDiscountCodeUsed,
  readDiscountCodes,
  validateDiscountCodeServer,
} from "@/lib/discount-codes-server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorizedResponse();
  const codes = await readDiscountCodes();
  return Response.json({ codes });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body?.action as string | undefined;

    if (action === "validate") {
      const code = typeof body?.code === "string" ? body.code : "";
      const result = await validateDiscountCodeServer(code);
      if (!result.valid) {
        return Response.json({ valid: false, message: result.message }, { status: 400 });
      }
      return Response.json({ valid: true, percentOff: result.percentOff, code: result.code });
    }

    if (action === "redeem") {
      const code = typeof body?.code === "string" ? body.code : "";
      const orderId = typeof body?.orderId === "string" ? body.orderId : "";
      if (!code || !orderId) {
        return Response.json({ error: "Missing code or orderId" }, { status: 400 });
      }

      const validation = await validateDiscountCodeServer(code);
      if (!validation.valid) {
        return Response.json({ ok: false, message: validation.message }, { status: 400 });
      }

      await markDiscountCodeUsed(validation.code, orderId);
      return Response.json({ ok: true });
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
}
