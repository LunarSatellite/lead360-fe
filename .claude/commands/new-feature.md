---
description: Scaffold a new feature slice following OmniFlow FSD conventions
argument-hint: <domain> <entity>
---

Scaffold a new feature slice for domain `$1` entity `$2`.

Use the omniflow-feature-scaffold skill. Follow the 6-step order exactly:
1. Zod schema (`features/$1/schemas/$2.schema.ts`)
2. API module (`features/$1/api/$2.api.ts`)
3. Query hooks (`features/$1/hooks/use-$2s.ts`)
4. Page component (`features/$1/pages/$2ListPage.tsx`)
5. Route entry (`features/$1/routes.tsx` — create or extend)
6. Wire into `app/router.tsx`

Before writing anything, confirm `$1` is one of the 8 approved domains
(auth, tenant, channels, intents, flow-builder, agents, outbound, analytics).
If not, stop and ask.

Follow omniflow-design-system for all styling.
Follow omniflow-data-layer for the api + hooks wiring.