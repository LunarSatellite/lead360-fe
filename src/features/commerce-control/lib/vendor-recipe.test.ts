import { describe, expect, it } from 'vitest';
import { buildVendorRecipePayload, type VendorRecipeDraft } from './vendor-recipe';

const draft: VendorRecipeDraft = {
  title: 'Market tomatoes',
  musicTrackRefId: '11111111-1111-4111-8111-111111111111',
  productVariantIds: '22222222-2222-4222-8222-222222222222, 33333333-3333-4333-8333-333333333333',
  brandStoryAnchor: 'From the market to the family kitchen',
  moodLabel: 'Chaleureux',
  durationSeconds: '40',
  songTitle: 'Kinshasa matin',
  artist: 'Artiste demo',
  caption: 'Freshness that brings people together.',
};

describe('buildVendorRecipePayload', () => {
  it('creates a complete, continuous, lock-ready 40-second recipe', () => {
    const payload = buildVendorRecipePayload(draft);

    expect(payload.context.intendedDurationSeconds).toBe(40);
    expect(payload.context.productVariantIds).toHaveLength(2);
    expect(payload.context.targetAudience.primaryRegions).toEqual(['Kinshasa']);
    expect(payload.segment).toMatchObject({ startMs: 0, endMs: 40000 });
    expect(payload.beats).toHaveLength(3);
    expect(payload.beats[0].reelTimeStartMs).toBe(0);
    expect(payload.beats[0].reelTimeEndMs).toBe(payload.beats[1].reelTimeStartMs);
    expect(payload.beats[1].reelTimeEndMs).toBe(payload.beats[2].reelTimeStartMs);
    expect(payload.beats[2].reelTimeEndMs).toBe(40000);
    expect(payload.beats.map((beat) => beat.songTimeEndMs - beat.songTimeStartMs).reduce((a, b) => a + b, 0)).toBe(40000);
    expect(payload.captionVariants).toHaveLength(3);
    expect(payload.platformAdaptations.map(({ platform }) => platform)).toEqual([1, 2, 3, 4]);
    expect(payload.reasoning.signalsUsed).toHaveLength(3);
    expect(payload.reasoning.dataPoints).toHaveLength(1);
  });

  it.each(['4', '181', '40.5', 'abc'])('rejects invalid duration %s', (durationSeconds) => {
    expect(() => buildVendorRecipePayload({ ...draft, durationSeconds })).toThrow(/duration/i);
  });

  it('rejects missing required content and malformed identifiers', () => {
    expect(() => buildVendorRecipePayload({ ...draft, caption: ' ' })).toThrow(/caption/i);
    expect(() => buildVendorRecipePayload({ ...draft, musicTrackRefId: 'not-an-id' })).toThrow(/music track/i);
    expect(() => buildVendorRecipePayload({ ...draft, productVariantIds: 'not-an-id' })).toThrow(/product variant/i);
  });
});
