import { stylemintOperationsApi } from './stylemint-operations.api';

/**
 * Typed client for the Stylemint audio catalogue — the music tracks reels cite.
 *
 * Three operator surfaces, all ContentMod, no step-up MFA:
 *  - tracks: browse, hide a track from reuse, restore it
 *  - broken-links queue: tracks whose provider links stopped resolving
 *  - unmatched citations: audio a creator cited that matched no known track, to be
 *    canonicalised onto one or dismissed
 */

export const TrackState = { Active: 1, Hidden: 2 } as const;
export type TrackStateValue = (typeof TrackState)[keyof typeof TrackState];
export const TRACK_STATE_LABEL: Record<number, string> = { 1: 'Active', 2: 'Hidden' };

export const CitationState = { Pending: 1, Resolved: 2, Dismissed: 3 } as const;
export type CitationStateValue = (typeof CitationState)[keyof typeof CitationState];
export const CITATION_STATE_LABEL: Record<number, string> = {
  1: 'Pending',
  2: 'Resolved',
  3: 'Dismissed',
};

export type MusicTrack = {
  id: string;
  title: string;
  artist: string;
  durationSecondsApprox: number;
  genre: string;
  mood: string;
  language?: string | null;
  isInstrumental: boolean;
  citedInReelCount: number;
  avgCitedReelCompletionRate: number;
  state: number;
  hiddenReason?: string | null;
};

export type UnmatchedCitation = {
  id: string;
  reelId: string;
  creatorAccountId: string;
  rawTrackTitle: string;
  rawArtistName: string;
  normalizedTitle: string;
  normalizedArtist: string;
  providerUrl?: string | null;
  citedUtc: string;
  state: number;
};

export type Paged<T> = {
  items: T[];
  totalCount: number;
  nextCursor?: string | null;
};

function unwrap<T>(response: { status: number; body: unknown }): T {
  if (response.status >= 200 && response.status < 300) return response.body as T;

  const body = response.body as { title?: string; message?: string } | undefined;
  const detail = body?.title ?? body?.message;

  if (response.status === 403) {
    throw new Error(
      detail ??
        'Curating the audio catalogue takes the Stylemint ContentMod role. ' +
          'An administrator grants it.',
    );
  }
  throw new Error(detail ?? `The audio surface returned HTTP ${response.status}.`);
}


/**
 * External trends — what is rising on YouTube, Spotify, SoundCloud and TikTok, and which of
 * those the platform has not yet matched to a track it knows.
 *
 * The unmatched queue is the actionable half: a trend nobody has matched is a song creators are
 * already using that the catalogue cannot offer them.
 */

export const AudioProvider = {
  YouTube: 1,
  Spotify: 2,
  SoundCloud: 3,
  TikTokSound: 4,
  Other: 99,
} as const;
export type AudioProviderValue = (typeof AudioProvider)[keyof typeof AudioProvider];

export const AUDIO_PROVIDER_LABEL: Record<number, string> = {
  1: 'YouTube',
  2: 'Spotify',
  3: 'SoundCloud',
  4: 'TikTok',
  99: 'Other',
};

export type AudioTrend = {
  id: string;
  provider: number;
  externalTrackIdentifier: string;
  matchedInternalTrackRefId?: string | null;
  momentumScore: number;
  regionCode?: string | null;
  capturedUtc: string;
  expiresUtc: string;
  listenUrl?: string | null;
};

export type TrendPage = {
  items: AudioTrend[];
  totalCount: number;
  nextCursor?: string | null;
  pageSize: number;
};

export const stylemintAudioApi = {
  tracks: async (params: { state?: TrackStateValue; pageSize?: number }): Promise<Paged<MusicTrack>> => {
    const query = new URLSearchParams();
    if (params.state) query.set('state', String(params.state));
    query.set('pageSize', String(params.pageSize ?? 25));

    return unwrap<Paged<MusicTrack>>(
      await stylemintOperationsApi.invoke({
        method: 'GET',
        path: 'v1/admin/audio/tracks',
        query: query.toString(),
      }),
    );
  },

  /** Tracks whose provider links stopped resolving — a reel citing one has a dead link. */
  brokenLinks: async (pageSize = 25): Promise<Paged<MusicTrack>> =>
    unwrap<Paged<MusicTrack>>(
      await stylemintOperationsApi.invoke({
        method: 'GET',
        path: 'v1/admin/audio/links-broken-queue',
        query: `pageSize=${pageSize}`,
      }),
    ),

  /** Answers 204 with no body - refetch the list rather than using a return value. */
  hideTrack: async (trackId: string, reason: string): Promise<void> => {
    unwrap<void>(
      await stylemintOperationsApi.invoke({
        method: 'POST',
        path: `v1/admin/audio/tracks/${encodeURIComponent(trackId)}/hide`,
        body: JSON.stringify({ reason }),
      }),
    );
  },

  restoreTrack: async (trackId: string): Promise<MusicTrack> =>
    unwrap<MusicTrack>(
      await stylemintOperationsApi.invoke({
        method: 'POST',
        path: `v1/admin/audio/tracks/${encodeURIComponent(trackId)}/restore`,
      }),
    ),

  citations: async (params: {
    state?: CitationStateValue;
    pageSize?: number;
  }): Promise<Paged<UnmatchedCitation>> => {
    const query = new URLSearchParams();
    if (params.state) query.set('state', String(params.state));
    query.set('pageSize', String(params.pageSize ?? 25));

    return unwrap<Paged<UnmatchedCitation>>(
      await stylemintOperationsApi.invoke({
        method: 'GET',
        path: 'v1/admin/audio/unmatched-citations',
        query: query.toString(),
      }),
    );
  },

  /**
   * Points an unmatched citation at a real track. `includeSiblings` also resolves every other
   * pending citation that normalised to the same title and artist, which is usually what you
   * want — one mis-tagged track generates many citations.
   */
  canonicalize: async (
    unmatchedId: string,
    musicTrackRefId: string,
    includeSiblings = true,
  ): Promise<unknown> =>
    unwrap<unknown>(
      await stylemintOperationsApi.invoke({
        method: 'POST',
        path: `v1/admin/audio/unmatched-citations/${encodeURIComponent(unmatchedId)}/canonicalize`,
        body: JSON.stringify({ musicTrackRefId, includeSiblings }),
      }),
    ),

  /** Everything captured, matched or not. */
  trends: async (params: { provider?: AudioProviderValue; pageSize?: number } = {}): Promise<TrendPage> => {
    const query = new URLSearchParams();
    if (params.provider) query.set('provider', String(params.provider));
    query.set('pageSize', String(params.pageSize ?? 25));

    return unwrap<TrendPage>(
      await stylemintOperationsApi.invoke({
        method: 'GET',
        path: 'v1/admin/audio/trends',
        query: query.toString(),
      }),
    );
  },

  /** Trends with no internal track - songs creators use that the catalogue cannot offer. */
  unmatchedTrends: async (params: { provider?: AudioProviderValue; pageSize?: number } = {}): Promise<TrendPage> => {
    const query = new URLSearchParams();
    if (params.provider) query.set('provider', String(params.provider));
    query.set('pageSize', String(params.pageSize ?? 25));

    return unwrap<TrendPage>(
      await stylemintOperationsApi.invoke({
        method: 'GET',
        path: 'v1/admin/audio/trends/unmatched-queue',
        query: query.toString(),
      }),
    );
  },

  /** Re-pulls from the providers rather than waiting for the schedule. */
  refreshTrends: async (): Promise<Record<string, unknown>> =>
    unwrap<Record<string, unknown>>(
      await stylemintOperationsApi.invoke({
        method: 'POST',
        path: 'v1/admin/audio/trends/refresh',
      }),
    ),

  dismissCitation: async (unmatchedId: string, reason: string): Promise<unknown> =>
    unwrap<unknown>(
      await stylemintOperationsApi.invoke({
        method: 'POST',
        path: `v1/admin/audio/unmatched-citations/${encodeURIComponent(unmatchedId)}/dismiss`,
        body: JSON.stringify({ reason }),
      }),
    ),
};
