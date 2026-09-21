import { useSyncExternalStore } from 'react';
import { AlertTriangle, X } from 'lucide-react';

/**
 * Promise-based confirmation dialog — a styled replacement for the native window.confirm().
 *
 *   confirmDialog({ message: 'Delete this quote?', danger: true }).then(ok => { if (ok) ... });
 *   // or: if (await confirmDialog({ ... })) { ... }
 *
 * Mount <ConfirmHost /> once at the app root. No provider/context wiring needed at call sites.
 */
export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

interface ConfirmState {
  open: boolean;
  opts: ConfirmOptions;
  resolve?: (value: boolean) => void;
}

let state: ConfirmState = { open: false, opts: { message: '' } };
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
function getSnapshot() {
  return state;
}

export function confirmDialog(opts: ConfirmOptions): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    state = { open: true, opts, resolve };
    emit();
  });
}

function settle(value: boolean) {
  state.resolve?.(value);
  state = { open: false, opts: { message: '' } };
  emit();
}

export function ConfirmHost() {
  const s = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  if (!s.open) return null;

  const { title, message, confirmText, cancelText, danger } = s.opts;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
      onClick={() => settle(false)}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-sm bg-bg-elevated border-thin border-border-subtle rounded-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 p-5">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-sm ${
              danger ? 'bg-danger-soft' : 'bg-glass-2'
            }`}
          >
            <AlertTriangle
              size={18}
              strokeWidth={1.8}
              className={danger ? 'text-danger' : 'text-warning'}
            />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-bold text-text-primary">{title ?? 'Are you sure?'}</h2>
            <p className="mt-1 text-sm text-text-secondary leading-relaxed">{message}</p>
          </div>
          <button
            onClick={() => settle(false)}
            className="text-text-muted hover:text-text-primary"
            aria-label="Cancel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex justify-end gap-2 border-t border-thin border-border-subtle px-5 py-3">
          <button
            onClick={() => settle(false)}
            className="rounded-sm border-thin border-border-medium px-3.5 py-1.5 text-xs font-semibold text-text-secondary hover:bg-glass-2 hover:text-text-primary transition-colors"
          >
            {cancelText ?? 'Cancel'}
          </button>
          <button
            onClick={() => settle(true)}
            className={`rounded-sm px-3.5 py-1.5 text-xs font-bold text-bg transition-colors ${
              danger ? 'bg-danger hover:opacity-90' : 'bg-brand hover:bg-brand-light'
            }`}
          >
            {confirmText ?? 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
