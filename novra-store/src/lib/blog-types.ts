export type BlogArticle = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImageUrl: string;
  published: boolean;
  metaTitle: string;
  metaDescription: string;
  categories: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export const BLOG_STORAGE_FILE = "blog-articles.json";

export function normalizeBlogSlug(slug: string): string {
  return slug
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
