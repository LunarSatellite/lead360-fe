import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from './cn';
import { RADIUS } from './scale';

/**
 * The surfaces a page is built from: a card, a page header, a badge, an
 * empty state.
 *
 * Each of these existed as a repeated class string rather than a component —
 * `text-xl font-extrabold text-text-primary tracking-tight` 50 times for a
 * page title, `text-[10px] font-bold text-brand uppercase tracking-widest` 53
 * times for the eyebrow above it — so the same furniture was a slightly
 * different size on every screen.
 */

export function Card({
  className,
  children,
  ...rest
}: { className?: string; children: ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('border border-border-subtle bg-bg-card', RADIUS.surface, className)} {...rest}>
      {children}
    </div>
  );
}

export interface PageHeaderProps {
  /** The small brand-coloured line above the title. */
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  /** Buttons, right-aligned, wrapping under the title on a narrow screen. */
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ eyebrow, title, description, actions, className }: PageHeaderProps) {
  return (
    <header className={cn('flex flex-wrap items-start justify-between gap-3', className)}>
      <div className="min-w-0">
        {eyebrow && <p className="text-[10px] font-bold uppercase tracking-widest text-brand">{eyebrow}</p>}
        {/* h1, because every one of these was a styled div and a page with no
            heading cannot be navigated by one. */}
        <h1 className="text-xl font-extrabold tracking-tight text-text-primary">{title}</h1>
        {description && <p className="mt-1 text-xs text-text-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

const TONE = {
  neutral: 'bg-glass-1 text-text-secondary',
  brand: 'bg-brand-soft text-brand',
  success: 'bg-success-soft text-success-light',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
} as const;

export function Badge({
  tone = 'neutral',
  children,
  className,
}: {
  tone?: keyof typeof TONE;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 text-[10px] font-bold',
        RADIUS.pill,
        TONE[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/**
 * What a list shows when it has nothing.
 *
 * Worth a primitive because the alternative is not an inconsistent empty
 * state, it is no empty state: a surface that renders as blank space, which
 * reads as a page that failed rather than a list that is empty.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center px-6 py-12 text-center', className)}>
      {Icon && <Icon className="mb-3 h-6 w-6 text-text-muted" strokeWidth={1.5} aria-hidden />}
      <p className="text-sm font-bold text-text-primary">{title}</p>
      {description && <p className="mt-1 max-w-sm text-xs text-text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
