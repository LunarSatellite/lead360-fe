import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Trash2, Percent, Globe, X } from 'lucide-react';
import { confirmDialog } from '@/shared/ui/confirm';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { crmApi } from '../api/crm.api';
import { CrmTaxType, CRM_TAX_TYPE_LABEL, type CrmTaxRuleDto, type CrmTaxTypeValue } from '../types/crm.types';
import { toast } from 'sonner';
import { ApiError } from '@/shared/lib/api-client';

const inputCls = 'w-full px-3 py-2 rounded-xl bg-bg-input border-thin border-border-subtle text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-glow';

const TAX_KEY = ['crm', 'tax-rules'] as const;

export function Component() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: TAX_KEY, queryFn: () => crmApi.getTaxRules() });
  const rules: CrmTaxRuleDto[] = (data as unknown as CrmTaxRuleDto[]) ?? [];
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', jurisdiction: '', taxType: CrmTaxType.VAT as CrmTaxTypeValue, rate: 0, appliesToAllProducts: true });

  const createMut = useMutation({
    mutationFn: (d: CrmTaxRuleDto) => crmApi.createTaxRule(d as any),
    onSuccess: () => { qc.invalidateQueries({ queryKey: TAX_KEY }); setShowCreate(false); setForm({ name: '', jurisdiction: '', taxType: CrmTaxType.VAT, rate: 0, appliesToAllProducts: true }); toast.success('Tax rule created.'); },
    onError: (e: ApiError) => toast.error(e.message),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => crmApi.deleteTaxRule(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: TAX_KEY }); setSelectedId(null); toast.success('Tax rule deleted.'); },
    onError: (e: ApiError) => toast.error(e.message),
  });
  const toggleMut = useMutation({
    mutationFn: (d: CrmTaxRuleDto) => crmApi.updateTaxRule(d.id, { isActive: !d.isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: TAX_KEY }),
    onError: (e: ApiError) => toast.error(e.message),
  });

  const selected = rules.find(r => r.id === selectedId);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    createMut.mutate(form as any);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-extrabold text-text-primary tracking-tight">CRM — Tax Rules</h1>
          <p className="text-sm text-text-secondary mt-1">Auto-calculate tax on quotes and invoices based on customer jurisdiction.</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-bg bg-brand hover:bg-brand-light transition-all">
          <Plus className="w-3.5 h-3.5" /> New tax rule
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5">
        <div className="flex flex-col gap-2">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-text-muted">Loading...</div>
          ) : rules.length === 0 ? (
            <div className="rounded-card border-thin border-border-subtle bg-glass-1 p-8 text-center">
              <Percent className="w-9 h-9 text-text-muted mx-auto mb-3" strokeWidth={1.2} />
              <p className="text-sm text-text-secondary font-semibold">No tax rules yet</p>
              <button onClick={() => setShowCreate(true)} className="mt-3 text-xs font-bold text-brand hover:underline">Create your first</button>
            </div>
          ) : rules.map(r => (
            <button key={r.id} onClick={() => setSelectedId(r.id)}
              className={`text-left rounded-card border-thin p-3.5 transition-all ${selectedId === r.id ? 'bg-brand-soft border-border-glow' : 'bg-glass-1 border-border-subtle hover:bg-glass-2'}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-text-primary">{r.name}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${r.isActive ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'}`}>{r.isActive ? 'Active' : 'Inactive'}</span>
              </div>
              <div className="text-[11px] text-text-muted mt-1 flex items-center gap-2">
                <Globe className="w-3 h-3" /> {r.jurisdiction} · {CRM_TAX_TYPE_LABEL[r.taxType]} · {r.rate}%
              </div>
            </button>
          ))}
        </div>

        <div className="rounded-card border-thin border-border-subtle bg-glass-1 p-4 min-h-[200px]">
          {!selected ? (
            <div className="flex items-center justify-center h-full text-sm text-text-muted py-16">Select a tax rule to view details.</div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-text-primary">{selected.name}</h2>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${selected.isActive ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'}`}>{selected.isActive ? 'Active' : 'Inactive'}</span>
                  </div>
                  <p className="text-xs text-text-muted">{selected.jurisdiction} · {CRM_TAX_TYPE_LABEL[selected.taxType]} · {selected.rate}%</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleMut.mutate(selected)}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border-thin border-border-medium transition-all ${selected.isActive ? 'text-text-secondary hover:text-danger hover:border-danger/40' : 'text-success'}`}>
                    {selected.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button onClick={() => confirmDialog({ message: `Delete "${selected.name}"?`, confirmText: 'Delete', danger: true }).then((ok) => { if (ok) deleteMut.mutate(selected.id); })}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border-thin border-border-medium text-text-secondary hover:text-danger hover:border-danger/40 transition-all">
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                </div>
              </div>
              <div className="rounded-card border-thin border-border-subtle bg-glass-2 p-3 space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-text-muted">Jurisdiction</span><span className="text-text-primary">{selected.jurisdiction}</span></div>
                <div className="flex justify-between"><span className="text-text-muted">Tax Type</span><span className="text-text-primary">{CRM_TAX_TYPE_LABEL[selected.taxType]}</span></div>
                <div className="flex justify-between"><span className="text-text-muted">Rate</span><span className="text-text-primary">{selected.rate}%</span></div>
                <div className="flex justify-between"><span className="text-text-muted">Applies to</span><span className="text-text-primary">{selected.appliesToAllProducts ? 'All products' : 'Specific categories'}</span></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showCreate && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <form onSubmit={submit} className="w-full max-w-md bg-bg-card border-thin border-border-subtle rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-text-primary">New tax rule</h2>
              <button type="button" onClick={() => setShowCreate(false)} className="text-text-muted hover:text-text-primary"><X className="w-4 h-4" /></button>
            </div>
            <input className={inputCls} placeholder="Name (e.g. Nepal VAT)" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            <input className={inputCls} placeholder="Jurisdiction (e.g. Nepal)" value={form.jurisdiction} onChange={e => setForm(f => ({ ...f, jurisdiction: e.target.value }))} required />
            <div className="grid grid-cols-2 gap-3">
              <select className={inputCls} value={form.taxType} onChange={e => setForm(f => ({ ...f, taxType: Number(e.target.value) as CrmTaxTypeValue }))}>
                {Object.entries(CrmTaxType).filter(([k]) => isNaN(Number(k))).map(([k, v]) => (
                  <option key={v} value={v}>{k}</option>
                ))}
              </select>
              <div className="flex items-center gap-2">
                <input type="number" className={inputCls} placeholder="Rate" value={form.rate || ''} onChange={e => setForm(f => ({ ...f, rate: Number(e.target.value) }))} min={0} max={100} step={0.01} />
                <span className="text-text-muted text-sm">%</span>
              </div>
            </div>
            <label className="flex items-center gap-2 text-xs text-text-secondary">
              <input type="checkbox" checked={form.appliesToAllProducts} onChange={e => setForm(f => ({ ...f, appliesToAllProducts: e.target.checked }))} />
              Applies to all products
            </label>
            <button type="submit" disabled={createMut.isPending || !form.name.trim() || !form.jurisdiction.trim()}
              className="w-full py-2 rounded-xl bg-brand text-bg text-sm font-bold hover:bg-brand-light disabled:opacity-50">
              {createMut.isPending ? 'Creating...' : 'Create'}
            </button>
          </form>
        </div>,
        document.body
      )}
    </div>
  );
}
