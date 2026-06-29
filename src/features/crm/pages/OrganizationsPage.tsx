import { useState } from 'react';
import {
  Search, Building2, Plus, Loader2, ChevronLeft, ChevronRight,
  X, Trash2, Globe, Users, MapPin, Pencil, Check, Layers,
} from 'lucide-react';
import {
  useOrganizations, useOrganizationById,
  useCreateOrganization, useUpdateOrganization, useDeleteOrganization,
} from '../api/crm.queries';
import type {
  CrmOrganizationFilter, CrmOrganizationSummaryDto,
  CrmOrganizationCreateRequest, CrmOrganizationUpdateRequest,
  CrmOrganizationDetailDto, PagedResult,
} from '../types/crm.types';
import { formatDistanceToNow } from 'date-fns';

const PAGE_SIZE = 20;
const inputCls =
  'w-full px-3 py-2 rounded-xl bg-bg-elevated border border-border-subtle text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-medium';

// ─── Slide-over shell ─────────────────────────────────────────────────────────

function SlideOver({
  title, onClose, children,
}: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="drawer-slide-in relative w-[480px] h-full flex flex-col bg-bg-shell border-l border-thin border-border-subtle" style={{ boxShadow: '-8px 0 40px rgba(0,0,0,0.5)' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle shrink-0">
          <h3 className="font-bold text-text-primary">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

// ─── Organization form ────────────────────────────────────────────────────────

type OrgFormState = {
  name: string; domain: string; industry: string;
  employeeCount: string; website: string; city: string;
  country: string; description: string;
};

const EMPTY_ORG: OrgFormState = {
  name: '', domain: '', industry: '', employeeCount: '',
  website: '', city: '', country: '', description: '',
};

function toOrgForm(d: CrmOrganizationDetailDto): OrgFormState {
  return {
    name: d.name, domain: d.domain ?? '', industry: d.industry ?? '',
    employeeCount: d.employeeCount?.toString() ?? '',
    website: d.website ?? '', city: d.city ?? '',
    country: d.country ?? '', description: d.description ?? '',
  };
}

function toCreateReq(f: OrgFormState): CrmOrganizationCreateRequest {
  return {
    name: f.name,
    domain: f.domain || undefined,
    industry: f.industry || undefined,
    employeeCount: f.employeeCount ? Number(f.employeeCount) : undefined,
    website: f.website || undefined,
    city: f.city || undefined,
    country: f.country || undefined,
    description: f.description || undefined,
  };
}

function OrgForm({
  initial, submitLabel, onSave, onCancel, isSaving,
}: {
  initial?: OrgFormState;
  submitLabel: string;
  onSave: (f: OrgFormState) => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState<OrgFormState>(initial ?? EMPTY_ORG);
  const set = (k: keyof OrgFormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-text-muted mb-1.5">Name *</label>
        <input required value={form.name} onChange={set('name')} placeholder="Acme Corp" className={inputCls} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-text-muted mb-1.5">Domain</label>
          <input value={form.domain} onChange={set('domain')} placeholder="acme.com" className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-text-muted mb-1.5">Industry</label>
          <input value={form.industry} onChange={set('industry')} placeholder="SaaS" className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-text-muted mb-1.5">Employees</label>
          <input type="number" min="0" value={form.employeeCount} onChange={set('employeeCount')} placeholder="250" className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-text-muted mb-1.5">Country</label>
          <input value={form.country} onChange={set('country')} placeholder="US" className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-text-muted mb-1.5">City</label>
          <input value={form.city} onChange={set('city')} placeholder="New York" className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-text-muted mb-1.5">Website</label>
          <input value={form.website} onChange={set('website')} placeholder="https://acme.com" className={inputCls} />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-text-muted mb-1.5">Description</label>
        <textarea rows={3} value={form.description} onChange={set('description')} className={`${inputCls} resize-none`} />
      </div>
      <div className="flex gap-3 pt-1">
        <button
          type="submit"
          disabled={isSaving || !form.name.trim()}
          className="flex items-center gap-1.5 flex-1 justify-center py-2 rounded-xl bg-brand text-bg text-sm font-bold hover:bg-brand-light disabled:opacity-50 transition-all"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-3.5 h-3.5" /> {submitLabel}</>}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-xl border border-border-subtle text-sm text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-all"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ─── Detail / edit panel ──────────────────────────────────────────────────────

function OrgDetailPanel({
  orgId, onClose,
}: { orgId: string; onClose: () => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data: raw, isLoading } = useOrganizationById(orgId);
  const org = raw as unknown as CrmOrganizationDetailDto | undefined;

  const updateOrg = useUpdateOrganization();
  const deleteOrg = useDeleteOrganization();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48 text-text-muted">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }
  if (!org) return <p className="text-sm text-text-muted">Not found.</p>;

  const handleUpdate = (f: OrgFormState) => {
    const req: CrmOrganizationUpdateRequest = {
      name: f.name || undefined,
      domain: f.domain || undefined,
      industry: f.industry || undefined,
      employeeCount: f.employeeCount ? Number(f.employeeCount) : undefined,
      website: f.website || undefined,
      city: f.city || undefined,
      country: f.country || undefined,
      description: f.description || undefined,
    };
    updateOrg.mutate({ id: org.id, data: req }, { onSuccess: () => setIsEditing(false) });
  };

  const handleDelete = () => {
    deleteOrg.mutate(org.id, { onSuccess: onClose });
  };

  if (isEditing) {
    return (
      <OrgForm
        initial={toOrgForm(org)}
        submitLabel="Save Changes"
        onSave={handleUpdate}
        onCancel={() => setIsEditing(false)}
        isSaving={updateOrg.isPending}
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* Name + actions */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-base font-extrabold text-text-primary">{org.name}</h4>
          {org.industry && <p className="text-sm text-text-secondary mt-0.5">{org.industry}</p>}
          <p className="text-xs text-text-muted mt-1">
            Created {formatDistanceToNow(new Date(org.createdAt), { addSuffix: true })}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-subtle text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-all"
          >
            <Pencil className="w-3.5 h-3.5" strokeWidth={1.5} /> Edit
          </button>
          {confirmDelete ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleDelete}
                disabled={deleteOrg.isPending}
                className="px-3 py-1.5 rounded-lg bg-danger text-bg text-xs font-bold disabled:opacity-50"
              >
                {deleteOrg.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Delete'}
              </button>
              <button onClick={() => setConfirmDelete(false)} className="text-xs text-text-muted hover:text-text-primary">×</button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="p-1.5 rounded-lg border border-border-subtle text-text-muted hover:text-danger hover:bg-danger-soft transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
            </button>
          )}
        </div>
      </div>

      {/* Details grid */}
      <div className="space-y-3 text-sm">
        {org.domain && (
          <div className="flex items-center gap-3">
            <Globe className="w-4 h-4 text-text-muted shrink-0" strokeWidth={1.5} />
            <span className="text-text-secondary">{org.domain}</span>
          </div>
        )}
        {org.website && (
          <div className="flex items-center gap-3">
            <Globe className="w-4 h-4 text-text-muted shrink-0" strokeWidth={1.5} />
            <a href={org.website} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline truncate">
              {org.website}
            </a>
          </div>
        )}
        {(org.city || org.country) && (
          <div className="flex items-center gap-3">
            <MapPin className="w-4 h-4 text-text-muted shrink-0" strokeWidth={1.5} />
            <span className="text-text-secondary">{[org.city, org.country].filter(Boolean).join(', ')}</span>
          </div>
        )}
        {org.employeeCount != null && (
          <div className="flex items-center gap-3">
            <Users className="w-4 h-4 text-text-muted shrink-0" strokeWidth={1.5} />
            <span className="text-text-secondary">{org.employeeCount.toLocaleString()} employees</span>
          </div>
        )}
      </div>

      {org.description && (
        <div className="pt-3 border-t border-border-subtle">
          <p className="text-xs font-semibold text-text-muted mb-1.5">Description</p>
          <p className="text-sm text-text-secondary whitespace-pre-line">{org.description}</p>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function Component() {
  const [filter, setFilter] = useState<CrmOrganizationFilter>({ page: 1, pageSize: PAGE_SIZE });
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<OrgFormState>(EMPTY_ORG);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: raw, isLoading } = useOrganizations(filter);
  const data = raw as unknown as PagedResult<CrmOrganizationSummaryDto> | undefined;

  const createOrg = useCreateOrganization();

  const handleCreate = (f: OrgFormState) => {
    createOrg.mutate(toCreateReq(f), { onSuccess: () => { setShowCreate(false); setCreateForm(EMPTY_ORG); } });
  };

  const totalPages = data ? Math.ceil(data.totalCount / PAGE_SIZE) : 1;
  const currentPage = filter.page ?? 1;

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-text-primary tracking-tight">Organizations</h2>
            <p className="text-xs text-text-muted mt-0.5">
              {data ? `${data.totalCount.toLocaleString()} total` : 'Loading...'}
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-bg bg-brand hover:bg-brand-light transition-all"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2.5} /> New Organization
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setFilter((f) => ({ ...f, search: search || undefined, page: 1 }));
          }}
          className="flex gap-2"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" strokeWidth={1.5} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or domain..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-bg-elevated border border-border-subtle text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-medium"
            />
          </div>
          <button type="submit" className="px-4 py-2 rounded-xl bg-bg-elevated border border-border-subtle text-sm text-text-secondary hover:text-text-primary transition-all">
            Search
          </button>
        </form>

        <div className="rounded-2xl border border-border-subtle bg-bg-card overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-48 text-text-muted">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : !data?.items.length ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-text-muted">
              <Building2 className="w-8 h-8 opacity-30" strokeWidth={1.2} />
              <p className="text-sm">No organizations found</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle">
                  <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wider">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wider hidden md:table-cell">Domain</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wider hidden lg:table-cell">Industry</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wider hidden lg:table-cell">Country</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wider hidden md:table-cell">Created</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((o: CrmOrganizationSummaryDto) => (
                  <tr
                    key={o.id}
                    onClick={() => setSelectedId(o.id)}
                    className="border-b border-border-subtle last:border-0 hover:bg-bg-elevated cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#0F1E18] flex items-center justify-center shrink-0">
                          <Building2 className="w-4 h-4 text-[#8FAEA0]" strokeWidth={1.5} />
                        </div>
                        <span className="font-semibold text-text-primary">{o.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-text-muted hidden md:table-cell">{o.domain ?? '—'}</td>
                    <td className="px-4 py-3 text-text-muted hidden lg:table-cell">{o.industry ?? '—'}</td>
                    <td className="px-4 py-3 text-text-muted hidden lg:table-cell">{o.country ?? '—'}</td>
                    <td className="px-4 py-3 text-text-muted text-xs hidden md:table-cell">
                      {formatDistanceToNow(new Date(o.createdAt), { addSuffix: true })}
                    </td>
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
              <button
                disabled={currentPage <= 1}
                onClick={() => setFilter((f) => ({ ...f, page: (f.page ?? 1) - 1 }))}
                className="p-1.5 rounded-lg border border-border-subtle hover:bg-bg-elevated disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setFilter((f) => ({ ...f, page: (f.page ?? 1) + 1 }))}
                className="p-1.5 rounded-lg border border-border-subtle hover:bg-bg-elevated disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-end pr-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setShowCreate(false); setCreateForm(EMPTY_ORG); }} />
          <div
            className="relative w-[640px] flex flex-col overflow-hidden"
            style={{
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
                >New Organization</h2>
                <p className="text-xs text-text-muted mt-0.5">Add a new organization to your CRM</p>
              </div>
              <button onClick={() => { setShowCreate(false); setCreateForm(EMPTY_ORG); }} className="text-text-muted hover:text-text-primary mt-0.5">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => { e.preventDefault(); handleCreate(createForm); }}
              className="flex-1 px-6 py-5 space-y-4 overflow-y-auto"
            >
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Name *</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
                  <input
                    required
                    value={createForm.name}
                    onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Acme Corp"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)]"
                    style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Domain</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
                    <input
                      value={createForm.domain}
                      onChange={e => setCreateForm(f => ({ ...f, domain: e.target.value }))}
                      placeholder="acme.com"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)]"
                      style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Industry</label>
                  <div className="relative">
                    <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
                    <input
                      value={createForm.industry}
                      onChange={e => setCreateForm(f => ({ ...f, industry: e.target.value }))}
                      placeholder="SaaS, Retail…"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)]"
                      style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Employees</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
                    <input
                      type="number"
                      min={0}
                      value={createForm.employeeCount}
                      onChange={e => setCreateForm(f => ({ ...f, employeeCount: e.target.value }))}
                      placeholder="250"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)]"
                      style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Country</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
                    <input
                      value={createForm.country}
                      onChange={e => setCreateForm(f => ({ ...f, country: e.target.value }))}
                      placeholder="US"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)]"
                      style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">City</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
                    <input
                      value={createForm.city}
                      onChange={e => setCreateForm(f => ({ ...f, city: e.target.value }))}
                      placeholder="New York"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)]"
                      style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Website</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
                    <input
                      value={createForm.website}
                      onChange={e => setCreateForm(f => ({ ...f, website: e.target.value }))}
                      placeholder="https://acme.com"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)]"
                      style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Description</label>
                <textarea
                  rows={3}
                  value={createForm.description}
                  onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Brief description of the organization…"
                  className="w-full px-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)] resize-none"
                  style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => { setShowCreate(false); setCreateForm(EMPTY_ORG); }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-text-secondary border border-border-subtle hover:border-border-medium transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createOrg.isPending || !createForm.name.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-bg bg-brand hover:bg-brand-light disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {createOrg.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Create Organization
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedId && (
        <SlideOver title="Organization" onClose={() => setSelectedId(null)}>
          <OrgDetailPanel orgId={selectedId} onClose={() => setSelectedId(null)} />
        </SlideOver>
      )}
    </>
  );
}
