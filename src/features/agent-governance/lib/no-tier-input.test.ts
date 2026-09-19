import { describe, expect, it } from 'vitest';

/**
 * A standing guard over the whole feature, not one component.
 *
 * The risk tier is derived server-side and a caller-supplied one is refused
 * outright (`governance.risk_tier_caller_supplied`). A tier selector anywhere
 * in this feature would misrepresent where that decision is made, so this test
 * reads the feature's own source and fails if one ever appears — including in a
 * file written long after this one.
 */
/** Every source file in the feature, read through Vite so no Node types are needed. */
const sources = import.meta.glob('../**/*.{ts,tsx}', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

/** Comments explain the rules; only real code may break them. */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
}

const files = Object.entries(sources)
  .filter(([path]) => !/\.test\.tsx?$/.test(path))
  .map(([path, text]) => ({ path, text, code: stripComments(text) }));

describe('the feature source itself', () => {
  it('has files to check', () => {
    expect(files.length).toBeGreaterThan(8);
  });

  it('never renders a form control bound to a risk tier', () => {
    const offenders = files.filter(({ code }) =>
      /<(input|select|textarea)[^>]*(riskTier|risk-tier|tier)/i.test(code),
    );
    expect(offenders.map((file) => file.path)).toEqual([]);
  });

  it('never lets a risk tier near a request: the API layer does not mention one', () => {
    const offenders = files.filter(
      ({ code, path }) => path.includes('api') && /riskTier/.test(code),
    );
    expect(offenders.map((file) => file.path)).toEqual([]);
  });

  it('only ever reads a tier off the server’s own record', () => {
    // Every `riskTier` in the feature is either a type declaration, a fixture,
    // or a read of `action.riskTier` — never an assignment from user input.
    const offenders = files.filter(({ code, path }) =>
      /riskTier\s*=\s*(?!\{)/.test(code) && !path.includes('__fixtures__'),
    );
    expect(offenders.map((file) => file.path)).toEqual([]);
  });

  it('never posts a decision without a human handler behind it', () => {
    // No effect or timer may call approve/execute: a decision is a click, always.
    const offenders = files.filter(({ code }) =>
      /(useEffect|setTimeout|setInterval)\([^)]*\b(approve|execute)\b/s.test(code),
    );
    expect(offenders.map((file) => file.path)).toEqual([]);
  });

  it('offers no bulk decision control', () => {
    const offenders = files.filter(({ code }) =>
      /(approveAll|approveSelected|bulkApprove|selectAll)/i.test(code),
    );
    expect(offenders.map((file) => file.path)).toEqual([]);
  });

  it('pre-ticks no checkbox', () => {
    const offenders = files.filter(({ code }) =>
      /type="checkbox"[^>]*(defaultChecked|checked=\{true\})/s.test(code),
    );
    expect(offenders.map((file) => file.path)).toEqual([]);
  });

  it('computes no score, confidence or recommendation of its own', () => {
    const offenders = files.filter(({ code }) =>
      /(riskScore|confidence|recommendation|recommendedAction|suggestedDecision)/i.test(code),
    );
    expect(offenders.map((file) => file.path)).toEqual([]);
  });

  it('adds no developer bypass', () => {
    const offenders = files.filter(({ code }) =>
      /(skipApproval|bypassGovernance|forceApprove|import\.meta\.env\.DEV)/i.test(code),
    );
    expect(offenders.map((file) => file.path)).toEqual([]);
  });
});
