# OmniFlow AI — Frontend

Multi-channel, multi-tenant chatbot builder platform. React 19 + TypeScript + Tailwind CSS.

## Design

Bato-inspired dark cosmic theme. Dark mode only. Glass surfaces, purple-to-cyan gradient accents, Plus Jakarta Sans typography. No sidebar — horizontal top navigation pills.

## Quick Start

```bash
pnpm install
pnpm dev
```

Opens at `http://localhost:3000`. Default route redirects to `/biz/setup` (onboarding wizard).

## Routes

| Path | Description |
|------|-------------|
| `/auth/login` | Login page |
| `/auth/register` | Registration page |
| `/biz/setup` | Business dashboard — onboarding wizard (default) |
| `/tech/setup` | Technical dashboard — onboarding wizard |

## Architecture

Feature-Sliced Design — code organized by business domain, not technical layer.

```
src/
├── app/           # Shell: providers, layouts, router
├── features/      # 11 domain features (auth, tenant, intents, etc.)
├── shared/        # Generic components, hooks, lib, types, config
├── assets/        # Static files
└── styles/        # Global CSS, Tailwind config
```

## Tech Stack

- React 19 + TypeScript 5.7
- Vite 6
- Tailwind CSS 3.4 (custom dark-only tokens)
- TanStack Query v5
- React Hook Form + Zod
- React Router v7
- Axios (ServiceResult unwrapping)
- Lucide React (icons)
- Sonner (toasts)

## Design Tokens

All design tokens live in `tailwind.config.ts`. Key colors:

| Token | Value | Usage |
|-------|-------|-------|
| `bg` | `#060911` | Page background |
| `bg-shell` | `#0B0F1A` | App frame |
| `glass-1` | `rgba(255,255,255,0.03)` | Card surfaces |
| `brand` | `#8B5CF6` | Active, selected, primary |
| `success` | `#06D6A0` | Done, connected, resolved |
| `info` | `#3B82F6` | Informational, web channel |
| `warning` | `#F59E0B` | Pending, in-progress |
| `danger` | `#F43F5E` | Errors, handoff |

## Rules

- No sidebar — horizontal top nav only
- No light mode — dark-only
- No `any` types
- No direct API calls from components — use TanStack Query hooks
- Glass surfaces only — no opaque cards, no box-shadows
- Color = meaning — never decorative
