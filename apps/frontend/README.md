# NEXORA Frontend Application

> The client experience for the NEXORA Multi-Vendor Commerce and Hyperlocal Logistics platform. Built with Next.js 14 (App Router), TypeScript, Tailwind CSS, TanStack Query, and Socket.IO Client.

---

## 💎 Design System: Light Theme Liquid Glass

NEXORA's frontend implements a custom **Light Theme Liquid Glass** aesthetic designed for a modern, fluid user experience:

- **Canvas Background:** `#f8fafc` with subtle multi-color radial gradient mesh glows.
- **Liquid Glass Containers:** High-translucency frosted glass surfaces (`rgba(255, 255, 255, 0.75)` to `rgba(255, 255, 2 slide, 0.85)` with `backdrop-blur-md`, delicate inner border highlights `rgba(255, 255, 255, 0.9)`, and multi-layered soft drop shadows).
- **Primary Accents:** Royal Sapphire (`#2563eb`) and Electric Indigo (`#4f46e5`) gradients with vibrant interactive hover transitions.
- **Language Policy:** **100% English** across all customer, seller, rider, and admin interfaces.
- **Micro-interactions:** Smooth scale hovers, subtle glow borders, live pulsing telematics badges, and spring transitions.

---

## 🧭 Application Portals & Routes

### 1. Customer Marketplace
- `/` — Curated homepage with live categories, featured products, search, and flash promotions.
- `/products` — Full marketplace catalog with live search, price filters, and category trees.
- `/products/[id]` — Product detail page with dynamic variant selectors (color, size, storage), real-time pricing recalculations, and customer review submission.
- `/cart` & `CartDrawer` — Redis-synchronized shopping cart with guest session persistence and slide-over quick checkout drawer.
- `/checkout` — Checkout experience with shipping address selector and Stripe payment integration.
- `/orders` & `/orders/[id]` — Order history and tracking page featuring a **live 5-stage stepper** with real-time Socket.IO status updates and driver telematics panel.
- `/chat` & `ChatDrawer` — Real-time messaging hub between buyers, vendors, and delivery agents.
- `/profile` — User account settings, avatar manager, and address book.

### 2. Seller Workspace
- `/seller/dashboard` — Merchant headquarters with executive KPIs, quick actions, and revenue counters.
- `/seller/products` & `/seller/products/new` — Product lifecycle manager with variant generator and admin moderation submission.
- `/seller/orders` — Sub-order fulfillment queue with status transitions (`confirm`, `preparing`, `ready_for_pickup`).
- `/seller/inventory` — SKU-level stock controller with one-click restock modals and low-stock warnings.
- `/seller/coupons` — Vendor promotion creator supporting percentage and fixed discounts with minimum order rules.
- `/seller/analytics` — Revenue and performance analytics visualized using responsive Recharts graphs.
- `/seller/withdrawals` — Seller earnings ledger and payout request workflow.
- `/seller/store/settings` — Storefront branding, logo, and banner customizer.
- `/seller/onboard` — Seller registration and simulated Stripe Connect onboarding.

### 3. Hyperlocal Rider Portal
- `/delivery/dashboard` — Real-time courier dispatch console featuring an online/offline toggle, active delivery task status progression (`assigned` → `en_route_pickup` → `picked_up` → `en_route_delivery` → `delivered`), live simulated GPS telematics broadcaster, and wallet earnings ledger.

### 4. Admin Executive Intelligence Suite
- `/admin/analytics` — Platform GMV, platform fees, active stores, daily GMV trendlines, and top merchant leaderboards.
- `/admin/sellers` — Merchant compliance queue for approving or rejecting seller applications.
- `/admin/products` — Catalog moderation console for reviewing pending merchant product submissions.
- `/admin/riders` — Courier network moderation and fleet oversight portal.
- `/admin/withdrawals` — Treasury payouts approval and rejection queue with automated wallet refunds.
- `/admin/audit-logs` — Immutable forensic security log explorer with actor and action filters.

### 5. Identity & Access
- `/login` — Unified login supporting all platform roles with automatic post-authentication routing and 1-Click Demo autofill.
- `/register` — Account registration with role selection.
- `/verify-email`, `/forgot-password`, `/reset-password` — Password recovery and email validation flows.

---

## 🔑 Demo Test Accounts Directory

All accounts are pre-seeded with the password: `Password123!`

| Role | Email | Name | Default Portal |
|---|---|---|---|
| **Customer** | `customer@nexora.com` | Alex Customer | `/profile`, `/cart`, `/orders` |
| **Active Buyer** | `buyer@nexora.com` | Sarah Buyer | `/profile`, `/cart`, `/orders` |
| **Merchant / Seller** | `seller@nexora.com` | David Merchant | `/seller/dashboard`, `/seller/products` |
| **Vendor** | `vendor@nexora.com` | Elena Vendor | `/seller/dashboard`, `/seller/inventory` |
| **Delivery Rider** | `rider@nexora.com` | Marco Rider | `/delivery/dashboard` |
| **Courier** | `courier@nexora.com` | Liam Courier | `/delivery/dashboard` |
| **Operations Admin** | `admin@nexora.com` | Operations Admin | `/admin/analytics` |
| **Super Admin** | `superadmin@nexora.com` | Executive SuperAdmin | `/admin/analytics`, `/admin/audit-logs` |
| **Personal Account** | `ataurrahman24707@gmail.com` | Ataur Rahman | `/admin/analytics` |

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 20.0.0
- Running NEXORA backend instance (default: `http://localhost:5000`)

### Installation & Development
```bash
# Install dependencies
npm install

# Start Next.js development server
npm run dev

# Run TypeScript typecheck
npm run typecheck

# Build production bundle
npm run build
```

---

## ⚙️ Environment Configuration

Create a `.env.local` file inside `apps/frontend/`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```
