// ═══════════════════════════════════════════════════════════════
// TransactionDetailDialog — Full transaction view with status controls
// ═══════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react';
import {
  X,
  Check,
  Ban,
  Loader2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  MessageSquare,
  User,
  ChefHat,
  PackageCheck,
  Send,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import {
  useTransaction,
  useUpdateTransactionStatus,
  useNotifyTransaction,
} from '../api/business-catalog.queries';
import {
  TRANSACTION_STATUS_LABEL,
  TransactionStatus,
  type TransactionStatusValue,
} from '../types/business-catalog.types';

interface Props {
  transactionId: string;
  onClose: () => void;
}

export function TransactionDetailDialog({ transactionId, onClose }: Props) {
  const { data, isLoading } = useTransaction(transactionId);
  const statusMutation = useUpdateTransactionStatus();
  const notifyMutation = useNotifyTransaction();
  const [note, setNote] = useState('');

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [onClose]);

  const tx = data as any;

  const setStatus = (status: TransactionStatusValue) => {
    statusMutation.mutate(
      {
        id: transactionId,
        data: { status, statusNote: note.trim() || null },
      },
      {
        onSuccess: () => setNote(''),
      },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-xl mx-4 rounded-frame bg-bg-shell border border-border-subtle
                      overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
          <div>
            <h2 className="text-sm font-bold text-text-primary tracking-tight">
              {tx?.externalId ?? 'Loading…'}
            </h2>
            {tx && (
              <p className="text-[10px] text-text-muted mt-0.5">
                {tx.transactionType} · {tx.source} ·{' '}
                {format(new Date(tx.createdAt), 'MMM d, yyyy · HH:mm')}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-sm flex items-center justify-center
                       hover:bg-glass-2 transition-colors"
          >
            <X className="w-4 h-4 text-text-muted" />
          </button>
        </div>

        {isLoading || !tx ? (
          <div className="px-6 py-12 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 text-text-muted animate-spin" />
            <span className="text-xs text-text-muted">Loading…</span>
          </div>
        ) : (
          <>
            <div className="px-5 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
              {/* Status row */}
              <div className="flex items-center gap-3">
                <StatusPill status={tx.status} />
                {tx.statusChangedAt && (
                  <span className="text-[10px] text-text-muted">
                    Changed {format(new Date(tx.statusChangedAt), 'MMM d HH:mm')}
                  </span>
                )}
                {tx.statusNote && (
                  <span className="text-[11px] text-text-muted italic">"{tx.statusNote}"</span>
                )}
                {tx.lastNotifiedAt && (
                  <span className="flex items-center gap-1 text-[10px] text-text-muted">
                    <Send className="w-3 h-3" strokeWidth={2} />
                    Notified {formatDistanceToNow(new Date(tx.lastNotifiedAt), { addSuffix: true })}
                  </span>
                )}
              </div>

              {/* Customer block */}
              <div className="rounded-xl bg-glass-2 border border-border-subtle p-3 space-y-1.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                  Customer
                </div>
                <Row icon={<User className="w-3.5 h-3.5" />} value={tx.customerContact?.name ?? '—'} />
                {tx.customerContact?.phone && (
                  <Row icon={<Phone className="w-3.5 h-3.5" />} value={tx.customerContact.phone} />
                )}
                {tx.customerContact?.email && (
                  <Row icon={<Mail className="w-3.5 h-3.5" />} value={tx.customerContact.email} />
                )}
                {tx.customerContact?.address && (
                  <Row icon={<MapPin className="w-3.5 h-3.5" />} value={tx.customerContact.address} />
                )}
                {tx.customerContact?.channelHandle && (
                  <Row
                    icon={<MessageSquare className="w-3.5 h-3.5" />}
                    value={tx.customerContact.channelHandle}
                  />
                )}
              </div>

              {/* Timing block (if any) */}
              {(tx.requestedAt || tx.requestedUntil) && (
                <div className="rounded-xl bg-glass-2 border border-border-subtle p-3 space-y-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                    Requested timing
                  </div>
                  {tx.requestedAt && (
                    <Row
                      icon={
                        tx.requestedUntil ? (
                          <Calendar className="w-3.5 h-3.5" />
                        ) : (
                          <Clock className="w-3.5 h-3.5" />
                        )
                      }
                      value={
                        tx.requestedUntil
                          ? `${format(new Date(tx.requestedAt), 'MMM d')} → ${format(new Date(tx.requestedUntil), 'MMM d, yyyy')}`
                          : format(new Date(tx.requestedAt), 'MMM d, yyyy · HH:mm')
                      }
                    />
                  )}
                </div>
              )}

              {/* Items */}
              <div className="rounded-xl bg-glass-2 border border-border-subtle p-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2">
                  Items
                </div>
                <div className="space-y-1.5">
                  {tx.items?.map((line: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-text-primary truncate">{line.name}</div>
                        {line.notes && <div className="text-text-muted truncate">{line.notes}</div>}
                      </div>
                      <div className="text-text-secondary whitespace-nowrap pl-3">
                        ×{line.quantity}
                        {line.unitPrice != null &&
                          ` · ${line.currency ?? tx.currency} ${line.unitPrice.toFixed(2)}`}
                      </div>
                    </div>
                  ))}
                </div>
                {tx.totalAmount != null && (
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-border-subtle">
                    <span className="text-xs font-bold text-text-secondary">Total</span>
                    <span className="text-sm font-extrabold text-text-primary">
                      {tx.currency} {tx.totalAmount.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              {/* Customer notes */}
              {tx.customerNotes && (
                <div className="rounded-xl bg-glass-2 border border-border-subtle p-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1.5">
                    Customer notes
                  </div>
                  <p className="text-xs text-text-primary whitespace-pre-wrap">{tx.customerNotes}</p>
                </div>
              )}

              {/* Status note input */}
              {tx.status === TransactionStatus.Pending && (
                <div>
                  <label className="block text-[11px] font-bold text-text-secondary mb-1">
                    Internal note (optional)
                  </label>
                  <textarea
                    value={note}
                    rows={2}
                    placeholder="e.g. 'Called customer, confirmed for Friday.'"
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full rounded-lg px-3 py-2 text-xs bg-glass-2 border border-border-subtle
                               text-text-primary placeholder:text-text-muted
                               focus:outline-none focus:border-brand transition-colors resize-none"
                  />
                </div>
              )}
            </div>

            {/* Action bar */}
            {tx.status === TransactionStatus.Pending && (
              <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border-subtle">
                <button
                  type="button"
                  disabled={statusMutation.isPending}
                  onClick={() => setStatus(TransactionStatus.Cancelled)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold
                             border border-border-medium text-text-secondary
                             hover:bg-danger-soft hover:text-danger hover:border-danger
                             disabled:opacity-50 transition-all"
                >
                  <Ban className="w-3.5 h-3.5" strokeWidth={2} /> Cancel
                </button>
                <button
                  type="button"
                  disabled={statusMutation.isPending}
                  onClick={() => setStatus(TransactionStatus.Confirmed)}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold
                             bg-success text-white hover:bg-success/90 disabled:opacity-50 transition-all"
                >
                  {statusMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                  )}
                  Confirm &amp; notify customer
                </button>
              </div>
            )}

            {tx.status === TransactionStatus.Confirmed && (
              <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border-subtle">
                <button
                  type="button"
                  disabled={notifyMutation.isPending}
                  onClick={() => notifyMutation.mutate({ id: transactionId, data: {} })}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold
                             border border-border-medium text-text-secondary
                             hover:bg-glass-2 hover:text-text-primary
                             disabled:opacity-50 transition-all"
                >
                  <Send className="w-3.5 h-3.5" strokeWidth={2} /> Resend confirmation
                </button>
                <button
                  type="button"
                  disabled={statusMutation.isPending}
                  onClick={() => setStatus(TransactionStatus.Preparing)}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold
                             bg-info text-white hover:bg-info/90 disabled:opacity-50 transition-all"
                >
                  {statusMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ChefHat className="w-3.5 h-3.5" strokeWidth={2} />
                  )}
                  Mark as preparing &amp; notify
                </button>
              </div>
            )}

            {tx.status === TransactionStatus.Preparing && (
              <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border-subtle">
                <button
                  type="button"
                  disabled={notifyMutation.isPending}
                  onClick={() => notifyMutation.mutate({ id: transactionId, data: {} })}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold
                             border border-border-medium text-text-secondary
                             hover:bg-glass-2 hover:text-text-primary
                             disabled:opacity-50 transition-all"
                >
                  <Send className="w-3.5 h-3.5" strokeWidth={2} /> Resend "preparing" update
                </button>
                <button
                  type="button"
                  disabled={statusMutation.isPending}
                  onClick={() => setStatus(TransactionStatus.ReadyForPickup)}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold
                             bg-brand text-white hover:bg-brand/90 disabled:opacity-50 transition-all"
                >
                  {statusMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <PackageCheck className="w-3.5 h-3.5" strokeWidth={2} />
                  )}
                  Mark ready for pickup &amp; notify
                </button>
              </div>
            )}

            {tx.status === TransactionStatus.ReadyForPickup && (
              <div className="flex items-center justify-between gap-2 px-5 py-3 border-t border-border-subtle">
                <span className="flex items-center gap-1.5 text-xs font-bold text-brand">
                  <PackageCheck className="w-3.5 h-3.5" strokeWidth={2} /> Ready — awaiting pickup
                </span>
                <button
                  type="button"
                  disabled={notifyMutation.isPending}
                  onClick={() => notifyMutation.mutate({ id: transactionId, data: {} })}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold
                             border border-border-medium text-text-secondary
                             hover:bg-glass-2 hover:text-text-primary
                             disabled:opacity-50 transition-all"
                >
                  {notifyMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" strokeWidth={2} />
                  )}
                  Resend "ready for pickup"
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Row({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-text-primary">
      <span className="text-text-muted">{icon}</span>
      <span className="truncate">{value}</span>
    </div>
  );
}

function StatusPill({ status }: { status: TransactionStatusValue }) {
  const bg =
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
    <span className={`text-[10px] font-extrabold uppercase px-2 py-1 rounded-md ${bg}`}>
      {TRANSACTION_STATUS_LABEL[status]}
    </span>
  );
}
