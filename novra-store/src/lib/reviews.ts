import { apiFetch, getApiHeaders } from "./api-client";
import { dispatchStoreUpdate, STORAGE_KEYS } from "./store";

export type Review = {
  id: number;
  name: string;
  location: string;
  rating: number;
  comment: string;
  date: string;
};

export const featuredReviews: Review[] = [
  {
    id: 1,
    name: "Elena Dumitrescu",
    location: "București, RO",
    rating: 5,
    date: "Mai 2026",
    comment:
      "Calitatea produselor NOVRA depășește orice așteptare. Ambalaj premium și livrare rapidă. Recomand cu toată încrederea!",
  },
  {
    id: 2,
    name: "Adrian Popescu",
    location: "Cluj-Napoca, RO",
    rating: 5,
    date: "Iunie 2026",
    comment:
      "Produsul a ajuns a doua zi, ambalat impecabil. Design minimalist, exact ce căutam. Un brand românesc de calitate internațională.",
  },
  {
    id: 3,
    name: "Maria Ionescu",
    location: "Timișoara, RO",
    rating: 5,
    date: "Aprilie 2026",
    comment:
      "Un amestec perfect de eleganță și utilitate. Materialele se simt incredibil de premium. Cu siguranță voi mai comanda de aici.",
  },
];

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
    return JSON.parse(stored) as Review[];
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

export async function addReview(review: Omit<Review, "id">): Promise<Review> {
  const reviews = getAllReviews();
  const nextId = reviews.reduce((max, item) => Math.max(max, item.id), 0) + 1;
  const newReview = { ...review, id: nextId };
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
