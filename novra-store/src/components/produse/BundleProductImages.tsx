"use client";

import ProductImage from "@/components/produse/ProductImage";
import {
  BUNDLE_COLORS,
  DEFAULT_BUNDLE_SELECTIONS,
  getAdapterColorImage,
  getCableColorImage,
} from "@/lib/catalog";

type BundleProductImagesProps = {
  productId: string;
  adapterIdx?: number;
  cableIdx?: number;
  className?: string;
  adapterClassName?: string;
  cableClassName?: string;
  imageClassName?: string;
  sizes?: string;
  priority?: boolean;
};

export default function BundleProductImages({
  productId,
  adapterIdx,
  cableIdx,
  className = "flex flex-col h-full w-full items-stretch justify-center gap-0.5 sm:gap-1 min-h-0",
  adapterClassName = "relative h-[55%] w-full min-h-0 shrink-0",
  cableClassName = "relative h-[45%] w-full min-h-0 shrink-0",
  imageClassName = "object-contain object-center",
  sizes,
  priority = false,
}: BundleProductImagesProps) {
  const defaults = DEFAULT_BUNDLE_SELECTIONS[productId] ?? { adapterIdx: 0, cableIdx: 0 };
  const resolvedAdapterIdx = adapterIdx ?? defaults.adapterIdx;
  const resolvedCableIdx = cableIdx ?? defaults.cableIdx;

  return (
    <div className={className}>
      <div className={adapterClassName}>
        <ProductImage
          src={getAdapterColorImage(resolvedAdapterIdx)}
          category="lightning"
          alt={`Adaptor ${BUNDLE_COLORS[resolvedAdapterIdx]}`}
          fill
          sizes={sizes}
          className={imageClassName}
          priority={priority}
          draggable={false}
        />
      </div>
      <div className={cableClassName}>
        <ProductImage
          src={getCableColorImage(resolvedCableIdx)}
          category="usb-c"
          alt={`Cablu ${BUNDLE_COLORS[resolvedCableIdx]}`}
          fill
          sizes={sizes}
          className={imageClassName}
          priority={priority}
          draggable={false}
        />
      </div>
    </div>
  );
}
