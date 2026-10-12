/**
 * Join class names, dropping anything falsy.
 *
 * Deliberately not `clsx` plus `tailwind-merge`: the primitives in this folder
 * put the caller's classes last and never ship a conflicting utility of their
 * own for the properties a caller is expected to set, so there is nothing for
 * a merge pass to resolve. Two more dependencies to decide which of two
 * paddings wins would be the wrong answer to "the component should not have
 * set a padding the caller has to beat".
 */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}
