// ═══════════════════════════════════════════════════════════════
// ItemFormDialog — Create / edit a catalog item
// ═══════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useCreateItem, useUpdateItem } from '../api/business-catalog.queries';
import type { CatalogCategory, CatalogItem } from '../types/business-catalog.types';

interface Props {
  itemLabel: string;
  categories: CatalogCategory[];
  item?: CatalogItem;
  onClose: () => void;
}

export function ItemFormDialog({ itemLabel, categories, item, onClose }: Props) {
  const editing = !!item;
  const [categoryId, setCategoryId] = useState(item?.categoryId ?? categories[0]?.id ?? '');
  const [name, setName] = useState(item?.name ?? '');
  const [description, setDescription] = useState(item?.description ?? '');
  const [price, setPrice] = useState<string>(
    item?.price !== null && item?.price !== undefined ? String(item.price) : '',
  );
  const [currency, setCurrency] = useState(item?.currency ?? 'USD');
  const [unit, setUnit] = useState(item?.unit ?? 'piece');
  const [imageUrl, setImageUrl] = useState(item?.imageUrl ?? '');
  const [tags, setTags] = useState(item?.tags ?? '');
  const [metadataJson, setMetadataJson] = useState(item?.metadataJson ?? '');
  const [isAvailable, setIsAvailable] = useState(item?.isAvailable ?? true);
  const [sortOrder, setSortOrder] = useState(item?.sortOrder ?? 0);
  const [jsonError, setJsonError] = useState<string | null>(null);

  const createMutation = useCreateItem();
  const updateMutation = useUpdateItem();
  const isPending = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [onClose]);

  const handleSubmit = () => {
    if (!name.trim() || !categoryId) return;

    // Validate metadataJson if provided
    let cleanMeta: string | null = null;
    if (metadataJson.trim()) {
      try {
        JSON.parse(metadataJson);
        cleanMeta = metadataJson;
      } catch {
        setJsonError('Metadata must be valid JSON.');
        return;
      }
    }

    const payload = {
      categoryId,
      name: name.trim(),
      description: description.trim() || null,
      price: price.trim() === '' ? null : Number(price),
      currency: currency.trim() || 'USD',
      unit: unit.trim() || 'piece',
      imageUrl: imageUrl.trim() || null,
      tags: tags.trim() || null,
      metadataJson: cleanMeta,
      isAvailable,
      sortOrder,
    };

    if (editing && item) {
      updateMutation.mutate({ id: item.id, data: payload }, { onSuccess: onClose });
    } else {
      createMutation.mutate(payload, { onSuccess: onClose });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="drawer-slide-in relative w-[480px] h-full flex flex-col bg-bg-shell border-l border-thin border-border-subtle" style={{ boxShadow: '-8px 0 40px rgba(0,0,0,0.5)' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
          <h2 className="text-sm font-bold text-text-primary tracking-tight">
            {editing ? `Edit ${itemLabel}` : `Add ${itemLabel}`}
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-sm flex items-center justify-center
                       hover:bg-glass-2 transition-colors"
          >
            <X className="w-4 h-4 text-text-muted" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          <Field label="Category">
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-xs bg-glass-2 border border-border-subtle
                         text-text-primary focus:outline-none focus:border-brand transition-colors"
            >
              {categories.length === 0 && <option value="">No categories yet — add one first</option>}
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`e.g. ${itemLabel} name`}
              className={inputCls}
            />
          </Field>

          <Field label="Description (optional)">
            <textarea
              value={description}
              rows={2}
              onChange={(e) => setDescription(e.target.value)}
              className={textareaCls}
            />
          </Field>

          <div className="grid grid-cols-3 gap-2 items-end">
            <Field label="Price (leave blank = on inquiry)">
              <input
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Currency">
              <input
                value={currency}
                onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                maxLength={10}
                className={inputCls}
              />
            </Field>
            <Field label="Unit">
              <input
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="piece / night / hour"
                className={inputCls}
              />
            </Field>
          </div>

          <Field label="Image URL (optional)">
            <input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
              className={inputCls}
            />
          </Field>

          <Field label="Tags (comma-separated, optional)">
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="organic, gluten-free"
              className={inputCls}
            />
          </Field>

          <Field label="Custom data (JSON, optional)">
            <textarea
              value={metadataJson}
              rows={3}
              spellCheck={false}
              onChange={(e) => {
                setMetadataJson(e.target.value);
                setJsonError(null);
              }}
              placeholder='{"specialty":"Cardiology","experience":"10 yrs"}'
              className={`${textareaCls} font-mono`}
            />
            {jsonError && <p className="text-[10px] text-danger mt-1">{jsonError}</p>}
          </Field>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isAvailable}
                onChange={(e) => setIsAvailable(e.target.checked)}
                className="rounded border-border-medium"
              />
              <span className="text-xs text-text-primary">Available now</span>
            </label>
            <Field label="Sort">
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value) || 0)}
                className={`${inputCls} w-20`}
              />
            </Field>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border-subtle">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-text-secondary
                       hover:text-text-primary hover:bg-glass-2 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isPending || !name.trim() || !categoryId}
            onClick={handleSubmit}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold
                       bg-brand text-white hover:bg-brand/90 disabled:opacity-50 transition-all"
          >
            {isPending && <Loader2 className="w-3 h-3 animate-spin" />}
            {editing ? 'Save changes' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputCls =
  'w-full rounded-lg px-3 py-2 text-xs bg-glass-2 border border-border-subtle text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand transition-colors';

const textareaCls =
  'w-full rounded-lg px-3 py-2 text-xs bg-glass-2 border border-border-subtle text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand transition-colors resize-none';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-bold text-text-secondary mb-1">{label}</span>
      {children}
    </label>
  );
}
