---
description: Design-system compliance review of staged changes (read-only)
---

Review `git diff --cached` files for design-system violations per
the omniflow-design-system skill's banned-patterns table.

Grep the staged diff for:
- `bg-white`, `bg-gray-`, `bg-slate-`, `text-gray-`, `text-slate-`
- `dark:` prefix
- `shadow-(sm|md|lg|xl)`
- `border-[1-9]` (non-0.5px borders)
- `rounded-(md|lg|xl|2xl)` ad-hoc
- hex color literals `#[0-9a-fA-F]{3,6}`
- emojis in JSX

For each hit, report:
- File:line
- The offending string
- The correct token replacement

Do NOT edit files. This is read-only.
End with pass/fail summary.