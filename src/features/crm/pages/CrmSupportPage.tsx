import { useState } from 'react';
import { Plus, X, Loader2, LifeBuoy, Send, AlertTriangle, CheckCircle, XCircle, ChevronLeft, ChevronRight, Search, Shield, Trash2 } from 'lucide-react';
import {
  useSupportCases, useCreateSupportCase, useSupportCaseById,
  useAddSupportCaseMessage,
  useEscalateSupportCase, useResolveSupportCase, useCloseSupportCase, useSlaPolicies,
  useCreateSlaPolicy, useDeleteSlaPolicy,
} from '../api/crm.queries';
import type {
  CrmSupportCaseSummaryDto, CrmSupportCaseCreateRequest, CrmSupportCaseFilter,
  CrmSupportMessageDto, CrmSlaPolicySummaryDto, CrmSlaPolicyCreateRequest, PagedResult,
} from '../types/crm.types';
import {
  CrmSupportCaseStatus, CrmSupportCasePriority,
  CRM_SUPPORT_STATUS_LABELS, CRM_SUPPORT_STATUS_COLORS,
  CRM_SUPPORT_PRIORITY_LABELS, CRM_SUPPORT_PRIORITY_COLORS,
} from '../types/crm.types';
import { format, parseISO, differenceInMinutes } from 'date-fns';

const PAGE_SIZE = 20;

const inputCls = 'w-full px-3 py-2 rounded-xl bg-bg-elevated border border-border-subtle text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-medium';
const selectCls = 'px-3 py-2 rounded-xl bg-bg-elevated border border-border-subtle text-sm text-text-secondary focus:outline-none focus:border-border-medium';

function Badge({ label, colorCls }: { label: string; colorCls: string }) {
  return <span className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${colorCls}`}>{label}</span>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold text-text-muted mb-0.5">{label}</dt>
      <dd className="text-sm text-text-primary">{children}</dd>
    </div>
  );
}

function SlideOver({ title, onClose, wide, children }: { title: string; onClose: () => void; wide?: boolean; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${wide ? 'max-w-2xl' : 'max-w-md'} bg-bg-elevated shadow-2xl flex flex-col border-thin border-border-subtle rounded-card max-h-[90vh]`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle shrink-0">
          <h3 className="font-bold text-text-primary">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function SlaTimer({ deadline }: { deadline: string | null }) {
  if (!deadline) return null;
  const mins = differenceInMinutes(parseISO(deadline), new Date());
  if (mins < 0) return <span className="text-xs font-semibold text-danger">Breached</span>;
  if (mins < 120) return <span className="text-xs font-semibold text-[#F59E0B]">{Math.floor(mins / 60)}h {mins % 60}m</span>;
  return <span className="text-xs font-semibold text-success">{Math.floor(mins / 60)}h left</span>;
}

function SlaPolicyManager({ onClose }: { onClose: () => void }) {
  const { data: rawSla } = useSlaPolicies();
  const policies: CrmSlaPolicySummaryDto[] = (rawSla as any)?.items ?? (Array.isArray(rawSla) ? rawSla : []);
  const createPolicy = useCreateSlaPolicy();
  const deletePolicy = useDeleteSlaPolicy();
  const [form, setForm] = useState<CrmSlaPolicyCreateRequest>({ name: '', initialResponseSlaHours: 4, resolutionSlaHours: 48, isDefault: false });

  return (
    <SlideOver title="SLA Policies" onClose={onClose}>
      <div className="space-y-5">
        <div className="space-y-3">
          {policies.length === 0 && <p className="text-xs text-text-muted italic">No SLA policies yet.</p>}
          {policies.map(p => (
            <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-bg-elevated border border-border-subtle">
              <div>
                <p className="text-sm font-semibold text-text-primary">{p.name}</p>
                <p className="text-xs text-text-muted mt-0.5">First response: {p.firstResponseMinutes}m · Resolution: {p.resolutionMinutes}m</p>
              </div>
              <button onClick={() => deletePolicy.mutate(p.id)} disabled={deletePolicy.isPending} className="p-1.5 text-text-muted hover:text-danger transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
        <div className="border-t border-border-subtle pt-4 space-y-3">
          <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Add New Policy</p>
          <div><label className="block text-xs font-semibold text-text-muted mb-1">Name *</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Standard, Premium" className={inputCls} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-semibold text-text-muted mb-1">First Response (hrs)</label>
              <input type="number" min={0.5} step={0.5} value={form.initialResponseSlaHours} onChange={e => setForm(f => ({ ...f, initialResponseSlaHours: Number(e.target.value) }))} className={inputCls} /></div>
            <div><label className="block text-xs font-semibold text-text-muted mb-1">Resolution (hrs)</label>
              <input type="number" min={1} step={1} value={form.resolutionSlaHours} onChange={e => setForm(f => ({ ...f, resolutionSlaHours: Number(e.target.value) }))} className={inputCls} /></div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isDefault} onChange={e => setForm(f => ({ ...f, isDefault: e.target.checked }))} className="rounded" />
            <span className="text-xs text-text-secondary">Set as default policy</span>
          </label>
          <button
            disabled={!form.name.trim() || createPolicy.isPending}
            onClick={() => createPolicy.mutate(form, { onSuccess: () => setForm({ name: '', initialResponseSlaHours: 4, resolutionSlaHours: 48, isDefault: false }) })}
            className="w-full py-2 rounded-xl bg-brand text-bg text-sm font-bold hover:bg-brand-light disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {createPolicy.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Policy'}
          </button>
        </div>
      </div>
    </SlideOver>
  );
}

function CreateForm({ onSave, onCancel, isSaving }: { onSave: (d: CrmSupportCaseCreateRequest) => void; onCancel: () => void; isSaving: boolean }) {
  const [form, setForm] = useState({ subject: '', contactId: '', priority: '', slaPolicyId: '', description: '' });
  const { data: rawSla } = useSlaPolicies();
  const slaPolicies: CrmSlaPolicySummaryDto[] = (rawSla as any)?.items ?? (Array.isArray(rawSla) ? rawSla : []);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <form onSubmit={e => { e.preventDefault(); onSave({ subject: form.subject, contactId: form.contactId || undefined, priority: form.priority ? Number(form.priority) as CrmSupportCasePriority : undefined, slaPolicyId: form.slaPolicyId || undefined, description: form.description || undefined }); }} className="space-y-4">
      <div><label className="block text-xs font-semibold text-text-muted mb-1.5">Subject *</label><input required value={form.subject} onChange={set('subject')} placeholder="Describe the issue..." className={inputCls} /></div>
      <div><label className="block text-xs font-semibold text-text-muted mb-1.5">Contact ID</label><input value={form.contactId} onChange={set('contactId')} placeholder="UUID (optional)" className={inputCls} /></div>
      <div><label className="block text-xs font-semibold text-text-muted mb-1.5">Priority</label>
        <select value={form.priority} onChange={set('priority')} className={`${selectCls} w-full`}>
          <option value="">Select priority</option>
          {Object.entries(CRM_SUPPORT_PRIORITY_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
      </div>
      <div><label className="block text-xs font-semibold text-text-muted mb-1.5">SLA Policy</label>
        <select value={form.slaPolicyId} onChange={set('slaPolicyId')} className={`${selectCls} w-full`}>
          <option value="">None</option>
          {slaPolicies.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
      <div><label className="block text-xs font-semibold text-text-muted mb-1.5">Description</label><textarea rows={4} value={form.description} onChange={set('description')} placeholder="Additional details..." className={`${inputCls} resize-none`} /></div>
      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={isSaving || !form.subject.trim()} className="flex-1 py-2 rounded-xl bg-brand text-bg text-sm font-bold hover:bg-brand-light disabled:opacity-50 transition-all">
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Create Case'}
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-xl border border-border-subtle text-sm text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-all">Cancel</button>
      </div>
    </form>
  );
}

function DetailPanel({ caseId, onClose }: { caseId: string; onClose: () => void }) {
  const [tab, setTab] = useState<'details' | 'messages'>('details');
  const [msgBody, setMsgBody] = useState('');
  const { data: raw, isLoading } = useSupportCaseById(caseId);
  const detail = raw as any;
  const escalate = useEscalateSupportCase();
  const resolve = useResolveSupportCase();
  const close = useCloseSupportCase();
  const addMsg = useAddSupportCaseMessage();

  const handleSend = () => {
    if (!msgBody.trim()) return;
    addMsg.mutate({ id: caseId, body: msgBody }, { onSuccess: () => setMsgBody('') });
  };

  return (
    <SlideOver title={detail?.caseNumber ? `Case ${detail.caseNumber}` : 'Case Detail'} onClose={onClose} wide>
      {isLoading ? <div className="flex items-center justify-center h-32 text-text-muted"><Loader2 className="w-5 h-5 animate-spin" /></div> : !detail ? <p className="text-sm text-text-muted">Not found.</p> : (
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            <Badge label={CRM_SUPPORT_STATUS_LABELS[detail.status as CrmSupportCaseStatus]} colorCls={CRM_SUPPORT_STATUS_COLORS[detail.status as CrmSupportCaseStatus]} />
            <Badge label={CRM_SUPPORT_PRIORITY_LABELS[detail.priority as CrmSupportCasePriority]} colorCls={CRM_SUPPORT_PRIORITY_COLORS[detail.priority as CrmSupportCasePriority]} />
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => escalate.mutate(caseId)} disabled={escalate.isPending} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[rgba(245,158,11,0.1)] text-[#F59E0B] text-xs font-semibold border border-[rgba(245,158,11,0.2)] hover:bg-[rgba(245,158,11,0.2)] transition-all disabled:opacity-50">
              <AlertTriangle className="w-3.5 h-3.5" /> Escalate
            </button>
            <button onClick={() => resolve.mutate(caseId)} disabled={resolve.isPending} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-success-soft text-success text-xs font-semibold border border-[rgba(34,197,94,0.2)] hover:bg-success hover:text-bg transition-all disabled:opacity-50">
              <CheckCircle className="w-3.5 h-3.5" /> Resolve
            </button>
            <button onClick={() => close.mutate(caseId)} disabled={close.isPending} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-bg-elevated text-text-secondary text-xs font-semibold border border-border-subtle hover:bg-bg-card transition-all disabled:opacity-50">
              <XCircle className="w-3.5 h-3.5" /> Close
            </button>
          </div>
          <div className="flex border-b border-border-subtle">
            {(['details', 'messages'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-xs font-semibold capitalize transition-colors ${tab === t ? 'text-brand border-b-2 border-brand' : 'text-text-muted hover:text-text-secondary'}`}>{t}</button>
            ))}
          </div>
          {tab === 'details' && (
            <dl className="grid grid-cols-2 gap-4">
              <Field label="Subject"><span className="col-span-2">{detail.subject}</span></Field>
              <Field label="Contact">{detail.contactName ?? '—'}</Field>
              <Field label="Assigned To">{detail.assignedToUserName ?? '—'}</Field>
              <Field label="SLA Policy">{detail.slaPolicyName ?? '—'}</Field>
              <Field label="SLA Deadline"><SlaTimer deadline={detail.slaResolutionDeadline} /></Field>
              <Field label="Created">{format(parseISO(detail.createdAt), 'MMM d, yyyy HH:mm')}</Field>
              {detail.description && <div className="col-span-2"><Field label="Description">{detail.description}</Field></div>}
            </dl>
          )}
          {tab === 'messages' && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 min-h-32">
                {(detail.messages ?? []).length === 0 && <p className="text-sm text-text-muted text-center py-6">No messages yet.</p>}
                {(detail.messages as CrmSupportMessageDto[]).map(m => (
                  <div key={m.id} className={`flex ${m.isFromCustomer ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-xs px-3 py-2 rounded-xl text-sm ${m.isFromCustomer ? 'bg-bg-subtle text-text-primary' : 'bg-brand-soft text-brand'}`}>
                      <div className="font-semibold text-xs mb-0.5 text-text-muted">{m.authorName}</div>
                      <div>{m.body}</div>
                      <div className="text-[10px] mt-1 opacity-60">{format(parseISO(m.createdAt), 'HH:mm')}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-2 border-t border-border-subtle">
                <textarea rows={2} value={msgBody} onChange={e => setMsgBody(e.target.value)} placeholder="Type a message..." className={`${inputCls} flex-1 resize-none`} />
                <button onClick={handleSend} disabled={!msgBody.trim() || addMsg.isPending} className="px-3 py-2 rounded-xl bg-brand text-bg self-end disabled:opacity-50 hover:bg-brand-light transition-all">
                  {addMsg.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </SlideOver>
  );
}

export function Component() {
  const [filter, setFilter] = useState<CrmSupportCaseFilter>({ page: 1, pageSize: PAGE_SIZE });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showSla, setShowSla] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: raw, isLoading } = useSupportCases(filter);
  const data = (raw as unknown as PagedResult<CrmSupportCaseSummaryDto> | undefined);
  const items: CrmSupportCaseSummaryDto[] = (raw as any)?.items ?? [];

  const createCase = useCreateSupportCase();

  const applyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    setFilter(f => ({ ...f, search: search || undefined, status: statusFilter ? Number(statusFilter) as CrmSupportCaseStatus : undefined, priority: priorityFilter ? Number(priorityFilter) as CrmSupportCasePriority : undefined, page: 1 }));
  };

  const totalPages = data ? Math.ceil(data.totalCount / PAGE_SIZE) : 1;
  const currentPage = filter.page ?? 1;

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-text-primary tracking-tight">Support Cases</h2>
            <p className="text-xs text-text-muted mt-0.5">{data ? `${data.totalCount.toLocaleString()} total` : 'Loading...'}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowSla(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-border-subtle bg-bg-elevated text-text-secondary hover:text-text-primary transition-all">
              <Shield className="w-3.5 h-3.5" /> SLA Policies
            </button>
            <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-bg bg-brand hover:bg-brand-light transition-all">
              <Plus className="w-3.5 h-3.5" strokeWidth={2.5} /> New Case
            </button>
          </div>
        </div>

        <form onSubmit={applyFilters} className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" strokeWidth={1.5} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search cases..." className="w-full pl-9 pr-4 py-2 rounded-xl bg-bg-elevated border border-border-subtle text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-medium" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={selectCls}>
            <option value="">All Statuses</option>
            <option value="1">Open</option>
            <option value="5">In Progress</option>
            <option value="4">Escalated</option>
            <option value="6">Resolved</option>
            <option value="7">Closed</option>
          </select>
          <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} className={selectCls}>
            <option value="">All Priorities</option>
            {Object.entries(CRM_SUPPORT_PRIORITY_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
          <button type="submit" className="px-4 py-2 rounded-xl bg-bg-elevated border border-border-subtle text-sm text-text-secondary hover:text-text-primary transition-all">Search</button>
        </form>

        <div className="rounded-2xl border border-border-subtle bg-bg-card overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-48 text-text-muted"><Loader2 className="w-5 h-5 animate-spin" /></div>
          ) : !items.length ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-text-muted">
              <LifeBuoy className="w-8 h-8 opacity-30" strokeWidth={1.2} />
              <p className="text-sm">No support cases found</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle">
                  {['Case #', 'Subject', 'Contact', 'Priority', 'Status', 'SLA', 'Assigned To', 'Created'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((c) => (
                  <tr key={c.id} onClick={() => setSelectedId(c.id)} className="border-b border-border-subtle last:border-0 hover:bg-bg-elevated cursor-pointer transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-text-muted">{c.caseNumber}</td>
                    <td className="px-4 py-3 font-semibold text-text-primary max-w-48 truncate">{c.subject}</td>
                    <td className="px-4 py-3 text-text-secondary">{c.contactName ?? '—'}</td>
                    <td className="px-4 py-3"><Badge label={CRM_SUPPORT_PRIORITY_LABELS[c.priority]} colorCls={CRM_SUPPORT_PRIORITY_COLORS[c.priority]} /></td>
                    <td className="px-4 py-3"><Badge label={CRM_SUPPORT_STATUS_LABELS[c.status]} colorCls={CRM_SUPPORT_STATUS_COLORS[c.status]} /></td>
                    <td className="px-4 py-3"><SlaTimer deadline={c.slaResolutionDeadline} /></td>
                    <td className="px-4 py-3 text-text-secondary">{c.assignedToUserName ?? '—'}</td>
                    <td className="px-4 py-3 text-text-muted text-xs">{format(parseISO(c.createdAt), 'MMM d, yyyy')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>Page {currentPage} of {totalPages}</span>
            <div className="flex gap-2">
              <button disabled={currentPage <= 1} onClick={() => setFilter(f => ({ ...f, page: (f.page ?? 1) - 1 }))} className="p-1.5 rounded-lg border border-border-subtle hover:bg-bg-elevated disabled:opacity-40 disabled:cursor-not-allowed transition-all"><ChevronLeft className="w-4 h-4" /></button>
              <button disabled={currentPage >= totalPages} onClick={() => setFilter(f => ({ ...f, page: (f.page ?? 1) + 1 }))} className="p-1.5 rounded-lg border border-border-subtle hover:bg-bg-elevated disabled:opacity-40 disabled:cursor-not-allowed transition-all"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>

      {showSla && <SlaPolicyManager onClose={() => setShowSla(false)} />}
      {showCreate && (
        <SlideOver title="New Support Case" onClose={() => setShowCreate(false)}>
          <CreateForm onSave={req => createCase.mutate(req, { onSuccess: () => setShowCreate(false) })} onCancel={() => setShowCreate(false)} isSaving={createCase.isPending} />
        </SlideOver>
      )}

      {selectedId && <DetailPanel caseId={selectedId} onClose={() => setSelectedId(null)} />}
    </>
  );
}
