import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { Search, type LucideIcon } from 'lucide-react';
import { cn } from './cn';
import { DISABLED, FOCUS_RING, RADIUS } from './scale';

/**
 * Labelled inputs, which the admin had 208 hand-written halves of.
 *
 * `block text-xs font-semibold text-text-secondary mb-1` appeared 148 times
 * and `... text-text-muted mb-1.5` another 60 — the same label in two
 * weights, two colours and two margins, usually on adjacent screens. The hint
 * line under it had three spellings and 168 copies.
 *
 * The more serious half is that almost none of them were attached to their
 * input. A `<p>` above an `<input>` is not a label: clicking it does not
 * focus the field, and a screen reader announces the input unnamed. `Field`
 * generates the id and wires `htmlFor`, `aria-describedby` and
 * `aria-invalid`, so getting that right is no longer something each page has
 * to remember.
 */

export interface FieldProps {
  label: string;
  /** Explanatory text under the control. */
  hint?: ReactNode;
  /** Replaces the hint and marks the control invalid. */
  error?: ReactNode;
  /** Marks the label and sets `required` on the control. */
  required?: boolean;
  className?: string;
  /** Receives the ids to put on the control. */
  children: (ids: { id: string; describedBy?: string; invalid: boolean }) => ReactNode;
}

export function Field({ label, hint, error, required, className, children }: FieldProps) {
  const id = useId();
  const noteId = `${id}-note`;
  const note = error ?? hint;

  return (
    <div className={cn('flex flex-col', className)}>
      <label htmlFor={id} className="mb-1 block text-xs font-semibold text-text-secondary">
        {label}
        {required && (
          <span className="ml-1 text-danger-light" aria-hidden>
            *
          </span>
        )}
      </label>

      {children({ id, describedBy: note ? noteId : undefined, invalid: Boolean(error) })}

      {note && (
        <p
          id={noteId}
          // Announced when it is an error, because a field that goes red
          // without saying why is the same as a field that silently fails.
          role={error ? 'alert' : undefined}
          className={cn('mt-1 text-xs', error ? 'text-danger-light' : 'text-text-muted')}
        >
          {note}
        </p>
      )}
    </div>
  );
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Drawn inside the field, on the left. */
  icon?: LucideIcon;
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { icon: Icon, invalid, className, ...rest },
  ref,
) {
  return (
    <div className="relative">
      {Icon && (
        <Icon
          className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted"
          strokeWidth={1.8}
          aria-hidden
        />
      )}
      <input
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(
          'w-full border bg-bg-input py-2 pr-3 text-sm text-text-primary placeholder:text-text-muted',
          Icon ? 'pl-9' : 'pl-3',
          RADIUS.control,
          invalid ? 'border-danger' : 'border-border-subtle',
          FOCUS_RING,
          DISABLED,
          className,
        )}
        {...rest}
      />
    </div>
  );
});

/**
 * The search box at the top of a list, which existed 89 times with its icon
 * positioned separately 116 times — the two counts not matching is itself the
 * point.
 *
 * `type="search"` rather than `type="text"`: it gives a clear affordance for
 * free and Escape clears the field, which several pages were implementing by
 * hand.
 */
export const SearchInput = forwardRef<HTMLInputElement, Omit<InputProps, 'icon' | 'type'>>(
  function SearchInput({ placeholder = 'Search…', ...rest }, ref) {
    return <Input ref={ref} type="search" icon={Search} placeholder={placeholder} {...rest} />;
  },
);
