const mix = (channel: number, target: number, weight: number) =>
  Math.round(channel + (target - channel) * weight);

export function applyTenantAccent(value?: string | null) {
  const hex = value?.trim().match(/^#([0-9a-f]{6})$/i)?.[1];
  if (!hex) return;
  const rgb = [0, 2, 4].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16));
  const light = rgb.map((channel) => mix(channel, 255, 0.2));
  const dark = rgb.map((channel) => mix(channel, 0, 0.18));
  const root = document.documentElement.style;
  root.setProperty('--kinmarche-accent', `#${hex.toUpperCase()}`);
  root.setProperty('--brand-rgb', rgb.join(' '));
  root.setProperty('--brand-light-rgb', light.join(' '));
  root.setProperty('--brand-dark-rgb', dark.join(' '));
}
