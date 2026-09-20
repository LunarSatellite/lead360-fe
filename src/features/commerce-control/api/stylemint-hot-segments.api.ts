import { stylemintOperationsApi } from './stylemint-operations.api';

/**
 * Hot segments — the parts of a track creators should cut to.
 *
 * Scoped to one track, which is why this lives beside the track list rather than on a page of
 * its own: the endpoints all take a trackId and the catalogue is the only thing that hands one
 * out. Ordinal decides the order they are offered in; the start second is where the segment
 * begins.
 */

export type HotSegment = {
  id: string;
  musicTrackRefId: string;
  segmentStartSeconds: number;
  ordinal: number;
  label: string;
  createdUtc: string;
};

function base(trackId: string): string {
  return `v1/admin/audio/tracks/${encodeURIComponent(trackId)}/hot-segments`;
}

function unwrap<T>(response: { status: number; body: unknown }): T {
  if (response.status >= 200 && response.status < 300) return response.body as T;

  const body = response.body as { title?: string; message?: string } | undefined;
  const detail = body?.title ?? body?.message;

  if (response.status === 409) {
    throw new Error(detail ?? 'A segment already occupies that ordinal on this track.');
  }
  if (response.status === 403) {
    throw new Error(detail ?? 'Curating hot segments takes the Stylemint ContentMod role.');
  }
  throw new Error(detail ?? `The hot-segment surface returned HTTP ${response.status}.`);
}

export const stylemintHotSegmentsApi = {
  list: async (trackId: string): Promise<HotSegment[]> =>
    unwrap<HotSegment[]>(
      await stylemintOperationsApi.invoke({ method: 'GET', path: base(trackId) }),
    ),

  add: async (
    trackId: string,
    segmentStartSeconds: number,
    ordinal: number,
    label: string,
  ): Promise<HotSegment> =>
    unwrap<HotSegment>(
      await stylemintOperationsApi.invoke({
        method: 'POST',
        path: base(trackId),
        body: JSON.stringify({ segmentStartSeconds, ordinal, label }),
      }),
    ),

  remove: async (trackId: string, segmentId: string): Promise<void> => {
    unwrap<void>(
      await stylemintOperationsApi.invoke({
        method: 'DELETE',
        path: `${base(trackId)}/${encodeURIComponent(segmentId)}`,
      }),
    );
  },
};
