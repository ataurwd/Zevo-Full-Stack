"use client";

import React, { useState } from "react";
import { createReview, ReviewItem } from "../../lib/api/reviews";
import { Star, X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  orderId: string;
  subOrderId: string;
  onSuccess?: (review: ReviewItem) => void;
}

export function ReviewModal({
  isOpen,
  onClose,
  productId,
  productName,
  orderId,
  subOrderId,
  onSuccess,
}: ReviewModalProps) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const review = await createReview({
        product_id: productId,
        order_id: orderId,
        sub_order_id: subOrderId,
        rating,
        title: title.trim() || undefined,
        comment: comment.trim(),
      });
      if (onSuccess) onSuccess(review);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to submit review");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
      <div className="liquid-glass-card rounded-3xl p-6 max-w-md w-full shadow-2xl border border-white/80">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-black text-slate-900">Review Product</h3>
            <p className="text-xs text-slate-500 truncate max-w-xs">{productName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 mb-4">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Star Rating Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Rating</label>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="p-1 focus:outline-none transition-transform hover:scale-110 cursor-pointer"
                >
                  <Star
                    className={`w-6 h-6 ${
                      (hoverRating || rating) >= star
                        ? "fill-amber-400 text-amber-400"
                        : "text-slate-300"
                    }`}
                  />
                </button>
              ))}
              <span className="text-xs font-black text-slate-700 ml-2">
                {rating} out of 5 stars
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Headline (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Absolutely loved it!"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Your Review & Experience
            </label>
            <textarea
              required
              rows={4}
              placeholder="Write what you liked or disliked about this product..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !comment.trim()}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-blue-500/25 flex items-center gap-1.5"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              <span>Submit Review</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
