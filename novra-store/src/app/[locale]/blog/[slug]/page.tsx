import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { findBlogArticleBySlug } from "@/lib/blog-server";
import { estimateReadingTime, formatReadingTime } from "@/lib/blog-utils";
import { renderMarkdown } from "@/lib/markdown";
import { ArrowLeft, Tag, Clock } from "lucide-react";

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "blog" });
  const article = await findBlogArticleBySlug(slug);
  if (!article || !article.published) return { title: t("articleMetadataTitle") };
  return {
    title: article.metaTitle || article.title,
    description: article.metaDescription || article.excerpt,
  };
}

function formatDate(iso: string, locale: string): string {
  const dateLocale = locale === "ro" ? "ro-RO" : locale === "de" ? "de-DE" : "en-US";
  return new Date(iso).toLocaleDateString(dateLocale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function BlogArticlePage({ params }: PageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("blog");
  const tc = await getTranslations("common");
  const article = await findBlogArticleBySlug(slug);

  if (!article || !article.published) {
    notFound();
  }

  const html = renderMarkdown(article.content);
  const readingMinutes = estimateReadingTime(article.content);

  return (
    <div className="min-h-screen bg-novra-bg text-white selection:bg-purple-500/30">
      <Navbar />
      <main className="pb-page">
        {article.coverImageUrl ? (
          <div className="relative w-full aspect-[21/9] sm:aspect-[2.4/1] max-h-[420px] border-b border-white/10">
            <Image
              src={article.coverImageUrl}
              alt={article.title}
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
            <div className="absolute inset-0 blog-hero-gradient" />
            <div className="absolute inset-x-0 bottom-0 px-4 sm:px-6 md:px-12 pb-8 pt-24 max-w-4xl mx-auto">
              {article.categories.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {article.categories.map((cat) => (
                    <span
                      key={cat}
                      className="inline-flex items-center gap-1 rounded-full bg-purple-600/25 backdrop-blur-sm border border-purple-500/20 px-2.5 py-1 text-xs text-purple-200"
                    >
                      <Tag size={12} />
                      {cat}
                    </span>
                  ))}
                </div>
              )}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
                {article.title}
              </h1>
            </div>
          </div>
        ) : null}

        <div className="px-4 sm:px-6 md:px-12 max-w-3xl mx-auto pt-8">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-purple-400 transition mb-8"
          >
            <ArrowLeft size={16} />
            {t("backToGuides")}
          </Link>

          {!article.coverImageUrl && (
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
            </header>
          )}

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-6 pb-6 border-b border-white/10">
            <time dateTime={article.createdAt}>
              {formatDate(article.createdAt, locale)}
            </time>
            <span className="inline-flex items-center gap-1.5 text-purple-300/80">
              <Clock size={14} />
              {formatReadingTime(readingMinutes)}
            </span>
          </div>

          {article.excerpt && (
            <p className="mb-10 text-lg sm:text-xl text-gray-300 leading-relaxed border-l-4 border-purple-500/60 pl-5 font-light">
              {article.excerpt}
            </p>
          )}

          <article className="prose-novra" dangerouslySetInnerHTML={{ __html: html }} />

          {article.tags.length > 0 && (
            <div className="mt-12 pt-8 border-t border-white/10">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">{t("tags")}</p>
              <div className="flex flex-wrap gap-2">
                {article.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-lg border border-white/10 bg-novra-card/30 px-3 py-1.5 text-xs text-gray-400"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-12 rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-950/30 to-novra-card/30 p-6 text-center">
            <p className="text-sm text-gray-400 mb-4">{t("ctaText")}</p>
            <Link
              href="/produse"
              className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-6 py-3 text-sm font-semibold text-white hover:bg-purple-700 transition"
            >
              {tc("viewProducts")}
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
