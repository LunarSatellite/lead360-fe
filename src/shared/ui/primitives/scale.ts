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

/**
 * Control sizes, split into padding and type.
 *
 * Split because an icon-only control needs square padding with the same type
 * and gap, and overriding `px-4` from a caller's `className` does not work:
 * Tailwind orders `p-*` before `px-*` in its stylesheet, so the longhand
 * wins however the class string is written. The component has to not emit
 * the padding it does not want, rather than emit it and hope.
 */
/**
 * An explicit height, not a vertical padding.
 *
 * With `py-*`, a control's height is whatever its contents happen to measure:
 * a text button's line box is 16px and an icon is 14px, so an icon-only
 * button came out 4px shorter than the text button beside it in the same
 * toolbar — measured at 32px against 36px. Padding cannot fix that, because
 * the difference is in the content.
 *
 * Fixing the height instead makes every control at a given size exactly the
 * same height whatever is inside it, which is the only version of this that
 * actually lines up. `items-center` on the base does the centring.
 */
export const CONTROL_PADDING = {
  sm: 'h-8 px-3',
  md: 'h-9 px-4',
  lg: 'h-11 px-5',
} as const;

/** Square, for a control whose whole content is one icon. */
export const CONTROL_PADDING_SQUARE = {
  sm: 'h-8 w-8',
  md: 'h-9 w-9',
  lg: 'h-11 w-11',
} as const;

export const CONTROL_TYPE = {
  sm: 'text-[11px] gap-1',
  md: 'text-xs gap-1.5',
  lg: 'text-sm gap-2',
} as const;

export type ControlSize = keyof typeof CONTROL_PADDING;

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
