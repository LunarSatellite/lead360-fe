import { useState } from 'react';
import { Plus, X, Trash2, Pencil, TrendingUp } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { crmApi } from '../api/crm.api';
import { toast } from 'sonner';

const COMP_KEY = ['crm', 'competitors'] as const;

export function Component() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', website: '', notes: '' });

  const { data } = useQuery({ queryKey: COMP_KEY, queryFn: () => crmApi.getCompetitors() });
  const competitors: any[] = (data as any) ?? [];
  const { data: analyticsRaw } = useQuery({ queryKey: ['crm', 'competitor-analytics'], queryFn: () => crmApi.getCompetitorAnalytics() });
  const analytics: any[] = (analyticsRaw as any) ?? [];
  const [detailId, setDetailId] = useState<string | null>(null);
  const { data: detailRaw } = useQuery({
    queryKey: ['crm', 'competitor-detail', detailId],
    queryFn: () => crmApi.getCompetitorDetail(detailId!),
    enabled: !!detailId,
  });
  const detail: any = detailRaw;

  const createMut = useMutation({
    mutationFn: (d: any) => editId ? crmApi.updateCompetitor(editId, d) : crmApi.createCompetitor(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: COMP_KEY }); setShowForm(false); setEditId(null); setForm({ name: '', website: '', notes: '' }); toast.success(editId ? 'Updated.' : 'Created.'); },
    onError: (e: any) => toast.error(e?.message || 'Error'),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => crmApi.deleteCompetitor(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: COMP_KEY }); qc.invalidateQueries({ queryKey: ['crm', 'competitor-analytics'] }); toast.success('Deleted.'); },
    onError: (e: any) => toast.error(e?.message || 'Error'),
  });

  const openEdit = (c: any) => { setEditId(c.id); setForm({ name: c.name, website: c.website || '', notes: c.notes || '' }); setShowForm(true); };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div><h1 className="text-xl font-extrabold text-text-primary tracking-tight">Competitors</h1>
          <p className="text-sm text-text-secondary mt-1">Track competitors across deals and analyze win/loss rates.</p></div>
        <button onClick={() => { setEditId(null); setForm({ name: '', website: '', notes: '' }); setShowForm(true); }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-bg bg-brand hover:bg-brand-light transition-all">
          <Plus className="w-3.5 h-3.5" /> Add competitor
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="overflow-x-auto rounded-card border-thin border-border-subtle">
          <table className="w-full border-collapse">
            <thead><tr className="bg-glass-2 text-left">
              <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-text-muted">Name</th>
              <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-text-muted">Website</th>
              <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-text-muted">Actions</th>
            </tr></thead>
            <tbody>
              {competitors.length === 0 ? (
                <tr><td colSpan={3} className="px-4 py-12 text-center text-sm text-text-muted">No competitors added yet.</td></tr>
              ) : competitors.map((c: any) => (
                <tr key={c.id} className="border-t border-border-subtle hover:bg-glass-1">
                  <td className="px-4 py-3 text-sm font-semibold text-text-primary">{c.name}</td>
                  <td className="px-4 py-3 text-xs text-text-muted">{c.website || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(c)} className="p-1 text-text-muted hover:text-brand"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => deleteMut.mutate(c.id)} className="p-1 text-text-muted hover:text-danger"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-card border-thin border-border-subtle bg-glass-1 p-4">
          <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5" /> Competitor Win/Loss Analysis</h3>
          {analytics.length === 0 ? (
            <p className="text-sm text-text-muted italic">No competitor data yet. Add competitors to deals and set outcomes.</p>
          ) : (
            <div className="space-y-3">
              {analytics.map((a: any) => (
                <div key={a.name} className="space-y-1">
                  <button onClick={() => setDetailId(detailId === a.name ? null : competitors.find((c: any) => c.name === a.name)?.id ?? null)}
                    className="w-full text-left">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-text-primary hover:text-brand transition-colors">{a.name}</span>
                      <span className="text-xs text-text-muted">{a.totalDeals} deal{a.totalDeals !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 rounded-full bg-glass-2 overflow-hidden">
                        <div className="h-full rounded-full bg-success" style={{ width: `${Math.max(a.winRatePct, 2)}%` }} />
                      </div>
                      <span className="text-xs font-bold text-text-primary tabular-nums w-10 text-right">{a.winRatePct}%</span>
                      <span className="text-[10px] text-text-muted w-16 text-right">{a.won}W {a.lost}L</span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-text-muted">
                      <span>Revenue won: <span className="text-success font-semibold">${(a.revenueWon || 0).toLocaleString()}</span></span>
                      <span>Lost: <span className="text-danger font-semibold">${(a.revenueLost || 0).toLocaleString()}</span></span>
                    </div>
                  </button>
                  {detailId === competitors.find((c: any) => c.name === a.name)?.id && detail && (
                    <div className="ml-2 pl-3 border-l-2 border-brand/30 space-y-1.5 py-1">
                      <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Quarterly Trend</p>
                      {detail.trends?.length > 0 ? detail.trends.map((t: any) => (
                        <div key={t.period} className="flex items-center gap-2 text-xs">
                          <span className="text-text-muted w-14">{t.period}</span>
                          <div className="flex-1 h-1.5 rounded-full bg-glass-2 overflow-hidden">
                            <div className="h-full rounded-full bg-success" style={{ width: `${Math.max(t.winRatePct, 2)}%` }} />
                          </div>
                          <span className="text-text-primary font-semibold tabular-nums w-8 text-right">{t.winRatePct}%</span>
                          <span className="text-text-muted text-[10px]">{t.won}W {t.lost}L</span>
                        </div>
                      )) : <p className="text-xs text-text-muted italic">No trend data.</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-end pr-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div
            className="drawer-slide-in relative w-[480px] flex flex-col overflow-hidden"
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
                >{editId ? 'Edit' : 'Add'} Competitor</h2>
                <p className="text-xs text-text-muted mt-0.5">{editId ? 'Update competitor details' : 'Add a competitor to track across deals'}</p>
              </div>
              <button onClick={() => setShowForm(false)} className="text-text-muted hover:text-text-primary mt-0.5">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form body */}
            <div className="flex-1 px-6 py-5 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-[auto_1fr] items-center gap-2">
                <span className="text-[10px] font-bold text-brand uppercase tracking-widest">Basic Info</span>
                <div className="h-px bg-brand/20" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Name <span className="text-danger">*</span></label>
                <div className="relative">
                  <input
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)]"
                    style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }}
                    placeholder="Competitor name"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Website</label>
                <div className="relative">
                  <input
                    type="url"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)]"
                    style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }}
                    placeholder="https://competitor.com"
                    value={form.website}
                    onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Notes</label>
                <div className="relative">
                  <textarea
                    rows={4}
                    className="w-full pl-3 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)] resize-none"
                    style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }}
                    placeholder="Win/loss notes, strengths, weaknesses…"
                    value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border-subtle">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-text-secondary border border-border-subtle hover:border-border-medium transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={createMut.isPending || !form.name.trim()}
                onClick={() => createMut.mutate({ name: form.name.trim(), website: form.website.trim() || undefined, notes: form.notes.trim() || undefined })}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-bg bg-brand hover:bg-brand-light disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {createMut.isPending ? (
                  <span className="w-3.5 h-3.5 border-2 border-bg/30 border-t-bg rounded-full animate-spin" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
                {editId ? 'Update' : 'Add'} Competitor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
