import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Flag,
  Loader2,
  Plus,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  Trash2,
} from 'lucide-react';
import {
  AUDIENCE_LABEL,
  FlagAudience,
  ROLE_KIND_LABEL,
  ROLE_KIND_NAME,
  FlagRoleKind,
  stylemintFeatureFlagsApi,
  type FeatureFlag,
} from '../api/stylemint-feature-flags.api';

/**
 * Platform feature flags, and the overrides layered on top of them.
 *
 * A flag has one default and any number of overrides: per audience role (customer, creator,
 * vendor) or per single account. The page shows the default and its overrides together, because
 * "is this on?" is only answerable from both — a flag that reads as off by default may still be
 * on for every vendor.
 *
 * Reading takes any admin role; every write takes SuperAdmin. Toggling a live platform switch is
 * immediate and affects real users, so each change confirms first and says what it will do.
 */
export function FeatureFlagsPage() {
  const client = useQueryClient();
  const [creating, setCreating] = useState(false);

  const flags = useQuery({
    queryKey: ['stylemint-feature-flags'],
    queryFn: () => stylemintFeatureFlagsApi.list(),
  });

  const refresh = () => client.invalidateQueries({ queryKey: ['stylemint-feature-flags'] });

  return (
    <div className="mx-auto max-w-[1500px] space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-brand">
            Stylemint commerce platform
          </p>
          <h1 className="mt-2 flex items-center gap-2 text-2xl font-black tracking-tight text-text-primary">
            <Flag className="h-5 w-5 text-brand" strokeWidth={1.6} />
            Feature flags
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Platform switches and the per-role or per-account overrides on top of them.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-1.5 rounded-card bg-brand px-3 py-2 text-xs font-bold text-bg hover:bg-brand-light"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={1.6} /> New flag
          </button>
          <button
            onClick={() => flags.refetch()}
            className="flex items-center gap-2 rounded-card border-thin border-border-subtle px-3 py-2 text-xs font-bold text-text-secondary hover:text-brand"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${flags.isFetching ? 'animate-spin' : ''}`}
              strokeWidth={1.6}
            />
            Refresh
          </button>
        </div>
      </div>

      {creating && <NewFlagCard onDone={() => { setCreating(false); refresh(); }} />}

      {flags.isError && (
        <div className="flex items-start gap-3 rounded-frame border-thin border-rose-400/25 bg-rose-400/5 p-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" strokeWidth={1.6} />
          <p className="text-sm text-text-secondary">{(flags.error as Error).message}</p>
        </div>
      )}

      {flags.isLoading ? (
        <div className="flex items-center gap-3 rounded-frame border-thin border-border-subtle bg-bg-card p-8 text-sm text-text-muted">
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.6} /> Loading flags…
        </div>
      ) : (
        <div className="space-y-3">
          {(flags.data ?? []).map((flag) => (
            <FlagCard key={flag.id} flag={flag} onChanged={refresh} />
          ))}
          {(flags.data?.length ?? 0) === 0 && !flags.isError && (
            <p className="rounded-frame border-thin border-border-subtle bg-bg-card p-10 text-center text-sm text-text-muted">
              No feature flags defined yet.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function NewFlagCard({ onDone }: { onDone: () => void }) {
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [defaultEnabled, setDefaultEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: () => stylemintFeatureFlagsApi.upsert(key.trim(), defaultEnabled, description),
    onSuccess: onDone,
    onError: (caught: unknown) =>
      setError(caught instanceof Error ? caught.message : 'The flag could not be saved.'),
  });

  return (
    <div className="space-y-3 rounded-frame border-thin border-border-subtle bg-bg-card p-4">
      <p className="text-sm font-bold text-text-primary">New feature flag</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <input
          value={key}
          onChange={(event) => setKey(event.target.value)}
          placeholder="flag.key"
          className="rounded-card border-thin border-border-subtle bg-bg-elevated px-3 py-2 font-mono text-xs text-text-primary outline-none focus:border-border-glow"
        />
        <input
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="What does this switch do?"
          className="rounded-card border-thin border-border-subtle bg-bg-elevated px-3 py-2 text-xs text-text-primary outline-none focus:border-border-glow"
        />
      </div>
      <label className="flex items-center gap-2 text-xs font-bold text-text-secondary">
        <input
          type="checkbox"
          checked={defaultEnabled}
          onChange={(event) => setDefaultEnabled(event.target.checked)}
          className="accent-brand"
        />
        On by default for everyone
      </label>

      {error && <p className="text-xs text-rose-300">{error}</p>}

      <div className="flex gap-2">
        <button
          onClick={() => create.mutate()}
          disabled={create.isPending || !key.trim()}
          className="rounded-card bg-brand px-3 py-2 text-xs font-bold text-bg hover:bg-brand-light disabled:opacity-40"
        >
          {create.isPending ? 'Saving…' : 'Create flag'}
        </button>
        <button
          onClick={onDone}
          className="rounded-card border-thin border-border-medium px-3 py-2 text-xs font-bold text-text-secondary"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function FlagCard({ flag, onChanged }: { flag: FeatureFlag; onChanged: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [confirmToggle, setConfirmToggle] = useState(false);
  const [adding, setAdding] = useState(false);

  const toggleDefault = useMutation({
    mutationFn: () =>
      stylemintFeatureFlagsApi.upsert(flag.key, !flag.defaultEnabled, flag.description),
    onSuccess: () => {
      setConfirmToggle(false);
      setError(null);
      onChanged();
    },
    onError: (caught: unknown) => {
      setConfirmToggle(false);
      setError(caught instanceof Error ? caught.message : 'The flag could not be changed.');
    },
  });

  const clearOverride = useMutation({
    mutationFn: (override: { roleKind?: string | null; accountId?: string | null }) =>
      stylemintFeatureFlagsApi.clearOverride(flag.key, override),
    onSuccess: () => { setError(null); onChanged(); },
    onError: (caught: unknown) =>
      setError(caught instanceof Error ? caught.message : 'The override could not be cleared.'),
  });

  return (
    <div className="space-y-3 rounded-frame border-thin border-border-subtle bg-bg-card p-4">
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-sm font-bold text-text-primary">{flag.key}</p>
          {flag.description && (
            <p className="mt-0.5 text-xs text-text-muted">{flag.description}</p>
          )}
        </div>
        <button
          onClick={() => setConfirmToggle(true)}
          disabled={toggleDefault.isPending}
          className={`flex shrink-0 items-center gap-1.5 rounded-card border-thin px-3 py-2 text-xs font-bold disabled:opacity-40 ${
            flag.defaultEnabled
              ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300'
              : 'border-border-medium text-text-secondary'
          }`}
        >
          {flag.defaultEnabled ? (
            <ToggleRight className="h-4 w-4" strokeWidth={1.6} />
          ) : (
            <ToggleLeft className="h-4 w-4" strokeWidth={1.6} />
          )}
          Default {flag.defaultEnabled ? 'on' : 'off'}
        </button>
      </div>

      {confirmToggle && (
        <div className="space-y-2 rounded-card border-thin border-amber-400/25 bg-amber-400/5 p-3">
          <p className="text-xs font-bold text-amber-300">
            Turn this flag {flag.defaultEnabled ? 'off' : 'on'} by default?
          </p>
          <p className="text-[10px] text-text-muted">
            This takes effect immediately for everyone without an override.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => toggleDefault.mutate()}
              disabled={toggleDefault.isPending}
              className="rounded-card bg-brand px-3 py-2 text-xs font-bold text-bg hover:bg-brand-light disabled:opacity-40"
            >
              {toggleDefault.isPending ? 'Applying…' : 'Yes, change it'}
            </button>
            <button
              onClick={() => setConfirmToggle(false)}
              className="rounded-card border-thin border-border-medium px-3 py-2 text-xs font-bold text-text-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-card border-thin border-rose-400/25 bg-rose-400/5 p-2.5">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-300" strokeWidth={1.6} />
          <p className="text-xs text-text-secondary">{error}</p>
        </div>
      )}

      <div>
        <p className="text-[10px] font-extrabold uppercase tracking-wider text-text-muted">
          Overrides
        </p>
        {flag.overrides.length === 0 ? (
          <p className="mt-1 text-xs text-text-muted">
            None — everyone gets the default above.
          </p>
        ) : (
          <ul className="mt-1.5 space-y-1.5">
            {flag.overrides.map((override) => (
              <li
                key={override.id}
                className="flex items-center gap-2 rounded-card border-thin border-border-subtle bg-bg-elevated px-3 py-2"
              >
                <span className="text-[10px] font-black text-text-muted">
                  {AUDIENCE_LABEL[override.audience] ?? override.audience}
                </span>
                <span className="min-w-0 flex-1 truncate text-xs text-text-secondary">
                  {override.audience === FlagAudience.Role
                    ? (ROLE_KIND_LABEL[override.roleKind ?? 0] ?? 'Unknown role')
                    : (override.accountId ?? 'Unknown account')}
                </span>
                <span
                  className={`shrink-0 rounded-sm border-thin px-2 py-0.5 text-[10px] font-black ${
                    override.enabled
                      ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300'
                      : 'border-rose-400/25 bg-rose-400/10 text-rose-300'
                  }`}
                >
                  {override.enabled ? 'On' : 'Off'}
                </span>
                <button
                  title="Clear this override"
                  onClick={() =>
                    clearOverride.mutate(
                      override.audience === FlagAudience.Role
                        ? { roleKind: ROLE_KIND_NAME[override.roleKind ?? 0] }
                        : { accountId: override.accountId },
                    )
                  }
                  disabled={clearOverride.isPending}
                  className="shrink-0 rounded-sm p-1 text-text-muted hover:text-rose-300 disabled:opacity-40"
                >
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={1.6} />
                </button>
              </li>
            ))}
          </ul>
        )}

        {adding ? (
          <AddOverride
            flagKey={flag.key}
            onDone={() => { setAdding(false); onChanged(); }}
            onCancel={() => setAdding(false)}
          />
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="mt-2 flex items-center gap-1.5 rounded-card border-thin border-border-medium px-3 py-1.5 text-xs font-bold text-text-secondary hover:text-text-primary"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={1.6} /> Add override
          </button>
        )}
      </div>
    </div>
  );
}

function AddOverride({
  flagKey,
  onDone,
  onCancel,
}: {
  flagKey: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [audience, setAudience] = useState<number>(FlagAudience.Role);
  const [roleKind, setRoleKind] = useState<number>(FlagRoleKind.Customer);
  const [accountId, setAccountId] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: () =>
      stylemintFeatureFlagsApi.setOverride(flagKey, {
        roleKind: audience === FlagAudience.Role ? ROLE_KIND_NAME[roleKind] : null,
        accountId: audience === FlagAudience.Account ? accountId.trim() : null,
        enabled,
      }),
    onSuccess: onDone,
    onError: (caught: unknown) =>
      setError(caught instanceof Error ? caught.message : 'The override could not be saved.'),
  });

  const incomplete = audience === FlagAudience.Account && !accountId.trim();

  return (
    <div className="mt-2 space-y-2 rounded-card border-thin border-border-subtle bg-bg-elevated p-3">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={audience}
          onChange={(event) => setAudience(Number(event.target.value))}
          className="rounded-card border-thin border-border-subtle bg-bg-card px-2 py-1.5 text-xs text-text-primary outline-none focus:border-border-glow"
        >
          <option value={FlagAudience.Role}>A whole role</option>
          <option value={FlagAudience.Account}>One account</option>
        </select>

        {audience === FlagAudience.Role ? (
          <select
            value={roleKind}
            onChange={(event) => setRoleKind(Number(event.target.value))}
            className="rounded-card border-thin border-border-subtle bg-bg-card px-2 py-1.5 text-xs text-text-primary outline-none focus:border-border-glow"
          >
            {Object.entries(ROLE_KIND_LABEL).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        ) : (
          <input
            value={accountId}
            onChange={(event) => setAccountId(event.target.value)}
            placeholder="Account id"
            className="min-w-[280px] flex-1 rounded-card border-thin border-border-subtle bg-bg-card px-2 py-1.5 font-mono text-xs text-text-primary outline-none focus:border-border-glow"
          />
        )}

        <label className="flex items-center gap-2 text-xs font-bold text-text-secondary">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(event) => setEnabled(event.target.checked)}
            className="accent-brand"
          />
          Enabled
        </label>
      </div>

      {error && <p className="text-xs text-rose-300">{error}</p>}

      <div className="flex gap-2">
        <button
          onClick={() => save.mutate()}
          disabled={save.isPending || incomplete}
          className="rounded-card bg-brand px-3 py-1.5 text-xs font-bold text-bg hover:bg-brand-light disabled:opacity-40"
        >
          {save.isPending ? 'Saving…' : 'Save override'}
        </button>
        <button
          onClick={onCancel}
          className="rounded-card border-thin border-border-medium px-3 py-1.5 text-xs font-bold text-text-secondary"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export { FeatureFlagsPage as Component };
