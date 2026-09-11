# 17 — NEXORA Liquid Glass Design System

## 1. Vision & Core Philosophy

The **NEXORA Liquid Glass Design System** is an ultra-premium visual language built for next-generation multi-vendor commerce and real-time logistics. 

It combines:
1. **Deep Void & Obsidian Canvas**: Eliminates flat white boxes in favor of rich, cinematic dark space (`#080b12` to `#0d131f`).
2. **Organic Luminous Fluidity**: Floating ambient liquid gradient orbs (cyan, indigo, electric violet) that create depth, warmth, and life behind the interface.
3. **Multi-Layered Frosted Translucency**: High-blur backdrops (`backdrop-blur-xl`, `backdrop-blur-2xl`) allowing colors and movement beneath to diffuse naturally.
4. **Specular Edge Light**: Hairline luminous borders (`1px solid rgba(255, 255, 255, 0.08)` to `0.15`) with top-edge specular gleam simulating physical refractive crystal glass.
5. **Vibrant Tactile Accents**: Neon cyan, electric indigo, radiant amber, and vivid emerald for interactive states, notifications, and logistics telemetries.

---

## 2. Design Tokens & Color Palette

### 2.1 Surfaces & Canvas
| Token | Hex / Value | Description |
|---|---|---|
| `canvas-void` | `#06080e` | Deepest ambient background |
| `canvas-obsidian` | `#0a0e1a` | Main page background |
| `glass-surface-subtle` | `rgba(15, 23, 42, 0.40)` | Table rows, secondary panels |
| `glass-surface-card` | `rgba(15, 23, 42, 0.65)` | Primary cards, cards container |
| `glass-surface-elevated`| `rgba(15, 23, 42, 0.85)` | Modals, drawers, floating navbars |

### 2.2 Borders & Highlights
| Token | Value | Purpose |
|---|---|---|
| `glass-border-subtle` | `rgba(255, 255, 255, 0.06)` | Quiet dividers and secondary borders |
| `glass-border-standard`| `rgba(255, 255, 255, 0.12)` | Standard card and container edges |
| `glass-border-hover` | `rgba(99, 102, 241, 0.40)` | Interactive focus/hover border |
| `specular-edge` | `inset 0 1px 0 0 rgba(255, 255, 255, 0.15)` | Top crystal reflection highlight |

### 2.3 Fluid Accents & Status Glows
| Accent | Main Color | Glow Box Shadow |
|---|---|---|
| **Electric Indigo** | `#6366f1` | `0 0 30px -5px rgba(99, 102, 241, 0.4)` |
| **Cyan Aurora** | `#06b6d4` | `0 0 30px -5px rgba(6, 182, 212, 0.4)` |
| **Neon Emerald** (Success) | `#10b981` | `0 0 30px -5px rgba(16, 185, 129, 0.4)` |
| **Radiant Amber** (Pending) | `#f59e0b` | `0 0 30px -5px rgba(245, 158, 11, 0.4)` |
| **Crimson Rose** (Error) | `#f43f5e` | `0 0 30px -5px rgba(244, 63, 94, 0.4)` |

---

## 3. Standard Components & Class Structure

### 3.1 Liquid Glass Cards (`.liquid-glass-card`)
- Base styling:
  ```css
  background: rgba(15, 23, 42, 0.65);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.10);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.36), inset 0 1px 0 0 rgba(255, 255, 255, 0.12);
  border-radius: 1rem;
  ```
- Interactive extension (`.liquid-glass-card-interactive`):
  - On hover: translateY(-2px), border color shifts to `rgba(99, 102, 241, 0.45)`, diffuse shadow expands to `0 16px 40px -10px rgba(99, 102, 241, 0.25)`.

### 3.2 Liquid Glass Buttons
- **Primary Liquid**: Gradient fill (`from-indigo-600 to-indigo-500`), specular edge, hover glow (`shadow-lg shadow-indigo-600/30`), active press scale.
- **Secondary Glass**: `bg-white/[0.05] hover:bg-white/[0.10] border border-white/[0.12] text-slate-200`.
- **Ghost Glass**: Transparent with subtle hover wash and cyan/indigo text.

### 3.3 Liquid Glass Badges (`.liquid-badge`)
- Pill-shaped with semi-transparent tinted glass background:
  - `bg-emerald-500/10 border border-emerald-500/25 text-emerald-400`
  - `bg-amber-500/10 border border-amber-500/25 text-amber-400`
  - `bg-rose-500/10 border border-rose-500/25 text-rose-400`
  - `bg-cyan-500/10 border border-cyan-500/25 text-cyan-400`
- Includes a tiny radiant dot indicator (`h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse`).

### 3.4 Liquid Glass Form Inputs
- Frosted dark input (`bg-slate-950/60 border border-white/[0.10] text-white`).
- Placeholder text in soft `text-slate-500`.
- Focus state: `ring-2 ring-indigo-500/40 border-indigo-500/60 shadow-[0_0_15px_rgba(99,102,241,0.2)]`.

---

## 4. UI Assembly Workflow Rule

Before coding ANY frontend screen or component:
1. **Never use opaque stark white card containers (`bg-white`)** or generic flat grey borders (`border-slate-200`).
2. **Every page must sit on the ambient Liquid Background**:
   - The Root Layout injects `<LiquidBackground />` ensuring glowing diffused orbs behind all pages.
3. **Use the UI Primitives in `apps/frontend/components/ui/`**:
   - Containers: `<GlassCard>`
   - Buttons: `<GlassButton>`
   - Status: `<GlassBadge>`
   - Inputs: `<GlassInput>`
4. **Maintain visual contrast**:
   - Primary text: `text-white` or `text-slate-100`.
   - Secondary text: `text-slate-400` or `text-slate-300`.
   - Brand highlights: `text-indigo-400`, `text-cyan-400`.
5. **Smooth Micro-interactions**:
   - Always include subtle hover transitions (`transition-all duration-200`).
