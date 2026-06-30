import { useState } from 'react';
import { Plus, Trash2, Package, Loader2, X } from 'lucide-react';
import { DataView } from '@/shared/ui/DataView';
import { confirmDialog } from '@/shared/ui/confirm';
import {
  useProductBundles, useProductBundle, useCreateProductBundle, useDeleteProductBundle,
  useAddProductBundleItem, useDeleteProductBundleItem,
} from '../api/crm.queries';
import type {
  CrmProductBundleDto, CrmProductBundleItemDto, CrmProductBundleItemRequest,
} from '../types/crm.types';

const inputCls =
  'w-full px-3 py-2 rounded-xl bg-bg-input border-thin border-border-subtle text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-glow';

const money = (n: number, ccy: string) =>
  new Intl.NumberFormat(undefined, { style: 'currency', currency: ccy || 'USD' }).format(n || 0);

export function Component() {
  const bundlesQuery = useProductBundles();
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [showCreate, setShowCreate] = useState(false);
  const detail = useProductBundle(selectedId);

  const createBundle = useCreateProductBundle();
  const deleteBundle = useDeleteProductBundle();
  const [form, setForm] = useState({ name: '', currency: 'USD', description: '' });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    createBundle.mutate(
      { name: form.name, currency: form.currency, description: form.description || undefined },
      { onSuccess: () => { setShowCreate(false); setForm({ name: '', currency: 'USD', description: '' }); } },
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-extrabold text-text-primary tracking-tight">CRM — Product Bundles</h1>
          <p className="text-sm text-text-secondary mt-1">Reusable groups of products. Add a bundle to a quote to drop in all its line items at once.</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-bg bg-brand hover:bg-brand-light transition-all">
          <Plus className="w-3.5 h-3.5" strokeWidth={2.5} /> New bundle
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5">
        <DataView query={bundlesQuery} empty={<EmptyBundles onCreate={() => setShowCreate(true)} />}>
          {(bundles) => (
            <div className="flex flex-col gap-2">
              {bundles.map((b: CrmProductBundleDto) => (
                <button key={b.id} onClick={() => setSelectedId(b.id)}
                  className={`text-left rounded-card border-thin p-3.5 transition-all ${
                    selectedId === b.id ? 'bg-brand-soft border-border-glow' : 'bg-glass-1 border-border-subtle hover:bg-glass-2'
                  }`}>
                  <span className="text-sm font-bold text-text-primary flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-brand" />{b.name}
                  </span>
                  <div className="text-[11px] text-text-muted mt-1">
                    {b.currency} · {b.itemCount} item{b.itemCount === 1 ? '' : 's'} · {money(b.total, b.currency)}{b.isActive ? '' : ' · inactive'}
                  </div>
                </button>
              ))}
            </div>
          )}
        </DataView>

        <div className="rounded-card border-thin border-border-subtle bg-glass-1 p-4 min-h-[200px]">
          {!selectedId ? (
            <div className="flex items-center justify-center h-full text-sm text-text-muted py-16">
              Select a bundle to manage its items.
            </div>
          ) : (
            <DataView query={detail}>
              {(bundle) => (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-base font-bold text-text-primary">{bundle.name}</h2>
                      <p className="text-xs text-text-muted">{bundle.currency}{bundle.description ? ` · ${bundle.description}` : ''}</p>
                    </div>
                    <button
                      onClick={() => confirmDialog({ message: `Delete bundle "${bundle.name}"?`, confirmText: 'Delete', danger: true }).then((ok) => { if (ok) deleteBundle.mutate(bundle.id, { onSuccess: () => setSelectedId(undefined) }); })}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border-thin border-border-medium text-text-secondary hover:text-danger hover:border-danger/40 transition-all">
                      <Trash2 className="w-3 h-3" /> Delete bundle
                    </button>
                  </div>

                  <ItemEditor bundleId={bundle.id} currency={bundle.currency} items={bundle.items} />
                </div>
              )}
            </DataView>
          )}
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <form onSubmit={submit} className="w-full max-w-md bg-bg-card border-thin border-border-subtle rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-text-primary">New bundle</h2>
              <button type="button" onClick={() => setShowCreate(false)} className="text-text-muted hover:text-text-primary"><X className="w-4 h-4" /></button>
            </div>
            <input className={inputCls} placeholder="Name (e.g. Starter Kit)" value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
            <input className={inputCls} placeholder="Currency (USD)" value={form.currency}
              onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value.toUpperCase() }))} maxLength={10} />
            <input className={inputCls} placeholder="Description (optional)" value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            <button type="submit" disabled={createBundle.isPending || !form.name.trim()}
              className="w-full py-2 rounded-xl bg-brand text-bg text-sm font-bold hover:bg-brand-light disabled:opacity-50">
              {createBundle.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Create'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function ItemEditor({ bundleId, currency, items }: { bundleId: string; currency: string; items: CrmProductBundleItemDto[] }) {
  const addItem = useAddProductBundleItem();
  const delItem = useDeleteProductBundleItem();
  const [form, setForm] = useState({ productName: '', sku: '', quantity: '1', unitPrice: '' });

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Number(form.quantity);
    const price = Number(form.unitPrice);
    if (!form.productName.trim() || Number.isNaN(price) || price < 0 || Number.isNaN(qty) || qty <= 0) return;
    const data: CrmProductBundleItemRequest = { productName: form.productName.trim(), sku: form.sku || undefined, quantity: qty, unitPrice: price };
    addItem.mutate({ id: bundleId, data }, { onSuccess: () => setForm({ productName: '', sku: '', quantity: '1', unitPrice: '' }) });
  };

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-card border-thin border-border-subtle">
        <table className="w-full min-w-[520px] border-collapse">
          <thead>
            <tr className="bg-bg-elevated text-left">
              {['Product', 'SKU', 'Qty', 'Unit price', 'Line', ''].map((h) => (
                <th key={h} className="px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-text-muted">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan={6} className="px-3 py-6 text-center text-xs text-text-muted">No items yet — add the first below.</td></tr>
            ) : items.map((it) => (
              <tr key={it.id} className="border-t border-border-subtle">
                <td className="px-3 py-2 text-sm text-text-primary">{it.productName}</td>
                <td className="px-3 py-2 text-xs text-text-muted">{it.sku || '—'}</td>
                <td className="px-3 py-2 text-sm text-text-secondary tabular-nums">{it.quantity}</td>
                <td className="px-3 py-2 text-sm text-text-primary tabular-nums">{money(it.unitPrice, currency)}</td>
                <td className="px-3 py-2 text-sm font-semibold text-text-primary tabular-nums">{money(it.unitPrice * it.quantity, currency)}</td>
                <td className="px-3 py-2 text-right">
                  <button onClick={() => delItem.mutate(it.id)} className="text-text-muted hover:text-danger"><Trash2 className="w-3.5 h-3.5" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form onSubmit={add} className="flex flex-wrap gap-2 items-center">
        <input className={`${inputCls} flex-1 min-w-[150px]`} placeholder="Product name" value={form.productName}
          onChange={(e) => setForm((f) => ({ ...f, productName: e.target.value }))} />
        <input className={`${inputCls} w-24`} placeholder="SKU" value={form.sku}
          onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} />
        <input className={`${inputCls} w-20`} type="number" min="1" step="1" placeholder="Qty" value={form.quantity}
          onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} />
        <input className={`${inputCls} w-28`} type="number" min="0" step="0.01" placeholder="Price" value={form.unitPrice}
          onChange={(e) => setForm((f) => ({ ...f, unitPrice: e.target.value }))} />
        <button type="submit" disabled={addItem.isPending}
          className="flex items-center gap-1 px-3 py-2 rounded-xl bg-brand text-bg text-xs font-bold hover:bg-brand-light disabled:opacity-50">
          <Plus className="w-3.5 h-3.5" /> Add
        </button>
      </form>
    </div>
  );
}

function EmptyBundles({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="rounded-card border-thin border-border-subtle bg-glass-1 p-8 text-center">
      <Package className="w-9 h-9 text-text-muted mx-auto mb-3" strokeWidth={1.2} />
      <p className="text-sm text-text-secondary font-semibold">No bundles yet</p>
      <button onClick={onCreate} className="mt-3 text-xs font-bold text-brand hover:underline">Create your first</button>
    </div>
  );
}
