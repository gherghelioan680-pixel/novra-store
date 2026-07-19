import type { NextRequest } from "next/server";
import { isAdminRequest, unauthorizedResponse } from "@/lib/server-auth";
import {
  createAuthenticityCode,
  deleteAuthenticityCode,
  generateAuthenticityBatch,
  readAuthenticityCodes,
  revokeAuthenticityCode,
  updateAuthenticityCode,
} from "@/lib/authenticity-server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorizedResponse();
  const codes = await readAuthenticityCodes();
  return Response.json({ codes });
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorizedResponse();

  try {
    const body = await request.json();

    if (body?.action === "generate") {
      const count = Number(body.count) || 10;
      const codes = await generateAuthenticityBatch({
        count,
        productId: typeof body.productId === "string" ? body.productId : undefined,
        productName: typeof body.productName === "string" ? body.productName : undefined,
      });
      return Response.json({ ok: true, codes, created: codes.length });
    }

    const entry = await createAuthenticityCode({
      code: typeof body?.code === "string" ? body.code : undefined,
      productId: typeof body?.productId === "string" ? body.productId : undefined,
      productName: typeof body?.productName === "string" ? body.productName : undefined,
    });

    return Response.json({ ok: true, code: entry });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Cerere invalidă.";
    return Response.json({ ok: false, message }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorizedResponse();

  try {
    const body = await request.json();
    const id = typeof body?.id === "string" ? body.id : "";
    if (!id) {
      return Response.json({ ok: false, message: "ID lipsă." }, { status: 400 });
    }

    if (body?.action === "revoke") {
      const code = await revokeAuthenticityCode(id);
      if (!code) {
        return Response.json({ ok: false, message: "Cod negăsit." }, { status: 404 });
      }
      return Response.json({ ok: true, code });
    }

    const status = body?.status;
    const updated = await updateAuthenticityCode(id, {
      productId: typeof body?.productId === "string" ? body.productId : undefined,
      productName: typeof body?.productName === "string" ? body.productName : undefined,
      status:
        status === "unused" || status === "verified" || status === "revoked" ? status : undefined,
    });

    if (!updated) {
      return Response.json({ ok: false, message: "Cod negăsit." }, { status: 404 });
    }

    return Response.json({ ok: true, code: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Cerere invalidă.";
    return Response.json({ ok: false, message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorizedResponse();

  try {
    const idFromQuery = request.nextUrl.searchParams.get("id");
    const body = idFromQuery ? null : await request.json();
    const id = idFromQuery ?? (typeof body?.id === "string" ? body.id : "");
    if (!id) {
      return Response.json({ ok: false, message: "ID lipsă." }, { status: 400 });
    }

    const deleted = await deleteAuthenticityCode(id);
    if (!deleted) {
      return Response.json({ ok: false, message: "Cod negăsit." }, { status: 404 });
    }

    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false, message: "Cerere invalidă." }, { status: 400 });
  }
}
