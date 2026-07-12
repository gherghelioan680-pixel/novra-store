"use client";

import { ShoppingCart } from "lucide-react";
import ShakeButton from "./ShakeButton";

type EmptyOrdersStateProps = {
  title?: string;
  shopHref?: string;
  showShopButton?: boolean;
};

export default function EmptyOrdersState({
  title = "No Orders Yet",
  shopHref = "/produse",
  showShopButton = true,
}: EmptyOrdersStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="relative mb-4">
        <ShoppingCart className="h-12 w-12 text-gray-500" strokeWidth={1.5} />
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
          +
        </span>
      </div>
      <p className="text-lg font-medium text-gray-300">{title}</p>
      {showShopButton && (
        <div className="mt-6">
          <ShakeButton href={shopHref}>Shop Now</ShakeButton>
        </div>
      )}
    </div>
  );
}
