import { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Search, Building, Plus, Loader2, ChevronLeft, ChevronRight,
  X, Trash2, DollarSign, Calendar, Pencil, Check, UserPlus, UserMinus,
} from 'lucide-react';
import {
  useAccounts, useAccountById, useAccountContacts,
  useCreateAccount, useUpdateAccount, useDeleteAccount,
  useAddAccountContact, useRemoveAccountContact,
  useContacts, useOrganizations,
} from '../api/crm.queries';
import type {
  CrmAccountFilter, CrmAccountSummaryDto, CrmAccountDetailDto,
  CrmAccountCreateRequest, CrmAccountUpdateRequest,
  CrmAccountContactDto, PagedResult, CrmContactSummaryDto,
} from '../types/crm.types';
import {
  CrmAccountStatus, CrmAccountTier, CrmAccountContactRole,
  CRM_ACCOUNT_STATUS_LABELS, CRM_ACCOUNT_STATUS_COLORS,
  CRM_ACCOUNT_TIER_LABELS, CRM_ACCOUNT_CONTACT_ROLE_LABELS,
} from '../types/crm.types';
import { formatDistanceToNow, format } from 'date-fns';

const PAGE_SIZE = 20;
const inputCls =
  'w-full px-3 py-2 rounded-xl bg-bg-elevated border border-border-subtle text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-medium';

// ─── Slide-over shell ─────────────────────────────────────────────────────────

function Modal({
  title, onClose, children,
}: { title: string; onClose: () => void; children: React.ReactNode }) {
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-bg shadow-2xl flex flex-col rounded-2xl border border-border-subtle max-h-[90vh]">
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
}: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-bg shadow-2xl flex flex-col border-l border-border-subtle h-full">
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

// ─── Account form ─────────────────────────────────────────────────────────────

type AccountFormState = {
  name: string;
  status: string;
  tier: string;
  contractValue: string;
  currency: string;
  renewalDate: string;
  notes: string;
  organizationId: string;
};

const EMPTY_ACCOUNT: AccountFormState = {
  name: '', status: '1', tier: '', contractValue: '', currency: 'USD', renewalDate: '', notes: '', organizationId: '',
};

function toAccountForm(d: CrmAccountDetailDto): AccountFormState {
  return {
    name: d.name,
    status: d.status.toString(),
    tier: d.tier?.toString() ?? '',
    contractValue: d.contractValue?.toString() ?? '',
    currency: d.currency,
    renewalDate: d.renewalDate ? d.renewalDate.slice(0, 10) : '',
    notes: d.notes ?? '',
  };
}

function AccountForm({
  initial, submitLabel, onSave, onCancel, isSaving,
}: {
  initial?: AccountFormState;
  submitLabel: string;
  onSave: (f: AccountFormState) => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState<AccountFormState>(initial ?? EMPTY_ACCOUNT);
  const set = (k: keyof AccountFormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));
  const { data: orgsRaw } = useOrganizations({ pageSize: 200 });
  const orgsList = (orgsRaw as any)?.items ?? [];

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-text-muted mb-1.5">Account Name *</label>
        <input required value={form.name} onChange={set('name')} placeholder="Acme — Enterprise" className={inputCls} />
      </div>
      <div>
        <label className="block text-xs font-semibold text-text-muted mb-1.5">Organization</label>
        <select value={form.organizationId} onChange={set('organizationId')} className={inputCls}>
          <option value="">No organization</option>
          {orgsList.map((o: any) => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-text-muted mb-1.5">Status</label>
          <select value={form.status} onChange={set('status')} className={inputCls}>
            {Object.entries(CRM_ACCOUNT_STATUS_LABELS).map(([k, label]) => (
              <option key={k} value={k}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-text-muted mb-1.5">Tier</label>
          <select value={form.tier} onChange={set('tier')} className={inputCls}>
            <option value="">— None —</option>
            {Object.entries(CRM_ACCOUNT_TIER_LABELS).map(([k, label]) => (
              <option key={k} value={k}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-text-muted mb-1.5">Contract Value</label>
          <input type="number" min="0" value={form.contractValue} onChange={set('contractValue')} placeholder="50000" className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-text-muted mb-1.5">Currency</label>
          <input value={form.currency} onChange={set('currency')} placeholder="USD" className={inputCls} />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-text-muted mb-1.5">Renewal Date</label>
        <input type="date" value={form.renewalDate} onChange={set('renewalDate')} className={inputCls} />
      </div>
      <div>
        <label className="block text-xs font-semibold text-text-muted mb-1.5">Notes</label>
        <textarea rows={3} value={form.notes} onChange={set('notes')} className={`${inputCls} resize-none`} />
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

// ─── Linked contacts panel ────────────────────────────────────────────────────

function ContactsPanel({ accountId }: { accountId: string }) {
  const [addSearch, setAddSearch] = useState('');
  const [addRole, setAddRole] = useState<string>('3');
  const [showAdd, setShowAdd] = useState(false);

  const { data: rawLinks } = useAccountContacts(accountId);
  const links = rawLinks as unknown as CrmAccountContactDto[] | undefined;

  const { data: rawSearch } = useContacts(
    showAdd && addSearch.length >= 2 ? { search: addSearch, pageSize: 6 } : {},
  );
  const searchResults = rawSearch as unknown as PagedResult<CrmContactSummaryDto> | undefined;

  const addContact = useAddAccountContact();
  const removeContact = useRemoveAccountContact();

  const linkedIds = new Set((links ?? []).map((l) => l.contactId));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-text-muted uppercase tracking-wider">
          Contacts ({links?.length ?? 0})
        </p>
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-subtle text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-all"
        >
          <UserPlus className="w-3.5 h-3.5" strokeWidth={1.5} />
          {showAdd ? 'Cancel' : 'Add Contact'}
        </button>
      </div>

      {showAdd && (
        <div className="rounded-xl border border-border-subtle bg-bg-elevated p-4 space-y-3">
          <div className="flex gap-2">
            <input
              value={addSearch}
              onChange={(e) => setAddSearch(e.target.value)}
              placeholder="Search contact by name..."
              className={inputCls}
            />
            <select
              value={addRole}
              onChange={(e) => setAddRole(e.target.value)}
              className="px-2 py-2 rounded-xl bg-bg-elevated border border-border-subtle text-xs text-text-secondary focus:outline-none"
            >
              {Object.entries(CRM_ACCOUNT_CONTACT_ROLE_LABELS).map(([k, label]) => (
                <option key={k} value={k}>{label}</option>
              ))}
            </select>
          </div>
          {searchResults && searchResults.items.length > 0 && (
            <div className="space-y-1">
              {searchResults.items.map((c: CrmContactSummaryDto) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg hover:bg-bg-card transition-colors"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-text-primary truncate">{c.fullName}</div>
                    {c.email && <div className="text-xs text-text-muted truncate">{c.email}</div>}
                  </div>
                  {linkedIds.has(c.id) ? (
                    <span className="text-xs text-text-muted shrink-0">Linked</span>
                  ) : (
                    <button
                      onClick={() =>
                        addContact.mutate({
                          accountId,
                          data: {
                            contactId: c.id,
                            role: Number(addRole) as CrmAccountContactRole,
                          },
                        })
                      }
                      disabled={addContact.isPending}
                      className="px-2.5 py-1 rounded-lg bg-brand-soft text-brand border border-border-glow text-xs font-semibold hover:bg-brand hover:text-bg transition-all disabled:opacity-50 shrink-0"
                    >
                      Add
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
          {addSearch.length >= 2 && searchResults?.items.length === 0 && (
            <p className="text-xs text-text-muted">No contacts found.</p>
          )}
        </div>
      )}

      {!links || links.length === 0 ? (
        <p className="text-sm text-text-muted">No contacts linked to this account.</p>
      ) : (
        <div className="space-y-2">
          {links.map((l: CrmAccountContactDto) => (
            <div
              key={l.id}
              className="flex items-center justify-between gap-3 p-3 rounded-xl bg-bg-elevated border border-border-subtle"
            >
              <div className="min-w-0">
                <div className="font-semibold text-sm text-text-primary truncate">{l.contactName}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  {l.contactEmail && (
                    <span className="text-xs text-text-muted truncate">{l.contactEmail}</span>
                  )}
                  <span className="text-xs px-1.5 py-0.5 rounded bg-bg-card border border-border-subtle text-text-muted shrink-0">
                    {CRM_ACCOUNT_CONTACT_ROLE_LABELS[l.role]}
                  </span>
                  {l.isPrimary && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-brand-soft border border-border-glow text-brand shrink-0">
                      Primary
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => removeContact.mutate({ accountId, linkId: l.id })}
                disabled={removeContact.isPending}
                className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger-soft border border-transparent hover:border-[rgba(244,63,94,0.2)] transition-all disabled:opacity-50 shrink-0"
                title="Remove"
              >
                <UserMinus className="w-3.5 h-3.5" strokeWidth={1.5} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Detail panel ─────────────────────────────────────────────────────────────

type DetailTab = 'details' | 'contacts';

function AccountDetailPanel({
  accountId, onClose,
}: { accountId: string; onClose: () => void }) {
  const [tab, setTab] = useState<DetailTab>('details');
  const [isEditing, setIsEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data: raw, isLoading } = useAccountById(accountId);
  const account = raw as unknown as CrmAccountDetailDto | undefined;

  const updateAccount = useUpdateAccount();
  const deleteAccount = useDeleteAccount();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48 text-text-muted">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }
  if (!account) return <p className="text-sm text-text-muted">Not found.</p>;

  const handleUpdate = (f: AccountFormState) => {
    const req: CrmAccountUpdateRequest = {
      name: f.name || undefined,
      status: Number(f.status) as CrmAccountStatus,
      tier: f.tier ? (Number(f.tier) as CrmAccountTier) : undefined,
      contractValue: f.contractValue ? Number(f.contractValue) : undefined,
      currency: f.currency || undefined,
      renewalDate: f.renewalDate || undefined,
      notes: f.notes || undefined,
    };
    updateAccount.mutate({ id: account.id, data: req }, { onSuccess: () => setIsEditing(false) });
  };

  const handleDelete = () => {
    deleteAccount.mutate(account.id, { onSuccess: onClose });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-base font-extrabold text-text-primary">{account.name}</h4>
            <span className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${CRM_ACCOUNT_STATUS_COLORS[account.status]}`}>
              {CRM_ACCOUNT_STATUS_LABELS[account.status]}
            </span>
            {account.tier && (
              <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-bg-elevated border border-border-subtle text-text-secondary">
                {CRM_ACCOUNT_TIER_LABELS[account.tier]}
              </span>
            )}
          </div>
          {account.organizationName && (
            <p className="text-sm text-text-secondary mt-0.5">{account.organizationName}</p>
          )}
          <p className="text-xs text-text-muted mt-1">
            Created {formatDistanceToNow(new Date(account.createdAt), { addSuffix: true })}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => { setIsEditing(true); setTab('details'); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-subtle text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-all"
          >
            <Pencil className="w-3.5 h-3.5" strokeWidth={1.5} /> Edit
          </button>
          {confirmDelete ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleDelete}
                disabled={deleteAccount.isPending}
                className="px-3 py-1.5 rounded-lg bg-danger text-bg text-xs font-bold disabled:opacity-50"
              >
                {deleteAccount.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Delete'}
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

      {/* Edit form */}
      {isEditing ? (
        <AccountForm
          initial={toAccountForm(account)}
          submitLabel="Save Changes"
          onSave={handleUpdate}
          onCancel={() => setIsEditing(false)}
          isSaving={updateAccount.isPending}
        />
      ) : (
        <>
          {/* Tabs */}
          <div className="flex rounded-xl border border-border-subtle overflow-hidden w-fit">
            {(['details', 'contacts'] as DetailTab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-1.5 text-xs font-semibold capitalize transition-colors ${
                  tab === t ? 'bg-brand text-bg' : 'bg-bg-elevated text-text-secondary hover:text-text-primary'
                } ${t === 'contacts' ? 'border-l border-border-subtle' : ''}`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Details tab */}
          {tab === 'details' && (
            <div className="space-y-3 text-sm">
              {account.contractValue != null && (
                <div className="flex items-center gap-3">
                  <DollarSign className="w-4 h-4 text-text-muted shrink-0" strokeWidth={1.5} />
                  <span className="text-text-secondary font-semibold">
                    {account.currency} {account.contractValue.toLocaleString()}
                  </span>
                </div>
              )}
              {account.renewalDate && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-text-muted shrink-0" strokeWidth={1.5} />
                  <span className="text-text-secondary">
                    Renewal: {format(new Date(account.renewalDate), 'MMM d, yyyy')}
                  </span>
                </div>
              )}
              {account.notes && (
                <div className="pt-3 border-t border-border-subtle">
                  <p className="text-xs font-semibold text-text-muted mb-1.5">Notes</p>
                  <p className="text-sm text-text-secondary whitespace-pre-line">{account.notes}</p>
                </div>
              )}
              {account.contractValue == null && !account.renewalDate && !account.notes && (
                <p className="text-sm text-text-muted">No additional details on record.</p>
              )}
            </div>
          )}

          {/* Contacts tab */}
          {tab === 'contacts' && <ContactsPanel accountId={account.id} />}
        </>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function Component() {
  const [filter, setFilter] = useState<CrmAccountFilter>({ page: 1, pageSize: PAGE_SIZE });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: raw, isLoading } = useAccounts(filter);
  const data = raw as unknown as PagedResult<CrmAccountSummaryDto> | undefined;

  const createAccount = useCreateAccount();

  const handleCreate = (f: AccountFormState) => {
    const req: CrmAccountCreateRequest = {
      name: f.name,
      organizationId: f.organizationId || undefined,
      status: Number(f.status) as CrmAccountStatus,
      tier: f.tier ? (Number(f.tier) as CrmAccountTier) : undefined,
      contractValue: f.contractValue ? Number(f.contractValue) : undefined,
      currency: f.currency || undefined,
      renewalDate: f.renewalDate || undefined,
      notes: f.notes || undefined,
    };
    createAccount.mutate(req, { onSuccess: () => setShowCreate(false) });
  };

  const totalPages = data ? Math.ceil(data.totalCount / PAGE_SIZE) : 1;
  const currentPage = filter.page ?? 1;

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-text-primary tracking-tight">Accounts</h2>
            <p className="text-xs text-text-muted mt-0.5">
              {data ? `${data.totalCount.toLocaleString()} total` : 'Loading...'}
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-bg bg-brand hover:bg-brand-light transition-all"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2.5} /> New Account
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setFilter((f) => ({
              ...f,
              search: search || undefined,
              status: statusFilter ? (Number(statusFilter) as CrmAccountStatus) : undefined,
              page: 1,
            }));
          }}
          className="flex gap-2 flex-wrap"
        >
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" strokeWidth={1.5} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search accounts..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-bg-elevated border border-border-subtle text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-medium"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-bg-elevated border border-border-subtle text-sm text-text-secondary focus:outline-none focus:border-border-medium"
          >
            <option value="">All Status</option>
            {Object.entries(CRM_ACCOUNT_STATUS_LABELS).map(([k, label]) => (
              <option key={k} value={k}>{label}</option>
            ))}
          </select>
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
              <Building className="w-8 h-8 opacity-30" strokeWidth={1.2} />
              <p className="text-sm">No accounts found</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle">
                  <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wider">Account</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wider hidden md:table-cell">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wider hidden lg:table-cell">Tier</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wider hidden lg:table-cell">Contract</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wider hidden md:table-cell">Created</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((a: CrmAccountSummaryDto) => (
                  <tr
                    key={a.id}
                    onClick={() => setSelectedId(a.id)}
                    className="border-b border-border-subtle last:border-0 hover:bg-bg-elevated cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="font-semibold text-text-primary">{a.name}</div>
                      {a.organizationName && (
                        <div className="text-xs text-text-muted">{a.organizationName}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${CRM_ACCOUNT_STATUS_COLORS[a.status]}`}>
                        {CRM_ACCOUNT_STATUS_LABELS[a.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-muted hidden lg:table-cell">
                      {a.tier ? CRM_ACCOUNT_TIER_LABELS[a.tier] : '—'}
                    </td>
                    <td className="px-4 py-3 text-text-secondary hidden lg:table-cell">
                      {a.contractValue != null ? `${a.currency} ${a.contractValue.toLocaleString()}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-text-muted text-xs hidden md:table-cell">
                      {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
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
        <Modal title="New Account" onClose={() => setShowCreate(false)}>
          <AccountForm
            submitLabel="Create Account"
            onSave={handleCreate}
            onCancel={() => setShowCreate(false)}
            isSaving={createAccount.isPending}
          />
        </Modal>
      )}

      {selectedId && (
        <SlideOver title="Account" onClose={() => setSelectedId(null)}>
          <AccountDetailPanel accountId={selectedId} onClose={() => setSelectedId(null)} />
        </SlideOver>
      )}
    </>
  );
}
