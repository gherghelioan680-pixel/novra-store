import type { NextRequest } from "next/server";
import { readJsonFile, writeJsonFile } from "@/lib/server-data";
import { isAdminRequest, unauthorizedResponse } from "@/lib/server-auth";
import type { NewsletterSubscriber, UpdateNewsletterSubscriberInput } from "@/lib/newsletter";
import {
  createNewsletterDiscountCode,
  createManualNewsletterDiscountCode,
  readDiscountCodes,
  updateDiscountCode,
} from "@/lib/discount-codes-server";
import { formatDiscountSuccessMessage } from "@/lib/discount-codes";
import { getServerSiteSettings } from "@/lib/site-settings-server";
import { sendNewsletterWelcomeEmail, sendSubscriptionConfirmationEmail } from "@/lib/email";
import { isAutomationEnabled } from "@/lib/email-automations-server";
import { isEmailsEnabled } from "@/lib/emails-enabled";

export const runtime = "nodejs";

const FILE = "newsletter.json";

async function readSubscribers(): Promise<NewsletterSubscriber[]> {
  return readJsonFile<NewsletterSubscriber[]>(FILE, []);
}

async function linkDiscountCodeToSubscriber(
  subscribers: NewsletterSubscriber[],
  email: string,
  codeValue: string | null | undefined
): Promise<NewsletterSubscriber[]> {
  const normalizedEmail = email.trim().toLowerCase();
  const index = subscribers.findIndex((s) => s.email === normalizedEmail);
  if (index === -1) return subscribers;

  if (codeValue === null || codeValue === undefined || codeValue === "") {
    subscribers[index] = { ...subscribers[index], discountCode: undefined };
    return subscribers;
  }

  const normalizedCode = codeValue.trim().toUpperCase();
  const codes = await readDiscountCodes();
  const match = codes.find((c) => c.code.toUpperCase() === normalizedCode);
  if (!match) {
    throw new Error("Codul de reducere nu a fost găsit.");
  }

  await updateDiscountCode({ code: match.code, email: normalizedEmail });
  subscribers[index] = { ...subscribers[index], discountCode: match.code };
  return subscribers;
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorizedResponse();

  const subscribers = await readSubscribers();
  return Response.json({ subscribers });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: "Invalid email" }, { status: 400 });
    }

    const isAdmin = isAdminRequest(request);
    const isAdminAdd = Boolean(body?.admin) && isAdmin;
    if (body?.admin && !isAdmin) {
      return unauthorizedResponse();
    }

    const subscribers = await readSubscribers();
    const settings = await getServerSiteSettings();
    const discountPercent = settings.newsletterDiscountPercent ?? 10;
    const existing = subscribers.find((subscriber) => subscriber.email === email);

    if (existing) {
      if (isAdminAdd) {
        return Response.json({ ok: false, message: "Acest email este deja abonat.", alreadySubscribed: true }, { status: 409 });
      }
      return Response.json({
        ok: true,
        alreadySubscribed: true,
        discountCode: existing.discountCode,
        discountMessage: existing.discountCode
          ? formatDiscountSuccessMessage(existing.discountCode, "percent", discountPercent)
          : undefined,
      });
    }

    const shouldGenerateCode =
      body?.generateCode !== undefined
        ? Boolean(body.generateCode)
        : settings.newsletterAutoGenerateCodes !== false;

    let discountCode: string | undefined;
    if (shouldGenerateCode) {
      const discount = await createNewsletterDiscountCode(email);
      discountCode = discount.code;
    }

    const source =
      body?.source === "homepage" ||
      body?.source === "account" ||
      body?.source === "admin" ||
      body?.source === "other"
        ? body.source
        : isAdminAdd
          ? "admin"
          : "other";

    const next: NewsletterSubscriber = {
      email,
      name: typeof body?.name === "string" ? body.name.trim() || undefined : undefined,
      notes: typeof body?.notes === "string" ? body.notes.trim() || undefined : undefined,
      subscribedAt: new Date().toISOString(),
      source,
      discountCode,
    };

    subscribers.unshift(next);
    await writeJsonFile(FILE, subscribers);

    const sendWelcome =
      isEmailsEnabled() &&
      (body?.sendWelcomeEmail !== undefined
        ? Boolean(body.sendWelcomeEmail)
        : !isAdminAdd);

    console.log("[newsletter] Subscribe saved:", {
      email,
      source,
      sendWelcome,
      hasDiscountCode: Boolean(discountCode),
      emailsEnabled: isEmailsEnabled(),
      isAdminAdd,
    });

    if (sendWelcome && discountCode) {
      const welcomeEnabled = await isAutomationEnabled("welcome");
      if (!welcomeEnabled) {
        console.log("[newsletter] Welcome automation disabled — skipping email for:", email);
      } else {
      console.log("[newsletter] Dispatching welcome email to:", email);
      void sendNewsletterWelcomeEmail(
        email,
        discountCode,
        discountPercent,
        settings.newsletterWelcomeMessage
      ).then((sent) => {
        if (sent) {
          console.log("[newsletter] Welcome email completed successfully for:", email);
        } else {
          console.error("[newsletter] Welcome email failed for:", email);
        }
      });
      }
    } else if (sendWelcome) {
      void sendSubscriptionConfirmationEmail(email, next.name).then((sent) => {
        if (sent) {
          console.log("[newsletter] Subscription confirmation sent for:", email);
        }
      });
    } else {
      console.log("[newsletter] Welcome email skipped:", {
        email,
        sendWelcome,
        discountCode: discountCode ?? null,
      });
    }

    return Response.json({
      ok: true,
      subscriber: next,
      discountCode,
      discountMessage: discountCode
        ? formatDiscountSuccessMessage(discountCode, "percent", discountPercent)
        : undefined,
    });
  } catch (error) {
    console.error("[newsletter] POST subscribe error:", error);
    const message = error instanceof Error ? error.message : "Invalid request";
    return Response.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorizedResponse();

  try {
    const body = await request.json();
    const originalEmail =
      typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const updates = (body?.updates ?? {}) as UpdateNewsletterSubscriberInput;

    if (!originalEmail) {
      return Response.json({ error: "Email invalid." }, { status: 400 });
    }

    const subscribers = await readSubscribers();
    const index = subscribers.findIndex((s) => s.email === originalEmail);
    if (index === -1) {
      return Response.json({ error: "Abonatul nu a fost găsit." }, { status: 404 });
    }

    const current = subscribers[index];
    let nextEmail = current.email;

    if (updates.email !== undefined) {
      const newEmail = updates.email.trim().toLowerCase();
      if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
        return Response.json({ error: "Email invalid." }, { status: 400 });
      }
      if (newEmail !== originalEmail && subscribers.some((s) => s.email === newEmail)) {
        return Response.json({ error: "Există deja un abonat cu acest email." }, { status: 409 });
      }
      nextEmail = newEmail;
    }

    let updated: NewsletterSubscriber = {
      ...current,
      email: nextEmail,
      ...(updates.name !== undefined
        ? { name: updates.name.trim() || undefined }
        : {}),
      ...(updates.notes !== undefined
        ? { notes: updates.notes.trim() || undefined }
        : {}),
    };

    subscribers[index] = updated;

    if (updates.discountCode !== undefined) {
      const linked = await linkDiscountCodeToSubscriber(subscribers, nextEmail, updates.discountCode);
      updated = linked.find((s) => s.email === nextEmail) ?? updated;
    }

    if (nextEmail !== originalEmail && updated.discountCode) {
      await updateDiscountCode({ code: updated.discountCode, email: nextEmail });
    }

    await writeJsonFile(FILE, subscribers);

    return Response.json({ ok: true, subscriber: updated, subscribers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request";
    return Response.json({ error: message }, { status: 400 });
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

    const subscribers = await readSubscribers();
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
