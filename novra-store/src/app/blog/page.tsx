import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getPublishedArticles } from "@/lib/blog-server";
import { BookOpen, ArrowRight, Tag } from "lucide-react";

export const metadata: Metadata = {
  title: "Ghiduri & Blog — NOVRA",
  description: "Ghiduri, sfaturi și noutăți despre cabluri premium, încărcare rapidă și accesorii NOVRA.",
};

export default async function BlogListingPage() {
  const articles = await getPublishedArticles();

  return (
    <div className="min-h-screen bg-novra-bg text-white selection:bg-purple-500/30">
      <Navbar />
      <main className="pb-page px-4 sm:px-6 md:px-12 max-w-5xl mx-auto">
        <div className="pt-8 pb-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-600/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-purple-300 mb-4">
            <BookOpen size={14} />
            Ghiduri NOVRA
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">Blog & Ghiduri</h1>
          <p className="text-gray-400 max-w-lg mx-auto">
            Sfaturi practice, comparații și noutăți despre produsele NOVRA.
          </p>
        </div>

        {articles.length === 0 ? (
          <p className="text-center text-gray-500 py-16">Articolele vor apărea în curând.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {articles.map((article) => (
              <Link
                key={article.id}
                href={`/blog/${article.slug}`}
                className="group rounded-2xl border border-white/10 bg-novra-card/30 overflow-hidden transition hover:border-purple-500/30 hover:bg-novra-card/50"
              >
                {article.coverImageUrl && (
                  <div className="relative aspect-[16/9] bg-novra-bg/50">
                    <Image
                      src={article.coverImageUrl}
                      alt={article.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, 50vw"
                    />
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
                  <p className="mt-3 text-xs text-gray-500">
                    {new Date(article.createdAt).toLocaleDateString("ro-RO", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm text-purple-400 group-hover:gap-2 transition-all">
                    Citește articolul
                    <ArrowRight size={14} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
