import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  CheckCircle2,
  EyeOff,
  Link2Off,
  Loader2,
  Music,
  RefreshCw,
  RotateCcw,
  Search,
  TrendingUp,
} from 'lucide-react';
import {
  CITATION_STATE_LABEL,
  CitationState,
  TRACK_STATE_LABEL,
  TrackState,
  stylemintAudioApi,
  type MusicTrack,
  type TrackStateValue,
  type UnmatchedCitation,
} from '../api/stylemint-audio.api';
import { AudioTrendsTab } from '../components/AudioTrendsTab';

type Tab = 'tracks' | 'broken' | 'citations' | 'trends';

/**
 * The audio catalogue behind reels.
 *
 * Three jobs, which is why this is tabbed rather than three pages: the tracks themselves, the
 * tracks whose provider links have broken, and the citations that matched no known track. They
 * are the same catalogue seen from three angles, and an operator moves between them — a broken
 * link often ends in hiding a track, and an unmatched citation ends in pointing it at one.
 */
export function AudioPage() {
  const [tab, setTab] = useState<Tab>('citations');

  return (
    <div className="mx-auto max-w-[1500px] space-y-5">
      <div>
        <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-brand">
          Stylemint content
        </p>
        <h1 className="mt-2 flex items-center gap-2 text-2xl font-black tracking-tight text-text-primary">
          <Music className="h-5 w-5 text-brand" strokeWidth={1.6} />
          Audio
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          The music catalogue reels cite, the links that have broken, and the citations that
          matched nothing.
        </p>
      </div>

      <div className="flex gap-1 rounded-card border-thin border-border-subtle bg-bg-card p-1">
        <TabButton active={tab === 'citations'} onClick={() => setTab('citations')}
          icon={Search} label="Unmatched citations" />
        <TabButton active={tab === 'broken'} onClick={() => setTab('broken')}
          icon={Link2Off} label="Broken links" />
        <TabButton active={tab === 'tracks'} onClick={() => setTab('tracks')}
          icon={Music} label="Tracks" />
        <TabButton active={tab === 'trends'} onClick={() => setTab('trends')}
          icon={TrendingUp} label="External trends" />
      </div>

      {tab === 'citations' && <CitationsTab />}
      {tab === 'broken' && <BrokenLinksTab />}
      {tab === 'tracks' && <TracksTab />}
      {tab === 'trends' && <AudioTrendsTab />}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Music;
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

function Shell({
  query,
  empty,
  children,
  onRefresh,
  count,
}: {
  query: { isLoading: boolean; isError: boolean; error: unknown; isFetching: boolean };
  empty: string;
  children: React.ReactNode;
  onRefresh: () => void;
  count?: number;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-xs font-bold text-text-muted">
          {count === undefined ? 'Loading…' : `${count} item${count === 1 ? '' : 's'}`}
        </span>
        <button
          onClick={onRefresh}
          className="ml-auto flex items-center gap-2 rounded-card border-thin border-border-subtle px-3 py-2 text-xs font-bold text-text-secondary hover:text-brand"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${query.isFetching ? 'animate-spin' : ''}`}
            strokeWidth={1.6}
          />
          Refresh
        </button>
      </div>

      {query.isError && (
        <div className="flex items-start gap-3 rounded-frame border-thin border-rose-400/25 bg-rose-400/5 p-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" strokeWidth={1.6} />
          <p className="text-sm text-text-secondary">{(query.error as Error).message}</p>
        </div>
      )}

      {query.isLoading ? (
        <div className="flex items-center gap-3 rounded-frame border-thin border-border-subtle bg-bg-card p-8 text-sm text-text-muted">
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.6} /> Loading…
        </div>
      ) : count === 0 && !query.isError ? (
        <div className="rounded-frame border-thin border-border-subtle bg-bg-card p-10 text-center">
          <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-300" strokeWidth={1.6} />
          <p className="mt-3 text-sm font-bold text-text-primary">{empty}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-frame border-thin border-border-subtle bg-bg-card">
          {children}
        </div>
      )}
    </div>
  );
}

function CitationsTab() {
  const client = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState<UnmatchedCitation | null>(null);
  const [trackId, setTrackId] = useState('');
  const [reason, setReason] = useState('');

  const citations = useQuery({
    queryKey: ['stylemint-audio-citations'],
    queryFn: () => stylemintAudioApi.citations({ state: CitationState.Pending, pageSize: 50 }),
  });

  const refresh = () => client.invalidateQueries({ queryKey: ['stylemint-audio-citations'] });

  const act = useMutation({
    mutationFn: (kind: 'canonicalize' | 'dismiss') =>
      kind === 'canonicalize'
        ? stylemintAudioApi.canonicalize(acting!.id, trackId.trim(), true)
        : stylemintAudioApi.dismissCitation(acting!.id, reason),
    onSuccess: () => { setActing(null); setTrackId(''); setReason(''); setError(null); refresh(); },
    onError: (caught: unknown) =>
      setError(caught instanceof Error ? caught.message : 'The citation could not be resolved.'),
  });

  return (
    <>
      {error && (
        <div className="flex items-start gap-2 rounded-frame border-thin border-rose-400/25 bg-rose-400/5 p-3">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-300" strokeWidth={1.6} />
          <p className="text-xs text-text-secondary">{error}</p>
        </div>
      )}

      {acting && (
        <div className="space-y-2 rounded-frame border-thin border-amber-400/25 bg-amber-400/5 p-4">
          <p className="text-sm font-bold text-text-primary">
            “{acting.rawTrackTitle}” — {acting.rawArtistName}
          </p>
          <p className="text-[11px] text-text-muted">
            Pointing this at a track also resolves every other pending citation that normalised
            the same way, which is usually what you want: one mis-tagged track generates many.
          </p>
          <div className="flex flex-wrap gap-2">
            <input
              value={trackId}
              onChange={(event) => setTrackId(event.target.value)}
              placeholder="Music track id to point it at"
              className="min-w-[300px] flex-1 rounded-card border-thin border-border-subtle bg-bg-elevated px-3 py-2 font-mono text-xs text-text-primary outline-none focus:border-border-glow"
            />
            <button
              onClick={() => act.mutate('canonicalize')}
              disabled={act.isPending || !trackId.trim()}
              className="rounded-card bg-brand px-3 py-2 text-xs font-bold text-bg hover:bg-brand-light disabled:opacity-40"
            >
              Point at this track
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="…or a reason to dismiss it"
              className="min-w-[300px] flex-1 rounded-card border-thin border-border-subtle bg-bg-elevated px-3 py-2 text-xs text-text-primary outline-none focus:border-border-glow"
            />
            <button
              onClick={() => act.mutate('dismiss')}
              disabled={act.isPending || !reason.trim()}
              className="rounded-card border-thin border-border-medium px-3 py-2 text-xs font-bold text-text-secondary disabled:opacity-40"
            >
              Dismiss
            </button>
            <button
              onClick={() => setActing(null)}
              className="rounded-card border-thin border-border-medium px-3 py-2 text-xs font-bold text-text-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <Shell
        query={citations}
        onRefresh={refresh}
        count={citations.data?.items.length}
        empty="Every citation has been matched"
      >
        {(citations.data?.items ?? []).map((citation) => (
          <button
            key={citation.id}
            onClick={() => { setActing(citation); setError(null); }}
            className={`flex w-full items-center gap-3 border-b border-border-subtle px-4 py-3 text-left last:border-b-0 hover:bg-bg-elevated ${
              acting?.id === citation.id ? 'bg-brand-soft' : ''
            }`}
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-text-primary">
                {citation.rawTrackTitle || '(no title)'} — {citation.rawArtistName || '(no artist)'}
              </p>
              <p className="mt-0.5 truncate text-[11px] text-text-muted">
                normalised: {citation.normalizedTitle} / {citation.normalizedArtist}
                {' · '}
                {new Date(citation.citedUtc).toLocaleDateString()}
              </p>
            </div>
            <span className="shrink-0 rounded-sm border-thin border-border-subtle px-2 py-0.5 text-[10px] font-black text-text-secondary">
              {CITATION_STATE_LABEL[citation.state] ?? citation.state}
            </span>
          </button>
        ))}
      </Shell>
    </>
  );
}

function BrokenLinksTab() {
  const client = useQueryClient();
  const broken = useQuery({
    queryKey: ['stylemint-audio-broken'],
    queryFn: () => stylemintAudioApi.brokenLinks(50),
  });

  return (
    <Shell
      query={broken}
      onRefresh={() => client.invalidateQueries({ queryKey: ['stylemint-audio-broken'] })}
      count={broken.data?.items.length}
      empty="No broken provider links"
    >
      {(broken.data?.items ?? []).map((track) => (
        <TrackRow key={track.id} track={track} />
      ))}
    </Shell>
  );
}

function TracksTab() {
  const client = useQueryClient();
  const [state, setState] = useState<TrackStateValue>(TrackState.Active);

  const tracks = useQuery({
    queryKey: ['stylemint-audio-tracks', state],
    queryFn: () => stylemintAudioApi.tracks({ state, pageSize: 50 }),
  });

  const refresh = () => client.invalidateQueries({ queryKey: ['stylemint-audio-tracks'] });

  return (
    <>
      <div className="flex gap-2 rounded-frame border-thin border-border-subtle bg-bg-card p-2">
        {([TrackState.Active, TrackState.Hidden] as const).map((value) => (
          <button
            key={value}
            onClick={() => setState(value)}
            className={`rounded-sm px-3 py-1.5 text-xs font-bold transition ${
              state === value
                ? 'bg-brand-soft text-brand'
                : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
            }`}
          >
            {TRACK_STATE_LABEL[value]}
          </button>
        ))}
      </div>

      <Shell
        query={tracks}
        onRefresh={refresh}
        count={tracks.data?.items.length}
        empty={`No ${TRACK_STATE_LABEL[state].toLowerCase()} tracks`}
      >
        {(tracks.data?.items ?? []).map((track) => (
          <TrackRow key={track.id} track={track} onChanged={refresh} actionable />
        ))}
      </Shell>
    </>
  );
}

function TrackRow({
  track,
  onChanged,
  actionable,
}: {
  track: MusicTrack;
  onChanged?: () => void;
  actionable?: boolean;
}) {
  const [hiding, setHiding] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const act = useMutation({
    // hide answers 204, restore answers 200 with the track. Neither result is used -
    // the list refetches through onChanged - so normalise both to void.
    mutationFn: async (kind: 'hide' | 'restore'): Promise<void> => {
      if (kind === 'hide') await stylemintAudioApi.hideTrack(track.id, reason);
      else await stylemintAudioApi.restoreTrack(track.id);
    },
    onSuccess: () => { setHiding(false); setReason(''); setError(null); onChanged?.(); },
    onError: (caught: unknown) =>
      setError(caught instanceof Error ? caught.message : 'The track could not be changed.'),
  });

  const hidden = track.state === TrackState.Hidden;

  return (
    <div className="border-b border-border-subtle px-4 py-3 last:border-b-0">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-text-primary">
            {track.title} — {track.artist}
          </p>
          <p className="mt-0.5 truncate text-[11px] text-text-muted">
            {track.genre || 'No genre'}
            {track.mood ? ` · ${track.mood}` : ''}
            {' · cited in '}
            {track.citedInReelCount} reel{track.citedInReelCount === 1 ? '' : 's'}
          </p>
        </div>

        {/* A track cited by many reels is the expensive one to hide — say so on the row. */}
        {track.citedInReelCount > 0 && hidden && (
          <span className="shrink-0 rounded-sm border-thin border-amber-400/25 bg-amber-400/10 px-2 py-0.5 text-[10px] font-black text-amber-300">
            Hidden, still cited
          </span>
        )}

        {actionable && (
          hidden ? (
            <button
              onClick={() => act.mutate('restore')}
              disabled={act.isPending}
              className="flex shrink-0 items-center gap-1.5 rounded-card border-thin border-emerald-400/25 px-3 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-400/10 disabled:opacity-40"
            >
              <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.6} /> Restore
            </button>
          ) : (
            <button
              onClick={() => setHiding(true)}
              className="flex shrink-0 items-center gap-1.5 rounded-card border-thin border-border-medium px-3 py-1.5 text-xs font-bold text-text-secondary hover:bg-bg-elevated"
            >
              <EyeOff className="h-3.5 w-3.5" strokeWidth={1.6} /> Hide
            </button>
          )
        )}
      </div>

      {track.hiddenReason && (
        <p className="mt-1 text-[11px] text-text-muted">Hidden: {track.hiddenReason}</p>
      )}

      {hiding && (
        <div className="mt-2 flex flex-wrap gap-2">
          <input
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Why is this track being hidden? (required)"
            className="min-w-[280px] flex-1 rounded-card border-thin border-border-subtle bg-bg-elevated px-3 py-2 text-xs text-text-primary outline-none focus:border-border-glow"
          />
          <button
            onClick={() => act.mutate('hide')}
            disabled={act.isPending || !reason.trim()}
            className="rounded-card bg-brand px-3 py-2 text-xs font-bold text-bg hover:bg-brand-light disabled:opacity-40"
          >
            {act.isPending ? 'Hiding…' : 'Hide track'}
          </button>
          <button
            onClick={() => setHiding(false)}
            className="rounded-card border-thin border-border-medium px-3 py-2 text-xs font-bold text-text-secondary"
          >
            Cancel
          </button>
        </div>
      )}

      {error && <p className="mt-1 text-[11px] text-rose-300">{error}</p>}
    </div>
  );
}

export { AudioPage as Component };
