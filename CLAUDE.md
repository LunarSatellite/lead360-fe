# CLAUDE.md — OmniFlow Frontend

This file guides Claude Code when working on the **OmniFlow AI frontend** (React + TypeScript + Tailwind) — one codebase that ships as two consoles, Lead360 and StyleMint. The design system is shared; the palette is per-product and lives in `src/styles/globals.css`. See section 2.

> **Golden rule:** Read this file, check the skills in `.claude/skills/` (`omniflow-design-system`, `omniflow-data-layer`, `omniflow-forms`, `omniflow-feature-scaffold`, `omniflow-flow-builder`, `omniflow-simplify`), and match existing patterns in the codebase before writing any new UI.

---


## Commands

- `pnpm dev` — start Vite dev server
- `pnpm build` — production build
- `pnpm typecheck` — `tsc --noEmit`, must pass before any commit
- `pnpm lint` — `eslint .`, zero new warnings allowed
- `pnpm test` — Vitest unit tests (when present)

**Rule:** after every feature slice, run `pnpm typecheck && pnpm lint`. Do not commit with either failing.



## Library version notes

- **TanStack Query: v5+.** Object syntax only: `useQuery({ queryKey, queryFn })`, never the v4 positional form. `cacheTime` is now `gcTime`. `isLoading` is now `isPending`.
- **React Flow: `@xyflow/react` v12+.** Never import from `reactflow` (deprecated). `nodeTypes`/`edgeTypes` must be module-level or memoized. See `omniflow-flow-builder` skill for the 12 rules.
- **React Hook Form: v7+.** Use `zodResolver` from `@hookform/resolvers/zod`. Always derive form types with `z.infer<typeof Schema>`.
- **Zod: v3.x.** `z.coerce.number()` / `z.coerce.date()` for form inputs. `.transform()` runs after validation.
- **Tailwind: v3.x** on this project (not v4). Design tokens are in `tailwind.config.js`.
- **React Router: v7** (lazy-loaded per feature).


## 1. Project

- **Name:** OmniFlow AI — multi-channel (WhatsApp, Messenger, SMS, Voice) chatbot builder
- **Scope of this CLAUDE.md:** Frontend only (React 18 + TypeScript + Vite + Tailwind)
- **Architecture:** Feature-Sliced Design — 8 feature domains (`auth`, `tenant`, `channels`, `intents`, `flow-builder`, `agents`, `outbound`, `analytics`)
- **Data layer:** TanStack Query + Axios + `ServiceResult` pattern + React Hook Form + Zod
- **Routing:** React Router v7 (lazy-loaded feature modules)
- **Realtime:** Socket.IO for agent handoff + live session updates

---

## 2. Design System — per-product palette

### Core principle
Dark-only, editorial, confident. No light mode, no `dark:` prefix. Typography and spacing carry the design; color is used sparingly and always *means* something.

**One codebase ships two consoles** (see `src/shared/config/env.ts`). The structure below — every token name, every radius, every border width — is shared. Only the *values* differ, and they differ in exactly one place: the token table at the top of `src/styles/globals.css`.

| | Lead360 (default) | StyleMint (`VITE_CONSOLE_PRODUCT=stylemint`) |
|---|---|---|
| Brand | `#00D98A` dark green | `#2ECC71` emerald |
| Body / card / elevated | `#0A1612` / `#132420` / `#1A332C` | `#18181B` / `#1F1F23` / `#27272A` (zinc) |
| Text ramp | `#FFFFFF` / `#B8E6D5` / `#7A9B8E` | `#FFFFFF` / `#D4D4D8` / `#9F9FA9` |
| Second accent | violet `#7B61FF` (AI, premium) | yellow `#F1C40F` — sparingly |
| Status | emerald / blue / amber / rose | `#2ECC71` / `#00A6F4` / `#F1C40F` / `#FF6467` |

StyleMint's values are not invented: they come from the mobile app's `lib/theme/design_tokens.dart`, which is generated from the Figma variables. A few tints the mobile file has no equivalent for are derived from `#2ECC71` and labelled `derived` in the token table. **Do not add a colour to the StyleMint palette that is not in that Dart file or derived from something in it.**

> **On the gold ramp.** Earlier revisions of this file documented a gold text ramp (`#FFD84D` / `#BFA200` / `#665C1A`) as the Lead360 identity, and `.claude/skills/omniflow-design-system/SKILL.md` still describes the system as "gold-on-green". `tailwind.config.js` has never shipped those values — `text.primary` has been `#FFFFFF` and `text.secondary` `#B8E6D5` throughout. The gold survives only as hardcoded hex at three call sites (`AuthLayout.tsx`, `AccountsPage.tsx`, `CrmInvoicesPage.tsx`). Treat the table above as authoritative and the gold as documentation drift, not a palette. StyleMint has no gold ramp at all.

### How the swap works

`globals.css` defines every colour as an RGB channel triple on `:root`, and redefines the same names under `:root[data-console='stylemint']`. `tailwind.config.js` contains **no colour literals** — every entry reads `rgb(var(--token) / <alpha-value>)`. So `bg-glass-1` and `text-text-muted` paint the right product's colour without a single conditional in a component.

Two rules keep that honest, and `src/styles/theme-tokens.test.ts` enforces both:

1. **Every literal token in `:root` has a StyleMint counterpart.** A missing one does not disappear — it keeps Lead360's value, which is how you get one theme's text on the other's ground.
2. **Derived tokens** (those whose value contains `var(`, like `--bg-card: rgb(var(--color-surface-card))`) are declared once, in `:root` only, and follow automatically. Restating one in the StyleMint block silently unpins it.

The same suite also checks WCAG contrast for every text-on-surface pair in both palettes, and asserts the StyleMint text ramp stays neutral.

**What sets the attribute:** `consoleHtmlBrand` in `vite.config.ts` rewrites `index.html` at build time for the StyleMint build. With the attribute absent the Lead360 palette applies — an unwired build looks like Lead360, never like an unreadable half-theme.

### Adding or changing a colour
1. Add the literal to `:root` **and** to `:root[data-console='stylemint']`, as an RGB triple. The test fails if you do only one.
2. Reference it from `tailwind.config.js` as `rgb(var(--your-token) / <alpha-value>)`.
3. Use the resulting utility class. **Never** a hex or `rgba()` at a call site — not in `className`, not in a `style` object, not in an arbitrary value like `bg-[rgba(0,217,138,0.08)]`. Those bypass both files and stay Lead360 green in the StyleMint build.

There is a large backlog of exactly that: roughly 2,300 colour literals across ~120 feature files duplicate a token instead of reading it. They are a known defect, not a pattern to copy.

### Color tokens (from `tailwind.config.js` — names, not values)

```ts
bg:     { DEFAULT, shell, card, elevated, input }   // page → panel → card → modal
glass:  { 1, 2, 3 }                                 // card → hover → raised
border: { subtle, medium, glow, success }           // glow = brand tint, active/selected
text:   { primary, secondary, muted }
brand:  { DEFAULT, light, dark, soft }              // soft = brand tint, active bg
// status: success, info, warning, danger — each with a `soft` tint
// accents: teal (analytics, data viz), violet (AI, flow builder, premium badges)
```

The brand tint *alpha* is per-product too (`--alpha-brand-soft`, `--alpha-brand-glow`): 8%/18% over Lead360's near-black reads the same as 14%/28% over StyleMint's much lighter zinc. Adjust those rather than reaching for a different green.

**Accent gradient (logos, CTAs, active bars):** `bg-gradient-brand`

### Surfaces & borders
- Borders are **always `0.5px`** (`border-thin` token) — never 1px or thicker.
- Cards use `bg-glass-1 border-thin border-border-subtle rounded-card` (12px radius).
- Hover: `hover:bg-glass-2 hover:border-border-medium`.
- Active/selected: `bg-brand-soft border-thin border-border-glow`.
- **No box-shadows** on cards. No solid opaque card backgrounds. Use glass layers.

### Typography
- Font: **Inter** (sans), **JetBrains Mono** for code / AI status.
- Weight: **800–900** for headings and numeric values, 600–700 for labels, 500 for body.
- No emojis in UI. Icons only from **Lucide React**, `strokeWidth={1.6}`, size 14–16px.

### Layout chrome
- **Horizontal top pill nav**, not a traditional sidebar. Active tab gets the green glass treatment (`bg-brand-soft` + `border-border-glow`).
- Page header: flat dark `#080A09`, compact (~56px), small green-glass icon square + bold title + right-side actions (ghost button + green primary).
- Content uses gradient orbs behind the canvas for depth — purple/green blurred radial glows, never pure flat.

### Color = meaning
- `brand` (green) → active / primary
- `success` (emerald) → done / connected
- `info` (blue) → informational
- `warning` (amber) → pending
- `danger` (rose) → error / destructive

### What to avoid
- `bg-white`, `text-gray-*`, `text-slate-*`, `shadow-*`, `dark:` variants, emoji in UI, 1px borders, gradients as card backgrounds (reserve gradients for CTAs, accent bars, and orbs).

---

## 3. Tailwind conventions

```tsx
// ✅ correct
<div className="bg-glass-1 border-thin border-border-subtle rounded-card p-3.5 text-text-primary">

// ❌ wrong — light-mode defaults
<div className="bg-white dark:bg-gray-900 text-gray-900 shadow-md">
```

### Spacing
- Frame padding: `p-4` (16px)
- Card internal: `p-3` / `px-3.5 py-2.5`
- Section gap: `gap-4`
- Item gap: `gap-1.5` / `gap-2.5`
- Text stack: `gap-0.5`

### Radius
- `rounded-frame` (16px) for top-level panels
- `rounded-card` (12px) for cards
- `rounded-sm` (8px) for buttons / inputs
- `rounded-xs` (5px) for tiny pills / dots

### Buttons
- Primary: `bg-brand text-bg hover:bg-brand-light` — solid green, dark text.
- Ghost: `border-thin border-border-medium text-text-secondary hover:text-text-primary hover:bg-glass-2`.
- Icon: square, `w-9 h-9 rounded-sm hover:bg-glass-2`.

### Inputs
- `bg-bg-input border-thin border-border-subtle focus:border-border-glow focus:bg-glass-1 text-text-primary placeholder:text-text-muted`.
- Hover brightens to `border-border-medium`; focus adds the green glow border.

---

## 4. Code architecture

### Folder layout (Feature-Sliced)
```
src/
├── app/              # providers, layouts, router
├── shared/           # ui primitives, hooks, api client, utils
├── features/
│   ├── auth/         # login, register, reset
│   ├── tenant/       # settings, members, billing
│   ├── channels/     # WhatsApp, Messenger, SMS, Voice config
│   ├── intents/      # swagger upload, manual entry, CSV/JSON, LLM suggest
│   ├── flow-builder/ # React Flow canvas
│   ├── agents/       # live handoff dashboard
│   ├── outbound/     # campaigns, templates
│   └── analytics/    # dashboards, reports
└── styles/           # globals.css
```

Each feature ships **its own** `pages/`, `components/`, `hooks/`, `api/`, `types/`. Never reach across features — promote shared code to `shared/` instead.

### Data flow
- Every API call returns a `ServiceResult<T>` — never touch `axios` directly from a component.
- Use `useApiList(...)` / `useApiMutation(...)` hooks from `shared/hooks/`.
- Forms: React Hook Form + Zod resolver. Validation schemas live in `features/<x>/schemas/`.
- Query keys: `['feature', 'entity', ...params]` — always a const tuple.

### Components
- Shared primitives live in `shared/ui/` — `DataTable`, `StatusBadge`, `MetricCard`, `PageHeader`, `EmptyState`, `Dialog`.
- Feature components compose those primitives; never re-implement them.
- Prefer **composition over props explosion** — break components at ~150 lines.

---

## 5. Routing

- React Router v7 with lazy imports per feature.
- Guards: `RequireAuth`, `RequireTenant` wrap protected routes in `app/router.tsx`.
- URL state (filters, pagination) uses `useSearchParams` — never React state for things you'd want to share or bookmark.

---

## 6. What to do when starting a task

1. **Find the feature folder** it belongs to. If none fits, ask before creating a new one.
2. **Look at 2–3 existing pages in the same folder** to match patterns (query hook → schema → component → route entry).
3. **Reuse `shared/ui` primitives.** No new `Button`, `Table`, `Badge` — extend the existing ones.
4. **Use design tokens, never raw hex.** If the token doesn't exist, add it to `tailwind.config.js` instead of hardcoding.
5. **Dark-native classes only.** If you typed `bg-white` or `dark:` anywhere, delete it.
6. **Small commits.** One feature slice per commit — routing + types + api + hook + page.

---

## 7. Do / Don't cheatsheet

| ✅ Do | ❌ Don't |
|---|---|
| `bg-glass-1 border-thin border-border-subtle` | `bg-white shadow-md rounded-lg` |
| `text-text-primary / secondary / muted` | `text-gray-100 dark:text-gray-300` |
| `text-brand` / `bg-brand-soft` for active | `text-green-500` / `bg-emerald-100` |
| Lucide icons, `strokeWidth={1.6}` | emojis, Heroicons, raw SVG |
| TanStack Query + `useApiList` | raw `useEffect` + `fetch` |
| React Hook Form + Zod | uncontrolled inputs, manual validation |
| 0.5px borders | 1px, 2px, or thicker |
| Horizontal pill nav | vertical sidebar (unless explicitly asked) |

---

## 8. Testing & quality

- Type-check with `tsc --noEmit` before handoff — zero TS errors.
- Lint passes (`eslint .`) — no warnings introduced.
- Every new page renders without network (use `msw` mocks in stories).
- No `console.log` in shipped code.

---

## 9. After every coding session

**When a coding session is wrapping up, run `/simplify` at the end.** This is non-negotiable — it's how we keep the codebase from accumulating cruft.

`/simplify` should:
- Collapse duplicated Tailwind class strings into shared variants.
- Extract repeated JSX into a primitive in `shared/ui/` when it appears 3+ times.
- Remove dead imports, unused props, and commented-out code.
- Flatten nested ternaries into early returns or lookup maps.
- Replace ad-hoc inline styles with design tokens.
- Merge sibling `useState` calls that always change together into one object or a reducer.
- Confirm no `console.log`, no `any`, no `// TODO` without a ticket reference.

If `/simplify` flags a change that feels risky (touches runtime behavior, API contracts, or shared primitives), stop and surface it as a proposal before applying.

---

## 10. Quick reference

- **Design tokens source:** the token table at the top of `src/styles/globals.css` (values) + `tailwind.config.js` (names). Both palettes live in the CSS; nothing in the config is a literal.
- **Accent gradient:** `bg-gradient-brand` — never a hardcoded pair of stops
- **Primary brand:** `brand` → `#00D98A` on Lead360, `#2ECC71` on StyleMint
- **Body bg:** `bg` → `#0A1612` on Lead360, `#18181B` on StyleMint
- **Theme guard:** `src/styles/theme-tokens.test.ts`
- **Skill reference (if available):** `/mnt/skills/user/omniflow-frontend/SKILL.md`

---

*End of CLAUDE.md. Remember: after every coding session, run `/simplify`.*