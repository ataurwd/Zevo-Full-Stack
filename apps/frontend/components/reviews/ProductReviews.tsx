"use client";

import React, { useState, useEffect } from "react";
import { getProductReviews, ReviewItem } from "../../lib/api/reviews";
import { Star, MessageSquare, Store, Clock, Loader2 } from "lucide-react";

interface ProductReviewsProps {
  productId: string;
}

export function ProductReviews({ productId }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productId) return;

    const loadReviews = async () => {
      setLoading(true);
      try {
        const data = await getProductReviews(productId);
        setReviews(data.reviews || []);
        setTotal(data.total || 0);
      } catch {
        // Fallback
      } finally {
        setLoading(false);
      }
    };

    loadReviews();
  }, [productId]);

  if (loading) {
    return (
      <div className="py-8 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600 mb-2" />
        <span className="text-xs">Loading verified customer reviews...</span>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="py-10 text-center text-slate-400">
        <Star className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <h4 className="text-sm font-bold text-slate-700">No customer reviews yet</h4>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          Be the first verified purchaser to share feedback and review this product!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h3 className="text-sm font-black text-slate-900">
          Customer Reviews ({total})
        </h3>
      </div>

      <div className="divide-y divide-slate-100">
        {reviews.map((r) => (
          <div key={r._id} className="py-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-3.5 h-3.5 ${
                        r.rating >= star
                          ? "fill-amber-400 text-amber-400"
                          : "text-slate-200"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs font-bold text-slate-900">{r.user_name}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200/60">
                  Verified Purchase
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {new Date(r.created_at).toLocaleDateString()}
              </span>
            </div>

            {r.title && (
              <h4 className="text-xs font-black text-slate-800">{r.title}</h4>
            )}

            <p className="text-xs text-slate-600 leading-relaxed">{r.comment}</p>

            {/* Seller Response Box */}
            {r.seller_reply && (
              <div className="mt-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <div className="flex items-center gap-1.5 text-blue-600 font-bold text-[11px]">
                  <Store className="w-3.5 h-3.5" />
                  <span>Merchant Response</span>
                  <span className="text-slate-400 font-normal font-mono text-[9px]">
                    • {new Date(r.seller_reply.replied_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-slate-700 italic">
                  "{r.seller_reply.text}"
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
