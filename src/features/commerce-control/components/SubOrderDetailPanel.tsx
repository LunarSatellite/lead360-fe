import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Loader2, MapPin, Sparkles } from 'lucide-react';
import {
  CANCELLATION_REASON_LABEL,
  stylemintSubOrdersApi,
  type SubOrderLine,
  type VendorSubOrderDetail,
} from '../api/stylemint-suborders.api';

/**
 * One sub-order in full, expanded from its row.
 *
 * Expanded rather than opened as a page or a dialog, because the question it answers is a
 * comparison — why is *this* one still sitting here when the rest moved — and that only reads
 * against the queue it came from. The packing slip takes the dialog, since that one is a document
 * you leave the queue to print.
 *
 * The lifecycle timestamps are the point. The row says an order is Packed; only these say it has
 * been Packed since Tuesday, which is the difference between a queue and a report.
 *
 * Fetched only when expanded, so the queue stays one request rather than one per row.
 */
export function SubOrderDetailPanel({ subOrderId }: { subOrderId: string }) {
  const detail = useQuery({
    queryKey: ['stylemint-sub-order-detail', subOrderId],
    queryFn: () => stylemintSubOrdersApi.detail(subOrderId),
    retry: false,
  });

  if (detail.isLoading) {
    return (
      <div className="mt-2.5 flex items-center gap-2 rounded-sm border-thin border-border-subtle bg-bg-input p-2.5 text-[11px] text-text-muted">
        <Loader2 className="h-3 w-3 animate-spin" strokeWidth={1.6} /> Loading…
      </div>
    );
  }

  if (detail.isError) {
    return (
      <div className="mt-2.5 flex items-start gap-2 rounded-sm border-thin border-rose-400/25 bg-rose-400/5 p-2.5">
        <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-rose-300" strokeWidth={1.6} />
        <p className="text-[11px] text-text-secondary">{describe(detail.error)}</p>
      </div>
    );
  }

  const order = detail.data!;

  return (
    <div className="mt-2.5 grid gap-2.5 rounded-sm border-thin border-border-subtle bg-bg-input p-3 lg:grid-cols-[1fr_1.2fr]">
      <div className="space-y-2.5">
        <Timeline order={order} />
        <Address order={order} />
      </div>
      <div className="space-y-2.5">
        <Lines order={order} />
        <Totals order={order} />
      </div>
    </div>
  );
}

/**
 * When each step happened, in order, with the gaps visible.
 *
 * Only the steps that actually happened are listed. Rendering the whole state machine with
 * "pending" against the rest would make every young order look stalled.
 */
function Timeline({ order }: { order: VendorSubOrderDetail }) {
  const steps: Array<[string, string | null | undefined]> = [
    ['Placed', order.placedUtc],
    ['Accepted', order.acceptedUtc],
    ['Packed', order.packedUtc],
    ['Handed over', order.handedOverUtc],
    ['Shipped', order.shippedUtc],
    ['In transit', order.inTransitUtc],
    ['Out for delivery', order.outForDeliveryUtc],
    ['Delivered', order.deliveredUtc],
    ['Cancelled', order.cancelledUtc],
  ];

  const happened = steps.filter(([, at]) => !!at) as Array<[string, string]>;
  const latest = happened[happened.length - 1];

  return (
    <div>
      <Heading>Timeline</Heading>
      <ol className="mt-1.5 space-y-1">
        {happened.map(([label, at], index) => {
          const previous = index > 0 ? happened[index - 1][1] : null;
          return (
            <li key={label} className="flex items-baseline justify-between gap-2 text-[11px]">
              <span className="text-text-secondary">{label}</span>
              <span className="text-right text-text-muted">
                {new Date(at).toLocaleString()}
                {previous && (
                  <span className="ml-1.5 text-text-muted/70">+{gap(previous, at)}</span>
                )}
              </span>
            </li>
          );
        })}
      </ol>

      {/* How long it has been sitting where it is — the reason to open this panel at all. */}
      {latest && !order.deliveredUtc && !order.cancelledUtc && (
        <p className="mt-1.5 text-[11px] text-amber-300">
          Waiting {gap(latest[1], new Date().toISOString())} since {latest[0].toLowerCase()}.
        </p>
      )}

      {order.cancelledUtc && <Cancellation order={order} />}
    </div>
  );
}

/**
 * Why a cancelled order was cancelled — or, honestly, where to go and find out.
 *
 * `cancellationReasonCode` is the CUSTOMER's reason. A vendor rejection sets it to null by
 * design and records its own reason on the status history and order_cancellations, neither of
 * which this payload carries. So a null here does not mean no reason was given, and saying "no
 * reason recorded" would be asserting an absence that is not true. The note IS carried either
 * way, and on a vendor rejection it is what the vendor actually typed.
 */
function Cancellation({ order }: { order: VendorSubOrderDetail }) {
  const customerReason =
    order.cancellationReasonCode != null
      ? (CANCELLATION_REASON_LABEL[order.cancellationReasonCode] ??
        `Reason ${order.cancellationReasonCode}`)
      : null;

  return (
    <div className="mt-1.5 text-[11px] text-rose-300">
      {customerReason ? (
        <p>Cancelled by the customer — {customerReason.toLowerCase()}</p>
      ) : (
        <p>
          Cancelled without a customer reason, which is how a vendor rejection records. The
          rejection code itself is on the order's cancellation record, not on this view.
        </p>
      )}
      {order.cancellationNote && (
        <p className="mt-0.5 text-text-secondary">{order.cancellationNote}</p>
      )}
    </div>
  );
}

function Address({ order }: { order: VendorSubOrderDetail }) {
  const address = order.shipTo;
  const note = address.locationNote?.trim();
  // Same rule as the packing slip: drop the typed line when it only repeats the note.
  const postal = [address.addressLine1, address.city, address.state, address.zipCode]
    .map((part) => part?.trim())
    .filter((part) => Boolean(part) && part !== note)
    .join(', ');

  return (
    <div>
      <Heading>Ship to</Heading>
      <p className="mt-1.5 text-[11px] font-bold text-text-primary">{address.receiverName}</p>
      <p className="text-[11px] text-text-secondary">{address.receiverPhone}</p>
      {note && <p className="mt-1 text-[11px] text-text-secondary">{note}</p>}
      {address.landmark && (
        <p className="text-[11px] text-text-muted">Landmark: {address.landmark}</p>
      )}
      {postal && <p className="text-[11px] text-text-muted">{postal}</p>}
      {address.mapsLink && (
        <a
          href={address.mapsLink}
          target="_blank"
          rel="noreferrer noopener"
          className="mt-1 flex items-center gap-1 text-[11px] font-bold text-brand hover:underline"
        >
          <MapPin className="h-3 w-3" strokeWidth={1.6} /> The pin the customer shared
        </a>
      )}
    </div>
  );
}

function Lines({ order }: { order: VendorSubOrderDetail }) {
  return (
    <div>
      <Heading>
        {order.itemCount} {order.itemCount === 1 ? 'item' : 'items'}
      </Heading>
      <ul className="mt-1.5 space-y-1.5">
        {order.lines.map((line) => (
          <LineRow key={line.id} line={line} />
        ))}
      </ul>
    </div>
  );
}

function LineRow({ line }: { line: SubOrderLine }) {
  // Deduped: the two snapshots often hold the same string, and repeating it reads as two
  // different attributes of the item rather than one said twice.
  const label = [...new Set([line.variantLabelSnapshot, line.optionLabel].filter(Boolean))].join(
    ' · ',
  );

  return (
    <li className="flex items-start justify-between gap-2 text-[11px]">
      <div className="min-w-0">
        <p className="text-text-secondary">
          <span className="font-bold text-text-primary">{line.quantity}×</span>{' '}
          {line.productTitleSnapshot}
        </p>
        {label && <p className="text-text-muted">{label}</p>}
        {/* A creator earned on this line. Shown because it is the one place the vendor sees
            which sale a partnership actually produced. */}
        {line.creatorAccountId && (
          <p className="mt-0.5 flex items-center gap-1 text-text-muted">
            <Sparkles className="h-2.5 w-2.5" strokeWidth={1.6} />
            creator{' '}
            {line.commissionAmountValue != null
              ? `· ${money(line.commissionAmountValue, line.commissionAmountCurrency ?? line.lineSubtotalCurrency)}`
              : ''}
            {line.commissionRateSnapshot != null
              ? ` (${(line.commissionRateSnapshot * 100).toFixed(1)}%)`
              : ''}
          </p>
        )}
      </div>
      <span className="shrink-0 text-text-secondary">
        {money(line.lineSubtotalAmount, line.lineSubtotalCurrency)}
      </span>
    </li>
  );
}

function Totals({ order }: { order: VendorSubOrderDetail }) {
  return (
    <div className="border-t-thin border-border-subtle pt-2">
      <Row label="Items" value={money(order.lineSubtotalAmount, order.lineSubtotalCurrency)} />
      <Row label="Shipping" value={money(order.shippingFeeAmount, order.shippingFeeCurrency)} />
      <Row label="Total" value={money(order.subtotalAmount, order.subtotalCurrency)} strong />
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-2 text-[11px]">
      <span className={strong ? 'font-bold text-text-primary' : 'text-text-muted'}>{label}</span>
      <span className={strong ? 'font-black text-text-primary' : 'text-text-secondary'}>
        {value}
      </span>
    </div>
  );
}

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-wide text-text-secondary">{children}</p>
  );
}

/**
 * Elapsed time in the largest unit that still says something useful.
 *
 * Seconds are kept below a minute rather than rounding to "0m": steps taken back to back are
 * common, and a column of "+0m" reads as a broken clock instead of a fast handover.
 */
function gap(from: string, to: string): string {
  const ms = new Date(to).getTime() - new Date(from).getTime();
  if (!Number.isFinite(ms) || ms < 0) return '—';

  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

function money(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount);
  } catch {
    // An unknown or blank currency code throws rather than falling back.
    return `${amount} ${currency}`.trim();
  }
}

function describe(error: unknown): string {
  if (!(error instanceof Error)) return 'Something went wrong.';
  if (error.message === 'NOT_DEPLOYED') {
    return 'This Stylemint build does not serve sub-order detail yet.';
  }
  // The service returns NotFound rather than 403 for another vendor's sub-order, so the id is
  // never confirmed to exist. The wording follows suit.
  if (error.message === 'NOT_FOUND') return 'No sub-order of this shop matches that id.';
  return error.message;
}
