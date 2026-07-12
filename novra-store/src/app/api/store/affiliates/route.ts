import type { NextRequest } from "next/server";
import {
  getSessionFromRequest,
  isAdminRequest,
  unauthorizedResponse,
} from "@/lib/server-auth";
import {
  adjustReferralCommission,
  createAffiliate,
  deleteAffiliate,
  findAffiliateByEmail,
  findAffiliateByUserId,
  markReferralPaid,
  readAffiliateApplications,
  readAffiliateReferrals,
  readAffiliates,
  reviewAffiliateApplication,
  submitAffiliateApplication,
  updateAffiliate,
} from "@/lib/affiliates-server";
import type { AffiliateStatus } from "@/lib/affiliates-types";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const scope = request.nextUrl.searchParams.get("scope");
  const session = getSessionFromRequest(request);

  if (scope === "admin") {
    if (!isAdminRequest(request)) return unauthorizedResponse();
    const [affiliates, applications, referrals] = await Promise.all([
      readAffiliates(),
      readAffiliateApplications(),
      readAffiliateReferrals(),
    ]);
    return Response.json({ affiliates, applications, referrals });
  }

  if (!session?.email) return unauthorizedResponse();

  const [affiliateByUser, affiliateByEmail, applications, referrals] = await Promise.all([
    findAffiliateByUserId(session.userId),
    findAffiliateByEmail(session.email),
    readAffiliateApplications(),
    readAffiliateReferrals(),
  ]);

  const affiliate = affiliateByUser ?? affiliateByEmail;
  const application =
    applications.find((a) => a.userEmail.toLowerCase() === session.email.toLowerCase()) ?? null;
  const userReferrals = affiliate
    ? referrals.filter((r) => r.affiliateId === affiliate.id)
    : [];

  return Response.json({
    affiliate,
    application,
    referrals: userReferrals,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body?.action as string | undefined;

    if (action === "click") {
      return Response.json({ ok: true });
    }

    if (action === "apply") {
      const session = getSessionFromRequest(request);
      if (!session?.email) return unauthorizedResponse();

      const name = typeof body?.name === "string" ? body.name : "";
      const requirements = body?.requirements ?? {};

      const result = await submitAffiliateApplication({
        userId: session.userId,
        userEmail: session.email,
        name: name.trim() || session.email,
        requirements,
      });

      if (!result.ok) {
        return Response.json({ ok: false, message: result.message }, { status: 400 });
      }
      return Response.json({ ok: true, application: result.application });
    }

    if (action === "create") {
      if (!isAdminRequest(request)) return unauthorizedResponse();

      const result = await createAffiliate({
        userEmail: body?.userEmail ?? "",
        name: body?.name ?? "",
        code: body?.code,
        status: (body?.status as AffiliateStatus) ?? "active",
        commissionRate:
          body?.commissionRate !== undefined && body.commissionRate !== ""
            ? Number(body.commissionRate)
            : undefined,
        fixedCommission:
          body?.fixedCommission !== undefined && body.fixedCommission !== ""
            ? Number(body.fixedCommission)
            : undefined,
        adminNote: body?.adminNote,
      });

      if (!result.ok) {
        return Response.json({ ok: false, message: result.message }, { status: 400 });
      }
      return Response.json({ ok: true, affiliate: result.affiliate });
    }

    if (action === "review-application") {
      if (!isAdminRequest(request)) return unauthorizedResponse();

      const applicationId = body?.applicationId as string;
      const status = body?.status as "approved" | "rejected";
      if (!applicationId || (status !== "approved" && status !== "rejected")) {
        return Response.json({ error: "Date invalide." }, { status: 400 });
      }

      const result = await reviewAffiliateApplication(
        applicationId,
        status,
        body?.adminNote,
        body?.commissionRate !== undefined && body.commissionRate !== ""
          ? Number(body.commissionRate)
          : undefined,
        body?.fixedCommission !== undefined && body.fixedCommission !== ""
          ? Number(body.fixedCommission)
          : undefined,
        body?.customCode
      );

      if (!result.ok) {
        return Response.json({ ok: false, message: result.message }, { status: 400 });
      }
      return Response.json({
        ok: true,
        affiliate: result.affiliate,
        application: result.application,
      });
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

    if (action === "update") {
      const affiliateId = body?.affiliateId as string;
      if (!affiliateId) return Response.json({ error: "Lipsește affiliateId." }, { status: 400 });

      const updates: Parameters<typeof updateAffiliate>[1] = {};
      if (typeof body?.name === "string") updates.name = body.name;
      if (typeof body?.code === "string") updates.code = body.code;
      if (body?.status === "active" || body?.status === "inactive") updates.status = body.status;
      if (typeof body?.adminNote === "string") updates.adminNote = body.adminNote;
      if (body?.commissionRate !== undefined && body.commissionRate !== "") {
        updates.commissionRate = Number(body.commissionRate);
      }
      if (body?.fixedCommission !== undefined && body.fixedCommission !== "") {
        updates.fixedCommission = Number(body.fixedCommission);
      }

      const result = await updateAffiliate(affiliateId, updates);

      if (!result.ok) {
        return Response.json({ ok: false, message: result.message }, { status: 400 });
      }
      return Response.json({ ok: true, affiliate: result.affiliate });
    }

    if (action === "mark-paid") {
      const referralId = body?.referralId as string;
      if (!referralId) return Response.json({ error: "Lipsește referralId." }, { status: 400 });

      const result = await markReferralPaid(referralId, {
        commission: body?.commission !== undefined ? Number(body.commission) : undefined,
        adminNote: body?.adminNote,
      });

      if (!result.ok) {
        return Response.json({ ok: false, message: result.message }, { status: 400 });
      }
      return Response.json({ ok: true, referral: result.referral });
    }

    if (action === "adjust-commission") {
      const referralId = body?.referralId as string;
      const commission = Number(body?.commission);
      if (!referralId || !Number.isFinite(commission)) {
        return Response.json({ error: "Date invalide." }, { status: 400 });
      }

      const result = await adjustReferralCommission(referralId, commission, body?.adminNote);
      if (!result.ok) {
        return Response.json({ ok: false, message: result.message }, { status: 400 });
      }
      return Response.json({ ok: true, referral: result.referral });
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
    const affiliateId = body?.affiliateId as string;
    if (!affiliateId) return Response.json({ error: "Lipsește affiliateId." }, { status: 400 });

    const result = await deleteAffiliate(affiliateId);
    if (!result.ok) {
      return Response.json({ ok: false, message: result.message }, { status: 400 });
    }
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Cerere invalidă." }, { status: 400 });
  }
}
