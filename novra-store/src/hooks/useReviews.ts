"use client";

import { useEffect, useState } from "react";
import { getAllReviews, loadReviews, type Review } from "@/lib/reviews";
import { createStoreRefreshEffect } from "@/lib/store";

function reviewsEqual(a: Review[], b: Review[]): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function useReviews(limit?: number): Review[] {
  const [reviews, setReviews] = useState<Review[]>(() => {
    const all = getAllReviews();
    return limit ? all.slice(0, limit) : all;
  });

  useEffect(() => {
    return createStoreRefreshEffect(async () => {
      const all = await loadReviews();
      const next = limit ? all.slice(0, limit) : all;
      setReviews((prev) => (reviewsEqual(prev, next) ? prev : next));
    }, { scopes: ["reviews"] });
  }, [limit]);

  return reviews;
}
