---
name: omniflow-forms
description: OmniFlow's form conventions — React Hook Form + Zod + shared form primitives with the dark-green styling. Use this skill WHENEVER the user asks to build a form, add a field, add validation, handle submit, build a create/edit dialog, a settings screen, a login/register page, a wizard/stepper, or a modal with inputs. Also use when fixing "form not validating", "submit not firing", "field not updating", "error not showing", or any React Hook Form or Zod issue. The raw RHF + Zod combo has sharp edges (resolver mismatches, uncontrolled-to-controlled warnings, stale submit handlers, nested field arrays) — this skill contains the battle-tested patterns.
---

# OmniFlow Forms

Every form: React Hook Form + Zod + `zodResolver` + shared `<Form*>` primitives. No uncontrolled `<input>` without RHF registration. No ad-hoc validation.

## Canonical form

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormField, FormLabel, FormError, FormInput, FormActions } from '@/shared/ui/form';
import { CreateIntentSchema, type CreateIntent } from '../schemas/intent.schema';
import { useCreateIntent } from '../hooks/use-intents';

export function CreateIntentForm({ onSuccess }: { onSuccess?: (intent: Intent) => void }) {
  const create = useCreateIntent();

  const form = useForm<CreateIntent>({
    resolver: zodResolver(CreateIntentSchema),
    defaultValues: {
      name: '',
      description: '',
      enabled: true,
    },
    mode: 'onBlur',
  });

  const onSubmit = form.handleSubmit(async (values) => {
    const result = await create.mutateAsync(values);
    form.reset();
    onSuccess?.(result);
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <FormField>
        <FormLabel htmlFor="name">Name</FormLabel>
        <FormInput id="name" {...form.register('name')} placeholder="e.g. Check order status" />
        <FormError error={form.formState.errors.name} />
      </FormField>

      <FormField>
        <FormLabel htmlFor="description">Description</FormLabel>
        <FormInput
          id="description"
          as="textarea"
          rows={3}
          {...form.register('description')}
        />
        <FormError error={form.formState.errors.description} />
      </FormField>

      <FormActions>
        <button type="button" className="..." onClick={() => form.reset()}>Cancel</button>
        <button
          type="submit"
          disabled={create.isPending || !form.formState.isValid}
          className="..."
        >
          {create.isPending ? 'Creating…' : 'Create intent'}
        </button>
      </FormActions>
    </form>
  );
}
```

## Rules — non-negotiable

1. **Schema first.** If the Zod schema doesn't exist, create it in `features/<domain>/schemas/` before wiring the form.
2. **`defaultValues` is required and complete.** Every field listed in the schema must have a default. Prevents uncontrolled-to-controlled warnings.
3. **`mode: 'onBlur'`** for standard forms. Use `'onChange'` only for tiny inline forms (1–2 fields). Never `'onSubmit'` as the sole mode — users hate pressing submit to discover errors.
4. **`form.handleSubmit(...)`** wraps your submit. Don't call `e.preventDefault()` manually.
5. **`form.reset()`** after success. Don't leave stale values in the form.
6. **Disable submit with `create.isPending || !form.formState.isValid`.** Both conditions matter.
7. **Show errors with `<FormError />`** — never render `errors.name?.message` inline ad-hoc.

## Patterns that bite

### Uncontrolled → controlled warnings
Cause: `defaultValues` omits a field. React sees `undefined` first render, then a string.
Fix: list every field in `defaultValues`, even optional ones (`description: ''`, not `description: undefined`).

### Stale submit handler
Cause: you called `form.handleSubmit` inside a `useCallback` with the wrong deps.
Fix: don't wrap `handleSubmit`. Call it directly inline: `<form onSubmit={form.handleSubmit(onSubmit)}>`.

### Submit fires twice
Cause: button has both `type="submit"` and an `onClick={onSubmit}`.
Fix: only `type="submit"`. Let the form's `onSubmit` handle it.

### `resolver` type error
Cause: your Zod schema's inferred type doesn't match the `useForm<T>` generic.
Fix: always derive the type from the schema: `type CreateIntent = z.infer<typeof CreateIntentSchema>` — don't hand-write it.

### Field array re-renders the world
Cause: you spread `fields` directly into children without stable keys.
Fix: always `key={field.id}` (RHF provides `id`, not `index`).

### Infinite loop with `useEffect(() => form.reset(data))`
Cause: `data` reference changes every render.
Fix: reset inside `useEffect` only when a stable id changes: `useEffect(() => { if (intent) form.reset(intent); }, [intent?.id, form])`.

## Field arrays

```tsx
const { fields, append, remove } = useFieldArray({ control: form.control, name: 'rules' });

{fields.map((field, i) => (
  <div key={field.id} className="flex gap-2">
    <FormInput {...form.register(`rules.${i}.pattern`)} />
    <FormInput {...form.register(`rules.${i}.response`)} />
    <button type="button" onClick={() => remove(i)}>×</button>
  </div>
))}
<button type="button" onClick={() => append({ pattern: '', response: '' })}>Add rule</button>
```

Always register nested fields with the path string — don't destructure `field` and pass its properties manually.

## Multi-step wizards

Keep the whole wizard under one `useForm` call; show/hide steps with local state. Validate per step with `form.trigger(['field1', 'field2'])` before advancing — don't submit partial steps to the server.

```tsx
const next = async () => {
  const ok = await form.trigger(['name', 'description']);
  if (ok) setStep(step + 1);
};
```

## Autosave + TanStack Query (the stability trap)

When combining autosave with RHF, infinite loops are common. Rules:

1. Debounce the watched values (use `useDebounce` from `shared/hooks`), never raw `watch()` in an effect.
2. Autosave mutation must NOT invalidate the query feeding the form — that re-renders the form with fresh `defaultValues` and triggers another save.
3. If you must invalidate, use `setQueryData` inside the mutation instead to patch the cache without a refetch.

```tsx
const values = form.watch();
const debounced = useDebounce(values, 600);
const save = useUpdateIntent();

useEffect(() => {
  if (!form.formState.isDirty) return;
  save.mutate({ id, body: debounced });
}, [debounced, id]); // form.formState.isDirty intentionally out — we check inside
```

## Banned patterns

| ❌ Never | ✅ Instead |
|---|---|
| `<input onChange={...} value={...} />` without RHF | `{...form.register('name')}` |
| Manual `e.preventDefault()` inside submit | `form.handleSubmit(fn)` |
| `required`, `pattern`, `minLength` HTML attrs | Zod schema constraints |
| `setError` on the form from a 400 response | map server errors via `ApiError.details` into `form.setError` once |
| Separate useState per field | single `useForm` for the whole form |
| `any` as the form generic | `z.infer<typeof Schema>` |
