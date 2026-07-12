import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { findBlogArticleBySlug } from "@/lib/blog-server";
import { renderMarkdown } from "@/lib/markdown";
import { ArrowLeft, Tag } from "lucide-react";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await findBlogArticleBySlug(slug);
  if (!article || !article.published) return { title: "Articol — NOVRA" };
  return {
    title: article.metaTitle || article.title,
    description: article.metaDescription || article.excerpt,
  };
}

export default async function BlogArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = await findBlogArticleBySlug(slug);

  if (!article || !article.published) {
    notFound();
  }

  const html = renderMarkdown(article.content);

  return (
    <div className="min-h-screen bg-novra-bg text-white selection:bg-purple-500/30">
      <Navbar />
      <main className="pb-page px-4 sm:px-6 md:px-12 max-w-3xl mx-auto pt-8">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-purple-400 transition mb-8"
        >
          <ArrowLeft size={16} />
          Înapoi la ghiduri
        </Link>

        {article.coverImageUrl && (
          <div className="relative aspect-[21/9] rounded-2xl overflow-hidden mb-8 border border-white/10">
            <Image
              src={article.coverImageUrl}
              alt={article.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 768px"
            />
          </div>
        )}

        <header className="mb-8">
          {article.categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {article.categories.map((cat) => (
                <span
                  key={cat}
                  className="inline-flex items-center gap-1 rounded-full bg-purple-600/15 px-2.5 py-1 text-xs text-purple-300"
                >
                  <Tag size={12} />
                  {cat}
                </span>
              ))}
            </div>
          )}
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-3">
            {article.title}
          </h1>
          <p className="text-gray-400 text-sm">
            {new Date(article.createdAt).toLocaleDateString("ro-RO", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
          {article.excerpt && (
            <p className="mt-4 text-lg text-gray-300 leading-relaxed border-l-2 border-purple-500/50 pl-4">
              {article.excerpt}
            </p>
          )}
        </header>

        <article
          className="prose-novra"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        {article.tags.length > 0 && (
          <div className="mt-10 pt-6 border-t border-white/10 flex flex-wrap gap-2">
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-lg border border-white/10 bg-novra-card/30 px-3 py-1 text-xs text-gray-400"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
