import { apiFetch } from "./client";

export interface CartItem {
  product_id: string;
  variant_id: string;
  store_id: string;
  seller_id: string;
  name: string;
  variant_name: string;
  sku: string;
  price: number; // in cents
  quantity: number;
  image_url?: string | null;
}

export interface CartCoupon {
  code: string;
  discount_percent?: number;
  discount_amount?: number; // in cents
}

export interface Cart {
  items: CartItem[];
  subtotal: number; // in cents
  discount: number; // in cents
  total: number; // in cents
  item_count: number;
  coupon?: CartCoupon | null;
  updated_at: string;
}

export interface CartValidationIssue {
  variant_id: string;
  sku: string;
  issue: "price_changed" | "out_of_stock" | "insufficient_stock" | "product_unavailable";
  old_value?: any;
  new_value?: any;
  message: string;
}

export interface CartValidationResult {
  is_valid: boolean;
  issues: CartValidationIssue[];
  cart: Cart;
}

export async function getCart(): Promise<Cart> {
  const res = await apiFetch<{ success: boolean; data: Cart }>("/cart");
  return res.data;
}

export async function addToCart(data: {
  product_id: string;
  variant_id: string;
  quantity: number;
}): Promise<Cart> {
  const res = await apiFetch<{ success: boolean; data: Cart }>("/cart/items", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function updateCartQuantity(
  variantId: string,
  quantity: number
): Promise<Cart> {
  const res = await apiFetch<{ success: boolean; data: Cart }>(
    `/cart/items/${variantId}`,
    {
      method: "PATCH",
      body: JSON.stringify({ quantity }),
    }
  );
  return res.data;
}

export async function removeFromCart(variantId: string): Promise<Cart> {
  const res = await apiFetch<{ success: boolean; data: Cart }>(
    `/cart/items/${variantId}`,
    {
      method: "DELETE",
    }
  );
  return res.data;
}

export async function clearCart(): Promise<void> {
  await apiFetch("/cart", {
    method: "DELETE",
  });
}

export async function mergeCart(guestSessionToken: string): Promise<Cart> {
  const res = await apiFetch<{ success: boolean; data: Cart }>("/cart/merge", {
    method: "POST",
    body: JSON.stringify({ guest_session_token: guestSessionToken }),
  });
  return res.data;
}

export async function validateCart(): Promise<CartValidationResult> {
  const res = await apiFetch<{ success: boolean; data: CartValidationResult }>(
    "/cart/validate",
    {
      method: "POST",
    }
  );
  return res.data;
}

export async function applyCoupon(code: string): Promise<Cart> {
  const res = await apiFetch<{ success: boolean; data: Cart }>("/cart/apply-coupon", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
  return res.data;
}

export async function removeCoupon(): Promise<Cart> {
  const res = await apiFetch<{ success: boolean; data: Cart }>("/cart/coupon", {
    method: "DELETE",
  });
  return res.data;
}
