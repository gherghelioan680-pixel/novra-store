import type { NextRequest } from "next/server";
import { readJsonFile, writeJsonFile } from "@/lib/server-data";
import { isAdminRequest, unauthorizedResponse } from "@/lib/server-auth";
import { featuredReviews, type Review } from "@/lib/reviews";

export const runtime = "nodejs";

const FILE = "reviews.json";

export async function GET() {
  const reviews = await readJsonFile<Review[]>(FILE, featuredReviews);
  return Response.json({ reviews });
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorizedResponse();

  try {
    const body = await request.json();

    if (body && typeof body === "object" && Array.isArray(body.reviews)) {
      const reviews = body.reviews as Review[];
      await writeJsonFile(FILE, reviews);
      return Response.json({ reviews });
    }

    return Response.json({ error: "Invalid request" }, { status: 400 });
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorizedResponse();

  const idParam = request.nextUrl.searchParams.get("id");
  const id = idParam ? Number(idParam) : NaN;
  if (!idParam || Number.isNaN(id)) {
    return Response.json({ error: "Missing review id" }, { status: 400 });
  }

  const reviews = await readJsonFile<Review[]>(FILE, featuredReviews);
  const next = reviews.filter((review) => review.id !== id);
  await writeJsonFile(FILE, next);
  return Response.json({ reviews: next });
}
