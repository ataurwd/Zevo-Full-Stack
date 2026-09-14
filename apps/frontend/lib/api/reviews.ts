import { apiFetch } from "./client";

export interface ReviewItem {
  _id: string;
  user_id: string;
  user_name: string;
  product_id: string;
  order_id: string;
  sub_order_id: string;
  seller_id: string;
  rating: number;
  title?: string;
  comment: string;
  images?: string[];
  seller_reply?: {
    text: string;
    replied_at: string;
    seller_id: string;
  } | null;
  created_at: string;
  updated_at: string;
}

export async function getProductReviews(productId: string, limit = 20, skip = 0) {
  const res = await apiFetch<{
    success: boolean;
    data: { reviews: ReviewItem[]; total: number };
  }>(`/reviews/products/${productId}?limit=${limit}&skip=${skip}`);
  return res.data;
}

export async function createReview(data: {
  product_id: string;
  order_id: string;
  sub_order_id: string;
  rating: number;
  title?: string;
  comment: string;
  images?: string[];
}) {
  const res = await apiFetch<{ success: boolean; data: ReviewItem }>("/reviews", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function replyToReview(reviewId: string, reply: string) {
  const res = await apiFetch<{ success: boolean; data: ReviewItem }>(
    `/reviews/${reviewId}/reply`,
    {
      method: "PATCH",
      body: JSON.stringify({ reply }),
    }
  );
  return res.data;
}
