const providerByCode: Record<number, string> = {
  1: 'instagram',
  2: 'tiktok',
  3: 'youtube',
  4: 'facebook',
};

export function socialProviderSlug(account: Record<string, unknown>): string {
  const raw = account.providerSlug ?? account.provider ?? account.platform;
  if (typeof raw === 'number') return providerByCode[raw] ?? '';
  const text = String(raw ?? '').trim().toLowerCase();
  if (/^[1-4]$/.test(text)) return providerByCode[Number(text)] ?? '';
  return text === 'youtube shorts' ? 'youtube' : text;
}

export function isUsableSocialAccount(account: Record<string, unknown>): boolean {
  const state = account.state;
  if (typeof state === 'number') return state === 2 || state === 5;
  const text = String(state ?? '').trim().toLowerCase();
  return text === 'active' || text === 'ratelimited' || text === 'rate_limited';
}
