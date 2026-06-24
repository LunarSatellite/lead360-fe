// ═══════════════════════════════════════════════════════════════
// CategoryFormDialog — Create / edit a catalog category
// ═══════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react';
import { X, Loader2, ChevronDown } from 'lucide-react';
import {
  useCreateCategory,
  useUpdateCategory,
} from '../api/business-catalog.queries';
import {
  CatalogCategoryType,
} from '../types/business-catalog.types';
import type { CatalogCategory, CatalogCategoryTypeValue } from '../types/business-catalog.types';

interface Props {
  parentLabel: string;
  category?: CatalogCategory;
  categories: CatalogCategory[];
  onClose: () => void;
}

// Nullable bool: null = inherit from profile, true/false = override
type NullableBool = boolean | null;

function parseCategoryType(val: CatalogCategoryTypeValue | null | undefined): '' | '0' | '1' {
  if (val === CatalogCategoryType.Product) return '0';
  if (val === CatalogCategoryType.Service) return '1';
  return '';
}

function parseBool(val: boolean | null | undefined): '' | 'true' | 'false' {
  if (val === true) return 'true';
  if (val === false) return 'false';
  return '';
}

function toBool(val: string): NullableBool {
  if (val === 'true') return true;
  if (val === 'false') return false;
  return null;
}

export function CategoryFormDialog({ parentLabel, category, categories, onClose }: Props) {
  const editing = !!category;
  const [name, setName] = useState(category?.name ?? '');
  const [description, setDescription] = useState(category?.description ?? '');
  const [parentId, setParentId] = useState<string | null>(category?.parentId ?? null);
  const [color, setColor] = useState(category?.color ?? '');
  const [iconUrl, setIconUrl] = useState(category?.iconUrl ?? '');
  const [sortOrder, setSortOrder] = useState(category?.sortOrder ?? 0);
  const [isActive, setIsActive] = useState(category?.isActive ?? true);

  // Per-category behavior overrides
  const [categoryType, setCategoryType] = useState<'' | '0' | '1'>(
    parseCategoryType(category?.categoryType),
  );
  const [transactionLabel, setTransactionLabel] = useState(category?.transactionLabel ?? '');
  const [collectsQuantity, setCollectsQuantity] = useState<'' | 'true' | 'false'>(
    parseBool(category?.collectsQuantity),
  );
  const [collectsTimeSlot, setCollectsTimeSlot] = useState<'' | 'true' | 'false'>(
    parseBool(category?.collectsTimeSlot),
  );
  const [collectsAddress, setCollectsAddress] = useState<'' | 'true' | 'false'>(
    parseBool(category?.collectsAddress),
  );
  const [showAdvanced, setShowAdvanced] = useState(
    // Pre-expand advanced section if any override is set
    !!(category?.collectsQuantity != null || category?.collectsTimeSlot != null || category?.collectsAddress != null),
  );

  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const isPending = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [onClose]);

  // When categoryType changes, auto-suggest sensible flag defaults (only if no override set yet)
  const handleCategoryTypeChange = (val: '' | '0' | '1') => {
    setCategoryType(val);
    if (val === '0' && collectsQuantity === '') setCollectsQuantity('true');
    if (val === '1' && collectsTimeSlot === '') setCollectsTimeSlot('true');
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      parentId: parentId || null,
      color: color.trim() || null,
      iconUrl: iconUrl.trim() || null,
      sortOrder,
      isActive,
      categoryType: categoryType === '0' ? CatalogCategoryType.Product
                  : categoryType === '1' ? CatalogCategoryType.Service
                  : null,
      transactionLabel: transactionLabel.trim() || null,
      collectsQuantity: toBool(collectsQuantity),
      collectsTimeSlot: toBool(collectsTimeSlot),
      collectsAddress:  toBool(collectsAddress),
    };
    if (editing && category) {
      updateMutation.mutate(
        { id: category.id, data: payload },
        { onSuccess: onClose },
      );
    } else {
      createMutation.mutate(payload, { onSuccess: onClose });
    }
  };

  const parentOptions = categories.filter((c) => c.id !== category?.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md mx-4 rounded-frame bg-bg-shell border border-border-subtle
                      overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
          <div>
            <h2 className="text-sm font-bold text-text-primary tracking-tight">
              {editing ? `Edit ${parentLabel}` : `Add ${parentLabel}`}
            </h2>
            <p className="text-[10px] text-text-muted mt-0.5">
              Group your offerings — e.g. specialties, departments, brands.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-sm flex items-center justify-center
                       hover:bg-glass-2 transition-colors"
          >
            <X className="w-4 h-4 text-text-muted" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-3 max-h-[70vh] overflow-y-auto">
          <Field label="Name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Mountain Bikes, Repair Services"
              className="w-full rounded-lg px-3 py-2 text-xs bg-glass-2 border border-border-subtle
                         text-text-primary placeholder:text-text-muted
                         focus:outline-none focus:border-brand transition-colors"
            />
          </Field>

          <Field label="Description (optional)">
            <textarea
              value={description}
              rows={2}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-xs bg-glass-2 border border-border-subtle
                         text-text-primary placeholder:text-text-muted
                         focus:outline-none focus:border-brand transition-colors resize-none"
            />
          </Field>

          {/* Category type — the key field that drives Product vs Service behaviour */}
          <Field label="Category type">
            <div className="flex gap-2">
              {([ ['', 'Inherit'], ['0', 'Product'], ['1', 'Service'] ] as const).map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleCategoryTypeChange(val)}
                  className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold border transition-all
                    ${categoryType === val
                      ? val === '1'
                        ? 'bg-info-soft border-info text-info'
                        : val === '0'
                          ? 'bg-success-soft border-success text-success'
                          : 'bg-brand-soft border-brand text-brand'
                      : 'bg-glass-2 border-border-subtle text-text-muted hover:border-border-medium'
                    }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-text-muted mt-1">
              {categoryType === '0' && 'Product — collects quantity. Customers tap "Order".'}
              {categoryType === '1' && 'Service — collects time slot. Customers tap "Book".'}
              {categoryType === '' && 'Inherit — uses the behavior flags set in your Business Profile.'}
            </p>
          </Field>

          {/* Transaction label — overrides the profile-level label for this category only */}
          <Field label="Button label (optional)">
            <input
              value={transactionLabel}
              onChange={(e) => setTransactionLabel(e.target.value)}
              placeholder={
                categoryType === '1' ? 'e.g. Book Service, Book Repair, Book Appointment'
                : categoryType === '0' ? 'e.g. Order, Buy, Add to Cart'
                : 'e.g. Order, Book, Enroll — overrides profile default'
              }
              maxLength={50}
              className="w-full rounded-lg px-3 py-2 text-xs bg-glass-2 border border-border-subtle
                         text-text-primary placeholder:text-text-muted
                         focus:outline-none focus:border-brand transition-colors"
            />
          </Field>

          <Field label="Parent (optional)">
            <select
              value={parentId ?? ''}
              onChange={(e) => setParentId(e.target.value || null)}
              className="w-full rounded-lg px-3 py-2 text-xs bg-glass-2 border border-border-subtle
                         text-text-primary focus:outline-none focus:border-brand transition-colors"
            >
              <option value="">Top-level</option>
              {parentOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Color (#hex)">
              <input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#3498DB"
                maxLength={7}
                className="w-full rounded-lg px-3 py-2 text-xs bg-glass-2 border border-border-subtle
                           text-text-primary placeholder:text-text-muted
                           focus:outline-none focus:border-brand transition-colors"
              />
            </Field>
            <Field label="Sort order">
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value) || 0)}
                className="w-full rounded-lg px-3 py-2 text-xs bg-glass-2 border border-border-subtle
                           text-text-primary focus:outline-none focus:border-brand transition-colors"
              />
            </Field>
          </div>

          <Field label="Icon URL (optional)">
            <input
              value={iconUrl}
              onChange={(e) => setIconUrl(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-lg px-3 py-2 text-xs bg-glass-2 border border-border-subtle
                         text-text-primary placeholder:text-text-muted
                         focus:outline-none focus:border-brand transition-colors"
            />
          </Field>

          {/* Advanced behavior overrides — collapsed by default */}
          <div className="border border-border-subtle rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setShowAdvanced(v => !v)}
              className="w-full flex items-center justify-between px-3 py-2
                         text-[11px] font-bold text-text-secondary hover:bg-glass-2 transition-colors"
            >
              <span>Advanced behavior overrides</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
              />
            </button>
            {showAdvanced && (
              <div className="px-3 pb-3 space-y-2 border-t border-border-subtle pt-2">
                <p className="text-[10px] text-text-muted">
                  Override what the bot collects for this category. "Inherit" uses the Business Profile setting.
                </p>
                {([
                  ['collectsQuantity',  collectsQuantity,  setCollectsQuantity,  'Collects quantity'],
                  ['collectsTimeSlot',  collectsTimeSlot,  setCollectsTimeSlot,  'Collects time slot'],
                  ['collectsAddress',   collectsAddress,   setCollectsAddress,   'Collects address'],
                ] as const).map(([, value, setter, label]) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-[11px] text-text-secondary">{label}</span>
                    <div className="flex gap-1">
                      {(['', 'true', 'false'] as const).map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => (setter as React.Dispatch<React.SetStateAction<'' | 'true' | 'false'>>)(opt)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all
                            ${value === opt
                              ? opt === 'true' ? 'bg-success-soft border-success text-success'
                              : opt === 'false' ? 'bg-danger-soft border-danger text-danger'
                              : 'bg-brand-soft border-brand text-brand'
                              : 'bg-glass-2 border-border-subtle text-text-muted hover:border-border-medium'
                            }`}
                        >
                          {opt === '' ? 'Inherit' : opt === 'true' ? 'Yes' : 'No'}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded border-border-medium"
            />
            <span className="text-xs text-text-primary">Active</span>
          </label>
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
            disabled={isPending || !name.trim()}
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-bold text-text-secondary mb-1">{label}</span>
      {children}
    </label>
  );
}
