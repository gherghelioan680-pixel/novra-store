import { apiFetch, getApiHeaders } from "./api-client";
import { dispatchStoreUpdate } from "./store";
import type { BlogArticle } from "./blog-types";

export async function loadBlogArticles(publishedOnly = false): Promise<BlogArticle[]> {
  const query = publishedOnly ? "?published=1" : "";
  const data = await apiFetch<{ articles: BlogArticle[] }>(`/api/store/blog${query}`);
  return data?.articles ?? [];
}

export async function loadBlogArticleBySlug(slug: string): Promise<BlogArticle | null> {
  const data = await apiFetch<{ article: BlogArticle | null }>(
    `/api/store/blog?slug=${encodeURIComponent(slug)}`
  );
  return data?.article ?? null;
}

export async function saveBlogArticleAdmin(
  article: Partial<BlogArticle> & { title: string; slug: string }
): Promise<{ ok: true; article: BlogArticle } | { ok: false; message: string }> {
  try {
    const response = await fetch("/api/store/blog", {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify({ action: "upsert", article }),
    });
    const data = (await response.json()) as {
      ok?: boolean;
      article?: BlogArticle;
      message?: string;
    };
    if (!response.ok || !data.ok || !data.article) {
      return { ok: false, message: data.message ?? "Nu s-a putut salva articolul." };
    }
    dispatchStoreUpdate({ scope: "blog" });
    return { ok: true, article: data.article };
  } catch {
    return { ok: false, message: "Eroare de rețea." };
  }
}

export async function deleteBlogArticleAdmin(
  id: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const response = await fetch("/api/store/blog", {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify({ action: "delete", id }),
    });
    const data = (await response.json()) as { ok?: boolean; message?: string };
    if (!response.ok || !data.ok) {
      return { ok: false, message: data.message ?? "Nu s-a putut șterge articolul." };
    }
    dispatchStoreUpdate({ scope: "blog" });
    return { ok: true };
  } catch {
    return { ok: false, message: "Eroare de rețea." };
  }
}
