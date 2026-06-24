type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DEL' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

const methodStyles: Record<string, string> = {
  GET: 'bg-success-soft text-success',
  POST: 'bg-info-soft text-info',
  PUT: 'bg-warning-soft text-warning',
  DEL: 'bg-danger-soft text-danger',
  DELETE: 'bg-danger-soft text-danger',
  PATCH: 'bg-brand-soft text-brand',
  HEAD: 'bg-glass-2 text-text-muted',
  OPTIONS: 'bg-glass-2 text-text-muted',
};

interface HttpMethodBadgeProps {
  method: HttpMethod;
}

export function HttpMethodBadge({ method }: HttpMethodBadgeProps) {
  const style = methodStyles[method.toUpperCase()] || 'bg-glass-2 text-text-muted';
  const label = method.toUpperCase() === 'DELETE' ? 'DEL' : method.toUpperCase();
  return (
    <span className={`inline-block text-xs font-extrabold px-3 py-1.5 rounded-lg tracking-wide flex-shrink-0 ${style}`}>
      {label}
    </span>
  );
}
