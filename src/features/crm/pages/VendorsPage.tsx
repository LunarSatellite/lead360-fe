import { useState } from 'react';
import { Plus, X, Loader2, Building2, Pencil, Trash2 } from 'lucide-react';
import { useVendors, useCreateVendor, useUpdateVendor, useDeleteVendor } from '../api/crm.queries';
import type { VendorDto, VendorCreateRequest, VendorUpdateRequest, VendorFilter } from '../types/crm.types';

const inputCls = 'w-full rounded-lg border border-border-subtle bg-bg-input px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand/40';

function SlideOver({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="drawer-slide-in relative w-[520px] h-full flex flex-col bg-bg border-l border-thin border-border-subtle" style={{ boxShadow: '-8px 0 40px rgba(0,0,0,0.5)' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle shrink-0">
          <h3 className="font-bold text-text-primary">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-surface transition-all"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="block text-xs font-semibold text-text-muted mb-1.5">{label}</label>{children}</div>;
}

type FormState = { name: string; contactPerson: string; email: string; phone: string; website: string; paymentTermsDays: string; currency: string; address: string; taxNumber: string; notes: string; isActive: boolean };
const emptyForm = (): FormState => ({ name: '', contactPerson: '', email: '', phone: '', website: '', paymentTermsDays: '30', currency: 'USD', address: '', taxNumber: '', notes: '', isActive: true });

function VendorForm({ form, editing, set, onSubmit, onCancel, isPending, submitLabel }: {
  form: FormState; editing: boolean; set: (k: keyof FormState, v: string | boolean) => void;
  onSubmit: (e: React.FormEvent) => void; onCancel: () => void; isPending: boolean; submitLabel: string;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Name *"><input required value={form.name} onChange={e => set('name', e.target.value)} className={inputCls} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Contact Person"><input value={form.contactPerson} onChange={e => set('contactPerson', e.target.value)} className={inputCls} /></Field>
        <Field label="Email"><input type="email" value={form.email} onChange={e => set('email', e.target.value)} className={inputCls} /></Field>
        <Field label="Phone"><input value={form.phone} onChange={e => set('phone', e.target.value)} className={inputCls} /></Field>
        <Field label="Website"><input value={form.website} onChange={e => set('website', e.target.value)} className={inputCls} /></Field>
        <Field label="Payment Terms (days)"><input type="number" min="0" value={form.paymentTermsDays} onChange={e => set('paymentTermsDays', e.target.value)} className={inputCls} /></Field>
        <Field label="Currency"><input value={form.currency} onChange={e => set('currency', e.target.value)} placeholder="USD" className={inputCls} /></Field>
      </div>
      <Field label="Tax Number"><input value={form.taxNumber} onChange={e => set('taxNumber', e.target.value)} className={inputCls} /></Field>
      <Field label="Address"><textarea value={form.address} onChange={e => set('address', e.target.value)} rows={2} className={`${inputCls} resize-none`} /></Field>
      <Field label="Notes"><textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} className={`${inputCls} resize-none`} /></Field>
      {editing && (
        <label className="flex items-center gap-2 text-sm text-text-secondary">
          <input type="checkbox" checked={form.isActive} onChange={e => set('isActive', e.target.checked)} className="rounded" /> Active
        </label>
      )}
      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={isPending} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-brand text-bg text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-all">
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : submitLabel}
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg border border-border-subtle text-sm text-text-secondary hover:text-text-primary transition-all">Cancel</button>
      </div>
    </form>
  );
}

function toCreate(f: FormState): VendorCreateRequest {
  return {
    name: f.name.trim(),
    contactPerson: f.contactPerson.trim() || undefined,
    email: f.email.trim() || undefined,
    phone: f.phone.trim() || undefined,
    website: f.website.trim() || undefined,
    paymentTermsDays: f.paymentTermsDays ? Number(f.paymentTermsDays) : undefined,
    currency: f.currency.trim() || undefined,
    address: f.address.trim() || undefined,
    taxNumber: f.taxNumber.trim() || undefined,
    notes: f.notes.trim() || undefined,
  };
}

export function Component() {
  const [filter, setFilter] = useState<VendorFilter>({ page: 1, pageSize: 20 });
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<VendorDto | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());

  const { data: raw, isLoading } = useVendors(filter);
  const items: VendorDto[] = (raw as any)?.items ?? [];

  const createVendor = useCreateVendor();
  const updateVendor = useUpdateVendor();
  const deleteVendor = useDeleteVendor();

  const set = (k: keyof FormState, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  const openCreate = () => { setForm(emptyForm()); setShowCreate(true); };
  const openEdit = (v: VendorDto) => {
    setForm({ name: v.name, contactPerson: v.contactPerson ?? '', email: v.email ?? '', phone: v.phone ?? '', website: v.website ?? '', paymentTermsDays: String(v.paymentTermsDays ?? 30), currency: v.currency ?? 'USD', address: v.address ?? '', taxNumber: v.taxNumber ?? '', notes: v.notes ?? '', isActive: v.isActive });
    setEditing(v);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createVendor.mutate(toCreate(form), { onSuccess: () => { setShowCreate(false); setForm(emptyForm()); } });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const data: VendorUpdateRequest = { ...toCreate(form), isActive: form.isActive };
    updateVendor.mutate({ id: editing.id, data }, { onSuccess: () => setEditing(null) });
  };

  const handleDelete = (v: VendorDto) => {
    if (!confirm(`Delete vendor "${v.name}"?`)) return;
    deleteVendor.mutate(v.id);
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-text-primary tracking-tight">Vendors</h2>
            <p className="text-xs text-text-muted mt-0.5">{(raw as any)?.totalCount?.toLocaleString() ?? 0} total</p>
          </div>
          <button onClick={openCreate} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-bg bg-brand hover:opacity-90 transition-all">
            <Plus className="w-3.5 h-3.5" strokeWidth={2.5} /> New Vendor
          </button>
        </div>

        <div className="flex gap-2">
          <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && setFilter(f => ({ ...f, search: search || undefined, page: 1 }))}
            placeholder="Search vendors..." className="flex-1 rounded-lg border border-border-subtle bg-bg-input px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand/40" />
          <select className="rounded-lg border border-border-subtle bg-bg-input px-3 py-2 text-sm text-text-primary focus:outline-none" value={filter.isActive === undefined ? '' : String(filter.isActive)} onChange={e => setFilter(f => ({ ...f, isActive: e.target.value === '' ? undefined : e.target.value === 'true', page: 1 }))}>
            <option value="">All</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <button onClick={() => setFilter(f => ({ ...f, search: search || undefined, page: 1 }))} className="px-4 py-2 rounded-lg border border-border-subtle bg-bg-input text-sm text-text-secondary hover:text-text-primary transition-all">Search</button>
        </div>

        <div className="rounded-2xl border border-border-subtle bg-glass-1 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-40 text-text-muted"><Loader2 className="w-5 h-5 animate-spin" /></div>
          ) : !items.length ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-text-muted">
              <Building2 className="w-8 h-8 opacity-30" strokeWidth={1.2} />
              <p className="text-sm">No vendors found.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle">
                  {['Name', 'Contact', 'Email', 'Phone', 'Payment Terms', 'Currency', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map(v => (
                  <tr key={v.id} className="border-b border-border-subtle last:border-0 hover:bg-glass-2 transition-colors">
                    <td className="px-4 py-3 font-semibold text-text-primary">{v.name}</td>
                    <td className="px-4 py-3 text-text-secondary">{v.contactPerson ?? '—'}</td>
                    <td className="px-4 py-3 text-text-secondary">{v.email ?? '—'}</td>
                    <td className="px-4 py-3 text-text-secondary">{v.phone ?? '—'}</td>
                    <td className="px-4 py-3 text-text-secondary">{v.paymentTermsDays != null ? `${v.paymentTermsDays}d` : '—'}</td>
                    <td className="px-4 py-3 text-text-secondary">{v.currency ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${v.isActive ? 'text-success bg-success-soft border-[rgba(34,197,94,0.2)]' : 'text-text-muted bg-bg-card border-border-subtle'}`}>
                        {v.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => openEdit(v)} className="p-1.5 rounded-lg text-text-muted hover:text-brand hover:bg-brand-soft transition-all"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDelete(v)} disabled={deleteVendor.isPending} className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger-soft transition-all disabled:opacity-50"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <SlideOver open={showCreate} onClose={() => setShowCreate(false)} title="New Vendor">
        <VendorForm form={form} editing={false} set={set} onSubmit={handleCreate} onCancel={() => { setShowCreate(false); setForm(emptyForm()); }} isPending={createVendor.isPending} submitLabel="Create Vendor" />
      </SlideOver>

      <SlideOver open={!!editing} onClose={() => setEditing(null)} title={`Edit — ${editing?.name}`}>
        <VendorForm form={form} editing={true} set={set} onSubmit={handleUpdate} onCancel={() => setEditing(null)} isPending={updateVendor.isPending} submitLabel="Save Changes" />
      </SlideOver>
    </>
  );
}
