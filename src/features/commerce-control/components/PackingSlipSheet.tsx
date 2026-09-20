import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Loader2, Printer, X } from 'lucide-react';
import type { PackingSlip } from '../api/stylemint-suborders.api';

/**
 * The packing slips for one or more sub-orders, as a sheet the operator prints.
 *
 * The backend returns the structured payload and leaves rendering to the client, so this is the
 * document itself rather than a viewer over a PDF. It is deliberately the one part of the desk
 * that abandons the dark theme: this is going on paper, and a dark-on-dark slip would come out of
 * the printer as a solid black page or an unreadable grey one.
 *
 * `@media print` hides the rest of the app and every control on this sheet, so the printed output
 * is the slips alone — one per page, in the order they were selected.
 */
export function PackingSlipSheet({
  slips,
  loading,
  error,
  failures,
  onClose,
}: {
  slips: PackingSlip[];
  loading: boolean;
  error: string | null;
  /** Ids the server refused, reported per id rather than failing the whole batch. */
  failures: Array<{ index: number; message: string }>;
  onClose: () => void;
}) {
  // Escape closes, because the sheet covers the queue underneath it.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // The browser's own print dialog is the print action — there is no separate export, because a
  // slip is something you put in a parcel, and every browser can already make it a PDF.
  const print = () => window.print();

  return createPortal(
    <div className="packing-slip-overlay fixed inset-0 z-50 overflow-auto bg-black/70 p-4">
      <style>{PRINT_CSS}</style>

      <div className="mx-auto max-w-[820px]">
        <div className="packing-slip-controls mb-3 flex items-center justify-between gap-2">
          <p className="text-sm font-bold text-text-primary">
            {loading
              ? 'Loading packing slips…'
              : `${slips.length} packing ${slips.length === 1 ? 'slip' : 'slips'}`}
          </p>
          <div className="flex gap-2">
            <button
              disabled={loading || slips.length === 0}
              onClick={print}
              className="flex items-center gap-1.5 rounded-sm bg-brand px-3 py-1.5 text-xs font-bold text-bg hover:bg-brand-light disabled:opacity-40"
            >
              <Printer className="h-3.5 w-3.5" strokeWidth={1.6} /> Print
            </button>
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 rounded-sm border-thin border-border-medium bg-bg-card px-3 py-1.5 text-xs font-bold text-text-secondary hover:bg-glass-2"
            >
              <X className="h-3.5 w-3.5" strokeWidth={1.6} /> Close
            </button>
          </div>
        </div>

        {error && (
          <div className="packing-slip-controls mb-3 flex items-start gap-2 rounded-frame border-thin border-rose-400/25 bg-rose-400/5 p-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" strokeWidth={1.6} />
            <p className="text-xs text-text-secondary">{error}</p>
          </div>
        )}

        {failures.length > 0 && (
          <div className="packing-slip-controls mb-3 rounded-frame border-thin border-amber-400/25 bg-amber-400/5 p-3">
            <p className="text-xs font-bold text-amber-300">
              {failures.length} of the selected orders returned no slip
            </p>
            <ul className="mt-1 space-y-0.5">
              {failures.map((failure) => (
                <li key={failure.index} className="text-[11px] text-text-secondary">
                  Row {failure.index + 1}: {failure.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        {loading ? (
          <div className="packing-slip-controls flex items-center gap-2 rounded-frame border-thin border-border-subtle bg-bg-card p-8 text-sm text-text-muted">
            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.6} /> Loading…
          </div>
        ) : (
          slips.map((slip) => <Slip key={slip.subOrderId} slip={slip} />)
        )}
      </div>
    </div>,
    document.body,
  );
}

function Slip({ slip }: { slip: PackingSlip }) {
  const address = slip.shipTo;

  // Location-first addresses leave every postal column blank, so the typed lines are assembled
  // from whatever is actually filled in rather than printed as a skeleton of empty commas.
  //
  // `addressLine1` is dropped when it repeats the location note: on a location-first address the
  // two are often the same string, and a courier reading the same sentence twice on one slip
  // learns to skim the address block, which is the one part of this document that must be read.
  const note = address.locationNote?.trim();
  const postal = [address.addressLine1, address.city, address.state, address.zipCode]
    .map((part) => part?.trim())
    .filter((part) => Boolean(part) && part !== note)
    .join(', ');

  return (
    <article className="packing-slip mb-4 rounded bg-white p-8 text-black">
      <header className="flex items-start justify-between border-b border-black/20 pb-4">
        <div>
          <h2 className="text-lg font-black tracking-tight">Packing slip</h2>
          <p className="mt-0.5 font-mono text-xs">{slip.packingSlipNumber}</p>
        </div>
        <div className="text-right text-xs">
          <p>
            Order <span className="font-mono font-bold">{slip.orderNumber}</span>
          </p>
          <p className="mt-0.5 text-black/60">
            Placed {new Date(slip.placedUtc).toLocaleString()}
          </p>
          <p className="text-black/60">Issued {new Date(slip.issuedUtc).toLocaleString()}</p>
        </div>
      </header>

      <section className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-black/50">Ship to</p>
          <p className="mt-1 text-sm font-bold">{address.receiverName}</p>
          <p className="text-sm">{address.receiverPhone}</p>

          {/* The customer's own description of how to find the place. On a location-first
              address this is the only thing a courier can navigate by, so it leads. */}
          {note && <p className="mt-2 text-sm">{note}</p>}
          {address.landmark && (
            <p className="mt-1 text-sm text-black/70">Landmark: {address.landmark}</p>
          )}
          {postal && <p className="mt-1 text-sm text-black/70">{postal}</p>}
          {address.country && <p className="text-sm text-black/70">{address.country}</p>}
          {address.mapsLink && (
            <p className="mt-1 break-all text-[11px] text-black/60">{address.mapsLink}</p>
          )}
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-black/50">Carrier</p>
          {slip.carrier || slip.trackingNumber ? (
            <>
              <p className="mt-1 text-sm font-bold">{slip.carrier ?? 'Not named'}</p>
              <p className="font-mono text-sm">
                {slip.trackingNumber ?? 'No tracking number yet'}
              </p>
            </>
          ) : (
            <p className="mt-1 text-sm text-black/60">Not handed to a courier yet</p>
          )}
        </div>
      </section>

      <table className="mt-5 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-black/20 text-left">
            <th className="pb-1.5 text-[10px] font-bold uppercase tracking-wide text-black/50">
              Item
            </th>
            <th className="w-20 pb-1.5 text-right text-[10px] font-bold uppercase tracking-wide text-black/50">
              Qty
            </th>
          </tr>
        </thead>
        <tbody>
          {slip.items.map((line, index) => (
            <tr key={`${line.productTitleSnapshot}-${index}`} className="border-b border-black/10">
              <td className="py-1.5">
                {line.productTitleSnapshot}
                {line.variantLabelSnapshot && (
                  <span className="text-black/60"> · {line.variantLabelSnapshot}</span>
                )}
              </td>
              <td className="py-1.5 text-right font-bold">{line.quantity}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td className="pt-2 text-[11px] font-bold uppercase tracking-wide text-black/50">
              Total units
            </td>
            <td className="pt-2 text-right font-black">
              {slip.items.reduce((sum, line) => sum + line.quantity, 0)}
            </td>
          </tr>
        </tfoot>
      </table>
    </article>
  );
}

/**
 * Printing rules, inline because they exist only while this sheet is mounted.
 *
 * `visibility` rather than `display` on the app root: hiding it outright collapses the layout and
 * some browsers then lay the overlay out at zero height, printing a blank page.
 */
const PRINT_CSS = `
@media print {
  body * { visibility: hidden; }
  .packing-slip-overlay, .packing-slip-overlay * { visibility: visible; }
  .packing-slip-overlay {
    position: absolute; inset: 0; overflow: visible;
    background: #fff; padding: 0;
  }
  .packing-slip-controls { display: none !important; }
  .packing-slip {
    box-shadow: none; border-radius: 0; margin: 0;
    page-break-after: always; break-after: page;
  }
  .packing-slip:last-child { page-break-after: auto; break-after: auto; }
}
`;
