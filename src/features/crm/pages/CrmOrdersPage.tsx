import { useState, useEffect, useRef } from 'react';
import { Plus, X, Loader2, Package, CheckCircle, Truck, XCircle, DollarSign, MapPin, Hash, ShieldCheck, AlertTriangle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useSearchParams } from 'react-router-dom';
import {
  useOrders, useCreateOrder, useConfirmOrder, useFulfillOrder, useCancelOrder,
  useRecordOrderPayment, useUpdateOrderFulfillment, useAcknowledgeOrder, useCreditCheck, useUpdateOrder, useGenerateInvoiceFromDeal,
  useDeliveries, useCreateDelivery, useUpdateDeliveryStatus, useDealById, useOrderById, useQuoteById, useAccounts,
  useGeneratePickList, usePickList, useUpdatePickListItem, useMarkPickListPicked, useMarkPickListPacked,
} from '../api/crm.queries';
import type {
  CrmOrderDetailDto, CrmOrderCreateRequest, CrmOrderLineItemRequest,
  CrmOrderFilter, PickListItemDto,
} from '../types/crm.types';
import {
  CrmOrderStatus,
  CRM_ORDER_STATUS_LABELS, CRM_ORDER_STATUS_COLORS,
  CRM_ORDER_FULFILLMENT_LABELS, CRM_ORDER_PAYMENT_LABELS, CRM_ORDER_PAYMENT_COLORS,
  CRM_DELIVERY_STATUS_LABELS, CRM_DELIVERY_STATUS_COLORS,
  PICK_LIST_STATUS_LABELS,
} from '../types/crm.types';

const inputCls = 'w-full rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand/40';

const FULFILLMENT_COLORS: Record<number, string> = {
  1: 'text-text-secondary bg-bg-elevated border-border-subtle',
  2: 'text-[#F59E0B] bg-[rgba(245,158,11,0.1)] border-[rgba(245,158,11,0.2)]',
  3: 'text-brand bg-brand-soft border-border-glow',
  4: 'text-[#A78BFA] bg-[rgba(167,139,250,0.1)] border-[rgba(167,139,250,0.2)]',
  5: 'text-success bg-success-soft border-[rgba(34,197,94,0.2)]',
  6: 'text-danger bg-danger-soft border-[rgba(244,63,94,0.2)]',
  7: 'text-text-muted bg-bg-card border-border-subtle',
};

function Badge({ value, labels, colors }: { value: number; labels: Record<number, string>; colors: Record<number, string> }) {
  return (
    <span className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${colors[value] ?? ''}`}>
      {labels[value] ?? value}
    </span>
  );
}

function SlideOver({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="drawer-slide-in relative w-[560px] h-full flex flex-col bg-bg-shell border-l border-thin border-border-subtle" style={{ boxShadow: '-8px 0 40px rgba(0,0,0,0.5)' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle shrink-0">
          <h3 className="font-bold text-text-primary">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-surface transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-text-muted mb-1.5">{label}</label>
      {children}
    </div>
  );
}

type LineItem = { productId: string; productName: string; quantity: string; unitPrice: string };
const emptyLine = (): LineItem => ({ productId: '', productName: '', quantity: '1', unitPrice: '' });

const PO_WARNING = "B2B customers typically require their PO number on invoices.";

export function Component() {
  const [searchParams] = useSearchParams();
  const [filter, setFilter] = useState<CrmOrderFilter>({ page: 1, pageSize: 20 });
  const [search, setSearch] = useState('');
  const [statusF, setStatusF] = useState('');

  const urlDealId = searchParams.get('dealId') ?? '';
  const urlAccountId = searchParams.get('accountId') ?? '';
  const urlQuoteId = searchParams.get('quoteId') ?? '';
  const { data: urlDealRaw } = useDealById(urlDealId || undefined);
  const urlDeal = (urlDealRaw as any) ?? null;
  const { data: urlQuoteRaw } = useQuoteById(urlQuoteId || undefined);
  const urlQuote = (urlQuoteRaw as any) ?? null;

  const [showCreate, setShowCreate] = useState(!!urlDealId || !!urlQuoteId);
  const [contactId, setContactId] = useState(urlDeal?.contactId ?? '');
  const [orderDealId, setOrderDealId] = useState(urlDealId);
  const [orderAccountId, setOrderAccountId] = useState(urlAccountId);
  const { data: accountsRaw } = useAccounts({ pageSize: 200 });
  const accountsList: any[] = (accountsRaw as any)?.items ?? [];
  const [lines, setLines] = useState<LineItem[]>([emptyLine()]);
  const [currency, setCurrency] = useState(urlDeal?.currency ?? 'USD');
  // Pre-fill from quote data once loaded
  useEffect(() => {
    if (urlQuote) {
      setContactId(urlQuote.contactId ?? '');
      setCurrency(urlQuote.currency ?? 'USD');
      setOrderDealId(urlQuote.dealId ?? '');
      if (urlQuote.lineItems?.length) {
        setLines(urlQuote.lineItems.map((li: any) => ({ productId: li.productId || '', productName: li.description || li.productName || '', quantity: String(li.quantity || 1), unitPrice: String(li.unitPrice || 0) })));
      }
    }
  }, [urlQuote]);
  const [customerPONumber, setCustomerPONumber] = useState('');
  const [notes, setNotes] = useState('');
  const [shippingLine1, setShippingLine1] = useState('');
  const [shippingCity, setShippingCity] = useState('');
  const [shippingState, setShippingState] = useState('');
  const [shippingPostalCode, setShippingPostalCode] = useState('');
  const [shippingCountry, setShippingCountry] = useState('');

  const [selectedOrder, setSelectedOrder] = useState<CrmOrderDetailDto | null>(null);
  const autoOpenedRef = useRef(false);
  const urlOrderId = searchParams.get('orderId') ?? '';
  const [showPayment, setShowPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentRef, setPaymentRef] = useState('');
  const [showNewShipment, setShowNewShipment] = useState(false);
  const [shipCarrier, setShipCarrier] = useState('');
  const [shipTracking, setShipTracking] = useState('');

  const { data: raw, isLoading } = useOrders(filter);
  const items: CrmOrderDetailDto[] = (raw as any)?.items ?? [];

  const { data: pendingOrder } = useOrderById(urlOrderId || undefined);
  useEffect(() => {
    if (pendingOrder && !autoOpenedRef.current) {
      setSelectedOrder(pendingOrder as any);
      autoOpenedRef.current = true;
    }
  }, [pendingOrder]);

  const { data: deliveries } = useDeliveries(selectedOrder?.id);
  const deliveryList: import('../types/crm.types').CrmDeliveryDto[] = (deliveries as any) ?? [];

  const createOrder = useCreateOrder();
  const confirmOrder = useConfirmOrder();
  const fulfillOrder = useFulfillOrder();
  const cancelOrder = useCancelOrder();
  const recordPayment = useRecordOrderPayment();
  const updateFulfillment = useUpdateOrderFulfillment();
  const acknowledgeOrder = useAcknowledgeOrder();
  const creditCheck = useCreditCheck();
  const generatePickList = useGeneratePickList();
  const { data: pickListRaw, refetch: refetchPickList } = usePickList(selectedOrder?.id);
  const pickList = (pickListRaw as any) ?? null;
  const updatePickItem = useUpdatePickListItem();
  const markPicked = useMarkPickListPicked();
  const markPacked = useMarkPickListPacked();
  const updateOrder = useUpdateOrder();
  const generateInvoice = useGenerateInvoiceFromDeal();
  const [editingPO, setEditingPO] = useState('');
  const [editingPOId, setEditingPOId] = useState('');
  const [creditResult, setCreditResult] = useState<any>(null);
  const [confirmOverrideNote, setConfirmOverrideNote] = useState('');
  const createDelivery = useCreateDelivery();
  const updateDeliveryStatus = useUpdateDeliveryStatus();

  const applyFilter = () => {
    setFilter((f: CrmOrderFilter) => ({ ...f, page: 1, search: search || undefined, status: statusF ? Number(statusF) as any : undefined }));
  };

  const lineTotal = lines.reduce((acc, l) => acc + (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0), 0);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const lineItems: CrmOrderLineItemRequest[] = lines
      .filter(l => l.productName.trim())
      .map(l => ({ productId: l.productId || undefined, productName: l.productName.trim(), quantity: Number(l.quantity), unitPrice: Number(l.unitPrice) }));
    const req: CrmOrderCreateRequest = {
      contactId: contactId.trim(),
      dealId: orderDealId || undefined,
      accountId: orderAccountId || undefined,
      lineItems,
      currency: currency || 'USD',
      customerPONumber: customerPONumber.trim() || undefined,
      notes: notes || undefined,
      shippingAddressLine1: shippingLine1 || undefined,
      shippingCity: shippingCity || undefined,
      shippingState: shippingState || undefined,
      shippingPostalCode: shippingPostalCode || undefined,
      shippingCountry: shippingCountry || undefined,
    };
    createOrder.mutate(req, {
      onSuccess: () => {
        setShowCreate(false);
        setContactId(''); setCurrency('USD'); setCustomerPONumber(''); setNotes(''); setLines([emptyLine()]);
        setShippingLine1(''); setShippingCity(''); setShippingState(''); setShippingPostalCode(''); setShippingCountry('');
      },
    });
  };

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    recordPayment.mutate({
      id: selectedOrder.id,
      data: { amount: Number(paymentAmount), paymentMethod: paymentMethod || undefined, paymentReference: paymentRef || undefined },
    });
    setShowPayment(false);
  };

  const handleFulfillStatus = (id: string, status: number) => {
    updateFulfillment.mutate({ id, data: { status } });
  };

  const handleCreateShipment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    createDelivery.mutate({
      orderId: selectedOrder.id,
      data: { carrier: shipCarrier || undefined, trackingNumber: shipTracking || undefined },
    });
    setShowNewShipment(false);
    setShipCarrier('');
    setShipTracking('');
  };

  const addLine = () => setLines(ls => [...ls, emptyLine()]);
  const removeLine = (i: number) => setLines(ls => ls.filter((_, idx) => idx !== i));
  const setLine = (i: number, k: keyof LineItem, v: string) => setLines(ls => ls.map((l, idx) => idx === i ? { ...l, [k]: v } : l));

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-extrabold text-text-primary tracking-tight">Orders</h2>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-bg bg-brand hover:opacity-90 transition-all">
            <Plus className="w-3.5 h-3.5" strokeWidth={2.5} /> New Order
          </button>
        </div>

        <div className="flex gap-2 flex-wrap">
          <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && applyFilter()} placeholder="Search orders..." className="flex-1 min-w-40 rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand/40" />
          <select value={statusF} onChange={e => setStatusF(e.target.value)} className="rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/40">
            <option value="">All Status</option>
            {Object.entries(CRM_ORDER_STATUS_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
          <button onClick={applyFilter} className="px-4 py-2 rounded-lg border border-border-subtle bg-bg-surface text-sm text-text-secondary hover:text-text-primary transition-all">Search</button>
        </div>

        <div className="rounded-2xl border border-border-subtle bg-bg-card overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-40 text-text-muted"><Loader2 className="w-5 h-5 animate-spin" /></div>
          ) : !items.length ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-text-muted">
              <Package className="w-8 h-8 opacity-30" strokeWidth={1.2} />
              <p className="text-sm">No orders found.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle">
                  {['Order #', 'Contact', 'Total', 'Status', 'Fulfillment', 'Payment', 'Date', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((o: CrmOrderDetailDto) => (
                  <tr key={o.id} onClick={() => setSelectedOrder(o)} className="border-b border-border-subtle last:border-0 hover:bg-bg-elevated cursor-pointer transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-text-secondary">{o.orderNumber}</td>
                    <td className="px-4 py-3 font-medium text-text-primary truncate max-w-[140px]">{o.contactName ?? o.contactId}</td>
                    <td className="px-4 py-3 text-text-secondary">{o.currency} {o.totalAmount.toLocaleString()}</td>
                    <td className="px-4 py-3"><Badge value={o.status} labels={CRM_ORDER_STATUS_LABELS} colors={CRM_ORDER_STATUS_COLORS} /></td>
                    <td className="px-4 py-3"><Badge value={o.fulfillmentStatus} labels={CRM_ORDER_FULFILLMENT_LABELS} colors={FULFILLMENT_COLORS} /></td>
                    <td className="px-4 py-3"><Badge value={o.paymentStatus} labels={CRM_ORDER_PAYMENT_LABELS} colors={CRM_ORDER_PAYMENT_COLORS} /></td>
                    <td className="px-4 py-3 text-text-muted text-xs">{o.orderDate ? format(parseISO(o.orderDate), 'MMM d, yyyy') : '-'}</td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5">
                        {o.status === 1 && (
                          <button onClick={() => confirmOrder.mutate(o.id)} disabled={confirmOrder.isPending} title="Confirm" className="p-1.5 rounded-lg text-text-muted hover:text-success hover:bg-success-soft transition-all disabled:opacity-50">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {o.status === 2 && (
                          <button onClick={() => fulfillOrder.mutate(o.id)} disabled={fulfillOrder.isPending} title="Mark Delivered" className="p-1.5 rounded-lg text-text-muted hover:text-brand hover:bg-brand-soft transition-all disabled:opacity-50">
                            <Truck className="w-4 h-4" />
                          </button>
                        )}
                        {o.status >= 1 && o.status <= 3 && (
                          <>
                            <button onClick={() => { setSelectedOrder(o); setShowPayment(true); setPaymentAmount(String(o.totalAmount)); }} title="Record Payment" className="p-1.5 rounded-lg text-text-muted hover:text-success hover:bg-success-soft transition-all">
                              <DollarSign className="w-4 h-4" />
                            </button>
                            <button onClick={() => cancelOrder.mutate(o.id)} disabled={cancelOrder.isPending} title="Cancel" className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger-soft transition-all disabled:opacity-50">
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create SlideOver */}
      <SlideOver open={showCreate} onClose={() => setShowCreate(false)} title="New Order">
        <form onSubmit={handleCreate} className="space-y-4">
          <Field label="Contact ID *"><input required value={contactId} onChange={e => setContactId(e.target.value)} placeholder="contact-uuid" className={inputCls} /></Field>
          <Field label="Currency"><input value={currency} onChange={e => setCurrency(e.target.value)} placeholder="USD" className={inputCls} /></Field>
          <Field label="Customer PO #"><input value={customerPONumber} onChange={e => setCustomerPONumber(e.target.value)} placeholder="e.g. ACME-PO-2026-441" className={inputCls} /></Field>
          <Field label="Account">
            <select value={orderAccountId} onChange={e => setOrderAccountId(e.target.value)} className={inputCls}>
              <option value="">— Select account (optional) —</option>
              {accountsList.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </Field>

          <div className="border-t border-border-subtle pt-3">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-text-muted mb-2"><MapPin className="w-3 h-3" /> Shipping Address</label>
            <div className="grid grid-cols-2 gap-2">
              <div className="col-span-2"><input value={shippingLine1} onChange={e => setShippingLine1(e.target.value)} placeholder="Address line 1" className={inputCls} /></div>
              <input value={shippingCity} onChange={e => setShippingCity(e.target.value)} placeholder="City" className={inputCls} />
              <input value={shippingState} onChange={e => setShippingState(e.target.value)} placeholder="State" className={inputCls} />
              <input value={shippingPostalCode} onChange={e => setShippingPostalCode(e.target.value)} placeholder="Postal code" className={inputCls} />
              <input value={shippingCountry} onChange={e => setShippingCountry(e.target.value)} placeholder="Country" className={inputCls} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-text-muted">Line Items</label>
              <button type="button" onClick={addLine} className="flex items-center gap-1 px-2 py-1 rounded-md border border-border-subtle text-xs text-text-secondary hover:text-text-primary hover:bg-bg-surface transition-all">
                <Plus className="w-3 h-3" /> Add Row
              </button>
            </div>
            <div className="space-y-2">
              {lines.map((l, i) => (
                <div key={i} className="grid grid-cols-[1fr_60px_80px_28px] gap-1.5 items-center">
                  <input value={l.productName} onChange={e => setLine(i, 'productName', e.target.value)} placeholder="Product name" className={inputCls} />
                  <input type="number" min="1" value={l.quantity} onChange={e => setLine(i, 'quantity', e.target.value)} className={inputCls} />
                  <input type="number" min="0" step="0.01" value={l.unitPrice} onChange={e => setLine(i, 'unitPrice', e.target.value)} placeholder="0.00" className={inputCls} />
                  <button type="button" onClick={() => removeLine(i)} disabled={lines.length === 1} className="p-1 rounded text-text-muted hover:text-danger disabled:opacity-30 transition-all">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-2 text-right text-sm font-bold text-text-primary">
              Total: {currency} {lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>

          <Field label="Notes">
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className={`${inputCls} resize-none`} />
          </Field>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={createOrder.isPending} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-brand text-bg text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-all">
              {createOrder.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Order'}
            </button>
            <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-lg border border-border-subtle text-sm text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-all">Cancel</button>
          </div>
        </form>
      </SlideOver>

      {/* Payment SlideOver */}
      <SlideOver open={showPayment} onClose={() => setShowPayment(false)} title="Record Payment">
        <form onSubmit={handlePayment} className="space-y-4">
          {selectedOrder && (
            <>
              <p className="text-sm text-text-muted">Order <span className="font-mono text-text-primary">{selectedOrder.orderNumber}</span></p>
              <Field label="Amount *">
                <input required type="number" min="0" step="0.01" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} className={inputCls} />
              </Field>
              <Field label="Payment Method">
                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className={inputCls}>
                  <option value="">Select...</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Mobile Payment">Mobile Payment</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </Field>
              <Field label="Reference">
                <input value={paymentRef} onChange={e => setPaymentRef(e.target.value)} placeholder="transaction-id" className={inputCls} />
              </Field>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={recordPayment.isPending} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-success text-bg text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-all">
                  {recordPayment.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Record Payment'}
                </button>
                <button type="button" onClick={() => setShowPayment(false)} className="px-4 py-2 rounded-lg border border-border-subtle text-sm text-text-secondary hover:text-text-primary transition-all">Cancel</button>
              </div>
            </>
          )}
        </form>
      </SlideOver>

      {/* New Shipment SlideOver */}
      <SlideOver open={showNewShipment} onClose={() => setShowNewShipment(false)} title="New Shipment">
        <form onSubmit={handleCreateShipment} className="space-y-4">
          <p className="text-sm text-text-muted">Order <span className="font-mono text-text-primary">{selectedOrder?.orderNumber}</span></p>
          <Field label="Carrier"><input value={shipCarrier} onChange={e => setShipCarrier(e.target.value)} placeholder="DHL, FedEx, etc." className={inputCls} /></Field>
          <Field label="Tracking Number"><input value={shipTracking} onChange={e => setShipTracking(e.target.value)} placeholder="tracking-number" className={inputCls} /></Field>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={createDelivery.isPending} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-brand text-bg text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-all">
              {createDelivery.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Shipment'}
            </button>
            <button type="button" onClick={() => setShowNewShipment(false)} className="px-4 py-2 rounded-lg border border-border-subtle text-sm text-text-secondary hover:text-text-primary transition-all">Cancel</button>
          </div>
        </form>
      </SlideOver>

      {/* Detail SlideOver */}
      <SlideOver open={!!selectedOrder && !showPayment && !showNewShipment} onClose={() => setSelectedOrder(null)} title="Order Detail">
        {selectedOrder && (
          <div className="space-y-5">
            <div>
              <div className="font-mono text-xs text-text-muted mb-1">{selectedOrder.orderNumber}</div>
              <div className="font-extrabold text-lg text-text-primary">{selectedOrder.contactName ?? selectedOrder.contactId}</div>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge value={selectedOrder.status} labels={CRM_ORDER_STATUS_LABELS} colors={CRM_ORDER_STATUS_COLORS} />
                <Badge value={selectedOrder.fulfillmentStatus} labels={CRM_ORDER_FULFILLMENT_LABELS} colors={FULFILLMENT_COLORS} />
                <Badge value={selectedOrder.paymentStatus} labels={CRM_ORDER_PAYMENT_LABELS} colors={CRM_ORDER_PAYMENT_COLORS} />
              </div>
            </div>

            {/* Financials */}
            <div className="bg-bg-surface rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-text-muted">Subtotal</span><span className="text-text-primary">{selectedOrder.currency} {selectedOrder.subtotal.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-text-muted">Tax</span><span className="text-text-primary">{selectedOrder.currency} {selectedOrder.taxAmount.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-text-muted">Discount</span><span className="text-text-primary">-{selectedOrder.currency} {selectedOrder.discountAmount.toLocaleString()}</span></div>
              <div className="flex justify-between font-bold border-t border-border-subtle pt-2"><span>Total</span><span>{selectedOrder.currency} {selectedOrder.totalAmount.toLocaleString()}</span></div>
              {selectedOrder.paidAt && <div className="flex justify-between text-success text-xs"><span>Paid</span><span>{format(parseISO(selectedOrder.paidAt), 'MMM d, yyyy')} ({selectedOrder.paymentMethod ?? '-'})</span></div>}
            </div>

            {/* Shipping */}
            {selectedOrder.shippingAddressLine1 && (
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-text-muted mb-1.5"><MapPin className="w-3 h-3" /> Shipping Address</label>
                <div className="text-sm text-text-primary bg-bg-surface rounded-xl p-3">
                  <p>{selectedOrder.shippingAddressLine1}</p>
                  {selectedOrder.shippingAddressLine2 && <p>{selectedOrder.shippingAddressLine2}</p>}
                  <p>{[selectedOrder.shippingCity, selectedOrder.shippingState, selectedOrder.shippingPostalCode].filter(Boolean).join(', ')}</p>
                  {selectedOrder.shippingCountry && <p>{selectedOrder.shippingCountry}</p>}
                </div>
              </div>
            )}

            {/* Tracking */}
            {selectedOrder.trackingNumber && (
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-text-muted mb-1.5"><Hash className="w-3 h-3" /> Tracking</label>
                <div className="text-sm text-text-primary bg-bg-surface rounded-xl p-3">
                  <p>Carrier: {selectedOrder.carrier ?? '-'}</p>
                  <p className="font-mono">{selectedOrder.trackingNumber}</p>
                  {selectedOrder.shippedAt && <p className="text-xs text-text-muted mt-1">Shipped: {format(parseISO(selectedOrder.shippedAt), 'MMM d, yyyy')}</p>}
                  {selectedOrder.actualDeliveryDate && <p className="text-xs text-text-muted">Delivered: {format(parseISO(selectedOrder.actualDeliveryDate), 'MMM d, yyyy')}</p>}
                </div>
              </div>
            )}

            {/* Shipments / Deliveries */}
            {deliveryList.length > 0 && (
              <div>
                <label className="text-xs font-semibold text-text-muted mb-1.5">Shipments ({deliveryList.length})</label>
                <div className="space-y-2">
                  {deliveryList.map(d => (
                    <div key={d.id} className="bg-bg-surface rounded-xl p-3 text-sm space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs text-text-secondary">{d.shipmentNumber}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${CRM_DELIVERY_STATUS_COLORS[d.status] ?? ''}`}>
                          {CRM_DELIVERY_STATUS_LABELS[d.status] ?? d.status}
                        </span>
                      </div>
                      {d.carrier && <div className="flex justify-between text-xs"><span className="text-text-muted">Carrier</span><span className="text-text-primary">{d.carrier}</span></div>}
                      {d.trackingNumber && <div className="flex justify-between text-xs"><span className="text-text-muted">Tracking</span><span className="font-mono text-text-primary">{d.trackingNumber}</span></div>}
                      {d.shippedAt && <div className="text-xs text-text-muted">Shipped: {format(parseISO(d.shippedAt), 'MMM d, yyyy')}</div>}
                      {d.deliveredAt && <div className="text-xs text-success">Delivered: {format(parseISO(d.deliveredAt), 'MMM d, yyyy')}</div>}
                      {d.failureReason && <div className="text-xs text-danger">Failed: {d.failureReason}</div>}
                      {d.status >= 1 && d.status <= 4 && (
                        <div className="flex gap-1 mt-1.5">
                          {d.status === 1 && <button onClick={() => updateDeliveryStatus.mutate({ deliveryId: d.id, data: { status: 2 } })} className="text-[10px] px-2 py-1 rounded border border-border-subtle text-text-secondary hover:bg-bg-elevated">Pick Up</button>}
                          {d.status === 2 && <button onClick={() => updateDeliveryStatus.mutate({ deliveryId: d.id, data: { status: 3 } })} className="text-[10px] px-2 py-1 rounded border border-border-subtle text-text-secondary hover:bg-bg-elevated">In Transit</button>}
                          {d.status === 3 && <button onClick={() => updateDeliveryStatus.mutate({ deliveryId: d.id, data: { status: 4 } })} className="text-[10px] px-2 py-1 rounded border border-border-subtle text-text-secondary hover:bg-bg-elevated">Out for Delivery</button>}
                          {d.status === 4 && (
                            <>
                              <button onClick={() => updateDeliveryStatus.mutate({ deliveryId: d.id, data: { status: 5 } })} className="text-[10px] px-2 py-1 rounded bg-success/10 text-success border border-success/20 hover:bg-success/20">Delivered</button>
                              <button onClick={() => updateDeliveryStatus.mutate({ deliveryId: d.id, data: { status: 6, failureReason: 'Delivery failed' } })} className="text-[10px] px-2 py-1 rounded bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20">Failed</button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pick List */}
            {selectedOrder.status === CrmOrderStatus.Confirmed && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-text-muted">Pick List</label>
                  {!pickList && (
                    <button onClick={() => generatePickList.mutate(selectedOrder.id, { onSuccess: () => refetchPickList() })} disabled={generatePickList.isPending}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border border-border-subtle text-text-secondary hover:text-brand hover:border-brand/40 transition-all">
                      {generatePickList.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Package className="w-3 h-3" />} Generate Pick List
                    </button>
                  )}
                </div>
                {pickList && (
                  <div className="bg-bg-surface rounded-xl p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-text-muted">Status: <span className="font-semibold text-text-primary">{PICK_LIST_STATUS_LABELS[pickList.status]}</span></span>
                      <div className="flex gap-1">
                        {pickList.status <= 2 && (
                          <button onClick={() => markPicked.mutate(pickList.orderId, { onSuccess: () => refetchPickList() })} disabled={markPicked.isPending}
                            className="text-[10px] px-2 py-1 rounded border border-border-subtle text-text-secondary hover:text-success hover:border-success/40 transition-all">
                            {markPicked.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : null} Mark All Picked
                          </button>
                        )}
                        {pickList.status === 3 && (
                          <button onClick={() => {
                            const boxC = prompt('Box count?');
                            const weight = prompt('Total weight (kg)?');
                            markPacked.mutate({ orderId: pickList.orderId, data: { boxCount: Number(boxC) || undefined, totalWeightKg: Number(weight) || undefined } }, { onSuccess: () => refetchPickList() });
                          }} disabled={markPacked.isPending}
                            className="text-[10px] px-2 py-1 rounded border border-success/20 bg-success/10 text-success hover:bg-success/20 transition-all">
                            Mark Packed
                          </button>
                        )}
                      </div>
                    </div>
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-left text-text-muted">
                          <th className="py-1 pr-2">Product</th>
                          <th className="py-1 pr-2">Location</th>
                          <th className="py-1 pr-2 text-right">To Pick</th>
                          <th className="py-1 pr-2 text-right">Picked</th>
                          <th className="py-1">Serials</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pickList.items.map((pi: PickListItemDto) => (
                          <tr key={pi.id} className="border-t border-border-subtle">
                            <td className="py-1.5 pr-2 text-text-primary font-medium">{pi.productName}</td>
                            <td className="py-1.5 pr-2 text-text-muted">{pi.warehouseLocation || '—'}</td>
                            <td className="py-1.5 pr-2 text-right">{pi.quantityToPick}</td>
                            <td className="py-1.5 pr-2 text-right">
                              {pickList.status <= 2 ? (
                                <input type="number" min={0} max={pi.quantityToPick} defaultValue={pi.quantityPicked}
                                  onBlur={(e) => {
                                    const val = Number(e.target.value);
                                    if (val !== pi.quantityPicked) {
                                      updatePickItem.mutate({ orderId: pickList.orderId, itemId: pi.id, data: { quantityPicked: val, serialNumbers: pi.serialNumbers } }, { onSuccess: () => refetchPickList() });
                                    }
                                  }}
                                  className="w-16 px-1.5 py-0.5 rounded bg-bg-elevated border border-border-subtle text-right text-xs" />
                              ) : (
                                <span className={pi.quantityPicked >= pi.quantityToPick ? 'text-success' : 'text-warning'}>{pi.quantityPicked}</span>
                              )}
                            </td>
                            <td className="py-1.5">
                              {pickList.status <= 2 ? (
                                <input placeholder="Serials (comma)" defaultValue={pi.serialNumbers || ''}
                                  onBlur={(e) => {
                                    const val = e.target.value;
                                    if (val !== (pi.serialNumbers || '')) {
                                      updatePickItem.mutate({ orderId: pickList.orderId, itemId: pi.id, data: { quantityPicked: pi.quantityPicked, serialNumbers: val || undefined } }, { onSuccess: () => refetchPickList() });
                                    }
                                  }}
                                  className="w-full px-1.5 py-0.5 rounded bg-bg-elevated border border-border-subtle text-xs" />
                              ) : (
                                <span className="text-text-muted">{pi.serialNumbers || '—'}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {pickList.boxCount != null && (
                      <div className="text-[11px] text-text-muted pt-2 border-t border-border-subtle">
                        Packed: {pickList.boxCount} box(es){pickList.totalWeightKg != null ? `, ${pickList.totalWeightKg} kg` : ''}
                        {pickList.notes ? ` — ${pickList.notes}` : ''}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Line Items */}
            {selectedOrder.lineItems?.length > 0 && (
              <div>
                <label className="text-xs font-semibold text-text-muted mb-1.5">Line Items</label>
                <div className="bg-bg-surface rounded-xl divide-y divide-border-subtle">
                  {selectedOrder.lineItems.map(li => (
                    <div key={li.id} className="flex justify-between items-center px-3 py-2 text-sm">
                      <div>
                        <span className="text-text-primary font-medium">{li.productName}</span>
                        {li.sku && <span className="text-text-muted text-xs ml-2">SKU: {li.sku}</span>}
                      </div>
                      <div className="text-right">
                        <span className="text-text-muted">{li.quantity} × {selectedOrder.currency} {li.unitPrice}</span>
                        <span className="text-text-primary font-medium ml-3">= {selectedOrder.currency} {li.totalPrice}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Field label="Customer PO #">
              {editingPOId === selectedOrder.id ? (
                <div className="flex gap-2">
                  <input value={editingPO} onChange={e => setEditingPO(e.target.value)} className="flex-1 px-2 py-1 rounded-lg bg-bg-elevated border border-border-subtle text-sm" autoFocus />
                  <button onClick={() => { updateOrder.mutate({ id: selectedOrder.id, data: { customerPONumber: editingPO.trim() || undefined } }); setEditingPOId(''); }} className="text-xs text-success hover:underline font-medium">Save</button>
                  <button onClick={() => setEditingPOId('')} className="text-xs text-text-muted hover:underline">Cancel</button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-text-primary font-semibold">{selectedOrder.customerPONumber || '—'}</span>
                  <button onClick={() => { setEditingPO(selectedOrder.customerPONumber ?? ''); setEditingPOId(selectedOrder.id); }} className="text-[10px] text-brand hover:underline font-medium">{selectedOrder.customerPONumber ? 'Edit' : 'Add'}</button>
                </div>
              )}
            </Field>
            {selectedOrder.acknowledgmentSentAt && <Field label="Acknowledgment Sent"><span className="text-sm text-text-muted">{format(new Date(selectedOrder.acknowledgmentSentAt), 'MMM d, yyyy HH:mm')}</span></Field>}
            {selectedOrder.notes && <div><label className="text-xs font-semibold text-text-muted mb-1">Notes</label><p className="text-sm text-text-secondary bg-bg-surface rounded-xl p-3">{selectedOrder.notes}</p></div>}
            {selectedOrder.cancellationReason && <div><label className="text-xs font-semibold text-danger mb-1">Cancellation Reason</label><p className="text-sm text-danger bg-danger-soft rounded-xl p-3">{selectedOrder.cancellationReason}</p></div>}

            {/* Actions */}
            <div className="flex flex-wrap gap-2 pt-3 border-t border-border-subtle">
              {selectedOrder.status === 1 && (
                <button onClick={() => {
                  if (selectedOrder.accountId) {
                    creditCheck.mutate({ accountId: selectedOrder.accountId, orderValue: selectedOrder.totalAmount }, {
                      onSuccess: (res: any) => {
                        const result = { ...res };
                        if (!selectedOrder.customerPONumber) setConfirmOverrideNote(PO_WARNING);
                        setCreditResult(result);
                      },
                      onError: () => {
                        if (!selectedOrder.customerPONumber) { setCreditResult({ riskLevel: 2, overdueBalance: 0, overdueInvoiceCount: 0, utilizedCredit: 0, availableCredit: 0, creditLimit: null }); setConfirmOverrideNote(PO_WARNING); }
                        else confirmOrder.mutate(selectedOrder.id);
                      },
                    });
                  } else {
                    if (!selectedOrder.customerPONumber) {
                      setCreditResult({ riskLevel: 2, overdueBalance: 0, overdueInvoiceCount: 0, utilizedCredit: 0, availableCredit: 0, creditLimit: null });
                      setConfirmOverrideNote(PO_WARNING);
                      return;
                    }
                    confirmOrder.mutate(selectedOrder.id);
                  }
                }} disabled={confirmOrder.isPending || creditCheck.isPending} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border-subtle text-xs font-semibold text-text-secondary hover:text-success hover:bg-success-soft transition-all disabled:opacity-50">
                  {creditCheck.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />} Confirm
                </button>
              )}
              {selectedOrder.status === 2 && (
                <>
                  <button onClick={() => handleFulfillStatus(selectedOrder.id, 3)} disabled={updateFulfillment.isPending} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border-subtle text-xs font-semibold text-text-secondary hover:text-brand transition-all disabled:opacity-50">
                    <Truck className="w-3.5 h-3.5" /> Mark Shipped
                  </button>
                  <button onClick={() => fulfillOrder.mutate(selectedOrder.id)} disabled={fulfillOrder.isPending} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-success bg-success-soft border border-[rgba(34,197,94,0.2)] hover:opacity-80 transition-all disabled:opacity-50">
                    <CheckCircle className="w-3.5 h-3.5" /> Mark Delivered
                  </button>
                </>
              )}
              {(selectedOrder.status === 2 || selectedOrder.status === 3) && (
                <>
                  <button onClick={() => acknowledgeOrder.mutate(selectedOrder.id)} disabled={acknowledgeOrder.isPending} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border-subtle text-xs font-semibold text-text-secondary hover:text-brand transition-all disabled:opacity-50">
                    <CheckCircle className="w-3.5 h-3.5" /> {selectedOrder.acknowledgmentSentAt ? 'Resend Acknowledgment' : 'Send Acknowledgment'}
                  </button>
                  {selectedOrder.dealId && (
                    <button onClick={() => generateInvoice.mutate(selectedOrder.dealId!)} disabled={generateInvoice.isPending} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border-subtle text-xs font-semibold text-text-secondary hover:text-success transition-all disabled:opacity-50">
                      {generateInvoice.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <DollarSign className="w-3.5 h-3.5" />} Generate Invoice
                    </button>
                  )}
                </>
              )}
              {selectedOrder.status >= 1 && selectedOrder.status <= 3 && (
                <>
                  <button onClick={() => { setShowNewShipment(true); }} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border-subtle text-xs font-semibold text-text-secondary hover:text-brand transition-all">
                    <Truck className="w-3.5 h-3.5" /> New Shipment
                  </button>
                  <button onClick={() => { setShowPayment(true); setPaymentAmount(String(selectedOrder.totalAmount)); }} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border-subtle text-xs font-semibold text-text-secondary hover:text-success transition-all">
                    <DollarSign className="w-3.5 h-3.5" /> Record Payment
                  </button>
                  <button onClick={() => cancelOrder.mutate(selectedOrder.id)} disabled={cancelOrder.isPending} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[rgba(244,63,94,0.2)] text-xs font-semibold text-danger bg-danger-soft hover:opacity-80 transition-all disabled:opacity-50">
                    <XCircle className="w-3.5 h-3.5" /> Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </SlideOver>

      {/* Credit Check Modal */}
      {creditResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-md bg-bg border border-border-subtle rounded-2xl p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> Credit Check — {creditResult.riskLevel === 1 ? 'Green' : creditResult.riskLevel === 2 ? 'Amber' : 'Red'}
            </h3>
            <div className="space-y-2 text-sm">
              <p className="flex justify-between"><span className="text-text-muted">Overdue</span><span className={creditResult.overdueBalance > 0 ? 'text-danger font-semibold' : ''}>${creditResult.overdueBalance?.toLocaleString() ?? '0'} ({creditResult.overdueInvoiceCount} invoice{creditResult.overdueInvoiceCount !== 1 ? 's' : ''})</span></p>
              <p className="flex justify-between"><span className="text-text-muted">Credit Limit</span><span>{creditResult.creditLimit ? `$${creditResult.creditLimit.toLocaleString()}` : '—'}</span></p>
              <p className="flex justify-between"><span className="text-text-muted">Utilized</span><span>${creditResult.utilizedCredit?.toLocaleString() ?? '0'}</span></p>
              <p className="flex justify-between"><span className="text-text-muted">Available</span><span className={creditResult.availableCredit < 0 ? 'text-danger font-semibold' : 'text-success font-semibold'}>${Math.max(0, creditResult.availableCredit ?? 0).toLocaleString()}</span></p>
            </div>

            {confirmOverrideNote === PO_WARNING && (
              <p className="text-xs text-warning bg-warning-soft px-3 py-2 rounded-xl flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 shrink-0" /> B2B customers typically require their PO number on invoices.</p>
            )}

            {creditResult.riskLevel === 1 && !confirmOverrideNote && (
              <p className="text-xs text-success bg-success-soft px-3 py-2 rounded-xl">Account in good standing — no overdue, sufficient credit.</p>
            )}
            {creditResult.riskLevel >= 2 || confirmOverrideNote === PO_WARNING ? (
              <div className="space-y-2">
                {creditResult.riskLevel === 2 && confirmOverrideNote !== PO_WARNING && (
                  <p className="text-xs text-warning bg-warning-soft px-3 py-2 rounded-xl">Account has ${creditResult.overdueBalance?.toLocaleString()} overdue. Proceed with caution.</p>
                )}
                {creditResult.riskLevel === 3 && (
                  <p className="text-xs text-danger bg-danger-soft px-3 py-2 rounded-xl">Account over credit limit. Order blocked — manager override required.</p>
                )}
                {(creditResult.riskLevel >= 2 || confirmOverrideNote === PO_WARNING) && (
                  <input value={confirmOverrideNote} onChange={e => setConfirmOverrideNote(e.target.value)} placeholder="Add a note explaining why..." className="w-full px-3 py-2 rounded-xl bg-bg-elevated border border-border-subtle text-sm" />
                )}
              </div>
            ) : null}

            <div className="flex gap-2 justify-end">
              <button onClick={() => { setCreditResult(null); setConfirmOverrideNote(''); }} className="px-4 py-2 rounded-xl text-sm font-semibold text-text-secondary border border-border-subtle hover:bg-bg-elevated">Cancel</button>
              {(creditResult.riskLevel === 1 || creditResult.riskLevel === 2) && (
                <button onClick={() => { confirmOrder.mutate(selectedOrder!.id); setCreditResult(null); setConfirmOverrideNote(''); }} disabled={confirmOrder.isPending}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white bg-success hover:opacity-90 disabled:opacity-50">
                  {confirmOrder.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Confirm Order
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
