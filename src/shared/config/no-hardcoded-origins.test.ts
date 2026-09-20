import { describe, expect, it } from 'vitest';

/**
 * Two hardcoded origins shipped in the production bundle.
 *
 * `CsvToolbar.tsx` held `http://localhost:50363/api`, so every CSV export and
 * template download in a deployed console pointed at whoever happened to be
 * running the API on their own laptop. `useLeadAlerts.ts` fell back to
 * `https://localhost:50362/api` for its SignalR hub. Both fail silently — the
 * request never resolves and the feature simply does nothing.
 *
 * Vite inlines these at build time, so the only permitted source of an origin
 * is `env.apiBaseUrl`, and the production build now refuses to run without
 * `VITE_API_BASE_URL`. This scans shipped source rather than one call site,
 * because the defect is a literal anyone can retype anywhere.
 *
 * Uses `import.meta.glob` rather than `node:fs` so it needs no node types.
 */
const sources = import.meta.glob('/src/**/*.{ts,tsx}', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

/** Prose about the defect is not the defect — strip comments before matching. */
function codeOnly(line: string): string {
  if (/^\s*[*/]/.test(line)) return '';
  return line.replace(/\/\/.*$/, '').replace(/\/\*.*?\*\//g, '');
}

const ORIGIN = /https?:\/\/(localhost|127\.0\.0\.1|\d+\.\d+\.\d+\.\d+)(:\d+)?/;

describe('no hardcoded API origins in shipped source', () => {
  it('never points at localhost or a raw IP', () => {
    const offenders: string[] = [];

    for (const [path, text] of Object.entries(sources)) {
      // env.ts is where the build-time variable is read. Nothing else may.
      // Tests are not shipped, so a fixture URL in one is not a defect.
      if (path.endsWith('/src/shared/config/env.ts')) continue;
      if (/\.test\.(ts|tsx)$/.test(path)) continue;

      text.split('\n').forEach((line, i) => {
        if (ORIGIN.test(codeOnly(line))) {
          offenders.push(`${path}:${i + 1} -> ${line.trim().slice(0, 90)}`);
        }
      });
    }

    expect(offenders, `use env.apiBaseUrl instead:\n${offenders.join('\n')}`).toEqual([]);
  });

  it('is not vacuous — it sees the source tree', () => {
    expect(Object.keys(sources).length).toBeGreaterThan(100);
  });
});
