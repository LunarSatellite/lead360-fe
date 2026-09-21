import { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Percent, Globe, X, Loader2, Layers, MapPin, ChevronDown } from 'lucide-react';
import { confirmDialog } from '@/shared/ui/confirm';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { crmApi } from '../api/crm.api';
import { CrmTaxType, CRM_TAX_TYPE_LABEL, type CrmTaxRuleDto, type CrmTaxTypeValue } from '../types/crm.types';
import { toast } from 'sonner';
import { ApiError } from '@/shared/lib/api-client';

const TAX_KEY = ['crm', 'tax-rules'] as const;

function SlideOver({ open, onClose, title, subtitle, children, footer }: { open: boolean; onClose: () => void; title: string; subtitle?: string; children: React.ReactNode; footer?: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end pr-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className="drawer-slide-in relative flex flex-col overflow-hidden"
        style={{
          width: '480px',
          borderRadius: 18,
          background: 'var(--bg-card)',
          border: '1px solid rgba(0,217,138,0.2)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.7), 0 0 24px rgba(0,217,138,0.25), inset 0 1px 0 rgba(0,255,163,0.05)',
          maxHeight: 'calc(100vh - 32px)',
        }}
      >
        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, #00D98A 35%, #00FFA3 65%, transparent)', flexShrink: 0 }} />
        <div className="flex items-start justify-between px-6 py-4 border-b border-border-subtle shrink-0">
          <div>
            <h2 className="text-base font-extrabold leading-tight" style={{ background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--primary) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{title}</h2>
            {subtitle && <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary mt-0.5"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && (
          <div className="shrink-0 px-6 py-4 border-t border-border-subtle">{footer}</div>
        )}
      </div>
    </div>
  );
}

export function Component() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: TAX_KEY, queryFn: () => crmApi.getTaxRules() });
  const rules: CrmTaxRuleDto[] = (data as unknown as CrmTaxRuleDto[]) ?? [];
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', jurisdiction: '', taxType: CrmTaxType.VAT as CrmTaxTypeValue, rate: 0, appliesToAllProducts: true });
  const [taxTypeOpen, setTaxTypeOpen] = useState(false);
  const taxTypeDropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (taxTypeDropRef.current && !taxTypeDropRef.current.contains(e.target as Node)) setTaxTypeOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

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

      <SlideOver
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="New Tax Rule"
        subtitle="Set up tax rates by jurisdiction"
        footer={
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-xl text-xs font-semibold text-text-secondary border border-border-subtle hover:border-border-medium transition-all">Cancel</button>
            <button
              type="submit"
              form="tr-form"
              disabled={createMut.isPending || !form.name.trim() || !form.jurisdiction.trim()}
              className="flex-none px-6 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-brand text-bg text-sm font-bold hover:bg-brand-light disabled:opacity-50 disabled:cursor-not-allowed transition-all">
              {createMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Rule'}
            </button>
          </div>
        }
      >
        <form id="tr-form" onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Name *</label>
            <div className="relative">
              <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
              <input
                required
                placeholder="e.g. Nepal VAT"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)]"
                style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Jurisdiction *</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
              <input
                required
                placeholder="e.g. Nepal"
                value={form.jurisdiction}
                onChange={e => setForm(f => ({ ...f, jurisdiction: e.target.value }))}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)]"
                style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Tax Type</label>
              <div className="relative" ref={taxTypeDropRef}>
                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none z-10" strokeWidth={1.6} />
                <button
                  type="button"
                  onClick={() => setTaxTypeOpen(o => !o)}
                  className="w-full flex items-center gap-2 pl-9 pr-3 py-2 rounded-xl text-sm text-text-primary text-left"
                  style={{
                    backgroundColor: '#1A332C',
                    border: `1px solid ${taxTypeOpen ? 'rgba(0,217,138,0.50)' : 'rgba(0,217,138,0.20)'}`,
                    boxShadow: taxTypeOpen ? '0 0 0 1px rgba(0,217,138,0.50), 0 0 10px rgba(0,217,138,0.20), 0 0 20px rgba(0,217,138,0.08)' : 'none',
                    outline: 'none',
                    transition: 'box-shadow 0.2s ease',
                  }}
                >
                  <span className="flex-1 font-medium text-text-primary">
                    {Object.entries(CrmTaxType).filter(([k]) => isNaN(Number(k))).find(([, v]) => Number(v) === form.taxType)?.[0] ?? 'Select type'}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-text-muted transition-transform duration-200 ${taxTypeOpen ? 'rotate-180' : ''}`} strokeWidth={1.6} />
                </button>
                {taxTypeOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 z-20 overflow-hidden"
                    style={{ borderRadius: 12, background: 'var(--bg-card)', border: '1px solid rgba(0,217,138,0.20)', boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 12px rgba(0,217,138,0.08)' }}
                  >
                    {Object.entries(CrmTaxType).filter(([k]) => isNaN(Number(k))).map(([k, v]) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => { setForm(f => ({ ...f, taxType: Number(v) as CrmTaxTypeValue })); setTaxTypeOpen(false); }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium transition-colors hover:bg-[rgba(0,217,138,0.08)] ${form.taxType === Number(v) ? 'bg-[rgba(0,217,138,0.08)]' : ''} text-text-secondary`}
                      >
                        <Percent className="w-3 h-3 text-text-muted shrink-0" strokeWidth={1.6} />
                        {k}
                        {form.taxType === Number(v) && <span className="ml-auto text-[10px] font-bold text-text-muted">selected</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Rate</label>
              <div className="relative">
                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
                <input
                  type="number"
                  value={form.rate || ''}
                  onChange={e => setForm(f => ({ ...f, rate: Number(e.target.value) }))}
                  min={0}
                  max={100}
                  step={0.01}
                  placeholder="0.00"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)]"
                  style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }}
                />
              </div>
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer">
            <input
              type="checkbox"
              checked={form.appliesToAllProducts}
              onChange={e => setForm(f => ({ ...f, appliesToAllProducts: e.target.checked }))}
              className="rounded border-border-subtle text-brand focus:ring-brand/40"
            />
            Applies to all products
          </label>
        </form>
      </SlideOver>
    </div>
  );
}
