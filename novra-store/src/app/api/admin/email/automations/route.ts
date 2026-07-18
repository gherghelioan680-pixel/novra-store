import type { NextRequest } from "next/server";
import { isAdminRequest, unauthorizedResponse } from "@/lib/server-auth";
import {
  getEmailAutomations,
  saveEmailAutomations,
} from "@/lib/email-automations-server";
import type { EmailAutomationKey, EmailAutomationMeta } from "@/lib/email-automations";

export const runtime = "nodejs";

const VALID_KEYS: EmailAutomationKey[] = [
  "welcome",
  "orderConfirmation",
  "orderProcessing",
  "orderShipped",
  "orderDelivered",
  "orderCancelled",
  "adminNewOrder",
  "passwordReset",
  "newsletter",
  "reviewRequest",
  "contactConfirmation",
  "contactAdmin",
  "giftCard",
  "storeCredit",
  "adminOrderCancelled",
  "returnApproved",
  "refund",
  "returnRequestAdmin",
  "accountConfirmation",
  "emailVerification",
  "subscriptionConfirmation",
];

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorizedResponse();
  const automations = await getEmailAutomations();
  return Response.json({ automations });
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorizedResponse();

  try {
    const body = (await request.json()) as {
      automations?: Partial<Record<EmailAutomationKey, Partial<EmailAutomationMeta> | boolean>>;
    };
    const updates = body?.automations;

    if (!updates || typeof updates !== "object") {
      return Response.json({ ok: false, message: "Date invalide." }, { status: 400 });
    }

    const filtered: Partial<Record<EmailAutomationKey, Partial<EmailAutomationMeta> | boolean>> = {};
    for (const key of VALID_KEYS) {
      const value = updates[key];
      if (typeof value === "boolean") {
        filtered[key] = value;
      } else if (value && typeof value === "object") {
        const partial: Partial<EmailAutomationMeta> = {};
        if (typeof value.enabled === "boolean") partial.enabled = value.enabled;
        if (typeof value.delayMinutes === "number") partial.delayMinutes = value.delayMinutes;
        if (Object.keys(partial).length > 0) {
          filtered[key] = partial;
        }
      }
    }

    const automations = await saveEmailAutomations(filtered);
    return Response.json({ ok: true, automations });
  } catch {
    return Response.json({ ok: false, message: "Nu s-au putut salva automatizările." }, { status: 400 });
  }
}
