#!/usr/bin/env node
/**
 * Cross-check the API paths this console calls against the routes the backend declares.
 *
 * A call to a path nothing serves is a silent 404. The page still renders, the list is
 * empty or the save reports a generic error, and it looks exactly like a feature nobody
 * finished — which is the failure mode this whole console has been audited for.
 *
 * Not a vitest suite, because it needs the backend checkout, which CI for this repo does
 * not have. Run it by hand after touching an api.ts or a controller:
 *
 *     node scripts/check-api-contract.mjs ../lead360
 *
 * Two things this got wrong on the first pass, both worth keeping in mind if you extend it:
 *
 *   - One .cs file often holds SEVERAL controller classes, each with its own [Route]. Taking
 *     the first [Route] in a file and applying it to every endpoint in that file produced
 *     nonsense. Split on class declarations first.
 *   - The [Route] usually sits inside a combined attribute list — `[ApiController,
 *     ApiVersion("1.0"), Route("...")]` — so a regex anchored on `[Route("...")]` alone
 *     misses most controllers and silently reports everything as fine.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, basename } from 'node:path';

const backend = process.argv[2];
if (!backend) {
  console.error('usage: node scripts/check-api-contract.mjs <path-to-lead360-backend>');
  process.exit(2);
}

function walk(dir, test, out = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.git' || entry === '.claude') continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, test, out);
    else if (test(entry)) out.push(full);
  }
  return out;
}

/** The client's base URL supplies `/api`, and only v1 is deployed. */
const canon = (p) =>
  p
    .replace('v{version:apiVersion}', 'v1')
    .replace(/\/\//g, '/')
    .replace(/^\/|\/$/g, '')
    .toLowerCase()
    .replace(/^api\//, '')
    .replace(/\{[^}]*\}/g, '{*}');

function backendRoutes() {
  const routes = new Set();
  for (const file of walk(join(backend, 'src'), (f) => f.endsWith('.cs') && f.includes('Controller'))) {
    const source = readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
    const marks = [...source.matchAll(/^\s*(?:public |internal |sealed |abstract )*class\s+\w+/gm)].map(
      (m) => m.index,
    );
    marks.forEach((start, i) => {
      const end = marks[i + 1] ?? source.length;
      const head = source.slice(i > 0 ? marks[i - 1] : 0, start);
      const body = source.slice(start, end);
      const base = head.match(/\bRoute\("([^"]*)"\)/);
      if (!base) return;
      for (const m of body.matchAll(/\bHttp(Get|Post|Put|Patch|Delete)(?:\("([^"]*)"\))?/g)) {
        routes.add(`${m[1].toUpperCase()} ${canon(base[1] + (m[2] ? `/${m[2]}` : ''))}`);
      }
    });
  }
  return routes;
}

function frontendCalls() {
  const calls = [];
  for (const file of walk('src', (f) => f.endsWith('.ts') || f.endsWith('.tsx'))) {
    const source = readFileSync(file, 'utf8');
    const consts = [...source.matchAll(/const (\w+) = '([^']+)';/g)];
    for (const m of source.matchAll(/apiClient\.(get|post|put|patch|delete)(?:<[^>]*>)?\(\s*`([^`]+)`/g)) {
      let path = m[2];
      for (const [, name, value] of consts) path = path.split('${' + name + '}').join(value);
      // an unresolved ${...} is a path segment this script cannot see through
      const unresolved = path.includes('${') && !/\$\{[^}]*\}/.test(path.replace(/\$\{[^}]*\}/g, ''));
      path = path.replace(/\$\{[^}]*\}/g, '{*}').split('?')[0];
      calls.push({ verb: m[1].toUpperCase(), path: canon(path), file: basename(file), unresolved });
    }
  }
  return calls;
}

const routes = backendRoutes();
const calls = frontendCalls();
const missing = new Map();
for (const c of calls) {
  const key = `${c.verb} ${c.path}`;
  if (routes.has(key)) continue;
  // A path that still holds a wildcard where a CONSTANT should be is this script's blind
  // spot, not a defect: report it separately rather than as a broken call.
  const blind = c.path.startsWith('{*}');
  if (!missing.has(key)) missing.set(key, { files: new Set(), blind });
  missing.get(key).files.add(c.file);
}

const real = [...missing].filter(([, v]) => !v.blind);
const blind = [...missing].filter(([, v]) => v.blind);

console.log(`backend routes: ${routes.size}   frontend calls: ${calls.length}`);
console.log(`\ncalls with no matching route: ${real.length}`);
for (const [key, { files }] of real.sort()) console.log(`  ${key}   <- ${[...files].sort().join(', ')}`);
if (blind.length) {
  console.log(`\nunresolved base constant, not checked: ${blind.length}`);
  for (const [key, { files }] of blind.sort()) console.log(`  ${key}   <- ${[...files].sort().join(', ')}`);
}
process.exit(real.length ? 1 : 0);
