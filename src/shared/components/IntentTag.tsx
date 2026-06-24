type IntentColor = 'brand' | 'success' | 'info' | 'warning' | 'danger' | 'muted';

const colorStyles: Record<IntentColor, string> = {
  brand: 'bg-brand-soft text-brand border-brand',
  success: 'bg-success-soft text-success border-[rgba(6,214,160,0.15)]',
  info: 'bg-info-soft text-info border-[rgba(59,130,246,0.12)]',
  warning: 'bg-warning-soft text-warning border-[rgba(245,158,11,0.1)]',
  danger: 'bg-danger-soft text-danger border-[rgba(244,63,94,0.1)]',
  muted: 'bg-glass-1 text-text-secondary border-border-subtle',
};

interface IntentTagProps {
  label: string;
  color?: IntentColor;
  count?: string;
  size?: 'sm' | 'md';
}

export function IntentTag({ label, color = 'muted', count, size = 'md' }: IntentTagProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 border rounded-lg font-semibold cursor-pointer transition-all duration-150 hover:brightness-125 ${
      colorStyles[color]
    } ${size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'}`}>
      {label}
      {count && <span className="text-xs font-extrabold opacity-60">{count}</span>}
    </span>
  );
}
