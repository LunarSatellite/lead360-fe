import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  FileDown,
  Loader2,
  PackageCheck,
  RefreshCw,
  Search,
  ShieldCheck,
  Truck,
  X,
  XCircle,
} from 'lucide-react';
import {
  stylemintCommerceApi,
  type StylemintOrder,
  type StylemintOrderDetail,
} from '../api/stylemint-commerce.api';
import { useAuth } from '@/shared/hooks/useAuth';
import { UserRole } from '@/features/auth/types/auth.types';
import { buildVendorRejection, canSubmitVerifiedRefund } from '../lib/order-operations';

const STATES: Record<number, string> = {
  1: 'En attente',
  2: 'Payee',
  3: 'A preparer',
  4: 'Prete a expedier',
  5: 'Suivi attendu',
  6: 'Expediee',
  7: 'Livree',
  8: 'Annulee',
  9: 'Returned',
  10: 'En transit',
  11: 'En livraison',
  12: 'Acceptee',
  13: 'Emballee',
  14: 'Remise au transporteur',
};

const NEXT_ACTION: Record<number, { command: string; label: string }> = {
  2: { command: 'accept', label: 'Accepter' },
  3: { command: 'accept', label: 'Accepter' },
  12: { command: 'packed', label: 'Marquer emballee' },
  13: { command: 'ready-to-ship', label: 'Prete a expedier' },
  4: { command: 'in-transit', label: 'Marquer en transit' },
  6: { command: 'in-transit', label: 'Marquer en transit' },
  14: { command: 'in-transit', label: 'Marquer en transit' },
  10: { command: 'out-for-delivery', label: 'En livraison' },
  11: { command: 'delivered', label: 'Confirmer livree' },
};

function extractItems(raw: unknown): StylemintOrder[] {
  if (Array.isArray(raw)) return raw as StylemintOrder[];
  const page = raw as { items?: StylemintOrder[]; data?: StylemintOrder[]; results?: StylemintOrder[] };
  return page?.items ?? page?.data ?? page?.results ?? [];
}

export function StylemintOrdersPage() {
  const { user } = useAuth();
  const canOperate = user?.role === UserRole.Owner || user?.role === UserRole.Admin;
  const canRefund = user?.role === UserRole.Owner;
  const client = useQueryClient();
  const [state, setState] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<StylemintOrder | null>(null);
  const [refundOpen, setRefundOpen] = useState(false);
  const [operation, setOperation] = useState<'tracking' | 'handover' | 'reject' | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkMessage, setBulkMessage] = useState('');
  const [sealOpen, setSealOpen] = useState(false);

  const health = useQuery({
    queryKey: ['stylemint-health'],
    queryFn: stylemintCommerceApi.health,
    retry: false,
  });
  const ordersQuery = useQuery({
    queryKey: ['stylemint-orders', state],
    queryFn: () => stylemintCommerceApi.orders({ pageSize: 50, state: state ? Number(state) : undefined }),
    retry: false,
  });
  const detailQuery = useQuery({
    queryKey: ['stylemint-order-detail', selected?.id],
    queryFn: () => stylemintCommerceApi.order(selected!.id),
    enabled: !!selected,
    retry: false,
  });
  const refundCapability = useQuery({
    queryKey: ['stylemint-refund-capability'],
    queryFn: stylemintCommerceApi.refundCapability,
    retry: false,
  });
  const detail = useMemo(() => {
    if (!detailQuery.data || typeof detailQuery.data !== 'object') return undefined;
    const raw = detailQuery.data as Record<string, unknown>;
    return (raw.data && typeof raw.data === 'object' ? raw.data : raw) as StylemintOrderDetail;
  }, [detailQuery.data]);
  const command = useMutation({
    mutationFn: ({ id, action, body }: { id: string; action: string; body?: unknown }) =>
      stylemintCommerceApi.command(id, action, body),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['stylemint-orders'] });
      setOperation(null);
      setSelected(null);
    },
  });
  const bulkCommand = useMutation({
    mutationFn: (action: 'accept' | 'ready-to-ship' | 'packing-slips') =>
      stylemintCommerceApi.bulkOrderAction(action, selectedIds),
    onSuccess: async (_data, action) => {
      setBulkMessage(
        action === 'packing-slips'
          ? 'Bordereaux generes par Stylemint.'
          : 'Traitement groupe applique avec succes.',
      );
      setSelectedIds([]);
      await client.invalidateQueries({ queryKey: ['stylemint-orders'] });
    },
    onError: () => setBulkMessage('Traitement groupe impossible. Verifiez les statuts selectionnes.'),
  });
  const sealPackage = useMutation({
    mutationFn: ({
      trackingNumber,
      sealId,
      sealPhotoUrl,
    }: {
      trackingNumber: string;
      sealId: string;
      sealPhotoUrl: string;
    }) => stylemintCommerceApi.sealVendorPackage(trackingNumber, { sealId, sealPhotoUrl }),
    onSuccess: async () => {
      setBulkMessage('Scelle de securite enregistre dans Stylemint.');
      setSealOpen(false);
      await client.invalidateQueries({ queryKey: ['stylemint-orders'] });
    },
  });
  const packingSlip = useMutation({
    mutationFn: ({ id, orderNumber }: { id: string; orderNumber: string }) =>
      stylemintCommerceApi.packingSlip(id).then((blob) => ({ blob, orderNumber })),
    onSuccess: ({ blob, orderNumber }) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `packing-slip-${orderNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setBulkMessage(`Packing slip downloaded for ${orderNumber}.`);
    },
    onError: () => setBulkMessage('Packing slip download failed. Verify the order state and try again.'),
  });

  const orders = useMemo(() => {
    const all = extractItems(ordersQuery.data);
    const term = search.trim().toLowerCase();
    return term
      ? all.filter(
          (order) =>
            order.orderNumber.toLowerCase().includes(term) || order.receiverName.toLowerCase().includes(term),
        )
      : all;
  }, [ordersQuery.data, search]);

  return (
    <div className="mx-auto max-w-[1500px] space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-brand">
            <PackageCheck className="h-3.5 w-3.5" /> Stylemint en direct
          </div>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-text-primary">Orders & fulfilment</h1>
          <p className="mt-1 text-sm text-text-muted">Drive the full lifecycle of every Kin Marche order.</p>
        </div>
        <div
          className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold ${health.isSuccess ? 'border-success/25 bg-success-soft text-success' : 'border-amber-400/25 bg-amber-400/10 text-amber-400'}`}
        >
          {health.isFetching ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : health.isSuccess ? (
            <CheckCircle2 className="h-3.5 w-3.5" />
          ) : (
            <AlertTriangle className="h-3.5 w-3.5" />
          )}
          {health.isSuccess ? 'Stylemint connected' : 'Stylemint connection not configured'}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 rounded-2xl border border-border-subtle bg-bg-card p-3">
        <label className="flex min-w-[240px] flex-1 items-center gap-2 rounded-xl border border-border-subtle bg-bg-elevated px-3">
          <Search className="h-4 w-4 text-text-muted" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Numero ou nom du client"
            className="w-full bg-transparent py-2.5 text-sm text-text-primary outline-none placeholder:text-text-muted"
          />
        </label>
        <select
          value={state}
          onChange={(event) => setState(event.target.value)}
          className="rounded-xl border border-border-subtle bg-bg-elevated px-3 py-2 text-sm font-semibold text-text-secondary outline-none"
        >
          <option value="">All statuses</option>
          {Object.entries(STATES).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button
          onClick={() => ordersQuery.refetch()}
          className="flex items-center gap-2 rounded-xl border border-border-subtle px-3 py-2 text-xs font-bold text-text-secondary hover:text-brand"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${ordersQuery.isFetching ? 'animate-spin' : ''}`} /> Actualiser
        </button>
      </div>

      {canOperate && selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-brand/25 bg-brand-soft px-4 py-3">
          <span className="mr-auto text-xs font-extrabold text-brand">
            {selectedIds.length} commande(s) selectionnee(s)
          </span>
          <button
            disabled={bulkCommand.isPending}
            onClick={() => bulkCommand.mutate('accept')}
            className="rounded-lg bg-brand px-3 py-2 text-[11px] font-extrabold text-black disabled:opacity-40"
          >
            Accepter
          </button>
          <button
            disabled={bulkCommand.isPending}
            onClick={() => bulkCommand.mutate('ready-to-ship')}
            className="rounded-lg border border-brand/30 px-3 py-2 text-[11px] font-extrabold text-brand disabled:opacity-40"
          >
            Pretes a expedier
          </button>
          <button
            disabled={bulkCommand.isPending}
            onClick={() => bulkCommand.mutate('packing-slips')}
            className="rounded-lg border border-border-subtle bg-bg-card px-3 py-2 text-[11px] font-bold text-text-secondary disabled:opacity-40"
          >
            Generer les bordereaux
          </button>
        </div>
      )}
      {bulkMessage && (
        <p className="rounded-xl border border-border-subtle bg-bg-elevated px-4 py-2 text-xs font-semibold text-text-secondary">
          {bulkMessage}
        </p>
      )}

      <div className="overflow-hidden rounded-2xl border border-border-subtle bg-bg-card">
        {ordersQuery.isLoading ? (
          <div className="flex h-56 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-brand" />
          </div>
        ) : ordersQuery.isError ? (
          <div className="flex h-56 flex-col items-center justify-center gap-3 px-6 text-center">
            <AlertTriangle className="h-8 w-8 text-amber-400" />
            <p className="font-bold text-text-primary">Could not load Stylemint orders</p>
            <p className="max-w-lg text-xs leading-5 text-text-muted">
              Ajoutez le jeton operateur Stylemint dans la configuration securisee de Lead360, puis
              actualisez.
            </p>
          </div>
        ) : !orders.length ? (
          <div className="flex h-56 flex-col items-center justify-center gap-2 text-text-muted">
            <PackageCheck className="h-8 w-8 opacity-40" />
            <p className="text-sm">No orders for this filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-sm">
              <thead>
                <tr className="border-b border-border-subtle bg-bg-elevated">
                  {canOperate && (
                    <th className="px-4 py-3">
                      <input
                        aria-label="Tout selectionner"
                        type="checkbox"
                        checked={orders.length > 0 && orders.every((order) => selectedIds.includes(order.id))}
                        onChange={(event) =>
                          setSelectedIds(event.target.checked ? orders.map((order) => order.id) : [])
                        }
                        className="accent-[var(--color-brand)]"
                      />
                    </th>
                  )}
                  {['Commande', 'Client', 'Articles', 'Total', 'Statut', 'Date', ''].map((heading) => (
                    <th
                      key={heading}
                      className="px-4 py-3 text-left text-[10px] font-extrabold uppercase tracking-wider text-text-muted"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => setSelected(order)}
                    className="cursor-pointer border-b border-border-subtle last:border-0 hover:bg-bg-elevated"
                  >
                    {canOperate && (
                      <td className="px-4 py-3">
                        <input
                          aria-label={`Selectionner ${order.orderNumber}`}
                          type="checkbox"
                          checked={selectedIds.includes(order.id)}
                          onClick={(event) => event.stopPropagation()}
                          onChange={(event) =>
                            setSelectedIds((current) =>
                              event.target.checked
                                ? [...current, order.id]
                                : current.filter((id) => id !== order.id),
                            )
                          }
                          className="accent-[var(--color-brand)]"
                        />
                      </td>
                    )}
                    <td className="px-4 py-3 font-mono text-xs font-bold text-text-primary">
                      {order.orderNumber}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{order.receiverName || 'Client'}</td>
                    <td className="px-4 py-3 text-text-muted">{order.itemCount}</td>
                    <td className="px-4 py-3 font-bold text-text-primary">
                      {order.subtotalAmount.toLocaleString('fr-CD')} {order.subtotalCurrency}
                    </td>
                    <td className="px-4 py-3">
                      <StateBadge state={order.state} />
                    </td>
                    <td className="px-4 py-3 text-xs text-text-muted">
                      {new Date(order.placedUtc).toLocaleString('fr-CD')}
                    </td>
                    <td className="px-4 py-3">
                      <ChevronRight className="h-4 w-4 text-text-muted" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <OrderPanel
          order={selected}
          detail={detail}
          detailLoading={detailQuery.isLoading}
          busy={command.isPending || sealPackage.isPending}
          canOperate={canOperate}
          canRefund={canRefund && refundCapability.data?.supported !== false}
          onClose={() => setSelected(null)}
          onCommand={(action, body) => command.mutate({ id: selected.id, action, body })}
          onOperation={setOperation}
          onSeal={() => setSealOpen(true)}
          onRefund={() => setRefundOpen(true)}
          onPackingSlip={() => packingSlip.mutate({ id: selected.id, orderNumber: selected.orderNumber })}
          packingSlipBusy={packingSlip.isPending}
        />
      )}
      {selected && operation && (
        <OrderOperationDialog
          mode={operation}
          busy={command.isPending}
          onClose={() => setOperation(null)}
          onSubmit={(body) => command.mutate({ id: selected.id, action: operation, body })}
        />
      )}
      {selected?.trackingNumber && sealOpen && (
        <PackageSealDialog
          trackingNumber={selected.trackingNumber}
          busy={sealPackage.isPending}
          error={sealPackage.isError ? (sealPackage.error as Error).message : ''}
          onClose={() => setSealOpen(false)}
          onSubmit={(sealId, sealPhotoUrl) =>
            sealPackage.mutate({ trackingNumber: selected.trackingNumber!, sealId, sealPhotoUrl })
          }
        />
      )}
      {refundOpen && (
        <RefundDialog
          orderId={selected?.orderId ?? ''}
          onClose={() => setRefundOpen(false)}
          onDone={() => setRefundOpen(false)}
        />
      )}
    </div>
  );
}

function StateBadge({ state }: { state: number }) {
  const done = [7].includes(state);
  const stopped = [8, 9].includes(state);
  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[10px] font-extrabold ${done ? 'border-success/25 bg-success-soft text-success' : stopped ? 'border-danger/25 bg-danger-soft text-danger' : 'border-amber-400/25 bg-amber-400/10 text-amber-400'}`}
    >
      {STATES[state] ?? `Etat ${state}`}
    </span>
  );
}

function OrderPanel({
  order,
  detail,
  detailLoading,
  busy,
  canOperate,
  canRefund,
  onClose,
  onCommand,
  onOperation,
  onSeal,
  onRefund,
  onPackingSlip,
  packingSlipBusy,
}: {
  order: StylemintOrder;
  detail?: StylemintOrderDetail;
  detailLoading: boolean;
  busy: boolean;
  canOperate: boolean;
  canRefund: boolean;
  onClose: () => void;
  onCommand: (action: string, body?: unknown) => void;
  onOperation: (operation: 'tracking' | 'handover' | 'reject') => void;
  onSeal: () => void;
  onRefund: () => void;
  onPackingSlip: () => void;
  packingSlipBusy: boolean;
}) {
  const next = NEXT_ACTION[order.state];
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        aria-label="Fermer"
        className="absolute inset-0 bg-black/55 backdrop-blur-sm"
        onClick={onClose}
      />
      <aside className="relative h-full w-full max-w-lg overflow-y-auto border-l border-border-subtle bg-bg-card p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-mono text-xs text-brand">{order.orderNumber}</p>
            <h2 className="mt-1 text-xl font-black text-text-primary">
              {order.receiverName || 'Commande client'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-text-muted hover:bg-bg-elevated hover:text-text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-5">
          <StateBadge state={order.state} />
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Info
            label="Montant"
            value={`${order.subtotalAmount.toLocaleString('fr-CD')} ${order.subtotalCurrency}`}
          />
          <Info label="Articles" value={String(order.itemCount)} />
          <Info label="Transporteur" value={order.carrier || 'Non assigne'} />
          <Info label="Tracking" value={order.trackingNumber || 'Non disponible'} />
        </div>
        {detailLoading && (
          <div className="mt-5 flex items-center gap-2 rounded-xl border border-border-subtle bg-bg-elevated p-4 text-xs text-text-muted">
            <Loader2 className="h-4 w-4 animate-spin text-brand" />
            Loading Stylemint details…
          </div>
        )}
        {detail?.shipTo && (
          <section className="mt-5 rounded-2xl border border-border-subtle bg-bg-elevated p-4">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-text-muted">Livraison</p>
            <p className="mt-2 text-sm font-bold text-text-primary">{detail.shipTo.receiverName}</p>
            <p className="mt-1 text-xs text-text-secondary">{detail.shipTo.receiverPhone}</p>
            <p className="mt-2 text-xs leading-5 text-text-secondary">
              {[
                detail.shipTo.addressLine1,
                detail.shipTo.landmark,
                detail.shipTo.locationNote,
                detail.shipTo.city,
                detail.shipTo.state,
                detail.shipTo.country,
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
            {detail.shipTo.mapsLink && (
              <a
                href={detail.shipTo.mapsLink}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex rounded-lg border border-brand/25 px-3 py-1.5 text-[11px] font-bold text-brand"
              >
                Ouvrir le point sur la carte
              </a>
            )}
          </section>
        )}
        {!!detail?.lines?.length && (
          <section className="mt-5 rounded-2xl border border-border-subtle bg-bg-elevated p-4">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-text-muted">
              Articles de la commande
            </p>
            <div className="mt-3 space-y-2">
              {detail.lines.map((line) => (
                <div
                  key={line.id}
                  className="flex items-center gap-3 rounded-xl border border-border-subtle bg-bg-card p-3"
                >
                  {line.thumbnailUrlSnapshot ? (
                    <img
                      src={line.thumbnailUrlSnapshot}
                      alt=""
                      className="h-11 w-11 rounded-lg object-cover"
                    />
                  ) : (
                    <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-bg-elevated">
                      <PackageCheck className="h-4 w-4 text-text-muted" />
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-text-primary">
                      {line.productTitleSnapshot}
                    </p>
                    <p className="text-[10px] text-text-muted">
                      {line.optionLabel || 'Option standard'} · {line.quantity} unite(s)
                    </p>
                  </div>
                  <p className="ml-auto whitespace-nowrap text-xs font-black text-text-primary">
                    {line.lineSubtotalAmount.toLocaleString('fr-CD')} {line.lineSubtotalCurrency}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
        <div className="mt-7 space-y-2">
          <button
            disabled={packingSlipBusy}
            onClick={onPackingSlip}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-border-subtle px-4 py-3 text-sm font-bold text-text-secondary hover:border-brand/30 hover:text-brand disabled:opacity-50"
          >
            {packingSlipBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
            Download packing slip
          </button>
          {canOperate && next && (
            <button
              disabled={busy}
              onClick={() => onCommand(next.command)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-extrabold text-bg disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />}
              {next.label}
            </button>
          )}
          {canOperate && [4, 5, 13].includes(order.state) && (
            <button
              disabled={busy}
              onClick={() => onOperation('tracking')}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-brand/25 bg-brand-soft px-4 py-3 text-sm font-bold text-brand disabled:opacity-50"
            >
              <Truck className="h-4 w-4" /> Add carrier tracking
            </button>
          )}
          {canOperate && [4, 13].includes(order.state) && (
            <button
              disabled={busy}
              onClick={() => onOperation('handover')}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-border-subtle px-4 py-3 text-sm font-bold text-text-secondary hover:text-brand disabled:opacity-50"
            >
              <PackageCheck className="h-4 w-4" /> Confirmer la remise au transporteur
            </button>
          )}
          {canOperate && order.trackingNumber && (
            <button
              disabled={busy}
              onClick={onSeal}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-300/25 bg-amber-300/10 px-4 py-3 text-sm font-bold text-amber-300 disabled:opacity-50"
            >
              <ShieldCheck className="h-4 w-4" /> Save package seal
            </button>
          )}
          {canOperate && [2, 3, 12].includes(order.state) && (
            <button
              disabled={busy}
              onClick={() => onOperation('reject')}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-danger/25 bg-danger-soft px-4 py-3 text-sm font-bold text-danger disabled:opacity-50"
            >
              <XCircle className="h-4 w-4" /> Rejeter / annuler cette sous-commande
            </button>
          )}
          {canRefund && (
            <button
              onClick={onRefund}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-border-subtle px-4 py-3 text-sm font-bold text-text-secondary hover:text-brand"
            >
              <CircleDollarSign className="h-4 w-4" /> Remboursement manuel
            </button>
          )}
          {!canOperate && (
            <p className="rounded-xl border border-border-subtle bg-bg-elevated p-3 text-xs text-text-muted">
              Acces lecture seule pour le role Agent.
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}

function PackageSealDialog({
  trackingNumber,
  busy,
  error,
  onClose,
  onSubmit,
}: {
  trackingNumber: string;
  busy: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (sealId: string, sealPhotoUrl: string) => void;
}) {
  const [sealId, setSealId] = useState('');
  const [sealPhotoUrl, setSealPhotoUrl] = useState('');
  const valid = sealId.trim().length >= 3 && /^https:\/\//i.test(sealPhotoUrl.trim());
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button aria-label="Fermer" className="absolute inset-0 bg-black/75" onClick={onClose} />
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit(sealId.trim(), sealPhotoUrl.trim());
        }}
        className="relative w-full max-w-md rounded-2xl border border-amber-300/20 bg-bg-card p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-amber-300">
              Securite livraison
            </p>
            <h3 className="mt-1 text-lg font-black text-text-primary">Seal the parcel</h3>
          </div>
          <button type="button" onClick={onClose}>
            <X className="h-4 w-4 text-text-muted" />
          </button>
        </div>
        <p className="mt-3 rounded-xl bg-bg-elevated px-3 py-2 font-mono text-xs text-text-secondary">
          Suivi: {trackingNumber}
        </p>
        <div className="mt-5 space-y-3">
          <Input label="Identifiant du scelle" value={sealId} onChange={setSealId} />
          <Input label="Seal photo (HTTPS URL)" value={sealPhotoUrl} onChange={setSealPhotoUrl} />
        </div>
        {error && <p className="mt-3 text-xs font-semibold text-danger">{error}</p>}
        <button
          disabled={busy || !valid}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-300 py-3 text-sm font-extrabold text-black disabled:opacity-40"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}{' '}
          Confirmer le scelle
        </button>
      </form>
    </div>
  );
}

function OrderOperationDialog({
  mode,
  busy,
  onClose,
  onSubmit,
}: {
  mode: 'tracking' | 'handover' | 'reject';
  busy: boolean;
  onClose: () => void;
  onSubmit: (body: unknown) => void;
}) {
  const [carrier, setCarrier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [note, setNote] = useState('');
  const [reasonCode, setReasonCode] = useState('1');
  const isReject = mode === 'reject';
  const title = isReject
    ? 'Rejeter la sous-commande'
    : mode === 'handover'
      ? 'Remise au transporteur'
      : 'Suivi transporteur';
  const valid = isReject
    ? Number(reasonCode) !== 6 || note.trim().length >= 3
    : carrier.trim().length > 1 && trackingNumber.trim().length > 2;

  const submit = () => {
    if (isReject) onSubmit(buildVendorRejection(Number(reasonCode), note));
    else if (mode === 'handover')
      onSubmit({
        carrier: carrier.trim(),
        trackingNumber: trackingNumber.trim(),
        handoverNote: note.trim() || null,
      });
    else onSubmit({ carrier: carrier.trim(), trackingNumber: trackingNumber.trim() });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button aria-label="Fermer" className="absolute inset-0 bg-black/70" onClick={onClose} />
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
        className="relative w-full max-w-md rounded-2xl border border-border-subtle bg-bg-card p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-text-primary">{title}</h3>
          <button type="button" onClick={onClose}>
            <X className="h-4 w-4 text-text-muted" />
          </button>
        </div>
        <p className="mt-2 text-xs leading-5 text-text-muted">
          {isReject
            ? 'Le motif sera enregistre dans Stylemint et le remboursement applicable sera lance.'
            : 'Ces informations seront synchronisees immediatement avec Stylemint.'}
        </p>
        <div className="mt-5 space-y-3">
          {isReject && (
            <label className="block space-y-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-text-muted">Rejection reason</span>
              <select
                value={reasonCode}
                onChange={(event) => setReasonCode(event.target.value)}
                className="w-full rounded-xl border border-border-subtle bg-bg-elevated px-3 py-2.5 text-sm text-text-primary outline-none focus:border-brand/50"
              >
                <option value="1">Out of stock</option>
                <option value="2">Cannot prepare in time</option>
                <option value="3">Pricing error</option>
                <option value="4">Adresse non desservie</option>
                <option value="5">Fraude suspectee</option>
                <option value="6">Other reason</option>
              </select>
            </label>
          )}
          {!isReject && (
            <>
              <Input label="Transporteur" value={carrier} onChange={setCarrier} />
              <Input label="Tracking number" value={trackingNumber} onChange={setTrackingNumber} />
            </>
          )}
          <Input
            label={isReject ? (reasonCode === '6' ? 'Explication obligatoire' : 'Note au client (facultative)') : 'Note de remise (facultative)'}
            value={note}
            onChange={setNote}
            required={isReject && reasonCode === '6'}
          />
        </div>
        <button
          disabled={busy || !valid}
          className={`mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-extrabold disabled:opacity-40 ${isReject ? 'bg-danger text-white' : 'bg-brand text-bg'}`}
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {isReject ? 'Confirm rejection' : 'Synchronize with Stylemint'}
        </button>
      </form>
    </div>
  );
}

function RefundDialog({
  orderId,
  onClose,
  onDone,
}: {
  orderId: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const [paymentId, setPaymentId] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const context = useQuery({
    queryKey: ['stylemint-refund-context', orderId],
    queryFn: () => stylemintCommerceApi.refundContext(orderId),
    enabled: !!orderId,
    retry: false,
  });
  useEffect(() => {
    if (!context.data) return;
    setPaymentId(context.data.paymentIntentId ?? '');
    setAmount(String(context.data.refundableAmount ?? ''));
  }, [context.data]);
  const maximum = Number(context.data?.refundableAmount ?? 0);
  const refund = useMutation({
    mutationFn: () =>
      stylemintCommerceApi.refund(paymentId.trim(), {
        amount: Number(amount),
        currency: 'CDF',
        reasonTag: 'operator_refund',
        reason: reason.trim(),
      }),
    onSuccess: onDone,
  });
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button aria-label="Fermer" className="absolute inset-0 bg-black/70" onClick={onClose} />
      <form
        onSubmit={(event) => {
          event.preventDefault();
          refund.mutate();
        }}
        className="relative w-full max-w-md rounded-2xl border border-border-subtle bg-bg-card p-6"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-text-primary">Issue a refund</h3>
          <button type="button" onClick={onClose}>
            <X className="h-4 w-4 text-text-muted" />
          </button>
        </div>
        <p className="mt-2 text-xs leading-5 text-text-muted">
          Cette action appelle le moteur de paiement Stylemint et utilise une cle d'idempotence unique.
        </p>
        <div className="mt-5 space-y-3">
          <Input label="Payment Intent ID" value={paymentId} onChange={setPaymentId} readOnly />
          <Input label="Montant (CDF)" value={amount} onChange={setAmount} type="number" />
          <Input label="Reason" value={reason} onChange={setReason} />
        </div>
        {context.isLoading && (
          <p className="mt-3 text-xs text-text-muted">Verifying Stylemint payment…</p>
        )}
        {context.data && (
          <p className="mt-3 text-xs text-text-muted">
            Commande {context.data.orderNumber} · maximum{' '}
            {context.data.refundableAmount.toLocaleString('fr-CD')} {context.data.currency}
          </p>
        )}
        {context.isError && (
          <p className="mt-3 text-xs font-semibold text-danger">
            Impossible de verifier le paiement ou droits PayoutsOps absents.
          </p>
        )}
        {context.data && !context.data.paymentIntentId && (
          <p className="mt-3 text-xs font-semibold text-danger">
            Cette commande ne possede aucun paiement remboursable.
          </p>
        )}
        {context.data?.paymentIntentId && (
          <label className="mt-4 flex items-start gap-3 rounded-xl border border-danger/20 bg-danger/5 p-3 text-xs leading-5 text-text-secondary">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
              className="mt-0.5"
            />
            <span>
              Je confirme le remboursement de <strong>{Number(amount || 0).toLocaleString('fr-CD')} CDF</strong> pour la commande <strong>{context.data.orderNumber}</strong>. Cette operation financiere sera auditee.
            </span>
          </label>
        )}
        {refund.isError && (
          <p className="mt-3 text-xs font-semibold text-danger">{(refund.error as Error).message}</p>
        )}
        <button
          disabled={refund.isPending || !canSubmitVerifiedRefund({
            paymentIntentId: paymentId,
            amount: Number(amount),
            maximum,
            reason,
            confirmed,
            loading: context.isLoading,
            failed: context.isError,
          })}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-extrabold text-bg disabled:opacity-40"
        >
          {refund.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Confirmer le remboursement
        </button>
      </form>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border-subtle bg-bg-elevated p-3">
      <p className="text-[9px] font-bold uppercase tracking-wider text-text-muted">{label}</p>
      <p className="mt-1 text-sm font-bold text-text-primary">{value}</p>
    </div>
  );
}
function Input({
  label,
  value,
  onChange,
  type = 'text',
  required = true,
  readOnly = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  readOnly?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-text-muted">
        {label}
      </span>
      <input
        required={required}
        type={type}
        readOnly={readOnly}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-border-subtle bg-bg-elevated px-3 py-2.5 text-sm text-text-primary outline-none focus:border-brand/50 read-only:cursor-not-allowed read-only:opacity-65"
      />
    </label>
  );
}

export { StylemintOrdersPage as Component };
