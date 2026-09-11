"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  Cart,
  getCart,
  addToCart,
  updateCartQuantity,
  removeFromCart,
  clearCart as clearCartApi,
  applyCoupon as applyCouponApi,
  removeCoupon as removeCouponApi,
  validateCart as validateCartApi,
  mergeCart as mergeCartApi,
  CartValidationResult,
} from "../lib/api/cart";
import { getGuestCartId, clearGuestCartId } from "../lib/api/client";
import { useAuth } from "./AuthProvider";

interface CartContextType {
  cart: Cart | null;
  isLoading: boolean;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  addItem: (productId: string, variantId: string, quantity?: number) => Promise<void>;
  updateQuantity: (variantId: string, quantity: number) => Promise<void>;
  removeItem: (variantId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => Promise<void>;
  validateCart: () => Promise<CartValidationResult>;
  refreshCart: () => Promise<void>;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  const refreshCart = useCallback(async () => {
    try {
      const data = await getCart();
      setCart(data);
    } catch {
      // Ignore initial load failures
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  // Merge guest cart on authentication
  useEffect(() => {
    async function handleLoginMerge() {
      if (isAuthenticated) {
        const guestId = getGuestCartId();
        if (guestId) {
          try {
            const merged = await mergeCartApi(guestId);
            setCart(merged);
            clearGuestCartId();
          } catch {
            await refreshCart();
          }
        }
      }
    }
    handleLoginMerge();
  }, [isAuthenticated, refreshCart]);

  const openDrawer = () => setIsDrawerOpen(true);
  const closeDrawer = () => setIsDrawerOpen(false);

  const addItem = async (productId: string, variantId: string, quantity = 1) => {
    const updated = await addToCart({
      product_id: productId,
      variant_id: variantId,
      quantity,
    });
    setCart(updated);
    openDrawer();
  };

  const updateQuantity = async (variantId: string, quantity: number) => {
    const updated = await updateCartQuantity(variantId, quantity);
    setCart(updated);
  };

  const removeItem = async (variantId: string) => {
    const updated = await removeFromCart(variantId);
    setCart(updated);
  };

  const clearCart = async () => {
    await clearCartApi();
    setCart({
      items: [],
      subtotal: 0,
      discount: 0,
      total: 0,
      item_count: 0,
      coupon: null,
      updated_at: new Date().toISOString(),
    });
  };

  const applyCoupon = async (code: string) => {
    const updated = await applyCouponApi(code);
    setCart(updated);
  };

  const removeCoupon = async () => {
    const updated = await removeCouponApi();
    setCart(updated);
  };

  const validateCart = async (): Promise<CartValidationResult> => {
    const res = await validateCartApi();
    setCart(res.cart);
    return res;
  };

  const itemCount = cart?.item_count || 0;

  return (
    <CartContext.Provider
      value={{
        cart,
        isLoading,
        isDrawerOpen,
        openDrawer,
        closeDrawer,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        applyCoupon,
        removeCoupon,
        validateCart,
        refreshCart,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
