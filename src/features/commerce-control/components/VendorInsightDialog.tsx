import { BarChart3, X } from 'lucide-react';

function unwrap(value: unknown): unknown {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
  const record = value as Record<string, unknown>;
  return record.data && typeof record.data === 'object' ? record.data : record;
}

function label(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/^./, (character) => character.toUpperCase());
}

function display(value: unknown): string {
  if (value === null || value === undefined || value === '') return 'Non disponible';
  if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
  if (typeof value === 'number') return value.toLocaleString('fr-CD', { maximumFractionDigits: 2 });
  if (typeof value === 'string') {
    const date = /^\d{4}-\d{2}-\d{2}T/.test(value) ? new Date(value) : null;
    return date && !Number.isNaN(date.getTime()) ? date.toLocaleString('fr-CD') : value;
  }
  return Array.isArray(value) ? `${value.length} element(s)` : 'View details';
}

function ObjectPanel({ value }: { value: unknown }) {
  const unwrapped = unwrap(value);
  if (Array.isArray(unwrapped)) {
    if (!unwrapped.length) return <p className="py-8 text-center text-sm text-text-muted">No results.</p>;
    return (
      <div className="space-y-3">
        {unwrapped.map((item, index) => (
          <section key={index} className="rounded-2xl border border-border-subtle bg-bg-elevated p-4">
            <p className="mb-3 text-[10px] font-extrabold uppercase tracking-wider text-brand">Element {index + 1}</p>
            <ObjectPanel value={item} />
          </section>
        ))}
      </div>
    );
  }
  if (!unwrapped || typeof unwrapped !== 'object')
    return <p className="text-sm text-text-secondary">{display(unwrapped)}</p>;

  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      {Object.entries(unwrapped as Record<string, unknown>).map(([key, item]) => (
        <div key={key} className="rounded-xl border border-border-subtle bg-bg-card p-3">
          <dt className="text-[10px] font-extrabold uppercase tracking-wider text-text-muted">{label(key)}</dt>
          {item && typeof item === 'object' ? (
            <dd className="mt-2"><ObjectPanel value={item} /></dd>
          ) : (
            <dd className="mt-1 break-words text-sm font-bold text-text-primary">{display(item)}</dd>
          )}
        </div>
      ))}
    </dl>
  );
}

export function VendorInsightDialog({
  title,
  subtitle,
  data,
  onClose,
}: {
  title: string;
  subtitle: string;
  data: unknown;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center p-4">
      <button aria-label="Fermer" className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <article className="relative flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-brand/20 bg-bg-card shadow-2xl">
        <header className="flex items-start justify-between border-b border-border-subtle p-6">
          <div className="flex gap-3">
            <span className="rounded-2xl bg-brand/10 p-3 text-brand"><BarChart3 className="h-5 w-5" /></span>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-brand">Vendor intelligence</p>
              <h3 className="mt-1 text-xl font-black text-text-primary">{title}</h3>
              <p className="mt-1 text-xs text-text-muted">{subtitle}</p>
            </div>
          </div>
          <button aria-label="Fermer" onClick={onClose} className="rounded-xl p-2 text-text-muted hover:bg-bg-elevated">
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="overflow-y-auto p-6"><ObjectPanel value={data} /></div>
      </article>
    </div>
  );
}
