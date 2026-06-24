import type { ReactNode } from 'react';

type BadgeVariant = 'success' | 'brand' | 'info' | 'warning' | 'danger' | 'muted';

const variantStyles: Record<BadgeVariant, string> = {
  success: 'bg-success-soft text-success',
  brand: 'bg-brand-soft text-brand',
  info: 'bg-info-soft text-info',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  muted: 'bg-glass-2 text-text-muted',
};

interface StatusBadgeProps {
  variant: BadgeVariant;
  children: ReactNode;
  dot?: boolean;
}

export function StatusBadge({ variant, children, dot }: StatusBadgeProps) {
  return (
    <span className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold tracking-wide ${variantStyles[variant]}`}>
      {dot && (
        <span className={`w-2.5 h-2.5 rounded-full ${
          variant === 'success' ? 'bg-success' :
          variant === 'brand' ? 'bg-brand' :
          variant === 'info' ? 'bg-info' :
          variant === 'warning' ? 'bg-warning' :
          variant === 'danger' ? 'bg-danger' : 'bg-text-muted'
        }`} />
      )}
      {children}
    </span>
  );
}
