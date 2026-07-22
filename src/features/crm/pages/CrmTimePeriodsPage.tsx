import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { Loader2, Plus, Check, X, Send, Clock, Calendar, FileText } from 'lucide-react';
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

function SlideOver({ open, onClose, title, subtitle, children, footer }: {
  open: boolean; onClose: () => void; title: string; subtitle?: string; children: React.ReactNode; footer?: React.ReactNode;
}) {
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className="drawer-slide-in relative flex flex-col overflow-hidden"
        style={{
          width: 640,
          borderRadius: 18,
          background: 'var(--bg-card)',
          border: '1px solid rgba(0,217,138,0.2)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.7), 0 0 24px rgba(0,217,138,0.25), inset 0 1px 0 rgba(0,255,163,0.05)',
          maxHeight: 'calc(100vh - 32px)',
          marginTop: 16,
          marginBottom: 16,
        }}
      >
        {/* Accent bar */}
        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, #00D98A 35%, #00FFA3 65%, transparent)', flexShrink: 0 }} />
        <div className="flex items-start justify-between px-6 py-4 border-b border-border-subtle shrink-0">
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
              {title}
            </h2>
            {subtitle && <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary mt-0.5">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">{children}</div>
        {footer && <div className="shrink-0 px-6 py-4 border-t border-border-subtle">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

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
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-bg bg-brand hover:bg-brand-light transition-all"
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={2.5} /> New Period
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <SlideOver
          open={showCreate}
          onClose={() => { setShowCreate(false); setName(''); setPeriodStart(''); setPeriodEnd(''); }}
          title="New Period"
          subtitle="Create a time period for tracking and approval"
          footer={
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => { setShowCreate(false); setName(''); setPeriodStart(''); setPeriodEnd(''); }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-text-secondary border border-border-subtle hover:border-border-medium transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => createMutation.mutate({ periodStart, periodEnd, notes: name || undefined })}
                disabled={!canCreate || createMutation.isPending}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-bg bg-brand hover:bg-brand-light disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {createMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Create
              </button>
            </div>
          }
        >
          <form id="period-form" onSubmit={e => { e.preventDefault(); createMutation.mutate({ periodStart, periodEnd, notes: name || undefined }); }} className="space-y-4">
            {/* ── Period Details ── */}
            <div className="grid grid-cols-[auto_1fr] items-center gap-2">
              <span className="text-[10px] font-bold text-brand uppercase tracking-widest">Period Details</span>
              <div className="h-px bg-brand/20" />
            </div>

            {/* Name / Label */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Name / Label</label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
                <input
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)]"
                  style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }}
                  placeholder="e.g. June 2026, Q2 Week 3"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
            </div>

            {/* Start Date + End Date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Start Date *</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none z-10" strokeWidth={1.6} />
                  <input
                    type="date"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary focus:outline-none focus:border-[rgba(0,217,138,0.50)]"
                    style={{
                      backgroundColor: '#1A2F27',
                      colorScheme: 'dark',
                      backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)',
                    }}
                    value={periodStart}
                    onChange={e => setPeriodStart(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">End Date *</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none z-10" strokeWidth={1.6} />
                  <input
                    type="date"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary focus:outline-none focus:border-[rgba(0,217,138,0.50)]"
                    style={{
                      backgroundColor: '#1A2F27',
                      colorScheme: 'dark',
                      backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)',
                    }}
                    value={periodEnd}
                    onChange={e => setPeriodEnd(e.target.value)}
                  />
                </div>
              </div>
            </div>
            {periodStart && periodEnd && periodStart >= periodEnd && (
              <p className="text-xs text-danger">End date must be after start date.</p>
            )}
          </form>
        </SlideOver>
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
