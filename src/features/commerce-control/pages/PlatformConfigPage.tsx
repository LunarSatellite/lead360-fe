import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Check,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  X,
} from 'lucide-react';
import {
  formatJson,
  isValidJson,
  stylemintPlatformConfigApi,
  type PlatformConfigEntry,
} from '../api/stylemint-platform-config.api';

/**
 * Platform configuration — the key/value settings the commerce platform reads at runtime.
 *
 * Every value is JSON, stored verbatim. The editor validates before sending because the backend
 * takes the string as given: a malformed value is accepted into the column and only fails later,
 * wherever the platform tries to parse it.
 *
 * Reading is open to any operator role; saving takes SuperAdmin. These are live platform
 * settings, so a save applies immediately — each edit shows the current value beside the new one
 * and confirms before writing.
 */
export function PlatformConfigPage() {
  const client = useQueryClient();
  const [filter, setFilter] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const entries = useQuery({
    queryKey: ['stylemint-platform-config'],
    queryFn: () => stylemintPlatformConfigApi.list(),
  });

  const refresh = () => client.invalidateQueries({ queryKey: ['stylemint-platform-config'] });

  const visible = useMemo(() => {
    const all = entries.data ?? [];
    const q = filter.trim().toLowerCase();
    const matched = q
      ? all.filter(
          (e) =>
            e.key.toLowerCase().includes(q) || (e.description ?? '').toLowerCase().includes(q),
        )
      : all;
    return [...matched].sort((a, b) => a.key.localeCompare(b.key));
  }, [entries.data, filter]);

  return (
    <div className="mx-auto max-w-[1500px] space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-brand">
            Stylemint commerce platform
          </p>
          <h1 className="mt-2 flex items-center gap-2 text-2xl font-black tracking-tight text-text-primary">
            <Settings2 className="h-5 w-5 text-brand" strokeWidth={1.6} />
            Platform configuration
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Runtime settings the commerce platform reads. Each value is JSON, and a save applies
            immediately.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-1.5 rounded-card bg-brand px-3 py-2 text-xs font-bold text-bg hover:bg-brand-light"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={1.6} /> New setting
          </button>
          <button
            onClick={() => entries.refetch()}
            className="flex items-center gap-2 rounded-card border-thin border-border-subtle px-3 py-2 text-xs font-bold text-text-secondary hover:text-brand"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${entries.isFetching ? 'animate-spin' : ''}`}
              strokeWidth={1.6}
            />
            Refresh
          </button>
        </div>
      </div>

      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted"
          strokeWidth={1.6}
        />
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter by key or description"
          className="w-full rounded-card border-thin border-border-subtle bg-bg-input py-2 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:border-border-glow focus:bg-glass-1 focus:outline-none"
        />
      </div>

      {creating && (
        <ConfigEditor
          title="New setting"
          initialKey=""
          initialValue="null"
          initialDescription=""
          keyEditable
          onCancel={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            refresh();
          }}
        />
      )}

      {entries.isError && (
        <div className="flex items-start gap-3 rounded-frame border-thin border-rose-400/25 bg-rose-400/5 p-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" strokeWidth={1.6} />
          <p className="text-sm text-text-secondary">{(entries.error as Error).message}</p>
        </div>
      )}

      {entries.isLoading ? (
        <div className="flex items-center gap-3 rounded-frame border-thin border-border-subtle bg-bg-card p-8 text-sm text-text-muted">
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.6} />
          Loading platform settings…
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-frame border-thin border-border-subtle bg-bg-card p-10 text-center">
          <Settings2 className="mx-auto h-7 w-7 text-text-muted" strokeWidth={1.6} />
          <p className="mt-3 text-sm text-text-secondary">
            {filter.trim()
              ? 'No setting matches that filter.'
              : 'No platform settings are defined yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map((entry) =>
            editing === entry.key ? (
              <ConfigEditor
                key={entry.key}
                title={entry.key}
                initialKey={entry.key}
                initialValue={entry.valueJson}
                initialDescription={entry.description}
                onCancel={() => setEditing(null)}
                onSaved={() => {
                  setEditing(null);
                  refresh();
                }}
              />
            ) : (
              <ConfigRow key={entry.key} entry={entry} onEdit={() => setEditing(entry.key)} />
            ),
          )}
        </div>
      )}
    </div>
  );
}

function ConfigRow({ entry, onEdit }: { entry: PlatformConfigEntry; onEdit: () => void }) {
  return (
    <div className="rounded-card border-thin border-border-subtle bg-glass-1 p-3.5 hover:border-border-medium">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-sm font-extrabold text-text-primary">{entry.key}</p>
          {entry.description && (
            <p className="mt-0.5 text-xs text-text-muted">{entry.description}</p>
          )}
          <pre className="mt-2 max-h-40 overflow-auto rounded-sm border-thin border-border-subtle bg-bg-input p-2.5 font-mono text-[11px] leading-relaxed text-text-secondary">
            {formatJson(entry.valueJson)}
          </pre>
          <p className="mt-2 text-[11px] text-text-muted">
            Updated {new Date(entry.updatedUtc).toLocaleString()}
          </p>
        </div>
        <button
          onClick={onEdit}
          className="rounded-sm border-thin border-border-medium px-3 py-1.5 text-xs font-bold text-text-secondary hover:bg-glass-2 hover:text-text-primary"
        >
          Edit
        </button>
      </div>
    </div>
  );
}

function ConfigEditor({
  title,
  initialKey,
  initialValue,
  initialDescription,
  keyEditable = false,
  onCancel,
  onSaved,
}: {
  title: string;
  initialKey: string;
  initialValue: string;
  initialDescription: string;
  keyEditable?: boolean;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [key, setKey] = useState(initialKey);
  const [value, setValue] = useState(() => formatJson(initialValue));
  const [description, setDescription] = useState(initialDescription);
  const [error, setError] = useState<string | null>(null);

  const valueValid = isValidJson(value);
  const keyValid = key.trim().length > 0;
  const changed = value !== formatJson(initialValue) || description !== initialDescription || keyEditable;

  const save = useMutation({
    mutationFn: () => stylemintPlatformConfigApi.set(key.trim(), value, description.trim()),
    onSuccess: () => {
      setError(null);
      onSaved();
    },
    onError: (caught: unknown) =>
      setError(caught instanceof Error ? caught.message : 'The setting could not be saved.'),
  });

  return (
    <div className="rounded-card border-thin border-border-glow bg-brand-soft p-3.5">
      <p className="font-mono text-sm font-extrabold text-text-primary">{title}</p>

      {keyEditable && (
        <label className="mt-3 block">
          <span className="text-[11px] font-bold uppercase tracking-wide text-text-secondary">
            Key
          </span>
          <input
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="checkout.esewa.enabled"
            className="mt-1 w-full rounded-sm border-thin border-border-subtle bg-bg-input px-3 py-2 font-mono text-xs text-text-primary placeholder:text-text-muted focus:border-border-glow focus:outline-none"
          />
        </label>
      )}

      <label className="mt-3 block">
        <span className="text-[11px] font-bold uppercase tracking-wide text-text-secondary">
          Value (JSON)
        </span>
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={8}
          spellCheck={false}
          className={`mt-1 w-full rounded-sm border-thin bg-bg-input px-3 py-2 font-mono text-xs leading-relaxed text-text-primary focus:outline-none ${
            valueValid ? 'border-border-subtle focus:border-border-glow' : 'border-rose-400/40'
          }`}
        />
      </label>
      {!valueValid && (
        <p className="mt-1 text-[11px] text-rose-300">
          This is not valid JSON. The platform stores the value verbatim, so it would be accepted
          here and fail wherever it is read.
        </p>
      )}

      <label className="mt-3 block">
        <span className="text-[11px] font-bold uppercase tracking-wide text-text-secondary">
          Description
        </span>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What this setting controls"
          className="mt-1 w-full rounded-sm border-thin border-border-subtle bg-bg-input px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:border-border-glow focus:outline-none"
        />
      </label>

      {error && (
        <div className="mt-3 flex items-start gap-2 rounded-sm border-thin border-rose-400/25 bg-rose-400/5 p-2.5">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-300" strokeWidth={1.6} />
          <p className="text-xs text-text-secondary">{error}</p>
        </div>
      )}

      <p className="mt-3 text-[11px] text-text-muted">
        Saving applies immediately across the platform and is recorded in the audit trail as
        <span className="font-mono"> platform_config.updated</span>.
      </p>

      <div className="mt-3 flex items-center gap-2">
        <button
          disabled={!valueValid || !keyValid || !changed || save.isPending}
          onClick={() => save.mutate()}
          className="flex items-center gap-1.5 rounded-sm bg-brand px-3 py-1.5 text-xs font-bold text-bg hover:bg-brand-light disabled:opacity-40"
        >
          {save.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.6} />
          ) : (
            <Check className="h-3.5 w-3.5" strokeWidth={1.6} />
          )}
          Save
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 rounded-sm border-thin border-border-medium px-3 py-1.5 text-xs font-bold text-text-secondary hover:bg-glass-2 hover:text-text-primary"
        >
          <X className="h-3.5 w-3.5" strokeWidth={1.6} /> Cancel
        </button>
      </div>
    </div>
  );
}

export { PlatformConfigPage as Component };
