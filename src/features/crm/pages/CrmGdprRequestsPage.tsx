import { useState } from 'react';
import {
  CalendarClock,
  CheckCircle2,
  Loader2,
  Lock,
  ScrollText,
  ShieldAlert,
} from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { useProfile } from '@/features/auth/api/auth.queries';
import { UserRole, type UserDto } from '@/features/auth/types/auth.types';
import {
  useCreateGdprRetentionPolicy,
  useCreateGdprSubjectRequest,
  useGdprRetentionPolicies,
  useGdprSubjectRequests,
  useMarkErasureProcessed,
} from '../api/crm-gdpr.queries';
import {
  DATA_SUBJECT_REQUEST_TYPES,
  REQUEST_TYPE_DESCRIPTION,
  type CrmDataRetentionPolicyDto,
  type CrmDataSubjectRequestDto,
  type DataSubjectRequestStatus,
  type DataSubjectRequestType,
} from '../types/crm-gdpr.types';

const STATUS_CLASS: Record<DataSubjectRequestStatus, string> = {
  Pending: 'text-warning bg-warning-soft border-warning/20',
  InProgress: 'text-info bg-info-soft border-info/20',
  Completed: 'text-success bg-success-soft border-success/20',
  Rejected: 'text-danger bg-danger-soft border-danger/20',
};

/** GDPR gives a month; the badge turns when there is a week left. */
const DUE_DAYS = 30;
const daysOpen = (iso: string) =>
  Math.floor((Date.now() - parseISO(iso).getTime()) / 86_400_000);

export function Component() {
  const { data: profile } = useProfile();
  // Owners and Admins only, same bar as the audit log.
  const role = (profile as UserDto | undefined)?.role;
  const isManager = role === UserRole.Owner || role === UserRole.Admin;

  const { data: requests, isLoading } = useGdprSubjectRequests();
  const { data: policies } = useGdprRetentionPolicies();
  const createRequest = useCreateGdprSubjectRequest();
  const markProcessed = useMarkErasureProcessed();
  const createPolicy = useCreateGdprRetentionPolicy();

  const [email, setEmail] = useState('');
  const [type, setType] = useState<DataSubjectRequestType>('Access');
  const [details, setDetails] = useState('');

  const [policyName, setPolicyName] = useState('');
  const [entityType, setEntityType] = useState('');
  const [retentionDays, setRetentionDays] = useState(365);

  if (profile && !isManager) {
    return (
      <div className="py-16 text-center">
        <Lock className="w-8 h-8 text-text-muted mx-auto mb-3" />
        <h1 className="text-lg font-bold text-text-primary">Restricted</h1>
        <p className="text-sm text-text-muted mt-1">
          Data-subject requests are available to Owners and Admins only.
        </p>
      </div>
    );
  }

  const rows = (requests?.items ?? []) as CrmDataSubjectRequestDto[];
  const policyRows = (policies?.items ?? []) as CrmDataRetentionPolicyDto[];
  const open = rows.filter((r) => r.status === 'Pending' || r.status === 'InProgress');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    createRequest.mutate(
      {
        requestorEmail: email.trim(),
        requestType: type,
        requestDetails: details.trim() || null,
      },
      {
        onSuccess: () => {
          setEmail('');
          setDetails('');
        },
      }
    );
  };

  const submitPolicy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!policyName.trim() || !entityType.trim()) return;
    createPolicy.mutate(
      { name: policyName.trim(), entityType: entityType.trim(), retentionDays },
      {
        onSuccess: () => {
          setPolicyName('');
          setEntityType('');
        },
      }
    );
  };

  return (
    <div className="py-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-brand-soft border border-border-glow flex items-center justify-center">
          <ScrollText className="w-6 h-6 text-brand" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-text-primary">Data subject requests</h1>
          <p className="text-sm text-text-muted">
            Access, erasure and portability requests, and how long each record is kept.
          </p>
        </div>
      </div>

      {/* The endpoint behind "Mark processed" records the decision; it does not
          delete anything. Saying so on the page is the difference between a
          compliance tool and a false record of compliance. */}
      <div
        className="rounded-2xl border border-warning/20 bg-warning-soft px-5 py-4 flex gap-3"
        data-testid="gdpr-manual-erasure-notice"
      >
        <ShieldAlert className="w-5 h-5 text-warning shrink-0 mt-0.5" />
        <p className="text-sm text-text-secondary">
          <span className="font-semibold text-text-primary">
            Marking a request processed records the decision — it does not delete data.
          </span>{' '}
          The erasure itself is still a manual job. Do it before you mark the request
          complete, because the timestamp is what an auditor will read as the date you
          acted.
        </p>
      </div>

      {open.length > 0 && (
        <p className="text-sm text-text-secondary" data-testid="gdpr-open-count">
          <span className="font-semibold text-text-primary">{open.length}</span> open{' '}
          {open.length === 1 ? 'request' : 'requests'}. The deadline is {DUE_DAYS} days from
          the date each one arrived.
        </p>
      )}

      <form
        onSubmit={submit}
        className="rounded-2xl border border-border-subtle bg-bg-card px-5 py-4 space-y-3"
      >
        <h2 className="text-sm font-semibold text-text-primary">Log a request</h2>
        <div className="flex flex-wrap gap-3">
          <input
            aria-label="Requestor email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="person@example.com"
            className="flex-1 min-w-[220px] rounded-xl bg-bg-input border border-border-subtle px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand"
          />
          <select
            aria-label="Request type"
            value={type}
            onChange={(e) => setType(e.target.value as DataSubjectRequestType)}
            className="rounded-xl bg-bg-input border border-border-subtle px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand"
          >
            {DATA_SUBJECT_REQUEST_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <p className="text-xs text-text-muted">{REQUEST_TYPE_DESCRIPTION[type]}</p>
        <textarea
          aria-label="Request details"
          rows={2}
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="Anything the person said about what they want (optional)"
          className="w-full rounded-xl bg-bg-input border border-border-subtle px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand"
        />
        <button
          type="submit"
          disabled={createRequest.isPending || !email.trim()}
          className="rounded-xl bg-brand text-text-inverted px-4 py-2 text-sm font-bold disabled:opacity-40"
        >
          {createRequest.isPending ? 'Logging…' : 'Log request'}
        </button>
      </form>

      <div className="rounded-2xl border border-border-subtle bg-bg-card px-5 py-4">
        {isLoading ? (
          <div className="flex justify-center py-12 text-text-muted">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-12">
            No requests yet. One logged here is one you can prove you handled.
          </p>
        ) : (
          <ul className="divide-y divide-border-subtle">
            {rows.map((r) => {
              const age = daysOpen(r.createdAt);
              const stillOpen = r.status === 'Pending' || r.status === 'InProgress';
              const overdue = stillOpen && age > DUE_DAYS;
              const dueSoon = stillOpen && !overdue && age > DUE_DAYS - 7;
              return (
                <li key={r.id} className="py-3 flex items-start gap-3 flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <p className="text-sm text-text-primary font-medium">
                      {r.requestorEmail}
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">
                      {r.requestType} ·{' '}
                      {formatDistanceToNow(parseISO(r.createdAt), { addSuffix: true })}
                      {overdue && (
                        <span className="text-danger font-semibold">
                          {' '}
                          · past the {DUE_DAYS}-day deadline
                        </span>
                      )}
                      {dueSoon && (
                        <span className="text-warning font-semibold">
                          {' '}
                          · {DUE_DAYS - age} days left
                        </span>
                      )}
                    </p>
                    {r.requestDetails && (
                      <p className="text-xs text-text-secondary mt-1">{r.requestDetails}</p>
                    )}
                  </div>
                  <span
                    className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${STATUS_CLASS[r.status]}`}
                  >
                    {r.status}
                  </span>
                  {stillOpen && (
                    <button
                      onClick={() => markProcessed.mutate(r.id)}
                      disabled={markProcessed.isPending}
                      className="rounded-xl border border-border-medium px-3 py-1.5 text-xs font-semibold text-text-secondary hover:border-border-glow disabled:opacity-40"
                    >
                      Mark processed
                    </button>
                  )}
                  {r.status === 'Completed' && r.completedAt && (
                    <span className="flex items-center gap-1 text-xs text-text-muted">
                      <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                      {formatDistanceToNow(parseISO(r.completedAt), { addSuffix: true })}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="rounded-2xl border border-border-subtle bg-bg-card px-5 py-4 space-y-3">
        <div className="flex items-center gap-2">
          <CalendarClock className="w-4 h-4 text-text-secondary" />
          <h2 className="text-sm font-semibold text-text-primary">Retention policies</h2>
        </div>
        <form onSubmit={submitPolicy} className="flex flex-wrap gap-3">
          <input
            aria-label="Policy name"
            value={policyName}
            onChange={(e) => setPolicyName(e.target.value)}
            placeholder="Closed leads"
            className="flex-1 min-w-[160px] rounded-xl bg-bg-input border border-border-subtle px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand"
          />
          <input
            aria-label="Entity type"
            value={entityType}
            onChange={(e) => setEntityType(e.target.value)}
            placeholder="Lead"
            className="flex-1 min-w-[140px] rounded-xl bg-bg-input border border-border-subtle px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand"
          />
          <input
            aria-label="Retention days"
            type="number"
            min={1}
            value={retentionDays}
            onChange={(e) => setRetentionDays(Number(e.target.value))}
            className="w-28 rounded-xl bg-bg-input border border-border-subtle px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand"
          />
          <button
            type="submit"
            disabled={createPolicy.isPending || !policyName.trim() || !entityType.trim()}
            className="rounded-xl border border-border-medium px-4 py-2 text-sm font-semibold text-text-secondary hover:border-border-glow disabled:opacity-40"
          >
            Add
          </button>
        </form>
        {policyRows.length === 0 ? (
          <p className="text-sm text-text-muted">
            No retention policies yet — nothing ages out on a schedule.
          </p>
        ) : (
          <ul className="divide-y divide-border-subtle">
            {policyRows.map((p) => (
              <li key={p.id} className="py-2 flex items-center gap-3 text-sm">
                <span className="text-text-primary font-medium">{p.name}</span>
                <span className="text-text-muted">{p.entityType}</span>
                <span className="ml-auto text-text-secondary">
                  {p.retentionDays} days
                </span>
                {!p.isActive && (
                  <span className="text-xs text-text-muted">(inactive)</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
