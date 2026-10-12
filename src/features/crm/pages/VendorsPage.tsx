import { useState } from 'react';
import { Plus, X, Loader2, Building2, Pencil, Trash2, User, Mail, Phone, Globe, CreditCard, MapPin, FileText, DollarSign } from 'lucide-react';
import { useVendors, useCreateVendor, useUpdateVendor, useDeleteVendor } from '../api/crm.queries';
import type { VendorDto, VendorCreateRequest, VendorUpdateRequest, VendorFilter } from '../types/crm.types';
import { Button, IconButton, Input, ListState, ResultCount } from '@/shared/ui/primitives';

function SlideOver({ open, onClose, title, subtitle, children, footer }: { open: boolean; onClose: () => void; title: string; subtitle?: string; children: React.ReactNode; footer?: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end pr-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className="drawer-slide-in relative flex flex-col overflow-hidden"
        style={{
          width: '640px',
          borderRadius: 18,
          background: 'var(--bg-card)',
          border: '1px solid rgb(var(--brand-rgb) / 0.2)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.7), 0 0 24px rgb(var(--brand-rgb) / 0.25), inset 0 1px 0 rgb(var(--brand-light-rgb) / 0.05)',
          maxHeight: 'calc(100vh - 32px)',
        }}
      >
        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgb(var(--brand-rgb)) 35%, rgb(var(--brand-light-rgb)) 65%, transparent)', flexShrink: 0 }} />
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
            >{title}</h2>
            {subtitle && <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>}
          </div>
          <button aria-label="Close" onClick={onClose} className="text-text-muted hover:text-text-primary mt-0.5"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && (
          <div className="shrink-0 px-6 py-4 border-t border-border-subtle">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="block"><span className="block text-xs font-semibold text-text-secondary mb-1">{label}</span>{children}</label></div>;
}

type FormState = { name: string; contactPerson: string; email: string; phone: string; website: string; paymentTermsDays: string; currency: string; address: string; taxNumber: string; notes: string; isActive: boolean };
const emptyForm = (): FormState => ({ name: '', contactPerson: '', email: '', phone: '', website: '', paymentTermsDays: '30', currency: 'USD', address: '', taxNumber: '', notes: '', isActive: true });

function VendorForm({ form, editing, set, onSubmit }: {
  form: FormState; editing: boolean; set: (k: keyof FormState, v: string | boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <form id="vendor-form" onSubmit={onSubmit} className="space-y-4">
      {/* ── Company ── */}
      <div className="grid grid-cols-[auto_1fr] items-center gap-2">
        <span className="text-[10px] font-bold text-brand uppercase tracking-widest">Company</span>
        <div className="h-px bg-brand/20" />
      </div>

      <Field label="Name *">
        <Input icon={Building2} required value={form.name} onChange={e => set('name', e.target.value)} placeholder="Acme Supplies Ltd." aria-label="Acme Supplies Ltd." style={{ backgroundColor: 'rgb(var(--color-glass-1))', backgroundImage: 'linear-gradient(to bottom, rgb(var(--color-violet) / 0.11) 0%, rgb(var(--color-violet) / 0.03) 40%, rgba(0,0,0,0.08) 100%)' }} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Tax Number">
          <Input icon={FileText} value={form.taxNumber} onChange={e => set('taxNumber', e.target.value)} placeholder="TAX-123456" aria-label="TAX-123456" style={{ backgroundColor: 'rgb(var(--color-glass-1))', backgroundImage: 'linear-gradient(to bottom, rgb(var(--color-violet) / 0.11) 0%, rgb(var(--color-violet) / 0.03) 40%, rgba(0,0,0,0.08) 100%)' }} />
        </Field>
        <Field label="Payment Terms (days)">
          <Input aria-label="Payment terms days" icon={CreditCard} type="number" min="0" value={form.paymentTermsDays} onChange={e => set('paymentTermsDays', e.target.value)} placeholder="30" style={{ backgroundColor: 'rgb(var(--color-glass-1))', backgroundImage: 'linear-gradient(to bottom, rgb(var(--color-violet) / 0.11) 0%, rgb(var(--color-violet) / 0.03) 40%, rgba(0,0,0,0.08) 100%)' }} />
        </Field>
        <Field label="Currency">
          <Input icon={DollarSign} value={form.currency} onChange={e => set('currency', e.target.value)} placeholder="USD" aria-label="USD" style={{ backgroundColor: 'rgb(var(--color-glass-1))', backgroundImage: 'linear-gradient(to bottom, rgb(var(--color-violet) / 0.11) 0%, rgb(var(--color-violet) / 0.03) 40%, rgba(0,0,0,0.08) 100%)' }} />
        </Field>
        <Field label="Website">
          <Input aria-label="Website" icon={Globe} value={form.website} onChange={e => set('website', e.target.value)} placeholder="https://acme.com" style={{ backgroundColor: 'rgb(var(--color-glass-1))', backgroundImage: 'linear-gradient(to bottom, rgb(var(--color-violet) / 0.11) 0%, rgb(var(--color-violet) / 0.03) 40%, rgba(0,0,0,0.08) 100%)' }} />
        </Field>
      </div>

      {/* ── Contact ── */}
      <div className="grid grid-cols-[auto_1fr] items-center gap-2 pt-1">
        <span className="text-[10px] font-bold text-brand uppercase tracking-widest">Contact</span>
        <div className="h-px bg-brand/20" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Contact Person">
          <Input icon={User} value={form.contactPerson} onChange={e => set('contactPerson', e.target.value)} placeholder="Jane Smith" aria-label="Jane Smith" style={{ backgroundColor: 'rgb(var(--color-glass-1))', backgroundImage: 'linear-gradient(to bottom, rgb(var(--color-violet) / 0.11) 0%, rgb(var(--color-violet) / 0.03) 40%, rgba(0,0,0,0.08) 100%)' }} />
        </Field>
        <Field label="Email">
          <Input icon={Mail} type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="jane@acme.com" aria-label="jane@acme.com" style={{ backgroundColor: 'rgb(var(--color-glass-1))', backgroundImage: 'linear-gradient(to bottom, rgb(var(--color-violet) / 0.11) 0%, rgb(var(--color-violet) / 0.03) 40%, rgba(0,0,0,0.08) 100%)' }} />
        </Field>
        <Field label="Phone">
          <Input aria-label="Phone" icon={Phone} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+1 555 000 1234" style={{ backgroundColor: 'rgb(var(--color-glass-1))', backgroundImage: 'linear-gradient(to bottom, rgb(var(--color-violet) / 0.11) 0%, rgb(var(--color-violet) / 0.03) 40%, rgba(0,0,0,0.08) 100%)' }} />
        </Field>
      </div>

      <Field label="Address">
        <div className="relative">
          <MapPin className="absolute left-3 top-3 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
          <textarea value={form.address} onChange={e => set('address', e.target.value)} rows={2} placeholder="123 Industrial Ave, Suite 400, New York, NY 10001" aria-label="123 Industrial Ave, Suite 400, New York, NY 10001"
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-brand/20 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand/50 resize-none"
            style={{ backgroundColor: 'rgb(var(--color-glass-1))', backgroundImage: 'linear-gradient(to bottom, rgb(var(--color-violet) / 0.11) 0%, rgb(var(--color-violet) / 0.03) 40%, rgba(0,0,0,0.08) 100%)' }} />
        </div>
      </Field>

      <Field label="Notes">
        <div className="relative">
          <FileText className="absolute left-3 top-3 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} placeholder="Preferred supplier for office electronics…" aria-label="Preferred supplier for office electronics…"
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-brand/20 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand/50 resize-none"
            style={{ backgroundColor: 'rgb(var(--color-glass-1))', backgroundImage: 'linear-gradient(to bottom, rgb(var(--color-violet) / 0.11) 0%, rgb(var(--color-violet) / 0.03) 40%, rgba(0,0,0,0.08) 100%)' }} />
        </div>
      </Field>

      {editing && (
        <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
          <input type="checkbox" checked={form.isActive} onChange={e => set('isActive', e.target.checked)} className="rounded border-border-subtle text-brand focus:ring-brand/40" /> Active
        </label>
      )}
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

  const vendorsQuery = useVendors(filter);
  const { data: raw } = vendorsQuery;
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
            <p className="text-xs text-text-muted mt-0.5">
            <ResultCount query={vendorsQuery} total={(raw as any)?.totalCount} />
          </p>
          </div>
          <Button onClick={openCreate} variant="primary">
            <Plus className="w-3.5 h-3.5" strokeWidth={2.5} /> New Vendor
          </Button>
        </div>

        <div className="flex gap-2">
          <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && setFilter(f => ({ ...f, search: search || undefined, page: 1 }))}
            placeholder="Search vendors..." aria-label="Search vendors..." className="flex-1 rounded-lg border border-border-subtle bg-bg-input px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand/40" />
          <select aria-label="Filter by status" className="rounded-lg border border-border-subtle bg-bg-input px-3 py-2 text-sm text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/60" value={filter.isActive === undefined ? '' : String(filter.isActive)} onChange={e => setFilter(f => ({ ...f, isActive: e.target.value === '' ? undefined : e.target.value === 'true', page: 1 }))}>
            <option value="">All</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <button onClick={() => setFilter(f => ({ ...f, search: search || undefined, page: 1 }))} className="px-4 py-2 rounded-lg border border-border-subtle bg-bg-input text-sm text-text-secondary hover:text-text-primary transition-all">Search</button>
        </div>

        <div className="rounded-2xl border border-border-subtle bg-glass-1 overflow-hidden">
          <ListState
            query={vendorsQuery}
            isEmpty={!items.length}
            noun="vendors"
            icon={Building2}
            emptyTitle="No vendors found"
          >
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
                      <span className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${v.isActive ? 'text-success bg-success-soft border-success/20' : 'text-text-muted bg-bg-card border-border-subtle'}`}>
                        {v.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <IconButton icon={Pencil} label={`Edit ${v.name}`} variant="ghost" size="sm" onClick={() => openEdit(v)} />
                        <IconButton icon={Trash2} label={`Delete ${v.name}`} variant="ghost" size="sm" className="hover:bg-danger-soft hover:text-danger-light" onClick={() => handleDelete(v)} disabled={deleteVendor.isPending} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ListState>
        </div>
      </div>

      <SlideOver open={showCreate} onClose={() => setShowCreate(false)} title="New Vendor" subtitle="Add a new vendor to your directory"
        footer={
          <div className="flex gap-3 justify-end">
            <Button type="button" onClick={() => setShowCreate(false)} variant="secondary">Cancel</Button>
            <Button type="submit" form="vendor-form" disabled={createVendor.isPending}
              variant="primary" size="lg" className="flex-none">
              {createVendor.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Vendor'}
            </Button>
          </div>
        }
      >
        <VendorForm form={form} editing={false} set={set} onSubmit={handleCreate} />
      </SlideOver>

      <SlideOver open={!!editing} onClose={() => setEditing(null)} title={`Edit — ${editing?.name}`} subtitle="Update vendor details"
        footer={
          <div className="flex gap-3 justify-end">
            <Button type="button" onClick={() => setEditing(null)} variant="secondary">Cancel</Button>
            <Button type="submit" form="vendor-form" disabled={updateVendor.isPending}
              variant="primary" size="lg" className="flex-none">
              {updateVendor.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
            </Button>
          </div>
        }
      >
        <VendorForm form={form} editing={true} set={set} onSubmit={handleUpdate} />
      </SlideOver>
    </>
  );
}
