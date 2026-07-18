import type { NextRequest } from "next/server";
import { isAdminRequest, unauthorizedResponse } from "@/lib/server-auth";
import { sendReviewApprovedEmail } from "@/lib/email";
import {
  deleteReviewById,
  normalizeReview,
  readReviews,
  toPublicReview,
  updateReviewById,
  writeReviews,
} from "@/lib/reviews-server";
import { featuredReviews, type Review, type ReviewStatus } from "@/lib/reviews";

export const runtime = "nodejs";

const VALID_STATUSES: ReviewStatus[] = ["pending", "approved", "rejected"];

export async function GET(request: NextRequest) {
  const reviews = await readReviews();

  if (isAdminRequest(request)) {
    return Response.json({ reviews });
  }

  const approved = reviews
    .filter((review) => review.status === "approved")
    .map(toPublicReview);

  return Response.json({ reviews: approved });
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorizedResponse();

  try {
    const body = await request.json();

    if (body && typeof body === "object" && Array.isArray(body.reviews)) {
      const reviews = (body.reviews as Partial<Review>[]).map((item, index) =>
        normalizeReview({
          ...item,
          id: typeof item.id === "number" ? item.id : index + 1,
          status: (item.status as ReviewStatus) ?? "approved",
        })
      );
      await writeReviews(reviews);
      return Response.json({ reviews });
    }

    return Response.json({ error: "Invalid request" }, { status: 400 });
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorizedResponse();

  try {
    const body = await request.json();
    const id = typeof body?.id === "number" ? body.id : Number(body?.id);
    if (!Number.isFinite(id)) {
      return Response.json({ success: false, message: "ID recenzie invalid." }, { status: 400 });
    }

    const status = body?.status as ReviewStatus | undefined;
    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      return Response.json({ success: false, message: "Status invalid." }, { status: 400 });
    }

    const updates: Parameters<typeof updateReviewById>[1] = {};

    if (typeof body?.name === "string") updates.name = body.name.trim();
    if (typeof body?.email === "string") updates.email = body.email.trim();
    if (typeof body?.location === "string") updates.location = body.location.trim();
    if (body?.rating !== undefined) updates.rating = Number(body.rating);
    if (typeof body?.title === "string") updates.title = body.title.trim();
    if (typeof body?.comment === "string") updates.comment = body.comment.trim();
    if (typeof body?.text === "string") updates.comment = body.text.trim();
    if (typeof body?.product === "string") updates.product = body.product.trim();
    if (typeof body?.date === "string") updates.date = body.date.trim();
    if (status !== undefined) updates.status = status;

    if (Object.keys(updates).length === 0) {
      return Response.json({ success: false, message: "Nicio modificare specificată." }, { status: 400 });
    }

    const reviewsBefore = await readReviews();
    const previous = reviewsBefore.find((item) => item.id === id);

    const updated = await updateReviewById(id, updates);
    if (!updated) {
      return Response.json({ success: false, message: "Recenzia nu a fost găsită." }, { status: 404 });
    }

    if (updated.status === "approved" && previous?.status !== "approved") {
      if (updated.email) {
        try {
          console.log(
            `[REVIEWS] Admin approved review id=${updated.id} name=${updated.name} email=${updated.email}`
          );
          const sent = await sendReviewApprovedEmail(updated);
          console.log(
            `[REVIEWS] [EMAIL] Approval email sent=${sent} id=${updated.id} → ${updated.email}`
          );
        } catch (error) {
          console.error("[REVIEWS] [EMAIL] Approval email failed:", error);
        }
      } else {
        console.log(`[REVIEWS] [EMAIL] Approval email skipped — no client email on review id=${updated.id}`);
      }
    }

    return Response.json({ success: true, review: updated });
  } catch {
    return Response.json({ success: false, message: "Cerere invalidă." }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorizedResponse();

  try {
    let id: number | undefined;

    const body = await request.json().catch(() => null);
    if (body && typeof body.id === "number") {
      id = body.id;
    } else if (body && body.id !== undefined) {
      id = Number(body.id);
    }

    if (id === undefined) {
      const idParam = request.nextUrl.searchParams.get("id");
      id = idParam ? Number(idParam) : NaN;
    }

    if (!Number.isFinite(id)) {
      return Response.json({ success: false, message: "ID recenzie lipsă." }, { status: 400 });
    }

    const next = await deleteReviewById(id);
    if (!next) {
      return Response.json({ success: false, message: "Recenzia nu a fost găsită." }, { status: 404 });
    }

    return Response.json({ success: true, reviews: next });
  } catch {
    return Response.json({ success: false, message: "Cerere invalidă." }, { status: 400 });
  }
}
