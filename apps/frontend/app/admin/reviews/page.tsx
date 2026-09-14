"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Star,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  MessageSquare,
  ThumbsUp,
  ShieldCheck,
  Eye,
  Trash2,
} from "lucide-react";

interface ReviewItem {
  id: string;
  customer: string;
  product: string;
  store: string;
  rating: number;
  comment: string;
  status: "pending" | "approved" | "reported";
  date: string;
  helpfulCount: number;
}

const DEMO_REVIEWS: ReviewItem[] = [
  {
    id: "rev-301",
    customer: "Elena Rostova",
    product: "Linen Blend Tailored Blazer",
    store: "Lunora Atelier",
    rating: 5,
    comment: "The cut and stitching are truly exceptional. Exactly matches high-end atelier quality.",
    status: "approved",
    date: "1 day ago",
    helpfulCount: 14,
  },
  {
    id: "rev-302",
    customer: "Marcus Vance",
    product: "Full-Grain Leather Shoulder Bag",
    store: "Apex Leatherworks",
    rating: 4,
    comment: "Sturdy craftsmanship and rich patina. Only downside was delivery took an extra day.",
    status: "approved",
    date: "2 days ago",
    helpfulCount: 8,
  },
  {
    id: "rev-303",
    customer: "Anonymous User",
    product: "Minimalist Strappy Heels",
    store: "Modernist Footwear",
    rating: 1,
    comment: "Spam link: visit bit.ly/free-coupons-now for discounts on everything!!",
    status: "reported",
    date: "3 hours ago",
    helpfulCount: 0,
  },
  {
    id: "rev-304",
    customer: "Sophia Lin",
    product: "Suede Trucker Jacket",
    store: "Sartorial Menswear",
    rating: 5,
    comment: "Softest suede I have ever felt. Fits true to size and looks gorgeous.",
    status: "pending",
    date: "5 hours ago",
    helpfulCount: 2,
  },
];

const REVIEW_TABS = [
  { id: "all", label: "All Reviews" },
  { id: "pending", label: "Pending Moderation" },
  { id: "approved", label: "Approved" },
  { id: "reported", label: "Reported Flags" },
];

export default function AdminReviewsPage() {
  const params = useParams();
  const slug = (params?.slug as string[]) || [];
  const routeTab = slug[0] || "all";

  const [activeTab, setActiveTab] = useState(routeTab);
  const [reviews, setReviews] = useState<ReviewItem[]>(DEMO_REVIEWS);
  const [search, setSearch] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleApprove = (id: string) => {
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "approved" as const } : r))
    );
    setFeedback("Review approved and published to the public product page.");
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleReject = (id: string) => {
    setReviews((prev) => prev.filter((r) => r.id !== id));
    setFeedback("Review rejected and removed from moderation queue.");
    setTimeout(() => setFeedback(null), 3000);
  };

  const filteredReviews = reviews.filter((r) => {
    const matchStatus = activeTab === "all" || r.status === activeTab;
    const matchSearch =
      !search.trim() ||
      r.customer.toLowerCase().includes(search.toLowerCase()) ||
      r.product.toLowerCase().includes(search.toLowerCase()) ||
      r.comment.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8F8EE] border border-[#A2E4B8]/30 text-[#0A504A] text-[11px] font-bold uppercase tracking-wider mb-2">
            <Star className="w-3.5 h-3.5 text-[#00A86B]" />
            <span>14. Customer Feedback & Review Moderation</span>
          </div>
          <h1 className="text-3xl font-serif font-black text-[#0A504A] tracking-tight">
            Product Reviews Queue
          </h1>
          <p className="text-xs text-[#0A504A]/70 mt-1">
            Monitor buyer feedback, filter spam or abusive links, and maintain verified marketplace authenticity.
          </p>
        </div>
      </div>

      {feedback && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{feedback}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-[#D1E7D8] shadow-2xs">
          <span className="text-[11px] font-bold tracking-wider uppercase text-[#0A504A]/70">Average Store Rating</span>
          <div className="text-2xl font-serif font-black text-amber-600 mt-1.5">4.84 ★</div>
          <span className="text-[10px] text-[#0A504A]/70 mt-1 inline-block">Based on 1,420 buyer ratings</span>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-[#D1E7D8] shadow-2xs">
          <span className="text-[11px] font-bold tracking-wider uppercase text-[#0A504A]/70">Pending Moderation</span>
          <div className="text-2xl font-serif font-black text-[#00A86B] mt-1.5">
            {reviews.filter((r) => r.status === "pending").length} Items
          </div>
          <span className="text-[10px] text-[#0A504A]/70 mt-1 inline-block">Avg queue turnaround: &lt; 2 hrs</span>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-[#D1E7D8] shadow-2xs">
          <span className="text-[11px] font-bold tracking-wider uppercase text-[#0A504A]/70">Reported Flags</span>
          <div className="text-2xl font-serif font-black text-rose-600 mt-1.5">
            {reviews.filter((r) => r.status === "reported").length} Flags
          </div>
          <span className="text-[10px] text-[#0A504A]/70 mt-1 inline-block">Triggered by spam detection filter</span>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-[#D1E7D8] shadow-2xs">
          <span className="text-[11px] font-bold tracking-wider uppercase text-[#0A504A]/70">Verified Buyer Ratio</span>
          <div className="text-2xl font-serif font-black text-emerald-600 mt-1.5">96.8%</div>
          <span className="text-[10px] text-[#0A504A]/70 mt-1 inline-block">Proof of delivery tied reviews</span>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D1E7D8] pb-4">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
          {REVIEW_TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  active
                    ? "bg-[#00A86B] text-white shadow-2xs"
                    : "bg-white border border-[#D1E7D8] text-[#0A504A]/70 hover:bg-[#E8F8EE]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[#0A504A]/70 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search comment or product..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-[#D1E7D8] text-xs text-[#0A504A] placeholder:text-[#0A504A]/70/50 focus:outline-hidden focus:ring-2 focus:ring-[#00A86B]/20"
          />
        </div>
      </div>

      {/* Reviews Cards / Grid */}
      <div className="space-y-4">
        {filteredReviews.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white border border-[#D1E7D8] text-xs text-[#0A504A]/70">
            No customer reviews found matching this filter.
          </div>
        ) : (
          filteredReviews.map((rev) => (
            <div
              key={rev.id}
              className="p-5 rounded-2xl bg-white border border-[#D1E7D8] shadow-2xs flex flex-col sm:flex-row sm:items-start justify-between gap-4 hover:border-[#A2E4B8]/50 transition"
            >
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-[#0A504A] text-xs">{rev.customer}</span>
                  <span className="text-[11px] text-[#0A504A]/70">reviewed</span>
                  <strong className="text-xs text-[#00A86B]">{rev.product}</strong>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#E8F8EE] text-[#0A504A] font-semibold">
                    {rev.store}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex text-amber-400 text-xs">
                    {Array.from({ length: rev.rating }).map((_, i) => (
                      <span key={i}>★</span>
                    ))}
                  </div>
                  <span className="text-[11px] text-[#0A504A]/70">{rev.date}</span>
                  {rev.status === "reported" && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      <span>Reported as Spam</span>
                    </span>
                  )}
                </div>

                <p className="text-xs text-[#0A504A]/90 leading-relaxed font-sans">{rev.comment}</p>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                {rev.status !== "approved" && (
                  <button
                    onClick={() => handleApprove(rev.id)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition"
                  >
                    Approve
                  </button>
                )}
                <button
                  onClick={() => handleReject(rev.id)}
                  className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 font-bold text-xs hover:bg-rose-100 transition"
                >
                  Reject & Hide
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
