import type { MetadataRoute } from "next";
import { defaultLocale } from "@/i18n/routing";
import { getPublishedArticles } from "@/lib/blog-server";
import { getActiveCampaignsServer } from "@/lib/campaigns-server";
import { CATALOG_PRODUCTS } from "@/lib/catalog";
import { getActiveCustomProducts } from "@/lib/products-server";
import { absoluteUrl, buildLanguageAlternates } from "@/lib/seo";

const STATIC_PATHS = [
  "/",
  "/produse",
  "/despre-noi",
  "/novra-lab",
  "/contact",
  "/blog",
  "/faq",
  "/termeni-si-conditii",
  "/politica-confidentialitate",
  "/politica-cookies",
  "/termeni-program-afiliere",
  "/program-afiliere",
  "/livrare-si-plata",
  "/garantie-si-retur",
  "/accesorii",
  "/promotii",
  "/recenzii",
  "/urmareste-comanda",
  "/verificare-autenticitate",
  "/harta-livrari",
] as const;

type ChangeFrequency = NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;

function safeLastModified(value?: string | Date): Date {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  return new Date();
}

function sitemapEntry(
  path: string,
  options?: {
    lastModified?: Date;
    changeFrequency?: ChangeFrequency;
    priority?: number;
  }
): MetadataRoute.Sitemap[number] {
  return {
    url: absoluteUrl(defaultLocale, path),
    lastModified: safeLastModified(options?.lastModified),
    changeFrequency: options?.changeFrequency,
    priority: options?.priority,
    alternates: {
      languages: buildLanguageAlternates(path),
    },
  };
}

function staticChangeFrequency(path: string): ChangeFrequency {
  if (path === "/") return "weekly";
  if (path === "/blog" || path === "/produse" || path === "/promotii") return "daily";
  return "monthly";
}

function staticPriority(path: string): number {
  if (path === "/") return 1;
  if (path === "/produse") return 0.9;
  if (path === "/blog" || path === "/contact" || path === "/despre-noi") return 0.8;
  return 0.5;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) =>
    sitemapEntry(path, {
      changeFrequency: staticChangeFrequency(path),
      priority: staticPriority(path),
    })
  );

  const productIds = new Set<string>();
  for (const product of CATALOG_PRODUCTS) {
    if (product.active === false) continue;
    productIds.add(product.id);
  }

  const customProducts = await getActiveCustomProducts();
  for (const product of customProducts) {
    productIds.add(product.id);
  }

  for (const productId of productIds) {
    entries.push(
      sitemapEntry(`/produse/${productId}`, {
        changeFrequency: "weekly",
        priority: 0.8,
      })
    );
  }

  const articles = await getPublishedArticles();
  for (const article of articles) {
    entries.push(
      sitemapEntry(`/blog/${article.slug}`, {
        lastModified: safeLastModified(article.updatedAt),
        changeFrequency: "monthly",
        priority: 0.6,
      })
    );
  }

  const campaigns = await getActiveCampaignsServer();
  for (const campaign of campaigns) {
    entries.push(
      sitemapEntry(`/campanii/${campaign.slug}`, {
        lastModified: safeLastModified(campaign.updatedAt),
        changeFrequency: "weekly",
        priority: 0.7,
      })
    );
  }

  return entries;
}
