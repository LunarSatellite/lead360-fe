import { useState } from 'react';
import { Plus, X, Loader2, Wrench, FileText, AlertTriangle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import {
  useEquipment, useEquipmentById, useCreateEquipment,
  useUpdateEquipmentStatus, useDeleteEquipment, useAddEquipmentNote,
} from '../api/crm.queries';
import type { CrmEquipmentFilter, CrmEquipmentCreateRequest, CrmEquipmentSummaryDto } from '../types/crm.types';
import {
  CRM_EQUIPMENT_STATUS_LABELS, CRM_EQUIPMENT_STATUS_COLORS,
  CRM_EQUIPMENT_CONDITION_LABELS, CRM_EQUIPMENT_NOTE_KIND_LABELS,
  CrmEquipmentStatus, CrmEquipmentCondition, CrmEquipmentNoteKind,
} from '../types/crm.types';

const inputCls = 'w-full rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand/40';

function Badge({ value, labels, colors }: { value: number; labels: Record<number, string>; colors: Record<number, string> }) {
  return (
    <span className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${colors[value] ?? ''}`}>
      {labels[value] ?? value}
    </span>
  );
}

function SlideOver({ open, onClose, title, children, width = '540px' }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; width?: string }) {
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

function DetailPanel({ id, onClose }: { id: string; onClose: () => void }) {
  const { data: eq, isLoading } = useEquipmentById(id);
  const updateStatus = useUpdateEquipmentStatus();
  const deleteEq = useDeleteEquipment();
  const addNote = useAddEquipmentNote();
  const [noteKind, setNoteKind] = useState<number>(1);
  const [noteText, setNoteText] = useState('');
  const [tab, setTab] = useState<'detail' | 'notes'>('detail');

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    addNote.mutate({ id, data: { kind: noteKind as CrmEquipmentNoteKind, note: noteText.trim() } }, {
      onSuccess: () => setNoteText(''),
    });
  };

  if (isLoading) return <div className="flex items-center justify-center h-40"><Loader2 className="w-5 h-5 animate-spin text-text-muted" /></div>;
  if (!eq) return null;

  return (
    <div className="space-y-5">
      <div>
        <div className="font-mono text-xs text-text-muted mb-1">{eq.serialNumber}</div>
        <div className="text-lg font-extrabold text-text-primary">{eq.model}{eq.brand ? ` — ${eq.brand}` : ''}</div>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <Badge value={eq.status} labels={CRM_EQUIPMENT_STATUS_LABELS} colors={CRM_EQUIPMENT_STATUS_COLORS} />
          {eq.condition != null && (
            <span className="px-2 py-0.5 rounded-md text-xs font-semibold border border-border-subtle text-text-secondary bg-bg-elevated">
              {CRM_EQUIPMENT_CONDITION_LABELS[eq.condition as CrmEquipmentCondition]}
            </span>
          )}
          {eq.category && <span className="text-xs text-text-muted bg-bg-surface px-2 py-0.5 rounded-full">{eq.category}</span>}
        </div>
      </div>

      <div className="flex gap-1 border-b border-border-subtle">
        {(['detail', 'notes'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-3 py-2 text-xs font-semibold capitalize transition-colors ${tab === t ? 'text-brand border-b-2 border-brand' : 'text-text-muted hover:text-text-primary'}`}>{t}</button>
        ))}
      </div>

      {tab === 'detail' && (
        <div className="space-y-4">
          <div className="bg-bg-surface rounded-xl p-4 space-y-2 text-sm">
            {eq.contactName && <div className="flex justify-between"><span className="text-text-muted">Contact</span><span className="text-text-primary">{eq.contactName}</span></div>}
            {eq.accountName && <div className="flex justify-between"><span className="text-text-muted">Account</span><span className="text-text-primary">{eq.accountName}</span></div>}
            {eq.siteLabel && <div className="flex justify-between"><span className="text-text-muted">Site</span><span className="text-text-primary">{eq.siteLabel}</span></div>}
            {eq.siteAddress && <div className="flex justify-between"><span className="text-text-muted">Address</span><span className="text-text-primary text-right max-w-[220px]">{eq.siteAddress}</span></div>}
            {eq.purchasedAt && <div className="flex justify-between"><span className="text-text-muted">Purchased</span><span>{format(parseISO(eq.purchasedAt), 'MMM d, yyyy')}</span></div>}
            {eq.installedAt && <div className="flex justify-between"><span className="text-text-muted">Installed</span><span>{format(parseISO(eq.installedAt), 'MMM d, yyyy')}</span></div>}
            {eq.warrantyEndDate && <div className="flex justify-between"><span className="text-text-muted">Warranty Ends</span><span className="text-text-primary">{format(parseISO(eq.warrantyEndDate), 'MMM d, yyyy')}</span></div>}
            {eq.nextServiceDue && <div className="flex justify-between"><span className="text-text-muted">Next Service</span><span className="text-[#F59E0B]">{format(parseISO(eq.nextServiceDue), 'MMM d, yyyy')}</span></div>}
            {eq.lastServicedAt && <div className="flex justify-between"><span className="text-text-muted">Last Serviced</span><span>{format(parseISO(eq.lastServicedAt), 'MMM d, yyyy')}</span></div>}
            {eq.purchasePrice != null && <div className="flex justify-between"><span className="text-text-muted">Purchase Price</span><span>{eq.currency} {eq.purchasePrice.toLocaleString()}</span></div>}
            {eq.description && <div><span className="text-text-muted block mb-1">Description</span><p className="text-text-secondary text-xs">{eq.description}</p></div>}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-text-muted">Change Status</label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(CRM_EQUIPMENT_STATUS_LABELS).map(([k, l]) => (
                <button key={k} onClick={() => updateStatus.mutate({ id, data: { status: Number(k) as CrmEquipmentStatus } })}
                  disabled={eq.status === Number(k) || updateStatus.isPending}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all disabled:opacity-40 ${CRM_EQUIPMENT_STATUS_COLORS[Number(k) as CrmEquipmentStatus]} hover:opacity-80`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-border-subtle">
            <button onClick={() => { deleteEq.mutate(id); onClose(); }}
              disabled={deleteEq.isPending}
              className="flex items-center gap-1.5 text-xs text-danger hover:opacity-80 disabled:opacity-50">
              <AlertTriangle className="w-3.5 h-3.5" /> Remove Equipment
            </button>
          </div>
        </div>
      )}

      {tab === 'notes' && (
        <div className="space-y-4">
          <form onSubmit={handleAddNote} className="space-y-2">
            <div className="flex gap-2">
              <select value={noteKind} onChange={e => setNoteKind(Number(e.target.value))} className="rounded-lg border border-border-subtle bg-bg-elevated px-2 py-2 text-xs text-text-primary focus:outline-none">
                {Object.entries(CRM_EQUIPMENT_NOTE_KIND_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
              <input value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Add a note..." className={`${inputCls} flex-1`} />
              <button type="submit" disabled={!noteText.trim() || addNote.isPending} className="px-3 py-2 rounded-lg bg-brand text-bg text-xs font-bold hover:opacity-90 disabled:opacity-50 transition-all">
                {addNote.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Add'}
              </button>
            </div>
          </form>

          <div className="space-y-2">
            {eq.notes.length === 0 && <p className="text-sm text-text-muted text-center py-6">No notes yet.</p>}
            {eq.notes.map(n => (
              <div key={n.id} className="bg-bg-surface rounded-xl p-3 text-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-text-secondary">{CRM_EQUIPMENT_NOTE_KIND_LABELS[n.kind as CrmEquipmentNoteKind]}</span>
                  <span className="text-xs text-text-muted">{format(parseISO(n.createdAt), 'MMM d, yyyy')}</span>
                </div>
                <p className="text-text-primary">{n.note}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function Component() {
  const [filter, setFilter] = useState<CrmEquipmentFilter>({ page: 1, pageSize: 20 });
  const [search, setSearch] = useState('');
  const [statusF, setStatusF] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const [serial, setSerial] = useState('');
  const [model, setModel] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [contactId, setContactId] = useState('');
  const [warrantyEnd, setWarrantyEnd] = useState('');
  const [nextService, setNextService] = useState('');

  const { data: raw, isLoading } = useEquipment(filter);
  const items: CrmEquipmentSummaryDto[] = (raw as any)?.item1 ?? [];
  const total: number = (raw as any)?.item2 ?? 0;

  const createEq = useCreateEquipment();

  const applyFilter = () => {
    setFilter(f => ({
      ...f, page: 1,
      search: search || undefined,
      status: statusF ? Number(statusF) as CrmEquipmentStatus : undefined,
    }));
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const req: CrmEquipmentCreateRequest = {
      serialNumber: serial.trim(),
      model: model.trim(),
      brand: brand || undefined,
      category: category || undefined,
      contactId: contactId.trim(),
      warrantyEndDate: warrantyEnd || undefined,
      nextServiceDue: nextService || undefined,
    };
    createEq.mutate(req, {
      onSuccess: () => {
        setShowCreate(false);
        setSerial(''); setModel(''); setBrand(''); setCategory(''); setContactId(''); setWarrantyEnd(''); setNextService('');
      },
    });
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-text-primary tracking-tight">Equipment</h2>
            <p className="text-xs text-text-muted mt-0.5">Manage installed assets, warranties, and service schedules</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-bg bg-brand hover:opacity-90 transition-all">
            <Plus className="w-3.5 h-3.5" strokeWidth={2.5} /> Register Equipment
          </button>
        </div>

        <div className="flex gap-2 flex-wrap">
          <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && applyFilter()} placeholder="Search serial #, model, brand..." className="flex-1 min-w-48 rounded-lg border border-border-subtle bg-bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand/40" />
          <select value={statusF} onChange={e => setStatusF(e.target.value)} className="rounded-lg border border-border-subtle bg-bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none">
            <option value="">All Status</option>
            {Object.entries(CRM_EQUIPMENT_STATUS_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
          <button onClick={applyFilter} className="px-4 py-2 rounded-lg border border-border-subtle bg-bg-surface text-sm text-text-secondary hover:text-text-primary transition-all">Search</button>
        </div>

        <div className="rounded-2xl border border-border-subtle bg-bg-card overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-40 text-text-muted"><Loader2 className="w-5 h-5 animate-spin" /></div>
          ) : !items.length ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-text-muted">
              <Wrench className="w-8 h-8 opacity-30" strokeWidth={1.2} />
              <p className="text-sm">No equipment registered.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle">
                  {['Serial #', 'Model', 'Contact', 'Site', 'Status', 'Warranty End', 'Next Service'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map(eq => (
                  <tr key={eq.id} onClick={() => setSelectedId(eq.id)} className="border-b border-border-subtle last:border-0 hover:bg-bg-elevated cursor-pointer transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-text-secondary">{eq.serialNumber}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-text-primary">{eq.model}</div>
                      {eq.brand && <div className="text-xs text-text-muted">{eq.brand}</div>}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{eq.contactName ?? '—'}</td>
                    <td className="px-4 py-3 text-text-secondary text-xs">{eq.siteLabel ?? '—'}</td>
                    <td className="px-4 py-3"><Badge value={eq.status} labels={CRM_EQUIPMENT_STATUS_LABELS} colors={CRM_EQUIPMENT_STATUS_COLORS} /></td>
                    <td className="px-4 py-3 text-text-muted text-xs">{eq.warrantyEndDate ? format(parseISO(eq.warrantyEndDate), 'MMM d, yyyy') : '—'}</td>
                    <td className="px-4 py-3 text-xs">{eq.nextServiceDue ? <span className="text-[#F59E0B]">{format(parseISO(eq.nextServiceDue), 'MMM d, yyyy')}</span> : '—'}</td>
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

      <SlideOver open={showCreate} onClose={() => setShowCreate(false)} title="Register Equipment">
        <form onSubmit={handleCreate} className="space-y-4">
          <Field label="Serial Number *"><input required value={serial} onChange={e => setSerial(e.target.value)} placeholder="SN-001234" className={inputCls} /></Field>
          <Field label="Model *"><input required value={model} onChange={e => setModel(e.target.value)} placeholder="Machine model name" className={inputCls} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Brand"><input value={brand} onChange={e => setBrand(e.target.value)} placeholder="Brand name" className={inputCls} /></Field>
            <Field label="Category"><input value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g. Espresso Machine" className={inputCls} /></Field>
          </div>
          <Field label="Contact ID *"><input required value={contactId} onChange={e => setContactId(e.target.value)} placeholder="contact-uuid" className={inputCls} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Warranty End"><input type="date" value={warrantyEnd} onChange={e => setWarrantyEnd(e.target.value)} className={inputCls} /></Field>
            <Field label="Next Service"><input type="date" value={nextService} onChange={e => setNextService(e.target.value)} className={inputCls} /></Field>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={createEq.isPending} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-brand text-bg text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-all">
              {createEq.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Register'}
            </button>
            <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-lg border border-border-subtle text-sm text-text-secondary hover:text-text-primary transition-all">Cancel</button>
          </div>
        </form>
      </SlideOver>

      <SlideOver open={!!selectedId} onClose={() => setSelectedId(null)} title="Equipment Detail" width="600px">
        {selectedId && <DetailPanel id={selectedId} onClose={() => setSelectedId(null)} />}
      </SlideOver>
    </>
  );
}
