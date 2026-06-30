import { useState } from 'react';
import { Loader2, DollarSign, CheckCircle2, Clock, Wallet, Target, TrendingUp, Search, Play, Plus } from 'lucide-react';
import { useCommissionEntries, useCommissionPayouts, useFinalizePayout, useMarkPayoutPaid } from '../api/crm.queries';
import { CRM_COMMISSION_STATUS_LABELS, CRM_COMMISSION_STATUS_COLORS, CrmCommissionRunStatus } from '../types/crm.types';
import type { CrmCommissionPayoutDto } from '../types/crm.types';
import { format } from 'date-fns';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { crmApi } from '../api/crm.api';
import { toast } from 'sonner';

const PERIOD_PRESETS = [
  { label: 'This Month', code: new Date().toISOString().slice(0, 7) },
  { label: 'Last Month', code: new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 7) },
  { label: 'Q3 2026', code: '2026-Q3' },
  { label: 'Q2 2026', code: '2026-Q2' },
  { label: '2026', code: '2026' },
];

function PayoutModal({ payout, onClose }: { payout: CrmCommissionPayoutDto; onClose: () => void }) {
  const [deductions, setDeductions] = useState('');
  const [notes, setNotes] = useState('');
  const finalize = useFinalizePayout();
  const markPaid = useMarkPayoutPaid();

  const handleApprove = () => {
    finalize.mutate({ id: payout.id, data: { deductions: deductions ? Number(deductions) : undefined, notes: notes || undefined } }, { onSuccess: onClose });
  };

  const handleMarkPaid = () => {
    markPaid.mutate(payout.id, { onSuccess: onClose });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-md bg-bg border border-border-subtle rounded-2xl p-6 space-y-4 shadow-2xl">
        <h3 className="text-sm font-bold text-text-primary">Payout — {payout.label || payout.periodCode}</h3>
        <div className="space-y-2 text-sm">
          <p className="flex justify-between"><span className="text-text-muted">Gross</span><span className="font-semibold">{payout.currency} {payout.totalCommissionAmount.toLocaleString()}</span></p>
          <p className="flex justify-between"><span className="text-text-muted">Deductions</span><span className="font-semibold text-danger">{payout.deductions ? `-${payout.currency} ${payout.deductions.toLocaleString()}` : '—'}</span></p>
          <p className="flex justify-between border-t border-border-subtle pt-2"><span className="text-text-muted">Net</span><span className="font-bold text-lg">{payout.currency} {payout.netPayAmount.toLocaleString()}</span></p>
        </div>

        {payout.status === CrmCommissionRunStatus.Draft && (
          <div className="space-y-3">
            <div><label className="text-xs text-text-muted block mb-1">Deductions</label><input type="number" value={deductions} onChange={e => setDeductions(e.target.value)} placeholder="0.00" className="w-full px-3 py-2 rounded-xl bg-bg-elevated border border-border-subtle text-sm" /></div>
            <div><label className="text-xs text-text-muted block mb-1">Notes</label><textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Optional notes..." className="w-full px-3 py-2 rounded-xl bg-bg-elevated border border-border-subtle text-sm resize-none" /></div>
            <button onClick={handleApprove} disabled={finalize.isPending} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-success text-bg text-sm font-bold hover:opacity-90 disabled:opacity-50">
              {finalize.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Approve & Finalize
            </button>
          </div>
        )}

        {payout.status === CrmCommissionRunStatus.Finalized && (
          <button onClick={handleMarkPaid} disabled={markPaid.isPending} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand text-bg text-sm font-bold hover:bg-brand-light disabled:opacity-50">
            {markPaid.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />} Record Payout
          </button>
        )}

        <button onClick={onClose} className="w-full py-2 rounded-xl text-sm text-text-secondary border border-border-subtle hover:bg-bg-elevated">Close</button>
      </div>
    </div>
  );
}

export function Component() {
  const qc = useQueryClient();
  const [periodCode, setPeriodCode] = useState(PERIOD_PRESETS[0].code);
  const [selectedPayout, setSelectedPayout] = useState<CrmCommissionPayoutDto | null>(null);
  const [viewMode, setViewMode] = useState<'entries' | 'payouts'>('payouts');

  const { data: entriesRaw, isLoading: entriesLoading } = useCommissionEntries({ periodCode });
  const { data: payoutsRaw, isLoading: payoutsLoading } = useCommissionPayouts(periodCode);

  const runCommission = useMutation({
    mutationFn: () => crmApi.runCommission({ periodCode, periodStart: new Date().toISOString(), periodEnd: new Date().toISOString() }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['crm', 'commission-entries'] }); qc.invalidateQueries({ queryKey: ['crm', 'commission-payouts'] }); toast.success('Commission run complete.'); },
    onError: (e: any) => toast.error(e?.message || 'Error running commission.'),
  });

  const entries: any[] = (entriesRaw as any) ?? [];
  const payouts: CrmCommissionPayoutDto[] = (payoutsRaw as any) ?? [];

  const totalEarned = payouts.reduce((s, p) => s + p.totalCommissionAmount, 0);
  const totalPending = payouts.filter(p => p.status === CrmCommissionRunStatus.Draft).reduce((s, p) => s + p.totalCommissionAmount, 0);
  const totalPaid = payouts.filter(p => p.status === CrmCommissionRunStatus.Paid).reduce((s, p) => s + p.netPayAmount, 0);
  const quotaTarget = 30000;
  const attainmentPct = quotaTarget > 0 ? Math.round(totalEarned / quotaTarget * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-text-primary tracking-tight flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-brand" strokeWidth={1.5} /> Commissions
          </h2>
          <p className="text-xs text-text-muted mt-0.5">Manage sales commissions, approvals, and payouts.</p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => runCommission.mutate()} disabled={runCommission.isPending}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand text-bg text-xs font-bold hover:bg-brand-light disabled:opacity-50">
            {runCommission.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />} Run Commission
          </button>
          <button onClick={() => {
            const p = crmApi.createCommissionPlan({ name: 'Default Plan', rateType: 1, rateValue: 5, targetEntity: 1 });
            toast.promise(p, { loading: 'Creating plan...', success: 'Commission plan created.', error: (e) => e?.message || 'Error' });
          }} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-bg-elevated border border-border-subtle text-text-primary text-xs font-bold hover:bg-bg-card">
            <Plus className="w-3.5 h-3.5" /> Quick Setup Plan
          </button>
        </div>

        {/* Period filter */}
        <select value={periodCode} onChange={e => setPeriodCode(e.target.value)} className="px-3 py-2 rounded-xl bg-bg-elevated border border-border-subtle text-sm text-text-primary">
          {PERIOD_PRESETS.map(p => <option key={p.code} value={p.code}>{p.label}</option>)}
        </select>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-2xl border border-border-subtle bg-bg-card p-4 space-y-1">
          <p className="text-xs text-text-muted flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Earned</p>
          <p className="text-2xl font-extrabold text-text-primary">${totalEarned.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl border border-border-subtle bg-bg-card p-4 space-y-1">
          <p className="text-xs text-text-muted flex items-center gap-1"><Clock className="w-3 h-3 text-warning" /> Pending</p>
          <p className="text-2xl font-extrabold text-warning">${totalPending.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl border border-border-subtle bg-bg-card p-4 space-y-1">
          <p className="text-xs text-text-muted flex items-center gap-1"><Wallet className="w-3 h-3 text-success" /> Paid</p>
          <p className="text-2xl font-extrabold text-success">${totalPaid.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl border border-border-subtle bg-bg-card p-4 space-y-1">
          <p className="text-xs text-text-muted flex items-center gap-1"><Target className="w-3 h-3 text-brand" /> Quota</p>
          <p className="text-2xl font-extrabold text-brand">{attainmentPct}%</p>
          <p className="text-2xs text-text-muted">of ${quotaTarget.toLocaleString()}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border-subtle">
        {[['payouts', 'Payouts'], ['entries', 'Entries']].map(([value, label]) => (
          <button key={value} onClick={() => setViewMode(value as any)}
            className={`px-4 py-2 text-sm font-semibold transition-colors border-b-2 -mb-px ${viewMode === value ? 'border-brand text-brand' : 'border-transparent text-text-muted hover:text-text-primary'}`}>{label}</button>
        ))}
      </div>

      {/* Payouts */}
      {viewMode === 'payouts' && (
        <div className="rounded-2xl border border-border-subtle bg-bg-card overflow-hidden">
          {payoutsLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-text-muted" /></div>
          ) : payouts.length === 0 ? (
            <div className="text-center py-16 text-text-muted">
              <DollarSign className="w-10 h-10 mx-auto mb-3 opacity-30" strokeWidth={1} />
              <p className="text-sm font-semibold">No payouts for this period</p>
              <p className="text-xs mt-1">Run commission calculation to generate payouts.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle">
                  {['Period', 'Label', 'Gross', 'Deductions', 'Net', 'Status', 'Paid At', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payouts.map(p => (
                  <tr key={p.id} className="border-b border-border-subtle last:border-0 hover:bg-bg-elevated cursor-pointer transition-colors" onClick={() => setSelectedPayout(p)}>
                    <td className="px-4 py-3 font-semibold text-text-primary">{p.periodCode}</td>
                    <td className="px-4 py-3 text-text-secondary">{p.label || '—'}</td>
                    <td className="px-4 py-3 text-text-primary">{p.currency} {p.totalCommissionAmount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-danger">{p.deductions ? `${p.currency} ${p.deductions.toLocaleString()}` : '—'}</td>
                    <td className="px-4 py-3 font-semibold text-text-primary">{p.currency} {p.netPayAmount.toLocaleString()}</td>
                    <td className="px-4 py-3"><span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold border ${CRM_COMMISSION_STATUS_COLORS[p.status]}`}>
                      {p.status === 1 && <Clock className="w-3 h-3" />}
                      {p.status === 2 && <CheckCircle2 className="w-3 h-3" />}
                      {p.status === 3 && <Wallet className="w-3 h-3" />}
                      {CRM_COMMISSION_STATUS_LABELS[p.status]}
                    </span></td>
                    <td className="px-4 py-3 text-xs text-text-muted">{p.paidAt ? format(new Date(p.paidAt), 'MMM d, yyyy') : '—'}</td>
                    <td className="px-4 py-3">
                      {p.status === 1 && <button onClick={e => { e.stopPropagation(); setSelectedPayout(p); }} className="text-xs text-brand hover:underline font-medium">Approve</button>}
                      {p.status === 2 && <button onClick={e => { e.stopPropagation(); setSelectedPayout(p); }} className="text-xs text-brand hover:underline font-medium">Pay</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Entries */}
      {viewMode === 'entries' && (
        <div className="rounded-2xl border border-border-subtle bg-bg-card overflow-hidden">
          {entriesLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-text-muted" /></div>
          ) : entries.length === 0 ? (
            <div className="text-center py-16 text-text-muted">
              <Search className="w-10 h-10 mx-auto mb-3 opacity-30" strokeWidth={1} />
              <p className="text-sm font-semibold">No commission entries for this period</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle">
                  {['Rep', 'Deal', 'Amount', 'Rate', 'Commission', 'Status'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map((e: any) => (
                  <tr key={e.id} className="border-b border-border-subtle last:border-0">
                    <td className="px-4 py-3 text-text-primary">{e.repUserId || '—'}</td>
                    <td className="px-4 py-3 text-text-secondary">{e.dealId || '—'}</td>
                    <td className="px-4 py-3 text-text-primary">{e.currency} {e.dealAmount?.toLocaleString() ?? '0'}</td>
                    <td className="px-4 py-3 text-text-muted">—</td>
                    <td className="px-4 py-3 font-semibold text-text-primary">{e.currency} {e.commissionAmount?.toLocaleString() ?? '0'}</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-lg text-xs font-semibold border text-warning border-warning/30 bg-warning/10">Pending</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {selectedPayout && <PayoutModal payout={selectedPayout} onClose={() => setSelectedPayout(null)} />}
    </div>
  );
}
