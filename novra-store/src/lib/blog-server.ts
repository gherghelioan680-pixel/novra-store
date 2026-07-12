import "server-only";

import { readJsonFile, writeJsonFile } from "@/lib/server-data";
import { DEFAULT_BLOG_ARTICLE_TEMPLATES } from "@/lib/blog-seed";
import { BLOG_STORAGE_FILE, normalizeBlogSlug, type BlogArticle } from "@/lib/blog-types";

function nowIso(): string {
  return new Date().toISOString();
}

function buildArticleId(): string {
  return `blog-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function seedArticles(): BlogArticle[] {
  const ts = nowIso();
  return DEFAULT_BLOG_ARTICLE_TEMPLATES.map((template, index) => ({
    ...template,
    id: `blog-seed-${template.slug}`,
    createdAt: new Date(Date.now() - index * 86_400_000).toISOString(),
    updatedAt: ts,
  }));
}

export async function readBlogArticles(): Promise<BlogArticle[]> {
  const stored = await readJsonFile<BlogArticle[]>(BLOG_STORAGE_FILE, []);
  if (stored.length === 0) {
    const seeded = seedArticles();
    await writeBlogArticles(seeded);
    return seeded;
  }
  return stored;
}

export async function writeBlogArticles(articles: BlogArticle[]): Promise<void> {
  await writeJsonFile(BLOG_STORAGE_FILE, articles);
}

export async function findBlogArticleBySlug(slug: string): Promise<BlogArticle | null> {
  const normalized = normalizeBlogSlug(slug);
  const articles = await readBlogArticles();
  return articles.find((a) => a.slug === normalized) ?? null;
}

export async function getPublishedArticles(): Promise<BlogArticle[]> {
  const articles = await readBlogArticles();
  return articles
    .filter((a) => a.published)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function upsertBlogArticle(
  input: Partial<BlogArticle> & { title: string; slug: string }
): Promise<{ ok: true; article: BlogArticle } | { ok: false; message: string }> {
  const slug = normalizeBlogSlug(input.slug);
  if (!slug) return { ok: false, message: "Slug invalid." };

  const articles = await readBlogArticles();
  const index = input.id ? articles.findIndex((a) => a.id === input.id) : -1;
  const slugConflict = articles.findIndex((a) => a.slug === slug && a.id !== input.id);

  if (slugConflict !== -1) {
    return { ok: false, message: "Există deja un articol cu acest slug." };
  }

  const ts = nowIso();
  const existing = index !== -1 ? articles[index] : null;
  const title = input.title.trim();

  const article: BlogArticle = {
    id: existing?.id ?? input.id ?? buildArticleId(),
    title,
    slug,
    excerpt: input.excerpt?.trim() ?? existing?.excerpt ?? "",
    content: input.content ?? existing?.content ?? "",
    coverImageUrl: input.coverImageUrl?.trim() ?? existing?.coverImageUrl ?? "",
    published: input.published ?? existing?.published ?? false,
    metaTitle: input.metaTitle?.trim() || existing?.metaTitle || title,
    metaDescription: input.metaDescription?.trim() || existing?.metaDescription || input.excerpt?.trim() || "",
    categories: input.categories ?? existing?.categories ?? [],
    tags: input.tags ?? existing?.tags ?? [],
    createdAt: existing?.createdAt ?? ts,
    updatedAt: ts,
  };

  if (index !== -1) {
    articles[index] = article;
  } else {
    articles.unshift(article);
  }

  await writeBlogArticles(articles);
  return { ok: true, article };
}

export async function deleteBlogArticle(
  id: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  const articles = await readBlogArticles();
  const filtered = articles.filter((a) => a.id !== id);
  if (filtered.length === articles.length) {
    return { ok: false, message: "Articolul nu a fost găsit." };
  }
  await writeBlogArticles(filtered);
  return { ok: true };
}
