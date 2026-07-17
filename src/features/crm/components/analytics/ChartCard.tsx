import type { ReactNode } from 'react';
import { Loader2, AlertCircle, Inbox } from 'lucide-react';

interface ChartCardProps {
  /** Small uppercase label above the widget body. */
  title: string;
  /** Optional secondary line under the title. */
  subtitle?: string;
  /** Right-aligned actions slot (filters, links). */
  actions?: ReactNode;
  /** Small viz-type pill shown top-right (e.g. "BAR", "DONUT", "LINE"). */
  badge?: string;
  isLoading?: boolean;
  isError?: boolean;
  error?: { message?: string } | null;
  isEmpty?: boolean;
  emptyMessage?: string;
  onRetry?: () => void;
  className?: string;
  /** Pixel height of the state region so loading/empty don't collapse. */
  minBodyHeight?: number;
  children: ReactNode;
}

/**
 * Widget frame + all four states (loading / error / empty / content). The card
 * is intentionally domain-blind — glue widgets pass already-resolved states.
 */
export function ChartCard({
  title,
  subtitle,
  actions,
  badge,
  isLoading,
  isError,
  error,
  isEmpty,
  emptyMessage = 'No data yet.',
  onRetry,
  className = '',
  minBodyHeight = 180,
  children,
}: ChartCardProps) {
  return (
    <div
      className={`bg-glass-1 border-thin border-border-subtle rounded-card p-3.5 transition-all hover:border-border-medium ${className}`}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-sm font-semibold text-text-secondary">{title}</h3>
          {subtitle && <p className="text-2xs text-text-muted">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {actions}
          {badge && (
            <span className="px-1.5 py-0.5 rounded-xs bg-glass-2 border-thin border-border-subtle text-[10px] font-bold uppercase tracking-wider text-text-muted">
              {badge}
            </span>
          )}
        </div>
      </div>

      <StateRegion
        isLoading={isLoading}
        isError={isError}
        error={error}
        isEmpty={isEmpty}
        emptyMessage={emptyMessage}
        onRetry={onRetry}
        minBodyHeight={minBodyHeight}
      >
        {children}
      </StateRegion>
    </div>
  );
}

function StateRegion({
  isLoading,
  isError,
  error,
  isEmpty,
  emptyMessage,
  onRetry,
  minBodyHeight,
  children,
}: Pick<
  ChartCardProps,
  'isLoading' | 'isError' | 'error' | 'isEmpty' | 'emptyMessage' | 'onRetry' | 'minBodyHeight' | 'children'
>) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center text-text-muted" style={{ minHeight: minBodyHeight }}>
        <Loader2 className="w-5 h-5 animate-spin" strokeWidth={1.6} />
      </div>
    );
  }

  if (isError) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-2 text-center"
        style={{ minHeight: minBodyHeight }}
      >
        <AlertCircle className="w-5 h-5 text-danger" strokeWidth={1.6} />
        <p className="text-xs text-text-secondary">{error?.message || 'Failed to load.'}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-xs font-semibold text-brand hover:text-brand-light transition-colors"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-2 text-center"
        style={{ minHeight: minBodyHeight }}
      >
        <Inbox className="w-5 h-5 text-text-muted" strokeWidth={1.6} />
        <p className="text-xs text-text-muted">{emptyMessage}</p>
      </div>
    );
  }

  return <>{children}</>;
}
