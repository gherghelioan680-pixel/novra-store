"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { getProductImageFallback } from "@/lib/catalog";

type ProductImageProps = Omit<ImageProps, "src" | "onError"> & {
  src: string;
  category?: string;
};

export default function ProductImage({ src, category, alt, ...props }: ProductImageProps) {
  const fallback = getProductImageFallback(category ?? "");
  const [imgSrc, setImgSrc] = useState(src);

  return (
    <Image
      {...props}
      src={imgSrc}
      alt={alt}
      onError={() => {
        if (imgSrc !== fallback) setImgSrc(fallback);
      }}
    />
  );
}
