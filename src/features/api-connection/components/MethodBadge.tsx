const STYLES: Record<string, string> = {
  GET: 'bg-info-soft text-info',
  POST: 'bg-success-soft text-success',
  PUT: 'bg-warning-soft text-warning',
  PATCH: 'bg-brand-soft text-brand',
  DELETE: 'bg-danger-soft text-danger',
  DEL: 'bg-danger-soft text-danger',
};

interface MethodBadgeProps {
  method: string;
}

export function MethodBadge({ method }: MethodBadgeProps) {
  const m = method.toUpperCase();
  const style = STYLES[m] || 'bg-glass-2 text-text-muted';
  const label = m === 'DELETE' ? 'DEL' : m;
  return (
    <span
      className={`inline-block text-[10px] font-extrabold px-2 py-0.5 rounded tracking-wide flex-shrink-0 ${style}`}
    >
      {label}
    </span>
  );
}
