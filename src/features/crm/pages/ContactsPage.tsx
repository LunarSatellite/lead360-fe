import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Search, UserCheck, Plus, Loader2, ChevronLeft, ChevronRight, X, Trash2, Check,
  User, Mail, Phone, Briefcase, Link, FileText,
} from 'lucide-react';
import { confirmDialog } from '@/shared/ui/confirm';
import {
  useContacts, useCreateContact, useDeleteContact, useBulkDeleteContacts, useImportContactsCsv,
  useFindContactDuplicates,
} from '../api/crm.queries';
import { CsvToolbar } from '../components/CsvToolbar';
import { DuplicateWarning } from '../components/DuplicateWarning';
import { useDebounce } from '@/shared/hooks/useDebounce';
import type {
  CrmContactFilter, CrmContactSummaryDto, CrmContactCreateRequest, PagedResult,
} from '../types/crm.types';
import {
  CrmContactSourceKind, CRM_CONTACT_SOURCE_LABELS,
} from '../types/crm.types';
import { ROUTES } from '@/app/router/route-paths';
import { formatDistanceToNow } from 'date-fns';

const PAGE_SIZE = 20;

// ─── Contact card ─────────────────────────────────────────────────────────────

interface ContactCardProps {
  contact: CrmContactSummaryDto;
  deleteId: string | null;
  isDeleting: boolean;
  selected: boolean;
  onToggle: () => void;
  onClick: () => void;
  onDeleteRequest: (id: string) => void;
  onDeleteConfirm: (id: string) => void;
  onDeleteCancel: () => void;
}

function ContactCard({
  contact: c,
  deleteId,
  isDeleting,
  selected,
  onToggle,
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
      className={`bg-glass-1 border-thin rounded-card p-3.5 flex flex-col gap-3 cursor-pointer hover:bg-glass-2 transition-all group ${
        selected ? 'border-border-glow bg-brand-soft' : 'border-border-subtle hover:border-border-medium'
      }`}
    >
      {/* Avatar + source badge */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onToggle(); }}
            className={`w-5 h-5 rounded-[5px] border flex items-center justify-center transition-all shrink-0 ${
              selected ? 'bg-brand border-brand text-bg' : 'border-border-medium text-transparent hover:border-brand'
            }`}
            title={selected ? 'Deselect' : 'Select'}
          >
            <Check className="w-3 h-3" strokeWidth={3} />
          </button>
          <div className="w-10 h-10 rounded-card bg-brand-soft border-thin border-border-glow flex items-center justify-center text-sm font-black text-brand">
            {initial}
          </div>
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
  onClose, children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-end pr-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className="drawer-slide-in relative w-[640px] flex flex-col overflow-hidden"
        style={{
          borderRadius: 18,
          background: 'var(--bg-card)',
          border: '1px solid rgba(0,217,138,0.2)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.7), 0 0 24px rgba(0,217,138,0.25), inset 0 1px 0 rgba(0,255,163,0.05)',
          maxHeight: 'calc(100vh - 16px)',
        }}
      >
        {/* Accent bar */}
        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, #00D98A 35%, #00FFA3 65%, transparent)', flexShrink: 0 }} />
        <div className="flex items-start justify-between px-6 py-4 border-b border-border-subtle">
          <div>
            <h2
              className="text-base font-extrabold leading-tight"
              style={{
                background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--primary) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >New Contact</h2>
            <p className="text-xs text-text-muted mt-0.5">Add a new contact to your CRM</p>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary mt-0.5">
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

  // ── Real-time dedup check (debounced) ──
  const debouncedEmail = useDebounce(form.email, 400);
  const debouncedPhone = useDebounce(form.phone, 400);
  const { data: dupes } = useFindContactDuplicates(debouncedEmail, debouncedPhone);
  const matches = dupes ?? [];
  const hasDupes = matches.length > 0;

  const submit = (allowDuplicate: boolean) => {
    const req: CrmContactCreateRequest = {
      fullName: form.fullName,
      email: form.email || undefined,
      phone: form.phone || undefined,
      jobTitle: form.jobTitle || undefined,
      linkedIn: form.linkedIn || undefined,
      notes: form.notes || undefined,
      allowDuplicate,
    };
    onSave(req);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit(false);
  };

  const fieldCls = 'w-full pl-9 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)] transition-colors';
  const fieldStyle = { backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* Full Name + Phone — two columns */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-1">Full Name *</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
            <input required value={form.fullName} onChange={set('fullName')} placeholder="Jane Smith" className={fieldCls} style={fieldStyle} />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-1">Phone</label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
            <input value={form.phone} onChange={set('phone')} placeholder="+1 555 000 0000" className={fieldCls} style={fieldStyle} />
          </div>
        </div>
      </div>

      {/* Email */}
      <div>
        <label className="block text-xs font-semibold text-text-secondary mb-1">Email</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
          <input type="email" value={form.email} onChange={set('email')} placeholder="jane@company.com" className={fieldCls} style={fieldStyle} />
        </div>
      </div>

      {/* Job Title */}
      <div>
        <label className="block text-xs font-semibold text-text-secondary mb-1">Job Title</label>
        <div className="relative">
          <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
          <input value={form.jobTitle} onChange={set('jobTitle')} placeholder="VP of Sales" className={fieldCls} style={fieldStyle} />
        </div>
      </div>

      {/* LinkedIn */}
      <div>
        <label className="block text-xs font-semibold text-text-secondary mb-1">LinkedIn URL</label>
        <div className="relative">
          <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
          <input value={form.linkedIn} onChange={set('linkedIn')} placeholder="https://linkedin.com/in/..." className={fieldCls} style={fieldStyle} />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-xs font-semibold text-text-secondary mb-1">Notes</label>
        <div className="relative">
          <FileText className="absolute left-3 top-3 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
          <textarea
            rows={3}
            value={form.notes}
            onChange={set('notes')}
            placeholder="Any additional context..."
            className={`${fieldCls} resize-none`}
            style={fieldStyle}
          />
        </div>
      </div>

      {hasDupes && (
        <DuplicateWarning
          matches={matches}
          onCreateAnyway={() => submit(true)}
          isSaving={isSaving}
        />
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isSaving || !form.fullName.trim() || hasDupes}
          className="flex-1 py-2 rounded-xl bg-brand text-bg text-sm font-bold hover:bg-brand-light disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : hasDupes ? 'Review duplicates above' : 'Create Contact'}
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
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data: raw, isLoading } = useContacts(filter);
  const data = raw as unknown as PagedResult<CrmContactSummaryDto> | undefined;

  const createContact = useCreateContact();
  const deleteContact = useDeleteContact();
  const bulkDelete = useBulkDeleteContacts();
  const importCsv = useImportContactsCsv();

  const items = data?.items ?? [];
  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  const clearSelection = () => setSelected(new Set());
  const runBulkDelete = async () => {
    if (selected.size === 0) return;
    const ok = await confirmDialog({
      message: `Delete ${selected.size} selected contact${selected.size > 1 ? 's' : ''}? This can't be undone from here.`,
      confirmText: 'Delete',
      danger: true,
    });
    if (!ok) return;
    bulkDelete.mutate([...selected], { onSuccess: () => clearSelection() });
  };

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

  // Drop selections whenever the visible set changes.
  useEffect(() => { setSelected(new Set()); }, [filter]);

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
              onImport={async (file) => {
                await importCsv.mutateAsync(file);
              }}
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
          <>
            <div className="flex items-center gap-3 -mb-1">
              <button
                onClick={() =>
                  setSelected((prev) =>
                    prev.size === items.length ? new Set() : new Set(items.map((c) => c.id)),
                  )
                }
                className="flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-text-primary transition-colors"
              >
                <span
                  className={`w-4 h-4 rounded-[5px] border flex items-center justify-center transition-all ${
                    selected.size === items.length ? 'bg-brand border-brand text-bg' : 'border-border-medium'
                  }`}
                >
                  {selected.size === items.length && <Check className="w-3 h-3" strokeWidth={3} />}
                </span>
                {selected.size === items.length ? 'Deselect all' : 'Select all on page'}
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {items.map((c: CrmContactSummaryDto) => (
                <ContactCard
                  key={c.id}
                  contact={c}
                  deleteId={deleteId}
                  isDeleting={deleteContact.isPending}
                  selected={selected.has(c.id)}
                  onToggle={() => toggleSelect(c.id)}
                  onClick={() => navigate(ROUTES.dashboard.crmContactDetail(c.id))}
                  onDeleteRequest={(id) => setDeleteId(id)}
                  onDeleteConfirm={handleDelete}
                  onDeleteCancel={() => setDeleteId(null)}
                />
              ))}
            </div>
          </>
        )}

        {/* Bulk action bar */}
        {selected.size > 0 && (
          <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-4 py-3 rounded-2xl bg-bg-elevated border border-border-medium shadow-2xl">
            <span className="text-xs font-bold text-text-primary whitespace-nowrap">{selected.size} selected</span>
            <div className="h-5 w-px bg-border-subtle" />
            <button
              onClick={runBulkDelete}
              disabled={bulkDelete.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-danger border border-border-subtle hover:bg-danger-soft hover:border-danger transition-all disabled:opacity-50"
            >
              {bulkDelete.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              Delete
            </button>
            <button
              onClick={clearSelection}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-text-muted hover:text-text-primary transition-all"
            >
              <X className="w-3.5 h-3.5" /> Clear
            </button>
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
