import type { NextRequest } from "next/server";
import { isAdminRequest, unauthorizedResponse } from "@/lib/server-auth";
import {
  getEmailAutomations,
  saveEmailAutomations,
} from "@/lib/email-automations-server";
import type { EmailAutomationKey, EmailAutomations } from "@/lib/email-automations";

export const runtime = "nodejs";

const VALID_KEYS: EmailAutomationKey[] = [
  "welcome",
  "orderConfirmation",
  "orderShipped",
  "passwordReset",
  "newsletter",
  "reviewRequest",
];

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorizedResponse();
  const automations = await getEmailAutomations();
  return Response.json({ automations });
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorizedResponse();

  try {
    const body = (await request.json()) as { automations?: Partial<EmailAutomations> };
    const updates = body?.automations;

    if (!updates || typeof updates !== "object") {
      return Response.json({ ok: false, message: "Date invalide." }, { status: 400 });
    }

    const filtered: Partial<EmailAutomations> = {};
    for (const key of VALID_KEYS) {
      if (typeof updates[key] === "boolean") {
        filtered[key] = updates[key];
      }
    }

    const automations = await saveEmailAutomations(filtered);
    return Response.json({ ok: true, automations });
  } catch {
    return Response.json({ ok: false, message: "Nu s-au putut salva automatizările." }, { status: 400 });
  }
}
