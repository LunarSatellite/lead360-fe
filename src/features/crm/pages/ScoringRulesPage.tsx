import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, X, Loader2, Trash2, Pencil } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { crmApi } from '../api/crm.api';
import { toast } from 'sonner';

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

  const submit = (e: React.SubmitEvent) => {
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
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-extrabold text-text-primary tracking-tight">Lead Scoring Rules</h1>
          <p className="text-sm text-text-secondary mt-1">Define events and their point values.When a trigger event occurs,the lead's score increases automatically.At 50+ points, the lead is promoted to MQL and auto-assigned.</p>
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
        <div className="fixed inset-0 z-[9999] flex items-center justify-end pr-4 bg-black/40 backdrop-blur-sm">
          <form
            onSubmit={submit}
            className="drawer-slide-in relative w-[640px] flex flex-col overflow-hidden"
            style={{
              borderRadius: 18,
              background: 'var(--bg-card)',
              border: '1px solid rgba(0,217,138,0.2)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.7), 0 0 24px rgba(0,217,138,0.25), inset 0 1px 0 rgba(0,255,163,0.05)',
              maxHeight: 'calc(100vh - 32px)',
            }}
          >
            {/* Accent bar */}
            <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, #00D98A 35%, #00FFA3 65%, transparent)', flexShrink: 0 }} />
            <div className="flex items-start justify-between px-6 py-4 border-b border-border-subtle">
              <div>
                <h2
                  className="text-base font-extrabold leading-tight"
                  style={{
                    background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--primary) 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {editId ? 'Edit' : 'New'} Scoring Rule
                </h2>
                <p className="text-xs text-text-muted mt-0.5">Define an event and its point value</p>
              </div>
              <button type="button" onClick={() => { setShowForm(false); setEditId(null); }} className="text-text-muted hover:text-text-primary mt-0.5">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 px-6 py-5 space-y-4 overflow-y-auto">
              {/* Event type */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Event type</label>
                <input
                  className="w-full px-4 py-2.5 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)]"
                  style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }}
                  placeholder="e.g. email_opened"
                  value={form.eventType}
                  onChange={e => setForm(f => ({ ...f, eventType: e.target.value }))}
                  required
                />
              </div>
              {/* Label */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Label</label>
                <input
                  className="w-full px-4 py-2.5 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)]"
                  style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }}
                  placeholder="e.g. Email Opened"
                  value={form.label}
                  onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                />
              </div>
              {/* Points */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Points</label>
                <input
                  type="number"
                  className="w-full px-4 py-2.5 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)]"
                  style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }}
                  value={form.points}
                  onChange={e => setForm(f => ({ ...f, points: Number(e.target.value) }))}
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border-subtle">
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditId(null); }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-text-secondary border border-border-subtle hover:border-border-medium transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMut.isPending || updateMut.isPending || !form.eventType.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-bg bg-brand hover:bg-brand-light disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                {editId ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>,
        document.body
      )}
    </div>
  );
}
