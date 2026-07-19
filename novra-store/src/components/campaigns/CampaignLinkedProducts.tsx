"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import ProductImage from "@/components/produse/ProductImage";
import { buildProductUrl, getProductById, type CatalogProduct } from "@/lib/catalog";

type CampaignLinkedProductsProps = {
  productIds: string[];
};

export default function CampaignLinkedProducts({ productIds }: CampaignLinkedProductsProps) {
  const t = useTranslations("campaign");

  const products = productIds
    .map((id) => getProductById(id))
    .filter((p): p is CatalogProduct => Boolean(p));

  if (products.length === 0) return null;

  return (
    <section className="mt-12">
      <div className="mb-6 flex items-center gap-2">
        <ShoppingBag size={18} className="text-purple-400" />
        <h2 className="text-xl font-bold text-white">{t("includedProducts")}</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <Link
            key={product.id}
            href={buildProductUrl(product.id)}
            className="group flex gap-4 rounded-2xl border border-white/10 bg-novra-card/30 p-4 transition hover:border-purple-500/30 hover:bg-novra-card/50"
          >
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-novra-bg/50">
              <ProductImage
                src={product.imageSrc ?? product.image}
                category={product.category}
                alt={product.title}
                fill
                className="object-cover"
                sizes="80px"
              />
            </div>
            <div className="min-w-0 flex flex-col justify-center">
              <h3 className="font-semibold text-white group-hover:text-purple-300 transition line-clamp-2">
                {product.title}
              </h3>
              <p className="mt-1 text-sm font-bold text-purple-300">
                {product.basePrice.toFixed(2)} RON
              </p>
              <span className="mt-2 inline-flex items-center gap-1 text-xs text-gray-500 group-hover:text-purple-400 transition">
                {t("viewProduct")}
                <ArrowLeft size={12} className="rotate-180" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
