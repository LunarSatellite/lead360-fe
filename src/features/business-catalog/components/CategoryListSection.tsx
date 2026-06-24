// ═══════════════════════════════════════════════════════════════
// CategoryListSection — Lists categories with create/edit/delete
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react';
import { Plus, Pencil, Trash2, FolderTree, Loader2, ChevronRight } from 'lucide-react';
import { useCategories, useDeleteCategory } from '../api/business-catalog.queries';
import { CategoryFormDialog } from './CategoryFormDialog';
import type { CatalogCategory } from '../types/business-catalog.types';

interface Props {
  parentLabel: string;
  onSelectCategory: (category: CatalogCategory) => void;
}

export function CategoryListSection({ parentLabel, onSelectCategory }: Props) {
  const { data, isLoading } = useCategories(false);
  const deleteMutation = useDeleteCategory();
  const [editing, setEditing] = useState<CatalogCategory | null>(null);
  const [creating, setCreating] = useState(false);

  const categories: CatalogCategory[] = (data as any) ?? [];

  const handleDelete = (c: CatalogCategory) => {
    if (!confirm(`Delete "${c.name}"? This cannot be undone.`)) return;
    deleteMutation.mutate(c.id);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-extrabold text-text-primary tracking-tight">
            {parentLabel} groups
          </h3>
          <p className="text-[11px] text-text-muted">
            Group your offerings so customers can browse efficiently.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold
                     bg-brand text-white hover:bg-brand/90 transition-all"
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
          Add {parentLabel.toLowerCase()}
        </button>
      </div>

      {isLoading ? (
        <div className="rounded-2xl bg-glass-1 border border-border-subtle px-6 py-8 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 text-text-muted animate-spin" />
          <span className="text-xs text-text-muted">Loading {parentLabel.toLowerCase()}s…</span>
        </div>
      ) : categories.length === 0 ? (
        <div className="rounded-2xl bg-glass-1 border border-border-subtle px-6 py-10 text-center">
          <FolderTree className="w-8 h-8 text-text-muted mx-auto mb-2" strokeWidth={1.5} />
          <div className="text-xs font-bold text-text-primary">No {parentLabel.toLowerCase()}s yet</div>
          <p className="text-[11px] text-text-muted mt-1">
            Add your first one to start organizing your catalog.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl bg-glass-1 border border-border-subtle overflow-hidden">
          {categories.map((c, idx) => (
            <div
              key={c.id}
              className={[
                'flex items-center justify-between px-4 py-3 group',
                idx < categories.length - 1 && 'border-b border-border-subtle',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {/* Clickable left area — drills into items for this category */}
              <button
                type="button"
                onClick={() => onSelectCategory(c)}
                className="flex items-center gap-3 min-w-0 flex-1 text-left
                           hover:opacity-80 transition-opacity"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-glass-2"
                  style={{ backgroundColor: c.color ?? undefined }}
                >
                  <FolderTree className="w-4 h-4 text-text-secondary" strokeWidth={1.6} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-text-primary truncate">{c.name}</div>
                  <div className="text-[11px] text-text-muted truncate">
                    {c.itemCount} item{c.itemCount === 1 ? '' : 's'}
                    {c.parentId && ' · sub-category'}
                    {!c.isActive && ' · inactive'}
                  </div>
                </div>
                <ChevronRight
                  className="w-3.5 h-3.5 text-text-muted flex-shrink-0
                             opacity-0 group-hover:opacity-100 transition-opacity"
                  strokeWidth={2}
                />
              </button>

              {/* Edit / Delete buttons */}
              <div className="flex items-center gap-1 ml-2">
                <button
                  type="button"
                  onClick={() => setEditing(c)}
                  className="w-7 h-7 rounded-sm flex items-center justify-center
                             hover:bg-glass-2 transition-colors"
                  title="Edit"
                >
                  <Pencil className="w-3.5 h-3.5 text-text-secondary" strokeWidth={1.6} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(c)}
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

      {(creating || editing) && (
        <CategoryFormDialog
          parentLabel={parentLabel}
          category={editing ?? undefined}
          categories={categories}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}