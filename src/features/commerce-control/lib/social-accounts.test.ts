import { describe, expect, it } from 'vitest';
import { isUsableSocialAccount, socialProviderSlug } from './social-accounts';

describe('socialProviderSlug', () => {
  it.each([
    [1, 'instagram'], [2, 'tiktok'], [3, 'youtube'], [4, 'facebook'],
    ['1', 'instagram'], ['Instagram', 'instagram'], ['YouTube Shorts', 'youtube'],
  ])('maps %s to %s', (provider, expected) => {
    expect(socialProviderSlug({ provider })).toBe(expected);
  });
});

describe('isUsableSocialAccount', () => {
  it.each([2, 5, 'Active', 'RateLimited'])('accepts usable state %s', (state) => {
    expect(isUsableSocialAccount({ state })).toBe(true);
  });

  it.each([1, 3, 4, 'Connecting', 'Expired', 'Revoked'])('rejects unusable state %s', (state) => {
    expect(isUsableSocialAccount({ state })).toBe(false);
  });
});
