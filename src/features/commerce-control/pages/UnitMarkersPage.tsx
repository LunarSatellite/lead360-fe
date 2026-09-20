import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Check,
  Copy,
  Link2,
  Loader2,
  QrCode,
  ScanLine,
  Search,
  Tag,
  Trash2,
} from 'lucide-react';
import {
  BINDING_STAGE_LABEL,
  stylemintUnitMarkersApi,
  UNIT_MARKER_STATUS_LABEL,
  UnitBindingStage,
  UnitMarkerStatus,
  type ProvisionedUnitMarker,
  type UnitBindingStageValue,
  type UnitMarker,
} from '../api/stylemint-unit-markers.api';
import { ReportPanel } from '../components/ReportPanel';

/**
 * Per-unit markers: the physical tag a seller attaches to one item, and the binding that ties
 * that tag to one line of one order.
 *
 * The whole page is shaped by one fact: **minting returns the cleartext secrets exactly once.**
 * The platform keeps only a SHA-256 digest, so the mint response is the only chance to print the
 * tags. A lost secret is not recoverable — it is replaced by revoking the marker and minting
 * another. So the secrets appear immediately, stay until dismissed, say plainly that they cannot
 * be shown again, and are never written anywhere that outlives the page.
 */
export function UnitMarkersPage() {
  const client = useQueryClient();
  const [productId, setProductId] = useState('');
  const [variantFilter, setVariantFilter] = useState('');
  const [filter, setFilter] = useState<{ productId?: string; productVariantId?: string }>({});
  const [minted, setMinted] = useState<ProvisionedUnitMarker[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const markers = useQuery({
    queryKey: ['stylemint-unit-markers', filter],
    queryFn: () => stylemintUnitMarkersApi.list({ ...filter, pageSize: 50 }),
    retry: false,
  });

  const refresh = () => client.invalidateQueries({ queryKey: ['stylemint-unit-markers'] });

  const report = (message: string | null, caught?: unknown) => {
    if (caught) {
      setNotice(null);
      setError(describe(caught));
    } else {
      setError(null);
      setNotice(message);
      refresh();
    }
  };

  return (
    <div className="mx-auto max-w-[1500px] space-y-5">
      <div>
        <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-brand">
          Stylemint commerce platform
        </p>
        <h1 className="mt-2 flex items-center gap-2 text-2xl font-black tracking-tight text-text-primary">
          <QrCode className="h-5 w-5 text-brand" strokeWidth={1.6} />
          Unit markers
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          The tag on one item, and the order line it belongs to. Minting prices nothing and
          reserves nothing — a quantity here is a print run, not stock.
        </p>
      </div>

      <MintPanel
        onMinted={(batch) => {
          setMinted(batch);
          report(`${batch.length} ${batch.length === 1 ? 'marker' : 'markers'} minted.`);
        }}
        onError={(caught) => report(null, caught)}
      />

      {minted && <SecretsPanel batch={minted} onDismiss={() => setMinted(null)} />}

      {error && (
        <div className="flex items-start gap-3 rounded-frame border-thin border-rose-400/25 bg-rose-400/5 p-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" strokeWidth={1.6} />
          <p className="text-xs text-text-secondary">{error}</p>
        </div>
      )}
      {notice && (
        <p className="rounded-frame border-thin border-border-glow bg-brand-soft p-3 text-xs text-text-secondary">
          {notice}
        </p>
      )}

      <div className="rounded-frame border-thin border-border-subtle bg-bg-card p-4">
        <p className="text-[11px] font-bold uppercase tracking-wide text-text-secondary">
          Narrow the list
        </p>
        <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <input
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            placeholder="Product id"
            className={`${field} font-mono`}
          />
          <input
            value={variantFilter}
            onChange={(e) => setVariantFilter(e.target.value)}
            placeholder="Variant id"
            className={`${field} font-mono`}
          />
          <button
            onClick={() =>
              setFilter({
                productId: productId.trim() || undefined,
                productVariantId: variantFilter.trim() || undefined,
              })
            }
            className="flex items-center gap-1.5 rounded-sm bg-brand px-3 py-2 text-xs font-bold text-bg hover:bg-brand-light"
          >
            <Search className="h-3.5 w-3.5" strokeWidth={1.6} /> Filter
          </button>
        </div>
      </div>

      <MarkerList query={markers} onReport={report} />

      <BindPanel onReport={report} />
    </div>
  );
}

/* --------------------------------------------------------------------------------- minting */

function MintPanel({
  onMinted,
  onError,
}: {
  onMinted: (batch: ProvisionedUnitMarker[]) => void;
  onError: (caught: unknown) => void;
}) {
  const [variantId, setVariantId] = useState('');
  const [quantity, setQuantity] = useState('1');

  const mint = useMutation({
    mutationFn: () => stylemintUnitMarkersApi.provision(variantId.trim(), Number(quantity)),
    onSuccess: (batch) => {
      setQuantity('1');
      onMinted(batch);
    },
    onError,
  });

  const count = Number(quantity);
  const ready = !!variantId.trim() && Number.isInteger(count) && count > 0;

  return (
    <div className="rounded-frame border-thin border-border-subtle bg-bg-card p-4">
      <p className="flex items-center gap-2 text-sm font-black text-text-primary">
        <Tag className="h-4 w-4 text-brand" strokeWidth={1.6} />
        Mint a print run
      </p>
      <p className="mt-1 text-[11px] text-text-muted">
        The secrets come back once and cannot be read again — the platform stores only their
        digest. Print them before leaving this screen; a lost tag is replaced by revoking it and
        minting another.
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-[2fr_1fr_auto]">
        <input
          value={variantId}
          onChange={(e) => setVariantId(e.target.value)}
          placeholder="Product variant id"
          className={`${field} font-mono`}
        />
        <input
          type="number"
          min={1}
          step={1}
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="How many tags"
          className={field}
        />
        <button
          disabled={!ready || mint.isPending}
          onClick={() => mint.mutate()}
          className="flex items-center gap-1.5 rounded-sm bg-brand px-3 py-2 text-xs font-bold text-bg hover:bg-brand-light disabled:opacity-40"
        >
          {mint.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.6} />
          ) : (
            <Tag className="h-3.5 w-3.5" strokeWidth={1.6} />
          )}
          Mint
        </button>
      </div>
    </div>
  );
}

/**
 * The secrets, shown once.
 *
 * Deliberately loud, deliberately manual to dismiss, and deliberately not persisted: no
 * localStorage, no query cache, no refetch. Once this panel is closed the cleartext is gone from
 * the browser as well as from the platform.
 */
function SecretsPanel({
  batch,
  onDismiss,
}: {
  batch: ProvisionedUnitMarker[];
  onDismiss: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    const asText = batch.map((m) => `${m.reference}  ${m.secret}`).join('\n');
    try {
      await navigator.clipboard.writeText(asText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // A blocked clipboard is not worth an error banner: the secrets are on screen and
      // selectable, which is the fallback.
      setCopied(false);
    }
  };

  return (
    <div className="rounded-frame border-thin border-amber-400/40 bg-amber-400/5 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="flex items-center gap-2 text-sm font-black text-amber-300">
            <AlertTriangle className="h-4 w-4" strokeWidth={1.6} />
            {batch.length} {batch.length === 1 ? 'secret' : 'secrets'}, shown once
          </p>
          <p className="mt-1 text-[11px] text-text-secondary">
            These cannot be shown again. Copy or print them now — closing this panel is the end of
            it, on this machine and on the platform.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={copy}
            className="flex items-center gap-1.5 rounded-sm bg-brand px-3 py-1.5 text-xs font-bold text-bg hover:bg-brand-light"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5" strokeWidth={1.6} />
            ) : (
              <Copy className="h-3.5 w-3.5" strokeWidth={1.6} />
            )}
            {copied ? 'Copied' : 'Copy all'}
          </button>
          <button
            onClick={onDismiss}
            className="rounded-sm border-thin border-border-medium px-3 py-1.5 text-xs font-bold text-text-secondary hover:bg-glass-2"
          >
            I have them
          </button>
        </div>
      </div>

      <div className="mt-3 max-h-72 overflow-auto rounded-sm border-thin border-border-subtle bg-bg-input">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr>
              <th className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide text-text-secondary">
                Reference
              </th>
              <th className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide text-text-secondary">
                Secret
              </th>
            </tr>
          </thead>
          <tbody>
            {batch.map((m) => (
              <tr key={m.id} className="border-t-thin border-border-subtle">
                <td className="px-2.5 py-1.5 font-mono text-[11px] text-text-secondary">
                  {m.reference}
                </td>
                <td className="select-all px-2.5 py-1.5 font-mono text-[11px] text-text-primary">
                  {m.secret}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------------- the list */

function MarkerList({
  query,
  onReport,
}: {
  query: {
    isLoading: boolean;
    isError: boolean;
    error: unknown;
    data?: { items: UnitMarker[]; totalCount: number };
  };
  onReport: (message: string | null, caught?: unknown) => void;
}) {
  if (query.isError) {
    return (
      <div className="flex items-start gap-3 rounded-frame border-thin border-rose-400/25 bg-rose-400/5 p-4">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" strokeWidth={1.6} />
        <p className="text-sm text-text-secondary">{describe(query.error)}</p>
      </div>
    );
  }
  if (query.isLoading) {
    return (
      <div className="flex items-center gap-3 rounded-frame border-thin border-border-subtle bg-bg-card p-8 text-sm text-text-muted">
        <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.6} /> Loading markers…
      </div>
    );
  }

  const items = query.data?.items ?? [];
  if (items.length === 0) {
    return (
      <div className="rounded-frame border-thin border-border-subtle bg-bg-card p-10 text-center">
        <QrCode className="mx-auto h-7 w-7 text-text-muted" strokeWidth={1.6} />
        <p className="mt-3 text-sm text-text-secondary">No markers have been minted.</p>
      </div>
    );
  }

  // This surface pages by cursor, and a cursor-paged read reports totalCount as -1 to mean "not
  // counted" rather than "none". Printing that literally would say "-1 markers"; what an operator
  // can actually be told is how many are on this page.
  const counted = (query.data?.totalCount ?? -1) >= 0 ? query.data!.totalCount : null;
  const total = counted ?? items.length;

  return (
    <div className="space-y-2">
      <p className="text-xs text-text-muted">
        {total} {total === 1 ? 'marker' : 'markers'}
        {counted === null ? ' on this page' : ''}
      </p>
      {items.map((marker) => (
        <MarkerRow key={marker.id} marker={marker} onReport={onReport} />
      ))}
    </div>
  );
}

function MarkerRow({
  marker,
  onReport,
}: {
  marker: UnitMarker;
  onReport: (message: string | null, caught?: unknown) => void;
}) {
  const [open, setOpen] = useState<'bindings' | 'scans' | null>(null);
  const [confirming, setConfirming] = useState(false);

  const revoke = useMutation({
    mutationFn: () => stylemintUnitMarkersApi.revoke(marker.reference),
    onSuccess: () => {
      setConfirming(false);
      onReport(`${marker.reference} revoked.`);
    },
    onError: (caught) => onReport(null, caught),
  });

  const bindings = useQuery({
    queryKey: ['stylemint-marker-bindings', marker.reference],
    queryFn: () => stylemintUnitMarkersApi.bindings(marker.reference),
    enabled: open === 'bindings',
    retry: false,
  });

  const scans = useQuery({
    queryKey: ['stylemint-marker-scans', marker.reference],
    queryFn: () => stylemintUnitMarkersApi.scans(marker.reference),
    enabled: open === 'scans',
    retry: false,
  });

  const revoked = marker.status === UnitMarkerStatus.Revoked;

  return (
    <div className="rounded-card border-thin border-border-subtle bg-glass-1 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-black text-text-primary">
              {marker.reference}
            </span>
            <span
              className={`rounded-xs border-thin px-1.5 py-0.5 text-[10px] font-bold ${
                revoked
                  ? 'border-rose-400/25 text-rose-300'
                  : 'border-emerald-400/25 text-emerald-300'
              }`}
            >
              {UNIT_MARKER_STATUS_LABEL[marker.status] ?? `Status ${marker.status}`}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-text-muted">
            variant <span className="font-mono">{marker.productVariantId}</span> · minted{' '}
            {new Date(marker.provisionedUtc).toLocaleString()}
            {marker.revokedUtc ? ` · revoked ${new Date(marker.revokedUtc).toLocaleString()}` : ''}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-1.5">
          <button
            onClick={() => setOpen(open === 'bindings' ? null : 'bindings')}
            className="flex items-center gap-1 rounded-sm border-thin border-border-medium px-2.5 py-1 text-[11px] font-bold text-text-secondary hover:bg-glass-2"
          >
            <Link2 className="h-3 w-3" strokeWidth={1.6} /> Bindings
          </button>
          <button
            onClick={() => setOpen(open === 'scans' ? null : 'scans')}
            className="flex items-center gap-1 rounded-sm border-thin border-border-medium px-2.5 py-1 text-[11px] font-bold text-text-secondary hover:bg-glass-2"
          >
            <ScanLine className="h-3 w-3" strokeWidth={1.6} /> Scans
          </button>
          {!revoked &&
            (confirming ? (
              <>
                <span className="text-[11px] text-amber-300">
                  Revoking is permanent — the tag is never re-activated.
                </span>
                <button
                  disabled={revoke.isPending}
                  onClick={() => revoke.mutate()}
                  className="rounded-sm border-thin border-rose-400/30 px-2.5 py-1 text-[11px] font-bold text-rose-300 hover:bg-rose-400/10 disabled:opacity-40"
                >
                  Yes, revoke
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  className="rounded-sm border-thin border-border-medium px-2.5 py-1 text-[11px] font-bold text-text-secondary hover:bg-glass-2"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setConfirming(true)}
                className="flex items-center gap-1 rounded-sm border-thin border-rose-400/30 px-2.5 py-1 text-[11px] font-bold text-rose-300 hover:bg-rose-400/10"
              >
                <Trash2 className="h-3 w-3" strokeWidth={1.6} /> Revoke
              </button>
            ))}
        </div>
      </div>

      {open === 'bindings' && (
        <div className="mt-2.5">
          <ReportPanel
            title="Bindings"
            query={bindings}
            emptyNote="This tag has not been bound to an order line."
          />
        </div>
      )}
      {open === 'scans' && (
        <div className="mt-2.5">
          <ReportPanel title="Scans" query={scans} emptyNote="This tag has never been scanned." />
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------------------- the binding */

function BindPanel({
  onReport,
}: {
  onReport: (message: string | null, caught?: unknown) => void;
}) {
  const [mode, setMode] = useState<'bind' | 'correct'>('bind');
  const [marker, setMarker] = useState('');
  const [lineId, setLineId] = useState('');
  const [stage, setStage] = useState<UnitBindingStageValue>(UnitBindingStage.Pack);
  const [reason, setReason] = useState('');

  const submit = useMutation({
    mutationFn: () =>
      mode === 'bind'
        ? stylemintUnitMarkersApi.bind(marker.trim(), lineId.trim(), stage)
        : stylemintUnitMarkersApi.correctBinding(
            marker.trim(),
            lineId.trim(),
            stage,
            reason.trim(),
          ),
    onSuccess: () => {
      setMarker('');
      setLineId('');
      setReason('');
      onReport(mode === 'bind' ? 'The tag is bound.' : 'The binding is corrected.');
    },
    onError: (caught) => onReport(null, caught),
  });

  // A correction re-points a tag that went on the wrong unit, so it has to say why.
  const ready = !!marker.trim() && !!lineId.trim() && (mode === 'bind' || !!reason.trim());

  return (
    <div className="rounded-frame border-thin border-border-subtle bg-bg-card p-4">
      <p className="flex items-center gap-2 text-sm font-black text-text-primary">
        <Link2 className="h-4 w-4 text-brand" strokeWidth={1.6} />
        Tie a tag to an order line
      </p>
      <p className="mt-1 text-[11px] text-text-muted">
        The marker here is the secret printed on the tag, not its reference — binding is what a
        scanner does, and a scanner reads the secret.
      </p>

      <div className="mt-2 flex gap-1.5">
        {(['bind', 'correct'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`rounded-sm border-thin px-2.5 py-1 text-[11px] font-bold ${
              mode === m
                ? 'border-border-glow bg-brand-soft text-brand'
                : 'border-border-subtle text-text-secondary hover:bg-glass-2'
            }`}
          >
            {m === 'bind' ? 'Bind' : 'Correct a binding'}
          </button>
        ))}
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <input
          value={marker}
          onChange={(e) => setMarker(e.target.value)}
          placeholder="Marker secret from the tag"
          className={`${field} font-mono`}
        />
        <input
          value={lineId}
          onChange={(e) => setLineId(e.target.value)}
          placeholder="Sub-order line id"
          className={`${field} font-mono`}
        />
        <select
          value={stage}
          onChange={(e) => setStage(Number(e.target.value) as UnitBindingStageValue)}
          className={field}
        >
          {Object.values(UnitBindingStage).map((value) => (
            <option key={value} value={value}>
              Attached at {BINDING_STAGE_LABEL[value].toLowerCase()}
            </option>
          ))}
        </select>
        {mode === 'correct' && (
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why the binding is being changed (required)"
            className={`${field} sm:col-span-3`}
          />
        )}
      </div>

      <button
        disabled={!ready || submit.isPending}
        onClick={() => submit.mutate()}
        className="mt-3 flex items-center gap-1.5 rounded-sm bg-brand px-3 py-1.5 text-xs font-bold text-bg hover:bg-brand-light disabled:opacity-40"
      >
        {submit.isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.6} />
        ) : (
          <Check className="h-3.5 w-3.5" strokeWidth={1.6} />
        )}
        {mode === 'bind' ? 'Bind the tag' : 'Correct the binding'}
      </button>
    </div>
  );
}

/** The api client signals absence with codes rather than prose, so each caller says it its own way. */
function describe(error: unknown): string {
  if (!(error instanceof Error)) return 'Something went wrong.';
  if (error.message === 'NOT_DEPLOYED') {
    return 'This Stylemint build does not serve unit markers yet.';
  }
  if (error.message === 'NOT_FOUND') return 'No marker matches that reference.';
  return error.message;
}

const field =
  'w-full rounded-sm border-thin border-border-subtle bg-bg-input px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:border-border-glow focus:outline-none';

export { UnitMarkersPage as Component };
