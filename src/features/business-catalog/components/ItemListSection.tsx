// ═══════════════════════════════════════════════════════════════
import { confirmDialog } from '@/shared/ui/confirm';
// ItemListSection — Lists items with filter / create / edit / delete
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react';
import { Plus, Pencil, Trash2, Search, Loader2, Package, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import {
  useCategories,
  useDeleteItem,
  useItems,
  useToggleItemAvailability,
} from '../api/business-catalog.queries';
import { ItemFormDialog } from './ItemFormDialog';
import type { CatalogCategory, CatalogItem } from '../types/business-catalog.types';

interface Props {
  itemLabel: string;
  // When set, the list is pre-filtered to this category and shows a back button
  selectedCategory?: CatalogCategory | null;
  onBack?: () => void;
}

export function ItemListSection({ itemLabel, selectedCategory, onBack }: Props) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>(selectedCategory?.id ?? '');
  const [availableOnly, setAvailableOnly] = useState<boolean | null>(null);
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<CatalogItem | null>(null);

  const { data: categoriesData } = useCategories(false);
  const categories: CatalogCategory[] = (categoriesData as any) ?? [];

  const filter = {
    categoryId: categoryFilter || null,
    search: search.trim() || null,
    isAvailable: availableOnly,
    page,
    pageSize: 20,
  };

  const { data, isLoading } = useItems(filter);
  const deleteMutation = useDeleteItem();
  const toggleMutation = useToggleItemAvailability();

  const items: CatalogItem[] = ((data as any)?.items as CatalogItem[]) ?? [];
  const total: number = ((data as any)?.totalCount as number) ?? 0;

  const handleDelete = async (i: CatalogItem) => {
    if (!(await confirmDialog({ message: `Delete "${i.name}"? This cannot be undone.`, confirmText: 'Delete', danger: true }))) return;
    deleteMutation.mutate(i.id);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Back button — shown only when drilled in from a category */}
          {selectedCategory && onBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold
                         text-text-muted hover:text-text-primary hover:bg-glass-2 transition-colors"
              title="Back to categories"
            >
              <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
              Back
            </button>
          )}
          <div>
            <h3 className="text-sm font-extrabold text-text-primary tracking-tight">
              {selectedCategory ? selectedCategory.name : `${itemLabel} catalog`}
            </h3>
            <p className="text-[11px] text-text-muted">{total} item{total === 1 ? '' : 's'} total</p>
          </div>
        </div>
        <button
          type="button"
          disabled={categories.length === 0}
          onClick={() => setCreating(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold
                     bg-brand text-white hover:bg-brand/90 disabled:opacity-50 transition-all"
          title={categories.length === 0 ? 'Add a category first' : undefined}
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
          Add {itemLabel.toLowerCase()}
        </button>
      </div>

      {/* Filter bar — hide category dropdown when already drilled into a category */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-[180px] rounded-lg bg-glass-2
                        border border-border-subtle px-3 py-1.5">
          <Search className="w-3.5 h-3.5 text-text-muted" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search name, description, tags…"
            className="bg-transparent text-xs text-text-primary placeholder:text-text-muted
                       focus:outline-none flex-1 min-w-0"
          />
        </div>
        {/* Only show the category dropdown when NOT drilled in from a specific category */}
        {!selectedCategory && (
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-lg px-3 py-1.5 text-xs bg-glass-2 border border-border-subtle
                       text-text-primary focus:outline-none focus:border-brand transition-colors"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}
        <select
          value={availableOnly === null ? '' : availableOnly ? 'yes' : 'no'}
          onChange={(e) => {
            const v = e.target.value;
            setAvailableOnly(v === '' ? null : v === 'yes');
            setPage(1);
          }}
          className="rounded-lg px-3 py-1.5 text-xs bg-glass-2 border border-border-subtle
                     text-text-primary focus:outline-none focus:border-brand transition-colors"
        >
          <option value="">All statuses</option>
          <option value="yes">Available</option>
          <option value="no">Unavailable</option>
        </select>
      </div>

      {isLoading ? (
        <div className="rounded-2xl bg-glass-1 border border-border-subtle px-6 py-8 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 text-text-muted animate-spin" />
          <span className="text-xs text-text-muted">Loading {itemLabel.toLowerCase()}s…</span>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl bg-glass-1 border border-border-subtle px-6 py-10 text-center">
          <Package className="w-8 h-8 text-text-muted mx-auto mb-2" strokeWidth={1.5} />
          <div className="text-xs font-bold text-text-primary">
            {search || (!selectedCategory && categoryFilter) || availableOnly !== null
              ? 'No matching items'
              : `No ${itemLabel.toLowerCase()}s yet`}
          </div>
          <p className="text-[11px] text-text-muted mt-1">
            {categories.length === 0
              ? 'Create a category first, then add your items.'
              : 'Add your first item to get started.'}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl bg-glass-1 border border-border-subtle overflow-hidden">
          {items.map((i, idx) => (
            <div
              key={i.id}
              className={[
                'flex items-center gap-3 px-4 py-3',
                idx < items.length - 1 && 'border-b border-border-subtle',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {i.imageUrl ? (
                <img
                  src={i.imageUrl}
                  alt={i.name}
                  className="w-10 h-10 rounded-lg object-cover flex-shrink-0 bg-glass-3"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-glass-3 flex items-center justify-center flex-shrink-0">
                  <Package className="w-4 h-4 text-text-muted" strokeWidth={1.6} />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-text-primary truncate">{i.name}</span>
                  {!i.isAvailable && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-danger-soft text-danger">
                      Unavailable
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-text-muted truncate">
                  {i.categoryName ?? '—'}
                  {i.price !== null
                    ? ` · ${i.currency} ${i.price.toFixed(2)} / ${i.unit}`
                    : ' · Price on inquiry'}
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() =>
                    toggleMutation.mutate({ id: i.id, available: !i.isAvailable })
                  }
                  className="w-7 h-7 rounded-sm flex items-center justify-center
                             hover:bg-glass-2 transition-colors"
                  title={i.isAvailable ? 'Mark unavailable' : 'Mark available'}
                >
                  {i.isAvailable ? (
                    <Eye className="w-3.5 h-3.5 text-text-secondary" strokeWidth={1.6} />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5 text-text-muted" strokeWidth={1.6} />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(i)}
                  className="w-7 h-7 rounded-sm flex items-center justify-center
                             hover:bg-glass-2 transition-colors"
                  title="Edit"
                >
                  <Pencil className="w-3.5 h-3.5 text-text-secondary" strokeWidth={1.6} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(i)}
                  className="w-7 h-7 rounded-sm flex items-center justify-center
                             hover:bg-danger-soft transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5 text-text-secondary hover:text-danger" strokeWidth={1.6} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > 20 && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-text-muted">
            Page {page} of {Math.max(1, Math.ceil(total / 20))}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1 rounded-lg bg-glass-2 border border-border-subtle
                         text-text-secondary hover:text-text-primary disabled:opacity-50 transition-colors"
            >
              Prev
            </button>
            <button
              type="button"
              disabled={page * 20 >= total}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 rounded-lg bg-glass-2 border border-border-subtle
                         text-text-secondary hover:text-text-primary disabled:opacity-50 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {(creating || editing) && (
        <ItemFormDialog
          itemLabel={itemLabel}
          categories={categories}
          item={editing ?? undefined}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}