import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Makes a list page URL-driven: filter state lives in the query string, so a
 * drill-down link (or a refresh, or a shared URL) arrives pre-filtered and is
 * fully deep-linkable.
 *
 * Pass `defaults` keyed by the same names the drill builders emit (stage,
 * minScore, sourceKind, status, …). The value's type in `defaults` decides how
 * the raw URL string is coerced back (number vs string).
 *
 *   const [filters, setFilters, reset] = useUrlFilters({ stage: 0, minScore: 0, search: '' });
 *   setFilters({ stage: LeadStage.Hot });   // patches the URL (replace, no history spam)
 */
export function useUrlFilters<T extends Record<string, string | number>>(
  defaults: T,
): [T, (patch: Partial<T>) => void, () => void] {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo(() => {
    const out = { ...defaults };
    for (const key of Object.keys(defaults) as (keyof T)[]) {
      const raw = searchParams.get(key as string);
      if (raw !== null) {
        out[key] = (typeof defaults[key] === 'number' ? Number(raw) : raw) as T[keyof T];
      }
    }
    return out;
    // defaults is a stable literal owned by the caller; re-run only on URL change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const setFilters = useCallback(
    (patch: Partial<T>) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [k, v] of Object.entries(patch)) {
            if (v === undefined || v === null || v === '') next.delete(k);
            else next.set(k, String(v));
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const reset = useCallback(() => {
    setSearchParams(new URLSearchParams(), { replace: true });
  }, [setSearchParams]);

  return [filters, setFilters, reset];
}
