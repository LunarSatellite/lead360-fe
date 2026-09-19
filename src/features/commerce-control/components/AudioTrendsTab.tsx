import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ExternalLink, RefreshCw, TrendingUp } from 'lucide-react';
import {
  AUDIO_PROVIDER_LABEL,
  stylemintAudioApi,
  type AudioTrend,
} from '../api/stylemint-audio.api';

/**
 * External audio trends, and the unmatched half of them.
 *
 * A trend with no internal track is a song creators are already using that the catalogue cannot
 * offer them, so that queue is what the tab opens on. Momentum is the provider's own rising
 * signal, not something the platform computes.
 *
 * Lives beside the rest of the audio catalogue rather than on its own page: the action a trend
 * leads to — canonicalising it onto a known track — is on the citations tab next to it.
 */
export function AudioTrendsTab() {
  const [onlyUnmatched, setOnlyUnmatched] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const trends = useQuery({
    queryKey: ['stylemint-audio-trends', onlyUnmatched],
    queryFn: () =>
      onlyUnmatched
        ? stylemintAudioApi.unmatchedTrends({ pageSize: 25 })
        : stylemintAudioApi.trends({ pageSize: 25 }),
  });

  const refresh = useMutation({
    mutationFn: () => stylemintAudioApi.refreshTrends(),
    onSuccess: () => {
      setMessage('Trend refresh requested.');
      trends.refetch();
    },
    onError: (caught: unknown) =>
      setMessage(caught instanceof Error ? caught.message : 'The refresh could not be run.'),
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1.5">
          <Toggle active={onlyUnmatched} onClick={() => setOnlyUnmatched(true)}>
            Unmatched only
          </Toggle>
          <Toggle active={!onlyUnmatched} onClick={() => setOnlyUnmatched(false)}>
            All trends
          </Toggle>
        </div>
        <button
          disabled={refresh.isPending}
          onClick={() => refresh.mutate()}
          className="flex items-center gap-1.5 rounded-sm border-thin border-border-medium px-3 py-1.5 text-xs font-bold text-text-secondary hover:bg-glass-2 hover:text-text-primary disabled:opacity-40"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${refresh.isPending ? 'animate-spin' : ''}`}
            strokeWidth={1.6}
          />
          Refresh from providers
        </button>
      </div>

      {message && (
        <p className="rounded-card border-thin border-border-subtle bg-glass-1 p-2.5 text-xs text-text-secondary">
          {message}
        </p>
      )}

      {trends.isError ? (
        <p className="rounded-frame border-thin border-rose-400/25 bg-rose-400/5 p-4 text-sm text-text-secondary">
          {(trends.error as Error).message}
        </p>
      ) : trends.isLoading ? (
        <p className="rounded-frame border-thin border-border-subtle bg-bg-card p-8 text-sm text-text-muted">
          Loading trends…
        </p>
      ) : (trends.data?.items.length ?? 0) === 0 ? (
        <div className="rounded-frame border-thin border-border-subtle bg-bg-card p-10 text-center">
          <TrendingUp className="mx-auto h-7 w-7 text-text-muted" strokeWidth={1.6} />
          <p className="mt-3 text-sm text-text-secondary">
            {onlyUnmatched ? 'Every captured trend is matched.' : 'No trends captured.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-text-muted">{trends.data!.totalCount} trends</p>
          {trends.data!.items.map((trend) => (
            <TrendRow key={trend.id} trend={trend} />
          ))}
        </div>
      )}
    </div>
  );
}

function Toggle({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-sm border-thin px-3 py-1.5 text-xs font-bold ${
        active
          ? 'border-border-glow bg-brand-soft text-brand'
          : 'border-border-subtle text-text-secondary hover:bg-glass-2'
      }`}
    >
      {children}
    </button>
  );
}

function TrendRow({ trend }: { trend: AudioTrend }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border-thin border-border-subtle bg-glass-1 p-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-xs border-thin border-border-subtle bg-glass-2 px-1.5 py-0.5 text-[10px] font-bold text-text-secondary">
            {AUDIO_PROVIDER_LABEL[trend.provider] ?? trend.provider}
          </span>
          <span className="font-mono text-xs text-text-primary">
            {trend.externalTrackIdentifier}
          </span>
          {!trend.matchedInternalTrackRefId && (
            <span className="rounded-xs border-thin border-amber-400/30 bg-amber-400/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-300">
              unmatched
            </span>
          )}
          {trend.regionCode && (
            <span className="text-[11px] text-text-muted">{trend.regionCode}</span>
          )}
        </div>
        <p className="mt-1 text-[11px] text-text-muted">
          momentum {trend.momentumScore.toFixed(2)} · captured{' '}
          {new Date(trend.capturedUtc).toLocaleDateString()} · expires{' '}
          {new Date(trend.expiresUtc).toLocaleDateString()}
        </p>
      </div>

      {trend.listenUrl && (
        <a
          href={trend.listenUrl}
          target="_blank"
          rel="noreferrer"
          className="flex shrink-0 items-center gap-1.5 rounded-sm border-thin border-border-medium px-3 py-1.5 text-xs font-bold text-text-secondary hover:bg-glass-2 hover:text-text-primary"
        >
          <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.6} /> Listen
        </a>
      )}
    </div>
  );
}
