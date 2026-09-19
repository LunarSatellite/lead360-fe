import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Loader2,
  RefreshCw,
  ScrollText,
} from 'lucide-react';
import {
  AUDIT_ACTIONS,
  AUDIT_TARGET_KINDS,
  auditActionGroup,
  stylemintAuditApi,
  type AuditEntry,
  type AuditFilters,
} from '../api/stylemint-audit.api';

/**
 * The commerce admin audit trail — who did what, to which record, when, and from where.
 *
 * Append-only and written by the services themselves, so this page is read-only on purpose:
 * an audit trail you can edit is not an audit trail. Takes SuperAdmin or Readonly.
 *
 * The payload is stored encrypted at rest and decrypted on read, so it is collapsed by default
 * rather than rendered inline — it can carry account identifiers and decision detail.
 */

const PAGE_SIZE = 50;

/** Colour by action family, so scanning a long list separates money from access changes. */
const GROUP_TONE: Record<string, string> = {
  payment: 'text-amber-300 border-amber-400/25 bg-amber-400/5',
  payout: 'text-amber-300 border-amber-400/25 bg-amber-400/5',
  kyc: 'text-blue-300 border-blue-400/25 bg-blue-400/5',
  moderation: 'text-blue-300 border-blue-400/25 bg-blue-400/5',
  admin: 'text-rose-300 border-rose-400/25 bg-rose-400/5',
  privacy: 'text-rose-300 border-rose-400/25 bg-rose-400/5',
  feature_flag: 'text-brand border-border-glow bg-brand-soft',
  platform_config: 'text-brand border-border-glow bg-brand-soft',
  support: 'text-text-secondary border-border-subtle bg-glass-2',
};

export function AuditPage() {
  const [filters, setFilters] = useState<AuditFilters>({ pageNumber: 1, pageSize: PAGE_SIZE });

  const page = useQuery({
    queryKey: ['stylemint-audit', filters],
    queryFn: () => stylemintAuditApi.query(filters),
  });

  const set = (patch: Partial<AuditFilters>) =>
    // Any filter change resets to page 1: keeping the old page number would land the operator
    // on an empty page whenever the narrower filter has fewer results.
    setFilters((prev) => ({ ...prev, ...patch, pageNumber: patch.pageNumber ?? 1 }));

  const data = page.data;

  return (
    <div className="mx-auto max-w-[1500px] space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-brand">
            Stylemint commerce platform
          </p>
          <h1 className="mt-2 flex items-center gap-2 text-2xl font-black tracking-tight text-text-primary">
            <ScrollText className="h-5 w-5 text-brand" strokeWidth={1.6} />
            Audit trail
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Every privileged action an operator took. Append-only — this page never writes.
          </p>
        </div>
        <button
          onClick={() => page.refetch()}
          className="flex items-center gap-2 self-start rounded-card border-thin border-border-subtle px-3 py-2 text-xs font-bold text-text-secondary hover:text-brand"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${page.isFetching ? 'animate-spin' : ''}`}
            strokeWidth={1.6}
          />
          Refresh
        </button>
      </div>

      <div className="grid gap-2 rounded-frame border-thin border-border-subtle bg-bg-card p-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Action">
          <select
            value={filters.action ?? ''}
            onChange={(e) => set({ action: e.target.value || undefined })}
            className="w-full rounded-sm border-thin border-border-subtle bg-bg-input px-2.5 py-1.5 text-xs text-text-primary focus:border-border-glow focus:outline-none"
          >
            <option value="">Any action</option>
            {AUDIT_ACTIONS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Target kind">
          <select
            value={filters.targetKind ?? ''}
            onChange={(e) => set({ targetKind: e.target.value || undefined })}
            className="w-full rounded-sm border-thin border-border-subtle bg-bg-input px-2.5 py-1.5 text-xs text-text-primary focus:border-border-glow focus:outline-none"
          >
            <option value="">Any target</option>
            {AUDIT_TARGET_KINDS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </Field>
        <Field label="From">
          <input
            type="date"
            value={(filters.fromUtc ?? '').slice(0, 10)}
            onChange={(e) =>
              set({ fromUtc: e.target.value ? new Date(e.target.value).toISOString() : undefined })
            }
            className="w-full rounded-sm border-thin border-border-subtle bg-bg-input px-2.5 py-1.5 text-xs text-text-primary focus:border-border-glow focus:outline-none"
          />
        </Field>
        <Field label="To">
          <input
            type="date"
            value={(filters.toUtc ?? '').slice(0, 10)}
            onChange={(e) =>
              set({ toUtc: e.target.value ? new Date(e.target.value).toISOString() : undefined })
            }
            className="w-full rounded-sm border-thin border-border-subtle bg-bg-input px-2.5 py-1.5 text-xs text-text-primary focus:border-border-glow focus:outline-none"
          />
        </Field>
      </div>

      {page.isError && (
        <div className="flex items-start gap-3 rounded-frame border-thin border-rose-400/25 bg-rose-400/5 p-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" strokeWidth={1.6} />
          <p className="text-sm text-text-secondary">{(page.error as Error).message}</p>
        </div>
      )}

      {page.isLoading ? (
        <div className="flex items-center gap-3 rounded-frame border-thin border-border-subtle bg-bg-card p-8 text-sm text-text-muted">
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.6} />
          Loading the audit trail…
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="rounded-frame border-thin border-border-subtle bg-bg-card p-10 text-center">
          <ScrollText className="mx-auto h-7 w-7 text-text-muted" strokeWidth={1.6} />
          <p className="mt-3 text-sm text-text-secondary">
            No audit entries match these filters.
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>
              {data.totalCount} {data.totalCount === 1 ? 'entry' : 'entries'}
            </span>
            <span>
              Page {data.pageNumber} of {Math.max(data.totalPages, 1)}
            </span>
          </div>

          <div className="space-y-1.5">
            {data.items.map((entry) => (
              <AuditRow key={entry.id} entry={entry} />
            ))}
          </div>

          <div className="flex items-center justify-center gap-2">
            <button
              disabled={!data.hasPrevious || page.isFetching}
              onClick={() => set({ pageNumber: data.pageNumber - 1 })}
              className="flex items-center gap-1 rounded-sm border-thin border-border-medium px-3 py-1.5 text-xs font-bold text-text-secondary hover:bg-glass-2 hover:text-text-primary disabled:opacity-30"
            >
              <ChevronLeft className="h-3.5 w-3.5" strokeWidth={1.6} /> Previous
            </button>
            <button
              disabled={!data.hasNext || page.isFetching}
              onClick={() => set({ pageNumber: data.pageNumber + 1 })}
              className="flex items-center gap-1 rounded-sm border-thin border-border-medium px-3 py-1.5 text-xs font-bold text-text-secondary hover:bg-glass-2 hover:text-text-primary disabled:opacity-30"
            >
              Next <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.6} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] font-bold uppercase tracking-wide text-text-secondary">
        {label}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function AuditRow({ entry }: { entry: AuditEntry }) {
  const [open, setOpen] = useState(false);
  const tone = GROUP_TONE[auditActionGroup(entry.action)] ?? 'text-text-secondary border-border-subtle bg-glass-2';

  return (
    <div className="rounded-card border-thin border-border-subtle bg-glass-1">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start gap-3 p-3 text-left hover:bg-glass-2"
      >
        {open ? (
          <ChevronDown className="mt-0.5 h-3.5 w-3.5 shrink-0 text-text-muted" strokeWidth={1.6} />
        ) : (
          <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-text-muted" strokeWidth={1.6} />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-xs border-thin px-1.5 py-0.5 font-mono text-[10px] font-bold ${tone}`}
            >
              {entry.action}
            </span>
            <span className="text-xs font-bold text-text-primary">{entry.targetKind}</span>
            <span className="font-mono text-[11px] text-text-muted">{entry.targetId}</span>
          </div>
          {entry.reason && (
            <p className="mt-1 text-xs text-text-secondary">{entry.reason}</p>
          )}
        </div>
        <span className="shrink-0 text-[11px] text-text-muted">
          {new Date(entry.occurredUtc).toLocaleString()}
        </span>
      </button>

      {open && (
        <div className="space-y-2 border-t-thin border-border-subtle p-3 pt-2.5">
          <div className="grid gap-2 sm:grid-cols-3">
            <Detail label="Operator" value={entry.adminAccountId} mono />
            <Detail label="Source IP" value={entry.sourceIp || '—'} mono />
            <Detail label="User agent" value={entry.userAgent || '—'} />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-text-secondary">
              Payload
            </p>
            <pre className="mt-1 max-h-56 overflow-auto rounded-sm border-thin border-border-subtle bg-bg-input p-2.5 font-mono text-[11px] leading-relaxed text-text-secondary">
              {safePretty(entry.payloadJson)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wide text-text-secondary">{label}</p>
      <p className={`mt-0.5 break-all text-xs text-text-primary ${mono ? 'font-mono' : ''}`}>
        {value}
      </p>
    </div>
  );
}

/** The payload is opaque to this page — show it raw rather than guessing at a shape. */
function safePretty(json: string): string {
  try {
    return JSON.stringify(JSON.parse(json), null, 2);
  } catch {
    return json;
  }
}

export { AuditPage as Component };
