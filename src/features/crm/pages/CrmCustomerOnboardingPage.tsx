import { useState } from 'react';
import { Plus, X, Loader2, Users, CheckCircle, AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import {
  useOnboardings, useOnboardingById, useStartOnboarding,
  useUpdateOnboardingMilestone, useCompleteOnboarding,
} from '../api/crm.queries';
import type {
  CrmOnboardingFilter, CrmStartOnboardingRequest,
  CrmCustomerOnboardingDto, CrmOnboardingMilestoneDto,
  CrmCreateMilestoneRequest,
} from '../types/crm.types';
import {
  CRM_ONBOARDING_STATUS_LABELS, CRM_ONBOARDING_STATUS_COLORS,
  CRM_MILESTONE_KIND_LABELS,
  CrmOnboardingStatus, CrmOnboardingMilestoneKind,
} from '../types/crm.types';

const inputCls = 'w-full rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand/40';

function Badge({ value, labels, colors }: { value: number; labels: Record<number, string>; colors: Record<number, string> }) {
  return (
    <span className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${colors[value] ?? ''}`}>
      {labels[value] ?? value}
    </span>
  );
}

function SlideOver({ open, onClose, title, children, width = '560px' }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; width?: string }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative h-full flex flex-col bg-bg-shell border-l border-border-subtle" style={{ width, boxShadow: '-8px 0 40px rgba(0,0,0,0.5)' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle shrink-0">
          <h3 className="font-bold text-text-primary">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-surface transition-all"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="block text-xs font-semibold text-text-muted mb-1.5">{label}</label>{children}</div>;
}

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="w-full h-1.5 bg-bg-elevated rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all bg-brand" style={{ width: `${percent}%` }} />
    </div>
  );
}

function MilestoneItem({ m, onboardingId }: { m: CrmOnboardingMilestoneDto; onboardingId: string }) {
  const update = useUpdateOnboardingMilestone();
  const [expanded, setExpanded] = useState(false);
  const [blockerReason, setBlockerReason] = useState('');

  const toggle = (toStatus: CrmOnboardingStatus) => {
    update.mutate({
      id: onboardingId,
      milestoneId: m.id,
      data: {
        status: toStatus,
        completedAt: toStatus === CrmOnboardingStatus.Completed ? new Date().toISOString() : undefined,
        blockerReason: toStatus === CrmOnboardingStatus.Blocked ? blockerReason : undefined,
      },
    });
  };

  const isComplete = m.status === CrmOnboardingStatus.Completed;
  const isBlocked = m.status === CrmOnboardingStatus.Blocked;

  return (
    <div className={`rounded-xl border p-3 transition-all ${isComplete ? 'border-[rgba(34,197,94,0.2)] bg-[rgba(34,197,94,0.04)]' : isBlocked ? 'border-[rgba(244,63,94,0.2)] bg-danger-soft' : 'border-border-subtle bg-bg-surface'}`}>
      <div className="flex items-start gap-3">
        <button onClick={() => toggle(isComplete ? CrmOnboardingStatus.InProgress : CrmOnboardingStatus.Completed)}
          disabled={update.isPending}
          className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all ${isComplete ? 'bg-success border-success' : 'border-border-subtle hover:border-brand'}`}>
          {isComplete && <CheckCircle className="w-full h-full text-bg" />}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className={`text-sm font-medium ${isComplete ? 'line-through text-text-muted' : 'text-text-primary'}`}>{m.title}</span>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="text-[10px] text-text-muted bg-bg-elevated px-1.5 py-0.5 rounded">{CRM_MILESTONE_KIND_LABELS[m.kind as CrmOnboardingMilestoneKind]}</span>
              {m.dueDate && <span className={`text-[10px] ${new Date(m.dueDate) < new Date() && !isComplete ? 'text-danger' : 'text-text-muted'}`}>{format(parseISO(m.dueDate), 'MMM d')}</span>}
            </div>
          </div>
          {m.description && <p className="text-xs text-text-muted mt-0.5">{m.description}</p>}
          {m.completedAt && <p className="text-xs text-success mt-0.5">Completed {format(parseISO(m.completedAt), 'MMM d, yyyy')}</p>}
          {isBlocked && m.blockerReason && <p className="text-xs text-danger mt-0.5">Blocked: {m.blockerReason}</p>}

          {!isComplete && (
            <div className="flex gap-1.5 mt-2">
              <button onClick={() => setExpanded(v => !v)} className={`text-[10px] px-2 py-0.5 rounded border transition-all ${isBlocked ? 'text-text-secondary border-border-subtle hover:bg-bg-elevated' : 'text-danger border-[rgba(244,63,94,0.2)] hover:bg-danger-soft'}`}>
                {isBlocked ? 'Unblock' : 'Mark Blocked'}
              </button>
            </div>
          )}

          {expanded && !isComplete && (
            <div className="mt-2 flex gap-2">
              {isBlocked ? (
                <button onClick={() => { toggle(CrmOnboardingStatus.InProgress); setExpanded(false); }} className="text-[10px] px-2 py-1 rounded bg-bg-elevated border border-border-subtle text-text-secondary hover:text-text-primary">
                  Unblock
                </button>
              ) : (
                <>
                  <input value={blockerReason} onChange={e => setBlockerReason(e.target.value)} placeholder="Blocker reason..." className="flex-1 rounded-lg border border-[rgba(244,63,94,0.3)] bg-bg-elevated px-2 py-1 text-xs text-text-primary focus:outline-none" />
                  <button onClick={() => { toggle(CrmOnboardingStatus.Blocked); setExpanded(false); }} className="text-[10px] px-2 py-1 rounded bg-danger-soft border border-[rgba(244,63,94,0.2)] text-danger hover:opacity-80">
                    Set Blocked
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailPanel({ id }: { id: string }) {
  const { data: ob, isLoading } = useOnboardingById(id);
  const complete = useCompleteOnboarding();

  if (isLoading) return <div className="flex items-center justify-center h-40"><Loader2 className="w-5 h-5 animate-spin text-text-muted" /></div>;
  if (!ob) return null;

  const sorted = [...ob.milestones].sort((a, b) => a.sortOrder - b.sortOrder);
  const completedCount = sorted.filter(m => m.status === CrmOnboardingStatus.Completed).length;

  return (
    <div className="space-y-5">
      <div>
        <div className="text-lg font-extrabold text-text-primary mb-2">{ob.title}</div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge value={ob.status} labels={CRM_ONBOARDING_STATUS_LABELS} colors={CRM_ONBOARDING_STATUS_COLORS} />
          <span className="text-xs text-text-muted">{completedCount}/{sorted.length} milestones</span>
        </div>
        <div className="mt-3 space-y-1">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>Progress</span><span className="font-semibold text-text-primary">{ob.progressPercent}%</span>
          </div>
          <ProgressBar percent={ob.progressPercent} />
        </div>
      </div>

      <div className="bg-bg-surface rounded-xl p-4 space-y-2 text-sm">
        <div className="flex justify-between"><span className="text-text-muted">Started</span><span>{format(parseISO(ob.startedAt), 'MMM d, yyyy')}</span></div>
        {ob.completedAt && <div className="flex justify-between"><span className="text-text-muted">Completed</span><span className="text-success">{format(parseISO(ob.completedAt), 'MMM d, yyyy')}</span></div>}
        {ob.notes && <div><span className="text-text-muted block text-xs mb-1">Notes</span><p className="text-text-secondary text-xs">{ob.notes}</p></div>}
        {ob.blockerReason && <div><span className="text-danger block text-xs mb-1">Blocker</span><p className="text-danger text-xs">{ob.blockerReason}</p></div>}
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold text-text-muted">Milestones</label>
        {sorted.map(m => <MilestoneItem key={m.id} m={m} onboardingId={ob.id} />)}
      </div>

      {ob.status !== CrmOnboardingStatus.Completed && ob.progressPercent === 100 && (
        <div className="pt-2 border-t border-border-subtle">
          <button onClick={() => complete.mutate(ob.id)} disabled={complete.isPending}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-success text-bg text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-all">
            {complete.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4" /> Mark Onboarding Complete</>}
          </button>
        </div>
      )}
    </div>
  );
}

type MilestoneDraft = { kind: number; title: string; dueDate: string; sortOrder: number };
const emptyMilestone = (idx: number): MilestoneDraft => ({ kind: 1, title: '', dueDate: '', sortOrder: idx + 1 });

const DEFAULT_MILESTONES: MilestoneDraft[] = [
  { kind: CrmOnboardingMilestoneKind.Kickoff, title: 'Kickoff Meeting', dueDate: '', sortOrder: 1 },
  { kind: CrmOnboardingMilestoneKind.Installation, title: 'Installation', dueDate: '', sortOrder: 2 },
  { kind: CrmOnboardingMilestoneKind.GoLive, title: 'Go Live', dueDate: '', sortOrder: 3 },
];

export function Component() {
  const [filter, setFilter] = useState<CrmOnboardingFilter>({ page: 1, pageSize: 20 });
  const [statusF, setStatusF] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const [obTitle, setObTitle] = useState('');
  const [dealId, setDealId] = useState('');
  const [contactId, setContactId] = useState('');
  const [milestones, setMilestones] = useState<MilestoneDraft[]>(DEFAULT_MILESTONES);

  const { data: raw, isLoading } = useOnboardings(filter);
  const items: CrmCustomerOnboardingDto[] = (raw as any)?.item1 ?? [];
  const total: number = (raw as any)?.item2 ?? 0;

  const start = useStartOnboarding();

  const applyFilter = () => {
    setFilter(f => ({
      ...f, page: 1,
      status: statusF ? Number(statusF) as CrmOnboardingStatus : undefined,
    }));
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const ms: CrmCreateMilestoneRequest[] = milestones
      .filter(m => m.title.trim())
      .map(m => ({
        kind: m.kind as CrmOnboardingMilestoneKind,
        title: m.title.trim(),
        sortOrder: m.sortOrder,
        dueDate: m.dueDate || undefined,
      }));
    const req: CrmStartOnboardingRequest = {
      dealId: dealId.trim(),
      contactId: contactId.trim(),
      title: obTitle.trim(),
      milestones: ms,
    };
    start.mutate(req, {
      onSuccess: () => {
        setShowCreate(false);
        setObTitle(''); setDealId(''); setContactId(''); setMilestones(DEFAULT_MILESTONES);
      },
    });
  };

  const setMs = (i: number, k: keyof MilestoneDraft, v: string | number) =>
    setMilestones(ms => ms.map((m, idx) => idx === i ? { ...m, [k]: v } : m));

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-text-primary tracking-tight">Customer Onboarding</h2>
            <p className="text-xs text-text-muted mt-0.5">Track post-sale onboarding milestones per customer</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-bg bg-brand hover:opacity-90 transition-all">
            <Plus className="w-3.5 h-3.5" strokeWidth={2.5} /> Start Onboarding
          </button>
        </div>

        <div className="flex gap-2 flex-wrap">
          <select value={statusF} onChange={e => setStatusF(e.target.value)} className="rounded-xl border border-border-subtle bg-bg-elevated px-3 py-2 text-sm text-text-primary focus:outline-none">
            <option value="">All Status</option>
            {Object.entries(CRM_ONBOARDING_STATUS_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
          <button onClick={applyFilter} className="px-4 py-2 rounded-xl border border-border-subtle bg-bg-elevated text-sm text-text-secondary hover:text-text-primary transition-all">Apply</button>
        </div>

        <div className="rounded-2xl border border-border-subtle bg-bg-card overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-40 text-text-muted"><Loader2 className="w-5 h-5 animate-spin" /></div>
          ) : !items.length ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-text-muted">
              <Users className="w-8 h-8 opacity-30" strokeWidth={1.2} />
              <p className="text-sm">No onboardings in progress.</p>
            </div>
          ) : (
            <div className="divide-y divide-border-subtle">
              {items.map(ob => {
                const total_ms = ob.milestones.length;
                const done_ms = ob.milestones.filter(m => m.status === CrmOnboardingStatus.Completed).length;
                const hasBlocker = ob.milestones.some(m => m.status === CrmOnboardingStatus.Blocked);
                return (
                  <div key={ob.id} onClick={() => setSelectedId(ob.id)} className="px-5 py-4 hover:bg-bg-elevated cursor-pointer transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-text-primary text-sm truncate">{ob.title}</span>
                          {hasBlocker && <AlertCircle className="w-3.5 h-3.5 text-danger flex-shrink-0" />}
                        </div>
                        <div className="flex items-center gap-3 mt-1.5">
                          <Badge value={ob.status} labels={CRM_ONBOARDING_STATUS_LABELS} colors={CRM_ONBOARDING_STATUS_COLORS} />
                          <span className="text-xs text-text-muted">{done_ms}/{total_ms} steps</span>
                          <span className="text-xs text-text-muted">{format(parseISO(ob.startedAt), 'MMM d, yyyy')}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-right">
                          <div className="text-sm font-bold text-text-primary">{ob.progressPercent}%</div>
                          <div className="w-24 mt-1"><ProgressBar percent={ob.progressPercent} /></div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {total > (filter.pageSize ?? 20) && (
          <div className="flex items-center justify-between text-sm text-text-muted">
            <span>{total} total</span>
            <div className="flex gap-2">
              <button disabled={(filter.page ?? 1) === 1} onClick={() => setFilter(f => ({ ...f, page: (f.page ?? 1) - 1 }))} className="px-3 py-1.5 rounded-lg border border-border-subtle hover:bg-bg-elevated disabled:opacity-40 transition-all">Prev</button>
              <button disabled={(filter.page ?? 1) * (filter.pageSize ?? 20) >= total} onClick={() => setFilter(f => ({ ...f, page: (f.page ?? 1) + 1 }))} className="px-3 py-1.5 rounded-lg border border-border-subtle hover:bg-bg-elevated disabled:opacity-40 transition-all">Next</button>
            </div>
          </div>
        )}
      </div>

      <SlideOver open={showCreate} onClose={() => setShowCreate(false)} title="Start Onboarding">
        <form onSubmit={handleCreate} className="space-y-4">
          <Field label="Title *"><input required value={obTitle} onChange={e => setObTitle(e.target.value)} placeholder="e.g. Acme Corp Onboarding" className={inputCls} /></Field>
          <Field label="Deal ID *"><input required value={dealId} onChange={e => setDealId(e.target.value)} placeholder="deal-uuid" className={inputCls} /></Field>
          <Field label="Contact ID *"><input required value={contactId} onChange={e => setContactId(e.target.value)} placeholder="contact-uuid" className={inputCls} /></Field>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-text-muted">Milestones</label>
              <button type="button" onClick={() => setMilestones(ms => [...ms, emptyMilestone(ms.length)])} className="flex items-center gap-1 px-2 py-1 rounded-md border border-border-subtle text-xs text-text-secondary hover:text-text-primary hover:bg-bg-surface transition-all">
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>
            <div className="space-y-2">
              {milestones.map((m, i) => (
                <div key={i} className="grid grid-cols-[80px_1fr_110px_28px] gap-1.5 items-center">
                  <select value={m.kind} onChange={e => setMs(i, 'kind', Number(e.target.value))} className="rounded-lg border border-border-subtle bg-bg-elevated px-2 py-2 text-xs text-text-primary focus:outline-none">
                    {Object.entries(CRM_MILESTONE_KIND_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                  </select>
                  <input value={m.title} onChange={e => setMs(i, 'title', e.target.value)} placeholder="Milestone title" className={inputCls} />
                  <input type="date" value={m.dueDate} onChange={e => setMs(i, 'dueDate', e.target.value)} className={inputCls} />
                  <button type="button" onClick={() => setMilestones(ms => ms.filter((_, idx) => idx !== i))} disabled={milestones.length === 1} className="p-1 rounded text-text-muted hover:text-danger disabled:opacity-30 transition-all">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={start.isPending} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-brand text-bg text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-all">
              {start.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Start Onboarding'}
            </button>
            <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-lg border border-border-subtle text-sm text-text-secondary hover:text-text-primary transition-all">Cancel</button>
          </div>
        </form>
      </SlideOver>

      <SlideOver open={!!selectedId} onClose={() => setSelectedId(null)} title="Onboarding Detail" width="620px">
        {selectedId && <DetailPanel id={selectedId} />}
      </SlideOver>
    </>
  );
}
