import type { NextRequest } from "next/server";
import { sendReviewSubmissionEmails } from "@/lib/email";
import { isEmailsEnabled } from "@/lib/emails-enabled";
import { createPendingReview, parseReviewRating } from "@/lib/reviews-server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const ratingRaw = body?.rating ?? "";
    const rating =
      typeof ratingRaw === "string" ? ratingRaw.trim() : String(ratingRaw ?? "").trim();
    const message =
      typeof body?.message === "string"
        ? body.message.trim()
        : typeof body?.text === "string"
          ? body.text.trim()
          : typeof body?.comment === "string"
            ? body.comment.trim()
            : "";
    const title = typeof body?.title === "string" ? body.title.trim() : undefined;
    const product = typeof body?.product === "string" ? body.product.trim() : undefined;

    console.log("[REVIEWS] submit request", {
      hasName: Boolean(name),
      hasEmail: Boolean(email),
      hasRating: Boolean(rating),
      messageLength: message.length,
    });

    if (!name || !email || !rating || !message) {
      console.warn("[REVIEWS] validation failed: missing fields");
      return Response.json({ ok: false, message: "Completează toate câmpurile." }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ ok: false, message: "Adresa de email este invalidă." }, { status: 400 });
    }

    const review = await createPendingReview({
      name,
      email,
      rating: parseReviewRating(rating),
      comment: message,
      title,
      product,
    });

    console.log(`[REVIEWS] Pending review saved id=${review.id} email=${email}`);

    let confirmationSent = false;
    let adminSent = false;

    if (isEmailsEnabled()) {
      try {
        const result = await sendReviewSubmissionEmails({ name, email, rating, message });
        confirmationSent = result.confirmationSent;
        adminSent = result.adminSent;
        console.log(
          `[REVIEWS] Submission emails confirmation=${confirmationSent} admin=${adminSent} id=${review.id}`
        );
      } catch (emailError) {
        console.error("[REVIEWS] Submission emails failed (review saved):", emailError);
      }
    } else {
      console.log(`[REVIEWS] Emails disabled — review saved id=${review.id}`);
    }

    return Response.json({
      ok: true,
      message:
        "Recenzia ta a fost trimisă și va apărea pe site după aprobare. Mulțumim!",
      reviewId: review.id,
      confirmationSent,
      adminSent,
    });
  } catch (error) {
    console.error("[REVIEWS] Submit failed:", error);
    return Response.json({ ok: false, message: "Eroare la trimiterea recenziei." }, { status: 500 });
  }
}
