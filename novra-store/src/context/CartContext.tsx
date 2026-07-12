"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { CheckCircle2, ShoppingBag } from "lucide-react";
import {
  getCartQuantityForProduct,
  getProductById,
  getProductStockQuantity,
} from "@/lib/catalog";

export type CartItem = {
  id: string;
  productId: string;
  title: string;
  variantLabel: string;
  unitPrice: number;
  quantity: number;
  imageSrc: string;
};

type AddItemInput = {
  productId: string;
  title: string;
  variantLabel: string;
  unitPrice: number;
  imageSrc: string;
  quantity?: number;
};

type CartContextType = {
  items: CartItem[];
  addItem: (item: AddItemInput) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  hydrated: boolean;
};

const CartContext = createContext<CartContextType | null>(null);

const STORAGE_KEY = "novra-cart";

const noopCart: CartContextType = {
  items: [],
  addItem: () => {},
  removeItem: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  totalItems: 0,
  totalPrice: 0,
  hydrated: false,
};

function makeItemId(productId: string, variantLabel: string) {
  return `${productId}::${variantLabel}`;
}

function readStoredCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStoredCart(items: CartItem[]): boolean {
  if (typeof window === "undefined") return false;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    return true;
  } catch {
    return false;
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const stored = readStoredCart();
      setItems((prev) => (prev.length > 0 ? prev : stored));
      if (stored.length === 0) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
        } catch {
          setStorageAvailable(false);
        }
      }
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hydrated || !storageAvailable) return;
    const timer = window.setTimeout(() => {
      const saved = writeStoredCart(items);
      if (!saved) setStorageAvailable(false);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [items, hydrated, storageAvailable]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const addItem = useCallback((input: AddItemInput) => {
    const product = getProductById(input.productId);
    if (!product) {
      setToast("Produsul nu mai este disponibil.");
      return;
    }

    const available = getProductStockQuantity(product);
    if (available <= 0) {
      setToast("Stoc epuizat pentru acest produs.");
      return;
    }

    const id = makeItemId(input.productId, input.variantLabel);
    setItems((prev) => {
      const existing = prev.find((item) => item.id === id);
      const requestedQty = (existing?.quantity ?? 0) + (input.quantity ?? 1);
      const totalForProduct = getCartQuantityForProduct(prev, input.productId) - (existing?.quantity ?? 0) + requestedQty;

      if (totalForProduct > available) {
        setToast(`Stoc insuficient. Disponibil: ${available} bucăți.`);
        return prev;
      }

      const next = existing
        ? prev.map((item) =>
            item.id === id
              ? { ...item, quantity: item.quantity + (input.quantity ?? 1) }
              : item
          )
        : [
            ...prev,
            {
              id,
              productId: input.productId,
              title: input.title,
              variantLabel: input.variantLabel,
              unitPrice: input.unitPrice,
              quantity: input.quantity ?? 1,
              imageSrc: input.imageSrc,
            },
          ];

      writeStoredCart(next);
      return next;
    });
    setToast("Produs adăugat în coș");
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => {
      const next = prev.filter((item) => item.id !== id);
      writeStoredCart(next);
      return next;
    });
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    setItems((prev) => {
      const target = prev.find((item) => item.id === id);
      if (!target) return prev;

      if (quantity < 1) {
        const next = prev.filter((item) => item.id !== id);
        writeStoredCart(next);
        return next;
      }

      const product = getProductById(target.productId);
      if (!product) {
        const next = prev.filter((item) => item.id !== id);
        writeStoredCart(next);
        return next;
      }

      const available = getProductStockQuantity(product);
      const totalForProduct =
        getCartQuantityForProduct(prev, target.productId) - target.quantity + quantity;

      if (totalForProduct > available) {
        setToast(`Stoc insuficient. Disponibil: ${available} bucăți.`);
        return prev;
      }

      const next = prev.map((item) => (item.id === id ? { ...item, quantity } : item));
      writeStoredCart(next);
      return next;
    });
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    writeStoredCart([]);
  }, []);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        hydrated,
      }}
    >
      {children}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-[calc(var(--header-height,148px)+0.75rem)] left-1/2 -translate-x-1/2 z-[99999] flex items-center gap-2 bg-green-600 text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-2xl shadow-green-900/40 animate-[slideUp_0.25s_ease-out] pointer-events-none max-w-[calc(100vw-2rem)]"
        >
          <CheckCircle2 size={18} className="shrink-0" aria-hidden />
          <ShoppingBag size={16} className="shrink-0" aria-hidden />
          {toast}
        </div>
      )}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    return noopCart;
  }
  return context;
}
