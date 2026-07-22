import { useState } from 'react';
import { Plus, Trash2, X, Loader2, Layers, FileText, Calendar, Percent } from 'lucide-react';
import { confirmDialog } from '@/shared/ui/confirm';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { crmApi } from '../api/crm.api';
import { toast } from 'sonner';
import { ApiError } from '@/shared/lib/api-client';

const PT_KEY = ['crm', 'payment-terms'] as const;

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
  const { data, isLoading } = useQuery({ queryKey: PT_KEY, queryFn: () => crmApi.getPaymentTerms() });
  const terms: any[] = (data as unknown as any[]) ?? [];
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

      <SlideOver
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="New Payment Term"
        subtitle="Define payment terms for invoices"
        footer={
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-xl text-xs font-semibold text-text-secondary border border-border-subtle hover:border-border-medium transition-all">Cancel</button>
            <button
              type="submit"
              form="pt-form"
              disabled={createMut.isPending || !form.name.trim()}
              className="flex-none px-6 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-brand text-bg text-sm font-bold hover:bg-brand-light disabled:opacity-50 disabled:cursor-not-allowed transition-all">
              {createMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Term'}
            </button>
          </div>
        }
      >
        <form id="pt-form" onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Name *</label>
            <div className="relative">
              <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
              <input
                required
                placeholder="e.g. Net 30"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)]"
                style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Description</label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
              <textarea
                rows={2}
                placeholder="Optional description…"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)] resize-none"
                style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Net Days</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
                <input
                  type="number"
                  value={form.netDays}
                  onChange={e => setForm(f => ({ ...f, netDays: Number(e.target.value) }))}
                  min={0}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary focus:outline-none focus:border-[rgba(0,217,138,0.50)]"
                  style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Deposit %</label>
              <div className="relative">
                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
                <input
                  type="number"
                  value={form.depositPercent}
                  onChange={e => setForm(f => ({ ...f, depositPercent: Number(e.target.value) }))}
                  min={0}
                  max={100}
                  step={0.01}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary focus:outline-none focus:border-[rgba(0,217,138,0.50)]"
                  style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }}
                />
              </div>
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={e => setForm(f => ({ ...f, isDefault: e.target.checked }))}
              className="rounded border-border-subtle text-brand focus:ring-brand/40"
            />
            Set as default
          </label>
        </form>
      </SlideOver>
    </div>
  );
}
