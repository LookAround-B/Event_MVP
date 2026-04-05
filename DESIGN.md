# Design System Specification
**Design-First Hub — Equine**
*Version 1.0 · Last updated 2025*

---

## Table of Contents

1. [Typography](#1-typography)
2. [Color Palette](#2-color-palette)
3. [Spacing & Layout](#3-spacing--layout)
4. [Effects & UI Patterns](#4-effects--ui-patterns)
5. [Animations](#5-animations)
6. [Component Library](#6-component-library)
7. [Sidebar](#7-sidebar)
8. [Accessibility](#8-accessibility)
9. [Design Principles](#9-design-principles)

---

## 1. Typography

**Primary Font:** [Manrope](https://fonts.google.com/specimen/Manrope) — Google Fonts  
**Rendering:** `antialiased` (`-webkit-font-smoothing: antialiased`)

### Font Stack

```css
font-family: 'Manrope', sans-serif;
```

### Weight Scale

| Token | Weight | Usage |
|:---|:---|:---|
| `font-black` | 900 | Hero KPI values, large display metrics |
| `font-bold` | 700 | Headings, primary buttons |
| `font-semibold` | 600 | Secondary buttons, labels, badges |
| `font-normal` | 400 | Body text, descriptions |

### Type Scale

| Role | Size | Weight | Notes |
|:---|:---|:---|:---|
| Hero Value | 48–64px | 900 | Main KPI number |
| Page Title | 28–32px | 700 | Dashboard heading |
| Section Heading | 20–24px | 700 | Card headings |
| Sub-heading | 16–18px | 600 | Labels |
| Body | 14–16px | 400 | General text |
| Caption / Meta | 10–12px | 600–700 | Table headers, badges — uppercase, tracked |

### Table Header Style

```css
font-size: 10px;
font-weight: 700;
text-transform: uppercase;
letter-spacing: 0.1em; /* tracking-widest */
color: var(--muted-foreground);
```

---

## 2. Color Palette

The system uses an HSL-based palette with strong surface hierarchy. All tokens are expressed as HSL values and referenced via CSS custom properties.

### 2.1 Core Semantic Colors

| Token | HSL | Hex Approx. | Usage |
|:---|:---|:---|:---|
| `--primary` (Italian Red) | `hsl(0, 85%, 60%)` | `#F24040` | Brand CTAs, hero cards, active states |
| `--secondary` (Purple) | `hsl(253, 90%, 73%)` | `#8B6FF5` | Secondary actions, data viz |
| `--tertiary` | `hsl(253, 90%, 73%)` | `#8B6FF5` | Complementary data points |
| `--error` | `hsl(0, 85%, 60%)` | `#F24040` | Destructive actions, alerts |

> **Note:** Primary and Error share the same hue by design. Differentiate by context and surrounding UI.

### 2.2 Surface Hierarchy

#### Dark Mode — Obsidian Scale

Layers are ordered from deepest to most elevated:

| Level | Token | HSL | Usage |
|:---|:---|:---|:---|
| Background | `--surface-background` | `hsl(240, 7%, 4%)` | Main viewport background |
| Lowest | `--surface-lowest` | `hsl(240, 7%, 6%)` | Sidebars, rails |
| Card | `--surface-card` | `hsl(224, 20%, 12%)` | Bento grid cards |
| Container | `--surface-container` | `hsl(224, 18%, 15%)` | Nested UI elements |
| Bright | `--surface-bright` | `hsl(224, 15%, 22%)` | Hover states, highlights |

#### Light Mode

| Level | Token | HSL | Usage |
|:---|:---|:---|:---|
| Background | `--surface-background` | `hsl(224, 20%, 96%)` | Page background |
| Surface | `--surface` | `hsl(224, 15%, 93%)` | Content areas |
| Card | `--surface-card` | `hsl(0, 0%, 100%)` | White cards |

### 2.3 Status Colors (Icon Mapping)

| Semantic | Color | Usage |
|:---|:---|:---|
| Growth / Positive | Emerald | KPI delta indicators |
| Inventory / Volume | Violet | Stock/count metrics |
| Finance / Revenue | Sky | Financial figures |
| Success / Published | `bg-primary/10 text-primary` | Status badges (brand red) |
| Draft / Muted | `bg-surface-bright text-muted` | Inactive state badges |

### 2.4 Gradients

```css
/* CTA Gradient — primary buttons, hero cards */
--gradient-cta: linear-gradient(135deg, hsl(0, 85%, 62%), hsl(0, 85%, 45%));

/* Purple Gradient — secondary highlights, charts */
--gradient-purple: linear-gradient(135deg, hsl(253, 90%, 73%), hsl(253, 33%, 43%));

/* Surface Gradient — subtle depth on panels */
--gradient-surface: linear-gradient(180deg, var(--surface-card), var(--surface-container));
```

### 2.5 CSS Custom Property Setup

```css
:root {
  --primary: hsl(0, 85%, 60%);
  --secondary: hsl(253, 90%, 73%);
  --surface-background: hsl(240, 7%, 4%);
  --surface-lowest: hsl(240, 7%, 6%);
  --surface-card: hsl(224, 20%, 12%);
  --surface-container: hsl(224, 18%, 15%);
  --surface-bright: hsl(224, 15%, 22%);
  --border: hsl(224, 20%, 20%);
  --on-surface: hsl(224, 10%, 80%);
  --muted-foreground: hsl(224, 8%, 50%);
}
```

---

## 3. Spacing & Layout

### Base Unit

All spacing uses a **4px base unit**. Preferred scale: `4, 8, 12, 16, 24, 32, 48, 64px`.

### Grid Layout

| Breakpoint | Columns | Usage |
|:---|:---|:---|
| Mobile (`< md`) | 1 | Stacked layout |
| Tablet (`md`) | 2 | Two-column bento |
| Desktop (`lg`) | 4 | Full KPI grid |

```css
/* KPI Grid */
grid-template-columns: repeat(1, 1fr);

@media (min-width: 768px) {
  grid-template-columns: repeat(2, 1fr);
}

@media (min-width: 1024px) {
  grid-template-columns: repeat(4, 1fr);
}
```

### Border Radius Scale

| Token | Value | Usage |
|:---|:---|:---|
| `rounded-sm` | 4px | Badges, chips |
| `rounded-md` | 8px | Buttons, inputs |
| `rounded-lg` | 12px | Small cards |
| `rounded-xl` | 16px (`1rem`) | Bento cards, panels |
| `rounded-2xl` | 24px | Hero cards, modal surfaces |

---

## 4. Effects & UI Patterns

### 4.1 Bento Cards (`.bento-card`)

The primary card unit of the layout system.

```css
.bento-card {
  border: 1px solid hsl(var(--border) / 0.5);
  border-radius: 1rem;
  background: var(--surface-card);
  transition: border-color 0.2s, box-shadow 0.2s;
}

.bento-card:hover {
  border-color: hsl(var(--primary) / 0.25);
  box-shadow:
    0 0 0 1px hsl(var(--primary) / 0.1),
    0 8px 32px hsl(var(--primary) / 0.08);
}
```

**Hover behavior:**
- Border color shifts to `primary / 0.25`
- Ambient shadow + primary color glow
- Shimmer animation plays (1.6s duration)

### 4.2 Glassmorphism (`.glass`)

```css
.glass {
  background: hsl(var(--surface-low) / 0.6);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid hsl(var(--border) / 0.3);
}
```

Use for: floating panels, tooltips, overlapping UI layers.

### 4.3 Decorative Background Patterns

#### Dot Grid
```css
background-image: radial-gradient(
  hsl(var(--on-surface) / 0.12) 1px,
  transparent 1px
);
background-size: 24px 24px;
```

#### Stripe Texture
```css
background-image: repeating-linear-gradient(
  45deg,
  transparent,
  transparent 4px,
  hsl(var(--on-surface) / 0.04) 4px,
  hsl(var(--on-surface) / 0.04) 8px
);
```

#### Starfield (Performance Insight Cards)
Custom CSS star positions using pseudo-elements with `box-shadow` point arrays. Reserved for Performance Insight card backgrounds only.

### 4.4 Primary Card Glow

```css
.primary-card-glow {
  box-shadow:
    0 0 0 1px hsl(var(--primary) / 0.2),
    0 4px 16px hsl(var(--primary) / 0.15),
    0 16px 48px hsl(var(--primary) / 0.1);
}
```

### 4.5 Border Beam

Animated conic gradient border for hero elements.

```css
.border-beam {
  position: relative;
  overflow: hidden;
}

.border-beam::before {
  content: '';
  position: absolute;
  inset: -1px;
  border-radius: inherit;
  animation: border-beam-spin 3s linear infinite;
  z-index: 0;
}
```

---

## 5. Animations

### 5.1 Core Keyframes

| Name | Duration | Easing | Description |
|:---|:---|:---|:---|
| `border-beam-spin` | 3s | `linear` | Conic gradient border rotation |
| `shimmer-move` | 2.5–3s | `linear` | 90°/105° gradient sweep across cards or text |
| `gradient-shift` | 10s | `ease` | Background-size 400% breathing gradient |
| `float-up` | variable | `ease-out` | Particle scale + translate for ambient effects |
| `glitch-shift` | 6s | `step-start` | Subtle `clip-path` text glitch |
| `pulse-ring` | 1.6s | `ease-out` | Expanding ring for notification indicators |

### 5.2 Tailwind Utility Animations

```css
/* fade-in — page load, modal entry */
@keyframes fade-in {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.animate-fade-in { animation: fade-in 0.4s ease-out forwards; }

/* slide-in — sidebar items, drawer panels */
@keyframes slide-in {
  from { opacity: 0; transform: translateX(-12px); }
  to   { opacity: 1; transform: translateX(0); }
}
.animate-slide-in { animation: slide-in 0.3s ease-out forwards; }

/* pulse-glow — persistent attention on active elements */
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 8px 2px hsl(var(--primary) / 0.15); }
  50%       { box-shadow: 0 0 24px 6px hsl(var(--primary) / 0.35); }
}
.animate-pulse-glow { animation: pulse-glow 3s ease-in-out infinite; }
```

### 5.3 Staggered Entry System

Used on bento grid items for sequential reveal on page load.

```css
.animate-slide-up-1 { animation: fade-in 0.4s ease-out 0.4s both; }
.animate-slide-up-2 { animation: fade-in 0.4s ease-out 0.6s both; }
.animate-slide-up-3 { animation: fade-in 0.4s ease-out 0.8s both; }
.animate-slide-up-4 { animation: fade-in 0.4s ease-out 1.0s both; }
```

> Apply `both` fill-mode so elements start invisible before the animation fires.

### 5.4 Advanced WebGL Background

A Three.js fragment shader creates the animated background:

- **Type:** 3-tap color offset fragment shader
- **Effect:** Mosaic-like light streaks with chromatic aberration
- **Library:** Three.js
- **Performance note:** Disable on `prefers-reduced-motion` or low-power devices

---

## 6. Component Library

### 6.1 Tables

```
Structure:
  Header row  → uppercase, 10px, font-bold, tracking-widest, text-muted-foreground
  Body rows   → rounded-xl containers, hover: surface-container bg
  Status cells → badge component (see below)
```

**Row hover:**
```css
tr:hover td { background: var(--surface-container); transition: background 0.15s; }
```

**Status Badge:**
```css
/* Published / Success */
.badge-success {
  background: hsl(var(--primary) / 0.1);
  color: hsl(var(--primary));
  border-radius: 9999px;
  padding: 2px 10px;
  font-size: 12px;
  font-weight: 600;
}

/* Draft / Muted */
.badge-muted {
  background: var(--surface-bright);
  color: var(--muted-foreground);
  border-radius: 9999px;
  padding: 2px 10px;
  font-size: 12px;
  font-weight: 600;
}
```

### 6.2 KPI & Stat Cards

Three layout patterns for metric display:

#### Hero KPI Card
- Background: `var(--gradient-cta)` or `bg-primary`
- Effects: `primary-card-glow` + `border-beam`
- Decorative: Corner ring elements (pseudo-elements)
- Typography: `font-black` (900) for the value

```
┌─────────────────────────┐
│ ◯              ◯        │  ← decorative corner rings
│                         │
│  $142,800               │  ← font-black
│  Total Revenue          │  ← font-semibold, muted
│                         │
│  ↑ 12.4% vs last month  │  ← small delta indicator
│              ◯        ◯ │
└─────────────────────────┘
```

#### Standard KPI Card
- Style: `.bento-card`
- Icon: Lucide icon, color-coded by data type
  - Emerald → Growth
  - Violet → Inventory
  - Sky → Finance

#### KPI Grid Layout
```css
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 1rem;
}

@media (min-width: 768px)  { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 1024px) { .kpi-grid { grid-template-columns: repeat(4, 1fr); } }
```

### 6.3 Charts (Recharts)

#### Donut Chart

```javascript
<RadialBarChart innerRadius={54} outerRadius={80}>
  <RadialBar strokeWidth={4} />
</RadialBarChart>
```

#### Bar Chart

```javascript
<BarChart barCategoryGap="28%">
  <Bar radius={[5, 5, 2, 2]} />  {/* top rounded, bottom squared */}
</BarChart>
```

#### Tooltips

```css
.chart-tooltip {
  background: var(--surface-container);
  backdrop-filter: blur(20px);
  border: 1px solid hsl(var(--border) / 0.5);
  border-radius: 10px;
  padding: 8px 12px;
}
```

### 6.4 Buttons

| Variant | Background | Border | Text | Hover |
|:---|:---|:---|:---|:---|
| Primary | `--gradient-cta` | none | white | brightness +10% |
| Secondary | transparent | `primary / 0.4` | primary | `primary / 0.08` bg |
| Ghost | transparent | `border / 0.5` | on-surface | `surface-bright` bg |
| Destructive | `error / 0.1` | `error / 0.4` | error | `error / 0.15` bg |

**Base button:**
```css
.btn {
  font-family: 'Manrope', sans-serif;
  font-weight: 600;
  border-radius: 8px;
  padding: 8px 16px;
  transition: all 0.2s;
  cursor: pointer;
}
```

### 6.5 Inputs & Forms

```css
.input {
  background: var(--surface-container);
  border: 1px solid hsl(var(--border) / 0.5);
  border-radius: 8px;
  padding: 8px 12px;
  font-family: 'Manrope', sans-serif;
  color: var(--on-surface);
  transition: border-color 0.2s, box-shadow 0.2s;
}

.input:focus {
  border-color: hsl(var(--primary) / 0.6);
  box-shadow: 0 0 0 3px hsl(var(--primary) / 0.12);
  outline: none;
}
```

---

## 7. Sidebar

### Structure

```
┌──────────────────┐
│  Logo / Brand    │
├──────────────────┤
│  [icon] Nav Item │ ← active
│  [icon] Nav Item │
│  [icon] Nav Item │
├──────────────────┤
│  [icon] Settings │
└──────────────────┘
```

### Styles

```css
.sidebar {
  background: var(--surface-lowest); /* Obsidian */
}

/* Active nav item */
.nav-item.active {
  background: hsl(var(--primary) / 0.12);
  color: hsl(var(--primary));
  /* Left-aligned pill glow */
  box-shadow: inset 3px 0 0 hsl(var(--primary));
}

/* Collapsed mode — icons only */
.sidebar.collapsed .nav-item {
  justify-content: center;
  padding: 0.75rem;
}

/* Expanded mode */
.sidebar.expanded .nav-item {
  padding-left: 0.625rem;
  gap: 0.75rem;
}
```

### Icons

- Library: [Lucide Icons](https://lucide.dev)
- Collapsed: centered, 20px
- Expanded: left-aligned, 20px, with text label

---

## 8. Accessibility

### Color Contrast

All text must meet WCAG AA minimum contrast ratios:

| Pairing | Minimum Ratio |
|:---|:---|
| Body text on card background | 4.5:1 |
| Large text / headings | 3:1 |
| UI components & focus indicators | 3:1 |

### Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Focus Styles

```css
:focus-visible {
  outline: 2px solid hsl(var(--primary));
  outline-offset: 3px;
  border-radius: 4px;
}
```

### Semantic HTML

- Use `<main>`, `<nav>`, `<aside>`, `<section>`, `<article>` appropriately
- All icon-only buttons require `aria-label`
- Status badges should include `role="status"` where live-updated
- Charts must have accessible text alternatives (hidden `<caption>` or `aria-label`)

---

## 9. Design Principles

### Depth Through Darkness
The obsidian surface hierarchy creates depth without using shadows alone. Each elevation level is a precise HSL step — never arbitrary. Content lifts toward the user as it becomes more interactive.

### Restraint With Accent
The Italian Red primary is powerful. Use it sparingly: one dominant CTA per view, status indicators, and active states. Never use it for decoration alone.

### Motion With Meaning
Every animation serves a purpose — transitions reveal relationships, shimmer effects confirm interactivity, staggered entries guide reading order. Avoid animation that doesn't communicate state or relationship.

### Typography as Hierarchy
Font weight does the heavy lifting. The jump from `font-normal` to `font-black` is dramatic by design — hero values should feel like data, not decoration.

### Consistent Elevation Language
Surface levels must be applied consistently across the product. A component at `surface-card` elevation should always feel like a card, regardless of context. Never skip elevation levels.

---

*Design-First Hub — Equine Design System*  
*For questions or contributions, open a discussion in the design repository.*
