import type { NextRequest } from "next/server";
import { isAdminRequest, unauthorizedResponse } from "@/lib/server-auth";
import {
  createAdminDiscountCode,
  createManualNewsletterDiscountCode,
  deleteDiscountCode,
  markDiscountCodeUsed,
  readDiscountCodes,
  updateDiscountCode,
  validateDiscountCodeServer,
} from "@/lib/discount-codes-server";
import type { CreateDiscountCodeInput, DiscountCodeType } from "@/lib/discount-codes";

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
      const email = typeof body?.email === "string" ? body.email : undefined;
      const result = await validateDiscountCodeServer(code, email);
      if (!result.valid) {
        return Response.json({ valid: false, message: result.message }, { status: 400 });
      }
      return Response.json({
        valid: true,
        type: result.type,
        value: result.value,
        code: result.code,
        applyToProducts: result.applyToProducts,
        freeShipping: result.freeShipping,
      });
    }

    if (action === "redeem") {
      const code = typeof body?.code === "string" ? body.code : "";
      const orderId = typeof body?.orderId === "string" ? body.orderId : "";
      const email = typeof body?.email === "string" ? body.email : undefined;
      if (!code || !orderId) {
        return Response.json({ error: "Missing code or orderId" }, { status: 400 });
      }

      const validation = await validateDiscountCodeServer(code, email);
      if (!validation.valid) {
        return Response.json({ ok: false, message: validation.message }, { status: 400 });
      }

      await markDiscountCodeUsed(validation.code, orderId, email);
      return Response.json({ ok: true });
    }

    if (action === "create") {
      if (!isAdminRequest(request)) return unauthorizedResponse();

      const code = typeof body?.code === "string" ? body.code : "";
      const type = body?.type === "fixed" ? "fixed" : "percent";
      const value = typeof body?.value === "number" ? body.value : Number(body?.value);
      const parsedMaxUses =
        body?.maxUses === null || body?.maxUses === undefined || body?.maxUses === ""
          ? undefined
          : Number(body.maxUses);
      const maxUses =
        parsedMaxUses !== undefined && Number.isFinite(parsedMaxUses) && parsedMaxUses > 0
          ? parsedMaxUses
          : undefined;
      const expiresAt =
        typeof body?.expiresAt === "string" && body.expiresAt.trim()
          ? body.expiresAt.trim()
          : undefined;

      const input: CreateDiscountCodeInput = {
        code,
        type: type as DiscountCodeType,
        value,
        applyToProducts: body?.applyToProducts !== false,
        freeShipping: Boolean(body?.freeShipping),
        maxUses,
        expiresAt,
        singleUsePerEmail: Boolean(body?.singleUsePerEmail),
        active: body?.active !== false,
      };

      try {
        const created = await createAdminDiscountCode(input);
        return Response.json({ ok: true, code: created });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Nu s-a putut crea codul.";
        return Response.json({ ok: false, message }, { status: 400 });
      }
    }

    if (action === "delete") {
      if (!isAdminRequest(request)) return unauthorizedResponse();

      const code = typeof body?.code === "string" ? body.code : "";
      if (!code) {
        return Response.json({ ok: false, message: "Cod lipsă." }, { status: 400 });
      }

      const deleted = await deleteDiscountCode(code);
      if (!deleted) {
        return Response.json({ ok: false, message: "Codul nu a fost găsit." }, { status: 404 });
      }
      return Response.json({ ok: true });
    }

    if (action === "update") {
      if (!isAdminRequest(request)) return unauthorizedResponse();

      const code = typeof body?.code === "string" ? body.code : "";
      if (!code) {
        return Response.json({ ok: false, message: "Cod lipsă." }, { status: 400 });
      }

      const parsedMaxUses =
        body?.maxUses === null
          ? null
          : body?.maxUses === undefined || body?.maxUses === ""
            ? undefined
            : Number(body.maxUses);
      const maxUses =
        parsedMaxUses === null
          ? null
          : parsedMaxUses !== undefined && Number.isFinite(parsedMaxUses) && parsedMaxUses > 0
            ? parsedMaxUses
            : undefined;

      const expiresAt =
        body?.expiresAt === null
          ? null
          : typeof body?.expiresAt === "string" && body.expiresAt.trim()
            ? body.expiresAt.trim()
            : undefined;

      try {
        const updated = await updateDiscountCode({
          code,
          value: typeof body?.value === "number" ? body.value : undefined,
          type: body?.type === "fixed" ? "fixed" : body?.type === "percent" ? "percent" : undefined,
          maxUses,
          expiresAt,
          active: body?.active !== undefined ? Boolean(body.active) : undefined,
          email:
            body?.email === null
              ? null
              : typeof body?.email === "string"
                ? body.email
                : undefined,
        });

        if (!updated) {
          return Response.json({ ok: false, message: "Codul nu a fost găsit." }, { status: 404 });
        }
        return Response.json({ ok: true, code: updated });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Nu s-a putut actualiza codul.";
        return Response.json({ ok: false, message }, { status: 400 });
      }
    }

    if (action === "create-newsletter") {
      if (!isAdminRequest(request)) return unauthorizedResponse();

      const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
      if (!email) {
        return Response.json({ ok: false, message: "Email lipsă." }, { status: 400 });
      }

      const parsedMaxUses =
        body?.maxUses === undefined || body?.maxUses === ""
          ? undefined
          : Number(body.maxUses);
      const maxUses =
        parsedMaxUses !== undefined && Number.isFinite(parsedMaxUses) && parsedMaxUses > 0
          ? parsedMaxUses
          : undefined;
      const expiresAt =
        typeof body?.expiresAt === "string" && body.expiresAt.trim()
          ? body.expiresAt.trim()
          : undefined;

      try {
        const created = await createManualNewsletterDiscountCode(email, {
          code: typeof body?.code === "string" ? body.code : undefined,
          value: typeof body?.value === "number" ? body.value : undefined,
          maxUses,
          expiresAt,
        });
        return Response.json({ ok: true, code: created });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Nu s-a putut crea codul.";
        return Response.json({ ok: false, message }, { status: 400 });
      }
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
}
