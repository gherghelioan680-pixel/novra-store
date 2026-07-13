import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getPublishedArticles } from "@/lib/blog-server";
import { estimateReadingTime, formatReadingTime } from "@/lib/blog-utils";
import { BookOpen, ArrowRight, Tag, Clock } from "lucide-react";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "blog" });

  return {
    title: t("metadataTitle"),
    description: t("metadataDescription"),
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

export default async function BlogListingPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("blog");
  const articles = await getPublishedArticles();
  const [featured, ...rest] = articles;

  return (
    <div className="min-h-screen bg-novra-bg text-white selection:bg-purple-500/30">
      <Navbar />
      <main className="pb-page px-4 sm:px-6 md:px-12 max-w-5xl mx-auto">
        <div className="pt-8 pb-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-600/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-purple-300 mb-4">
            <BookOpen size={14} />
            {t("badge")}
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">{t("title")}</h1>
          <p className="text-gray-400 max-w-lg mx-auto">
            {t("subtitle")}
          </p>
        </div>

        {articles.length === 0 ? (
          <p className="text-center text-gray-500 py-16">{t("empty")}</p>
        ) : (
          <div className="space-y-8">
            {featured && (
              <Link
                href={`/blog/${featured.slug}`}
                className="group block rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-950/40 via-novra-card/40 to-novra-bg overflow-hidden transition hover:border-purple-500/40"
              >
                <div className="grid md:grid-cols-2 gap-0">
                  {featured.coverImageUrl && (
                    <div className="relative aspect-[16/10] md:aspect-auto md:min-h-[280px] bg-novra-bg/50">
                      <Image
                        src={featured.coverImageUrl}
                        alt={featured.title}
                        fill
                        className="object-cover transition duration-500 group-hover:scale-[1.02]"
                        sizes="(max-width: 768px) 100vw, 50vw"
                        priority
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-novra-bg/60 via-transparent to-transparent md:hidden" />
                    </div>
                  )}
                  <div className="p-6 sm:p-8 flex flex-col justify-center">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-purple-400 mb-3">
                      {t("featured")}
                    </span>
                    {featured.categories.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {featured.categories.slice(0, 2).map((cat) => (
                          <span
                            key={cat}
                            className="inline-flex items-center gap-1 rounded-full bg-purple-600/15 px-2.5 py-0.5 text-[10px] font-medium text-purple-300"
                          >
                            <Tag size={10} />
                            {cat}
                          </span>
                        ))}
                      </div>
                    )}
                    <h2 className="text-2xl sm:text-3xl font-bold text-white group-hover:text-purple-200 transition leading-tight">
                      {featured.title}
                    </h2>
                    <p className="mt-3 text-gray-400 line-clamp-3 leading-relaxed">{featured.excerpt}</p>
                    <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-gray-500">
                      <span>{formatDate(featured.createdAt, locale)}</span>
                      <span className="inline-flex items-center gap-1">
                        <Clock size={12} />
                        {formatReadingTime(estimateReadingTime(featured.content))}
                      </span>
                    </div>
                    <span className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-purple-400 group-hover:gap-2 transition-all">
                      {t("readFullGuide")}
                      <ArrowRight size={14} />
                    </span>
                  </div>
                </div>
              </Link>
            )}

            {rest.length > 0 && (
              <div className="grid gap-6 sm:grid-cols-2">
                {rest.map((article) => (
                  <Link
                    key={article.id}
                    href={`/blog/${article.slug}`}
                    className="group rounded-2xl border border-white/10 bg-novra-card/30 overflow-hidden transition hover:border-purple-500/30 hover:bg-novra-card/50"
                  >
                    {article.coverImageUrl && (
                      <div className="relative aspect-[16/9] bg-novra-bg/50 overflow-hidden">
                        <Image
                          src={article.coverImageUrl}
                          alt={article.title}
                          fill
                          className="object-cover transition duration-500 group-hover:scale-[1.03]"
                          sizes="(max-width: 640px) 100vw, 50vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-novra-bg/70 via-transparent to-transparent opacity-60" />
                      </div>
                    )}
                    <div className="p-5">
                      {article.categories.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {article.categories.slice(0, 2).map((cat) => (
                            <span
                              key={cat}
                              className="inline-flex items-center gap-1 rounded-full bg-purple-600/15 px-2 py-0.5 text-[10px] font-medium text-purple-300"
                            >
                              <Tag size={10} />
                              {cat}
                            </span>
                          ))}
                        </div>
                      )}
                      <h2 className="text-lg font-semibold text-white group-hover:text-purple-300 transition">
                        {article.title}
                      </h2>
                      <p className="mt-2 text-sm text-gray-400 line-clamp-2">{article.excerpt}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                        <span>{formatDate(article.createdAt, locale)}</span>
                        <span className="inline-flex items-center gap-1">
                          <Clock size={11} />
                          {formatReadingTime(estimateReadingTime(article.content))}
                        </span>
                      </div>
                      <span className="mt-3 inline-flex items-center gap-1 text-sm text-purple-400 group-hover:gap-2 transition-all">
                        {t("readArticle")}
                        <ArrowRight size={14} />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
