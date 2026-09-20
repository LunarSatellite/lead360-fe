import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, Scissors, Trash2 } from 'lucide-react';
import { stylemintHotSegmentsApi, type HotSegment } from '../api/stylemint-hot-segments.api';

/**
 * The hot segments on one track — the parts creators are pointed at when they cut a reel.
 *
 * Expanded from a track row rather than given its own page: every endpoint takes a trackId and
 * the catalogue is the only thing that hands one out.
 *
 * Ordinal defaults to the next free slot, because the backend 409s on a duplicate and guessing
 * wrong is the most likely way to hit that.
 */
export function HotSegmentsEditor({ trackId }: { trackId: string }) {
  const client = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [start, setStart] = useState(0);
  const [label, setLabel] = useState('');
  const [error, setError] = useState<string | null>(null);

  const segments = useQuery({
    queryKey: ['stylemint-hot-segments', trackId],
    queryFn: () => stylemintHotSegmentsApi.list(trackId),
  });

  const refresh = () =>
    client.invalidateQueries({ queryKey: ['stylemint-hot-segments', trackId] });

  const nextOrdinal =
    (segments.data ?? []).reduce((max, s) => Math.max(max, s.ordinal), 0) + 1;

  const add = useMutation({
    mutationFn: () => stylemintHotSegmentsApi.add(trackId, start, nextOrdinal, label.trim()),
    onSuccess: () => {
      setAdding(false);
      setStart(0);
      setLabel('');
      setError(null);
      refresh();
    },
    onError: (caught: unknown) =>
      setError(caught instanceof Error ? caught.message : 'The segment could not be added.'),
  });

  const remove = useMutation({
    mutationFn: (segmentId: string) => stylemintHotSegmentsApi.remove(trackId, segmentId),
    onSuccess: refresh,
    onError: (caught: unknown) =>
      setError(caught instanceof Error ? caught.message : 'The segment could not be removed.'),
  });

  return (
    <div className="mt-2 rounded-sm border-thin border-border-subtle bg-bg-input p-2.5">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-text-secondary">
          <Scissors className="h-3 w-3" strokeWidth={1.6} /> Hot segments
        </p>
        <button
          onClick={() => {
            setAdding((v) => !v);
            setError(null);
          }}
          className="flex items-center gap-1 rounded-sm border-thin border-border-medium px-2 py-0.5 text-[10px] font-bold text-text-secondary hover:bg-glass-2 hover:text-text-primary"
        >
          <Plus className="h-3 w-3" strokeWidth={1.6} /> Add
        </button>
      </div>

      {segments.isLoading ? (
        <p className="mt-1.5 text-[11px] text-text-muted">Loading…</p>
      ) : segments.isError ? (
        <p className="mt-1.5 text-[11px] text-rose-300">{(segments.error as Error).message}</p>
      ) : (segments.data?.length ?? 0) === 0 ? (
        <p className="mt-1.5 text-[11px] text-text-muted">
          No segments yet — creators get the whole track.
        </p>
      ) : (
        <ul className="mt-1.5 space-y-1">
          {[...segments.data!]
            .sort((a, b) => a.ordinal - b.ordinal)
            .map((segment) => (
              <SegmentRow
                key={segment.id}
                segment={segment}
                busy={remove.isPending}
                onRemove={() => remove.mutate(segment.id)}
              />
            ))}
        </ul>
      )}

      {adding && (
        <div className="mt-2 grid gap-1.5 sm:grid-cols-[6rem_1fr_auto]">
          <input
            type="number"
            min={0}
            value={start}
            onChange={(e) => setStart(Number(e.target.value))}
            placeholder="Start s"
            className={field}
          />
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={`Label (ordinal ${nextOrdinal})`}
            className={field}
          />
          <button
            disabled={!label.trim() || add.isPending}
            onClick={() => add.mutate()}
            className="flex items-center gap-1 rounded-sm bg-brand px-2.5 py-1 text-[11px] font-bold text-bg hover:bg-brand-light disabled:opacity-40"
          >
            {add.isPending && <Loader2 className="h-3 w-3 animate-spin" strokeWidth={1.6} />}
            Save
          </button>
        </div>
      )}

      {error && <p className="mt-1.5 text-[11px] text-rose-300">{error}</p>}
    </div>
  );
}

function SegmentRow({
  segment,
  busy,
  onRemove,
}: {
  segment: HotSegment;
  busy: boolean;
  onRemove: () => void;
}) {
  return (
    <li className="flex items-center justify-between gap-2 text-[11px]">
      <span className="min-w-0 truncate text-text-secondary">
        <span className="font-mono text-text-muted">#{segment.ordinal}</span>{' '}
        <span className="font-mono text-text-muted">{formatSeconds(segment.segmentStartSeconds)}</span>{' '}
        {segment.label}
      </span>
      <button
        disabled={busy}
        onClick={onRemove}
        className="shrink-0 rounded-sm p-1 text-text-muted hover:bg-glass-2 hover:text-rose-300 disabled:opacity-40"
      >
        <Trash2 className="h-3 w-3" strokeWidth={1.6} />
      </button>
    </li>
  );
}

/** Seconds read as m:ss — a start of 95 is easier to place as 1:35. */
function formatSeconds(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

const field =
  'w-full rounded-sm border-thin border-border-subtle bg-bg-card px-2 py-1 text-[11px] text-text-primary placeholder:text-text-muted focus:border-border-glow focus:outline-none';
