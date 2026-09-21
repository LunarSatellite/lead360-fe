import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, X, Loader2, RefreshCw, PauseCircle, PlayCircle, XCircle, User, DollarSign, Calendar, Hash, ChevronDown, Layers } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import {
  useSubscriptions, useCreateSubscription, useUpdateSubscription,
  useCancelSubscription, usePauseSubscription, useResumeSubscription,
} from '../api/crm.queries';
import type {
  CrmSubscriptionSummaryDto, CrmSubscriptionCreateRequest,
  CrmSubscriptionUpdateRequest, CrmSubscriptionFilter,
} from '../types/crm.types';
import {
  CrmSubscriptionStatus, CrmSubscriptionPlanTier, CrmSubscriptionBillingCadence,
  CRM_SUBSCRIPTION_STATUS_LABELS, CRM_SUBSCRIPTION_STATUS_COLORS,
  CRM_SUBSCRIPTION_TIER_LABELS, CRM_BILLING_CADENCE_LABELS,
} from '../types/crm.types';

const inputStyle = { backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' } as const;
const inputCls = 'w-full rounded-lg border border-border-subtle bg-bg-input px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand/40';
const selectCls = 'w-full rounded-lg border border-border-subtle bg-bg-input px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/40';

function Badge({ value, labels, colors }: { value: number; labels: Record<number, string>; colors: Record<number, string> }) {
  return (
    <span className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${colors[value] ?? ''}`}>
      {labels[value] ?? value}
    </span>
  );
}

function SlideOver({ open, onClose, title, subtitle, children, footer }: { open: boolean; onClose: () => void; title: string; subtitle?: string; children: React.ReactNode; footer?: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end pr-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className="drawer-slide-in relative flex flex-col overflow-hidden"
        style={{
          width: '600px',
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
        {footer && <div className="shrink-0 px-6 py-4 border-t border-border-subtle">{footer}</div>}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-text-secondary mb-1">{label}</label>
      {children}
    </div>
  );
}

type CreateForm = { contactId: string; accountId: string; dealId: string; planName: string; planTier: string; billingCadence: string; amount: string; currency: string; startDate: string; seats: string; };
const EMPTY_CREATE: CreateForm = { contactId: '', accountId: '', dealId: '', planName: '', planTier: '1', billingCadence: '1', amount: '', currency: 'USD', startDate: '', seats: '' };

function TierDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-text-primary text-left"
        style={{ backgroundColor: '#1A332C', border: `1px solid ${open ? 'rgba(0,217,138,0.50)' : 'rgba(0,217,138,0.20)'}`, boxShadow: open ? '0 0 0 1px rgba(0,217,138,0.50), 0 0 10px rgba(0,217,138,0.20), 0 0 20px rgba(0,217,138,0.08)' : 'none', outline: 'none', transition: 'box-shadow 0.2s ease' }}
      >
        <span className="flex-1 font-medium text-text-primary">{CRM_SUBSCRIPTION_TIER_LABELS[Number(value) as CrmSubscriptionPlanTier] ?? 'Select tier'}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-text-muted transition-transform ${open ? 'rotate-180' : ''}`} strokeWidth={1.6} />
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-20 overflow-hidden" style={{ borderRadius: 12, background: 'var(--bg-card)', border: '1px solid rgba(0,217,138,0.20)', boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 12px rgba(0,217,138,0.08)' }}>
          {Object.entries(CRM_SUBSCRIPTION_TIER_LABELS).map(([k, l]) => (
            <button key={k} type="button" onClick={() => { onChange(k); setOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium transition-colors hover:bg-[rgba(0,217,138,0.08)] ${Number(value) === Number(k) ? 'bg-[rgba(0,217,138,0.08)]' : ''} text-text-secondary`}>
              {l}
              {Number(value) === Number(k) && <span className="ml-auto text-[10px] font-bold text-text-muted">selected</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CadenceDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-text-primary text-left"
        style={{ backgroundColor: '#1A332C', border: `1px solid ${open ? 'rgba(0,217,138,0.50)' : 'rgba(0,217,138,0.20)'}`, boxShadow: open ? '0 0 0 1px rgba(0,217,138,0.50), 0 0 10px rgba(0,217,138,0.20), 0 0 20px rgba(0,217,138,0.08)' : 'none', outline: 'none', transition: 'box-shadow 0.2s ease' }}
      >
        <span className="flex-1 font-medium text-text-primary">{CRM_BILLING_CADENCE_LABELS[Number(value) as CrmSubscriptionBillingCadence] ?? 'Select cadence'}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-text-muted transition-transform ${open ? 'rotate-180' : ''}`} strokeWidth={1.6} />
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-20 overflow-hidden" style={{ borderRadius: 12, background: 'var(--bg-card)', border: '1px solid rgba(0,217,138,0.20)', boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 12px rgba(0,217,138,0.08)' }}>
          {Object.entries(CRM_BILLING_CADENCE_LABELS).map(([k, l]) => (
            <button key={k} type="button" onClick={() => { onChange(k); setOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium transition-colors hover:bg-[rgba(0,217,138,0.08)] ${Number(value) === Number(k) ? 'bg-[rgba(0,217,138,0.08)]' : ''} text-text-secondary`}>
              {l}
              {Number(value) === Number(k) && <span className="ml-auto text-[10px] font-bold text-text-muted">selected</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

type EditForm = { planName: string; planTier: string; billingCadence: string; amount: string; seats: string; };

export function Component() {
  // Drill-down from the Recurring-revenue widget lands here pre-filtered: ?planTier= (MRR-by-tier) / ?status= open the list filtered.
  const [searchParams] = useSearchParams();
  const initialTier = searchParams.get('planTier') ?? '';
  const initialStatus = searchParams.get('status') ?? '';
  const [filter, setFilter] = useState<CrmSubscriptionFilter>({
    page: 1,
    pageSize: 20,
    planTier: initialTier ? (Number(initialTier) as CrmSubscriptionPlanTier) : undefined,
    status: initialStatus ? (Number(initialStatus) as CrmSubscriptionStatus) : undefined,
  });
  const [search, setSearch] = useState('');
  const [statusF, setStatusF] = useState(initialStatus);
  const [tierF, setTierF] = useState(initialTier);

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<CreateForm>(EMPTY_CREATE);

  const [selectedSub, setSelectedSub] = useState<CrmSubscriptionSummaryDto | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<EditForm>({ planName: '', planTier: '1', billingCadence: '1', amount: '', seats: '' });

  const { data: raw, isLoading } = useSubscriptions(filter);
  const items: CrmSubscriptionSummaryDto[] = (raw as any)?.items ?? [];

  const createSub = useCreateSubscription();
  const updateSub = useUpdateSubscription();
  const cancelSub = useCancelSubscription();
  const pauseSub = usePauseSubscription();
  const resumeSub = useResumeSubscription();

  const applyFilter = () => {
    setFilter({ page: 1, pageSize: 20, search: search || undefined, status: statusF ? Number(statusF) as CrmSubscriptionStatus : undefined, planTier: tierF ? Number(tierF) as CrmSubscriptionPlanTier : undefined });
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.contactId.trim()) { toast.error('Contact ID is required.'); return; }
    const req: CrmSubscriptionCreateRequest = {
      contactId: createForm.contactId.trim(),
      accountId: createForm.accountId.trim() || undefined,
      dealId: createForm.dealId.trim() || undefined,
      planName: createForm.planName.trim(),
      planTier: Number(createForm.planTier) as CrmSubscriptionPlanTier,
      billingCadence: Number(createForm.billingCadence) as CrmSubscriptionBillingCadence,
      amount: Number(createForm.amount),
      currency: createForm.currency || 'USD',
      startDate: createForm.startDate || undefined,
      seats: createForm.seats ? Number(createForm.seats) : undefined,
    };
    createSub.mutate(req, { onSuccess: () => { setShowCreate(false); setCreateForm(EMPTY_CREATE); } });
  };

  const openDetail = (s: CrmSubscriptionSummaryDto) => {
    setSelectedSub(s);
    setIsEditing(false);
    setEditForm({ planName: s.planName, planTier: s.planTier.toString(), billingCadence: s.billingCadence.toString(), amount: s.amount.toString(), seats: s.seats?.toString() ?? '' });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub) return;
    const req: CrmSubscriptionUpdateRequest = {
      planName: editForm.planName || undefined,
      planTier: editForm.planTier ? Number(editForm.planTier) as CrmSubscriptionPlanTier : undefined,
      billingCadence: editForm.billingCadence ? Number(editForm.billingCadence) as CrmSubscriptionBillingCadence : undefined,
      amount: editForm.amount ? Number(editForm.amount) : undefined,
      seats: editForm.seats ? Number(editForm.seats) : undefined,
    };
    updateSub.mutate({ id: selectedSub.id, data: req }, { onSuccess: () => setIsEditing(false) });
  };

  const setC = (k: keyof CreateForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setCreateForm(f => ({ ...f, [k]: e.target.value }));
  const setE = (k: keyof EditForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setEditForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-extrabold text-text-primary tracking-tight">Subscriptions</h2>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-bg bg-brand hover:opacity-90 transition-all">
            <Plus className="w-3.5 h-3.5" strokeWidth={2.5} /> New Subscription
          </button>
        </div>

        <div className="flex gap-2 flex-wrap">
          <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && applyFilter()} placeholder="Search..." className="flex-1 min-w-40 rounded-lg border border-border-subtle bg-bg-input px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand/40" />
          <select value={statusF} onChange={e => { setStatusF(e.target.value); }} className="rounded-lg border border-border-subtle bg-bg-input px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/40">
            <option value="">All Status</option>
            {Object.entries(CRM_SUBSCRIPTION_STATUS_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
          <select value={tierF} onChange={e => { setTierF(e.target.value); }} className="rounded-lg border border-border-subtle bg-bg-input px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/40">
            <option value="">All Tiers</option>
            {Object.entries(CRM_SUBSCRIPTION_TIER_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
          <button onClick={applyFilter} className="px-3 py-2 rounded-lg border border-border-subtle bg-bg-input text-sm text-text-secondary hover:text-text-primary flex items-center gap-1.5 transition-all">
            <RefreshCw className="w-3.5 h-3.5" /> Search
          </button>
        </div>

        <div className="rounded-2xl border border-border-subtle bg-bg-card overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-40 text-text-muted"><Loader2 className="w-5 h-5 animate-spin" /></div>
          ) : !items.length ? (
            <div className="flex items-center justify-center h-40 text-text-muted text-sm">No subscriptions found.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle">
                  {['Contact', 'Plan', 'Billing', 'Status', 'Next Billing', 'Amount', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((s: CrmSubscriptionSummaryDto) => (
                  <tr key={s.id} onClick={() => openDetail(s)} className="border-b border-border-subtle last:border-0 hover:bg-bg-elevated cursor-pointer transition-colors">
                    <td className="px-4 py-3 font-medium text-text-primary">{s.contactName ?? s.contactId}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-text-primary">{s.planName}</div>
                      <Badge value={s.planTier} labels={CRM_SUBSCRIPTION_TIER_LABELS} colors={{ 1: 'text-text-secondary bg-bg-elevated border-border-subtle', 2: 'text-brand bg-brand-soft border-border-glow', 3: 'text-[#F59E0B] bg-[rgba(245,158,11,0.1)] border-[rgba(245,158,11,0.2)]', 4: 'text-success bg-success-soft border-[rgba(34,197,94,0.2)]' }} />
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{CRM_BILLING_CADENCE_LABELS[s.billingCadence as CrmSubscriptionBillingCadence]}</td>
                    <td className="px-4 py-3"><Badge value={s.status} labels={CRM_SUBSCRIPTION_STATUS_LABELS} colors={CRM_SUBSCRIPTION_STATUS_COLORS} /></td>
                    <td className="px-4 py-3 text-text-muted text-xs">{s.nextBillingDate ? format(parseISO(s.nextBillingDate), 'MMM d, yyyy') : '—'}</td>
                    <td className="px-4 py-3 text-text-secondary">{s.currency} {s.amount.toLocaleString()}</td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5">
                        {s.status === CrmSubscriptionStatus.Active && (
                          <button onClick={() => pauseSub.mutate(s.id)} disabled={pauseSub.isPending} title="Pause" className="p-1.5 rounded-lg text-text-muted hover:text-[#F59E0B] hover:bg-[rgba(245,158,11,0.1)] transition-all disabled:opacity-50">
                            <PauseCircle className="w-4 h-4" />
                          </button>
                        )}
                        {s.status === CrmSubscriptionStatus.Paused && (
                          <button onClick={() => resumeSub.mutate(s.id)} disabled={resumeSub.isPending} title="Resume" className="p-1.5 rounded-lg text-text-muted hover:text-success hover:bg-success-soft transition-all disabled:opacity-50">
                            <PlayCircle className="w-4 h-4" />
                          </button>
                        )}
                        {s.status !== CrmSubscriptionStatus.Cancelled && (
                          <button onClick={() => cancelSub.mutate(s.id)} disabled={cancelSub.isPending} title="Cancel" className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger-soft transition-all disabled:opacity-50">
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create SlideOver */}
      <SlideOver
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="New Subscription"
        subtitle="Create a recurring subscription"
        footer={
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-xl text-xs font-semibold text-text-secondary border border-border-subtle hover:border-border-medium transition-all">Cancel</button>
            <button type="submit" form="sub-form" disabled={createSub.isPending}
              className="flex-none px-6 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-brand text-bg text-sm font-bold hover:bg-brand-light disabled:opacity-50 disabled:cursor-not-allowed transition-all">
              {createSub.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Subscription'}
            </button>
          </div>
        }
      >
        <form id="sub-form" onSubmit={handleCreate} className="space-y-4">
          {/* ── Subscription ── */}
          <div className="grid grid-cols-[auto_1fr] items-center gap-2">
            <span className="text-[10px] font-bold text-brand uppercase tracking-widest">Subscription</span>
            <div className="h-px bg-brand/20" />
          </div>

          <div>
            <Field label="Contact ID *">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
                <input required value={createForm.contactId} onChange={setC('contactId')} placeholder="contact-uuid"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)]"
                  style={inputStyle} />
              </div>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Account ID">
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
                <input value={createForm.accountId} onChange={setC('accountId')} placeholder="account-uuid"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)]"
                  style={inputStyle} />
              </div>
            </Field>
            <Field label="Deal ID">
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
                <input value={createForm.dealId} onChange={setC('dealId')} placeholder="deal-uuid"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)]"
                  style={inputStyle} />
              </div>
            </Field>
          </div>

          <Field label="Plan Name">
            <div className="relative">
              <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
              <input required value={createForm.planName} onChange={setC('planName')} placeholder="Pro Monthly"
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)]"
                style={inputStyle} />
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Plan Tier">
              <TierDropdown value={createForm.planTier} onChange={v => setCreateForm(f => ({ ...f, planTier: v }))} />
            </Field>
            <Field label="Billing Cadence">
              <CadenceDropdown value={createForm.billingCadence} onChange={v => setCreateForm(f => ({ ...f, billingCadence: v }))} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Amount *">
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
                <input required type="number" min="0" step="0.01" value={createForm.amount} onChange={setC('amount')} placeholder="99.00"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)]"
                  style={inputStyle} />
              </div>
            </Field>
            <Field label="Currency">
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
                <input value={createForm.currency} onChange={setC('currency')} placeholder="USD"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)]"
                  style={inputStyle} />
              </div>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Start Date">
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
                <input type="date" value={createForm.startDate} onChange={setC('startDate')}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary focus:outline-none focus:border-[rgba(0,217,138,0.50)]"
                  style={{ backgroundColor: '#1A2F27', colorScheme: 'dark', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }} />
              </div>
            </Field>
            <Field label="Seats">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
                <input type="number" min="1" value={createForm.seats} onChange={setC('seats')} placeholder="5"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)]"
                  style={inputStyle} />
              </div>
            </Field>
          </div>
        </form>
      </SlideOver>

      {/* Detail SlideOver */}
      <SlideOver open={!!selectedSub} onClose={() => setSelectedSub(null)} title="Subscription">
        {selectedSub && (
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-extrabold text-text-primary text-base">{selectedSub.planName}</div>
                <div className="text-sm text-text-secondary">{selectedSub.contactName ?? selectedSub.contactId}</div>
                <div className="mt-1"><Badge value={selectedSub.status} labels={CRM_SUBSCRIPTION_STATUS_LABELS} colors={CRM_SUBSCRIPTION_STATUS_COLORS} /></div>
              </div>
              <button onClick={() => setIsEditing(v => !v)} className="px-3 py-1.5 rounded-lg border border-border-subtle text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-bg-input transition-all">
                {isEditing ? 'Cancel Edit' : 'Edit'}
              </button>
            </div>

            {!isEditing ? (
              <div className="space-y-2 text-sm">
                {[
                  ['Tier', CRM_SUBSCRIPTION_TIER_LABELS[selectedSub.planTier as CrmSubscriptionPlanTier]],
                  ['Cadence', CRM_BILLING_CADENCE_LABELS[selectedSub.billingCadence as CrmSubscriptionBillingCadence]],
                  ['Amount', `${selectedSub.currency} ${selectedSub.amount.toLocaleString()}`],
                  ['Seats', selectedSub.seats ?? '—'],
                  ['Start', format(parseISO(selectedSub.startDate), 'MMM d, yyyy')],
                  ['Next Billing', selectedSub.nextBillingDate ? format(parseISO(selectedSub.nextBillingDate), 'MMM d, yyyy') : '—'],
                  ['Account', selectedSub.accountName ?? '—'],
                ].map(([k, v]) => (
                  <div key={String(k)} className="flex justify-between py-1.5 border-b border-border-subtle last:border-0">
                    <span className="text-text-muted">{k}</span>
                    <span className="text-text-primary font-medium">{String(v)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <form onSubmit={handleUpdate} className="space-y-4">
                <Field label="Plan Name"><input value={editForm.planName} onChange={setE('planName')} className={inputCls} /></Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Plan Tier"><select value={editForm.planTier} onChange={setE('planTier')} className={selectCls}>{Object.entries(CRM_SUBSCRIPTION_TIER_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
                  <Field label="Billing Cadence"><select value={editForm.billingCadence} onChange={setE('billingCadence')} className={selectCls}>{Object.entries(CRM_BILLING_CADENCE_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
                  <Field label="Amount"><input type="number" min="0" step="0.01" value={editForm.amount} onChange={setE('amount')} className={inputCls} /></Field>
                  <Field label="Seats"><input type="number" min="1" value={editForm.seats} onChange={setE('seats')} className={inputCls} /></Field>
                </div>
                <button type="submit" disabled={updateSub.isPending} className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-brand text-bg text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-all">
                  {updateSub.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                </button>
              </form>
            )}

            <div className="flex gap-2 pt-2 border-t border-border-subtle">
              {selectedSub.status === CrmSubscriptionStatus.Active && (
                <button onClick={() => pauseSub.mutate(selectedSub.id)} disabled={pauseSub.isPending} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border-subtle text-xs font-semibold text-text-secondary hover:text-[#F59E0B] hover:bg-[rgba(245,158,11,0.1)] transition-all disabled:opacity-50">
                  <PauseCircle className="w-3.5 h-3.5" /> Pause
                </button>
              )}
              {selectedSub.status === CrmSubscriptionStatus.Paused && (
                <button onClick={() => resumeSub.mutate(selectedSub.id)} disabled={resumeSub.isPending} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border-subtle text-xs font-semibold text-text-secondary hover:text-success hover:bg-success-soft transition-all disabled:opacity-50">
                  <PlayCircle className="w-3.5 h-3.5" /> Resume
                </button>
              )}
              {selectedSub.status !== CrmSubscriptionStatus.Cancelled && (
                <button onClick={() => { cancelSub.mutate(selectedSub.id, { onSuccess: () => setSelectedSub(null) }); }} disabled={cancelSub.isPending} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[rgba(244,63,94,0.2)] text-xs font-semibold text-danger bg-danger-soft hover:opacity-80 transition-all disabled:opacity-50">
                  <XCircle className="w-3.5 h-3.5" /> Cancel
                </button>
              )}
            </div>
          </div>
        )}
      </SlideOver>
    </>
  );
}
