import { useState } from 'react';
import { Plus, X, Loader2, Clock, DollarSign, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useTimeEntries, useTimeSummary, useLogTime, useDeleteTimeEntry } from '../api/crm.queries';
import type {
  CrmTimeEntrySummaryDto, CrmLogTimeRequest, CrmTimeEntryFilter,
} from '../types/crm.types';
import { CrmTimeEntityKind, CRM_TIME_ENTITY_LABELS } from '../types/crm.types';

const inputCls =
  'w-full px-3 py-2 rounded-xl bg-bg-elevated border border-border-subtle text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-medium';
const selectCls =
  'w-full px-3 py-2 rounded-xl bg-bg-elevated border border-border-subtle text-sm text-text-primary focus:outline-none focus:border-border-medium';

function Badge({ value, labels, colors }: {
  value: number;
  labels: Record<number, string>;
  colors: Record<number, string>;
}) {
  return (
    <span className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${colors[value] ?? 'bg-bg-elevated text-text-secondary border-border-subtle'}`}>
      {labels[value] ?? value}
    </span>
  );
}

function SlideOver({ open, onClose, title, children }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-bg-elevated shadow-2xl flex flex-col border-thin border-border-subtle rounded-card max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle shrink-0">
          <h3 className="font-bold text-text-primary">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

const ENTITY_BADGE_COLORS: Record<number, string> = {
  1: 'bg-brand-soft text-brand border-border-glow',
  2: 'bg-bg-elevated text-text-secondary border-border-subtle',
  3: 'bg-success-soft text-success border-[rgba(34,197,94,0.2)]',
  4: 'bg-bg-elevated text-text-secondary border-border-subtle',
};

function SummaryCard() {
  const { data: raw, isLoading } = useTimeSummary();
  const summary = raw as any;

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border-subtle bg-bg-card p-5 animate-pulse">
        <div className="flex gap-4">
          <div className="h-10 w-36 bg-bg-elevated rounded-xl" />
          <div className="h-10 w-36 bg-bg-elevated rounded-xl" />
        </div>
      </div>
    );
  }

  const billable = summary?.billableMinutes != null ? (summary.billableMinutes / 60).toFixed(1) : '0.0';
  const nonBillable = summary?.nonBillableMinutes != null ? (summary.nonBillableMinutes / 60).toFixed(1) : '0.0';

  return (
    <div className="rounded-2xl border border-border-subtle bg-bg-card p-5 flex flex-wrap gap-4 items-center">
      <div className="flex items-center gap-2">
        <DollarSign className="w-4 h-4 text-success" strokeWidth={1.5} />
        <span className="text-sm font-semibold text-success">Billable: {billable} hrs</span>
      </div>
      <div className="w-px h-5 bg-border-subtle" />
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-text-muted" strokeWidth={1.5} />
        <span className="text-sm font-semibold text-text-secondary">Non-billable: {nonBillable} hrs</span>
      </div>
    </div>
  );
}

function LogTimeForm({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState<CrmLogTimeRequest>({
    entityKind: CrmTimeEntityKind.Deal,
    entityId: '',
    minutesLogged: 30,
    isBillable: true,
    description: '',
  });
  const log = useLogTime();

  const set = (k: keyof CrmLogTimeRequest) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    log.mutate(
      { ...form, minutesLogged: Number(form.minutesLogged), entityKind: Number(form.entityKind) as CrmTimeEntityKind, description: (form.description as string) || undefined },
      { onSuccess: onClose },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-text-muted mb-1.5">Entity Type *</label>
        <select required value={form.entityKind} onChange={set('entityKind')} className={selectCls}>
          {(Object.entries(CRM_TIME_ENTITY_LABELS) as [string, string][]).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold text-text-muted mb-1.5">Entity ID *</label>
        <input required value={form.entityId} onChange={set('entityId')} placeholder="UUID" className={inputCls} />
      </div>
      <div>
        <label className="block text-xs font-semibold text-text-muted mb-1.5">Minutes Logged *</label>
        <input required type="number" min={1} value={form.minutesLogged} onChange={set('minutesLogged')} className={inputCls} />
      </div>
      <div className="flex items-center gap-2.5">
        <input
          type="checkbox"
          id="isBillable"
          checked={!!form.isBillable}
          onChange={(e) => setForm((f) => ({ ...f, isBillable: e.target.checked }))}
          className="w-4 h-4 accent-brand"
        />
        <label htmlFor="isBillable" className="text-sm text-text-primary select-none cursor-pointer">Billable</label>
      </div>
      <div>
        <label className="block text-xs font-semibold text-text-muted mb-1.5">Description</label>
        <textarea rows={3} value={form.description ?? ''} onChange={set('description')} placeholder="What did you work on?" className={`${inputCls} resize-none`} />
      </div>
      <div className="flex gap-3 pt-1">
        <button type="submit" disabled={log.isPending || !form.entityId.trim()}
          className="flex items-center gap-1.5 flex-1 justify-center py-2 rounded-xl bg-brand text-bg text-sm font-bold hover:bg-brand-light disabled:opacity-50 transition-all">
          {log.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-3.5 h-3.5" /> Log Time</>}
        </button>
        <button type="button" onClick={onClose}
          className="px-4 py-2 rounded-xl border border-border-subtle text-sm text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-all">
          Cancel
        </button>
      </div>
    </form>
  );
}

export function Component() {
  const [filter, setFilter] = useState<CrmTimeEntryFilter>({});
  const [showLog, setShowLog] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const { data: raw, isLoading } = useTimeEntries(filter);
  const items: CrmTimeEntrySummaryDto[] = (raw as any)?.items ?? [];
  const deleteEntry = useDeleteTimeEntry();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-text-primary tracking-tight">Time Tracking</h2>
          <p className="text-xs text-text-muted mt-0.5">Log and review time spent on CRM entities</p>
        </div>
        <button onClick={() => setShowLog(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-bg bg-brand hover:bg-brand-light transition-all">
          <Plus className="w-3.5 h-3.5" strokeWidth={2.5} /> Log Time
        </button>
      </div>

      <SummaryCard />

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filter.entityKind ?? ''}
          onChange={(e) => setFilter((f) => ({ ...f, entityKind: e.target.value ? Number(e.target.value) as CrmTimeEntityKind : undefined }))}
          className="px-3 py-2 rounded-xl bg-bg-elevated border border-border-subtle text-sm text-text-primary focus:outline-none"
        >
          <option value="">All Entity Types</option>
          {(Object.entries(CRM_TIME_ENTITY_LABELS) as [string, string][]).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border-subtle bg-bg-card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-40 text-text-muted"><Loader2 className="w-5 h-5 animate-spin" /></div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2 text-text-muted">
            <Clock className="w-7 h-7 opacity-25" strokeWidth={1.2} />
            <p className="text-sm">No time entries found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle bg-bg-subtle">
                  {['Type', 'Entity', 'Minutes', 'Billable', 'Logged By', 'Description', 'Date', ''].map((h, i) => (
                    <th key={i} className="px-4 py-3 text-left text-xs font-semibold text-text-muted">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id} className="border-b border-border-subtle last:border-0 hover:bg-bg-elevated transition-colors">
                    <td className="px-4 py-3">
                      <Badge value={row.entityKind} labels={CRM_TIME_ENTITY_LABELS} colors={ENTITY_BADGE_COLORS} />
                    </td>
                    <td className="px-4 py-3 text-text-secondary max-w-[140px] truncate">
                      {(row as any).entityLabel ?? row.entityId?.slice(0, 8) + '…'}
                    </td>
                    <td className="px-4 py-3 font-medium text-text-primary">{row.minutesLogged} min</td>
                    <td className="px-4 py-3">
                      {row.isBillable ? (
                        <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-success-soft text-success border border-[rgba(34,197,94,0.2)]">Billable</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-bg-elevated text-text-muted border border-border-subtle">Non-billable</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{(row as any).loggedByName ?? '—'}</td>
                    <td className="px-4 py-3 text-text-secondary max-w-[180px] truncate">{row.description ?? '—'}</td>
                    <td className="px-4 py-3 text-text-muted whitespace-nowrap">
                      {row.loggedAt ? format(parseISO(row.loggedAt), 'MMM d, HH:mm') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {confirmDelete === row.id ? (
                        <div className="flex items-center gap-1">
                          <button onClick={() => deleteEntry.mutate(row.id, { onSuccess: () => setConfirmDelete(null) })}
                            disabled={deleteEntry.isPending}
                            className="px-2 py-1 rounded-lg bg-danger text-bg text-xs font-bold disabled:opacity-50">
                            {deleteEntry.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Del'}
                          </button>
                          <button onClick={() => setConfirmDelete(null)} className="text-xs text-text-muted hover:text-text-primary">×</button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmDelete(row.id)}
                          className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger-soft border border-transparent hover:border-[rgba(244,63,94,0.2)] transition-all">
                          <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <SlideOver open={showLog} onClose={() => setShowLog(false)} title="Log Time">
        <LogTimeForm onClose={() => setShowLog(false)} />
      </SlideOver>
    </div>
  );
}
