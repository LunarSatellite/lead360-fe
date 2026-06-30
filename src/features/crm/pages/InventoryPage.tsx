import { useState } from 'react';
import { Loader2, Package, Search, Plus, Minus, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useInventory, useCheckStock, useAdjustInventory } from '../api/crm.queries';
import type { InventoryItemDto, StockCheckItem, StockCheckResult } from '../types/crm.types';

export function Component() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<any>({ page: 1, pageSize: 50 });
  const { data: raw, isLoading } = useInventory(filter);
  const items: InventoryItemDto[] = (raw as any)?.items ?? [];
  const checkStock = useCheckStock();
  const adjust = useAdjustInventory();
  const [checkResult, setCheckResult] = useState<StockCheckResult | null>(null);
  const [checkInput, setCheckInput] = useState('');
  const [adjustProduct, setAdjustProduct] = useState<InventoryItemDto | null>(null);
  const [adjustQty, setAdjustQty] = useState(0);
  const [adjustNote, setAdjustNote] = useState('');

  const handleCheck = () => {
    try {
      const parsed: StockCheckItem[] = JSON.parse(checkInput);
      checkStock.mutate(parsed, { onSuccess: (res: any) => setCheckResult(res) });
    } catch { /* ignore */ }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-text-primary tracking-tight flex items-center gap-2">
            <Package className="w-5 h-5 text-brand" strokeWidth={1.5} /> Inventory
          </h2>
          <p className="text-xs text-text-muted mt-0.5">Check stock levels, adjust inventory, and view availability.</p>
        </div>
        <div className="flex gap-2">
          <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && setFilter((f: any) => ({ ...f, search: search || undefined, page: 1 }))} placeholder="Search products..." className="px-3 py-2 rounded-xl bg-bg-elevated border border-border-subtle text-sm w-48" />
          <button onClick={() => setFilter((f: any) => ({ ...f, search: search || undefined, page: 1 }))} className="px-3 py-2 rounded-xl bg-bg-elevated border border-border-subtle text-sm text-text-secondary hover:text-text-primary"><Search className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Stock Check */}
      <div className="rounded-2xl border border-border-subtle bg-bg-card p-4 space-y-3">
        <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Quick Stock Check</p>
        <div className="flex gap-2">
          <input value={checkInput} onChange={e => setCheckInput(e.target.value)} placeholder='[{"productId":"guid","quantity":10}]' className="flex-1 px-3 py-2 rounded-xl bg-bg-elevated border border-border-subtle text-sm font-mono" />
          <button onClick={handleCheck} disabled={checkStock.isPending || !checkInput} className="px-4 py-2 rounded-xl bg-brand text-bg text-sm font-bold hover:bg-brand-light disabled:opacity-50">
            {checkStock.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Check'}
          </button>
        </div>
        {checkResult && (
          <div className="space-y-2">
            <p className={`text-xs font-semibold flex items-center gap-1 ${checkResult.allAvailable ? 'text-success' : 'text-danger'}`}>
              {checkResult.allAvailable ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
              {checkResult.allAvailable ? 'All items available' : 'Some items insufficient'}
            </p>
            {checkResult.lines.map((l, i) => (
              <div key={i} className="flex items-center justify-between text-xs bg-bg-elevated rounded-xl px-3 py-2">
                <span className="text-text-primary">{l.productName || l.productId}</span>
                <span className={l.isAvailable ? 'text-success' : 'text-danger'}>{l.quantityAvailable} available, {l.quantityRequested} needed</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Inventory List */}
      <div className="rounded-2xl border border-border-subtle bg-bg-card overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-text-muted" /></div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-text-muted"><Package className="w-10 h-10 mx-auto mb-3 opacity-30" strokeWidth={1} /><p className="text-sm font-semibold">No inventory items</p></div>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border-subtle">
              {['Product', 'SKU', 'On Hand', 'Reserved', 'Available', 'Reorder', 'Location', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wider">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-border-subtle last:border-0 hover:bg-bg-elevated transition-colors">
                  <td className="px-4 py-3 font-medium text-text-primary">{item.productName || item.productId}</td>
                  <td className="px-4 py-3 text-text-muted text-xs">{item.sku || '—'}</td>
                  <td className="px-4 py-3 text-text-primary">{item.quantityOnHand}</td>
                  <td className="px-4 py-3 text-text-muted">{item.quantityReserved}</td>
                  <td className="px-4 py-3 font-semibold">{item.quantityAvailable}</td>
                  <td className="px-4 py-3">{item.belowReorderPoint ? <span className="text-danger text-xs font-semibold">{item.reorderPoint}</span> : item.reorderPoint}</td>
                  <td className="px-4 py-3 text-xs text-text-muted">{item.warehouseLocation || '—'}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => { setAdjustProduct(item); setAdjustQty(0); setAdjustNote(''); }} className="text-xs text-brand hover:underline font-medium">Adjust</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Adjust Modal */}
      {adjustProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm bg-bg border border-border-subtle rounded-2xl p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-text-primary">Adjust — {adjustProduct.productName}</h3>
            <p className="text-xs text-text-muted">Current on hand: {adjustProduct.quantityOnHand}</p>
            <div><label className="text-xs text-text-muted block mb-1">Quantity Change</label>
              <input type="number" value={adjustQty} onChange={e => setAdjustQty(Number(e.target.value))} className="w-full px-3 py-2 rounded-xl bg-bg-elevated border border-border-subtle text-sm" placeholder="+10 or -5" /></div>
            <div><label className="text-xs text-text-muted block mb-1">Notes</label>
              <input value={adjustNote} onChange={e => setAdjustNote(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-bg-elevated border border-border-subtle text-sm" placeholder="Receipt from vendor..." /></div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setAdjustProduct(null)} className="px-4 py-2 rounded-xl text-sm text-text-secondary border border-border-subtle hover:bg-bg-elevated">Cancel</button>
              <button onClick={() => { adjust.mutate({ productId: adjustProduct.productId, data: { quantity: adjustQty, notes: adjustNote || undefined } }); setAdjustProduct(null); }} disabled={adjust.isPending || adjustQty === 0}
                className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-brand hover:bg-brand-light disabled:opacity-50">{adjust.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
