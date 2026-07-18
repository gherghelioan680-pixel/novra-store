import { apiFetch, getApiHeaders } from "./api-client";
import { dispatchStoreUpdate, STORAGE_KEYS } from "./store";

export type ReviewStatus = "pending" | "approved" | "rejected";

export type Review = {
  id: number;
  name: string;
  email?: string;
  location: string;
  rating: number;
  title?: string;
  comment: string;
  product?: string;
  date: string;
  status: ReviewStatus;
  createdAt?: string;
  publishedAt?: string;
};

export const REVIEW_STATUS_LABELS: Record<ReviewStatus, string> = {
  pending: "În așteptare",
  approved: "Aprobată",
  rejected: "Respinsă",
};

export const featuredReviews: Review[] = [
  {
    id: 1,
    name: "Elena Dumitrescu",
    location: "București, RO",
    rating: 5,
    date: "Mai 2026",
    status: "approved",
    comment:
      "Calitatea produselor NOVRA depășește orice așteptare. Ambalaj premium și livrare rapidă. Recomand cu toată încrederea!",
  },
  {
    id: 2,
    name: "Adrian Popescu",
    location: "Cluj-Napoca, RO",
    rating: 5,
    date: "Iunie 2026",
    status: "approved",
    comment:
      "Produsul a ajuns a doua zi, ambalat impecabil. Design minimalist, exact ce căutam. Un brand românesc de calitate internațională.",
  },
  {
    id: 3,
    name: "Maria Ionescu",
    location: "Timișoara, RO",
    rating: 5,
    date: "Aprilie 2026",
    status: "approved",
    comment:
      "Un amestec perfect de eleganță și utilitate. Materialele se simt incredibil de premium. Cu siguranță voi mai comanda de aici.",
  },
];

function normalizeClientReview(raw: Partial<Review> & { id: number }): Review {
  return {
    id: raw.id,
    name: String(raw.name ?? "").trim() || "Client",
    email: raw.email?.trim(),
    location: String(raw.location ?? "România").trim() || "România",
    rating: typeof raw.rating === "number" ? raw.rating : 5,
    title: raw.title?.trim(),
    comment: String(raw.comment ?? "").trim(),
    product: raw.product?.trim(),
    date: String(raw.date ?? "").trim() || "Recent",
    status: raw.status === "pending" || raw.status === "rejected" ? raw.status : "approved",
    createdAt: raw.createdAt,
    publishedAt: raw.publishedAt,
  };
}

export function getReviewAvatarUrl(name: string): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=7c3aed&color=fff&size=128&bold=true`;
}

function isBrowser() {
  return typeof window !== "undefined";
}

function cacheReviews(reviews: Review[]): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEYS.reviews, JSON.stringify(reviews));
  } catch {
    /* ignore */
  }
}

export function getReviews(): Review[] {
  return getAllReviews();
}

export function getAllReviews(): Review[] {
  if (!isBrowser()) return featuredReviews;

  try {
    const stored = window.localStorage.getItem(STORAGE_KEYS.reviews);
    if (!stored) return featuredReviews;
    const parsed = JSON.parse(stored) as Partial<Review>[];
    return parsed.map((item, index) =>
      normalizeClientReview({
        ...item,
        id: typeof item.id === "number" ? item.id : index + 1,
        status: item.status ?? "approved",
      })
    );
  } catch {
    return featuredReviews;
  }
}

export async function loadReviews(): Promise<Review[]> {
  const fromApi = await apiFetch<{ reviews: Review[] }>("/api/store/reviews");
  if (fromApi?.reviews) {
    cacheReviews(fromApi.reviews);
    return fromApi.reviews;
  }
  return getAllReviews();
}

async function persistReviews(reviews: Review[]): Promise<boolean> {
  if (!isBrowser()) return false;

  try {
    const response = await fetch("/api/store/reviews", {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify({ reviews }),
    });

    if (!response.ok) return false;

    const data = (await response.json()) as { reviews: Review[] };
    cacheReviews(data.reviews);
    dispatchStoreUpdate({ scope: "reviews" });
    return true;
  } catch {
    return false;
  }
}

export async function saveReviews(reviews: Review[]): Promise<boolean> {
  return persistReviews(reviews);
}

export async function addReview(review: Omit<Review, "id" | "status"> & { status?: ReviewStatus }): Promise<Review> {
  const reviews = getAllReviews();
  const nextId = reviews.reduce((max, item) => Math.max(max, item.id), 0) + 1;
  const newReview = normalizeClientReview({
    ...review,
    id: nextId,
    status: review.status ?? "approved",
  });
  await persistReviews([newReview, ...reviews]);
  return newReview;
}

export async function updateReview(id: number, updates: Partial<Review>): Promise<boolean> {
  const reviews = getAllReviews();
  const index = reviews.findIndex((review) => review.id === id);
  if (index === -1) return false;
  reviews[index] = { ...reviews[index], ...updates };
  return persistReviews(reviews);
}

export async function deleteReview(id: number): Promise<boolean> {
  if (!isBrowser()) return false;

  try {
    const response = await fetch(`/api/store/reviews?id=${id}`, {
      method: "DELETE",
      headers: getApiHeaders(),
    });

    if (!response.ok) return false;

    const data = (await response.json()) as { reviews: Review[] };
    cacheReviews(data.reviews);
    dispatchStoreUpdate({ scope: "reviews" });
    return true;
  } catch {
    return false;
  }
}

export async function resetReviewsToDefault(): Promise<boolean> {
  return persistReviews(featuredReviews);
}
