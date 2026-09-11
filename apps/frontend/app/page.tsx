"use client";

import React, { useEffect, useState } from "react";
import { 
  ShieldCheck, 
  Layers, 
  Zap, 
  MapPin, 
  CreditCard, 
  Server, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  Sparkles
} from "lucide-react";

interface HealthStatus {
  live: boolean;
  ready: boolean;
  services?: {
    mongodb: string;
    redis: string;
  };
  uptime?: number;
}

export default function HomePage() {
  const [health, setHealth] = useState<HealthStatus>({
    live: false,
    ready: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkHealth() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
        const [liveRes, readyRes] = await Promise.allSettled([
          fetch(`${apiUrl}/health/live`).then((r) => r.json()),
          fetch(`${apiUrl}/health/ready`).then((r) => r.json()),
        ]);

        const liveOk = liveRes.status === "fulfilled" && liveRes.value?.success;
        const readyOk = readyRes.status === "fulfilled" && readyRes.value?.success;

        setHealth({
          live: liveOk,
          ready: readyOk,
          services: readyOk ? readyRes.value?.data?.services : undefined,
          uptime: liveOk ? liveRes.value?.data?.uptime : undefined,
        });
      } catch (err) {
        console.error("Failed checking health endpoints", err);
      } finally {
        setLoading(false);
      }
    }

    checkHealth();
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col bg-[#080b12] text-slate-100 selection:bg-indigo-600 selection:text-white">
      {/* Background glowing gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-[128px] pointer-events-none" />

      {/* Navigation */}
      <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center font-black text-xl text-white shadow-lg shadow-indigo-500/25">
              N
            </div>
            <div>
              <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                NEXORA
              </span>
              <span className="ml-2 text-xs uppercase tracking-widest px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-semibold">
                Platform v1.0
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-slate-400">Stack:</span>
              <span className="text-emerald-400 font-medium">Phase 1 Online</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-16 w-full flex flex-col items-center">
        {/* Hero badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium mb-8">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Production-Style Architecture & Monorepo Foundation</span>
        </div>

        {/* Hero title & description */}
        <div className="text-center max-w-3xl mb-12">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
            Multi-Vendor Commerce <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-cyan-300 bg-clip-text text-transparent">
              & Hyperlocal Logistics
            </span>
          </h1>
          <p className="text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto">
            High-concurrency marketplace engine featuring isolated vendor stores, atomic inventory reservations,
            intelligent BullMQ rider dispatch, and real-time Socket.IO parcel telemetry.
          </p>
        </div>

        {/* Phase 1 Live Infrastructure Card */}
        <section id="system-status" className="w-full max-w-4xl mb-16">
          <div className="glass-card rounded-2xl p-6 sm:p-8 border border-slate-800/80">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 mb-6 border-b border-slate-800/60 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Server className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Foundation Infrastructure Status</h2>
                  <p className="text-xs text-slate-400">Node.js Express + MongoDB Native Driver + Redis Cluster</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs text-slate-400 font-mono">Backend Service</p>
                  <p className="text-xs font-semibold text-slate-200">http://localhost:5000</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* API Live Check */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400">API Liveness</p>
                  <p className="text-sm font-bold text-white mt-1">
                    {loading ? "Checking..." : health.live ? "HTTP 200 Alive" : "Offline / Initializing"}
                  </p>
                </div>
                {health.live ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-400" />
                )}
              </div>

              {/* MongoDB Ready */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400">MongoDB Replica Set</p>
                  <p className="text-sm font-bold text-white mt-1">
                    {loading ? "Checking..." : health.services?.mongodb === "up" ? "Connected (rs0)" : "Connecting..."}
                  </p>
                </div>
                {health.services?.mongodb === "up" ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <div className="h-3 w-3 rounded-full bg-indigo-500/40 animate-pulse" />
                )}
              </div>

              {/* Redis Ready */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400">Redis Cache & Bus</p>
                  <p className="text-sm font-bold text-white mt-1">
                    {loading ? "Checking..." : health.services?.redis === "up" ? "Connected (:6379)" : "Connecting..."}
                  </p>
                </div>
                {health.services?.redis === "up" ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <div className="h-3 w-3 rounded-full bg-indigo-500/40 animate-pulse" />
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Core Architecture Pillars */}
        <section className="w-full max-w-5xl mb-16">
          <h2 className="text-xl font-bold text-white mb-6 text-center">Architectural Pillars</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="glass-card rounded-xl p-5 border border-slate-800/80">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-white text-sm mb-2">Multi-Vendor Partitioning</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Cart splitting into per-vendor sub-orders with independent Stripe Connect payout streams.
              </p>
            </div>

            <div className="glass-card rounded-xl p-5 border border-slate-800/80">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-4">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-white text-sm mb-2">BullMQ Job Queues</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Asynchronous email notifications, order timeouts, and automated geospatial rider assignment.
              </p>
            </div>

            <div className="glass-card rounded-xl p-5 border border-slate-800/80">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-white text-sm mb-2">Hyperlocal Geotracking</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Socket.IO + Redis pub/sub broadcasting sub-second rider location updates to customers.
              </p>
            </div>

            <div className="glass-card rounded-xl p-5 border border-slate-800/80">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-white text-sm mb-2">Zero-Trust RBAC</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Role-based authorization covering Customer, Seller, Delivery Agent, Admin, and Super Admin.
              </p>
            </div>
          </div>
        </section>

        {/* Phase Roadmap Overview */}
        <section className="w-full max-w-4xl text-center">
          <div className="p-8 rounded-2xl bg-gradient-to-b from-slate-900/60 to-slate-950/80 border border-slate-800/80">
            <h3 className="text-lg font-bold text-white mb-2">Execution Roadmap Active</h3>
            <p className="text-xs text-slate-400 mb-6 max-w-md mx-auto">
              Phase 1 Monorepo & Infrastructure is scaffolded. Ready to proceed to Phase 2 (Authentication & Role Verification).
            </p>
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors cursor-pointer shadow-lg shadow-indigo-600/30">
              <span>View Implementation Tracker</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-8 px-6 text-center text-xs text-slate-500">
        <p>© 2026 NEXORA Platform. Engineered with TypeScript, Next.js 14, Node.js, MongoDB Native, and Redis.</p>
      </footer>
    </div>
  );
}
