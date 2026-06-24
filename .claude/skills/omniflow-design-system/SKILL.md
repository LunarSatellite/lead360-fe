---
name: omniflow-design-system
description: Enforces OmniFlow's dark-green Bato-inspired design system when writing or editing any visual code. Use this skill WHENEVER the user asks to create, edit, or style a component, page, layout, card, button, form, dialog, badge, nav, header, sidebar, or anything visual. Also use when the user mentions "design", "style", "theme", "UI", "looks off", "make it pretty", "match the design", "dark mode", or pastes a Figma/screenshot reference. Even when unasked, consult this skill before writing any JSX or Tailwind classes — the design system is non-negotiable and a single wrong token breaks visual consistency.
---

# OmniFlow Design System

Dark-only, editorial, **gold-on-green**. Text is a warm gold (`#FFD84D`) over deep-green glass surfaces; brand accent is electric green (`#00D97E`). Typography and spacing carry the design; color is used sparingly and always means something. If you catch yourself reaching for `bg-white`, `dark:`, `shadow-md`, or `text-gray-500`, stop — those aren't in this system.

## Core tokens (from `tailwind.config.js` — always the source of truth)

| Purpose | Class / value |
|---|---|
| Body background | `bg-bg` → `#0A0F0D` |
| App shell | `bg-bg-shell` → `#0D1410` |
| Card base | `bg-bg-card` → `#111916` |
| Elevated surface (modals, popovers) | `bg-bg-elevated` → `#162019` |
| Glass layer 1 (card surface) | `bg-glass-1` → `#182420` |
| Glass layer 2 (hover) | `bg-glass-2` → `#1E2E26` |
| Glass layer 3 (pressed / nested) | `bg-glass-3` → `#253D32` |
| Input base | `bg-bg-input` → `#0D1410` |
| Border default | `border-thin border-border-subtle` (0.5px, `#1E2E26`) |
| Border hover | `border-border-medium` (`#253D32`) |
| Border active / focus | `border-border-glow` (`rgba(0,255,136,0.15)`) |
| **Text primary (gold)** | `text-text-primary` → **`#FFD84D`** |
| **Text secondary (dark gold)** | `text-text-secondary` → **`#BFA200`** |
| **Text muted (olive)** | `text-text-muted` → **`#665C1A`** |
| Brand primary (green) | `bg-brand text-bg` → `#00D97E` on dark |
| Brand hover | `hover:bg-brand-light` → `#00FF94` |
| Brand soft (active bg) | `bg-brand-soft` → `rgba(0,217,126,0.08)` |
| Accent gradient | `linear-gradient(135deg, #00FFAA 0%, #00B368 100%)` |

> **Palette note:** the text ramp is **gold/olive**, not neutral white/grey. On a primary-text surface the eye expects `#FFD84D`, not `#E8F0EC` — older components written against a white ramp will look washed out. When in doubt, read `tailwind.config.js`; it is canonical.

Status colors (use for meaning, not decoration):

- `success` (emerald) — done / connected
- `info` (blue) — informational
- `warning` (amber) — pending
- `danger` (rose) — error / destructive

## Radius, spacing, typography

- **Radius:** `rounded-frame` (16px, top-level panels), `rounded-card` (12px, cards), `rounded-sm` (8px, buttons/inputs), `rounded-xs` (5px, tiny pills).
- **Frame padding:** `p-4`. **Card internal:** `p-3` or `px-3.5 py-2.5`. **Section gap:** `gap-4`. **Item gap:** `gap-1.5`/`gap-2.5`. **Text stack:** `gap-0.5`.
- **Font:** Inter (sans), JetBrains Mono (code/AI status). Weights **800–900** for headings/numbers, 600–700 for labels, 500 for body.
- **Icons:** Lucide React only. `strokeWidth={1.6}`, size 14–16px. No emojis in UI.

## Canonical snippets — copy these exactly

### Card
```tsx
<div className="bg-glass-1 border-thin border-border-subtle rounded-card p-3.5 hover:bg-glass-2 hover:border-border-medium transition-all">
  {/* content */}
</div>
```

### Active/selected card
```tsx
<div className="bg-brand-soft border-thin border-border-glow rounded-card p-3.5">
  {/* selected content */}
</div>
```

### Primary button
```tsx
<button className="flex items-center gap-1.5 px-4 py-2 rounded-sm bg-brand text-bg font-bold hover:bg-brand-light transition-all disabled:opacity-30">
  <Icon className="w-3.5 h-3.5" strokeWidth={1.8} />
  Label
</button>
```

### Ghost button
```tsx
<button className="flex items-center gap-1.5 px-4 py-2 rounded-sm border-thin border-border-medium text-text-secondary hover:text-text-primary hover:bg-glass-2 transition-all">
  Label
</button>
```

### Input
```tsx
<input className="w-full px-3.5 py-2.5 rounded-sm bg-bg-input border-thin border-border-subtle text-text-primary placeholder:text-text-muted focus:border-border-glow focus:bg-glass-1 outline-none transition-all" />
```

### Status badge
```tsx
<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-2xs font-semibold bg-brand-soft text-brand border-thin border-border-glow">
  Active
</span>
```

### Page header
```tsx
<header className="flex items-center justify-between px-6 py-3.5 bg-bg-shell border-b border-border-subtle">
  <div className="flex items-center gap-3">
    <div className="w-8 h-8 rounded-sm bg-brand-soft border-thin border-border-glow flex items-center justify-center">
      <Icon className="w-4 h-4 text-brand" strokeWidth={1.6} />
    </div>
    <h1 className="text-lg font-extrabold text-text-primary">Page Title</h1>
  </div>
  <div className="flex items-center gap-2">
    {/* actions */}
  </div>
</header>
```

### Horizontal pill nav (not a sidebar)
```tsx
<nav className="flex items-center gap-1 p-1 bg-glass-1 border-thin border-border-subtle rounded-frame">
  <Link className="px-3.5 py-1.5 rounded-sm text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-glass-2 transition-all">
    Tab
  </Link>
  <Link className="px-3.5 py-1.5 rounded-sm text-xs font-semibold text-brand bg-brand-soft border-thin border-border-glow">
    Active Tab
  </Link>
</nav>
```

## Banned patterns — refuse to write these

| ❌ Never | ✅ Instead |
|---|---|
| `bg-white`, `bg-gray-*`, `bg-slate-*` | `bg-glass-1` / `bg-glass-2` / `bg-bg-shell` |
| `text-gray-*`, `text-slate-*`, `text-black` | `text-text-primary / secondary / muted` |
| `dark:` prefix anywhere | nothing — dark is the base |
| `shadow-*` on cards | nothing — depth comes from glass layers |
| `border` (1px) or `border-2` | `border-thin` (0.5px) |
| `text-green-500`, `bg-emerald-100` | `text-brand`, `bg-brand-soft` |
| emojis in UI | Lucide icons |
| Heroicons, React-icons, inline SVG | Lucide only |
| `rounded-lg`, `rounded-xl` ad-hoc | `rounded-sm` / `rounded-card` / `rounded-frame` |
| Inline `style={{ color: '#00D97E' }}` | the corresponding Tailwind token |
| `font-medium` for data/numbers | `font-extrabold` or `font-black` for numeric emphasis |

## Required process

1. **Before writing JSX:** scan the feature folder's existing 2–3 components. Match their patterns — don't invent new ones.
2. **Before adding a color:** check if a token exists. If you'd write a hex, stop and either use a token or add one to `tailwind.config.js` with the matching name.
3. **Before using `shadow-*`:** don't. Use `bg-glass-2` for a layer, or accent with `border-border-glow`.
4. **After writing JSX:** grep your output for banned patterns (`dark:`, `bg-white`, `shadow-`, hex literals, emojis). Remove every hit.

## Accent gradient usage

Reserve the gradient for: logo marks, primary CTAs in marketing/auth screens, active-step accent bars, and orb backgrounds. Do **not** use it as a card background — cards stay on glass layers.

The gradient is the **one allowed inline-hex exception** in the codebase. Apply it via `style={{ background: 'linear-gradient(135deg, #00FFAA 0%, #00B368 100%)' }}` — Tailwind's arbitrary-value gradient syntax is acceptable but the inline style reads cleaner for CTAs with other state logic. Pair with `text-bg` (the dark body color) so the label stays legible on the green fill.

## Chat surfaces

The chat page is the primary surface post-login. Bubbles, composer, and session controls below are canonical — match them exactly.

### User bubble (right-aligned, brand-soft tint)
```tsx
<div className="flex justify-end">
  <div className="max-w-[80%] bg-brand-soft border-thin border-border-glow rounded-card px-3.5 py-2.5 text-sm text-text-primary whitespace-pre-wrap">
    {content}
  </div>
</div>
```

### Assistant bubble (left-aligned, no container — just avatar + text)
```tsx
<div className="flex gap-2.5">
  <BotAvatar />
  <div className="flex-1 max-w-[540px] text-sm leading-relaxed text-text-primary whitespace-pre-wrap">
    {content}
  </div>
</div>
```

Assistant messages do **not** get a bubble background — they read as editorial text next to a small gradient avatar. This is intentional; wrapping them in `bg-glass-1` makes the thread feel like a forum.

### Bot avatar (gradient orb)
```tsx
<div
  className="w-7 h-7 rounded-sm flex items-center justify-center shrink-0"
  style={{ background: 'linear-gradient(135deg, #00FFAA 0%, #00B368 100%)' }}
>
  <Sparkles className="w-3.5 h-3.5" strokeWidth={2} style={{ color: '#0A0F0D' }} />
</div>
```

### Typing indicator (three pulsing dots, not a spinner)
```tsx
<div className="flex items-center gap-1 py-2">
  <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-pulse" />
  <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-pulse [animation-delay:150ms]" />
  <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-pulse [animation-delay:300ms]" />
</div>
```

### Composer (textarea + attach + send)
```tsx
<div className="flex items-end gap-2.5 bg-bg-input border-thin border-border-subtle focus-within:border-border-glow focus-within:bg-glass-1 rounded-card px-3 py-2.5 transition-colors">
  <button className="w-7 h-7 flex items-center justify-center rounded-sm text-text-muted hover:text-text-secondary hover:bg-glass-2 transition-colors shrink-0">
    <Paperclip className="w-4 h-4" strokeWidth={1.6} />
  </button>
  <textarea
    rows={1}
    className="flex-1 bg-transparent border-0 outline-none resize-none text-sm text-text-primary placeholder:text-text-muted py-1 max-h-32 font-mono"
  />
  <button
    className="w-8 h-8 flex items-center justify-center rounded-sm text-bg transition-all shrink-0 hover:brightness-110 disabled:bg-glass-2 disabled:text-text-muted"
    style={{ background: 'linear-gradient(135deg, #00FFAA 0%, #00B368 100%)' }}
  >
    <Send className="w-3.5 h-3.5" strokeWidth={2} />
  </button>
</div>
```

### Session dropdown trigger (top-right chrome)
```tsx
<button className="h-8 pl-3 pr-2 rounded-sm border-thin border-border-medium bg-bg-shell/80 backdrop-blur-sm text-text-secondary hover:text-text-primary hover:bg-glass-2 hover:border-border-glow text-[11px] font-bold transition-colors flex items-center gap-1.5 max-w-[220px]">
  <span className="truncate">{label}</span>
  <ChevronDown className="w-3.5 h-3.5 shrink-0" strokeWidth={1.8} />
</button>
```

### Session list row (inside the dropdown popover)
```tsx
<button className="w-full px-3.5 py-2.5 flex items-center gap-2 text-[11px] text-left text-text-secondary hover:text-text-primary hover:bg-glass-2 transition-colors">
  <MessageSquare className="w-3.5 h-3.5 shrink-0" strokeWidth={1.6} />
  <span className="truncate flex-1 font-medium">{title}</span>
  <span className="text-[10px] text-text-muted shrink-0">{relativeTime}</span>
</button>
```
The current session uses `bg-glass-1 text-text-primary cursor-default` instead of hover styles.

## Voice button

Mic button for chat composers and standalone voice mode. Three visual states: idle (mic icon on brand fill), recording (pulsing red + duration), processing (spinner). Sizes: `xs` (7×7, compact), `sm` (10×10, chat composer), `lg` (12×12, standalone).

### Idle — primary CTA variant
```tsx
<button
  className="w-10 h-10 rounded-sm text-bg flex items-center justify-center transition-all hover:brightness-110 disabled:bg-glass-2 disabled:text-text-muted"
  style={{ background: 'linear-gradient(135deg, #00FFAA 0%, #00B368 100%)' }}
  aria-label="Start recording"
>
  <Mic className="w-4 h-4" strokeWidth={1.8} />
</button>
```

### Recording (red pulse + timer)
```tsx
<div className="flex items-center gap-2">
  <button
    className="w-10 h-10 rounded-sm flex items-center justify-center animate-pulse"
    style={{ background: '#F43F5E', color: '#0A0F0D' }}
    aria-label="Stop recording"
  >
    <Square className="w-3.5 h-3.5" strokeWidth={2.2} fill="currentColor" />
  </button>
  <span className="text-xs font-mono font-bold text-text-primary tabular-nums">
    {formatDuration(seconds)}
  </span>
</div>
```
Never use `bg-red-500`; the recording red is `#F43F5E` (`danger.DEFAULT`). Inline style is fine because there's no bundled `bg-danger` utility for solid fills by default.

### Processing (transcription in flight)
```tsx
<button disabled className="w-10 h-10 rounded-sm bg-glass-2 text-text-secondary flex items-center justify-center">
  <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.8} />
</button>
```

## Mobile adaptations

Mobile layout lives in the same components — no separate mobile tree. Rules:

- **Never hide content behind a hamburger** unless there are more than 4 top-level items. The horizontal pill nav collapses to a scrollable row on mobile: `overflow-x-auto no-scrollbar` on the nav wrapper.
- **Safe areas:** bottom composers / fixed bars must respect `env(safe-area-inset-bottom)`. Use `pb-[max(1rem,env(safe-area-inset-bottom))]` on the outer padding.
- **Edge gutters:** `px-4` on mobile, `px-6` on `md:` and up. Do not use `px-3` (too tight for thumb targets).
- **Type scale:** don't shrink body copy on mobile. Headlines may downgrade one step (`text-4xl md:text-5xl`); body text stays at `text-sm` / `text-base`.
- **Touch targets:** minimum 40×40 (`h-10 w-10`). The `xs` voice-button size (`w-7 h-7`) is reserved for desktop simulators — do not use on mobile.
- **Auth / landing:** single-column centered card, max `max-w-sm`, with the ambient orbs behind it. No marketing sidebar on mobile.

### Mobile-safe bottom composer wrapper
```tsx
<div className="border-t border-thin border-border-subtle bg-bg-shell px-4 md:px-6 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
  {/* composer */}
</div>
```

### Scrollable pill nav (mobile)
```tsx
<nav className="flex items-center gap-1 p-1 bg-glass-1 border-thin border-border-subtle rounded-frame overflow-x-auto no-scrollbar">
  {tabs.map(...)}
</nav>
```

## Gradient orbs (ambient depth)

Behind hero content and dashboards, layer two blurred radial orbs for depth:

```tsx
<div className="relative">
  <div className="pointer-events-none absolute -top-40 -left-40 w-96 h-96 rounded-full blur-3xl bg-brand/10" />
  <div className="pointer-events-none absolute top-20 right-0 w-80 h-80 rounded-full blur-3xl bg-[#00FFAA]/5" />
  {/* content */}
</div>
```
