import { useState } from 'react';
import { Plus, FileSignature, Loader2, X, Trash2 } from 'lucide-react';
import { DataView } from '@/shared/ui/DataView';
import { confirmDialog } from '@/shared/ui/confirm';
import {
  useContracts, useCreateContract, useUpdateContractStatus, useDeleteContract,
} from '../api/crm.queries';
import {
  CrmContractStatus, CRM_CONTRACT_STATUS_LABELS,
  type CrmContractDto, type CrmContractCreateRequest,
} from '../types/crm.types';

const inputCls =
  'w-full px-3 py-2 rounded-xl bg-bg-input border-thin border-border-subtle text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-glow';

const STATUS_STYLES: Record<CrmContractStatus, string> = {
  [CrmContractStatus.Draft]: 'text-text-muted border-border-medium bg-glass-2',
  [CrmContractStatus.PendingSignature]: 'text-warning border-warning/30 bg-warning/10',
  [CrmContractStatus.Active]: 'text-success border-success/30 bg-success/10',
  [CrmContractStatus.Expired]: 'text-text-muted border-border-medium bg-glass-2',
  [CrmContractStatus.Terminated]: 'text-danger border-danger/30 bg-danger/10',
  [CrmContractStatus.Renewed]: 'text-brand border-border-glow bg-brand-soft',
};

const money = (n: number, ccy: string) =>
  new Intl.NumberFormat(undefined, { style: 'currency', currency: ccy || 'USD', maximumFractionDigits: 0 }).format(n || 0);

const NEXT_STATUS: { from: CrmContractStatus; to: CrmContractStatus; label: string }[] = [
  { from: CrmContractStatus.Draft, to: CrmContractStatus.PendingSignature, label: 'Send for signature' },
  { from: CrmContractStatus.PendingSignature, to: CrmContractStatus.Active, label: 'Activate' },
  { from: CrmContractStatus.Active, to: CrmContractStatus.Renewed, label: 'Mark renewed' },
  { from: CrmContractStatus.Active, to: CrmContractStatus.Terminated, label: 'Terminate' },
];

export function Component() {
  const [statusFilter, setStatusFilter] = useState<CrmContractStatus | undefined>(undefined);
  const query = useContracts(statusFilter ? { status: statusFilter } : undefined);
  const create = useCreateContract();
  const updateStatus = useUpdateContractStatus();
  const del = useDeleteContract();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', value: '', currency: 'USD', startDate: '', endDate: '', autoRenew: false });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: CrmContractCreateRequest = {
      title: form.title.trim(),
      value: form.value ? Number(form.value) : 0,
      currency: form.currency || 'USD',
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
      autoRenew: form.autoRenew,
    };
    create.mutate(data, { onSuccess: () => { setOpen(false); setForm({ title: '', value: '', currency: 'USD', startDate: '', endDate: '', autoRenew: false }); } });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-extrabold text-text-primary tracking-tight">CRM — Contracts</h1>
          <p className="text-sm text-text-secondary mt-1">Track agreements through their lifecycle — draft, signature, active, renewal.</p>
        </div>
        <button onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-bg bg-brand hover:bg-brand-light transition-all">
          <Plus className="w-3.5 h-3.5" strokeWidth={2.5} /> New contract
        </button>
      </div>

      <div className="flex gap-1.5 flex-wrap">
        <button onClick={() => setStatusFilter(undefined)}
          className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-all ${!statusFilter ? 'bg-brand-soft text-brand border-border-glow' : 'bg-bg-elevated text-text-secondary border-border-subtle hover:border-border-medium'}`}>All</button>
        {Object.entries(CRM_CONTRACT_STATUS_LABELS).map(([v, label]) => {
          const val = Number(v) as CrmContractStatus;
          return (
            <button key={v} onClick={() => setStatusFilter(val)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-all ${statusFilter === val ? 'bg-brand-soft text-brand border-border-glow' : 'bg-bg-elevated text-text-secondary border-border-subtle hover:border-border-medium'}`}>{label}</button>
          );
        })}
      </div>

      <DataView query={query}
        empty={<div className="flex flex-col items-center justify-center py-20 text-center">
          <FileSignature className="w-10 h-10 text-text-muted mb-3" strokeWidth={1.2} />
          <p className="text-text-secondary font-semibold">No contracts yet</p>
        </div>}>
        {(contracts) => (
          <div className="overflow-x-auto rounded-card border-thin border-border-subtle">
            <table className="w-full min-w-[760px] border-collapse">
              <thead>
                <tr className="bg-bg-elevated text-left">
                  {['Contract #', 'Title', 'Value', 'Status', 'Start', 'End', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-text-muted">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {contracts.map((c: CrmContractDto) => (
                  <tr key={c.id} className="border-t border-border-subtle hover:bg-glass-1">
                    <td className="px-4 py-3 text-xs font-semibold text-brand">{c.contractNumber}</td>
                    <td className="px-4 py-3 text-sm text-text-primary">{c.title}{c.autoRenew && <span className="ml-1.5 text-[10px] text-text-muted">· auto-renew</span>}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-text-primary tabular-nums">{money(c.value, c.currency)}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_STYLES[c.status]}`}>{CRM_CONTRACT_STATUS_LABELS[c.status]}</span></td>
                    <td className="px-4 py-3 text-xs text-text-muted tabular-nums">{c.startDate ? new Date(c.startDate).toLocaleDateString() : '—'}</td>
                    <td className="px-4 py-3 text-xs text-text-muted tabular-nums">{c.endDate ? new Date(c.endDate).toLocaleDateString() : '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {NEXT_STATUS.filter((t) => t.from === c.status).map((t) => (
                          <button key={t.to} onClick={() => updateStatus.mutate({ id: c.id, status: t.to })}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold border-thin border-border-medium text-text-secondary hover:text-text-primary hover:bg-glass-2 transition-all">
                            {t.label}
                          </button>
                        ))}
                        <button onClick={() => confirmDialog({ message: 'Delete this contract?', confirmText: 'Delete', danger: true }).then((ok) => { if (ok) del.mutate(c.id); })} className="text-text-muted hover:text-danger"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DataView>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <form onSubmit={submit} className="w-full max-w-md bg-bg-card border-thin border-border-subtle rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-text-primary">New contract</h2>
              <button type="button" onClick={() => setOpen(false)} className="text-text-muted hover:text-text-primary"><X className="w-4 h-4" /></button>
            </div>
            <input className={inputCls} placeholder="Title (e.g. Master Services Agreement)" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
            <div className="flex gap-2">
              <input className={inputCls} type="number" min="0" step="0.01" placeholder="Value" value={form.value} onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))} />
              <input className={`${inputCls} w-28`} placeholder="USD" value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value.toUpperCase() }))} maxLength={10} />
            </div>
            <div className="flex gap-2">
              <label className="flex-1 text-xs text-text-muted">Start<input type="date" className={inputCls} value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} /></label>
              <label className="flex-1 text-xs text-text-muted">End<input type="date" className={inputCls} value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} /></label>
            </div>
            <label className="flex items-center gap-2 text-xs text-text-secondary">
              <input type="checkbox" checked={form.autoRenew} onChange={(e) => setForm((f) => ({ ...f, autoRenew: e.target.checked }))} /> Auto-renew
            </label>
            <button type="submit" disabled={create.isPending || !form.title.trim()}
              className="w-full py-2 rounded-xl bg-brand text-bg text-sm font-bold hover:bg-brand-light disabled:opacity-50">
              {create.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Create contract'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
