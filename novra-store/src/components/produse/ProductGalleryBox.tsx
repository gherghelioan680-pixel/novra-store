import type { ReactNode } from "react";

type ProductGalleryBoxProps = {
  children: ReactNode;
  className?: string;
  aspectClassName?: string;
  contentPadding?: string;
  overlay?: ReactNode;
};

const GALLERY_BG =
  "bg-gradient-to-br from-purple-500/8 via-purple-900/5 to-transparent border border-white/8";

export default function ProductGalleryBox({
  children,
  className = "",
  aspectClassName = "aspect-square md:aspect-[4/5]",
  contentPadding = "p-2 sm:p-3",
  overlay,
}: ProductGalleryBoxProps) {
  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-xl ${GALLERY_BG} ${aspectClassName} ${className}`}
    >
      {overlay}
      <div className={`absolute inset-0 flex items-center justify-center ${contentPadding}`}>
        <div className="relative h-full w-full min-h-0">{children}</div>
      </div>
    </div>
  );
}

export function ProductGalleryCard({
  children,
  className = "",
  overlay,
}: Omit<ProductGalleryBoxProps, "aspectClassName">) {
  return (
    <div
      className={`relative h-40 sm:h-44 overflow-hidden rounded-lg ${GALLERY_BG} border border-white/8 ${className}`}
    >
      {overlay}
      <div className="absolute inset-0 flex items-center justify-center p-2">
        <div className="relative h-full w-full min-h-0">{children}</div>
      </div>
    </div>
  );
}
