import { useState } from 'react';
import { RefreshCw, Send, Loader2, CalendarClock } from 'lucide-react';
import { DataView } from '@/shared/ui/DataView';
import {
  useRenewals, useInitiateRenewalOutreach, useRecordRenewalOutcome, useEvaluateRenewals,
} from '../api/crm.queries';
import {
  RenewalSegment, RenewalStatus, RenewalOutcome,
  RENEWAL_SEGMENT_LABELS, RENEWAL_STATUS_LABELS, RENEWAL_OUTCOME_LABELS,
  type CrmRenewalListItemDto, type CrmRenewalFilter,
} from '../types/crm.types';

const SEGMENT_STYLES: Record<RenewalSegment, string> = {
  [RenewalSegment.LowRiskRoutine]: 'text-success border-success/30 bg-success/10',
  [RenewalSegment.ExpansionCandidate]: 'text-brand border-border-glow bg-brand-soft',
  [RenewalSegment.AtRisk]: 'text-warning border-warning/30 bg-warning/10',
  [RenewalSegment.LostCause]: 'text-danger border-danger/30 bg-danger/10',
};

const TERMINAL: RenewalStatus[] = [
  RenewalStatus.Renewed, RenewalStatus.Expanded, RenewalStatus.Churned, RenewalStatus.Lapsed,
];

const SEGMENT_FILTERS: { label: string; value?: RenewalSegment }[] = [
  { label: 'All' },
  { label: 'At risk', value: RenewalSegment.AtRisk },
  { label: 'Expansion', value: RenewalSegment.ExpansionCandidate },
  { label: 'Low risk', value: RenewalSegment.LowRiskRoutine },
  { label: 'Lost cause', value: RenewalSegment.LostCause },
];

const money = (n: number) =>
  new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0);

export function Component() {
  const [segment, setSegment] = useState<RenewalSegment | undefined>(undefined);
  const filter: CrmRenewalFilter = { segment, pageSize: 50 };
  const query = useRenewals(filter);

  const outreach = useInitiateRenewalOutreach();
  const outcome = useRecordRenewalOutcome();
  const evaluate = useEvaluateRenewals();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-extrabold text-text-primary tracking-tight">CRM — Renewals</h1>
          <p className="text-sm text-text-secondary mt-1">
            Upcoming contract renewals, risk-segmented. Reach out before they lapse and record the outcome.
          </p>
        </div>
        <button
          onClick={() => evaluate.mutate()}
          disabled={evaluate.isPending}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-bg bg-brand hover:bg-brand-light disabled:opacity-50 transition-all"
        >
          {evaluate.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" strokeWidth={2.2} />}
          Re-evaluate now
        </button>
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {SEGMENT_FILTERS.map((f) => {
          const active = f.value === segment;
          return (
            <button
              key={f.label}
              onClick={() => setSegment(f.value)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-all ${
                active ? 'bg-brand-soft text-brand border-border-glow'
                       : 'bg-bg-elevated text-text-secondary border-border-subtle hover:border-border-medium'
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      <DataView
        query={query}
        isEmpty={(d) => !d.items?.length}
        empty={
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <CalendarClock className="w-10 h-10 text-text-muted mb-3" strokeWidth={1.2} />
            <p className="text-text-secondary font-semibold">No upcoming renewals</p>
            <p className="text-sm text-text-muted mt-1">Run "Re-evaluate now" to scan won deals for upcoming renewals.</p>
          </div>
        }
      >
        {(data) => (
          <div className="overflow-x-auto rounded-card border-thin border-border-subtle">
            <table className="w-full min-w-[720px] border-collapse">
              <thead>
                <tr className="bg-bg-elevated text-left">
                  {['Renewal date', 'Days', 'Value', 'Segment', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-text-muted">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.items.map((r: CrmRenewalListItemDto) => {
                  const terminal = TERMINAL.includes(r.status);
                  const overdue = r.daysUntilRenewal < 0;
                  return (
                    <tr key={r.id} className="border-t border-border-subtle hover:bg-glass-1">
                      <td className="px-4 py-3 text-sm text-text-primary tabular-nums">
                        {new Date(r.renewalDate).toLocaleDateString()}
                      </td>
                      <td className={`px-4 py-3 text-sm tabular-nums ${overdue ? 'text-danger font-bold' : 'text-text-secondary'}`}>
                        {overdue ? `${Math.abs(r.daysUntilRenewal)}d overdue` : `${r.daysUntilRenewal}d`}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-text-primary tabular-nums">{money(r.contractValue)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${SEGMENT_STYLES[r.segment]}`}>
                          {RENEWAL_SEGMENT_LABELS[r.segment]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-text-secondary">{RENEWAL_STATUS_LABELS[r.status]}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => outreach.mutate(r.id)}
                            disabled={terminal || outreach.isPending}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border border-border-medium text-text-secondary hover:text-text-primary hover:bg-glass-2 disabled:opacity-40 transition-all"
                          >
                            <Send className="w-3 h-3" /> Outreach
                          </button>
                          <select
                            disabled={terminal || outcome.isPending}
                            defaultValue=""
                            onChange={(e) => {
                              if (!e.target.value) return;
                              outcome.mutate({ id: r.id, data: { outcome: Number(e.target.value) as RenewalOutcome } });
                              e.target.value = '';
                            }}
                            className="text-[11px] bg-bg-elevated border border-border-subtle rounded-lg px-2 py-1 text-text-secondary focus:outline-none focus:border-border-glow disabled:opacity-40"
                          >
                            <option value="">Record outcome…</option>
                            {Object.entries(RENEWAL_OUTCOME_LABELS).map(([v, label]) => (
                              <option key={v} value={v}>{label}</option>
                            ))}
                          </select>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </DataView>
    </div>
  );
}
