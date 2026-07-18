import type { NextRequest } from "next/server";
import { getSessionFromRequest, isAdminRequest, unauthorizedResponse } from "@/lib/server-auth";
import {
  adminAdjustCredits,
  adminDeleteCreditPurchase,
  adminDeleteCreditTransaction,
  adminManualCreditPurchase,
  adminRevokeCreditPurchase,
  adminUpdateCreditPurchase,
  adminUpdateCreditTransaction,
  getCreditPurchasesForUser,
  getCreditTransactionsForUser,
  readCreditPurchases,
  readCreditTransactions,
} from "@/lib/credits-server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = getSessionFromRequest(request);
  const all = request.nextUrl.searchParams.get("all") === "1";
  const purchasesOnly = request.nextUrl.searchParams.get("purchases") === "1";
  const transactionsAll = request.nextUrl.searchParams.get("transactions") === "1";

  if (all) {
    if (!isAdminRequest(request)) return unauthorizedResponse();
    const purchases = await readCreditPurchases();
    return Response.json({ purchases });
  }

  if (transactionsAll) {
    if (!isAdminRequest(request)) return unauthorizedResponse();
    const transactions = await readCreditTransactions();
    return Response.json({ transactions });
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

    if (action === "update_purchase") {
      const result = await adminUpdateCreditPurchase(purchaseId, {
        adminNote: reason,
        amount: typeof body?.amount === "number" ? body.amount : undefined,
      });
      if (!result.ok) {
        return Response.json({ ok: false, message: result.message }, { status: 400 });
      }
      return Response.json({ ok: true, purchase: result.purchase });
    }

    if (action === "delete_purchase") {
      const result = await adminDeleteCreditPurchase(purchaseId);
      if (!result.ok) {
        return Response.json({ ok: false, message: result.message }, { status: 400 });
      }
      return Response.json({ ok: true });
    }

    return Response.json({ error: "Acțiune necunoscută." }, { status: 400 });
  } catch {
    return Response.json({ error: "Cerere invalidă." }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorizedResponse();

  try {
    const body = await request.json();
    const action = body?.action as string | undefined;

    if (action === "adjust_credits") {
      const userEmail = typeof body?.userEmail === "string" ? body.userEmail.trim() : "";
      const delta = Number(body?.delta);
      const reason = typeof body?.reason === "string" ? body.reason : undefined;
      if (!userEmail || !Number.isFinite(delta) || delta === 0) {
        return Response.json({ ok: false, message: "Email și sumă invalidă." }, { status: 400 });
      }
      const result = await adminAdjustCredits(userEmail, delta, reason);
      if (!result.ok) {
        return Response.json({ ok: false, message: result.message }, { status: 400 });
      }
      return Response.json({ ok: true, user: result.user, transaction: result.transaction });
    }

    if (action === "update_transaction") {
      const transactionId = typeof body?.transactionId === "string" ? body.transactionId : "";
      const description = typeof body?.description === "string" ? body.description : "";
      if (!transactionId) {
        return Response.json({ ok: false, message: "Lipsește transactionId." }, { status: 400 });
      }
      const result = await adminUpdateCreditTransaction(transactionId, description);
      if (!result.ok) {
        return Response.json({ ok: false, message: result.message }, { status: 400 });
      }
      return Response.json({ ok: true, transaction: result.transaction });
    }

    return Response.json({ error: "Acțiune necunoscută." }, { status: 400 });
  } catch {
    return Response.json({ error: "Cerere invalidă." }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorizedResponse();

  try {
    const body = await request.json();
    const action = body?.action as string | undefined;

    if (action === "delete_transaction") {
      const transactionId = typeof body?.transactionId === "string" ? body.transactionId : "";
      if (!transactionId) {
        return Response.json({ ok: false, message: "Lipsește transactionId." }, { status: 400 });
      }
      const result = await adminDeleteCreditTransaction(transactionId);
      if (!result.ok) {
        return Response.json({ ok: false, message: result.message }, { status: 400 });
      }
      return Response.json({ ok: true });
    }

    return Response.json({ error: "Acțiune necunoscută." }, { status: 400 });
  } catch {
    return Response.json({ error: "Cerere invalidă." }, { status: 400 });
  }
}
