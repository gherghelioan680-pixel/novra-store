import "server-only";

import { readJsonFile, writeJsonFile } from "./server-data";
import { featuredReviews, type Review, type ReviewStatus } from "./reviews";

const FILE = "reviews.json";

export function parseReviewRating(rating: string | number): number {
  if (typeof rating === "number" && Number.isFinite(rating)) {
    return Math.min(5, Math.max(1, Math.round(rating)));
  }
  const match = String(rating).match(/^(\d)/);
  if (match) return Math.min(5, Math.max(1, Number(match[1])));
  const num = Number(rating);
  if (Number.isFinite(num) && num >= 1 && num <= 5) return Math.round(num);
  return 5;
}

export function formatReviewDate(date = new Date()): string {
  return date.toLocaleDateString("ro-RO", { month: "long", year: "numeric" });
}

export function normalizeReview(raw: Partial<Review> & { id: number }): Review {
  return {
    id: raw.id,
    name: String(raw.name ?? "").trim() || "Client",
    email: raw.email?.trim().toLowerCase(),
    location: String(raw.location ?? "România").trim() || "România",
    rating: parseReviewRating(raw.rating ?? 5),
    title: raw.title?.trim() || undefined,
    comment: String(raw.comment ?? "").trim(),
    product: raw.product?.trim() || undefined,
    date: String(raw.date ?? formatReviewDate()).trim() || formatReviewDate(),
    status: raw.status === "pending" || raw.status === "rejected" ? raw.status : "approved",
    createdAt: raw.createdAt,
    publishedAt: raw.publishedAt,
  };
}

export async function readReviews(): Promise<Review[]> {
  const raw = await readJsonFile<Partial<Review>[] | unknown>(FILE, featuredReviews);
  const items = Array.isArray(raw) ? raw : featuredReviews;

  if (!Array.isArray(raw)) {
    console.warn("[REVIEWS] stored reviews.json is not an array — using defaults");
  }

  return items.map((item, index) =>
    normalizeReview({
      ...(typeof item === "object" && item !== null ? (item as Partial<Review>) : {}),
      id: typeof (item as Partial<Review>)?.id === "number" ? (item as Partial<Review>).id! : index + 1,
      status: (item as Partial<Review>)?.status ?? "approved",
    })
  );
}

export async function writeReviews(reviews: Review[]): Promise<void> {
  await writeJsonFile(FILE, reviews);
}

export async function createPendingReview(input: {
  name: string;
  email: string;
  rating: string | number;
  comment: string;
  title?: string;
  product?: string;
}): Promise<Review> {
  const reviews = await readReviews();
  const now = new Date().toISOString();
  const nextId = reviews.reduce((max, item) => Math.max(max, item.id), 0) + 1;
  const entry = normalizeReview({
    id: nextId,
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    location: "România",
    rating: parseReviewRating(input.rating),
    title: input.title?.trim(),
    comment: input.comment.trim(),
    product: input.product?.trim(),
    date: formatReviewDate(),
    status: "pending",
    createdAt: now,
  });
  reviews.unshift(entry);
  await writeReviews(reviews);
  console.log("[REVIEWS] createPendingReview ok", { reviewId: entry.id, total: reviews.length });
  return entry;
}

export async function updateReviewById(
  id: number,
  updates: Partial<
    Pick<Review, "name" | "email" | "location" | "rating" | "title" | "comment" | "product" | "date" | "status">
  >
): Promise<Review | null> {
  const reviews = await readReviews();
  const index = reviews.findIndex((item) => item.id === id);
  if (index === -1) return null;

  const current = reviews[index];
  const nextStatus = updates.status ?? current.status;
  reviews[index] = normalizeReview({
    ...current,
    ...updates,
    id: current.id,
    status: nextStatus,
    publishedAt:
      nextStatus === "approved" && current.status !== "approved"
        ? new Date().toISOString()
        : nextStatus === "approved"
          ? current.publishedAt ?? new Date().toISOString()
          : undefined,
  });
  await writeReviews(reviews);
  return reviews[index];
}

export async function deleteReviewById(id: number): Promise<Review[] | null> {
  const reviews = await readReviews();
  const next = reviews.filter((item) => item.id !== id);
  if (next.length === reviews.length) return null;
  await writeReviews(next);
  return next;
}

export function toPublicReview(review: Review): Review {
  const { email: _email, ...rest } = review;
  return rest;
}

export const REVIEW_STATUS_LABELS: Record<ReviewStatus, string> = {
  pending: "În așteptare",
  approved: "Aprobată",
  rejected: "Respinsă",
};
