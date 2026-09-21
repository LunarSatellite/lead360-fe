/**
 * The one Node API `theme-tokens.test.ts` needs, and nothing else.
 *
 * That suite has to read `globals.css` as text. The usual route in this repo —
 * `import.meta.glob(..., { query: '?raw' })`, as `no-hardcoded-origins.test.ts`
 * uses — returns an empty string for a `.css` file, because the Vitest config
 * sets `css: false` and stubs every CSS import. An empty file would make the
 * whole suite pass while asserting nothing, which is worse than no test.
 *
 * So it reads the file directly. The project has no `@types/node`, and pulling
 * one in for a single call would add a dependency to satisfy a type-checker.
 * This declares the exact signature used instead: narrow on purpose, so it
 * cannot quietly become a stand-in for the real Node types.
 */
declare module 'node:fs' {
  export function readFileSync(path: string, encoding: 'utf8'): string;
}

/**
 * Supplied by vite-node when it runs a test file. `import.meta.url` is not a
 * `file:` URL under vite-node, so this is the only handle on the test's own
 * directory. Test-time only: nothing shipped to the browser may read it.
 */
declare const __dirname: string;
