import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Loader2, type LucideIcon } from 'lucide-react';
import { cn } from './cn';
import { CONTROL_SIZE, DISABLED, FOCUS_RING, RADIUS, type ControlSize } from './scale';

/**
 * The button, of which this admin previously had 219 spellings.
 *
 * Variants are named for the decision the caller is making, not for a colour,
 * because the colour is the part that differs between the two products.
 *
 *   primary    the one action this screen is for. One per view.
 *   secondary  an action beside it
 *   ghost      an action inside a dense surface — a row, a toolbar, a card header
 *   danger     deletes, voids, cancels. Reads as a warning before it is read at all.
 *
 * `loading` is a prop rather than something each caller re-invents, because
 * every hand-rolled version of it got one of two things wrong: the button
 * stayed clickable while the request was in flight, or the label changed
 * length and the row reflowed under the cursor. This disables the button and
 * keeps the label.
 */

const VARIANT = {
  primary: 'bg-brand text-text-inverted font-bold hover:bg-brand-light',
  /**
   * A brand-tinted action: the same weight of intent as `primary`, but it
   * does not want to be the loudest thing on the screen. The admin had
   * twelve of these already — `bg-brand-soft text-brand border-border-glow`
   * — so it is a variant that existed before it had a name.
   */
  soft: 'border border-border-glow bg-brand-soft text-brand font-semibold hover:bg-brand hover:text-text-inverted',
  secondary:
    'border border-border-subtle text-text-secondary font-semibold hover:border-border-medium hover:text-text-primary',
  ghost: 'text-text-muted font-semibold hover:bg-glass-1 hover:text-text-primary',
  danger: 'bg-danger-soft text-danger font-bold hover:bg-danger hover:text-text-inverted',
} as const;

export type ButtonVariant = keyof typeof VARIANT;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ControlSize;
  /** Drawn before the label, at the size the variant calls for. */
  icon?: LucideIcon;
  /** Disables the button and swaps the icon for a spinner. */
  loading?: boolean;
  /** Fills its container — for a form's submit, or a mobile sheet. */
  block?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'secondary',
    size = 'md',
    icon: Icon,
    loading = false,
    block = false,
    className,
    children,
    disabled,
    type = 'button',
    ...rest
  },
  ref,
) {
  const glyph = size === 'lg' ? 'h-4 w-4' : 'h-3.5 w-3.5';

  return (
    <button
      ref={ref}
      // Defaulting to `button` matters: a bare <button> inside a form submits
      // it, which is how several of the hand-rolled ones caused a page
      // reload on what looked like a filter toggle.
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap transition-colors',
        RADIUS.control,
        CONTROL_SIZE[size],
        VARIANT[variant],
        FOCUS_RING,
        DISABLED,
        block && 'w-full',
        className,
      )}
      {...rest}
    >
      {loading ? (
        <Loader2 className={cn(glyph, 'shrink-0 animate-spin')} strokeWidth={2} aria-hidden />
      ) : (
        Icon && <Icon className={cn(glyph, 'shrink-0')} strokeWidth={1.8} aria-hidden />
      )}
      {children}
    </button>
  );
});
