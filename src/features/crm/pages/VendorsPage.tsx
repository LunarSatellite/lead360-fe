import { useState } from 'react';
import { Plus, X, Loader2, Building2, Pencil, Trash2, User, Mail, Phone, Globe, CreditCard, MapPin, FileText, DollarSign } from 'lucide-react';
import { useVendors, useCreateVendor, useUpdateVendor, useDeleteVendor } from '../api/crm.queries';
import type { VendorDto, VendorCreateRequest, VendorUpdateRequest, VendorFilter } from '../types/crm.types';

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
          border: '1px solid rgba(0,217,138,0.2)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.7), 0 0 24px rgba(0,217,138,0.25), inset 0 1px 0 rgba(0,255,163,0.05)',
          maxHeight: 'calc(100vh - 32px)',
        }}
      >
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
            >{title}</h2>
            {subtitle && <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary mt-0.5"><X className="w-4 h-4" /></button>
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
  return <div><label className="block text-xs font-semibold text-text-secondary mb-1">{label}</label>{children}</div>;
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
        <div className="relative">
          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
          <input required value={form.name} onChange={e => set('name', e.target.value)} placeholder="Acme Supplies Ltd."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)]"
            style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }} />
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Tax Number">
          <div className="relative">
            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
            <input value={form.taxNumber} onChange={e => set('taxNumber', e.target.value)} placeholder="TAX-123456"
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)]"
              style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }} />
          </div>
        </Field>
        <Field label="Payment Terms (days)">
          <div className="relative">
            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
            <input type="number" min="0" value={form.paymentTermsDays} onChange={e => set('paymentTermsDays', e.target.value)} placeholder="30"
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)]"
              style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }} />
          </div>
        </Field>
        <Field label="Currency">
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
            <input value={form.currency} onChange={e => set('currency', e.target.value)} placeholder="USD"
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)]"
              style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }} />
          </div>
        </Field>
        <Field label="Website">
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
            <input value={form.website} onChange={e => set('website', e.target.value)} placeholder="https://acme.com"
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)]"
              style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }} />
          </div>
        </Field>
      </div>

      {/* ── Contact ── */}
      <div className="grid grid-cols-[auto_1fr] items-center gap-2 pt-1">
        <span className="text-[10px] font-bold text-brand uppercase tracking-widest">Contact</span>
        <div className="h-px bg-brand/20" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Contact Person">
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
            <input value={form.contactPerson} onChange={e => set('contactPerson', e.target.value)} placeholder="Jane Smith"
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)]"
              style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }} />
          </div>
        </Field>
        <Field label="Email">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="jane@acme.com"
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)]"
              style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }} />
          </div>
        </Field>
        <Field label="Phone">
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
            <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+1 555 000 1234"
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)]"
              style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }} />
          </div>
        </Field>
      </div>

      <Field label="Address">
        <div className="relative">
          <MapPin className="absolute left-3 top-3 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
          <textarea value={form.address} onChange={e => set('address', e.target.value)} rows={2} placeholder="123 Industrial Ave, Suite 400, New York, NY 10001"
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)] resize-none"
            style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }} />
        </div>
      </Field>

      <Field label="Notes">
        <div className="relative">
          <FileText className="absolute left-3 top-3 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} placeholder="Preferred supplier for office electronics…"
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)] resize-none"
            style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }} />
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

      <SlideOver open={showCreate} onClose={() => setShowCreate(false)} title="New Vendor" subtitle="Add a new vendor to your directory"
        footer={
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-xl text-xs font-semibold text-text-secondary border border-border-subtle hover:border-border-medium transition-all">Cancel</button>
            <button type="submit" form="vendor-form" disabled={createVendor.isPending}
              className="flex-none px-6 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-brand text-bg text-sm font-bold hover:bg-brand-light disabled:opacity-50 disabled:cursor-not-allowed transition-all">
              {createVendor.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Vendor'}
            </button>
          </div>
        }
      >
        <VendorForm form={form} editing={false} set={set} onSubmit={handleCreate} />
      </SlideOver>

      <SlideOver open={!!editing} onClose={() => setEditing(null)} title={`Edit — ${editing?.name}`} subtitle="Update vendor details"
        footer={
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 rounded-xl text-xs font-semibold text-text-secondary border border-border-subtle hover:border-border-medium transition-all">Cancel</button>
            <button type="submit" form="vendor-form" disabled={updateVendor.isPending}
              className="flex-none px-6 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-brand text-bg text-sm font-bold hover:bg-brand-light disabled:opacity-50 disabled:cursor-not-allowed transition-all">
              {updateVendor.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
            </button>
          </div>
        }
      >
        <VendorForm form={form} editing={true} set={set} onSubmit={handleUpdate} />
      </SlideOver>
    </>
  );
}
