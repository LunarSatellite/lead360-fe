import type { Node } from '@xyflow/react';
import { Trash2 } from 'lucide-react';
import { useCategories } from '@/features/business-catalog/api/business-catalog.queries';
import type { CatalogCategory } from '@/features/business-catalog/types/business-catalog.types';
import type { FlowNodeData } from '../types/flow.types';
import { NODE_TYPE_META } from '../types/flow.types';

interface NodeConfigPanelProps {
  node: Node<FlowNodeData> | null;
  onUpdate: (nodeId: string, data: Partial<FlowNodeData>) => void;
  onDelete: (nodeId: string) => void;
}

const CATALOG_ACTION_OPTIONS = [
  { value: 'browse', label: '📂 Browse all categories' },
  { value: 'items', label: '🛍️ Show items from one category' },
  { value: 'detail', label: '🔍 Item detail' },
  { value: 'order', label: '🛒 Start order' },
  { value: 'track', label: '📋 Track an order' },
];

const CHECKOUT_STEP_LABELS: Record<string, string> = {
  quantity: '🔢 Quantity',
  notes: '📝 Requirement / notes',
  'ask-more': '➕ "Add another item?"',
  name: '🙋 Customer name',
  phone: '📞 Phone number',
  address: '📍 Pickup or delivery address',
};
const ALL_CHECKOUT_STEPS = ['quantity', 'notes', 'ask-more', 'name', 'phone', 'address'];

/** Keeps every known step present (order-only editor — inclusion is controlled by the category's Collects* flags, not here). */
function normalizeCheckoutOrder(raw: unknown): string[] {
  const known = Array.isArray(raw)
    ? raw.filter((t): t is string => typeof t === 'string' && ALL_CHECKOUT_STEPS.includes(t))
    : [];
  const missing = ALL_CHECKOUT_STEPS.filter((t) => !known.includes(t));
  return [...known, ...missing];
}

export function NodeConfigPanel({ node, onUpdate, onDelete }: NodeConfigPanelProps) {
  // Called unconditionally (Rules of Hooks) — cheap/cached, only rendered when a catalog node is selected.
  const { data: categoriesData } = useCategories(true);
  const categories: CatalogCategory[] = (categoriesData as any) ?? [];

  if (!node) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 px-4 text-center">
        <div className="text-3xl mb-3 opacity-40">🖱️</div>
        <p className="text-xs text-text-muted">Select a node on the canvas to configure it</p>
      </div>
    );
  }

  const data = node.data as FlowNodeData;
  const meta = NODE_TYPE_META[data.nodeType];
  const catalogConfig = data.config as { action?: string; categoryId?: string; checkoutOrder?: unknown };
  const checkoutOrder = normalizeCheckoutOrder(catalogConfig?.checkoutOrder);

  const moveCheckoutStep = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= checkoutOrder.length) return;
    const next = [...checkoutOrder];
    [next[idx], next[target]] = [next[target], next[idx]];
    onUpdate(node.id, { config: { ...(data.config || {}), checkoutOrder: next } });
  };

  return (
    <div className="p-3 space-y-3">
      {/* Node header */}
      <div className="flex items-center gap-2 pb-2 border-b border-border-subtle">
        <div
          className="w-7 h-7 rounded-md flex items-center justify-center text-sm"
          style={{ background: meta?.bgClass ? undefined : '#F1F5F9' }}
        >
          {meta?.icon || '📦'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold text-text-primary truncate">{data.label}</div>
          <div className="text-[10px] text-text-muted">{meta?.label || data.nodeType} • {node.id}</div>
        </div>
      </div>

      {/* Name */}
      <div>
        <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">Name</label>
        <input
          value={data.label}
          onChange={(e) => onUpdate(node.id, { label: e.target.value })}
          className="w-full px-2.5 py-1.5 border border-border-subtle rounded-lg text-xs outline-none focus:border-brand bg-white"
        />
      </div>

      {/* Type (read-only) */}
      <div>
        <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">Type</label>
        <input
          value={meta?.label || data.nodeType}
          disabled
          className="w-full px-2.5 py-1.5 border border-border-subtle rounded-lg text-xs bg-glass-1 text-text-muted"
        />
      </div>

      {/* Catalog node: friendly Action + Category controls (avoids hand-editing raw JSON) */}
      {data.nodeType === 'catalog' && (
        <>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">Action</label>
            <select
              value={catalogConfig?.action ?? 'browse'}
              onChange={(e) =>
                onUpdate(node.id, { config: { ...(data.config || {}), action: e.target.value } })
              }
              className="w-full px-2.5 py-1.5 border border-border-subtle rounded-lg text-xs outline-none focus:border-brand bg-white"
            >
              {CATALOG_ACTION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {catalogConfig?.action === 'items' && (
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">Category</label>
              <select
                value={catalogConfig?.categoryId ?? ''}
                onChange={(e) =>
                  onUpdate(node.id, {
                    config: { ...(data.config || {}), categoryId: e.target.value || undefined },
                  })
                }
                className="w-full px-2.5 py-1.5 border border-border-subtle rounded-lg text-xs outline-none focus:border-brand bg-white"
              >
                <option value="">Select a category…</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              <p className="mt-1 text-[10px] text-text-muted">
                This button will jump straight into this category's items — customers won't see the "choose a category" list first.
              </p>
            </div>
          )}

          {catalogConfig?.action === 'order' && (
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">Checkout order</label>
              <p className="mb-1.5 text-[10px] text-text-muted">
                What order the bot asks for these. Steps this business doesn't collect (per its catalog settings) are skipped automatically — this only controls order.
              </p>
              <div className="space-y-1">
                {checkoutOrder.map((step, idx) => (
                  <div key={step} className="flex items-center gap-1.5 rounded-lg border border-border-subtle bg-white px-2 py-1.5 text-xs">
                    <span className="flex-1">{CHECKOUT_STEP_LABELS[step] ?? step}</span>
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveCheckoutStep(idx, -1)}
                      className="flex h-5 w-5 items-center justify-center rounded hover:bg-glass-1 disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      disabled={idx === checkoutOrder.length - 1}
                      onClick={() => moveCheckoutStep(idx, 1)}
                      className="flex h-5 w-5 items-center justify-center rounded hover:bg-glass-1 disabled:opacity-30"
                    >
                      ↓
                    </button>
                  </div>
                ))}
              </div>

          <div className="mt-2">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">Notes prompt</label>
            <p className="mb-1.5 text-[10px] text-text-muted">
              What the bot asks when collecting special instructions for an item. Leave blank to use the default.
            </p>
            <textarea
              value={(catalogConfig as { notesPrompt?: string } | undefined)?.notesPrompt ?? ''}
              onChange={(e) =>
                onUpdate(node.id, {
                  config: { ...(data.config || {}), notesPrompt: e.target.value || undefined },
                })
              }
              rows={2}
              placeholder="e.g. Any special instructions? (reply 'no' if none)"
              className="w-full px-2.5 py-1.5 border border-border-subtle rounded-lg text-xs outline-none focus:border-brand bg-white resize-none"
            />
          </div>            </div>
          )}
        </>
      )}

      {/* Config JSON (editable for advanced users) */}
      <div>
        <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">Configuration</label>
        <textarea
          value={JSON.stringify(data.config || {}, null, 2)}
          onChange={(e) => {
            try {
              const parsed = JSON.parse(e.target.value);
              onUpdate(node.id, { config: parsed });
            } catch {
              // Invalid JSON — don't update
            }
          }}
          rows={4}
          className="w-full px-2.5 py-1.5 border border-border-subtle rounded-lg text-[10px] font-mono outline-none focus:border-brand bg-white resize-none"
        />
      </div>

      {/* Entry Point toggle */}
      <div className="flex items-center justify-between">
        <span className="text-2xs font-semibold text-text-secondary">Entry Point</span>
        <button
          onClick={() => onUpdate(node.id, { isEntryPoint: !data.isEntryPoint })}
          className={`w-8 h-4 rounded-full transition-colors ${data.isEntryPoint ? 'bg-brand' : 'bg-glass-2'}`}
        >
          <div
            className={`w-3 h-3 rounded-full bg-white shadow transition-transform ${data.isEntryPoint ? 'translate-x-4' : 'translate-x-0.5'}`}
          />
        </button>
      </div>

      {/* Delete */}
      <button
        onClick={() => onDelete(node.id)}
        className="w-full mt-2 py-2 rounded-lg bg-danger-soft border border-[rgba(244,63,94,.12)] text-2xs font-semibold text-danger cursor-pointer hover:bg-red-100 transition-colors flex items-center justify-center gap-1.5"
      >
        <Trash2 className="w-3 h-3" />
        Delete Node
      </button>
    </div>
  );
}
