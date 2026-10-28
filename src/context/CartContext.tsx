import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

export type CartItem = {
  variantId: string;
  productId: string;
  slug: string;
  brand: string;
  nameAr: string;
  nameEn: string;
  colorAr: string;
  colorEn: string;
  colorHex: string;
  capacity: string;
  imageUrl: string | null;
  price: number;
  qty: number;
  // Optional installment preferences carried from the product page to checkout.
  months?: number;
  downPayment?: number;
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  addItem: (item: CartItem) => void;
  updateQty: (variantId: string, qty: number) => void;
  removeItem: (variantId: string) => void;
  clear: () => void;
  setItemInstallment: (variantId: string, months: number, downPayment: number) => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = 'kp_cart_v1';

function loadInitial(): CartItem[] {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (!v) return [];
    const parsed = JSON.parse(v);
    if (Array.isArray(parsed)) return parsed as CartItem[];
  } catch {
    // ignore
  }
  return [];
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => loadInitial());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items]);

  const addItem = (item: CartItem) => {
    setItems((prev) => {
      const idx = prev.findIndex((p) => p.variantId === item.variantId);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          qty: next[idx].qty + item.qty,
          // Preserve incoming installment prefs when provided.
          months: item.months ?? next[idx].months,
          downPayment: item.downPayment ?? next[idx].downPayment,
        };
        return next;
      }
      return [...prev, item];
    });
  };

  const updateQty = (variantId: string, qty: number) => {
    setItems((prev) =>
      prev
        .map((p) => (p.variantId === variantId ? { ...p, qty: Math.max(1, qty) } : p))
        .filter((p) => p.qty > 0),
    );
  };

  const removeItem = (variantId: string) => {
    setItems((prev) => prev.filter((p) => p.variantId !== variantId));
  };

  const clear = () => setItems([]);

  const setItemInstallment = (variantId: string, months: number, downPayment: number) => {
    setItems((prev) =>
      prev.map((p) => (p.variantId === variantId ? { ...p, months, downPayment } : p)),
    );
  };

  const count = useMemo(() => items.reduce((s, i) => s + i.qty, 0), [items]);
  const subtotal = useMemo(
    () => items.reduce((s, i) => s + i.price * i.qty, 0),
    [items],
  );

  const value = useMemo<CartContextValue>(
    () => ({ items, count, subtotal, addItem, updateQty, removeItem, clear, setItemInstallment }),
    [items, count, subtotal],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
