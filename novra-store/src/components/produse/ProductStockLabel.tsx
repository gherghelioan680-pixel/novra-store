import { formatStockLabel, getProductStockQuantity, type CatalogProduct } from "@/lib/catalog";

type ProductStockLabelProps = {
  product: CatalogProduct;
  className?: string;
};

export default function ProductStockLabel({ product, className = "" }: ProductStockLabelProps) {
  const quantity = getProductStockQuantity(product);
  const inStock = quantity > 0;

  return (
    <span
      className={`text-[11px] font-medium ${inStock ? "text-emerald-400" : "text-red-400"} ${className}`}
    >
      {formatStockLabel(quantity)}
    </span>
  );
}
