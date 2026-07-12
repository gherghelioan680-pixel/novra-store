import type { NextRequest } from "next/server";
import { getSessionFromRequest, isAdminRequest, unauthorizedResponse } from "@/lib/server-auth";
import { readDiscountCodes } from "@/lib/discount-codes-server";
import {
  discountAppliesToProducts,
  discountIncludesFreeShipping,
  formatDiscountValue,
} from "@/lib/discount-codes";

export const runtime = "nodejs";

function isCodeExhausted(code: {
  maxUses?: number;
  useCount?: number;
  used?: boolean;
}): boolean {
  if (code.maxUses !== undefined && (code.useCount ?? 0) >= code.maxUses) return true;
  if (code.maxUses === undefined && code.used) return true;
  return false;
}

function mapUserCoupons(
  codes: Awaited<ReturnType<typeof readDiscountCodes>>,
  email: string
) {
  return codes
    .filter((code) => {
      const assignedEmail = code.email?.toLowerCase();
      const usedByEmails = code.usedByEmails ?? [];
      return assignedEmail === email || usedByEmails.includes(email);
    })
    .map((code) => {
      const expired = code.expiresAt
        ? new Date(code.expiresAt).getTime() < Date.now()
        : false;
      const exhausted = isCodeExhausted(code);
      const usedByThisUser = (code.usedByEmails ?? []).includes(email);

      let status: "active" | "used" | "expired" = "active";
      if (expired) status = "expired";
      else if (exhausted || (code.singleUsePerEmail && usedByThisUser)) status = "used";

      return {
        code: code.code,
        type: code.type,
        value: code.value,
        valueLabel: formatDiscountValue(code.type, code.value),
        applyToProducts: discountAppliesToProducts(code),
        freeShipping: discountIncludesFreeShipping(code),
        source: code.source,
        createdAt: code.createdAt,
        expiresAt: code.expiresAt,
        status,
        usedAt: code.usedAt,
      };
    });
}

export async function GET(request: NextRequest) {
  const session = getSessionFromRequest(request);
  const emailParam = request.nextUrl.searchParams.get("email")?.toLowerCase();
  const codes = await readDiscountCodes();

  if (isAdminRequest(request) && emailParam) {
    return Response.json({ coupons: mapUserCoupons(codes, emailParam) });
  }

  if (!session?.email) return unauthorizedResponse();

  const email = session.email.toLowerCase();
  if (emailParam && emailParam !== email) return unauthorizedResponse();

  return Response.json({ coupons: mapUserCoupons(codes, email) });
}
