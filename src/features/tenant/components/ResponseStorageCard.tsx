import { useState, useEffect } from 'react';
import { Database, Loader2 } from 'lucide-react';
import { useResponseStorage, useSetResponseStorage } from '../api/settings.queries';
import { UserRole } from '@/features/auth/types/auth.types';
import { useAuth } from '@/shared/hooks/useAuth';

/* ─── Enable confirm dialog ─────────────────────────────────────── */

function EnableConfirmDialog({
  onClose,
  onConfirm,
  isPending,
}: {
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={!isPending ? onClose : undefined} />
      <div
        className="relative w-full max-w-sm mx-4"
        style={{
          background: '#0A0F0D',
          border: '1px solid #253D32',
          borderRadius: 18,
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        <div className="px-6 py-5">
          <h2 className="text-sm font-bold text-text-primary mb-2">Enable response-body storage?</h2>
          <p className="text-xs text-text-secondary leading-relaxed">
            OmniFlow will save the full JSON of every API response to the database. This can increase storage usage
            and may capture sensitive data. Only enable it if you need to audit or replay API responses.
          </p>
        </div>
        <div className="px-6 pb-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2 rounded-[10px] border border-border-subtle text-xs font-medium text-text-secondary hover:border-glass-3 hover:text-text-primary transition-all disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-[10px] text-xs font-semibold bg-brand text-bg hover:bg-brand-light disabled:opacity-40 transition-all"
          >
            {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Enable storage
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Toggle switch ─────────────────────────────────────────────── */

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40
        ${disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}
        ${checked ? 'bg-brand' : 'bg-glass-3 border border-border-medium'}`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 rounded-full bg-bg shadow-sm transition-transform duration-200
          ${checked ? 'translate-x-[18px]' : 'translate-x-[3px]'}`}
      />
    </button>
  );
}

/* ─── Main card ─────────────────────────────────────────────────── */

export function ResponseStorageCard() {
  const { data, isPending: loading } = useResponseStorage();
  const save = useSetResponseStorage();
  const { hasRole } = useAuth();

  const [localEnabled, setLocalEnabled] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const canEdit = hasRole(UserRole.Owner) || hasRole(UserRole.Admin);

  // Sync local state when data loads or changes externally
  useEffect(() => {
    if (data !== undefined) setLocalEnabled(data.enabled);
  }, [data]);

  const handleToggle = (next: boolean) => {
    if (!canEdit) return;
    if (next) {
      // off → on: show confirm dialog, don't touch localEnabled yet
      setConfirmOpen(true);
    } else {
      // on → off: optimistic flip, fire immediately, revert on error
      setLocalEnabled(false);
      save.mutate(
        { enabled: false },
        {
          onError: () => setLocalEnabled(true),
        },
      );
    }
  };

  const handleConfirmEnable = () => {
    setLocalEnabled(true);
    save.mutate(
      { enabled: true },
      {
        onSuccess: () => setConfirmOpen(false),
        onError: () => {
          setLocalEnabled(false);
          setConfirmOpen(false);
        },
      },
    );
  };

  const handleCancelEnable = () => {
    setConfirmOpen(false);
    // localEnabled stays false — toggle was never visually flipped
  };

  if (loading) {
    return (
      <div className="rounded-[14px] border border-border-medium bg-bg-shell p-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[10px] bg-glass-1 animate-pulse" />
          <div className="space-y-1.5 flex-1">
            <div className="h-3 w-40 bg-glass-1 rounded animate-pulse" />
            <div className="h-2.5 w-52 bg-glass-1 rounded animate-pulse" />
          </div>
          <div className="w-9 h-5 rounded-full bg-glass-1 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-[14px] border border-border-medium bg-bg-shell p-5 transition-colors hover:border-glass-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-[10px] bg-[rgba(0,217,126,0.06)] border border-border-subtle flex items-center justify-center shrink-0 mt-0.5">
            <Database className="w-4 h-4 text-brand" strokeWidth={1.5} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-text-primary leading-tight">Response-body storage</div>
            <p className="text-xs text-text-muted leading-relaxed mt-1 max-w-sm">
              Save the full JSON body of every API response for auditing and replay.
              May capture sensitive data — enable only when needed.
            </p>
            {!canEdit && (
              <p className="text-[10px] text-text-muted mt-1.5">
                Only owners and admins can change this setting.
              </p>
            )}
          </div>

          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <Toggle
              checked={localEnabled}
              onChange={handleToggle}
              disabled={!canEdit || save.isPending}
            />
            {save.isPending && (
              <Loader2 className="w-3 h-3 text-text-muted animate-spin" strokeWidth={1.8} />
            )}
            {save.isError && !save.isPending && (
              <span className="text-[10px] text-[#F43F5E]">Failed to save</span>
            )}
          </div>
        </div>
      </div>

      {confirmOpen && (
        <EnableConfirmDialog
          onClose={handleCancelEnable}
          onConfirm={handleConfirmEnable}
          isPending={save.isPending}
        />
      )}
    </>
  );
}
