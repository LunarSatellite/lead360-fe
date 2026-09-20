import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  LifeBuoy,
  Loader2,
  RefreshCw,
  Send,
  ShoppingBag,
  Stethoscope,
} from 'lucide-react';
import {
  stylemintSupportApi,
  TICKET_CATEGORY_LABEL,
  TICKET_STATE_LABEL,
  TicketInternalState,
  type CommerceTicketSummary,
} from '@/features/commerce-control/api/stylemint-support.api';
import { Component as CrmSupportCases } from '@/features/crm/pages/CrmSupportPage';
import { CareThemesPanel } from '@/features/commerce-control/components/CareThemesPanel';

type Queue = 'commerce' | 'crm' | 'themes';

/**
 * One support entry point.
 *
 * Operators previously had a CRM case queue and nothing else — commerce support tickets had no
 * agent surface at all, so a shopper could raise one and nobody could answer it. The backend queue
 * now exists; this puts it beside the CRM queue instead of behind the generic operations console.
 *
 * The two queues stay separate systems on purpose. Commerce tickets hang off an order, a return or
 * a courier context and carry their own state machine and events; CRM cases come from sales and
 * account management. Copying either into the other would mean two records of one conversation and
 * replies landing in the wrong place. What the operator needed was one place to look, not one
 * database.
 *
 * The CRM queue is the existing page component rendered as a tab — reused, not reimplemented.
 */
export function SupportPage() {
  const [queue, setQueue] = useState<Queue>('commerce');

  return (
    <div className="mx-auto max-w-[1500px] space-y-5">
      <div>
        <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-brand">
          Customer support
        </p>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-text-primary">Support</h1>
        <p className="mt-1 text-sm text-text-muted">
          Commerce tickets raised in the app, and CRM cases from sales and account management.
        </p>
      </div>

      <div className="flex gap-1 rounded-card border-thin border-border-subtle bg-bg-card p-1">
        <QueueTab
          active={queue === 'commerce'}
          onClick={() => setQueue('commerce')}
          icon={ShoppingBag}
          label="Commerce tickets"
        />
        <QueueTab
          active={queue === 'crm'}
          onClick={() => setQueue('crm')}
          icon={LifeBuoy}
          label="CRM cases"
        />
        <QueueTab
          active={queue === 'themes'}
          onClick={() => setQueue('themes')}
          icon={Stethoscope}
          label="Order-care themes"
        />
      </div>

      {queue === 'commerce' && <CommerceQueue />}
      {queue === 'crm' && <CrmSupportCases />}
      {queue === 'themes' && <CareThemesPanel />}
    </div>
  );
}

function QueueTab({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof ShoppingBag;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-2 rounded-sm px-4 py-2 text-xs font-bold transition ${
        active
          ? 'bg-brand-soft text-brand'
          : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
      }`}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={1.6} />
      {label}
    </button>
  );
}

const OPEN_STATES = [TicketInternalState.Submitted, TicketInternalState.InProgress];
const ALL_STATES = [
  TicketInternalState.Submitted,
  TicketInternalState.InProgress,
  TicketInternalState.WaitingOnUser,
  TicketInternalState.Resolved,
  TicketInternalState.Closed,
];

function CommerceQueue() {
  const client = useQueryClient();
  const [showAll, setShowAll] = useState(false);
  const [selected, setSelected] = useState<CommerceTicketSummary | null>(null);

  const queue = useQuery({
    queryKey: ['stylemint-support-queue', showAll],
    queryFn: () => stylemintSupportApi.queue({ states: showAll ? ALL_STATES : OPEN_STATES }),
  });

  const refresh = () => {
    client.invalidateQueries({ queryKey: ['stylemint-support-queue'] });
    client.invalidateQueries({ queryKey: ['stylemint-support-ticket'] });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs font-bold text-text-secondary">
          {queue.data
            ? `${queue.data.totalCount.toLocaleString()} ${showAll ? 'ticket' : 'open ticket'}${
                queue.data.totalCount === 1 ? '' : 's'
              }`
            : 'Loading…'}
        </span>
        <label className="flex items-center gap-2 text-xs font-bold text-text-secondary">
          <input
            type="checkbox"
            checked={showAll}
            onChange={(event) => setShowAll(event.target.checked)}
            className="accent-brand"
          />
          Include resolved and closed
        </label>
        <button
          onClick={refresh}
          className="ml-auto flex items-center gap-2 rounded-card border-thin border-border-subtle px-3 py-2 text-xs font-bold text-text-secondary hover:text-brand"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${queue.isFetching ? 'animate-spin' : ''}`}
            strokeWidth={1.6}
          />
          Refresh
        </button>
      </div>

      {queue.isError && (
        <div className="flex items-start gap-3 rounded-frame border-thin border-rose-400/25 bg-rose-400/5 p-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" strokeWidth={1.6} />
          <p className="text-sm text-text-secondary">{(queue.error as Error).message}</p>
        </div>
      )}

      {queue.isLoading ? (
        <div className="flex items-center gap-3 rounded-frame border-thin border-border-subtle bg-bg-card p-8 text-sm text-text-muted">
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.6} /> Loading the commerce queue…
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="overflow-hidden rounded-frame border-thin border-border-subtle bg-bg-card">
            {(queue.data?.items ?? []).map((ticket) => (
              <button
                key={ticket.id}
                onClick={() => setSelected(ticket)}
                className={`flex w-full items-center gap-3 border-b border-border-subtle px-4 py-3 text-left last:border-b-0 hover:bg-bg-elevated ${
                  selected?.id === ticket.id ? 'bg-brand-soft' : ''
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-text-primary">{ticket.subject}</p>
                  <p className="mt-0.5 text-[11px] text-text-muted">
                    <span className="font-mono">{ticket.ticketNumber}</span>
                    {' · '}
                    {TICKET_CATEGORY_LABEL[ticket.category] ?? `Category ${ticket.category}`}
                    {' · '}
                    {new Date(ticket.openedUtc).toLocaleDateString()}
                  </p>
                </div>
                <StateBadge state={ticket.state} />
              </button>
            ))}

            {(queue.data?.items.length ?? 0) === 0 && !queue.isError && (
              <div className="p-10 text-center">
                <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-300" strokeWidth={1.6} />
                <p className="mt-3 text-sm font-bold text-text-primary">Nothing waiting</p>
                <p className="mt-1 text-xs text-text-muted">
                  No commerce tickets need an agent right now.
                </p>
              </div>
            )}
          </div>

          <TicketDetail ticket={selected} onChanged={refresh} />
        </div>
      )}
    </div>
  );
}

function StateBadge({ state }: { state: number }) {
  const tone =
    state === 3
      ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300'
      : state === 2
        ? 'border-amber-400/25 bg-amber-400/10 text-amber-300'
        : 'border-sky-400/25 bg-sky-400/10 text-sky-300';

  return (
    <span className={`shrink-0 rounded-sm border-thin px-2 py-0.5 text-[10px] font-black ${tone}`}>
      {TICKET_STATE_LABEL[state] ?? `State ${state}`}
    </span>
  );
}

function TicketDetail({
  ticket,
  onChanged,
}: {
  ticket: CommerceTicketSummary | null;
  onChanged: () => void;
}) {
  const [reply, setReply] = useState('');
  const [error, setError] = useState<string | null>(null);

  const detail = useQuery({
    queryKey: ['stylemint-support-ticket', ticket?.ticketNumber],
    queryFn: () => stylemintSupportApi.get(ticket!.ticketNumber),
    enabled: !!ticket,
  });

  const act = useMutation({
    mutationFn: (action: 'reply' | 'waiting' | 'resolve') => {
      const number = ticket!.ticketNumber;
      if (action === 'reply') return stylemintSupportApi.reply(number, reply);
      if (action === 'waiting') return stylemintSupportApi.markWaitingOnUser(number);
      return stylemintSupportApi.resolve(number, reply || undefined);
    },
    onSuccess: () => {
      setReply('');
      setError(null);
      onChanged();
    },
    onError: (caught: unknown) =>
      setError(caught instanceof Error ? caught.message : 'The action could not be completed.'),
  });

  if (!ticket) {
    return (
      <div className="rounded-frame border-thin border-border-subtle bg-bg-card p-8 text-center">
        <LifeBuoy className="mx-auto h-8 w-8 text-text-muted" strokeWidth={1.6} />
        <p className="mt-3 text-sm text-text-muted">Pick a ticket to read and answer it.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-frame border-thin border-border-subtle bg-bg-card p-4">
      <div>
        <p className="text-sm font-bold text-text-primary">{ticket.subject}</p>
        <p className="mt-0.5 font-mono text-[11px] text-text-muted">{ticket.ticketNumber}</p>
      </div>

      {detail.isLoading ? (
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.6} /> Loading the thread…
        </div>
      ) : (
        <div className="max-h-64 space-y-2 overflow-y-auto">
          {(detail.data?.messages ?? []).map((message) => (
            <div key={message.id} className="rounded-card border-thin border-border-subtle bg-bg-elevated p-2.5">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-text-muted">
                {String(message.authorKind)} · {new Date(message.postedUtc).toLocaleString()}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-xs text-text-secondary">{message.body}</p>
            </div>
          ))}
          {(detail.data?.messages?.length ?? 0) === 0 && (
            <p className="text-xs text-text-muted">No messages on this thread yet.</p>
          )}
        </div>
      )}

      <textarea
        value={reply}
        onChange={(event) => setReply(event.target.value)}
        rows={4}
        placeholder="Write a reply to the customer…"
        className="w-full rounded-card border-thin border-border-subtle bg-bg-elevated px-3 py-2 text-xs text-text-primary outline-none focus:border-border-glow"
      />

      {error && (
        <div className="flex items-start gap-2 rounded-card border-thin border-rose-400/25 bg-rose-400/5 p-2.5">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-300" strokeWidth={1.6} />
          <p className="text-xs text-text-secondary">{error}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => act.mutate('reply')}
          disabled={act.isPending || !reply.trim()}
          className="flex items-center gap-1.5 rounded-card bg-brand px-3 py-2 text-xs font-bold text-bg hover:bg-brand-light disabled:opacity-40"
        >
          {act.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.6} />
          ) : (
            <Send className="h-3.5 w-3.5" strokeWidth={1.6} />
          )}
          Reply
        </button>
        <button
          onClick={() => act.mutate('waiting')}
          disabled={act.isPending}
          className="flex items-center gap-1.5 rounded-card border-thin border-border-medium px-3 py-2 text-xs font-bold text-text-secondary hover:text-text-primary disabled:opacity-40"
        >
          <Clock className="h-3.5 w-3.5" strokeWidth={1.6} /> Waiting on customer
        </button>
        <button
          onClick={() => act.mutate('resolve')}
          disabled={act.isPending}
          className="flex items-center gap-1.5 rounded-card border-thin border-emerald-400/25 px-3 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-400/10 disabled:opacity-40"
        >
          <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.6} /> Resolve
        </button>
      </div>
      <p className="text-[10px] text-text-muted">
        A reply is sent to the customer and moves the ticket to in progress. Resolving uses the box
        above as the resolution summary when it has text.
      </p>
    </div>
  );
}

export { SupportPage as Component };
