import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, X, Loader2, Trash2, Pencil } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { crmApi } from '../api/crm.api';
import { toast } from 'sonner';

const inputCls = 'w-full px-3 py-2 rounded-xl bg-bg-input border-thin border-border-subtle text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-glow';

const RULES_KEY = ['crm', 'scoring-rules'] as const;

export function Component() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: RULES_KEY, queryFn: () => crmApi.getScoringRules() });
  const rules: any[] = (data as any) ?? [];
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ eventType: '', label: '', points: 10 });

  const createMut = useMutation({
    mutationFn: (d: any) => crmApi.createScoringRule(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: RULES_KEY }); setShowForm(false); setForm({ eventType: '', label: '', points: 10 }); toast.success('Rule created.'); },
    onError: (e: any) => toast.error(e?.message || 'Error'),
  });
  const updateMut = useMutation({
    mutationFn: (d: any) => crmApi.updateScoringRule(d.id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: RULES_KEY }); setShowForm(false); setEditId(null); setForm({ eventType: '', label: '', points: 10 }); toast.success('Rule updated.'); },
    onError: (e: any) => toast.error(e?.message || 'Error'),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => crmApi.deleteScoringRule(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: RULES_KEY }); toast.success('Deleted.'); },
    onError: (e: any) => toast.error(e?.message || 'Error'),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { eventType: form.eventType.trim(), label: form.label.trim() || undefined, points: form.points };
    if (editId) updateMut.mutate({ id: editId, ...data });
    else createMut.mutate(data);
  };

  const openEdit = (r: any) => {
    setEditId(r.id); setForm({ eventType: r.eventType, label: r.label || '', points: r.points }); setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-extrabold text-text-primary tracking-tight">Lead Scoring Rules</h1>
          <p className="text-sm text-text-secondary mt-1">Define events and their point values. When a trigger event occurs, the lead's score increases automatically. At 50+ points, the lead is promoted to MQL and auto-assigned.</p>
        </div>
        <button onClick={() => { setEditId(null); setForm({ eventType: '', label: '', points: 10 }); setShowForm(true); }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-bg bg-brand hover:bg-brand-light transition-all">
          <Plus className="w-3.5 h-3.5" /> New rule
        </button>
      </div>

      <div className="overflow-x-auto rounded-card border-thin border-border-subtle">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-glass-2 text-left">
              {['Event Type', 'Label', 'Points', 'Status', 'Actions'].map(h => (
                <th key={h} className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-text-muted">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-text-muted"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></td></tr>
            ) : rules.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-sm text-text-muted"><p>No scoring rules yet.</p></td></tr>
            ) : rules.map((r: any) => (
              <tr key={r.id} className="border-t border-border-subtle hover:bg-glass-1">
                <td className="px-4 py-3 text-xs font-mono font-semibold text-brand">{r.eventType}</td>
                <td className="px-4 py-3 text-sm text-text-primary">{r.label || '—'}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs font-bold ${r.points > 0 ? 'text-success bg-success-soft' : 'text-danger bg-danger-soft'}`}>{r.points > 0 ? '+' : ''}{r.points}</span></td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${r.isActive ? 'text-success border-success/30 bg-success/10' : 'text-text-muted border-border-medium bg-glass-2'}`}>{r.isActive ? 'Active' : 'Inactive'}</span></td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(r)} className="p-1 text-text-muted hover:text-brand"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => deleteMut.mutate(r.id)} className="p-1 text-text-muted hover:text-danger"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-card border-thin border-border-subtle bg-glass-1 p-4 text-sm">
        <p className="font-semibold text-text-primary mb-1">How it works</p>
        <ul className="text-xs text-text-muted space-y-1 list-disc list-inside">
          <li>When a lead performs an action matching an Event Type, the Points are added to their score.</li>
          <li>Scores are capped at 100.</li>
          <li>When a lead reaches <strong>50 points</strong>, they are promoted to <strong>MQL</strong> and auto-assigned from the Sales Lead Pool.</li>
          <li>Trigger events manually from the Lead detail page, or automate via webhooks/integrations.</li>
        </ul>
      </div>

      {showForm && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <form onSubmit={submit} className="w-full max-w-md bg-bg border-thin border-border-subtle rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between"><h2 className="text-sm font-bold">{editId ? 'Edit' : 'New'} Scoring Rule</h2>
              <button type="button" onClick={() => { setShowForm(false); setEditId(null); }} className="text-text-muted hover:text-text-primary"><X className="w-4 h-4" /></button></div>
            <input className={inputCls} placeholder="Event type (e.g. email_opened)" value={form.eventType} onChange={e => setForm(f => ({ ...f, eventType: e.target.value }))} required />
            <input className={inputCls} placeholder="Label (e.g. Email Opened)" value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} />
            <div><label className="text-xs text-text-muted block mb-1">Points</label>
              <input type="number" className={inputCls} value={form.points} onChange={e => setForm(f => ({ ...f, points: Number(e.target.value) }))} /></div>
            <button type="submit" disabled={createMut.isPending || updateMut.isPending || !form.eventType.trim()}
              className="w-full py-2 rounded-xl bg-brand text-bg text-sm font-bold hover:bg-brand-light disabled:opacity-50">{editId ? 'Update' : 'Create'}</button>
          </form>
        </div>,
        document.body
      )}
    </div>
  );
}
