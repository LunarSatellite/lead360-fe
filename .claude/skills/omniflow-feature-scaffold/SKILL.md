---
name: omniflow-feature-scaffold
description: Scaffolds new pages, routes, and feature slices inside OmniFlow's Feature-Sliced Design architecture. Use this skill WHENEVER the user asks to add a new page, module, CRUD screen, list view, detail view, or "new feature" — also when they say "create the intents page", "add a settings screen", "build the campaigns section", or anything that implies a new slice under `src/features/`. Use it proactively before writing ANY new file — placing code in the wrong folder breaks the architecture and is hard to undo.
---

# OmniFlow Feature Scaffold

OmniFlow uses Feature-Sliced Design. Every piece of code lives in exactly one of: `shared/`, `app/`, or `features/<domain>/`. Cross-feature imports are banned — if two features need the same thing, promote it to `shared/`.

## The 8 feature domains

`auth`, `tenant`, `channels`, `intents`, `flow-builder`, `agents`, `outbound`, `analytics`.

If a request fits none of these, **ask the user** before creating a 9th — don't guess.

## Folder layout per feature

```
src/features/<domain>/
├── api/           # axios calls returning ServiceResult<T>
├── hooks/         # useApiList / useApiMutation wrappers
├── schemas/       # Zod schemas (input + output)
├── types/         # TS types derived from schemas
├── components/    # feature-only components
├── pages/         # route-level components
└── routes.tsx     # lazy-loaded route tree for this feature
```

Promote to `src/shared/` when a thing is used by 2+ features: primitives (`DataTable`, `StatusBadge`, `MetricCard`, `PageHeader`, `EmptyState`, `Dialog`), the axios client, `useApiList` / `useApiMutation`, date/format utils, auth context.

## Scaffolding a new slice — required order

Always build in this order. Each step has exactly one file type.

### 1. Zod schema
`src/features/<domain>/schemas/<entity>.schema.ts`
```ts
import { z } from 'zod';

export const <Entity>Schema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(120),
  createdAt: z.string().datetime(),
  // ...
});

export const Create<Entity>Schema = <Entity>Schema.omit({ id: true, createdAt: true });
export const Update<Entity>Schema = Create<Entity>Schema.partial();

export type <Entity> = z.infer<typeof <Entity>Schema>;
export type Create<Entity> = z.infer<typeof Create<Entity>Schema>;
export type Update<Entity> = z.infer<typeof Update<Entity>Schema>;
```

### 2. API module
`src/features/<domain>/api/<entity>.api.ts`
```ts
import { api } from '@/shared/api/client';
import type { ServiceResult } from '@/shared/api/types';
import type { <Entity>, Create<Entity>, Update<Entity> } from '../schemas/<entity>.schema';

export const <entity>Api = {
  list: (params?: List<Entity>Params) =>
    api.get<ServiceResult<Paged<<Entity>>>>('/v1/<entities>', { params }),
  get: (id: string) =>
    api.get<ServiceResult<<Entity>>>(`/v1/<entities>/${id}`),
  create: (body: Create<Entity>) =>
    api.post<ServiceResult<<Entity>>>('/v1/<entities>', body),
  update: (id: string, body: Update<Entity>) =>
    api.patch<ServiceResult<<Entity>>>(`/v1/<entities>/${id}`, body),
  remove: (id: string) =>
    api.delete<ServiceResult<void>>(`/v1/<entities>/${id}`),
};
```

### 3. Query hooks
`src/features/<domain>/hooks/use-<entities>.ts`
```ts
import { useApiList, useApiMutation } from '@/shared/hooks';
import { <entity>Api } from '../api/<entity>.api';

const KEY = ['<domain>', '<entities>'] as const;

export const use<Entities>List = (params?: List<Entity>Params) =>
  useApiList([...KEY, 'list', params], () => <entity>Api.list(params));

export const use<Entity> = (id: string) =>
  useApiList([...KEY, 'detail', id], () => <entity>Api.get(id), { enabled: !!id });

export const useCreate<Entity> = () =>
  useApiMutation(<entity>Api.create, { invalidate: [KEY] });

export const useUpdate<Entity> = () =>
  useApiMutation(
    ({ id, body }: { id: string; body: Update<Entity> }) => <entity>Api.update(id, body),
    { invalidate: [KEY] }
  );

export const useRemove<Entity> = () =>
  useApiMutation(<entity>Api.remove, { invalidate: [KEY] });
```

### 4. Page component
`src/features/<domain>/pages/<Entity>ListPage.tsx`

Build using `PageHeader` + `DataTable` + `StatusBadge` from `shared/ui/`. Never reimplement a table — extend `DataTable`. Refer to `omniflow-design-system` for the card/button/input classes.

### 5. Route entry
`src/features/<domain>/routes.tsx`
```tsx
import { lazy } from 'react';
import type { RouteObject } from 'react-router';

const <Entity>ListPage = lazy(() => import('./pages/<Entity>ListPage'));
const <Entity>DetailPage = lazy(() => import('./pages/<Entity>DetailPage'));

export const <domain>Routes: RouteObject[] = [
  { path: '<entities>', element: <<Entity>ListPage /> },
  { path: '<entities>/:id', element: <<Entity>DetailPage /> },
];
```

### 6. Wire into app router
In `src/app/router.tsx`, import `<domain>Routes` and nest under the protected layout. Don't hardcode individual paths at the app level.

## Rules — non-negotiable

1. **Feature can import from `shared/` and `app/`.** Never from another feature.
2. **`shared/` can't import from `features/` or `app/`.** If it needs to, you've got the layer wrong.
3. **Routes are lazy.** Every page import uses `React.lazy` in `routes.tsx` — never a top-level import.
4. **URL state is the source of truth** for filters, pagination, sorting. Use `useSearchParams`, not React state.
5. **One entity per file.** Don't combine multiple schemas, APIs, or hooks in one module.
6. **Query keys are typed tuples** starting with the domain name: `['intents', 'list', params]` — never plain strings.
7. **Forms use the matching Zod schema** with `zodResolver`. If the schema doesn't exist yet, create it in step 1 first.

## Before you start

Grep the feature folder for an existing slice of the same shape and copy its structure. Consistency across slices matters more than a clever new approach.

```bash
# Example: about to build the campaigns list
ls src/features/outbound/
cat src/features/outbound/pages/CampaignListPage.tsx | head -80
```

If something's missing (shared hook, primitive, schema helper), stop and add it to `shared/` first — don't inline it into the feature.
