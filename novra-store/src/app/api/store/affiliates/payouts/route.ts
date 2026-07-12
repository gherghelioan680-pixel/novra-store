import type { NextRequest } from "next/server";
import {
  getSessionFromRequest,
  isAdminRequest,
  unauthorizedResponse,
} from "@/lib/server-auth";
import {
  findAffiliateByEmail,
  findAffiliateByUserId,
  getAvailablePayoutBalance,
  readAffiliatePayouts,
  submitAffiliatePayout,
  updateAffiliatePayoutStatus,
} from "@/lib/affiliates-server";
import type { AffiliatePayoutStatus } from "@/lib/affiliates-types";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const scope = request.nextUrl.searchParams.get("scope");
  const payouts = await readAffiliatePayouts();

  if (scope === "admin") {
    if (!isAdminRequest(request)) return unauthorizedResponse();
    return Response.json({ payouts });
  }

  const session = getSessionFromRequest(request);
  if (!session?.email) return unauthorizedResponse();

  const affiliate =
    (await findAffiliateByUserId(session.userId)) ??
    (await findAffiliateByEmail(session.email));
  if (!affiliate) {
    return Response.json({ payouts: [], availableBalance: 0 });
  }

  const userPayouts = payouts.filter((p) => p.affiliateId === affiliate.id);
  const availableBalance = getAvailablePayoutBalance(affiliate, payouts);

  return Response.json({ payouts: userPayouts, availableBalance });
}

export async function POST(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session?.email) return unauthorizedResponse();

  try {
    const body = await request.json();
    const affiliate =
      (await findAffiliateByUserId(session.userId)) ??
      (await findAffiliateByEmail(session.email));
    if (!affiliate) {
      return Response.json({ ok: false, message: "Nu ești afiliat aprobat." }, { status: 403 });
    }

    if (body?.confirmed !== true) {
      return Response.json(
        { ok: false, message: "Confirmă că datele de plată sunt corecte." },
        { status: 400 }
      );
    }

    const result = await submitAffiliatePayout({
      affiliateId: affiliate.id,
      beneficiaryName: typeof body?.beneficiaryName === "string" ? body.beneficiaryName : "",
      iban: typeof body?.iban === "string" ? body.iban : undefined,
      cardNumber: typeof body?.cardNumber === "string" ? body.cardNumber : undefined,
      bankName: typeof body?.bankName === "string" ? body.bankName : undefined,
      amount: Number(body?.amount),
    });

    if (!result.ok) {
      return Response.json({ ok: false, message: result.message }, { status: 400 });
    }
    return Response.json({ ok: true, payout: result.payout });
  } catch {
    return Response.json({ error: "Cerere invalidă." }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorizedResponse();

  try {
    const body = await request.json();
    const payoutId = body?.payoutId as string | undefined;
    const status = body?.status as AffiliatePayoutStatus | undefined;

    if (!payoutId || (status !== "paid" && status !== "rejected")) {
      return Response.json({ error: "Date invalide." }, { status: 400 });
    }

    const result = await updateAffiliatePayoutStatus(
      payoutId,
      status,
      typeof body?.adminNote === "string" ? body.adminNote : undefined
    );

    if (!result.ok) {
      return Response.json({ ok: false, message: result.message }, { status: 400 });
    }
    return Response.json({ ok: true, payout: result.payout });
  } catch {
    return Response.json({ error: "Cerere invalidă." }, { status: 400 });
  }
}
