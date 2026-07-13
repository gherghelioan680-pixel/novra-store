import type { NextRequest } from "next/server";
import { readJsonFile, writeJsonFile } from "@/lib/server-data";
import { isAdminRequest, unauthorizedResponse } from "@/lib/server-auth";
import type { NewsletterSubscriber } from "@/lib/newsletter";
import { createNewsletterDiscountCode } from "@/lib/discount-codes-server";
import { formatDiscountSuccessMessage } from "@/lib/discount-codes";
import { getServerSiteSettings } from "@/lib/site-settings-server";
import { sendNewsletterWelcomeEmail } from "@/lib/email";

export const runtime = "nodejs";

const FILE = "newsletter.json";

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorizedResponse();

  const subscribers = await readJsonFile<NewsletterSubscriber[]>(FILE, []);
  return Response.json({ subscribers });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: "Invalid email" }, { status: 400 });
    }

    const subscribers = await readJsonFile<NewsletterSubscriber[]>(FILE, []);
    const settings = await getServerSiteSettings();
    const discountPercent = settings.newsletterDiscountPercent ?? 10;
    const existing = subscribers.find((subscriber) => subscriber.email === email);
    if (existing) {
      return Response.json({
        ok: true,
        alreadySubscribed: true,
        discountCode: existing.discountCode,
        discountMessage: existing.discountCode
          ? formatDiscountSuccessMessage(existing.discountCode, "percent", discountPercent)
          : undefined,
      });
    }

    const discount = await createNewsletterDiscountCode(email);

    const next: NewsletterSubscriber = {
      email,
      name: typeof body?.name === "string" ? body.name.trim() || undefined : undefined,
      subscribedAt: new Date().toISOString(),
      source:
        body?.source === "homepage" || body?.source === "account" || body?.source === "other"
          ? body.source
          : "other",
      discountCode: discount.code,
    };

    subscribers.unshift(next);
    await writeJsonFile(FILE, subscribers);

    void sendNewsletterWelcomeEmail(email, discount.code, discountPercent);

    return Response.json({
      ok: true,
      subscriber: next,
      discountCode: discount.code,
      discountMessage: formatDiscountSuccessMessage(discount.code, discount.type, discount.value),
    });
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorizedResponse();

  try {
    const body = await request.json();
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!email) {
      return Response.json({ error: "Invalid email" }, { status: 400 });
    }

    const subscribers = await readJsonFile<NewsletterSubscriber[]>(FILE, []);
    const next = subscribers.filter((subscriber) => subscriber.email !== email);
    if (next.length === subscribers.length) {
      return Response.json({ error: "Subscriber not found" }, { status: 404 });
    }

    await writeJsonFile(FILE, next);
    return Response.json({ ok: true, subscribers: next });
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
}
