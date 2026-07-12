import type { NextRequest } from "next/server";
import { getSessionFromRequest, isAdminRequest, unauthorizedResponse } from "@/lib/server-auth";
import {
  adminManualCreditPurchase,
  adminRevokeCreditPurchase,
  getCreditPurchasesForUser,
  getCreditTransactionsForUser,
  readCreditPurchases,
} from "@/lib/credits-server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = getSessionFromRequest(request);
  const all = request.nextUrl.searchParams.get("all") === "1";
  const purchasesOnly = request.nextUrl.searchParams.get("purchases") === "1";

  if (all) {
    if (!isAdminRequest(request)) return unauthorizedResponse();
    const purchases = await readCreditPurchases();
    return Response.json({ purchases });
  }

  if (!session?.email) return unauthorizedResponse();

  if (purchasesOnly) {
    const purchases = await getCreditPurchasesForUser(session.email);
    return Response.json({ purchases });
  }

  const transactions = await getCreditTransactionsForUser(session.email);
  return Response.json({ transactions });
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorizedResponse();

  try {
    const body = await request.json();
    const action = body?.action as string | undefined;
    const purchaseId = typeof body?.purchaseId === "string" ? body.purchaseId : "";
    const reason = typeof body?.reason === "string" ? body.reason : undefined;

    if (!purchaseId) {
      return Response.json({ error: "Lipsește purchaseId." }, { status: 400 });
    }

    if (action === "manual_credit") {
      const result = await adminManualCreditPurchase(purchaseId, reason);
      if (!result.ok) {
        return Response.json({ ok: false, message: result.message }, { status: 400 });
      }
      return Response.json({ ok: true, purchase: result.purchase });
    }

    if (action === "revoke") {
      const result = await adminRevokeCreditPurchase(purchaseId, reason);
      if (!result.ok) {
        return Response.json({ ok: false, message: result.message }, { status: 400 });
      }
      return Response.json({ ok: true, purchase: result.purchase });
    }

    return Response.json({ error: "Acțiune necunoscută." }, { status: 400 });
  } catch {
    return Response.json({ error: "Cerere invalidă." }, { status: 400 });
  }
}
