import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Loader2, UserCheck, Mail, Phone, Globe, Tag,
  Pencil, Trash2, X, Check, Activity,
  Send, MessageSquare, Clock, ChevronDown, ChevronUp,
  Briefcase,
} from 'lucide-react';
import {
  useContactById, useUpdateContact, useDeleteContact,
  useCrmContactEnrollments, useCancelCrmContactEnrollments,
  useSignals, useContactDeals,
} from '../api/crm.queries';
import type {
  CrmContactDetailDto, CrmContactUpdateRequest, CrmNurtureEnrollmentDto,
  CrmSignalDto, CrmDealSummaryDto,
} from '../types/crm.types';
import {
  EnrollmentStatus, CRM_CONTACT_SOURCE_LABELS,
  CrmSignalKind, CrmSignalSource, CrmEntityType,
  CRM_DEAL_STATUS_LABELS, CRM_DEAL_STATUS_COLORS,
} from '../types/crm.types';
import { CustomFieldsPanel } from '../components/CustomFieldsPanel';
import { ROUTES } from '@/app/router/route-paths';
import { formatDistanceToNow, format } from 'date-fns';

const inputCls =
  'w-full px-3 py-2 rounded-xl bg-bg-elevated border border-border-subtle text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-medium';

const ENROLLMENT_STATUS_LABELS: Record<number, string> = {
  1: 'Active', 2: 'Paused', 3: 'Completed', 4: 'Cancelled',
};
const ENROLLMENT_STATUS_COLORS: Record<number, string> = {
  1: 'text-brand bg-brand-soft border-border-glow',
  2: 'text-[#F59E0B] bg-[rgba(245,158,11,0.1)] border-[rgba(245,158,11,0.2)]',
  3: 'text-success bg-success-soft border-[rgba(34,197,94,0.2)]',
  4: 'text-text-muted bg-bg-elevated border-border-subtle',
};

// ─── Edit form ────────────────────────────────────────────────────────────────

type EditState = {
  fullName: string;
  email: string;
  phone: string;
  jobTitle: string;
  linkedIn: string;
  notes: string;
};

function toEditState(c: CrmContactDetailDto): EditState {
  return {
    fullName: c.fullName,
    email: c.email ?? '',
    phone: c.phone ?? '',
    jobTitle: c.jobTitle ?? '',
    linkedIn: c.linkedIn ?? '',
    notes: c.notes ?? '',
  };
}

function EditForm({
  contact,
  onSave,
  onCancel,
  isSaving,
}: {
  contact: CrmContactDetailDto;
  onSave: (data: CrmContactUpdateRequest) => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState<EditState>(() => toEditState(contact));

  const set =
    (k: keyof EditState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      fullName: form.fullName || undefined,
      email: form.email || undefined,
      phone: form.phone || undefined,
      jobTitle: form.jobTitle || undefined,
      linkedIn: form.linkedIn || undefined,
      notes: form.notes || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-text-muted mb-1.5">Full Name *</label>
          <input required value={form.fullName} onChange={set('fullName')} className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-text-muted mb-1.5">Job Title</label>
          <input value={form.jobTitle} onChange={set('jobTitle')} placeholder="VP of Sales" className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-text-muted mb-1.5">Email</label>
          <input type="email" value={form.email} onChange={set('email')} className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-text-muted mb-1.5">Phone</label>
          <input value={form.phone} onChange={set('phone')} className={inputCls} />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-text-muted mb-1.5">LinkedIn URL</label>
        <input value={form.linkedIn} onChange={set('linkedIn')} placeholder="https://linkedin.com/in/..." className={inputCls} />
      </div>
      <div>
        <label className="block text-xs font-semibold text-text-muted mb-1.5">Notes</label>
        <textarea rows={3} value={form.notes} onChange={set('notes')} className={`${inputCls} resize-none`} />
      </div>
      <div className="flex gap-3 pt-1">
        <button
          type="submit"
          disabled={isSaving || !form.fullName.trim()}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand text-bg text-sm font-bold hover:bg-brand-light disabled:opacity-50 transition-all"
        >
          {isSaving
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <><Check className="w-3.5 h-3.5" /> Save</>}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border-subtle text-sm text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-all"
        >
          <X className="w-3.5 h-3.5" /> Cancel
        </button>
      </div>
    </form>
  );
}

// ─── Deals panel ─────────────────────────────────────────────────────────────

function ContactDealsPanel({ contactId }: { contactId: string }) {
  const { data: raw, isLoading } = useContactDeals(contactId);
  const deals = ((raw as any)?.items ?? []) as CrmDealSummaryDto[];

  return (
    <div className="rounded-2xl border border-border-subtle bg-bg-card p-5">
      <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2 mb-4">
        <Briefcase className="w-3.5 h-3.5" strokeWidth={1.5} />
        Deals
        {deals.length > 0 && (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-bg-elevated text-text-secondary border border-border-subtle">
            {deals.length}
          </span>
        )}
      </h3>

      {isLoading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-4 h-4 animate-spin text-text-muted" />
        </div>
      ) : deals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 gap-2 text-text-muted">
          <Briefcase className="w-6 h-6 opacity-30" strokeWidth={1.2} />
          <p className="text-sm">No deals linked to this contact.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {deals.map((d) => (
            <div
              key={d.id}
              className="flex items-center justify-between gap-3 p-3 rounded-xl bg-bg-elevated border border-border-subtle"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-text-primary truncate">{d.name}</p>
                <p className="text-xs text-text-muted mt-0.5">
                  {d.stageName ?? '—'}
                  {d.amount != null && (
                    <> · <span className="text-text-secondary font-medium">${Number(d.amount).toLocaleString()}</span></>
                  )}
                  {d.closeDate && (
                    <> · closes {format(new Date(d.closeDate), 'MMM d, yyyy')}</>
                  )}
                </p>
              </div>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border shrink-0 ${CRM_DEAL_STATUS_COLORS[d.status]}`}>
                {CRM_DEAL_STATUS_LABELS[d.status]}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

function parsePayload(json: string | null): Record<string, unknown> | null {
  if (!json) return null;
  try { return JSON.parse(json); } catch { return null; }
}

function SignalIcon({ kind, source }: { kind: CrmSignalKind; source: CrmSignalSource }) {
  if (kind === CrmSignalKind.Email && source === CrmSignalSource.EmailInbound) {
    return (
      <div className="w-8 h-8 rounded-full bg-brand-soft border border-border-glow flex items-center justify-center shrink-0">
        <MessageSquare className="w-3.5 h-3.5 text-brand" strokeWidth={1.5} />
      </div>
    );
  }
  if (kind === CrmSignalKind.Email && source === CrmSignalSource.EmailOutbound) {
    return (
      <div className="w-8 h-8 rounded-full bg-bg-elevated border border-border-subtle flex items-center justify-center shrink-0">
        <Send className="w-3.5 h-3.5 text-text-muted" strokeWidth={1.5} />
      </div>
    );
  }
  return (
    <div className="w-8 h-8 rounded-full bg-bg-elevated border border-border-subtle flex items-center justify-center shrink-0">
      <Activity className="w-3.5 h-3.5 text-text-muted" strokeWidth={1.5} />
    </div>
  );
}

function TimelineItem({ signal }: { signal: CrmSignalDto }) {
  const [expanded, setExpanded] = useState(false);
  const payload = parsePayload(signal.payloadJson);
  const replyMessage = payload?.message as string | undefined;
  const isInboundReply = signal.kind === CrmSignalKind.Email
    && signal.source === CrmSignalSource.EmailInbound;

  return (
    <div className="flex gap-3">
      <SignalIcon kind={signal.kind} source={signal.source} />

      <div className="flex-1 min-w-0 pb-4 border-b border-border-subtle last:border-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            {isInboundReply ? (
              <p className="text-sm font-semibold text-brand">Customer replied</p>
            ) : (
              <p className="text-sm font-medium text-text-primary truncate">
                {signal.summary ?? 'Signal recorded'}
              </p>
            )}
            <div className="flex items-center gap-1.5 mt-0.5 text-text-muted">
              <Clock className="w-3 h-3" strokeWidth={1.5} />
              <span className="text-xs">
                {formatDistanceToNow(new Date(signal.occurredAt), { addSuffix: true })}
              </span>
              <span className="text-[10px]">·</span>
              <span className="text-xs">{format(new Date(signal.occurredAt), 'MMM d, HH:mm')}</span>
            </div>
          </div>
          {isInboundReply && replyMessage && (
            <button
              onClick={() => setExpanded(v => !v)}
              className="flex items-center gap-1 text-[10px] font-semibold text-text-muted hover:text-text-primary transition-colors shrink-0"
            >
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {expanded ? 'Hide' : 'View'}
            </button>
          )}
        </div>

        {/* Reply message — shown inline for inbound emails */}
        {isInboundReply && replyMessage && (
          <>
            {/* Always show a preview */}
            {!expanded && (
              <p className="mt-2 text-xs text-text-secondary bg-bg-elevated rounded-lg px-3 py-2 border border-border-subtle line-clamp-2">
                {replyMessage}
              </p>
            )}
            {expanded && (
              <p className="mt-2 text-sm text-text-primary bg-bg-elevated rounded-lg px-3 py-2.5 border border-border-glow whitespace-pre-wrap leading-relaxed">
                {replyMessage}
              </p>
            )}
          </>
        )}

        {/* Non-reply inbound: show full summary */}
        {!isInboundReply && signal.summary && signal.summary !== signal.summary?.slice(0, 60) && (
          <p className="mt-1 text-xs text-text-muted line-clamp-2">{signal.summary}</p>
        )}
      </div>
    </div>
  );
}

function ContactTimeline({ contactId }: { contactId: string }) {
  const { data: raw, isLoading } = useSignals({
    subjectKind: 2, // CrmSignalSubjectKind.Contact
    subjectId: contactId,
    pageSize: 50,
  });
  const signals = ((raw as any)?.items ?? []) as CrmSignalDto[];

  return (
    <div className="rounded-2xl border border-border-subtle bg-bg-card p-5">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
          <Activity className="w-3.5 h-3.5" strokeWidth={1.5} />
          Activity Timeline
          {signals.length > 0 && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-bg-elevated text-text-secondary border border-border-subtle">
              {signals.length}
            </span>
          )}
        </h3>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8 text-text-muted">
          <Loader2 className="w-4 h-4 animate-spin" />
        </div>
      ) : signals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 gap-2 text-text-muted">
          <Activity className="w-6 h-6 opacity-30" strokeWidth={1.2} />
          <p className="text-sm">No activity yet.</p>
          <p className="text-xs text-center max-w-xs">
            Campaign sends, replies, and interactions will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-0">
          {signals.map((s) => (
            <TimelineItem key={s.id} signal={s} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function Component() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data: raw, isLoading } = useContactById(id);
  const contact = raw as unknown as CrmContactDetailDto | undefined;

  const { data: rawEnrollments } = useCrmContactEnrollments(id ?? '');
  const enrollments = rawEnrollments as unknown as CrmNurtureEnrollmentDto[] | undefined;

  const updateContact = useUpdateContact();
  const deleteContact = useDeleteContact();
  const cancelEnrollments = useCancelCrmContactEnrollments();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-text-muted">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-text-muted">
        <UserCheck className="w-8 h-8 opacity-30" strokeWidth={1.2} />
        <p className="text-sm">Contact not found.</p>
        <button
          onClick={() => navigate(-1)}
          className="text-xs text-brand hover:underline"
        >
          Go back
        </button>
      </div>
    );
  }

  const handleSave = (data: CrmContactUpdateRequest) => {
    updateContact.mutate({ id: contact.id, data }, {
      onSuccess: () => setIsEditing(false),
    });
  };

  const handleDelete = () => {
    deleteContact.mutate(contact.id, {
      onSuccess: () => navigate(ROUTES.dashboard.crmContacts),
    });
  };

  const activeEnrollments = enrollments?.filter(
    (e) => e.status === EnrollmentStatus.Active || e.status === EnrollmentStatus.Paused,
  ) ?? [];

  return (
    <div className="space-y-4">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left column ──────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Header card */}
          <div className="rounded-2xl border border-border-subtle bg-bg-card p-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-[#132A21] flex items-center justify-center text-xl font-extrabold text-[#8FAEA0] shrink-0">
                {contact.fullName[0]?.toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                {isEditing ? (
                  <EditForm
                    contact={contact}
                    onSave={handleSave}
                    onCancel={() => setIsEditing(false)}
                    isSaving={updateContact.isPending}
                  />
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-extrabold text-text-primary">{contact.fullName}</h2>
                        {contact.jobTitle && (
                          <p className="text-sm text-text-secondary mt-0.5">{contact.jobTitle}</p>
                        )}
                        <span className="inline-flex mt-2 px-2 py-0.5 rounded-md text-xs font-medium bg-bg-elevated text-text-secondary border border-border-subtle">
                          {CRM_CONTACT_SOURCE_LABELS[contact.sourceKind]}
                        </span>
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
                              disabled={deleteContact.isPending}
                              className="px-3 py-1.5 rounded-lg bg-danger text-bg text-xs font-bold disabled:opacity-50 transition-all"
                            >
                              {deleteContact.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Delete'}
                            </button>
                            <button
                              onClick={() => setConfirmDelete(false)}
                              className="text-xs text-text-muted hover:text-text-primary"
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDelete(true)}
                            className="p-1.5 rounded-lg border border-border-subtle text-text-muted hover:text-danger hover:border-[rgba(244,63,94,0.3)] hover:bg-danger-soft transition-all"
                            title="Delete contact"
                          >
                            <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="mt-3 text-xs text-text-muted">
                      Created {formatDistanceToNow(new Date(contact.createdAt), { addSuffix: true })}
                      {contact.updatedAt && (
                        <> · Updated {formatDistanceToNow(new Date(contact.updatedAt), { addSuffix: true })}</>
                      )}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Details */}
          {!isEditing && (
            <div className="rounded-2xl border border-border-subtle bg-bg-card p-5 space-y-3.5">
              <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">Details</h3>

              {contact.email && (
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-text-muted shrink-0" strokeWidth={1.5} />
                  <a href={`mailto:${contact.email}`} className="text-brand hover:underline">{contact.email}</a>
                </div>
              )}
              {contact.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-text-muted shrink-0" strokeWidth={1.5} />
                  <span className="text-text-secondary">{contact.phone}</span>
                </div>
              )}
              {contact.linkedIn && (
                <div className="flex items-center gap-3 text-sm">
                  <Globe className="w-4 h-4 text-text-muted shrink-0" strokeWidth={1.5} />
                  <a href={contact.linkedIn} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline truncate">
                    {contact.linkedIn}
                  </a>
                </div>
              )}
              {contact.preferredLanguage && (
                <div className="flex items-center gap-3 text-sm">
                  <Tag className="w-4 h-4 text-text-muted shrink-0" strokeWidth={1.5} />
                  <span className="text-text-secondary">
                    Language: <strong className="text-text-primary">{contact.preferredLanguage}</strong>
                  </span>
                </div>
              )}
              {!contact.email && !contact.phone && !contact.linkedIn && !contact.preferredLanguage && (
                <p className="text-sm text-text-muted">No contact details on record.</p>
              )}
              {contact.notes && (
                <div className="pt-3 border-t border-border-subtle">
                  <p className="text-xs font-semibold text-text-muted mb-1.5">Notes</p>
                  <p className="text-sm text-text-secondary whitespace-pre-line">{contact.notes}</p>
                </div>
              )}
            </div>
          )}

          {/* Deals */}
          {!isEditing && <ContactDealsPanel contactId={contact.id} />}

          {/* Activity timeline */}
          {!isEditing && <ContactTimeline contactId={contact.id} />}
        </div>

        {/* ── Right column ─────────────────────────────────────────────── */}
        <div className="lg:col-span-1 space-y-4">

          {/* Nurture enrollments */}
          {!isEditing && (
            <div className="rounded-2xl border border-border-subtle bg-bg-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5" strokeWidth={1.5} />
                  Nurture
                  {activeEnrollments.length > 0 && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-brand-soft text-brand border border-border-glow">
                      {activeEnrollments.length}
                    </span>
                  )}
                </h3>
                {activeEnrollments.length > 0 && (
                  <button
                    onClick={() => cancelEnrollments.mutate(contact.id)}
                    disabled={cancelEnrollments.isPending}
                    className="text-xs text-danger font-semibold opacity-70 hover:opacity-100 transition-opacity disabled:opacity-40"
                  >
                    Cancel all
                  </button>
                )}
              </div>

              {!enrollments || enrollments.length === 0 ? (
                <p className="text-xs text-text-muted">Not enrolled in any sequence.</p>
              ) : (
                <div className="space-y-2">
                  {enrollments.map((e: CrmNurtureEnrollmentDto) => (
                    <div key={e.id} className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-bg-elevated border border-border-subtle">
                      <div className="min-w-0">
                        <div className="font-semibold text-xs text-text-primary truncate">{e.sequenceName ?? e.sequenceId}</div>
                        <div className="text-[10px] text-text-muted mt-0.5">
                          Step {e.currentStep}
                          {e.nextStepAt && <> · Next: {format(new Date(e.nextStepAt), 'MMM d')}</>}
                        </div>
                      </div>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border shrink-0 ${ENROLLMENT_STATUS_COLORS[e.status]}`}>
                        {ENROLLMENT_STATUS_LABELS[e.status]}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Custom fields */}
          {!isEditing && <CustomFieldsPanel recordId={contact.id} entityType={CrmEntityType.Contact} />}

        </div>
      </div>
    </div>
  );
}
