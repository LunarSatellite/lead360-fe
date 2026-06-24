---
name: omniflow-data-layer
description: OmniFlow's data-fetching and mutation conventions — ServiceResult unwrapping, TanStack Query key structure, useApiList / useApiMutation wrappers, optimistic updates, and Socket.IO invalidation. Use this skill WHENEVER the user asks to fetch data, add an API call, wire up a list/detail, handle loading/error states, mutate data, refresh after save, hit a new endpoint, debug "stale data" or "data not refreshing", or integrate real-time updates. Also use it any time you see `axios`, `useQuery`, `useMutation`, `queryKey`, or `invalidateQueries` in the conversation — the raw TanStack Query API is banned in this project; everything goes through the shared wrappers.
---

# OmniFlow Data Layer

Every network call returns a `ServiceResult<T>`. Every component reads data through `useApiList` or mutates through `useApiMutation`. No component imports `axios` directly.

## The `ServiceResult<T>` contract

Backend (.NET) always returns:
```ts
type ServiceResult<T> =
  | { success: true;  data: T;   error: null }
  | { success: false; data: null; error: { code: string; message: string; details?: unknown } };
```

The shared axios client unwraps this:
- On `success: true` → returns `data`
- On `success: false` → throws `ApiError { code, message, details, status }`

So in components you treat it like a normal promise that either resolves with `T` or throws.

## Query keys — always typed tuples

```ts
// ✅ correct — domain-first tuple, params last
const KEY = ['intents'] as const;
useApiList([...KEY, 'list', { page, search }], fetcher);
useApiList([...KEY, 'detail', id], fetcher);

// ❌ wrong — string, unclear scope
useApiList(['intentsList'], fetcher);
useApiList(`intents-${id}`, fetcher);
```

Key shape: `[domain, view, ...params]`. `view` is `'list'`, `'detail'`, `'stats'`, etc.

## `useApiList` — reads

```ts
import { useApiList } from '@/shared/hooks';

export const useIntentsList = (params: ListIntentParams) =>
  useApiList(
    ['intents', 'list', params],
    () => intentApi.list(params),
    {
      // defaults you rarely override:
      // staleTime: 30_000,
      // gcTime: 5 * 60_000,
      // retry: (count, err) => err.status !== 404 && count < 2,
    }
  );
```

In components:
```tsx
const { data, isPending, isError, error, refetch } = useIntentsList(params);

if (isPending) return <TableSkeleton />;
if (isError) return <ErrorState error={error} onRetry={refetch} />;
return <DataTable rows={data.items} total={data.total} />;
```

**Always handle three states** — pending, error, success. No bare `data?.items.map()` at the top of a component.

## `useApiMutation` — writes

```ts
import { useApiMutation } from '@/shared/hooks';

export const useCreateIntent = () =>
  useApiMutation(intentApi.create, {
    invalidate: [['intents']],                // refetch intent queries
    onSuccess: (created) => toast.success(`Created ${created.name}`),
    onError: (err) => toast.error(err.message),
  });
```

In components:
```tsx
const create = useCreateIntent();

const onSubmit = async (values: CreateIntentInput) => {
  await create.mutateAsync(values);
  navigate(`/intents/${...}`);
};

<Button loading={create.isPending} onClick={() => create.mutate(values)}>Save</Button>
```

## Invalidation rules

Use `invalidate: [[prefix]]` to refetch. TanStack Query matches by prefix, so `['intents']` invalidates both `['intents', 'list', ...]` and `['intents', 'detail', ...]`.

```ts
// Refetch everything intent-related
invalidate: [['intents']]

// Only refetch lists, leave detail caches alone
invalidate: [['intents', 'list']]

// Multiple domains
invalidate: [['intents'], ['flow-builder']]
```

## Optimistic updates — only when latency is visible

Reserve for fast-feedback UI: toggle switches, inline edits, drag-and-drop reorder. Don't optimistic-update anything destructive or anything with server-side validation.

```ts
export const useToggleIntentEnabled = () =>
  useApiMutation(
    ({ id, enabled }: { id: string; enabled: boolean }) => intentApi.update(id, { enabled }),
    {
      optimistic: {
        key: (vars) => ['intents', 'detail', vars.id],
        apply: (prev, vars) => ({ ...prev, enabled: vars.enabled }),
      },
      invalidate: [['intents']],
    }
  );
```

## URL state — never mirror filters in React state

```tsx
const [params, setParams] = useSearchParams();
const page = Number(params.get('page') ?? 1);
const q = params.get('q') ?? '';

// Update
setParams((p) => { p.set('page', String(page + 1)); return p; });
```

`useApiList` keys off `params`, so changing URL automatically refetches.

## Socket.IO invalidation

For realtime domains (`agents`, live sessions, outbound deliveries):
```ts
useEffect(() => {
  const handler = (evt: SessionEvent) => {
    queryClient.invalidateQueries({ queryKey: ['agents', 'sessions'] });
  };
  socket.on('session.updated', handler);
  return () => { socket.off('session.updated', handler); };
}, [queryClient]);
```

Keep socket handlers in `features/<domain>/hooks/use-<domain>-realtime.ts`. Never in pages.

## Banned patterns

| ❌ Never | ✅ Instead |
|---|---|
| `import axios from 'axios'` in a component | `api.get/post/patch/delete` from `shared/api/client` |
| `useEffect(() => { fetch(...) })` | `useApiList` |
| `useState` to hold server data | let TanStack Query cache hold it |
| `useQuery` / `useMutation` directly | `useApiList` / `useApiMutation` |
| `enabled: id !== undefined` | `enabled: !!id` (handles empty strings too) |
| `retry: 3` on mutations | mutations don't retry by default — good |
| Swallowing errors with `.catch(() => {})` | let them throw; `useApiMutation` surfaces them |
| `queryClient.setQueryData` outside of a mutation's `optimistic` config | use `invalidate` |

## Debugging checklist

- **Stale data after mutation?** Missing `invalidate` on the mutation. Add the parent key.
- **List flashes empty on refetch?** You're reading `data` before checking `isPending`. Handle all three states.
- **Mutation fires twice?** Button's inside a `<form>` with an `onSubmit` — React Hook Form handles submit; the button should be `type="submit"` only, no `onClick`.
- **Query doesn't refetch on URL change?** `useSearchParams` returns a stable reference; spread into the key: `[...KEY, 'list', { page, q }]`.
- **Infinite refetch loop?** Your query key contains a new object/array literal on every render. Memoize it or use primitives.
