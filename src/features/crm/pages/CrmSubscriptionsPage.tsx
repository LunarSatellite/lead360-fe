import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, X, Loader2, RefreshCw, PauseCircle, PlayCircle, XCircle } from 'lucide-react';
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

const inputCls = 'w-full rounded-lg border border-border-subtle bg-bg-input px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand/40';
const selectCls = 'w-full rounded-lg border border-border-subtle bg-bg-input px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/40';

function Badge({ value, labels, colors }: { value: number; labels: Record<number, string>; colors: Record<number, string> }) {
  return (
    <span className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${colors[value] ?? ''}`}>
      {labels[value] ?? value}
    </span>
  );
}

function SlideOver({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="drawer-slide-in relative w-[520px] h-full flex flex-col bg-bg-shell border-l border-thin border-border-subtle" style={{ boxShadow: '-8px 0 40px rgba(0,0,0,0.5)' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle shrink-0">
          <h3 className="font-bold text-text-primary">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-input transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-text-muted mb-1.5">{label}</label>
      {children}
    </div>
  );
}

type CreateForm = { contactId: string; accountId: string; dealId: string; planName: string; planTier: string; billingCadence: string; amount: string; currency: string; startDate: string; seats: string; };
const EMPTY_CREATE: CreateForm = { contactId: '', accountId: '', dealId: '', planName: '', planTier: '1', billingCadence: '1', amount: '', currency: 'USD', startDate: '', seats: '' };

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
      <SlideOver open={showCreate} onClose={() => setShowCreate(false)} title="New Subscription">
        <form onSubmit={handleCreate} className="space-y-4">
          <Field label="Contact ID *"><input required value={createForm.contactId} onChange={setC('contactId')} placeholder="contact-uuid" className={inputCls} /></Field>
          <Field label="Account ID"><input value={createForm.accountId} onChange={setC('accountId')} placeholder="account-uuid" className={inputCls} /></Field>
          <Field label="Deal ID"><input value={createForm.dealId} onChange={setC('dealId')} placeholder="deal-uuid" className={inputCls} /></Field>
          <Field label="Plan Name"><input required value={createForm.planName} onChange={setC('planName')} placeholder="Pro Monthly" className={inputCls} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Plan Tier"><select value={createForm.planTier} onChange={setC('planTier')} className={selectCls}>{Object.entries(CRM_SUBSCRIPTION_TIER_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
            <Field label="Billing Cadence"><select value={createForm.billingCadence} onChange={setC('billingCadence')} className={selectCls}>{Object.entries(CRM_BILLING_CADENCE_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
            <Field label="Amount"><input required type="number" min="0" step="0.01" value={createForm.amount} onChange={setC('amount')} placeholder="99.00" className={inputCls} /></Field>
            <Field label="Currency"><input value={createForm.currency} onChange={setC('currency')} placeholder="USD" className={inputCls} /></Field>
            <Field label="Start Date"><input type="date" value={createForm.startDate} onChange={setC('startDate')} className={inputCls} /></Field>
            <Field label="Seats"><input type="number" min="1" value={createForm.seats} onChange={setC('seats')} placeholder="5" className={inputCls} /></Field>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={createSub.isPending} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-brand text-bg text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-all">
              {createSub.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Subscription'}
            </button>
            <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-lg border border-border-subtle text-sm text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-all">Cancel</button>
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
