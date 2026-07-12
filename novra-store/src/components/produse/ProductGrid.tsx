import ProductImage from "@/components/produse/ProductImage";
import Link from "next/link";
import type { CatalogProduct } from "@/lib/catalog";
import { buildProductUrl } from "@/lib/catalog";
import { ProductBadgesOverlay } from "@/components/produse/ProductBadges";

export type { CatalogProduct };

type ProductGridProps = {
  products: CatalogProduct[];
  activeCategory: string;
};

export function ProductGrid({ products }: ProductGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {products.map((product) => (
        <Link
          key={product.id}
          href={buildProductUrl(product.id)}
          aria-label={`Vezi detalii pentru ${product.title}`}
          className="group bg-novra-card/20 border border-white/8 hover:border-purple-500/30 active:border-purple-500/50 active:scale-[0.99] rounded-xl p-3 transition-all duration-300 flex flex-col justify-between cursor-pointer relative touch-manipulation text-left w-full [-webkit-tap-highlight-color:transparent]"
        >
          <span className="flex flex-col justify-between w-full h-full">
            <span className="block">
              <span className="h-40 rounded-lg bg-gradient-to-br from-purple-500/5 to-transparent border border-white/8 mb-3 flex items-center justify-center relative overflow-hidden block">
                <ProductBadgesOverlay product={product} />
                <span className="absolute top-2 right-2 bg-novra-card/40 border border-white/10 text-gray-300 text-[8px] uppercase tracking-widest px-2 py-0.5 rounded-md font-medium">
                  {product.tag}
                </span>
                <span className="relative w-28 h-28 sm:w-32 sm:h-32 block transition-transform duration-500 group-hover:scale-105">
                  <ProductImage
                    src={product.imageSrc}
                    category={product.category}
                    alt={product.title}
                    fill
                    sizes="(max-width: 768px) 50vw, 33vw"
                    className="object-contain rounded-lg"
                    draggable={false}
                  />
                </span>
              </span>
              <span className="font-bold text-base text-white mb-0.5 group-hover:text-purple-400 transition-colors duration-300 block line-clamp-1">
                {product.title}
              </span>
              <span className="text-gray-500 text-[11px] font-light min-h-[28px] line-clamp-2 block">
                {product.specs.power} | {product.specs.material}
              </span>
            </span>
            <span className="border-t border-white/8 pt-2.5 flex items-center justify-between mt-2.5 block">
              <span className="block">
                <span className="text-[8px] uppercase tracking-widest text-gray-600 block font-medium">De la</span>
                <span className="text-sm font-bold text-white tracking-tight">{product.basePrice.toFixed(2)} RON</span>
              </span>
              <span className="text-[11px] text-purple-400 group-hover:underline font-medium min-h-11 flex items-center">
                Detalii →
              </span>
            </span>
          </span>
        </Link>
      ))}
    </div>
  );
}
