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
  className = "flex h-full w-full items-center justify-center gap-1.5",
  adapterClassName = "relative h-full w-[46%]",
  cableClassName = "relative h-full w-[46%]",
  imageClassName = "object-contain",
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
