import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Loader2, Save, Sparkles, X } from 'lucide-react';
import {
  stylemintDimensionsApi,
  type DimensionTagDto,
  type VendorDimensionKeyValues,
  type VendorProductDimensionTags,
  type VendorTaggableDimension,
} from '../api/stylemint-dimensions.api';
import { Button } from '@/shared/ui/primitives';

/**
 * "Product details for shoppers": the vendor's dimension tags on one product.
 *
 * Registry-driven end to end — the keys, labels, groups, value types and allowed values come
 * from `taggable` in the GET response, so a key added to the registry shows up here without a
 * release. Machine suggestions are offered inline; accepting one only puts it in the draft, and
 * it becomes a vendor tag when the draft is saved (the backend's "confirm by PUTting the value").
 * Rejecting hides it in this session only: the backend has no rejection endpoint, so an
 * unconfirmed suggestion stays a suggestion server-side.
 *
 * Rendered inside the product edit <form>, so every button here is type="button".
 */

type Draft = Record<string, string[]>;

export const dimensionTagsKey = (productId: string) => ['stylemint-vendor', 'dimension-tags', productId];

const SOURCE_LABEL: Record<string, string> = {
  vision: 'Suggested by AI from your photos',
  text: 'Suggested by AI from your description',
  measured: 'Measured',
};

export function suggestionLabel(s: Pick<DimensionTagDto, 'source' | 'confidence'>): string {
  const what = SOURCE_LABEL[s.source] ?? `Suggested (${s.source})`;
  return `${what} — ${Math.round(s.confidence * 100)}%`;
}

export function draftFrom(data: VendorProductDimensionTags): Draft {
  const draft: Draft = {};
  for (const t of data.vendorTags) (draft[t.key] ??= []).push(t.value);
  return draft;
}

/** Keys whose value set changed, each with its FULL set (empty clears) — the PUT contract. */
export function changedKeys(initial: Draft, draft: Draft): VendorDimensionKeyValues[] {
  const keys = new Set([...Object.keys(initial), ...Object.keys(draft)]);
  const same = (a: string[] = [], b: string[] = []) =>
    a.length === b.length && [...a].sort().join('\u0000') === [...b].sort().join('\u0000');
  return [...keys]
    .filter((k) => !same(initial[k], draft[k]))
    .map((k) => ({ key: k, values: draft[k] ?? [] }));
}

export function completeness(taggable: VendorTaggableDimension[], draft: Draft) {
  const filled = taggable.filter((d) => (draft[d.key] ?? []).length > 0).length;
  return { filled, total: taggable.length };
}

function formatValue(value: string) {
  return value.replace(/_/g, ' ');
}

export function ProductDimensionsPanel({ productId }: { productId: string }) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: dimensionTagsKey(productId),
    queryFn: () => stylemintDimensionsApi.productTags(productId),
    retry: false,
  });

  if (query.isLoading)
    return (
      <div className="flex h-24 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-brand" />
      </div>
    );
  if (query.isError)
    return (
      <p className="rounded-xl bg-danger-soft px-4 py-3 text-xs font-semibold text-danger-light">
        {(query.error as Error).message}
      </p>
    );
  if (!query.data) return null;

  return (
    <DimensionsForm
      // Re-mount on fresh server data so the draft restarts from what was saved.
      key={query.dataUpdatedAt}
      productId={productId}
      data={query.data}
      onSaved={(next) => queryClient.setQueryData(dimensionTagsKey(productId), next)}
    />
  );
}

function DimensionsForm({
  productId,
  data,
  onSaved,
}: {
  productId: string;
  data: VendorProductDimensionTags;
  onSaved: (next: VendorProductDimensionTags) => void;
}) {
  const initial = useMemo(() => draftFrom(data), [data]);
  const [draft, setDraft] = useState<Draft>(initial);
  const [rejected, setRejected] = useState<Set<string>>(new Set());

  const byKey = useMemo(() => new Map(data.taggable.map((d) => [d.key, d])), [data.taggable]);
  const groups = useMemo(() => {
    const map = new Map<string, VendorTaggableDimension[]>();
    for (const d of data.taggable) map.set(d.group, [...(map.get(d.group) ?? []), d]);
    return [...map.entries()];
  }, [data.taggable]);

  const verified = useMemo(() => {
    const set = new Set<string>();
    for (const t of data.effective) if (t.verified) set.add(`${t.key}\u0000${t.value}`);
    for (const t of data.vendorTags) if (t.verified) set.add(`${t.key}\u0000${t.value}`);
    return set;
  }, [data]);

  const changes = changedKeys(initial, draft);
  const { filled, total } = completeness(data.taggable, draft);

  const save = useMutation({
    mutationFn: () => stylemintDimensionsApi.saveProductTags(productId, changes),
    onSuccess: onSaved,
  });

  const setValues = (key: string, values: string[]) =>
    setDraft((current) => ({ ...current, [key]: values }));

  const accept = (s: DimensionTagDto) => {
    const d = byKey.get(s.key);
    const current = draft[s.key] ?? [];
    setValues(s.key, d?.valueType === 'multi' ? [...new Set([...current, s.value])] : [s.value]);
  };

  const pendingSuggestions = (key: string) =>
    data.suggestions.filter(
      (s) =>
        s.key === key &&
        !rejected.has(`${s.key}\u0000${s.value}\u0000${s.source}`) &&
        !(draft[key] ?? []).includes(s.value),
    );

  return (
    <section
      aria-label="Product details for shoppers"
      className="space-y-4 rounded-[20px] border border-border-subtle bg-bg-card p-4"
    >
      <header className="space-y-2">
        <h4 className="text-sm font-black text-text-primary">Product details for shoppers</h4>
        <div>
          <div
            role="meter"
            aria-label="Details completeness"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={filled}
            className="h-1.5 w-full overflow-hidden rounded-full bg-glass-2"
          >
            <div
              className="h-full bg-brand"
              style={{ width: total ? `${(filled / total) * 100}%` : '0%' }}
            />
          </div>
          <p className="mt-1 text-xs text-text-secondary">
            {filled} of {total} details filled — complete details help shoppers find you
          </p>
        </div>
      </header>

      {total === 0 && (
        <p className="text-xs text-text-muted">No details apply to this product’s department yet.</p>
      )}

      {groups.map(([group, dims]) => (
        <fieldset key={group} className="space-y-3">
          <legend className="text-[10px] font-extrabold uppercase tracking-wider text-brand">
            {formatValue(group)}
          </legend>
          {dims.map((d) => {
            const values = draft[d.key] ?? [];
            const claimPending =
              d.needsVerification &&
              values.length > 0 &&
              values.some((v) => !verified.has(`${d.key}\u0000${v}`));
            const claimVerified =
              d.needsVerification && values.length > 0 && !claimPending;
            return (
              <div key={d.key} className="space-y-1.5" data-dimension={d.key}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-text-primary">
                    {d.label}
                    {d.unit ? ` (${d.unit})` : ''}
                  </span>
                  {claimPending && (
                    <span className="rounded-sm bg-warning-soft px-1.5 py-0.5 text-[10px] font-bold text-warning">
                      Pending verification
                    </span>
                  )}
                  {claimVerified && (
                    <span className="rounded-sm bg-success-soft px-1.5 py-0.5 text-[10px] font-bold text-success">
                      Verified
                    </span>
                  )}
                </div>
                <DimensionInput dimension={d} values={values} onChange={(v) => setValues(d.key, v)} />
                {pendingSuggestions(d.key).map((s) => (
                  <div
                    key={`${s.value}-${s.source}`}
                    className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-border-glow px-2 py-1 text-[11px]"
                  >
                    <Sparkles className="h-3 w-3 text-brand" />
                    <span className="font-bold text-text-primary">{formatValue(s.value)}</span>
                    <span className="text-text-muted">{suggestionLabel(s)}</span>
                    <button
                      type="button"
                      onClick={() => accept(s)}
                      aria-label={`Accept ${s.value} for ${d.label}`}
                      className="ml-auto inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 font-bold text-success hover:bg-glass-2"
                    >
                      <Check className="h-3 w-3" /> Accept
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setRejected((r) => new Set(r).add(`${s.key}\u0000${s.value}\u0000${s.source}`))
                      }
                      aria-label={`Reject ${s.value} for ${d.label}`}
                      className="inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 font-bold text-text-muted hover:bg-glass-2"
                    >
                      <X className="h-3 w-3" /> Reject
                    </button>
                  </div>
                ))}
              </div>
            );
          })}
        </fieldset>
      ))}

      {save.isError && (
        <p className="rounded-xl bg-danger-soft px-4 py-3 text-xs font-semibold text-danger-light">
          {(save.error as Error).message}
        </p>
      )}
      {save.isSuccess && changes.length === 0 && (
        <p className="text-xs font-semibold text-success">Details saved.</p>
      )}
      {total > 0 && (
        <Button
          type="button"
          variant="primary"
          size="sm"
          disabled={save.isPending || changes.length === 0}
          onClick={() => save.mutate()}
        >
          {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save details
        </Button>
      )}
    </section>
  );
}

const input =
  'w-24 rounded-lg border border-border-subtle bg-bg-card px-2 py-1 text-xs text-text-primary';

function DimensionInput({
  dimension: d,
  values,
  onChange,
}: {
  dimension: VendorTaggableDimension;
  values: string[];
  onChange: (values: string[]) => void;
}) {
  switch (d.valueType) {
    case 'categorical':
    case 'multi': {
      const multi = d.valueType === 'multi';
      return (
        <div className="flex flex-wrap gap-1" role="group" aria-label={d.label}>
          {d.values.map((v) => {
            const on = values.includes(v);
            return (
              <button
                key={v}
                type="button"
                aria-pressed={on}
                onClick={() =>
                  onChange(
                    multi
                      ? on
                        ? values.filter((x) => x !== v)
                        : [...values, v]
                      : on
                        ? []
                        : [v],
                  )
                }
                className={`rounded-sm border-thin px-2 py-0.5 text-[11px] font-bold ${
                  on
                    ? 'border-border-glow bg-brand-soft text-brand'
                    : 'border-border-subtle text-text-secondary hover:bg-glass-2'
                }`}
              >
                {formatValue(v)}
              </button>
            );
          })}
        </div>
      );
    }
    case 'boolean': {
      const on = values[0] === 'true';
      return (
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-label={d.label}
          onClick={() => onChange(on ? [] : ['true'])}
          className={`relative h-5 w-9 rounded-full transition ${on ? 'bg-brand' : 'bg-glass-2'}`}
        >
          <span
            className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${on ? 'left-4' : 'left-0.5'}`}
          />
        </button>
      );
    }
    case 'numeric':
      return (
        <div className="flex items-center gap-1">
          <input
            type="number"
            aria-label={d.label}
            value={values[0] ?? ''}
            onChange={(e) => onChange(e.target.value.trim() ? [e.target.value.trim()] : [])}
            className={input}
          />
          {d.unit && <span className="text-[11px] text-text-muted">{d.unit}</span>}
        </div>
      );
    case 'range':
      return <RangeInput dimension={d} value={values[0]} onChange={onChange} />;
    default:
      return <p className="text-[11px] text-text-muted">Unsupported value type “{d.valueType}”.</p>;
  }
}

function RangeInput({
  dimension: d,
  value,
  onChange,
}: {
  dimension: VendorTaggableDimension;
  value: string | undefined;
  onChange: (values: string[]) => void;
}) {
  const [lo0, hi0] = (value ?? '').split('..');
  const [lo, setLo] = useState(lo0 ?? '');
  const [hi, setHi] = useState(hi0 ?? '');
  // The registry serialises a range as `lo..hi`; half a range is not a value, so it clears.
  const push = (l: string, h: string) => onChange(l.trim() && h.trim() ? [`${l.trim()}..${h.trim()}`] : []);
  return (
    <div className="flex items-center gap-1">
      <input
        type="number"
        aria-label={`${d.label} from`}
        value={lo}
        onChange={(e) => {
          setLo(e.target.value);
          push(e.target.value, hi);
        }}
        className={input}
      />
      <span className="text-[11px] text-text-muted">to</span>
      <input
        type="number"
        aria-label={`${d.label} to`}
        value={hi}
        onChange={(e) => {
          setHi(e.target.value);
          push(lo, e.target.value);
        }}
        className={input}
      />
      {d.unit && <span className="text-[11px] text-text-muted">{d.unit}</span>}
    </div>
  );
}
