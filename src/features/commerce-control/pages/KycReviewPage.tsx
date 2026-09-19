import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  XCircle,
} from 'lucide-react';
import {
  APPLICANT_KIND_LABEL,
  ApplicantKind,
  DECISION_LABEL,
  KycDecision,
  REVIEW_STATE_LABEL,
  ReviewState,
  stylemintKycApi,
  type KycDecisionValue,
  type KycReviewItem,
} from '../api/stylemint-kyc.api';

/**
 * Creator and vendor application review.
 *
 * This is the gate every seller passes through before they can list anything, and it was
 * reachable only through the generic operations console — where an overdue application looks
 * exactly like a fresh one. The queue carries a due date, so the thing an operator needs first is
 * to see what has blown it.
 */
export function KycReviewPage() {
  const client = useQueryClient();
  const [kind, setKind] = useState<number | undefined>(undefined);
  const [state, setState] = useState<number | undefined>(ReviewState.Pending);
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [selected, setSelected] = useState<KycReviewItem | null>(null);

  const queue = useQuery({
    queryKey: ['stylemint-kyc-queue', kind, state, overdueOnly],
    queryFn: () =>
      stylemintKycApi.queue({ applicantKind: kind, state, overdueOnly, pageSize: 50 }),
  });

  const refresh = () => client.invalidateQueries({ queryKey: ['stylemint-kyc-queue'] });

  return (
    <div className="mx-auto max-w-[1500px] space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-brand">
            Stylemint onboarding
          </p>
          <h1 className="mt-2 flex items-center gap-2 text-2xl font-black tracking-tight text-text-primary">
            <ShieldCheck className="h-5 w-5 text-brand" strokeWidth={1.6} />
            Applications
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Creator and vendor applications awaiting review. Every seller passes through here.
          </p>
        </div>
        <button
          onClick={refresh}
          className="flex items-center gap-2 rounded-card border-thin border-border-subtle px-3 py-2 text-xs font-bold text-text-secondary hover:text-brand"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${queue.isFetching ? 'animate-spin' : ''}`}
            strokeWidth={1.6}
          />
          Refresh
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-frame border-thin border-border-subtle bg-bg-card p-3">
        <Filter label="Applicant" value={kind} onChange={setKind}
          options={[
            { value: undefined, label: 'Everyone' },
            { value: ApplicantKind.Creator, label: 'Creators' },
            { value: ApplicantKind.Vendor, label: 'Vendors' },
          ]}
        />
        <Filter label="State" value={state} onChange={setState}
          options={[
            { value: undefined, label: 'Any' },
            { value: ReviewState.Pending, label: 'Pending' },
            { value: ReviewState.InReview, label: 'In review' },
            { value: ReviewState.Decided, label: 'Decided' },
          ]}
        />
        <label className="flex items-center gap-2 text-xs font-bold text-text-secondary">
          <input
            type="checkbox"
            checked={overdueOnly}
            onChange={(event) => setOverdueOnly(event.target.checked)}
            className="accent-brand"
          />
          Past due only
        </label>
        <span className="ml-auto text-xs font-bold text-text-muted">
          {queue.data ? `${queue.data.totalCount.toLocaleString()} application(s)` : 'Loading…'}
        </span>
      </div>

      {queue.isError && (
        <div className="flex items-start gap-3 rounded-frame border-thin border-rose-400/25 bg-rose-400/5 p-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" strokeWidth={1.6} />
          <p className="text-sm text-text-secondary">{(queue.error as Error).message}</p>
        </div>
      )}

      {queue.isLoading ? (
        <div className="flex items-center gap-3 rounded-frame border-thin border-border-subtle bg-bg-card p-8 text-sm text-text-muted">
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.6} /> Loading applications…
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_400px]">
          <div className="overflow-hidden rounded-frame border-thin border-border-subtle bg-bg-card">
            {(queue.data?.items ?? []).map((item) => (
              <QueueRow
                key={item.id}
                item={item}
                active={selected?.id === item.id}
                onClick={() => setSelected(item)}
              />
            ))}
            {(queue.data?.items.length ?? 0) === 0 && !queue.isError && (
              <div className="p-10 text-center">
                <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-300" strokeWidth={1.6} />
                <p className="mt-3 text-sm font-bold text-text-primary">Nothing to review</p>
                <p className="mt-1 text-xs text-text-muted">
                  No applications match these filters.
                </p>
              </div>
            )}
          </div>

          <DecisionPanel item={selected} onDecided={refresh} />
        </div>
      )}
    </div>
  );
}

function Filter<T extends number | undefined>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <label className="flex items-center gap-2 text-xs font-bold text-text-secondary">
      {label}
      <select
        value={value === undefined ? '' : String(value)}
        onChange={(event) =>
          onChange((event.target.value === '' ? undefined : Number(event.target.value)) as T)
        }
        className="rounded-card border-thin border-border-subtle bg-bg-elevated px-2 py-1.5 text-xs text-text-primary outline-none focus:border-border-glow"
      >
        {options.map((option) => (
          <option key={option.label} value={option.value === undefined ? '' : String(option.value)}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

/** True when the due date has passed and no decision has been recorded. */
function isOverdue(item: KycReviewItem): boolean {
  return !item.decidedUtc && new Date(item.dueByUtc).getTime() < Date.now();
}

function QueueRow({
  item,
  active,
  onClick,
}: {
  item: KycReviewItem;
  active: boolean;
  onClick: () => void;
}) {
  const overdue = isOverdue(item);

  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 border-b border-border-subtle px-4 py-3 text-left last:border-b-0 hover:bg-bg-elevated ${
        active ? 'bg-brand-soft' : ''
      }`}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-text-primary">
          {APPLICANT_KIND_LABEL[item.applicantKind] ?? 'Applicant'} application
        </p>
        <p className="mt-0.5 text-[11px] text-text-muted">
          <span className="font-mono">{item.accountId.slice(0, 8)}</span>
          {' · submitted '}
          {new Date(item.submittedUtc).toLocaleDateString()}
          {' · due '}
          {new Date(item.dueByUtc).toLocaleDateString()}
        </p>
      </div>
      {overdue && (
        <span className="shrink-0 rounded-sm border-thin border-rose-400/25 bg-rose-400/10 px-2 py-0.5 text-[10px] font-black text-rose-300">
          Past due
        </span>
      )}
      <span className="shrink-0 rounded-sm border-thin border-border-subtle px-2 py-0.5 text-[10px] font-black text-text-secondary">
        {REVIEW_STATE_LABEL[item.state] ?? item.state}
      </span>
    </button>
  );
}

function DecisionPanel({
  item,
  onDecided,
}: {
  item: KycReviewItem | null;
  onDecided: () => void;
}) {
  const [reasonCode, setReasonCode] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<KycDecisionValue | null>(null);

  const decide = useMutation({
    mutationFn: (decision: KycDecisionValue) =>
      stylemintKycApi.decide(item!.id, decision, reasonCode, note),
    onSuccess: () => {
      setReasonCode('');
      setNote('');
      setError(null);
      setPending(null);
      onDecided();
    },
    onError: (caught: unknown) => {
      setPending(null);
      setError(caught instanceof Error ? caught.message : 'The decision could not be recorded.');
    },
  });

  if (!item) {
    return (
      <div className="rounded-frame border-thin border-border-subtle bg-bg-card p-8 text-center">
        <UserCheck className="mx-auto h-8 w-8 text-text-muted" strokeWidth={1.6} />
        <p className="mt-3 text-sm text-text-muted">
          Pick an application to review and decide it.
        </p>
      </div>
    );
  }

  const decided = item.state === ReviewState.Decided;

  return (
    <div className="space-y-3 rounded-frame border-thin border-border-subtle bg-bg-card p-4">
      <div>
        <p className="text-sm font-bold text-text-primary">
          {APPLICANT_KIND_LABEL[item.applicantKind] ?? 'Applicant'} application
        </p>
        <p className="mt-0.5 font-mono text-[11px] text-text-muted">{item.accountId}</p>
      </div>

      <dl className="space-y-1 text-[11px]">
        <Row label="Submitted" value={new Date(item.submittedUtc).toLocaleString()} />
        <Row
          label="Due by"
          value={new Date(item.dueByUtc).toLocaleString()}
          tone={isOverdue(item) ? 'danger' : undefined}
        />
        <Row label="State" value={REVIEW_STATE_LABEL[item.state] ?? String(item.state)} />
      </dl>

      {decided ? (
        <div className="rounded-card border-thin border-border-subtle bg-bg-elevated p-3">
          <p className="text-xs font-bold text-text-primary">
            {DECISION_LABEL[item.decision ?? 0] ?? 'Decided'}
          </p>
          {item.decisionReasonCode && (
            <p className="mt-1 font-mono text-[11px] text-text-muted">{item.decisionReasonCode}</p>
          )}
          {item.decisionNote && (
            <p className="mt-1 text-xs text-text-secondary">{item.decisionNote}</p>
          )}
          <p className="mt-2 text-[10px] text-text-muted">
            Decided {item.decidedUtc ? new Date(item.decidedUtc).toLocaleString() : ''}. A decision
            is final here — a rejected applicant reapplies rather than being re-decided.
          </p>
        </div>
      ) : (
        <>
          <input
            value={reasonCode}
            onChange={(event) => setReasonCode(event.target.value)}
            placeholder="Reason code (optional)"
            className="w-full rounded-card border-thin border-border-subtle bg-bg-elevated px-3 py-2 font-mono text-xs text-text-primary outline-none focus:border-border-glow"
          />
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={3}
            placeholder="Note for the record (optional)"
            className="w-full rounded-card border-thin border-border-subtle bg-bg-elevated px-3 py-2 text-xs text-text-primary outline-none focus:border-border-glow"
          />

          {error && (
            <div className="flex items-start gap-2 rounded-card border-thin border-rose-400/25 bg-rose-400/5 p-2.5">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-300" strokeWidth={1.6} />
              <p className="text-xs text-text-secondary">{error}</p>
            </div>
          )}

          {pending ? (
            <div className="space-y-2 rounded-card border-thin border-amber-400/25 bg-amber-400/5 p-3">
              <p className="text-xs font-bold text-amber-300">
                Record “{DECISION_LABEL[pending]}” for this applicant?
              </p>
              <p className="text-[10px] text-text-muted">
                This is final. A rejected applicant reapplies rather than being re-decided.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => decide.mutate(pending)}
                  disabled={decide.isPending}
                  className="rounded-card bg-brand px-3 py-2 text-xs font-bold text-bg hover:bg-brand-light disabled:opacity-40"
                >
                  {decide.isPending ? 'Recording…' : 'Yes, record it'}
                </button>
                <button
                  onClick={() => setPending(null)}
                  className="rounded-card border-thin border-border-medium px-3 py-2 text-xs font-bold text-text-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <DecisionButton
                icon={CheckCircle2}
                label="Approve"
                tone="border-emerald-400/25 text-emerald-300 hover:bg-emerald-400/10"
                onClick={() => setPending(KycDecision.Approved)}
              />
              <DecisionButton
                icon={Clock}
                label="Reject — may reapply"
                tone="border-amber-400/25 text-amber-300 hover:bg-amber-400/10"
                onClick={() => setPending(KycDecision.RejectedRetryable)}
              />
              <DecisionButton
                icon={XCircle}
                label="Reject — final"
                tone="border-rose-400/25 text-rose-300 hover:bg-rose-400/10"
                onClick={() => setPending(KycDecision.RejectedTerminal)}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'danger';
}) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-text-muted">{label}</dt>
      <dd className={tone === 'danger' ? 'font-bold text-rose-300' : 'text-text-secondary'}>
        {value}
      </dd>
    </div>
  );
}

function DecisionButton({
  icon: Icon,
  label,
  tone,
  onClick,
}: {
  icon: typeof CheckCircle2;
  label: string;
  tone: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-card border-thin px-3 py-2 text-xs font-bold ${tone}`}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={1.6} />
      {label}
    </button>
  );
}

export { KycReviewPage as Component };
