import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Search, UserCheck, Plus, Loader2, ChevronLeft, ChevronRight, X, Trash2,
} from 'lucide-react';
import {
  useContacts, useCreateContact, useDeleteContact, useImportContactsCsv,
} from '../api/crm.queries';
import { CsvToolbar } from '../components/CsvToolbar';
import type {
  CrmContactFilter, CrmContactSummaryDto, CrmContactCreateRequest, PagedResult,
} from '../types/crm.types';
import {
  CrmContactSourceKind, CRM_CONTACT_SOURCE_LABELS,
} from '../types/crm.types';
import { ROUTES } from '@/app/router/route-paths';
import { formatDistanceToNow } from 'date-fns';

const PAGE_SIZE = 20;

// ─── Shared input style ───────────────────────────────────────────────────────

const inputCls =
  'w-full px-3 py-2 rounded-xl bg-bg-elevated border border-border-subtle text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-medium';

// ─── Contact card ─────────────────────────────────────────────────────────────

interface ContactCardProps {
  contact: CrmContactSummaryDto;
  deleteId: string | null;
  isDeleting: boolean;
  onClick: () => void;
  onDeleteRequest: (id: string) => void;
  onDeleteConfirm: (id: string) => void;
  onDeleteCancel: () => void;
}

function ContactCard({
  contact: c,
  deleteId,
  isDeleting,
  onClick,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
}: ContactCardProps) {
  const initial = (c.fullName[0] ?? '?').toUpperCase();
  const confirming = deleteId === c.id;

  return (
    <div
      onClick={onClick}
      className="bg-glass-1 border-thin border-border-subtle rounded-card p-3.5 flex flex-col gap-3 cursor-pointer hover:bg-glass-2 hover:border-border-medium transition-all group"
    >
      {/* Avatar + source badge */}
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-card bg-brand-soft border-thin border-border-glow flex items-center justify-center text-sm font-black text-brand">
          {initial}
        </div>
        <span className="px-1.5 py-0.5 rounded-xs text-[10px] font-semibold border-thin border-border-subtle bg-bg-elevated text-text-secondary">
          {CRM_CONTACT_SOURCE_LABELS[c.sourceKind]}
        </span>
      </div>

      {/* Name + job title */}
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-bold text-text-primary truncate">{c.fullName}</span>
        <span className="text-[10px] text-text-muted truncate">{c.jobTitle || c.email || '—'}</span>
      </div>

      {/* Email / phone */}
      <span className="text-[10px] text-text-secondary truncate">
        {c.email ?? c.phone ?? '—'}
      </span>

      {/* Footer: created + delete */}
      <div
        className="flex items-center justify-between pt-0.5 border-t border-thin border-border-subtle"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-[10px] text-text-muted">
          {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
        </span>

        {confirming ? (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onDeleteConfirm(c.id)}
              disabled={isDeleting}
              className="px-1.5 py-0.5 rounded-xs text-[10px] font-semibold bg-danger-soft text-danger border-thin border-[rgba(244,63,94,0.2)] hover:bg-danger hover:text-bg transition-all disabled:opacity-50"
            >
              {isDeleting ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : 'Delete'}
            </button>
            <button
              onClick={onDeleteCancel}
              className="text-[10px] text-text-muted hover:text-text-primary"
            >
              ×
            </button>
          </div>
        ) : (
          <button
            onClick={() => onDeleteRequest(c.id)}
            className="p-1 rounded-xs text-text-muted opacity-0 group-hover:opacity-100 hover:text-danger hover:bg-danger-soft transition-all"
          >
            <Trash2 className="w-3 h-3" strokeWidth={1.5} />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Slide-over ───────────────────────────────────────────────────────────────

function Modal({
  title, onClose, children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-bg shadow-2xl flex flex-col rounded-2xl border border-border-subtle max-h-[90vh]">
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
    </div>,
    document.body
  );
}

function SlideOver({
  title, onClose, children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-bg shadow-2xl flex flex-col border-l border-border-subtle h-full">
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

// ─── Create form ──────────────────────────────────────────────────────────────

type ContactFormState = {
  fullName: string;
  email: string;
  phone: string;
  jobTitle: string;
  linkedIn: string;
  notes: string;
};

const EMPTY: ContactFormState = {
  fullName: '', email: '', phone: '', jobTitle: '', linkedIn: '', notes: '',
};

function ContactCreateForm({
  onSave,
  onCancel,
  isSaving,
}: {
  onSave: (data: CrmContactCreateRequest) => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState<ContactFormState>(EMPTY);

  const set =
    (k: keyof ContactFormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const req: CrmContactCreateRequest = {
      fullName: form.fullName,
      email: form.email || undefined,
      phone: form.phone || undefined,
      jobTitle: form.jobTitle || undefined,
      linkedIn: form.linkedIn || undefined,
      notes: form.notes || undefined,
    };
    onSave(req);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-text-muted mb-1.5">Full Name *</label>
        <input
          required
          value={form.fullName}
          onChange={set('fullName')}
          placeholder="Jane Smith"
          className={inputCls}
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-text-muted mb-1.5">Email</label>
        <input
          type="email"
          value={form.email}
          onChange={set('email')}
          placeholder="jane@company.com"
          className={inputCls}
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-text-muted mb-1.5">Phone</label>
        <input
          value={form.phone}
          onChange={set('phone')}
          placeholder="+1 555 000 0000"
          className={inputCls}
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-text-muted mb-1.5">Job Title</label>
        <input
          value={form.jobTitle}
          onChange={set('jobTitle')}
          placeholder="VP of Sales"
          className={inputCls}
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-text-muted mb-1.5">LinkedIn URL</label>
        <input
          value={form.linkedIn}
          onChange={set('linkedIn')}
          placeholder="https://linkedin.com/in/..."
          className={inputCls}
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-text-muted mb-1.5">Notes</label>
        <textarea
          rows={3}
          value={form.notes}
          onChange={set('notes')}
          placeholder="Any additional context..."
          className={`${inputCls} resize-none`}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isSaving || !form.fullName.trim()}
          className="flex-1 py-2 rounded-xl bg-brand text-bg text-sm font-bold hover:bg-brand-light disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Create Contact'}
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export function Component() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<CrmContactFilter>({ page: 1, pageSize: PAGE_SIZE });
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('');
  const [showCreate, setShowCreate] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: raw, isLoading } = useContacts(filter);
  const data = raw as unknown as PagedResult<CrmContactSummaryDto> | undefined;

  const createContact = useCreateContact();
  const deleteContact = useDeleteContact();
  const importCsv = useImportContactsCsv();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilter((f) => ({
      ...f,
      search: search || undefined,
      sourceKind: sourceFilter ? (Number(sourceFilter) as CrmContactSourceKind) : undefined,
      page: 1,
    }));
  };

  const handleCreate = (req: CrmContactCreateRequest) => {
    createContact.mutate(req, {
      onSuccess: () => setShowCreate(false),
    });
  };

  const handleDelete = (id: string) => {
    deleteContact.mutate(id, {
      onSuccess: () => setDeleteId(null),
    });
  };

  const totalPages = data ? Math.ceil(data.totalCount / PAGE_SIZE) : 1;
  const currentPage = filter.page ?? 1;

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-text-primary tracking-tight">Contacts</h2>
            <p className="text-xs text-text-muted mt-0.5">
              {data ? `${data.totalCount.toLocaleString()} total` : 'Loading...'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <CsvToolbar
              exportUrl="/v1/crm/contacts/export-csv"
              templateUrl="/v1/crm/contacts/csv-template"
              entityLabel="contacts"
              onImport={file => importCsv.mutateAsync(file)}
              isImporting={importCsv.isPending}
            />
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-bg bg-brand hover:bg-brand-light transition-all"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2.5} /> New Contact
            </button>
          </div>
        </div>

        {/* Filters */}
        <form onSubmit={handleSearch} className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted"
              strokeWidth={1.5}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email or phone..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-bg-elevated border border-border-subtle text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-medium"
            />
          </div>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-bg-elevated border border-border-subtle text-sm text-text-secondary focus:outline-none focus:border-border-medium"
          >
            <option value="">All Sources</option>
            {Object.entries(CRM_CONTACT_SOURCE_LABELS).map(([k, label]) => (
              <option key={k} value={k}>{label}</option>
            ))}
          </select>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-bg-elevated border border-border-subtle text-sm text-text-secondary hover:text-text-primary transition-all"
          >
            Search
          </button>
        </form>

        {/* Card grid */}
        {isLoading ? (
          <div className="flex items-center justify-center h-48 text-text-muted">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : !data?.items.length ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-text-muted">
            <UserCheck className="w-8 h-8 opacity-30" strokeWidth={1.2} />
            <p className="text-sm">No contacts found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {data.items.map((c: CrmContactSummaryDto) => (
              <ContactCard
                key={c.id}
                contact={c}
                deleteId={deleteId}
                isDeleting={deleteContact.isPending}
                onClick={() => navigate(ROUTES.dashboard.crmContactDetail(c.id))}
                onDeleteRequest={(id) => setDeleteId(id)}
                onDeleteConfirm={handleDelete}
                onDeleteCancel={() => setDeleteId(null)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
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

      {/* Create modal */}
      {showCreate && (
        <Modal title="New Contact" onClose={() => setShowCreate(false)}>
          <ContactCreateForm
            onSave={handleCreate}
            onCancel={() => setShowCreate(false)}
            isSaving={createContact.isPending}
          />
        </Modal>
      )}
    </>
  );
}
