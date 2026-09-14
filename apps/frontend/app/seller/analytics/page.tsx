"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getSellerAnalytics, SellerAnalyticsData } from "../../../lib/api/analytics";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Package,
  CheckCircle2,
  Clock,
  Loader2,
  ArrowUpRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function SellerAnalyticsPage() {
  const [data, setData] = useState<SellerAnalyticsData | null>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const result = await getSellerAnalytics(days);
        setData(result);
      } catch {
        // Fallback
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [days]);

  const formattedChartData =
    data?.revenue_chart?.map((pt) => ({
      ...pt,
      revenueDollars: pt.revenue / 100,
    })) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[#D1E7D8] gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-[#E8F8EE] text-[#00A86B] font-mono text-[11px] font-bold border border-[#A2E4B8]">
              Sales Intelligence
            </span>
            <span className="text-xs text-[#0A504A]/70 font-medium">Performance Metrics</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0A504A] tracking-tight">
            Revenue & Sales Analytics
          </h1>
          <p className="text-xs sm:text-sm text-[#0A504A]/70 mt-1 font-medium">
            Track your store gross merchandise volume, net payout earnings, and top product performances.
          </p>
        </div>

        {/* Date Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-white rounded-2xl border border-[#D1E7D8] shadow-2xs self-start sm:self-auto">
          {[
            { label: "7 Days", value: 7 },
            { label: "30 Days", value: 30 },
            { label: "90 Days", value: 90 },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setDays(tab.value)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                days === tab.value
                  ? "bg-[#0A504A] text-white shadow-2xs"
                  : "text-[#0A504A]/70 hover:text-[#0A504A] hover:bg-[#E8F8EE]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-3xl border border-[#D1E7D8] p-20 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#00A86B] animate-spin mb-3" />
          <p className="text-xs font-bold text-[#0A504A]/70 uppercase tracking-wider">
            Computing financial aggregations...
          </p>
        </div>
      ) : !data ? (
        <div className="bg-white rounded-3xl border border-[#D1E7D8] p-16 text-center">
          <BarChart3 className="w-12 h-12 text-[#A2E4B8] mx-auto mb-3" />
          <h3 className="text-base font-black text-[#0A504A]">No sales records available</h3>
          <p className="text-xs text-[#0A504A]/60 mt-1">
            Sales performance graphs will render as customers place orders from your store.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* KPI Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-[#D1E7D8] shadow-2xs">
              <div className="flex items-center justify-between text-[#0A504A]/70 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Net Earnings</span>
                <DollarSign className="w-4 h-4 text-[#00A86B]" />
              </div>
              <div className="text-2xl font-black text-[#0A504A]">
                ${(data.net_earnings / 100).toFixed(2)}
              </div>
              <div className="text-[11px] text-[#00A86B] font-bold mt-1 flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3" />
                <span>After 10% platform fee</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-[#D1E7D8] shadow-2xs">
              <div className="flex items-center justify-between text-[#0A504A]/70 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Gross Volume</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-[#0A504A]">
                ${(data.total_revenue / 100).toFixed(2)}
              </div>
              <div className="text-[11px] text-[#0A504A]/60 mt-1">Total product sales</div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-[#D1E7D8] shadow-2xs">
              <div className="flex items-center justify-between text-[#0A504A]/70 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Completed</span>
                <CheckCircle2 className="w-4 h-4 text-[#00A86B]" />
              </div>
              <div className="text-2xl font-black text-[#0A504A]">{data.delivered_orders}</div>
              <div className="text-[11px] text-[#0A504A]/60 mt-1">Delivered packages</div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-[#D1E7D8] shadow-2xs">
              <div className="flex items-center justify-between text-[#0A504A]/70 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">In Progress</span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-black text-[#0A504A]">{data.pending_orders}</div>
              <div className="text-[11px] text-[#0A504A]/60 mt-1">Awaiting fulfillment</div>
            </div>
          </div>

          {/* Recharts Area Chart */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#D1E7D8] shadow-2xs">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-black text-[#0A504A]">Revenue Trajectory</h3>
                <p className="text-xs text-[#0A504A]/70 mt-0.5">
                  Daily net sales curve for the selected {days}-day period.
                </p>
              </div>
            </div>

            <div className="h-72 w-full">
              {formattedChartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-[#0A504A]/60 text-xs">
                  No transactions recorded during this time window.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={formattedChartData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="sellerRevGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00A86B" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#00A86B" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#D1E7D8" vertical={false} />
                    <XAxis
                      dataKey="date"
                      stroke="#0A504A"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#0A504A"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => `$${val}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        borderRadius: "1rem",
                        border: "1px solid #D1E7D8",
                        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05)",
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "#0A504A",
                      }}
                      formatter={(value: any) => [`$${Number(value).toFixed(2)}`, "Net Sales"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenueDollars"
                      stroke="#00A86B"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#sellerRevGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Top 5 Products Table */}
          <div className="bg-white rounded-3xl border border-[#D1E7D8] shadow-2xs overflow-hidden">
            <div className="p-6 border-b border-[#D1E7D8] flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-[#0A504A]">Top Selling Products</h3>
                <p className="text-xs text-[#0A504A]/70 mt-0.5">
                  Highest revenue generating items in your storefront inventory.
                </p>
              </div>
            </div>

            {data.top_products.length === 0 ? (
              <div className="p-8 text-center text-[#0A504A]/60 text-xs">
                No product sales records found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-[#F4FAF6] border-b border-[#D1E7D8] text-[#0A504A] font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-4 px-6">Product</th>
                      <th className="py-4 px-6">Total Units Sold</th>
                      <th className="py-4 px-6 text-right">Revenue Generated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D1E7D8]/60">
                    {data.top_products.map((p, idx) => (
                      <tr key={p.product_id} className="hover:bg-[#F4FAF6]/50 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-lg bg-[#E8F8EE] text-[#00A86B] font-black flex items-center justify-center text-[10px] border border-[#A2E4B8]">
                              #{idx + 1}
                            </span>
                            <span className="font-bold text-[#0A504A]">{p.product_name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 font-mono font-bold text-[#0A504A]/80">
                          {p.total_quantity} units
                        </td>
                        <td className="py-4 px-6 text-right font-black text-[#00A86B] text-sm">
                          ${(p.total_revenue / 100).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
