import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  /** Optional custom fallback. Receives the error + a reset callback. */
  fallback?: (error: Error, reset: () => void) => ReactNode;
  /** Label for the boundary (helps identify which section failed). */
  label?: string;
}

interface State {
  error: Error | null;
}

/**
 * Catches render-time exceptions so one broken component never unmounts the whole app.
 * Wrap the root once, and wrap each major panel/section so a single widget failure stays
 * contained. Pair with TanStack Query's QueryErrorResetBoundary for retryable data errors.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error(`[ErrorBoundary${this.props.label ? `:${this.props.label}` : ''}]`, error, info);
  }

  reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    if (this.props.fallback) return this.props.fallback(error, this.reset);

    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-card border-thin border-border-subtle bg-glass-1 p-8 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-glass-2">
          <AlertTriangle size={18} strokeWidth={1.6} className="text-warning" />
        </div>
        <div className="flex flex-col gap-0.5">
          <p className="text-sm font-700 text-text-primary">Something broke here</p>
          <p className="max-w-md text-xs text-text-muted">
            {this.props.label ? `The "${this.props.label}" section ` : 'This section '}
            hit an error and was contained. The rest of the app is fine.
          </p>
        </div>
        <button
          onClick={this.reset}
          className="flex items-center gap-1.5 rounded-sm border-thin border-border-medium px-3 py-1.5 text-xs font-600 text-text-secondary hover:bg-glass-2 hover:text-text-primary"
        >
          <RotateCw size={13} strokeWidth={1.6} />
          Try again
        </button>
      </div>
    );
  }
}
