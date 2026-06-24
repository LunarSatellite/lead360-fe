---
name: omniflow-simplify
description: End-of-session cleanup pass for the OmniFlow frontend — collapses duplicated Tailwind class strings, extracts 3x-repeated JSX into shared primitives, removes dead imports and commented code, flattens nested ternaries, strips console.logs and `any`, and confirms design-system compliance. Use this skill WHENEVER the user types `/simplify`, says "clean up", "refactor what we just wrote", "wrap up this session", "end of session", "polish", or "tidy". Also use proactively at the natural end of a coding session before the user asks — this is part of the OmniFlow workflow contract documented in CLAUDE.md.
---

# /simplify — End-of-session cleanup

Run after a coding session to collapse the cruft that accumulates when you're moving fast. This is a **checklist pass**, not a rewrite. Don't reshape the architecture — that's a separate conversation.

## The pass — run in order

Do these in the exact order below. Each step is cheap on its own; together they keep the codebase from rotting.

### 1. Scan the diff
First, know what you're working with. Run:
```bash
git diff --stat HEAD
git diff HEAD -- 'src/**/*.{ts,tsx}'
```
Only touch files in the diff. Don't rewrite code that wasn't part of this session.

### 2. Dead imports & code
```bash
# Flag obviously-unused imports
npx eslint --no-eslint-rc --rule 'unused-imports/no-unused-imports: error' src/...
```
Remove:
- unused imports
- commented-out blocks older than this session (keep yours if you marked them `// TODO(today): ...`)
- unused props declared in interfaces
- unused files entirely (check with `grep -rln "from '.../<file>'" src/` before deleting)

### 3. Design-system compliance (hard rules)
Grep the diff for banned patterns. Each hit is a fix:

```bash
# Run against files in the diff
git diff --name-only HEAD | grep -E '\.(tsx|ts)$' | xargs grep -nE \
  'bg-white|bg-gray-|bg-slate-|text-gray-|text-slate-|dark:|shadow-(sm|md|lg|xl)|border-[1-9]|rounded-(md|lg|xl|2xl)|#[0-9a-fA-F]{3,6}'
```

Fix each hit using tokens from `omniflow-design-system`. Hex literals in particular — if the token doesn't exist, add it to `tailwind.config.js` rather than inline.

### 4. Duplicated Tailwind strings
When the same long `className` appears 2+ times in one file, extract to a `const`. When it appears across files in the same feature, extract a variant via `cva` (or a tiny helper), placed in `shared/ui/` if truly shared, `features/<x>/components/<thing>.styles.ts` otherwise.

Threshold: **3 or more occurrences of the same 4+ class combo** → extract.

```tsx
// before
<div className="bg-glass-1 border-thin border-border-subtle rounded-card p-3.5 hover:bg-glass-2 hover:border-border-medium transition-all">
// ...later...
<div className="bg-glass-1 border-thin border-border-subtle rounded-card p-3.5 hover:bg-glass-2 hover:border-border-medium transition-all">

// after
const cardClass = "bg-glass-1 border-thin border-border-subtle rounded-card p-3.5 hover:bg-glass-2 hover:border-border-medium transition-all";
<div className={cardClass}>
```

### 5. Repeated JSX (3x rule)
If a JSX shape appears 3 or more times across the diff — extract to a component.

- If only this feature uses it → `features/<x>/components/`
- If two or more features could use it → `shared/ui/`

Before promoting to `shared/ui/`, grep the whole repo for similar shapes; the extraction might already exist.

### 6. Flatten nested ternaries
2 levels max. 3+ levels → lookup map or early-return helper.

```tsx
// ❌ 3-deep ternary
const label = status === 'pending' ? 'Pending' : status === 'active' ? 'Active' : status === 'done' ? 'Done' : 'Unknown';

// ✅ lookup
const LABEL: Record<Status, string> = { pending: 'Pending', active: 'Active', done: 'Done' };
const label = LABEL[status] ?? 'Unknown';
```

### 7. Sibling useState merge
If two `useState` calls always change together (e.g. `isOpen` + `selectedId`), merge them into one object or a `useReducer`.

```tsx
// ❌
const [isOpen, setIsOpen] = useState(false);
const [selectedId, setSelectedId] = useState<string | null>(null);

// ✅
const [state, setState] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
```

### 8. Strip noise
```bash
git diff --name-only HEAD | grep -E '\.(tsx|ts)$' | xargs grep -nE \
  'console\.(log|debug|info)|: any(\s|,|\)|>)|// TODO(?! \(.*\):)|// FIXME|debugger;'
```
- `console.log` / `console.debug` — delete (keep `console.error` for genuine error paths)
- `any` — replace with the actual type or `unknown` with a narrow
- `// TODO` without an owner/ticket — either resolve or reformat as `// TODO(#123): …`
- `debugger;` — delete

### 9. Query keys and design tokens sanity
- Every `useApiList` / `useApiMutation` key is a typed tuple starting with the domain. No string keys.
- Every new Tailwind class references a token, not a hex.
- Every form uses `zodResolver` + a schema from `features/<x>/schemas/`.

### 10. Type-check and lint
```bash
npx tsc --noEmit
npx eslint .
```
Both must pass with zero new errors and zero new warnings before declaring simplify done.

### 11. Write the summary
Report back to the user in this exact shape:

```
/simplify summary

✓ Dead code: removed N unused imports, M commented blocks
✓ Design system: replaced N banned patterns with tokens
✓ Duplication: extracted N Tailwind variants, M JSX components
✓ Noise: stripped N console.logs, M `any`s, K TODOs
✓ Types: tsc passes, eslint passes

Flagged for review (did NOT change):
- <risky thing 1> — reason
- <risky thing 2> — reason
```

## When to STOP and surface instead of changing

Don't apply the change; report it as a flag, if any of these are true:

- Touches runtime behavior (e.g. reordering effects, changing timing)
- Renames or re-exports something in `shared/ui/`
- Changes an API contract, URL, or query key shape other code depends on
- Removes code that looks dead but isn't referenced by a dynamic import or SSR boundary
- Affects a file nobody edited this session

These need a human call. Flag them in the summary.

## Budget

`/simplify` should finish in 2–3 minutes of focused work. If you're 10+ minutes in, stop, commit what you have, and ask the user which remaining items to do next session.
