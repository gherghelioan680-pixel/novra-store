"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useState } from "react";
import { getProductImageFallback } from "@/lib/catalog";
import { toImageApiUrl } from "@/lib/images";

type ProductImageProps = Omit<ImageProps, "src" | "onError"> & {
  src: string;
  category?: string;
};

export default function ProductImage({ src, category, alt, ...props }: ProductImageProps) {
  const fallback = getProductImageFallback(category ?? "");
  const resolvedSrc = toImageApiUrl(src);
  const [imgSrc, setImgSrc] = useState(resolvedSrc);

  useEffect(() => {
    setImgSrc(toImageApiUrl(src));
  }, [src]);

  return (
    <Image
      {...props}
      src={imgSrc}
      alt={alt}
      unoptimized={imgSrc.startsWith("/api/store/images")}
      onError={() => {
        if (imgSrc !== fallback) setImgSrc(fallback);
      }}
    />
  );
}
