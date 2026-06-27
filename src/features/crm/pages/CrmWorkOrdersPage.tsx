import { useState } from 'react';
import { Plus, X, Loader2, Hammer, Clock, CheckCircle, XCircle, MessageSquare } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import {
  useWorkOrders, useCreateWorkOrder, useUpdateWorkOrderStatus,
  useDeleteWorkOrder, useAddWorkOrderNote, useWorkOrderById,
} from '../api/crm.queries';
import type {
  CrmWorkOrderFilter, CrmCreateWorkOrderRequest,
  CrmWorkOrderSummaryDto, CrmWorkOrderStatusRequest,
} from '../types/crm.types';
import {
  CRM_WORK_ORDER_STATUS_LABELS, CRM_WORK_ORDER_STATUS_COLORS,
  CRM_WORK_ORDER_TYPE_LABELS, CRM_WORK_ORDER_PRIORITY_LABELS, CRM_WORK_ORDER_PRIORITY_COLORS,
  CRM_WORK_ORDER_NOTE_KIND_LABELS,
  CrmWorkOrderStatus, CrmWorkOrderType, CrmWorkOrderPriority, CrmWorkOrderNoteKind,
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

const TRANSITIONS: Record<number, { status: number; label: string }[]> = {
  1: [{ status: 2, label: 'Schedule' }, { status: 6, label: 'Cancel' }],
  2: [{ status: 3, label: 'En Route' }, { status: 6, label: 'Cancel' }],
  3: [{ status: 4, label: 'Start Work' }, { status: 6, label: 'Cancel' }],
  4: [{ status: 5, label: 'Complete' }, { status: 6, label: 'Cancel' }],
};

function DetailPanel({ id }: { id: string }) {
  const { data: wo, isLoading } = useWorkOrderById(id);
  const updateStatus = useUpdateWorkOrderStatus();
  const addNote = useAddWorkOrderNote();
  const deleteWo = useDeleteWorkOrder();
  const [tab, setTab] = useState<'detail' | 'notes' | 'status'>('detail');
  const [noteKind, setNoteKind] = useState<number>(1);
  const [noteText, setNoteText] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [actualMinutes, setActualMinutes] = useState('');

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    addNote.mutate({ id, data: { kind: noteKind as CrmWorkOrderNoteKind, note: noteText.trim() } }, {
      onSuccess: () => setNoteText(''),
    });
  };

  const handleStatusChange = (toStatus: number) => {
    const data: CrmWorkOrderStatusRequest = {
      status: toStatus as CrmWorkOrderStatus,
      resolutionNotes: toStatus === CrmWorkOrderStatus.Completed ? resolutionNotes : undefined,
      actualMinutes: actualMinutes ? Number(actualMinutes) : undefined,
    };
    updateStatus.mutate({ id, data });
  };

  if (isLoading) return <div className="flex items-center justify-center h-40"><Loader2 className="w-5 h-5 animate-spin text-text-muted" /></div>;
  if (!wo) return null;

  return (
    <div className="space-y-5">
      <div>
        <div className="font-mono text-xs text-text-muted mb-1">{wo.workOrderNumber}</div>
        <div className="text-lg font-extrabold text-text-primary">{wo.title}</div>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <Badge value={wo.status} labels={CRM_WORK_ORDER_STATUS_LABELS} colors={CRM_WORK_ORDER_STATUS_COLORS} />
          <Badge value={wo.priority} labels={CRM_WORK_ORDER_PRIORITY_LABELS} colors={CRM_WORK_ORDER_PRIORITY_COLORS} />
          <span className="text-xs text-text-muted bg-bg-surface px-2 py-0.5 rounded-full">{CRM_WORK_ORDER_TYPE_LABELS[wo.type as CrmWorkOrderType]}</span>
        </div>
      </div>

      <div className="flex gap-1 border-b border-border-subtle">
        {(['detail', 'notes', 'status'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-3 py-2 text-xs font-semibold capitalize transition-colors ${tab === t ? 'text-brand border-b-2 border-brand' : 'text-text-muted hover:text-text-primary'}`}>{t}</button>
        ))}
      </div>

      {tab === 'detail' && (
        <div className="space-y-4">
          <div className="bg-bg-surface rounded-xl p-4 space-y-2 text-sm">
            {wo.contactName && <div className="flex justify-between"><span className="text-text-muted">Contact</span><span className="text-text-primary">{wo.contactName}</span></div>}
            {wo.equipmentModel && <div className="flex justify-between"><span className="text-text-muted">Equipment</span><span className="text-text-primary">{wo.equipmentModel} — {wo.equipmentSerial}</span></div>}
            {wo.siteLabel && <div className="flex justify-between"><span className="text-text-muted">Site</span><span className="text-text-primary">{wo.siteLabel}</span></div>}
            {wo.siteAddress && <div className="flex justify-between"><span className="text-text-muted">Address</span><span className="text-text-secondary text-right max-w-[220px]">{wo.siteAddress}</span></div>}
            {wo.scheduledAt && <div className="flex justify-between"><span className="text-text-muted">Scheduled</span><span className="text-brand">{format(parseISO(wo.scheduledAt), 'MMM d, yyyy HH:mm')}</span></div>}
            {wo.startedAt && <div className="flex justify-between"><span className="text-text-muted">Started</span><span>{format(parseISO(wo.startedAt), 'MMM d, yyyy HH:mm')}</span></div>}
            {wo.completedAt && <div className="flex justify-between"><span className="text-text-muted">Completed</span><span className="text-success">{format(parseISO(wo.completedAt), 'MMM d, yyyy HH:mm')}</span></div>}
            {wo.estimatedMinutes != null && <div className="flex justify-between"><span className="text-text-muted">Est. Duration</span><span>{wo.estimatedMinutes}m</span></div>}
            {wo.actualMinutes != null && <div className="flex justify-between"><span className="text-text-muted">Actual Duration</span><span>{wo.actualMinutes}m</span></div>}
            {wo.partsUsed && <div><span className="text-text-muted block text-xs mb-1">Parts Used</span><p className="text-text-secondary text-xs">{wo.partsUsed}</p></div>}
            {wo.description && <div><span className="text-text-muted block text-xs mb-1">Description</span><p className="text-text-secondary text-xs">{wo.description}</p></div>}
            {wo.resolutionNotes && <div><span className="text-text-muted block text-xs mb-1">Resolution</span><p className="text-text-secondary text-xs">{wo.resolutionNotes}</p></div>}
          </div>
        </div>
      )}

      {tab === 'notes' && (
        <div className="space-y-4">
          <form onSubmit={handleAddNote} className="space-y-2">
            <div className="flex gap-2">
              <select value={noteKind} onChange={e => setNoteKind(Number(e.target.value))} className="rounded-lg border border-border-subtle bg-bg-elevated px-2 py-2 text-xs text-text-primary focus:outline-none">
                {Object.entries(CRM_WORK_ORDER_NOTE_KIND_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
              <input value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Add a note..." className={`${inputCls} flex-1`} />
              <button type="submit" disabled={!noteText.trim() || addNote.isPending} className="px-3 py-2 rounded-lg bg-brand text-bg text-xs font-bold hover:opacity-90 disabled:opacity-50 transition-all">
                {addNote.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Add'}
              </button>
            </div>
          </form>
          <div className="space-y-2">
            {wo.notes.length === 0 && <p className="text-sm text-text-muted text-center py-6">No notes yet.</p>}
            {wo.notes.map(n => (
              <div key={n.id} className="bg-bg-surface rounded-xl p-3 text-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-text-secondary">{CRM_WORK_ORDER_NOTE_KIND_LABELS[n.kind as CrmWorkOrderNoteKind]}</span>
                  <span className="text-xs text-text-muted">{format(parseISO(n.createdAt), 'MMM d, yyyy')}</span>
                </div>
                <p className="text-text-primary">{n.note}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'status' && (
        <div className="space-y-4">
          {wo.status === CrmWorkOrderStatus.InProgress && (
            <div className="space-y-3">
              <Field label="Actual Minutes">
                <input type="number" min="0" value={actualMinutes} onChange={e => setActualMinutes(e.target.value)} placeholder="e.g. 90" className={inputCls} />
              </Field>
              <Field label="Resolution Notes (required to complete)">
                <textarea value={resolutionNotes} onChange={e => setResolutionNotes(e.target.value)} rows={3} className={`${inputCls} resize-none`} />
              </Field>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {(TRANSITIONS[wo.status] ?? []).map(t => (
              <button key={t.status} onClick={() => handleStatusChange(t.status)}
                disabled={updateStatus.isPending || (t.status === CrmWorkOrderStatus.Completed && !resolutionNotes.trim())}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold transition-all disabled:opacity-50 ${t.status === CrmWorkOrderStatus.Completed ? 'text-success bg-success-soft border-[rgba(34,197,94,0.2)] hover:opacity-80' : t.status === CrmWorkOrderStatus.Cancelled ? 'text-danger bg-danger-soft border-[rgba(244,63,94,0.2)] hover:opacity-80' : 'text-text-secondary border-border-subtle hover:text-brand hover:bg-brand-soft'}`}>
                {t.status === CrmWorkOrderStatus.Completed ? <CheckCircle className="w-3.5 h-3.5" /> : t.status === CrmWorkOrderStatus.Cancelled ? <XCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                {t.label}
              </button>
            ))}
          </div>

          {wo.status === CrmWorkOrderStatus.Draft && (
            <div className="pt-2 border-t border-border-subtle">
              <button onClick={() => deleteWo.mutate(id)} disabled={deleteWo.isPending} className="text-xs text-danger hover:opacity-80 disabled:opacity-50">Delete work order</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function Component() {
  const [filter, setFilter] = useState<CrmWorkOrderFilter>({ page: 1, pageSize: 20 });
  const [search, setSearch] = useState('');
  const [statusF, setStatusF] = useState('');
  const [priorityF, setPriorityF] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const [title, setTitle] = useState('');
  const [type, setType] = useState<number>(1);
  const [priority, setPriority] = useState<number>(2);
  const [contactId, setContactId] = useState('');
  const [equipmentId, setEquipmentId] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [siteLabel, setSiteLabel] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState('');

  const { data: raw, isLoading } = useWorkOrders(filter);
  const items: CrmWorkOrderSummaryDto[] = (raw as any)?.item1 ?? [];
  const total: number = (raw as any)?.item2 ?? 0;

  const createWo = useCreateWorkOrder();

  const applyFilter = () => {
    setFilter(f => ({
      ...f, page: 1,
      search: search || undefined,
      status: statusF ? Number(statusF) as CrmWorkOrderStatus : undefined,
      priority: priorityF ? Number(priorityF) as CrmWorkOrderPriority : undefined,
    }));
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const req: CrmCreateWorkOrderRequest = {
      title: title.trim(),
      type: type as CrmWorkOrderType,
      priority: priority as CrmWorkOrderPriority,
      contactId: contactId.trim(),
      equipmentId: equipmentId.trim() || undefined,
      scheduledAt: scheduledAt || undefined,
      siteLabel: siteLabel || undefined,
      estimatedMinutes: estimatedMinutes ? Number(estimatedMinutes) : undefined,
    };
    createWo.mutate(req, {
      onSuccess: () => {
        setShowCreate(false);
        setTitle(''); setContactId(''); setEquipmentId(''); setScheduledAt(''); setSiteLabel(''); setEstimatedMinutes('');
      },
    });
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-text-primary tracking-tight">Work Orders</h2>
            <p className="text-xs text-text-muted mt-0.5">Field service jobs — installation, repair, maintenance</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-bg bg-brand hover:opacity-90 transition-all">
            <Plus className="w-3.5 h-3.5" strokeWidth={2.5} /> New Work Order
          </button>
        </div>

        <div className="flex gap-2 flex-wrap">
          <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && applyFilter()} placeholder="Search work orders..." className="flex-1 min-w-48 rounded-lg border border-border-subtle bg-bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand/40" />
          <select value={statusF} onChange={e => setStatusF(e.target.value)} className="rounded-lg border border-border-subtle bg-bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none">
            <option value="">All Status</option>
            {Object.entries(CRM_WORK_ORDER_STATUS_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
          <select value={priorityF} onChange={e => setPriorityF(e.target.value)} className="rounded-lg border border-border-subtle bg-bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none">
            <option value="">All Priority</option>
            {Object.entries(CRM_WORK_ORDER_PRIORITY_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
          <button onClick={applyFilter} className="px-4 py-2 rounded-lg border border-border-subtle bg-bg-surface text-sm text-text-secondary hover:text-text-primary transition-all">Search</button>
        </div>

        <div className="rounded-2xl border border-border-subtle bg-bg-card overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-40 text-text-muted"><Loader2 className="w-5 h-5 animate-spin" /></div>
          ) : !items.length ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-text-muted">
              <Hammer className="w-8 h-8 opacity-30" strokeWidth={1.2} />
              <p className="text-sm">No work orders found.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle">
                  {['WO #', 'Title', 'Type', 'Status', 'Priority', 'Site', 'Scheduled'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map(wo => (
                  <tr key={wo.id} onClick={() => setSelectedId(wo.id)} className="border-b border-border-subtle last:border-0 hover:bg-bg-elevated cursor-pointer transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-text-secondary">{wo.workOrderNumber}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-text-primary truncate max-w-[180px]">{wo.title}</div>
                      {wo.contactName && <div className="text-xs text-text-muted">{wo.contactName}</div>}
                    </td>
                    <td className="px-4 py-3 text-text-secondary text-xs">{CRM_WORK_ORDER_TYPE_LABELS[wo.type as CrmWorkOrderType]}</td>
                    <td className="px-4 py-3"><Badge value={wo.status} labels={CRM_WORK_ORDER_STATUS_LABELS} colors={CRM_WORK_ORDER_STATUS_COLORS} /></td>
                    <td className="px-4 py-3"><Badge value={wo.priority} labels={CRM_WORK_ORDER_PRIORITY_LABELS} colors={CRM_WORK_ORDER_PRIORITY_COLORS} /></td>
                    <td className="px-4 py-3 text-text-secondary text-xs">{wo.siteLabel ?? '—'}</td>
                    <td className="px-4 py-3 text-text-muted text-xs">{wo.scheduledAt ? format(parseISO(wo.scheduledAt), 'MMM d, HH:mm') : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {total > filter.pageSize! && (
          <div className="flex items-center justify-between text-sm text-text-muted">
            <span>{total} total</span>
            <div className="flex gap-2">
              <button disabled={filter.page === 1} onClick={() => setFilter(f => ({ ...f, page: f.page! - 1 }))} className="px-3 py-1.5 rounded-lg border border-border-subtle hover:bg-bg-elevated disabled:opacity-40 transition-all">Prev</button>
              <button disabled={filter.page! * filter.pageSize! >= total} onClick={() => setFilter(f => ({ ...f, page: f.page! + 1 }))} className="px-3 py-1.5 rounded-lg border border-border-subtle hover:bg-bg-elevated disabled:opacity-40 transition-all">Next</button>
            </div>
          </div>
        )}
      </div>

      <SlideOver open={showCreate} onClose={() => setShowCreate(false)} title="New Work Order">
        <form onSubmit={handleCreate} className="space-y-4">
          <Field label="Title *"><input required value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Repair espresso machine" className={inputCls} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type">
              <select value={type} onChange={e => setType(Number(e.target.value))} className={inputCls}>
                {Object.entries(CRM_WORK_ORDER_TYPE_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
            </Field>
            <Field label="Priority">
              <select value={priority} onChange={e => setPriority(Number(e.target.value))} className={inputCls}>
                {Object.entries(CRM_WORK_ORDER_PRIORITY_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Contact ID *"><input required value={contactId} onChange={e => setContactId(e.target.value)} placeholder="contact-uuid" className={inputCls} /></Field>
          <Field label="Equipment ID (optional)"><input value={equipmentId} onChange={e => setEquipmentId(e.target.value)} placeholder="equipment-uuid" className={inputCls} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Scheduled At"><input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} className={inputCls} /></Field>
            <Field label="Est. Minutes"><input type="number" min="0" value={estimatedMinutes} onChange={e => setEstimatedMinutes(e.target.value)} placeholder="e.g. 120" className={inputCls} /></Field>
          </div>
          <Field label="Site Label"><input value={siteLabel} onChange={e => setSiteLabel(e.target.value)} placeholder="e.g. Kathmandu Branch" className={inputCls} /></Field>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={createWo.isPending} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-brand text-bg text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-all">
              {createWo.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Work Order'}
            </button>
            <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-lg border border-border-subtle text-sm text-text-secondary hover:text-text-primary transition-all">Cancel</button>
          </div>
        </form>
      </SlideOver>

      <SlideOver open={!!selectedId} onClose={() => setSelectedId(null)} title="Work Order" width="600px">
        {selectedId && <DetailPanel id={selectedId} />}
      </SlideOver>
    </>
  );
}
