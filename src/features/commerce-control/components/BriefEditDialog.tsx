import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Loader2, Save, X } from 'lucide-react';
import { stylemintCommerceApi } from '../api/stylemint-commerce.api';

type Props = { id: string; onClose: () => void; onSaved: () => void };
const record = (value: unknown) => value && typeof value === 'object' ? value as Record<string, unknown> : {};
const text = (value: unknown) => String(value ?? '');

export function BriefEditDialog({ id, onClose, onSaved }: Props) {
  const details = useQuery({ queryKey: ['stylemint-vendor-brief', id], queryFn: () => stylemintCommerceApi.vendorBrief(id), retry: false });
  const [form, setForm] = useState({ title: '', primaryGoal: '1', commissionMinPercent: '5', commissionMaxPercent: '15', boostBudgetAmount: '0', boostBudgetCurrency: 'CDF' });
  useEffect(() => {
    if (!details.data) return;
    const root = details.data.data && typeof details.data.data === 'object' ? record(details.data.data) : details.data;
    const commission = record(root.commissionRange);
    setForm({
      title: text(root.title), primaryGoal: text(root.primaryGoal || 1),
      commissionMinPercent: String(Number(commission.minPercent ?? 0.05) * 100),
      commissionMaxPercent: String(Number(commission.maxPercent ?? 0.15) * 100),
      boostBudgetAmount: text(root.boostBudgetAmount || 0), boostBudgetCurrency: text(root.boostBudgetCurrency || 'CDF'),
    });
  }, [details.data]);
  const save = useMutation({
    mutationFn: () => stylemintCommerceApi.updateVendorBrief(id, {
      title: form.title.trim(), primaryGoal: Number(form.primaryGoal),
      commissionRange: { minPercent: Number(form.commissionMinPercent) / 100, maxPercent: Number(form.commissionMaxPercent) / 100 },
      boostBudgetAmount: Number(form.boostBudgetAmount), boostBudgetCurrency: form.boostBudgetCurrency,
    }), onSuccess: onSaved,
  });
  const set = (key: keyof typeof form, next: string) => setForm((current) => ({ ...current, [key]: next }));
  const valid = form.title.trim() && Number(form.commissionMinPercent) >= 0 && Number(form.commissionMaxPercent) >= Number(form.commissionMinPercent) && Number(form.commissionMaxPercent) <= 100 && Number(form.boostBudgetAmount) >= 0;
  return <div className="fixed inset-0 z-[70] flex items-center justify-center p-4"><button aria-label="Close" className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} /><form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="relative w-full max-w-3xl rounded-[24px] border border-brand/20 bg-bg-card shadow-2xl">
    <header className="flex items-start justify-between border-b border-border-subtle px-5 py-4"><div><p className="text-[10px] font-extrabold uppercase tracking-wider text-brand">Stylemint Brand Studio</p><h3 className="mt-1 text-xl font-black text-text-primary">Edit commercial brief</h3></div><button type="button" onClick={onClose}><X className="h-4 w-4 text-text-muted" /></button></header>
    {details.isLoading ? <div className="flex h-48 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-brand" /></div> : <div className="grid gap-4 p-5 md:grid-cols-2">
      <Input label="Brief title" value={form.title} onChange={(v) => set('title', v)} required />
      <label className="space-y-1.5"><span className="text-[10px] font-extrabold uppercase tracking-wider text-text-muted">Primary goal</span><select value={form.primaryGoal} onChange={(e) => set('primaryGoal', e.target.value)} className={control}><option value="1">First purchase</option><option value="2">Reactivate customers</option><option value="3">Launch a variant</option><option value="4">Move slow stock</option><option value="5">Seasonal awareness</option><option value="6">Product education</option><option value="7">Test an audience</option></select></label>
      <Input label="Minimum commission %" type="number" value={form.commissionMinPercent} onChange={(v) => set('commissionMinPercent', v)} />
      <Input label="Maximum commission %" type="number" value={form.commissionMaxPercent} onChange={(v) => set('commissionMaxPercent', v)} />
      <Input label="Boost budget" type="number" value={form.boostBudgetAmount} onChange={(v) => set('boostBudgetAmount', v)} />
      <label className="space-y-1.5"><span className="text-[10px] font-extrabold uppercase tracking-wider text-text-muted">Currency</span><select value={form.boostBudgetCurrency} onChange={(e) => set('boostBudgetCurrency', e.target.value)} className={control}><option value="CDF">CDF</option><option value="USD">USD</option></select></label>
    </div>}
    <footer className="flex justify-end gap-2 border-t border-border-subtle px-5 py-4"><button type="button" onClick={onClose} className="rounded-xl border border-border-subtle px-4 py-2.5 text-xs font-bold text-text-secondary">Cancel</button><button disabled={save.isPending || !valid} className="flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-xs font-extrabold text-black disabled:opacity-40"><Save className="h-4 w-4" />{save.isPending ? 'Saving…' : 'Save brief'}</button></footer>
  </form></div>;
}
const control = 'w-full rounded-xl border border-border-subtle bg-bg-elevated px-3 py-2.5 text-sm text-text-primary outline-none focus:border-brand/50';
function Input({ label, value, onChange, type = 'text', required }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) { return <label className="space-y-1.5"><span className="text-[10px] font-extrabold uppercase tracking-wider text-text-muted">{label}</span><input className={control} type={type} step={type === 'number' ? 'any' : undefined} required={required} value={value} onChange={(e) => onChange(e.target.value)} /></label>; }
