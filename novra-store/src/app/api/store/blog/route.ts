import type { NextRequest } from "next/server";
import { isAdminRequest, unauthorizedResponse } from "@/lib/server-auth";
import {
  deleteBlogArticle,
  findBlogArticleBySlug,
  getPublishedArticles,
  readBlogArticles,
  upsertBlogArticle,
} from "@/lib/blog-server";
import type { BlogArticle } from "@/lib/blog-types";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug");
  const publishedOnly = request.nextUrl.searchParams.get("published") === "1";

  if (slug) {
    const article = await findBlogArticleBySlug(slug);
    if (!article || (publishedOnly && !article.published)) {
      return Response.json({ article: null }, { status: 404 });
    }
    return Response.json({ article });
  }

  if (publishedOnly) {
    const articles = await getPublishedArticles();
    return Response.json({ articles });
  }

  if (!isAdminRequest(request)) {
    const articles = await getPublishedArticles();
    return Response.json({ articles });
  }

  const articles = await readBlogArticles();
  return Response.json({ articles });
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorizedResponse();

  try {
    const body = await request.json();
    const action = body?.action as string | undefined;

    if (action === "upsert") {
      const article = body?.article as Partial<BlogArticle> & { title: string; slug: string };
      if (!article?.title || !article?.slug) {
        return Response.json({ ok: false, message: "Titlu și slug obligatorii." }, { status: 400 });
      }
      const result = await upsertBlogArticle(article);
      if (!result.ok) {
        return Response.json({ ok: false, message: result.message }, { status: 400 });
      }
      return Response.json({ ok: true, article: result.article });
    }

    if (action === "delete") {
      const id = body?.id as string | undefined;
      if (!id) {
        return Response.json({ ok: false, message: "ID lipsă." }, { status: 400 });
      }
      const result = await deleteBlogArticle(id);
      if (!result.ok) {
        return Response.json({ ok: false, message: result.message }, { status: 404 });
      }
      return Response.json({ ok: true });
    }

    return Response.json({ ok: false, message: "Acțiune necunoscută." }, { status: 400 });
  } catch {
    return Response.json({ ok: false, message: "Cerere invalidă." }, { status: 400 });
  }
}
