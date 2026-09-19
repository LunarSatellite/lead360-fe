import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Archive,
  ArrowDown,
  ArrowUp,
  EyeOff,
  LayoutGrid,
  Loader2,
  RefreshCw,
  Send,
  Trash2,
} from 'lucide-react';
import {
  COLLECTION_KIND_LABEL,
  COLLECTION_STATE_LABEL,
  CollectionState,
  stylemintCollectionsApi,
  type CollectionDetail,
  type CollectionStateValue,
  type CollectionSummary,
} from '../api/stylemint-collections.api';

/**
 * Platform-curated collections — the editorial rails on the storefront.
 *
 * Distinct from the vendor and creator collections the Vendor operations page covers: those
 * belong to a shop or a creator, these are the platform's own merchandising.
 *
 * Opens on Draft, because that is the state an operator is working on; published rails are
 * already live and mostly get read, not edited.
 */
export function CollectionsPage() {
  const client = useQueryClient();
  const [state, setState] = useState<CollectionStateValue>(CollectionState.Draft);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const list = useQuery({
    queryKey: ['stylemint-collections', state],
    queryFn: () => stylemintCollectionsApi.list({ state, pageSize: 50 }),
  });

  const refresh = () => {
    client.invalidateQueries({ queryKey: ['stylemint-collections'] });
    client.invalidateQueries({ queryKey: ['stylemint-collection'] });
  };

  return (
    <div className="mx-auto max-w-[1500px] space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-brand">
            Stylemint merchandising
          </p>
          <h1 className="mt-2 flex items-center gap-2 text-2xl font-black tracking-tight text-text-primary">
            <LayoutGrid className="h-5 w-5 text-brand" strokeWidth={1.6} />
            Collections
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            The platform's own editorial rails. Vendor and creator collections live with their
            owner, under Vendor operations.
          </p>
        </div>
        <button
          onClick={() => list.refetch()}
          className="flex items-center gap-2 rounded-card border-thin border-border-subtle px-3 py-2 text-xs font-bold text-text-secondary hover:text-brand"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${list.isFetching ? 'animate-spin' : ''}`}
            strokeWidth={1.6}
          />
          Refresh
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-frame border-thin border-border-subtle bg-bg-card p-2">
        {([CollectionState.Draft, CollectionState.Published, CollectionState.Archived] as const).map(
          (value) => (
            <button
              key={value}
              onClick={() => { setState(value); setSelectedId(null); }}
              className={`rounded-sm px-3 py-1.5 text-xs font-bold transition ${
                state === value
                  ? 'bg-brand-soft text-brand'
                  : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
              }`}
            >
              {COLLECTION_STATE_LABEL[value]}
            </button>
          ),
        )}
        <span className="ml-auto pr-2 text-xs font-bold text-text-muted">
          {list.data ? `${list.data.items.length} collection(s)` : 'Loading…'}
        </span>
      </div>

      {list.isError && (
        <div className="flex items-start gap-3 rounded-frame border-thin border-rose-400/25 bg-rose-400/5 p-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" strokeWidth={1.6} />
          <p className="text-sm text-text-secondary">{(list.error as Error).message}</p>
        </div>
      )}

      {list.isLoading ? (
        <div className="flex items-center gap-3 rounded-frame border-thin border-border-subtle bg-bg-card p-8 text-sm text-text-muted">
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.6} /> Loading collections…
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,420px)_1fr]">
          <div className="overflow-hidden rounded-frame border-thin border-border-subtle bg-bg-card">
            {(list.data?.items ?? []).map((collection) => (
              <CollectionRow
                key={collection.id}
                collection={collection}
                active={selectedId === collection.id}
                onClick={() => setSelectedId(collection.id)}
              />
            ))}
            {(list.data?.items.length ?? 0) === 0 && !list.isError && (
              <p className="p-10 text-center text-sm text-text-muted">
                No {COLLECTION_STATE_LABEL[state].toLowerCase()} collections.
              </p>
            )}
          </div>

          <CollectionEditor collectionId={selectedId} onChanged={refresh} />
        </div>
      )}
    </div>
  );
}

function CollectionRow({
  collection,
  active,
  onClick,
}: {
  collection: CollectionSummary;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 border-b border-border-subtle px-4 py-3 text-left last:border-b-0 hover:bg-bg-elevated ${
        active ? 'bg-brand-soft' : ''
      }`}
    >
      {collection.coverImageUrl ? (
        <img
          src={collection.coverImageUrl}
          alt=""
          className="h-10 w-10 shrink-0 rounded-sm object-cover"
        />
      ) : (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border-thin border-border-subtle bg-bg-elevated">
          <LayoutGrid className="h-4 w-4 text-text-muted" strokeWidth={1.6} />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-text-primary">{collection.title}</p>
        <p className="mt-0.5 truncate font-mono text-[11px] text-text-muted">
          /{collection.slug} · {collection.itemCount} item
          {collection.itemCount === 1 ? '' : 's'}
        </p>
      </div>
      {collection.itemCount === 0 && (
        <span
          title="An empty rail renders as a gap on the storefront"
          className="shrink-0 rounded-sm border-thin border-amber-400/25 bg-amber-400/10 px-2 py-0.5 text-[10px] font-black text-amber-300"
        >
          Empty
        </span>
      )}
      <span className="shrink-0 rounded-sm border-thin border-border-subtle px-2 py-0.5 text-[10px] font-black text-text-secondary">
        {COLLECTION_KIND_LABEL[collection.kind] ?? collection.kind}
      </span>
    </button>
  );
}

function CollectionEditor({
  collectionId,
  onChanged,
}: {
  collectionId: string | null;
  onChanged: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<'publish' | 'archive' | null>(null);

  const detail = useQuery({
    queryKey: ['stylemint-collection', collectionId],
    queryFn: () => stylemintCollectionsApi.get(collectionId!),
    enabled: !!collectionId,
  });

  const act = useMutation({
    mutationFn: async (job: { kind: 'publish' | 'archive' | 'remove' | 'move'; productId?: string; direction?: -1 | 1 }) => {
      const id = collectionId!;
      if (job.kind === 'publish') return stylemintCollectionsApi.publish(id);
      if (job.kind === 'archive') return stylemintCollectionsApi.archive(id);
      if (job.kind === 'remove') return stylemintCollectionsApi.removeItem(id, job.productId!);

      // Reordering sends the whole list in its new order — the endpoint takes positions, not
      // a delta, so a local swap is turned into the full sequence.
      const current = (detail.data?.items ?? []).map((item) => item.productId);
      const from = current.indexOf(job.productId!);
      const to = from + job.direction!;
      if (from < 0 || to < 0 || to >= current.length) return detail.data!;
      [current[from], current[to]] = [current[to], current[from]];
      return stylemintCollectionsApi.reorder(id, current);
    },
    onSuccess: () => { setConfirming(null); setError(null); onChanged(); },
    onError: (caught: unknown) => {
      setConfirming(null);
      setError(caught instanceof Error ? caught.message : 'The change could not be applied.');
    },
  });

  if (!collectionId) {
    return (
      <div className="rounded-frame border-thin border-border-subtle bg-bg-card p-8 text-center">
        <LayoutGrid className="mx-auto h-8 w-8 text-text-muted" strokeWidth={1.6} />
        <p className="mt-3 text-sm text-text-muted">Pick a collection to see what is in it.</p>
      </div>
    );
  }

  if (detail.isLoading) {
    return (
      <div className="flex items-center gap-3 rounded-frame border-thin border-border-subtle bg-bg-card p-8 text-sm text-text-muted">
        <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.6} /> Loading…
      </div>
    );
  }

  if (detail.isError) {
    return (
      <div className="flex items-start gap-3 rounded-frame border-thin border-rose-400/25 bg-rose-400/5 p-4">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" strokeWidth={1.6} />
        <p className="text-sm text-text-secondary">{(detail.error as Error).message}</p>
      </div>
    );
  }

  const collection = detail.data as CollectionDetail;
  const unlisted = collection.items.filter((item) => !item.isPubliclyListed);

  return (
    <div className="space-y-3 rounded-frame border-thin border-border-subtle bg-bg-card p-4">
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-text-primary">{collection.title}</p>
          {collection.subtitle && (
            <p className="mt-0.5 text-xs text-text-muted">{collection.subtitle}</p>
          )}
          <p className="mt-0.5 font-mono text-[11px] text-text-muted">/{collection.slug}</p>
        </div>
        <span className="shrink-0 rounded-sm border-thin border-border-subtle px-2 py-0.5 text-[10px] font-black text-text-secondary">
          {COLLECTION_STATE_LABEL[collection.state]}
        </span>
      </div>

      {unlisted.length > 0 && (
        <div className="flex items-start gap-2 rounded-card border-thin border-amber-400/25 bg-amber-400/5 p-2.5">
          <EyeOff className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" strokeWidth={1.6} />
          <p className="text-xs text-text-secondary">
            {unlisted.length} product{unlisted.length === 1 ? '' : 's'} in this rail{' '}
            {unlisted.length === 1 ? 'is' : 'are'} not publicly listed — {unlisted.length === 1 ? 'it' : 'they'}{' '}
            will not render on the storefront.
          </p>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-card border-thin border-rose-400/25 bg-rose-400/5 p-2.5">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-300" strokeWidth={1.6} />
          <p className="text-xs text-text-secondary">{error}</p>
        </div>
      )}

      {confirming ? (
        <div className="space-y-2 rounded-card border-thin border-amber-400/25 bg-amber-400/5 p-3">
          <p className="text-xs font-bold text-amber-300">
            {confirming === 'publish'
              ? 'Publish this collection? It appears on the storefront immediately.'
              : 'Archive this collection? It stops appearing on the storefront.'}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => act.mutate({ kind: confirming })}
              disabled={act.isPending}
              className="rounded-card bg-brand px-3 py-2 text-xs font-bold text-bg hover:bg-brand-light disabled:opacity-40"
            >
              {act.isPending ? 'Applying…' : 'Confirm'}
            </button>
            <button
              onClick={() => setConfirming(null)}
              className="rounded-card border-thin border-border-medium px-3 py-2 text-xs font-bold text-text-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {collection.state !== CollectionState.Published && (
            <button
              onClick={() => setConfirming('publish')}
              className="flex items-center gap-1.5 rounded-card border-thin border-emerald-400/25 px-3 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-400/10"
            >
              <Send className="h-3.5 w-3.5" strokeWidth={1.6} /> Publish
            </button>
          )}
          {collection.state !== CollectionState.Archived && (
            <button
              onClick={() => setConfirming('archive')}
              className="flex items-center gap-1.5 rounded-card border-thin border-border-medium px-3 py-2 text-xs font-bold text-text-secondary hover:bg-bg-elevated"
            >
              <Archive className="h-3.5 w-3.5" strokeWidth={1.6} /> Archive
            </button>
          )}
        </div>
      )}

      <div>
        <p className="text-[10px] font-extrabold uppercase tracking-wider text-text-muted">
          Products, in the order they appear
        </p>
        {collection.items.length === 0 ? (
          <p className="mt-1 text-xs text-text-muted">
            Nothing in this rail yet — it renders as a gap on the storefront.
          </p>
        ) : (
          <ul className="mt-1.5 space-y-1.5">
            {collection.items.map((item, index) => (
              <li
                key={item.productId}
                className="flex items-center gap-2 rounded-card border-thin border-border-subtle bg-bg-elevated p-2"
              >
                {item.primaryImageUrl && (
                  <img src={item.primaryImageUrl} alt="" className="h-8 w-8 rounded-sm object-cover" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-text-primary">{item.productName}</p>
                  {!item.isPubliclyListed && (
                    <p className="text-[10px] text-amber-300">Not publicly listed</p>
                  )}
                </div>
                <button
                  title="Move up"
                  disabled={index === 0 || act.isPending}
                  onClick={() => act.mutate({ kind: 'move', productId: item.productId, direction: -1 })}
                  className="rounded-sm p-1 text-text-muted hover:text-text-primary disabled:opacity-30"
                >
                  <ArrowUp className="h-3.5 w-3.5" strokeWidth={1.6} />
                </button>
                <button
                  title="Move down"
                  disabled={index === collection.items.length - 1 || act.isPending}
                  onClick={() => act.mutate({ kind: 'move', productId: item.productId, direction: 1 })}
                  className="rounded-sm p-1 text-text-muted hover:text-text-primary disabled:opacity-30"
                >
                  <ArrowDown className="h-3.5 w-3.5" strokeWidth={1.6} />
                </button>
                <button
                  title="Remove from this collection"
                  disabled={act.isPending}
                  onClick={() => act.mutate({ kind: 'remove', productId: item.productId })}
                  className="rounded-sm p-1 text-text-muted hover:text-rose-300 disabled:opacity-30"
                >
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={1.6} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export { CollectionsPage as Component };
