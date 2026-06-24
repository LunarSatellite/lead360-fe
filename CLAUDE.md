# CLAUDE.md — OmniFlow Frontend

This file guides Claude Code when working on the **OmniFlow AI frontend** (React + TypeScript + Tailwind). It reflects the current **Dark Green Bato-Inspired** design system that replaced the earlier purple/cosmic theme during the gradual redesign.

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

## 2. Design System — Dark Green (current)

### Core principle
Dark-only, editorial, confident. No light mode, no `dark:` prefix. Typography and spacing carry the design; color is used sparingly and always *means* something.

### Color tokens (from `tailwind.config.js`)

```ts
bg: {
  DEFAULT:  '#0A0F0D',   // body
  shell:    '#0D1410',   // app shell / outer panels
  card:     '#111916',   // card base
  elevated: '#162019',   // elevated card / modal / popover
  input:    '#0D1410',   // form inputs
},
glass: { 1:'#182420', 2:'#1E2E26', 3:'#253D32' },
border: {
  subtle:  '#1E2E26',
  medium:  '#253D32',
  glow:    'rgba(0,255,136,0.15)',      // active/selected
  success: 'rgba(16,185,129,0.15)',
},
// Text is GOLD, not neutral — deliberate gold-on-green palette.
text: {
  primary:   '#FFD84D',                 // warm gold — body text, headings
  secondary: '#BFA200',                 // dark gold — labels, muted body
  muted:     '#665C1A',                 // olive — helper text, timestamps
},
brand: {
  DEFAULT: '#00D97E',                   // main accent
  light:   '#00FF94',                   // hover / highlight
  dark:    '#00B368',
  soft:    'rgba(0,217,126,0.08)',      // active bg
},
// status: success (emerald), info (blue), warning (amber), danger (rose)
```

> The gold text ramp is intentional — it's the identity of the current redesign. Older components written against the previous off-white ramp (`#E8F0EC` etc.) should be updated to `text-text-primary` which now resolves to gold. Never hardcode `#E8F0EC`, `text-white`, or `text-gray-*`.

**Accent gradient (logos, CTAs, active bars):** `linear-gradient(135deg, #00FFAA 0%, #00B368 100%)`

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

- **Design tokens source:** `tailwind.config.js` + `src/styles/globals.css`
- **Accent gradient:** `from-[#00FFAA] to-[#00B368]`
- **Primary brand:** `#00D97E` (`brand.DEFAULT`)
- **Body bg:** `#0A0F0D` (`bg.DEFAULT`)
- **Skill reference (if available):** `/mnt/skills/user/omniflow-frontend/SKILL.md`

---

*End of CLAUDE.md. Remember: after every coding session, run `/simplify`.*