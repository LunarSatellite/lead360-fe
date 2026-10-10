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
      for (const m of body.matchAll(/\bHttp(Get|Post|Put|Patch|Delete)(?:\("([^"]*)"\))?/g)) {
        // No class [Route]: only an action that spells out its whole route is reachable.
        if (!base && !/^(v\{version|api\/)/.test(m[2] ?? '')) continue;
        const template = base ? base[1] + (m[2] ? `/${m[2]}` : '') : m[2];
        routes.add(`${m[1].toUpperCase()} ${canon(template)}`);
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
    // The operator pass-through: `stylemintOperationsApi.invoke({ method: 'GET', path: ... })`
    // forwards `path` to the commerce surface as-is, so a wrong path there is the same silent
    // 404 one level further down. Only literal methods and paths are checked; the operations
    // console builds its paths at runtime and is out of reach by design.
    for (const m of source.matchAll(/stylemintOperationsApi\.invoke\(\{([\s\S]*?)\}\)/g)) {
      const method = m[1].match(/method:\s*'([A-Z]+)'/);
      const literal = m[1].match(/path:\s*((?:`[^`]*`|'[^']*')(?:\s*\+\s*(?:`[^`]*`|'[^']*'))*)/);
      if (!method || !literal) continue;
      let path = [...literal[1].matchAll(/`([^`]*)`|'([^']*)'/g)].map((p) => p[1] ?? p[2]).join('');
      for (const [, name, value] of consts) path = path.split('${' + name + '}').join(value);
      path = path.replace(/\$\{[^}]*\}/g, '{*}').split('?')[0];
      calls.push({ verb: method[1], path: canon(path), file: basename(file), unresolved: false });
    }
  }
  return calls;
}

const routes = backendRoutes();
const calls = frontendCalls();

/** Routes by verb and segment count, for matching a call whose segments may be wildcards. */
const routeIndex = new Map();
for (const route of routes) {
  const [verb, path] = route.split(' ');
  const segments = path.split('/');
  const key = `${verb} ${segments.length}`;
  if (!routeIndex.has(key)) routeIndex.set(key, []);
  routeIndex.get(key).push(segments);
}

function served(verb, path) {
  if (routes.has(`${verb} ${path}`)) return true;
  const segments = path.split('/');
  return (routeIndex.get(`${verb} ${segments.length}`) ?? []).some((route) =>
    route.every((part, i) => part === segments[i] || part === '{*}' || segments[i] === '{*}'),
  );
}

const missing = new Map();
for (const c of calls) {
  const key = `${c.verb} ${c.path}`;
  // A leading wildcard is an unresolved base constant: never let it match everything.
  if (!c.path.startsWith('{*}') && served(c.verb, c.path)) continue;
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
