import { describe, it, expect } from 'vitest';

/**
 * The page-header title and icon are chosen by a run of `path.includes(...)` checks, and the
 * first match wins. So a generic pattern placed above a more specific one that contains it
 * makes the specific branch unreachable — it still reads correctly, it just never runs.
 *
 * Four branches were dead this way. `/dashboard/crm/analytics` contains `/analytics`, so the
 * CRM analytics page showed the title and icon of the unrelated analytics hub; `/flows/
 * experiments` was shadowed by `/flows` the same way. Nothing errors, nothing logs, and the
 * page simply presents as a different page.
 *
 * Read through import.meta.glob rather than node:fs, as no-hardcoded-origins.test.ts does,
 * because this project ships no node types.
 */

const LAYOUT = Object.values(
  import.meta.glob('/src/app/layouts/DashboardLayout.tsx', {
    query: '?raw',
    import: 'default',
    eager: true,
  }) as Record<string, string>,
)[0];

const BRANCH = /if \(path\.includes\('([^']+)'\)\) return ([^;]+);/g;

/**
 * Each resolver is one `const getPageX = () => {` block. Splitting on those rather than on
 * line numbers matters: the two resolvers repeat many of the same paths, so comparing a
 * branch in one against a branch in the other invents collisions that do not exist.
 */
function resolvers(): { name: string; patterns: string[] }[] {
  const starts = [...LAYOUT.matchAll(/const (getPage[A-Za-z]+) = \(\) => \{/g)];
  return starts.map((start, i) => {
    const from = start.index!;
    const to = i + 1 < starts.length ? starts[i + 1].index! : LAYOUT.length;
    return {
      name: start[1],
      patterns: [...LAYOUT.slice(from, to).matchAll(BRANCH)].map((m) => m[1]),
    };
  });
}

describe('no page-header branch is shadowed by an earlier, more generic one', () => {
  it('finds both resolvers and their branches', () => {
    const found = resolvers();
    expect(found.length).toBeGreaterThanOrEqual(2);
    for (const r of found) expect(r.patterns.length).toBeGreaterThan(10);
  });

  it.each(resolvers())('$name tests every specific path before the generic one', ({ patterns }) => {
    const unreachable: string[] = [];
    patterns.forEach((pattern, i) => {
      const shadow = patterns
        .slice(0, i)
        .find((earlier) => earlier !== pattern && pattern.includes(earlier));
      if (shadow) unreachable.push(`'${pattern}' can never match — '${shadow}' is tested first`);
    });
    expect(unreachable).toEqual([]);
  });
});
