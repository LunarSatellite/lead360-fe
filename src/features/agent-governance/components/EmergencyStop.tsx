import { useState } from 'react';
import { OctagonX, ShieldOff, X } from 'lucide-react';
import { StatusBadge } from '@/shared/components';
import { GovernanceRefusalNotice } from './GovernanceRefusalNotice';
import {
  EMPTY_HALT_FORM,
  ENGAGE_ROLES,
  blastRadius,
  haltFormBlocker,
  requiresScopeKey,
  SCOPE_CHOICES,
  type HaltAuthority,
  type HaltFormState,
} from '../lib/halt-authority';
import {
  HALT_SCOPE_LABEL,
  HaltScope,
  type AgentHaltView,
  type HaltScopeValue,
} from '../types/governance.types';

const formatUtc = (value: string | null) =>
  value ? new Date(value).toLocaleString(undefined, { timeZoneName: 'short' }) : '—';

/** The authority asymmetry, stated wherever the stop is. */
export function HaltAuthorityNote({ authority }: { authority: HaltAuthority }) {
  return (
    <p className="text-[11px] font-semibold leading-relaxed text-text-muted">
      Engaging is open to <span className="text-text-secondary">{ENGAGE_ROLES.join(', ')}</span> —
      a stop only one unavailable person can pull is not a stop. Clearing is{' '}
      <span className="text-text-secondary">SuperAdmin</span> alone.
      {authority.unknown &&
        ' Your admin roles are not exposed to this console, so clearing is not offered here and the server checks every attempt itself.'}
    </p>
  );
}

export function HaltRow({
  halt,
  canClear,
  onClear,
}: {
  halt: AgentHaltView;
  canClear: boolean;
  onClear: (halt: AgentHaltView) => void;
}) {
  const radius = blastRadius(halt.scope, halt.scopeKey);
  return (
    <li
      data-testid="halt-row"
      data-engaged={halt.isEngaged}
      className={`flex flex-col gap-2 rounded-card border-thin p-3.5 ${
        halt.isEngaged ? 'border-danger/40 bg-danger-soft' : 'border-border-subtle bg-glass-1'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <StatusBadge variant={halt.isEngaged ? 'danger' : 'muted'} dot>
            {halt.isEngaged ? 'Engaged' : 'Cleared'}
          </StatusBadge>
          <span className="text-sm font-extrabold text-text-primary">{radius.label}</span>
          {halt.scope !== HaltScope.Global && (
            <code className="font-mono text-xs text-text-secondary">{halt.scopeKey}</code>
          )}
        </div>
        {halt.isEngaged && canClear && (
          <button
            type="button"
            data-testid="halt-clear"
            onClick={() => onClear(halt)}
            className="rounded-sm border-thin border-border-medium px-3 py-1.5 text-xs font-bold text-text-secondary hover:bg-glass-2 hover:text-text-primary"
          >
            Clear this stop
          </button>
        )}
      </div>

      <p className="text-xs font-medium text-text-secondary">{halt.reason}</p>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] font-semibold text-text-muted md:grid-cols-4">
        <div>
          <dt className="uppercase tracking-wide">Engaged by</dt>
          <dd className="font-mono text-text-secondary">{halt.engagedByAccountId}</dd>
        </div>
        <div>
          <dt className="uppercase tracking-wide">Engaged</dt>
          <dd className="text-text-secondary">{formatUtc(halt.engagedUtc)}</dd>
        </div>
        <div>
          <dt className="uppercase tracking-wide">Approvals voided</dt>
          <dd className="text-text-secondary">{halt.voidedApprovalCount}</dd>
        </div>
        {!halt.isEngaged && (
          <div>
            <dt className="uppercase tracking-wide">Cleared by</dt>
            <dd className="font-mono text-text-secondary">
              {halt.clearedByAccountId ?? '—'} · {formatUtc(halt.clearedUtc)}
            </dd>
          </div>
        )}
      </dl>
      {!halt.isEngaged && halt.clearedReason && (
        <p className="text-[11px] font-medium text-text-muted">Cleared: {halt.clearedReason}</p>
      )}
    </li>
  );
}

/**
 * Engaging the stop.
 *
 * Three rules the dialog keeps: no scope is preselected — least of all the
 * global one; the blast radius for whichever scope is chosen is spelled out
 * above the confirm button, including what keeps working; and the
 * acknowledgement starts unticked and is never remembered between openings.
 */
export function EngageHaltDialog({
  pending,
  error,
  onCancel,
  onConfirm,
}: {
  pending: boolean;
  error: unknown;
  onCancel: () => void;
  onConfirm: (values: { scope: HaltScopeValue; scopeKey: string | null; reason: string }) => void;
}) {
  const [form, setForm] = useState<HaltFormState>(EMPTY_HALT_FORM);
  const blocker = haltFormBlocker(form);
  const radius = form.scope !== null ? blastRadius(form.scope, form.scopeKey) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Engage the emergency stop"
        data-testid="engage-halt-dialog"
        className="flex max-h-[90vh] w-full max-w-2xl flex-col gap-3 overflow-auto rounded-frame border-thin border-danger/40 bg-bg-elevated p-4"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="flex items-center gap-2 text-lg font-black text-danger">
            <OctagonX size={18} strokeWidth={1.6} />
            Engage the emergency stop
          </h2>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cancel"
            className="h-9 w-9 rounded-sm text-text-secondary hover:bg-glass-2 hover:text-text-primary"
          >
            <X size={16} strokeWidth={1.6} className="mx-auto" />
          </button>
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-xs font-bold text-text-secondary">
            What should this stop cover? (nothing is chosen for you)
          </legend>
          {SCOPE_CHOICES.map((scope) => {
            const option = blastRadius(scope, '');
            return (
              <label
                key={scope}
                className={`flex cursor-pointer gap-2.5 rounded-card border-thin p-3 ${
                  form.scope === scope
                    ? 'border-border-glow bg-brand-soft'
                    : 'border-border-subtle bg-glass-1 hover:bg-glass-2'
                }`}
              >
                <input
                  type="radio"
                  name="halt-scope"
                  data-testid={`halt-scope-${scope}`}
                  checked={form.scope === scope}
                  onChange={() => setForm((prev) => ({ ...prev, scope, acknowledged: false }))}
                  className="mt-0.5 accent-brand"
                />
                <span className="flex flex-col gap-0.5">
                  <span className="text-xs font-extrabold text-text-primary">{option.label}</span>
                  <span className="text-[11px] font-semibold text-text-muted">
                    {HALT_SCOPE_LABEL[scope]}
                  </span>
                </span>
              </label>
            );
          })}
        </fieldset>

        {form.scope !== null && requiresScopeKey(form.scope) && (
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-bold text-text-secondary">
              {form.scope === HaltScope.Agent ? 'Agent key' : 'Capability (action key)'}
            </span>
            <input
              value={form.scopeKey}
              data-testid="halt-scope-key"
              maxLength={150}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, scopeKey: event.target.value, acknowledged: false }))
              }
              className="rounded-sm border-thin border-border-subtle bg-bg-input px-2.5 py-2 font-mono text-sm text-text-primary placeholder:text-text-muted focus:border-border-glow focus:bg-glass-1"
              placeholder={form.scope === HaltScope.Agent ? 'pricing-agent' : 'catalog.reprice'}
            />
            <span className="text-[11px] font-semibold text-text-muted">
              Stored lower-cased by the server.
            </span>
          </label>
        )}

        {radius && form.scope !== null && (
          <div
            data-testid="blast-radius"
            data-scope={form.scope}
            className="flex flex-col gap-1.5 rounded-card border-thin border-danger/40 bg-danger-soft p-3"
          >
            <span className="text-[11px] font-black uppercase tracking-wide text-danger">
              What this stops
            </span>
            <p className="text-xs font-medium leading-relaxed text-text-primary">{radius.stops}</p>
            <span className="text-[11px] font-black uppercase tracking-wide text-text-muted">
              What keeps working
            </span>
            <p className="text-xs font-medium leading-relaxed text-text-secondary">
              {radius.keepsWorking}
            </p>
          </div>
        )}

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-bold text-text-secondary">
            Why are you engaging this stop? (required, stored with the halt)
          </span>
          <textarea
            value={form.reason}
            data-testid="halt-reason"
            rows={3}
            maxLength={1000}
            onChange={(event) => setForm((prev) => ({ ...prev, reason: event.target.value }))}
            className="rounded-sm border-thin border-border-subtle bg-bg-input p-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-border-glow focus:bg-glass-1"
          />
        </label>

        <label className="flex items-start gap-2.5">
          <input
            type="checkbox"
            data-testid="halt-acknowledge"
            checked={form.acknowledged}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, acknowledged: event.target.checked }))
            }
            className="mt-0.5 accent-danger"
          />
          <span className="text-xs font-semibold text-text-secondary">
            I have read what this stops, and I am engaging it deliberately.
          </span>
        </label>

        {error != null && <GovernanceRefusalNotice error={error} />}

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-sm border-thin border-border-medium px-3.5 py-2 text-xs font-bold text-text-secondary hover:bg-glass-2 hover:text-text-primary"
          >
            Cancel
          </button>
          <button
            type="button"
            data-testid="halt-confirm"
            disabled={blocker !== null || pending}
            onClick={() =>
              form.scope !== null &&
              onConfirm({
                scope: form.scope,
                scopeKey: requiresScopeKey(form.scope) ? form.scopeKey.trim().toLowerCase() : null,
                reason: form.reason.trim(),
              })
            }
            className="inline-flex items-center gap-1.5 rounded-sm bg-danger px-3.5 py-2 text-xs font-black text-bg disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ShieldOff size={13} strokeWidth={1.6} />
            {pending ? 'Engaging…' : 'Engage the stop'}
          </button>
        </div>
        {blocker && (
          <p className="text-right text-[11px] font-semibold text-text-muted">{blocker}</p>
        )}
      </div>
    </div>
  );
}
