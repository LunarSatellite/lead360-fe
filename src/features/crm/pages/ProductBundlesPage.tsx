import { useState } from 'react';
import { Plus, Trash2, Package, Loader2, X, DollarSign, FileText, Layers } from 'lucide-react';
import { DataView } from '@/shared/ui/DataView';
import { confirmDialog } from '@/shared/ui/confirm';
import {
  useProductBundles, useProductBundle, useCreateProductBundle, useDeleteProductBundle,
  useAddProductBundleItem, useDeleteProductBundleItem,
} from '../api/crm.queries';
import type {
  CrmProductBundleDto, CrmProductBundleDetailDto, CrmProductBundleItemDto, CrmProductBundleItemRequest,
} from '../types/crm.types';

const money = (n: number, ccy: string) =>
  new Intl.NumberFormat(undefined, { style: 'currency', currency: ccy || 'USD' }).format(n || 0);

function SlideOver({ open, onClose, title, subtitle, children, footer }: { open: boolean; onClose: () => void; title: string; subtitle?: string; children: React.ReactNode; footer?: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end pr-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className="drawer-slide-in relative flex flex-col overflow-hidden"
        style={{
          width: '520px',
          borderRadius: 18,
          background: 'var(--bg-card)',
          border: '1px solid rgba(0,217,138,0.2)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.7), 0 0 24px rgba(0,217,138,0.25), inset 0 1px 0 rgba(0,255,163,0.05)',
          maxHeight: 'calc(100vh - 32px)',
        }}
      >
        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, #00D98A 35%, #00FFA3 65%, transparent)', flexShrink: 0 }} />
        <div className="flex items-start justify-between px-6 py-4 border-b border-border-subtle shrink-0">
          <div>
            <h2
              className="text-base font-extrabold leading-tight"
              style={{
                background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--primary) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >{title}</h2>
            {subtitle && <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary mt-0.5"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && (
          <div className="shrink-0 px-6 py-4 border-t border-border-subtle">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="block text-xs font-semibold text-text-secondary mb-1">{label}</label>{children}</div>;
}

const inputStyle = { backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' } as const;

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
        <DataView<CrmProductBundleDto[]> query={bundlesQuery as any} empty={<EmptyBundles onCreate={() => setShowCreate(true)} />}>
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
            <DataView<CrmProductBundleDetailDto> query={detail as any}>
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

      <SlideOver open={showCreate} onClose={() => setShowCreate(false)} title="New Bundle" subtitle="Create a reusable product bundle"
        footer={
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-xl text-xs font-semibold text-text-secondary border border-border-subtle hover:border-border-medium transition-all">Cancel</button>
            <button type="submit" form="bundle-form" disabled={createBundle.isPending || !form.name.trim()}
              className="flex-none px-6 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-brand text-bg text-sm font-bold hover:bg-brand-light disabled:opacity-50 disabled:cursor-not-allowed transition-all">
              {createBundle.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Bundle'}
            </button>
          </div>
        }
      >
        <form id="bundle-form" onSubmit={submit} className="space-y-4">
          {/* ── Bundle Info ── */}
          <div className="grid grid-cols-[auto_1fr] items-center gap-2">
            <span className="text-[10px] font-bold text-brand uppercase tracking-widest">Bundle Info</span>
            <div className="h-px bg-brand/20" />
          </div>

          <Field label="Name *">
            <div className="relative">
              <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
              <input
                required
                placeholder="e.g. Starter Kit"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)]"
                style={inputStyle}
              />
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Currency">
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
                <input
                  value={form.currency}
                  onChange={e => setForm(f => ({ ...f, currency: e.target.value.toUpperCase() }))}
                  maxLength={10}
                  placeholder="USD"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)]"
                  style={inputStyle}
                />
              </div>
            </Field>
          </div>

          <Field label="Description">
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
              <textarea
                rows={3}
                placeholder="Optional description…"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)] resize-none"
                style={inputStyle}
              />
            </div>
          </Field>
        </form>
      </SlideOver>
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
        <input className="flex-1 min-w-[150px] pl-3 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)]" style={inputStyle} placeholder="Product name" value={form.productName}
          onChange={(e) => setForm((f) => ({ ...f, productName: e.target.value }))} />
        <input className="w-24 pl-3 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)]" style={inputStyle} placeholder="SKU" value={form.sku}
          onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} />
        <input className="w-20 pl-3 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)]" style={inputStyle} type="number" min="1" step="1" placeholder="Qty" value={form.quantity}
          onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} />
        <input className="w-28 pl-3 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)]" style={inputStyle} type="number" min="0" step="0.01" placeholder="Price" value={form.unitPrice}
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
