import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  ShieldCheck,
  X,
} from 'lucide-react';
import {
  DATA_RIGHTS_STATUS_LABEL,
  DATA_RIGHTS_TYPE_LABEL,
  DataRightsStatus,
  daysUntilDue,
  isOutstanding,
  stylemintPrivacyApi,
  type DataRightsRequest,
  type DataRightsStatusValue,
} from '../api/stylemint-privacy.api';

/**
 * Data-rights requests — GDPR Articles 15 to 22.
 *
 * Ordered by statutory deadline rather than arrival: the request closest to breaching is the one
 * to action first, whenever it happened to be submitted. The countdown is shown on every row
 * because missing the deadline is the actual risk here, not the size of the queue.
 *
 * The decision an operator can take depends on where the request is: verify identity gates
 * everything, start marks fulfilment under way, complete closes it with a reference, reject
 * denies it with a reason on the record. Only the applicable ones are offered.
 */

const PAGE_SIZE = 25;

const STATUS_TONE: Record<number, string> = {
  1: 'text-blue-300 border-blue-400/25 bg-blue-400/5',
  2: 'text-brand border-border-glow bg-brand-soft',
  3: 'text-amber-300 border-amber-400/25 bg-amber-400/5',
  4: 'text-emerald-300 border-emerald-400/25 bg-emerald-400/5',
  5: 'text-text-secondary border-border-subtle bg-glass-2',
  6: 'text-rose-300 border-rose-400/25 bg-rose-400/5',
};

export function PrivacyRequestsPage() {
  const client = useQueryClient();
  const [status, setStatus] = useState<DataRightsStatusValue | undefined>(undefined);
  const [skip, setSkip] = useState(0);

  const page = useQuery({
    queryKey: ['stylemint-privacy', status, skip],
    queryFn: () => stylemintPrivacyApi.queue({ status, skip, take: PAGE_SIZE }),
  });

  const refresh = () => client.invalidateQueries({ queryKey: ['stylemint-privacy'] });

  const pick = (next?: DataRightsStatusValue) => {
    setStatus(next);
    setSkip(0);
  };

  const data = page.data;
  const breaching = data?.items.filter(
    (r) => isOutstanding(r.status) && daysUntilDue(r.dueAtUtc) <= 3,
  ).length;

  return (
    <div className="mx-auto max-w-[1500px] space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-brand">
            Stylemint commerce platform
          </p>
          <h1 className="mt-2 flex items-center gap-2 text-2xl font-black tracking-tight text-text-primary">
            <ShieldCheck className="h-5 w-5 text-brand" strokeWidth={1.6} />
            Data-rights requests
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Access, erasure, portability and the rest — each with a statutory deadline. Soonest
            deadline first.
          </p>
        </div>
        <button
          onClick={() => page.refetch()}
          className="flex items-center gap-2 self-start rounded-card border-thin border-border-subtle px-3 py-2 text-xs font-bold text-text-secondary hover:text-brand"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${page.isFetching ? 'animate-spin' : ''}`}
            strokeWidth={1.6}
          />
          Refresh
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <Chip active={status === undefined} onClick={() => pick(undefined)}>
          All
        </Chip>
        {(Object.values(DataRightsStatus) as DataRightsStatusValue[]).map((value) => (
          <Chip key={value} active={status === value} onClick={() => pick(value)}>
            {DATA_RIGHTS_STATUS_LABEL[value]}
          </Chip>
        ))}
      </div>

      {!!breaching && (
        <div className="flex items-start gap-3 rounded-frame border-thin border-rose-400/25 bg-rose-400/5 p-3.5">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" strokeWidth={1.6} />
          <p className="text-sm text-text-secondary">
            {breaching} outstanding {breaching === 1 ? 'request is' : 'requests are'} within three
            days of the statutory deadline.
          </p>
        </div>
      )}

      {page.isError && (
        <div className="flex items-start gap-3 rounded-frame border-thin border-rose-400/25 bg-rose-400/5 p-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" strokeWidth={1.6} />
          <p className="text-sm text-text-secondary">{(page.error as Error).message}</p>
        </div>
      )}

      {page.isLoading ? (
        <div className="flex items-center gap-3 rounded-frame border-thin border-border-subtle bg-bg-card p-8 text-sm text-text-muted">
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.6} />
          Loading requests…
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="rounded-frame border-thin border-border-subtle bg-bg-card p-10 text-center">
          <ShieldCheck className="mx-auto h-7 w-7 text-text-muted" strokeWidth={1.6} />
          <p className="mt-3 text-sm text-text-secondary">
            {status
              ? `No ${DATA_RIGHTS_STATUS_LABEL[status].toLowerCase()} requests.`
              : 'No data-rights requests have been raised.'}
          </p>
        </div>
      ) : (
        <>
          <p className="text-xs text-text-muted">
            {data.totalCount} {data.totalCount === 1 ? 'request' : 'requests'}
          </p>
          <div className="space-y-2">
            {data.items.map((request) => (
              <RequestRow key={request.id} request={request} onChanged={refresh} />
            ))}
          </div>
          <div className="flex items-center justify-center gap-2">
            <button
              disabled={skip === 0 || page.isFetching}
              onClick={() => setSkip(Math.max(0, skip - PAGE_SIZE))}
              className="flex items-center gap-1 rounded-sm border-thin border-border-medium px-3 py-1.5 text-xs font-bold text-text-secondary hover:bg-glass-2 hover:text-text-primary disabled:opacity-30"
            >
              <ChevronLeft className="h-3.5 w-3.5" strokeWidth={1.6} /> Previous
            </button>
            <button
              disabled={skip + PAGE_SIZE >= data.totalCount || page.isFetching}
              onClick={() => setSkip(skip + PAGE_SIZE)}
              className="flex items-center gap-1 rounded-sm border-thin border-border-medium px-3 py-1.5 text-xs font-bold text-text-secondary hover:bg-glass-2 hover:text-text-primary disabled:opacity-30"
            >
              Next <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.6} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-sm border-thin px-3 py-1.5 text-xs font-bold ${
        active
          ? 'border-border-glow bg-brand-soft text-brand'
          : 'border-border-subtle text-text-secondary hover:bg-glass-2 hover:text-text-primary'
      }`}
    >
      {children}
    </button>
  );
}

function DueBadge({ dueAtUtc, status }: { dueAtUtc: string; status: number }) {
  if (!isOutstanding(status)) return null;
  const days = daysUntilDue(dueAtUtc);
  const overdue = days < 0;
  const urgent = days >= 0 && days <= 3;
  return (
    <span
      className={`rounded-xs border-thin px-1.5 py-0.5 text-[10px] font-bold ${
        overdue
          ? 'border-rose-400/30 bg-rose-400/10 text-rose-300'
          : urgent
            ? 'border-amber-400/30 bg-amber-400/10 text-amber-300'
            : 'border-border-subtle bg-glass-2 text-text-muted'
      }`}
    >
      {overdue
        ? `${Math.abs(days)}d overdue`
        : days === 0
          ? 'due today'
          : `${days}d left`}
    </span>
  );
}

function RequestRow({
  request,
  onChanged,
}: {
  request: DataRightsRequest;
  onChanged: () => void;
}) {
  const [rejecting, setRejecting] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [reason, setReason] = useState('');
  const [reference, setReference] = useState('');
  const [error, setError] = useState<string | null>(null);

  const done = () => {
    setRejecting(false);
    setCompleting(false);
    setReason('');
    setReference('');
    setError(null);
    onChanged();
  };

  const act = useMutation({
    mutationFn: async (kind: 'verify' | 'start' | 'complete' | 'reject') => {
      if (kind === 'verify') await stylemintPrivacyApi.verifyIdentity(request.id);
      else if (kind === 'start') await stylemintPrivacyApi.start(request.id);
      else if (kind === 'complete')
        await stylemintPrivacyApi.complete(request.id, reference.trim());
      else await stylemintPrivacyApi.reject(request.id, reason.trim());
    },
    onSuccess: done,
    onError: (caught: unknown) =>
      setError(caught instanceof Error ? caught.message : 'The request could not be updated.'),
  });

  // Each decision belongs to one point in the lifecycle; offering the others would only produce
  // a rejected state transition from the domain.
  const canVerify = request.status === DataRightsStatus.Submitted;
  const canStart = request.status === DataRightsStatus.IdentityVerified;
  const canComplete = request.status === DataRightsStatus.InProgress;
  const canReject = isOutstanding(request.status);

  return (
    <div className="rounded-card border-thin border-border-subtle bg-glass-1 p-3.5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-xs border-thin px-1.5 py-0.5 text-[10px] font-bold ${
                STATUS_TONE[request.status] ?? STATUS_TONE[1]
              }`}
            >
              {DATA_RIGHTS_STATUS_LABEL[request.status] ?? request.status}
            </span>
            <span className="text-sm font-bold text-text-primary">
              {DATA_RIGHTS_TYPE_LABEL[request.requestType] ?? 'Request'}
            </span>
            <DueBadge dueAtUtc={request.dueAtUtc} status={request.status} />
          </div>

          {request.description && (
            <p className="mt-1 text-xs text-text-secondary">{request.description}</p>
          )}
          <p className="mt-1 font-mono text-[11px] text-text-muted">
            account {request.accountId}
          </p>
          <p className="mt-0.5 text-[11px] text-text-muted">
            Submitted {new Date(request.submittedUtc).toLocaleDateString()} · due{' '}
            {new Date(request.dueAtUtc).toLocaleDateString()}
            {request.fulfilmentReference && ` · ref ${request.fulfilmentReference}`}
          </p>
          {request.rejectionReason && (
            <p className="mt-1 text-xs text-rose-300">Rejected — {request.rejectionReason}</p>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-1.5">
          {canVerify && (
            <Action onClick={() => act.mutate('verify')} pending={act.isPending} primary>
              <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.6} /> Verify identity
            </Action>
          )}
          {canStart && (
            <Action onClick={() => act.mutate('start')} pending={act.isPending} primary>
              Start
            </Action>
          )}
          {canComplete && (
            <Action onClick={() => { setCompleting(true); setError(null); }} pending={false} primary>
              <Check className="h-3.5 w-3.5" strokeWidth={1.6} /> Complete
            </Action>
          )}
          {canReject && (
            <Action onClick={() => { setRejecting(true); setError(null); }} pending={false}>
              <X className="h-3.5 w-3.5" strokeWidth={1.6} /> Reject
            </Action>
          )}
        </div>
      </div>

      {(rejecting || completing) && (
        <div className="mt-3 rounded-sm border-thin border-border-glow bg-brand-soft p-3">
          <p className="text-xs font-bold text-text-primary">
            {completing ? 'Complete this request' : 'Reject this request'}
          </p>
          <p className="mt-0.5 text-[11px] text-text-muted">
            {completing
              ? 'A fulfilment reference is optional but is what links this to the export or deletion you ran.'
              : 'The reason goes on the record — a legal hold, for example — and is visible in the audit trail.'}
          </p>
          <input
            value={completing ? reference : reason}
            onChange={(e) => (completing ? setReference(e.target.value) : setReason(e.target.value))}
            placeholder={completing ? 'Fulfilment reference (optional)' : 'Reason'}
            className="mt-2 w-full rounded-sm border-thin border-border-subtle bg-bg-input px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:border-border-glow focus:outline-none"
          />
          {error && <p className="mt-2 text-xs text-rose-300">{error}</p>}
          <div className="mt-2 flex items-center gap-2">
            <button
              disabled={act.isPending || (rejecting && !reason.trim())}
              onClick={() => act.mutate(completing ? 'complete' : 'reject')}
              className="flex items-center gap-1.5 rounded-sm bg-brand px-3 py-1.5 text-xs font-bold text-bg hover:bg-brand-light disabled:opacity-40"
            >
              {act.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.6} />}
              Confirm
            </button>
            <button
              onClick={done}
              className="rounded-sm border-thin border-border-medium px-3 py-1.5 text-xs font-bold text-text-secondary hover:bg-glass-2 hover:text-text-primary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && !rejecting && !completing && (
        <p className="mt-2 text-xs text-rose-300">{error}</p>
      )}
    </div>
  );
}

function Action({
  onClick,
  pending,
  primary,
  children,
}: {
  onClick: () => void;
  pending: boolean;
  primary?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      disabled={pending}
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-xs font-bold disabled:opacity-40 ${
        primary
          ? 'bg-brand text-bg hover:bg-brand-light'
          : 'border-thin border-border-medium text-text-secondary hover:bg-glass-2 hover:text-text-primary'
      }`}
    >
      {children}
    </button>
  );
}

export { PrivacyRequestsPage as Component };
