/**
 * The geometry scale: the part of the design system that was missing.
 *
 * The colour layer in this project is already good — every Tailwind colour
 * resolves through a CSS custom property, so one set of class names paints
 * both products. Nothing equivalent existed for size, spacing, radius or
 * weight, so each of 174 pages chose its own. Measured on the branch before
 * this file existed, the admin contained 219 distinct spellings of "a
 * brand-coloured button": 22 padding combinations, 11 corner radii and 8 text
 * sizes. That is the whole reason the admin looks unfinished. Nothing is
 * wrong on any one screen; no two screens agree.
 *
 * These are the values that won by use, not new ones:
 *
 *   padding   px-4 py-2   appeared 126 times, more than twice the runner-up
 *   radius    rounded-xl  appeared 231 times
 *   size      text-xs     appeared 287 times
 *
 * So the scale is mostly a matter of writing down what the admin already did
 * most often, and then only having one of it. A page that needs something
 * genuinely different passes `className`; a page that just needs a button
 * should not be making this decision at all.
 */

/** Control heights. `md` is the default; `sm` is for toolbars and table rows. */
export const CONTROL_SIZE = {
  sm: 'px-3 py-1.5 text-[11px] gap-1',
  md: 'px-4 py-2 text-xs gap-1.5',
  lg: 'px-5 py-2.5 text-sm gap-2',
} as const;

export type ControlSize = keyof typeof CONTROL_SIZE;

/**
 * One radius for controls, one for surfaces.
 *
 * `rounded-xl` and `rounded-card` were already the two most-used, and the
 * other nine were drift rather than intent — a 12px button beside a 6px
 * button is the kind of thing nobody reports and everybody sees.
 */
export const RADIUS = {
  control: 'rounded-xl',
  surface: 'rounded-card',
  pill: 'rounded-full',
} as const;

/**
 * Focus. Previously absent almost everywhere: most hand-rolled buttons set
 * `focus:outline-none` and nothing in its place, so keyboard users had no
 * cursor at all. Every primitive here carries this.
 */
export const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg';

/** A disabled control must look disabled and stop taking clicks. */
export const DISABLED = 'disabled:opacity-50 disabled:pointer-events-none';
