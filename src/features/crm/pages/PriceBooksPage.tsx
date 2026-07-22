import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Trash2, Star, BookOpen, Loader2, X, DollarSign, FileText } from 'lucide-react';
import { DataView } from '@/shared/ui/DataView';
import { confirmDialog } from '@/shared/ui/confirm';
import {
  usePriceBooks, usePriceBook, useCreatePriceBook, useUpdatePriceBook, useDeletePriceBook,
  useAddPriceBookEntry, useDeletePriceBookEntry, useCatalogItems,
} from '../api/crm.queries';
import type {
  CrmPriceBookDto, CrmPriceBookDetailDto, CrmPriceBookEntryDto, CrmPriceBookEntryRequest, CatalogItemSummaryDto,
} from '../types/crm.types';

const inputCls =
  'w-full px-3 py-2 rounded-xl bg-bg-input border-thin border-border-subtle text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-glow';

const money = (n: number, ccy: string) =>
  new Intl.NumberFormat(undefined, { style: 'currency', currency: ccy || 'USD' }).format(n || 0);

export function Component() {
  const booksQuery = usePriceBooks();
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [showCreate, setShowCreate] = useState(false);
  const detail = usePriceBook(selectedId);

  const createBook = useCreatePriceBook();
  const updateBook = useUpdatePriceBook();
  const deleteBook = useDeletePriceBook();
  const [bookForm, setBookForm] = useState({ name: '', currency: 'USD', description: '', isDefault: false });

  const submitBook = (e: React.SubmitEvent) => {
    e.preventDefault();
    createBook.mutate(
      { name: bookForm.name, currency: bookForm.currency, description: bookForm.description || undefined, isDefault: bookForm.isDefault },
      { onSuccess: () => { setShowCreate(false); setBookForm({ name: '', currency: 'USD', description: '', isDefault: false }); } },
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-extrabold text-text-primary tracking-tight">CRM — Price Books</h1>
          <p className="text-sm text-text-secondary mt-1">Per-currency rate cards. Quotes draw line-item prices from a book so pricing stays consistent.</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-bg bg-brand hover:bg-brand-light transition-all">
          <Plus className="w-3.5 h-3.5" strokeWidth={2.5} /> New price book
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5">
        {/* Books list */}
        <DataView<CrmPriceBookDto[]> query={booksQuery as any} empty={<EmptyBooks onCreate={() => setShowCreate(true)} />}>
          {(books) => (
            <div className="flex flex-col gap-2">
              {books.map((b: CrmPriceBookDto) => (
                <button key={b.id} onClick={() => setSelectedId(b.id)}
                  className={`text-left rounded-card border-thin p-3.5 transition-all ${
                    selectedId === b.id ? 'bg-brand-soft border-border-glow' : 'bg-glass-1 border-border-subtle hover:bg-glass-2'
                  }`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-text-primary flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-brand" />{b.name}
                    </span>
                    {b.isDefault && <Star className="w-3.5 h-3.5 text-warning" fill="currentColor" />}
                  </div>
                  <div className="text-[11px] text-text-muted mt-1">
                    {b.currency} · {b.entryCount} item{b.entryCount === 1 ? '' : 's'}{b.isActive ? '' : ' · inactive'}
                  </div>
                </button>
              ))}
            </div>
          )}
        </DataView>

        {/* Selected book entries */}
        <div className="rounded-card border-thin border-border-subtle bg-glass-1 p-4 min-h-[200px]">
          {!selectedId ? (
            <div className="flex items-center justify-center h-full text-sm text-text-muted py-16">
              Select a price book to manage its items.
            </div>
          ) : (
            <DataView<CrmPriceBookDetailDto> query={detail as any}>
              {(book) => (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-text-primary">{book.name}</h2>
                        {book.isDefault && <Star className="w-4 h-4 text-warning" fill="currentColor" />}
                        {!book.isActive && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-danger-soft text-danger">Inactive</span>}
                      </div>
                      <p className="text-xs text-text-muted">{book.currency}{book.description ? ` · ${book.description}` : ''}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {book.isDefault ? (
                        <button onClick={() => updateBook.mutate({ id: book.id, data: { isDefault: false } })}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border-thin border-border-medium text-warning hover:text-text-secondary hover:border-border-medium transition-all">
                          <Star className="w-3 h-3" fill="currentColor" /> Remove default
                        </button>
                      ) : (
                        <button onClick={() => updateBook.mutate({ id: book.id, data: { isDefault: true } })}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border-thin border-border-medium text-text-secondary hover:text-warning hover:border-warning/40 transition-all">
                          <Star className="w-3 h-3" /> Set as default
                        </button>
                      )}
                      <button onClick={() => updateBook.mutate({ id: book.id, data: { isActive: !book.isActive } })}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border-thin border-border-medium transition-all ${
                          book.isActive ? 'text-text-secondary hover:text-danger hover:border-danger/40' : 'text-success hover:text-success'
                        }`}>
                        {book.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => confirmDialog({ message: `Delete price book "${book.name}"?`, confirmText: 'Delete', danger: true }).then((ok) => { if (ok) deleteBook.mutate(book.id, { onSuccess: () => setSelectedId(undefined) }); })}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border-thin border-border-medium text-text-secondary hover:text-danger hover:border-danger/40 transition-all">
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  </div>

                  <EntryEditor bookId={book.id} currency={book.currency} entries={book.entries} />
                </div>
              )}
            </DataView>
          )}
        </div>
      </div>

      {showCreate && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-end pr-4">
          <div className="fixed inset-0 min-h-screen bg-black/40 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
          <div
            className="drawer-slide-in relative w-[520px] flex flex-col overflow-hidden"
            style={{
              borderRadius: 18,
              background: 'var(--bg-card)',
              border: '1px solid rgba(0,217,138,0.2)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.7), 0 0 24px rgba(0,217,138,0.25), inset 0 1px 0 rgba(0,255,163,0.05)',
              maxHeight: 'calc(100vh - 32px)',
            }}
          >
            {/* Accent bar */}
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
                >New Price Book</h2>
                <p className="text-xs text-text-muted mt-0.5">Create a new price book</p>
              </div>
              <button onClick={() => setShowCreate(false)} className="text-text-muted hover:text-text-primary mt-0.5">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={submitBook} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Name <span className="text-danger">*</span></label>
                <div className="relative">
                  <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
                  <input
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)]"
                    style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }}
                    placeholder="e.g. Enterprise USD"
                    value={bookForm.name}
                    onChange={(e) => setBookForm((f) => ({ ...f, name: e.target.value }))}
                    required
                  />
                </div>
              </div>

              {/* Currency */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Currency</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
                  <input
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)]"
                    style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }}
                    placeholder="USD"
                    value={bookForm.currency}
                    onChange={(e) => setBookForm((f) => ({ ...f, currency: e.target.value.toUpperCase() }))}
                    maxLength={10}
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Description</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
                  <textarea
                    rows={3}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)] resize-none"
                    style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }}
                    placeholder="Optional description…"
                    value={bookForm.description}
                    onChange={(e) => setBookForm((f) => ({ ...f, description: e.target.value }))}
                  />
                </div>
              </div>

              {/* Default toggle */}
              <label className="flex items-center gap-2 text-xs font-semibold text-text-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={bookForm.isDefault}
                  onChange={(e) => setBookForm((f) => ({ ...f, isDefault: e.target.checked }))}
                  className="accent-brand w-4 h-4"
                />
                Set as default price book
              </label>
            </form>

            {/* Footer */}
            <div className="shrink-0 px-6 py-4 border-t border-border-subtle flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-text-secondary border border-border-subtle hover:border-border-medium transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createBook.isPending || !bookForm.name.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-bg bg-brand hover:bg-brand-light disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {createBook.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Create Price Book
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

function EntryEditor({ bookId, currency, entries }: { bookId: string; currency: string; entries: CrmPriceBookEntryDto[] }) {
  const addEntry = useAddPriceBookEntry();
  const delEntry = useDeletePriceBookEntry();
  const { data: catalogItems } = useCatalogItems();
  const items: CatalogItemSummaryDto[] = catalogItems ?? [];
  const [form, setForm] = useState<{ productId: string; productName: string; sku: string; unitPrice: string }>({ productId: '', productName: '', sku: '', unitPrice: '' });

  const pickProduct = (id: string) => {
    const p = items.find((x) => x.id === id);
    if (!p) { setForm({ productId: '', productName: '', sku: '', unitPrice: '' }); return; }
    setForm({ productId: p.id, productName: p.name, sku: p.unit, unitPrice: p.price?.toString() ?? '' });
  };

  const add = (e: React.SubmitEvent) => {
    e.preventDefault();
    const price = Number(form.unitPrice);
    if (!form.productName.trim() || Number.isNaN(price) || price < 0) return;
    const data: CrmPriceBookEntryRequest = { productId: form.productId || undefined, productName: form.productName.trim(), sku: form.sku || undefined, unitPrice: price };
    addEntry.mutate({ id: bookId, data }, { onSuccess: () => setForm({ productId: '', productName: '', sku: '', unitPrice: '' }) });
  };

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-card border-thin border-border-subtle">
        <table className="w-full min-w-[480px] border-collapse">
          <thead>
            <tr className="bg-bg-elevated text-left">
              {['Product', 'SKU', 'Unit price', ''].map((h) => (
                <th key={h} className="px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-text-muted">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr><td colSpan={4} className="px-3 py-6 text-center text-xs text-text-muted">No items yet — add the first below.</td></tr>
            ) : entries.map((e) => (
              <tr key={e.id} className="border-t border-border-subtle">
                <td className="px-3 py-2 text-sm text-text-primary">{e.productName}</td>
                <td className="px-3 py-2 text-xs text-text-muted">{e.sku || '—'}</td>
                <td className="px-3 py-2 text-sm font-semibold text-text-primary tabular-nums">{money(e.unitPrice, currency)}</td>
                <td className="px-3 py-2 text-right">
                  <button onClick={() => delEntry.mutate(e.id)} className="text-text-muted hover:text-danger"><Trash2 className="w-3.5 h-3.5" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form onSubmit={add} className="flex flex-wrap gap-2 items-end">
        <div className="flex-1 min-w-[200px]">
          {items.length > 0 ? (
            <select
              value={form.productId}
              onChange={(e) => pickProduct(e.target.value)}
              className={`${inputCls} appearance-none`}>
              <option value="">＋ Pick a product…</option>
              {items.map((p) => (
                <option key={p.id} value={p.id}>{p.name}{p.categoryName ? ` (${p.categoryName})` : ''}</option>
              ))}
            </select>
          ) : (
            <input className={inputCls} placeholder="Product name" value={form.productName}
              onChange={(e) => setForm((f) => ({ ...f, productName: e.target.value }))} />
          )}
        </div>
        <input className={`${inputCls} w-28`} placeholder="SKU" value={form.sku}
          onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} />
        <input className={`${inputCls} w-32`} type="number" min="0" step="0.01" placeholder="Price" value={form.unitPrice}
          onChange={(e) => setForm((f) => ({ ...f, unitPrice: e.target.value }))} />
        <button type="submit" disabled={addEntry.isPending}
          className="flex items-center gap-1 px-3 py-2 rounded-xl bg-brand text-bg text-xs font-bold hover:bg-brand-light disabled:opacity-50">
          <Plus className="w-3.5 h-3.5" /> Add
        </button>
      </form>
    </div>
  );
}

function EmptyBooks({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="rounded-card border-thin border-border-subtle bg-glass-1 p-8 text-center">
      <BookOpen className="w-9 h-9 text-text-muted mx-auto mb-3" strokeWidth={1.2} />
      <p className="text-sm text-text-secondary font-semibold">No price books yet</p>
      <button onClick={onCreate} className="mt-3 text-xs font-bold text-brand hover:underline">Create your first</button>
    </div>
  );
}
