import { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { DataView } from '@/shared/ui/DataView';
import { confirmDialog } from '@/shared/ui/confirm';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { crmApi } from '../api/crm.api';
import { toast } from 'sonner';
import { ApiError } from '@/shared/lib/api-client';

const inputCls = 'w-full px-3 py-2 rounded-xl bg-bg-input border-thin border-border-subtle text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-glow';

const PT_KEY = ['crm', 'payment-terms'] as const;

export function Component() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: PT_KEY, queryFn: () => crmApi.getPaymentTerms() });
  const terms: any[] = data ?? [];
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', netDays: 30, depositPercent: 0, isDefault: false });

  const createMut = useMutation({
    mutationFn: (d: any) => crmApi.createPaymentTerm(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: PT_KEY }); setShowCreate(false); setForm({ name: '', description: '', netDays: 30, depositPercent: 0, isDefault: false }); toast.success('Payment term created.'); },
    onError: (e: ApiError) => toast.error(e.message),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => crmApi.deletePaymentTerm(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: PT_KEY }); setSelectedId(null); toast.success('Payment term deleted.'); },
    onError: (e: ApiError) => toast.error(e.message),
  });
  const toggleMut = useMutation({
    mutationFn: (t: any) => crmApi.updatePaymentTerm(t.id, { isActive: !t.isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: PT_KEY }),
    onError: (e: ApiError) => toast.error(e.message),
  });
  const setDefaultMut = useMutation({
    mutationFn: (t: any) => crmApi.updatePaymentTerm(t.id, { isDefault: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: PT_KEY }),
    onError: (e: ApiError) => toast.error(e.message),
  });

  const selected = terms.find((t: any) => t.id === selectedId);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    createMut.mutate(form);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-extrabold text-text-primary tracking-tight">CRM — Payment Terms</h1>
          <p className="text-sm text-text-secondary mt-1">Define payment terms and apply them to accounts. Invoices auto-calculate due dates.</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-bg bg-brand hover:bg-brand-light transition-all">
          <Plus className="w-3.5 h-3.5" /> New term
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5">
        <div className="flex flex-col gap-2">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-text-muted">Loading...</div>
          ) : terms.length === 0 ? (
            <div className="rounded-card border-thin border-border-subtle bg-glass-1 p-8 text-center">
              <p className="text-sm text-text-secondary font-semibold">No payment terms yet</p>
              <button onClick={() => setShowCreate(true)} className="mt-3 text-xs font-bold text-brand hover:underline">Create your first</button>
            </div>
          ) : terms.map((t: any) => (
            <button key={t.id} onClick={() => setSelectedId(t.id)}
              className={`text-left rounded-card border-thin p-3.5 transition-all ${selectedId === t.id ? 'bg-brand-soft border-border-glow' : 'bg-glass-1 border-border-subtle hover:bg-glass-2'}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-text-primary">{t.name}</span>
                <div className="flex items-center gap-1.5">
                  {t.isDefault && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-warning-soft text-warning">Default</span>}
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${t.isActive ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'}`}>{t.isActive ? 'Active' : 'Inactive'}</span>
                </div>
              </div>
              <div className="text-[11px] text-text-muted mt-1">Net {t.netDays}{t.depositPercent > 0 ? ` · ${t.depositPercent}% deposit` : ''}</div>
            </button>
          ))}
        </div>

        <div className="rounded-card border-thin border-border-subtle bg-glass-1 p-4 min-h-[200px]">
          {!selected ? (
            <div className="flex items-center justify-center h-full text-sm text-text-muted py-16">Select a payment term to view details.</div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-text-primary">{selected.name}</h2>
                    {selected.isDefault && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-warning-soft text-warning">Default</span>}
                  </div>
                  <p className="text-xs text-text-muted">{selected.description || 'No description'}</p>
                </div>
                <div className="flex items-center gap-2">
                  {!selected.isDefault && (
                    <button onClick={() => setDefaultMut.mutate(selected)}
                      className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border-thin border-border-medium text-text-secondary hover:text-warning hover:border-warning/40 transition-all">Set as default</button>
                  )}
                  <button onClick={() => toggleMut.mutate(selected)}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border-thin border-border-medium transition-all ${selected.isActive ? 'text-text-secondary hover:text-danger' : 'text-success'}`}>
                    {selected.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button onClick={() => confirmDialog({ message: `Delete "${selected.name}"?`, confirmText: 'Delete', danger: true }).then((ok) => { if (ok) deleteMut.mutate(selected.id); })}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border-thin border-border-medium text-text-secondary hover:text-danger transition-all">
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                </div>
              </div>
              <div className="rounded-card border-thin border-border-subtle bg-glass-2 p-3 space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-text-muted">Net Days</span><span className="text-text-primary">{selected.netDays}</span></div>
                <div className="flex justify-between"><span className="text-text-muted">Deposit %</span><span className="text-text-primary">{selected.depositPercent}%</span></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <form onSubmit={submit} className="w-full max-w-md bg-bg-card border-thin border-border-subtle rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-text-primary">New payment term</h2>
              <button type="button" onClick={() => setShowCreate(false)} className="text-text-muted hover:text-text-primary"><X className="w-4 h-4" /></button>
            </div>
            <input className={inputCls} placeholder="Name (e.g. Net 30)" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            <input className={inputCls} placeholder="Description (optional)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-[11px] text-text-muted block mb-1">Net Days</label><input type="number" className={inputCls} value={form.netDays} onChange={e => setForm(f => ({ ...f, netDays: Number(e.target.value) }))} min={0} /></div>
              <div><label className="text-[11px] text-text-muted block mb-1">Deposit %</label><input type="number" className={inputCls} value={form.depositPercent} onChange={e => setForm(f => ({ ...f, depositPercent: Number(e.target.value) }))} min={0} max={100} step={0.01} /></div>
            </div>
            <label className="flex items-center gap-2 text-xs text-text-secondary">
              <input type="checkbox" checked={form.isDefault} onChange={e => setForm(f => ({ ...f, isDefault: e.target.checked }))} />
              Set as default
            </label>
            <button type="submit" disabled={createMut.isPending || !form.name.trim()}
              className="w-full py-2 rounded-xl bg-brand text-bg text-sm font-bold hover:bg-brand-light disabled:opacity-50">
              {createMut.isPending ? 'Creating...' : 'Create'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
