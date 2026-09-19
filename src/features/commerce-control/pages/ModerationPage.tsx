import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, Flag, Loader2, RefreshCw, ShieldAlert } from 'lucide-react';
import {
  ACTION_LABEL,
  ACTION_SEVERITY,
  ItemState,
  ModerationAction,
  ModerationSource,
  SOURCE_LABEL,
  STATE_LABEL,
  TARGET_KIND_LABEL,
  TargetKind,
  stylemintModerationApi,
  type ModerationActionValue,
  type ModerationItem,
} from '../api/stylemint-moderation.api';

/**
 * Content moderation — reported reels, reviews, comments, profiles and recommendation replies.
 *
 * Decisions here range from hiding one post to banning its author, so the page separates those
 * two things visually and makes the author-affecting ones take a deliberate second step. The
 * default filter is Open, because a moderation queue is a backlog, not an archive.
 */
export function ModerationPage() {
  const client = useQueryClient();
  const [targetKind, setTargetKind] = useState<number | undefined>(undefined);
  const [state, setState] = useState<number | undefined>(ItemState.Open);
  const [source, setSource] = useState<number | undefined>(undefined);
  const [selected, setSelected] = useState<ModerationItem | null>(null);

  const queue = useQuery({
    queryKey: ['stylemint-moderation-queue', targetKind, state, source],
    queryFn: () => stylemintModerationApi.queue({ targetKind, state, source, pageSize: 50 }),
  });

  const refresh = () => client.invalidateQueries({ queryKey: ['stylemint-moderation-queue'] });

  return (
    <div className="mx-auto max-w-[1500px] space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-brand">
            Stylemint commerce platform
          </p>
          <h1 className="mt-2 flex items-center gap-2 text-2xl font-black tracking-tight text-text-primary">
            <ShieldAlert className="h-5 w-5 text-brand" strokeWidth={1.6} />
            Moderation
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Reported content awaiting a decision, oldest report first.
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

      <div className="flex flex-wrap items-center gap-3 rounded-frame border-thin border-border-subtle bg-bg-card p-3">
        <Select label="Content" value={targetKind} onChange={setTargetKind}
          options={[
            { value: undefined, label: 'Anything' },
            { value: TargetKind.Reel, label: 'Reels' },
            { value: TargetKind.Review, label: 'Reviews' },
            { value: TargetKind.ReelComment, label: 'Comments' },
            { value: TargetKind.Profile, label: 'Profiles' },
            { value: TargetKind.RecommendationReply, label: 'Recommendation replies' },
          ]}
        />
        <Select label="State" value={state} onChange={setState}
          options={[
            { value: undefined, label: 'Any' },
            { value: ItemState.Open, label: 'Open' },
            { value: ItemState.InReview, label: 'In review' },
            { value: ItemState.Decided, label: 'Decided' },
          ]}
        />
        <Select label="Source" value={source} onChange={setSource}
          options={[
            { value: undefined, label: 'Any' },
            { value: ModerationSource.UserReport, label: 'User reports' },
            { value: ModerationSource.AutomatedScanner, label: 'Scanner' },
            { value: ModerationSource.AdminSpot, label: 'Admin' },
          ]}
        />
        <span className="ml-auto text-xs font-bold text-text-muted">
          {queue.data ? `${queue.data.totalCount.toLocaleString()} item(s)` : 'Loading…'}
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
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.6} /> Loading the queue…
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_400px]">
          <div className="overflow-hidden rounded-frame border-thin border-border-subtle bg-bg-card">
            {(queue.data?.items ?? []).map((item) => (
              <button
                key={item.id}
                onClick={() => setSelected(item)}
                className={`flex w-full items-center gap-3 border-b border-border-subtle px-4 py-3 text-left last:border-b-0 hover:bg-bg-elevated ${
                  selected?.id === item.id ? 'bg-brand-soft' : ''
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-text-primary">
                    {TARGET_KIND_LABEL[item.targetKind] ?? 'Content'}
                    {item.reportReasonCode ? ` — ${item.reportReasonCode}` : ''}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] text-text-muted">
                    <span className="font-mono">{item.targetId.slice(0, 8)}</span>
                    {' · '}
                    {SOURCE_LABEL[item.source] ?? 'Reported'}
                    {' · '}
                    {new Date(item.submittedUtc).toLocaleDateString()}
                  </p>
                </div>
                <span className="shrink-0 rounded-sm border-thin border-border-subtle px-2 py-0.5 text-[10px] font-black text-text-secondary">
                  {STATE_LABEL[item.state] ?? item.state}
                </span>
              </button>
            ))}
            {(queue.data?.items.length ?? 0) === 0 && !queue.isError && (
              <div className="p-10 text-center">
                <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-300" strokeWidth={1.6} />
                <p className="mt-3 text-sm font-bold text-text-primary">Queue is clear</p>
                <p className="mt-1 text-xs text-text-muted">Nothing matches these filters.</p>
              </div>
            )}
          </div>

          <DecisionPanel item={selected} onDecided={refresh} />
        </div>
      )}
    </div>
  );
}

function Select<T extends number | undefined>({
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

const CONTENT_ACTIONS: ModerationActionValue[] = [
  ModerationAction.NoAction,
  ModerationAction.HideContent,
  ModerationAction.RemoveContent,
];
const AUTHOR_ACTIONS: ModerationActionValue[] = [
  ModerationAction.WarnAuthor,
  ModerationAction.SuspendAuthor,
  ModerationAction.BanAuthor,
];

function DecisionPanel({
  item,
  onDecided,
}: {
  item: ModerationItem | null;
  onDecided: () => void;
}) {
  const [note, setNote] = useState('');
  const [pending, setPending] = useState<ModerationActionValue | null>(null);
  const [error, setError] = useState<string | null>(null);

  const decide = useMutation({
    mutationFn: (action: ModerationActionValue) =>
      stylemintModerationApi.decide(item!.id, action, note),
    onSuccess: () => {
      setNote('');
      setPending(null);
      setError(null);
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
        <Flag className="mx-auto h-8 w-8 text-text-muted" strokeWidth={1.6} />
        <p className="mt-3 text-sm text-text-muted">Pick a report to review and decide it.</p>
      </div>
    );
  }

  const decided = item.state === ItemState.Decided;

  return (
    <div className="space-y-3 rounded-frame border-thin border-border-subtle bg-bg-card p-4">
      <div>
        <p className="text-sm font-bold text-text-primary">
          {TARGET_KIND_LABEL[item.targetKind] ?? 'Content'}
        </p>
        <p className="mt-0.5 font-mono text-[11px] text-text-muted">{item.targetId}</p>
      </div>

      <dl className="space-y-1 text-[11px]">
        <Row label="Source" value={SOURCE_LABEL[item.source] ?? String(item.source)} />
        {item.reportReasonCode && <Row label="Reason" value={item.reportReasonCode} />}
        <Row label="Reported" value={new Date(item.submittedUtc).toLocaleString()} />
      </dl>

      {decided ? (
        <div className="rounded-card border-thin border-border-subtle bg-bg-elevated p-3">
          <p className="text-xs font-bold text-text-primary">
            {ACTION_LABEL[item.action ?? 0] ?? 'Decided'}
          </p>
          {item.decisionNote && (
            <p className="mt-1 text-xs text-text-secondary">{item.decisionNote}</p>
          )}
          <p className="mt-2 text-[10px] text-text-muted">
            Decided {item.decidedUtc ? new Date(item.decidedUtc).toLocaleString() : ''}.
          </p>
        </div>
      ) : (
        <>
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
                Record “{ACTION_LABEL[pending]}”?
              </p>
              {AUTHOR_ACTIONS.includes(pending) && (
                <p className="text-[10px] text-text-muted">
                  This affects the author's account, not just this post.
                </p>
              )}
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
            <div className="space-y-3">
              <ActionGroup
                title="This content"
                actions={CONTENT_ACTIONS}
                onPick={setPending}
              />
              <ActionGroup
                title="The author"
                actions={AUTHOR_ACTIONS}
                onPick={setPending}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Content actions and author actions are grouped separately because they are different
 * decisions: hiding a post is reversible housekeeping, banning its author is not.
 */
function ActionGroup({
  title,
  actions,
  onPick,
}: {
  title: string;
  actions: ModerationActionValue[];
  onPick: (action: ModerationActionValue) => void;
}) {
  return (
    <div>
      <p className="text-[10px] font-extrabold uppercase tracking-wider text-text-muted">{title}</p>
      <div className="mt-1.5 flex flex-wrap gap-2">
        {actions.map((action) => {
          const severity = ACTION_SEVERITY[action];
          const tone =
            severity === 'high'
              ? 'border-rose-400/25 text-rose-300 hover:bg-rose-400/10'
              : severity === 'medium'
                ? 'border-amber-400/25 text-amber-300 hover:bg-amber-400/10'
                : 'border-border-medium text-text-secondary hover:bg-bg-elevated';
          return (
            <button
              key={action}
              onClick={() => onPick(action)}
              className={`rounded-card border-thin px-3 py-2 text-xs font-bold ${tone}`}
            >
              {ACTION_LABEL[action]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-text-muted">{label}</dt>
      <dd className="text-text-secondary">{value}</dd>
    </div>
  );
}

export { ModerationPage as Component };
