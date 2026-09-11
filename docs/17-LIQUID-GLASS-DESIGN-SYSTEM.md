# 17 — NEXORA Light Theme Liquid Glass Design System

## 1. Vision & Core Philosophy

The **NEXORA Liquid Glass Design System** is an ultra-premium, futuristic visual language built for next-generation multi-vendor commerce and real-time hyperlocal logistics.

**The system is strictly LIGHT THEME** — featuring:
1. **Luminous Canvas**: Crisp, airy `#f8fafc` / `#ffffff` background with fine ambient grid textures.
2. **Floating Pastel Fluidity**: Ethereal, low-opacity ambient floating orbs in soft periwinkle (`#818cf8`), cyan (`#38bdf8`), and lavender (`#c084fc`) providing gentle background motion and depth.
3. **Multi-Layered Frosted Translucency**: High backdrop blur (`backdrop-blur-xl`, `backdrop-blur-2xl`) on semi-transparent white surfaces (`rgba(255, 255, 255, 0.82)` to `0.95`).
4. **Specular Edge Light & Inset Highlight**: Hairline luminous borders (`1px solid rgba(226, 232, 240, 0.8)`) paired with inset pure white specular highlights (`inset 0 1px 0 0 rgba(255, 255, 255, 1)`) simulating physical refractive crystal glass.
5. **Vibrant Royal Blue / Indigo Accents**: High-contrast, punchy royal blue buttons (`#2563eb`), cyan tags, and emerald badges for active states and logistics telemetry.
6. **Sophisticated Typography**: Deep slate `#0f172a` for primary headings, `#334155` for body, and `#64748b` for subtle metadata.

---

## 2. Design Tokens & Color Palette

### 2.1 Surfaces & Canvas (Light Theme)
| Token | Hex / Value | Description |
|---|---|---|
| `canvas-background` | `#f8fafc` | Clean, luminous base canvas |
| `canvas-surface` | `#ffffff` | Solid surface elements |
| `glass-surface-panel` | `rgba(255, 255, 255, 0.85)` | High-blur hero panels, headers |
| `glass-surface-card` | `rgba(255, 255, 255, 0.82)` | Primary product & metric cards |
| `glass-surface-interactive`| `rgba(255, 255, 255, 0.96)` | Hover state on interactive cards |

### 2.2 Borders & Specular Highlights
| Token | Value | Purpose |
|---|---|---|
| `glass-border-standard`| `1px solid rgba(226, 232, 240, 0.75)` | Standard card and container edges |
| `glass-border-hover` | `1px solid rgba(59, 130, 246, 0.40)` | Interactive focus/hover border |
| `specular-edge` | `inset 0 1px 0 0 rgba(255, 255, 255, 1)` | Top crystal reflection highlight |
| `diffuse-shadow` | `0 10px 30px -5px rgba(0, 0, 0, 0.04), 0 20px 40px -15px rgba(37, 99, 235, 0.06)` | Floating ambient drop shadow |

### 2.3 Accents & Status Tints
| Accent | Primary Hex | Light Pill Style |
|---|---|---|
| **Royal Blue** (Primary) | `#2563eb` | `bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25` |
| **Sky Blue** (Telemetry) | `#0284c7` | `bg-sky-50 border-sky-200 text-sky-700` |
| **Emerald** (Success / Stock) | `#10b981` | `bg-emerald-50 border-emerald-200 text-emerald-700` |
| **Amber** (Pending / Warning) | `#f59e0b` | `bg-amber-50 border-amber-200 text-amber-800` |
| **Rose** (Discount / Error) | `#ef4444` | `bg-rose-50 border-rose-200 text-rose-700` |

---

## 3. Standard Components & Class Structure

### 3.1 Liquid Glass Cards (`.liquid-glass-card`)
- Base styling:
  ```css
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(226, 232, 240, 0.7);
  box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.04), 0 12px 24px -10px rgba(37, 99, 235, 0.05), inset 0 1px 0 0 rgba(255, 255, 255, 1);
  border-radius: 1.25rem;
  ```
- Interactive extension (`.liquid-glass-card-interactive`):
  - On hover: translateY(-3px), border color shifts to `rgba(59, 130, 246, 0.4)`, shadow expands to `0 20px 35px -10px rgba(37, 99, 235, 0.12), inset 0 1px 0 0 rgba(255, 255, 255, 1)`.

### 3.2 Liquid Glass Buttons
- **Primary Liquid**: Pill button with gradient `linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)`, specular inset highlight, and diffuse royal blue drop shadow.
- **Secondary Glass**: Pill button with `bg-white/85 hover:bg-white text-slate-800 border border-slate-300 shadow-2xs`.
- **Ghost Glass**: Transparent with subtle hover wash and blue text.

### 3.3 Status Badges
- Pill-shaped with light tinted pastel background:
  - Success: `bg-emerald-50 text-emerald-700 border border-emerald-200`
  - Pending: `bg-amber-50 text-amber-800 border border-amber-200`
  - Critical: `bg-rose-50 text-rose-700 border border-rose-200`
  - Info: `bg-blue-50 text-blue-700 border border-blue-200`

---

## 4. UI Assembly Rules

1. **Strictly Light Theme**: Never revert to dark background (`#080b12` or dark obsidian). Keep the background `#f8fafc` and text `#0f172a`.
2. **Every screen inherits `<LiquidBackground />`** for subtle, soothing animated pastel ambient orbs.
3. **Showcase Real Data**: Always populate rich product photography, stock counters, seller ratings, prices, and actionable buttons.
4. **Fast Interactive Micro-Interactions**: Smooth 200ms cubic transitions, hover lifts, and real-time state synchronizations.
