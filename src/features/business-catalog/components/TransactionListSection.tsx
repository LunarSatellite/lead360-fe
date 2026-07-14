// ═══════════════════════════════════════════════════════════════
// TransactionListSection — Inbox of customer requests
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react';
import { Search, Loader2, Inbox, ChevronRight, ShoppingCart, Calendar } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { useTransactions } from '../api/business-catalog.queries';
import { TransactionDetailDialog } from './TransactionDetailDialog';
import {
  TRANSACTION_STATUS_LABEL,
  TransactionStatus,
  type TransactionStatusValue,
  type TransactionSummary,
} from '../types/business-catalog.types';

// Determines whether a transactionType string looks like a booking/service
function isServiceType(type: string): boolean {
  const t = type.toLowerCase();
  return t.includes('book') || t.includes('appointment') || t.includes('service') || t.includes('repair');
}

interface Props {
  transactionLabel: string;
}

export function TransactionListSection({ transactionLabel }: Props) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<TransactionStatusValue | null>(null);
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);

  const filter = {
    status,
    search: search.trim() || null,
    page,
    pageSize: 20,
  };
  const { data, isLoading } = useTransactions(filter);

  const items: TransactionSummary[] = ((data as any)?.items as TransactionSummary[]) ?? [];
  const total: number = ((data as any)?.totalCount as number) ?? 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-extrabold text-text-primary tracking-tight">
            {transactionLabel} inbox
          </h3>
          <p className="text-[11px] text-text-muted">
            {total} {transactionLabel.toLowerCase()}
            {total === 1 ? '' : 's'} captured
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-[180px] rounded-lg bg-glass-2
                        border border-border-subtle px-3 py-1.5">
          <Search className="w-3.5 h-3.5 text-text-muted" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search ID, customer name or phone…"
            className="bg-transparent text-xs text-text-primary placeholder:text-text-muted
                       focus:outline-none flex-1 min-w-0"
          />
        </div>
        <div className="flex items-center gap-1">
          {[
            { v: null, label: 'All' },
            { v: TransactionStatus.Pending as TransactionStatusValue, label: 'Pending' },
            { v: TransactionStatus.Confirmed as TransactionStatusValue, label: 'Confirmed' },
            { v: TransactionStatus.Preparing as TransactionStatusValue, label: 'Preparing' },
            { v: TransactionStatus.ReadyForPickup as TransactionStatusValue, label: 'Ready for Pickup' },
            { v: TransactionStatus.Cancelled as TransactionStatusValue, label: 'Cancelled' },
          ].map((opt) => {
            const selected = status === opt.v;
            return (
              <button
                key={opt.label}
                type="button"
                onClick={() => {
                  setStatus(opt.v);
                  setPage(1);
                }}
                className={[
                  'px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                  selected
                    ? 'bg-brand text-white'
                    : 'bg-glass-2 border border-border-subtle text-text-secondary hover:text-text-primary',
                ].join(' ')}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-2xl bg-glass-1 border border-border-subtle px-6 py-8 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 text-text-muted animate-spin" />
          <span className="text-xs text-text-muted">Loading…</span>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl bg-glass-1 border border-border-subtle px-6 py-10 text-center">
          <Inbox className="w-8 h-8 text-text-muted mx-auto mb-2" strokeWidth={1.5} />
          <div className="text-xs font-bold text-text-primary">
            {search || status !== null ? 'No matching requests' : 'No requests yet'}
          </div>
          <p className="text-[11px] text-text-muted mt-1">
            Requests will appear here when customers submit them through the bot.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl bg-glass-1 border border-border-subtle overflow-hidden">
          {items.map((t, idx) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setOpenId(t.id)}
              className={[
                'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-glass-2',
                idx < items.length - 1 && 'border-b border-border-subtle',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <StatusDot status={t.status} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-bold text-text-primary truncate">{t.externalId}</span>
                  <TypeBadge type={t.transactionType} />
                  <span className="text-[10px] text-text-muted">·</span>
                  <span className="text-[11px] text-text-secondary truncate">
                    {t.customerName ?? 'Unknown customer'}
                  </span>
                </div>
                <div className="text-[11px] text-text-muted truncate">
                  {t.itemCount} item{t.itemCount === 1 ? '' : 's'}
                  {t.totalAmount != null && ` · ${t.currency} ${t.totalAmount.toFixed(2)}`}
                  {t.requestedAt && ` · 🗓 ${format(new Date(t.requestedAt), 'd MMM, h:mm a')}`}
                  {' · '}
                  {formatDistanceToNow(new Date(t.createdAt), { addSuffix: true })}
                </div>
              </div>
              <StatusBadge status={t.status} />
              <ChevronRight className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
            </button>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > 20 && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-text-muted">
            Page {page} of {Math.max(1, Math.ceil(total / 20))}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1 rounded-lg bg-glass-2 border border-border-subtle
                         text-text-secondary hover:text-text-primary disabled:opacity-50 transition-colors"
            >
              Prev
            </button>
            <button
              type="button"
              disabled={page * 20 >= total}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 rounded-lg bg-glass-2 border border-border-subtle
                         text-text-secondary hover:text-text-primary disabled:opacity-50 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {openId && (
        <TransactionDetailDialog
          transactionId={openId}
          onClose={() => setOpenId(null)}
        />
      )}
    </div>
  );
}

function StatusDot({ status }: { status: TransactionStatusValue }) {
  const color =
    status === TransactionStatus.Confirmed
      ? 'bg-success'
      : status === TransactionStatus.Cancelled
        ? 'bg-danger'
        : status === TransactionStatus.Preparing
          ? 'bg-info'
          : status === TransactionStatus.ReadyForPickup
            ? 'bg-brand'
            : 'bg-warning';
  return <span className={`w-2 h-2 rounded-full ${color} flex-shrink-0`} />;
}

function TypeBadge({ type }: { type: string }) {
  const service = isServiceType(type);
  const Icon = service ? Calendar : ShoppingCart;
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold border flex-shrink-0
      ${service
        ? 'bg-info-soft text-info border-[rgba(59,130,246,0.2)]'
        : 'bg-success-soft text-success border-[rgba(6,214,160,0.2)]'
      }`}
    >
      <Icon className="w-2.5 h-2.5" strokeWidth={2} />
      {type}
    </span>
  );
}

function StatusBadge({ status }: { status: TransactionStatusValue }) {
  const cls =
    status === TransactionStatus.Confirmed
      ? 'bg-success-soft text-success'
      : status === TransactionStatus.Cancelled
        ? 'bg-danger-soft text-danger'
        : status === TransactionStatus.Preparing
          ? 'bg-info-soft text-info'
          : status === TransactionStatus.ReadyForPickup
            ? 'bg-brand-soft text-brand'
            : 'bg-warning-soft text-warning';
  return (
    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md whitespace-nowrap ${cls}`}>
      {TRANSACTION_STATUS_LABEL[status]}
    </span>
  );
}
