import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { Loader2, Plus, Check, X, Send, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { crmApi } from '../api/crm.api';
import { CrmTimePeriodStatus, CRM_TIME_PERIOD_STATUS_LABELS } from '../types/crm.types';

const inputCls = 'w-full px-3 py-2 rounded-lg border border-border-subtle bg-bg-elevated text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand/40';

const STATUS_COLORS: Record<number, string> = {
  [CrmTimePeriodStatus.Draft]:     'bg-bg-subtle text-text-muted',
  [CrmTimePeriodStatus.Submitted]: 'bg-[rgba(245,158,11,0.1)] text-[#F59E0B]',
  [CrmTimePeriodStatus.Approved]:  'bg-success-soft text-success',
  [CrmTimePeriodStatus.Rejected]:  'bg-danger-soft text-danger',
};

export function Component() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [filter, setFilter] = useState<number | undefined>();
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['crm', 'time-periods', filter],
    queryFn: () => crmApi.getTimePeriods({ status: filter as any, page: 1, pageSize: 50 }),
  });
  const periods: any[] = (data as any)?.items ?? [];

  const createMutation = useMutation({
    mutationFn: (d: { periodStart: string; periodEnd: string; notes?: string }) =>
      crmApi.createTimePeriod(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm', 'time-periods'] });
      setShowCreate(false);
      setName(''); setPeriodStart(''); setPeriodEnd('');
      toast.success('Time period created.');
    },
    onError: (err: any) => toast.error(err?.message || 'Error creating period.'),
  });

  const submitMutation = useMutation({
    mutationFn: (id: string) => crmApi.submitTimePeriod(id, {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['crm', 'time-periods'] }); toast.success('Submitted for approval.'); },
    onError: (err: any) => toast.error(err?.message || 'Error submitting.'),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => crmApi.approveTimePeriod(id, {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['crm', 'time-periods'] }); toast.success('Approved.'); },
    onError: (err: any) => toast.error(err?.message || 'Error approving.'),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      crmApi.rejectTimePeriod(id, { rejectionReason: reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm', 'time-periods'] });
      setRejectId(null); setRejectReason('');
      toast.success('Rejected.');
    },
    onError: (err: any) => toast.error(err?.message || 'Error rejecting.'),
  });

  const canCreate = periodStart && periodEnd && periodStart < periodEnd;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Time Periods</h1>
          <p className="text-xs text-text-muted mt-0.5">Group time entries into reporting periods for review and approval.</p>
        </div>
        <button
          onClick={() => setShowCreate(v => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand text-white text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" /> New Period
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="rounded-xl border border-border-subtle bg-bg-elevated p-5 space-y-4">
          <h3 className="text-sm font-semibold text-text-primary">Create Time Period</h3>
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1">Name / Label</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. June 2026, Q2 Week 3"
              className={inputCls}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">Start Date *</label>
              <input
                type="date"
                value={periodStart}
                onChange={e => setPeriodStart(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">End Date *</label>
              <input
                type="date"
                value={periodEnd}
                onChange={e => setPeriodEnd(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>
          {periodStart && periodEnd && periodStart >= periodEnd && (
            <p className="text-xs text-danger">End date must be after start date.</p>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => createMutation.mutate({ periodStart, periodEnd, notes: name || undefined })}
              disabled={!canCreate || createMutation.isPending}
              className="px-4 py-1.5 rounded-lg bg-brand text-white text-sm font-medium disabled:opacity-50"
            >
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
            </button>
            <button onClick={() => { setShowCreate(false); setName(''); setPeriodStart(''); setPeriodEnd(''); }} className="px-3 py-1.5 rounded-lg border border-border-subtle text-sm text-text-secondary">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        {([undefined, CrmTimePeriodStatus.Draft, CrmTimePeriodStatus.Submitted, CrmTimePeriodStatus.Approved, CrmTimePeriodStatus.Rejected] as const).map(s => (
          <button
            key={String(s)}
            onClick={() => setFilter(s as any)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${filter === s ? 'bg-brand text-white' : 'bg-bg-elevated border border-border-subtle text-text-secondary hover:bg-bg-subtle'}`}
          >
            {s == null ? 'All' : CRM_TIME_PERIOD_STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-text-muted" /></div>
      ) : periods.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-text-muted gap-3">
          <Clock className="w-8 h-8 opacity-30" strokeWidth={1.2} />
          <p className="text-sm">No time periods found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {periods.map((p: any) => {
            const dateRange = `${format(parseISO(p.periodStart), 'MMM d')} – ${format(parseISO(p.periodEnd), 'MMM d, yyyy')}`;
            const displayName = p.notes || dateRange;
            return (
              <div key={p.id} className="rounded-xl border border-border-subtle bg-bg-elevated p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{displayName}</p>
                    {p.notes && <p className="text-xs text-text-muted mt-0.5">{dateRange}</p>}
                    <p className="text-xs text-text-muted mt-1">
                      {p.totalMinutes} min total · {p.billableMinutes} billable · {p.entryCount} entries
                    </p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${STATUS_COLORS[p.status as CrmTimePeriodStatus] ?? STATUS_COLORS[CrmTimePeriodStatus.Draft]}`}>
                    {CRM_TIME_PERIOD_STATUS_LABELS[p.status as CrmTimePeriodStatus]}
                  </span>
                </div>

                {p.rejectionReason && (
                  <p className="text-xs text-danger bg-danger-soft rounded-lg px-3 py-2">
                    Rejected: {p.rejectionReason}
                  </p>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  {p.status === CrmTimePeriodStatus.Draft && (
                    <button
                      onClick={() => submitMutation.mutate(p.id)}
                      disabled={submitMutation.isPending}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-subtle border border-border-subtle text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" /> Submit for Approval
                    </button>
                  )}
                  {p.status === CrmTimePeriodStatus.Submitted && (
                    <>
                      <button
                        onClick={() => approveMutation.mutate(p.id)}
                        disabled={approveMutation.isPending}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-success-soft text-success text-xs font-semibold border border-[rgba(34,197,94,0.2)] hover:bg-success hover:text-white transition-colors disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => { setRejectId(p.id); setRejectReason(''); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-danger-soft text-danger text-xs font-semibold border border-[rgba(239,68,68,0.2)] hover:bg-danger hover:text-white transition-colors"
                      >
                        <X className="w-3.5 h-3.5" /> Reject
                      </button>
                    </>
                  )}
                </div>

                {/* Inline reject reason input */}
                {rejectId === p.id && (
                  <div className="flex gap-2 pt-1">
                    <input
                      autoFocus
                      value={rejectReason}
                      onChange={e => setRejectReason(e.target.value)}
                      placeholder="Reason for rejection..."
                      className={inputCls}
                    />
                    <button
                      onClick={() => rejectMutation.mutate({ id: p.id, reason: rejectReason })}
                      disabled={!rejectReason.trim() || rejectMutation.isPending}
                      className="px-3 py-1.5 rounded-lg bg-danger text-white text-xs font-semibold disabled:opacity-50 shrink-0"
                    >
                      {rejectMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Confirm'}
                    </button>
                    <button onClick={() => setRejectId(null)} className="px-3 py-1.5 rounded-lg border border-border-subtle text-xs text-text-secondary shrink-0">
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
