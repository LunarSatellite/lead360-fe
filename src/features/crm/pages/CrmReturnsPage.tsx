import { useState } from 'react';
import { X, Loader2, RotateCcw, CheckCircle, XCircle, Package } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import {
  useReturns, useApproveReturn, useRejectReturn,
  useMarkReturnReceived, useRecordReturnInspection, useUpdateReturn, useResolveReturn, useCancelReturn,
} from '../api/crm.queries';
import type { CrmReturnFilter, CrmReturnRequestDto, CrmRecordInspectionRequest } from '../types/crm.types';
import {
  CRM_RETURN_STATUS_LABELS, CRM_RETURN_STATUS_COLORS,
  CRM_RETURN_REASON_LABELS, CRM_RETURN_RESOLUTION_LABELS,
  CRM_RETURN_INSPECTION_LABELS,
  CrmReturnStatus, CrmReturnInspectionResult, CrmReturnResolution,
} from '../types/crm.types';

const inputCls = 'w-full rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand/40';

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
      <div className="relative w-[600px] h-full flex flex-col bg-bg-shell border-l border-border-subtle" style={{ boxShadow: '-8px 0 40px rgba(0,0,0,0.5)' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle shrink-0">
          <h3 className="font-bold text-text-primary">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-surface transition-all"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function InspectionForm({ rmaId, onDone }: { rmaId: string; onDone: () => void }) {
  const [result, setResult] = useState<number>(1);
  const [findings, setFindings] = useState('');
  const [disposition, setDisposition] = useState('');
  const record = useRecordReturnInspection();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: CrmRecordInspectionRequest = {
      result: result as CrmReturnInspectionResult,
      findings: findings || undefined,
      disposition: disposition || undefined,
    };
    record.mutate({ id: rmaId, data }, { onSuccess: onDone });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 bg-bg-surface rounded-xl p-4 mt-3">
      <p className="text-xs font-semibold text-text-muted">Record Inspection</p>
      <select value={result} onChange={e => setResult(Number(e.target.value))} className={inputCls}>
        {Object.entries(CRM_RETURN_INSPECTION_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
      </select>
      <input value={findings} onChange={e => setFindings(e.target.value)} placeholder="Findings (optional)" className={inputCls} />
      <input value={disposition} onChange={e => setDisposition(e.target.value)} placeholder="Disposition (optional)" className={inputCls} />
      <button type="submit" disabled={record.isPending} className="w-full py-2 rounded-lg bg-brand text-bg text-xs font-bold hover:opacity-90 disabled:opacity-50 transition-all">
        {record.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Save Inspection'}
      </button>
    </form>
  );
}

function ResolveForm({ rmaId, onDone }: { rmaId: string; onDone: () => void }) {
  const [resolution, setResolution] = useState<CrmReturnResolution>(CrmReturnResolution.Refund);
  const [amount, setAmount] = useState('');
  const update = useUpdateReturn();
  const resolve = useResolveReturn();

  const needsAmount = resolution === CrmReturnResolution.Refund || resolution === CrmReturnResolution.Credit;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    update.mutate({
      id: rmaId,
      data: {
        resolution,
        refundAmount: resolution === CrmReturnResolution.Refund ? Number(amount) : undefined,
        creditAmount: resolution === CrmReturnResolution.Credit ? Number(amount) : undefined,
      },
    }, {
      onSuccess: () => resolve.mutate(rmaId, { onSuccess: onDone }),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 bg-bg-surface rounded-xl p-4 mt-3">
      <p className="text-xs font-semibold text-text-muted">Set Resolution</p>
      <select value={resolution} onChange={e => setResolution(Number(e.target.value) as CrmReturnResolution)} className={inputCls}>
        {Object.entries(CRM_RETURN_RESOLUTION_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
      </select>
      {needsAmount && (
        <input
          required type="number" min="0" step="0.01" value={amount} onChange={e => setAmount(e.target.value)}
          placeholder={resolution === CrmReturnResolution.Refund ? 'Refund amount' : 'Credit amount'}
          className={inputCls}
        />
      )}
      <button type="submit" disabled={update.isPending || resolve.isPending} className="w-full py-2 rounded-lg bg-success text-bg text-xs font-bold hover:opacity-90 disabled:opacity-50 transition-all">
        {update.isPending || resolve.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Save & Resolve'}
      </button>
      {(resolution === CrmReturnResolution.Refund || resolution === CrmReturnResolution.Credit) && (
        <p className="text-[10px] text-text-muted">A Credit Note will be auto-issued for this amount once resolved.</p>
      )}
    </form>
  );
}

function DetailPanel({ rma }: { rma: CrmReturnRequestDto }) {
  const approve = useApproveReturn();
  const reject = useRejectReturn();
  const receive = useMarkReturnReceived();
  const cancel = useCancelReturn();
  const [showInspect, setShowInspect] = useState(false);
  const [showResolve, setShowResolve] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showReject, setShowReject] = useState(false);

  const handleReject = (e: React.FormEvent) => {
    e.preventDefault();
    reject.mutate({ id: rma.id, reason: rejectReason }, { onSuccess: () => setShowReject(false) });
  };

  return (
    <div className="space-y-5">
      <div>
        <div className="font-mono text-xs text-text-muted mb-1">{rma.rmaNumber}</div>
        <div className="flex items-center gap-2 flex-wrap mt-2">
          <Badge value={rma.status} labels={CRM_RETURN_STATUS_LABELS} colors={CRM_RETURN_STATUS_COLORS} />
          <span className="text-xs text-text-muted bg-bg-surface px-2 py-0.5 rounded-full">{CRM_RETURN_REASON_LABELS[rma.returnReason]}</span>
          {rma.resolution != null && (
            <span className="text-xs font-semibold text-[#A78BFA] bg-[rgba(167,139,250,0.1)] px-2 py-0.5 rounded-full border border-[rgba(167,139,250,0.2)]">
              {CRM_RETURN_RESOLUTION_LABELS[rma.resolution]}
            </span>
          )}
        </div>
      </div>

      <div className="bg-bg-surface rounded-xl p-4 space-y-2 text-sm">
        <div className="flex justify-between"><span className="text-text-muted">Currency</span><span className="text-text-primary">{rma.currency}</span></div>
        {rma.refundAmount != null && <div className="flex justify-between"><span className="text-text-muted">Refund</span><span className="text-success font-medium">{rma.currency} {rma.refundAmount.toLocaleString()}</span></div>}
        {rma.creditAmount != null && <div className="flex justify-between"><span className="text-text-muted">Credit</span><span className="text-brand font-medium">{rma.currency} {rma.creditAmount.toLocaleString()}</span></div>}
        {rma.returnCarrier && <div className="flex justify-between"><span className="text-text-muted">Return Carrier</span><span>{rma.returnCarrier}</span></div>}
        {rma.returnTrackingNumber && <div className="flex justify-between"><span className="text-text-muted">Return Tracking</span><span className="font-mono text-xs">{rma.returnTrackingNumber}</span></div>}
        {rma.approvedAt && <div className="flex justify-between text-xs"><span className="text-text-muted">Approved</span><span>{format(parseISO(rma.approvedAt), 'MMM d, yyyy')}</span></div>}
        {rma.receivedAt && <div className="flex justify-between text-xs"><span className="text-text-muted">Received</span><span>{format(parseISO(rma.receivedAt), 'MMM d, yyyy')}</span></div>}
        {rma.resolvedAt && <div className="flex justify-between text-xs"><span className="text-text-muted">Resolved</span><span className="text-success">{format(parseISO(rma.resolvedAt), 'MMM d, yyyy')}</span></div>}
        {rma.customerNotes && <div><span className="text-text-muted block text-xs mb-1">Customer Notes</span><p className="text-text-secondary text-xs">{rma.customerNotes}</p></div>}
        {rma.staffNotes && <div><span className="text-text-muted block text-xs mb-1">Staff Notes</span><p className="text-text-secondary text-xs">{rma.staffNotes}</p></div>}
        {rma.rejectionReason && <div><span className="text-danger block text-xs mb-1">Rejection Reason</span><p className="text-danger text-xs">{rma.rejectionReason}</p></div>}
      </div>

      {rma.lineItems.length > 0 && (
        <div>
          <label className="text-xs font-semibold text-text-muted mb-2 block">Line Items</label>
          <div className="bg-bg-surface rounded-xl divide-y divide-border-subtle">
            {rma.lineItems.map(li => (
              <div key={li.id} className="flex justify-between items-center px-3 py-2 text-sm">
                <div>
                  <span className="font-medium text-text-primary">{li.productName}</span>
                  {li.sku && <span className="text-text-muted text-xs ml-2">SKU: {li.sku}</span>}
                  <div className="text-xs text-text-muted">{li.quantityReturned}/{li.quantityOrdered} returned</div>
                </div>
                <span className="text-text-secondary">{rma.currency} {li.totalPrice.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {rma.inspections.length > 0 && (
        <div>
          <label className="text-xs font-semibold text-text-muted mb-2 block">Inspections</label>
          <div className="space-y-2">
            {rma.inspections.map(ins => (
              <div key={ins.id} className="bg-bg-surface rounded-xl p-3 text-xs space-y-1">
                <div className="flex justify-between"><span className="font-semibold text-text-primary">{CRM_RETURN_INSPECTION_LABELS[ins.result as CrmReturnInspectionResult]}</span>{ins.inspectedAt && <span className="text-text-muted">{format(parseISO(ins.inspectedAt), 'MMM d, yyyy')}</span>}</div>
                {ins.findings && <p className="text-text-secondary">{ins.findings}</p>}
                {ins.disposition && <p className="text-text-muted">Disposition: {ins.disposition}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-3 border-t border-border-subtle">
        {rma.status === CrmReturnStatus.PendingApproval && (
          <>
            <button onClick={() => approve.mutate(rma.id)} disabled={approve.isPending} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-success bg-success-soft border border-[rgba(34,197,94,0.2)] hover:opacity-80 disabled:opacity-50 transition-all">
              <CheckCircle className="w-3.5 h-3.5" /> Approve
            </button>
            <button onClick={() => setShowReject(v => !v)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-danger bg-danger-soft border border-[rgba(244,63,94,0.2)] hover:opacity-80 transition-all">
              <XCircle className="w-3.5 h-3.5" /> Reject
            </button>
          </>
        )}
        {(rma.status === CrmReturnStatus.Approved || rma.status === CrmReturnStatus.AwaitingReceive) && (
          <button onClick={() => receive.mutate(rma.id)} disabled={receive.isPending} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border-subtle text-xs font-semibold text-text-secondary hover:text-brand hover:bg-brand-soft transition-all disabled:opacity-50">
            <Package className="w-3.5 h-3.5" /> Mark Received
          </button>
        )}
        {rma.status === CrmReturnStatus.Received && (
          <button onClick={() => setShowInspect(v => !v)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border-subtle text-xs font-semibold text-text-secondary hover:text-[#F59E0B] transition-all">
            Record Inspection
          </button>
        )}
        {rma.status === CrmReturnStatus.Inspecting && (
          <button onClick={() => setShowResolve(v => !v)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-success bg-success-soft border border-[rgba(34,197,94,0.2)] hover:opacity-80 transition-all">
            <CheckCircle className="w-3.5 h-3.5" /> Resolve
          </button>
        )}
        {rma.status < CrmReturnStatus.Resolved && rma.status !== CrmReturnStatus.Cancelled && (
          <button onClick={() => cancel.mutate(rma.id)} disabled={cancel.isPending} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border-subtle text-xs font-semibold text-text-muted hover:text-danger transition-all disabled:opacity-50">
            Cancel
          </button>
        )}
      </div>

      {showReject && (
        <form onSubmit={handleReject} className="space-y-2 bg-bg-surface rounded-xl p-4 mt-1">
          <input required value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Reason for rejection..." className={inputCls} />
          <button type="submit" disabled={reject.isPending} className="w-full py-2 rounded-lg bg-danger text-bg text-xs font-bold hover:opacity-90 disabled:opacity-50 transition-all">
            {reject.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Confirm Reject'}
          </button>
        </form>
      )}
      {showInspect && <InspectionForm rmaId={rma.id} onDone={() => setShowInspect(false)} />}
      {showResolve && <ResolveForm rmaId={rma.id} onDone={() => setShowResolve(false)} />}
    </div>
  );
}

export function Component() {
  const [filter, setFilter] = useState<CrmReturnFilter>({ page: 1, pageSize: 20 });
  const [search, setSearch] = useState('');
  const [statusF, setStatusF] = useState('');
  const [selected, setSelected] = useState<CrmReturnRequestDto | null>(null);

  const { data: raw, isLoading } = useReturns(filter);
  const items: CrmReturnRequestDto[] = (raw as any)?.item1 ?? [];
  const total: number = (raw as any)?.item2 ?? 0;

  const applyFilter = () => {
    setFilter(f => ({
      ...f, page: 1,
      search: search || undefined,
      status: statusF ? Number(statusF) as CrmReturnStatus : undefined,
    }));
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-text-primary tracking-tight">Returns / RMA</h2>
            <p className="text-xs text-text-muted mt-0.5">Manage return requests, inspections, and resolutions</p>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && applyFilter()} placeholder="Search RMA #..." className="flex-1 min-w-48 rounded-xl border border-border-subtle bg-bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-glow" />
          <select value={statusF} onChange={e => setStatusF(e.target.value)} className="rounded-xl border border-border-subtle bg-bg-elevated px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-border-glow">
            <option value="">All Status</option>
            {Object.entries(CRM_RETURN_STATUS_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
          <button onClick={applyFilter} className="px-4 py-2 rounded-xl border border-border-subtle bg-bg-elevated text-sm text-text-secondary hover:text-text-primary transition-all">Search</button>
        </div>

        <div className="rounded-2xl border border-border-subtle bg-bg-card overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-40 text-text-muted"><Loader2 className="w-5 h-5 animate-spin" /></div>
          ) : !items.length ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-text-muted">
              <RotateCcw className="w-8 h-8 opacity-30" strokeWidth={1.2} />
              <p className="text-sm">No return requests.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle">
                  {['RMA #', 'Status', 'Reason', 'Resolution', 'Items', 'Created'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map(r => (
                  <tr key={r.id} onClick={() => setSelected(r)} className="border-b border-border-subtle last:border-0 hover:bg-bg-elevated cursor-pointer transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-text-secondary">{r.rmaNumber}</td>
                    <td className="px-4 py-3"><Badge value={r.status} labels={CRM_RETURN_STATUS_LABELS} colors={CRM_RETURN_STATUS_COLORS} /></td>
                    <td className="px-4 py-3 text-text-secondary text-xs">{CRM_RETURN_REASON_LABELS[r.returnReason]}</td>
                    <td className="px-4 py-3 text-text-muted text-xs">{r.resolution != null ? CRM_RETURN_RESOLUTION_LABELS[r.resolution] : '—'}</td>
                    <td className="px-4 py-3 text-text-secondary">{r.lineItems.length}</td>
                    <td className="px-4 py-3 text-text-muted text-xs">{format(parseISO(r.createdAt), 'MMM d, yyyy')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {total > filter.pageSize! && (
          <div className="flex items-center justify-between text-sm text-text-muted">
            <span>{total} total</span>
            <div className="flex gap-2">
              <button disabled={filter.page === 1} onClick={() => setFilter(f => ({ ...f, page: (f.page ?? 1) - 1 }))} className="px-3 py-1.5 rounded-lg border border-border-subtle hover:bg-bg-elevated disabled:opacity-40 transition-all">Prev</button>
              <button disabled={(filter.page ?? 1) * (filter.pageSize ?? 20) >= total} onClick={() => setFilter(f => ({ ...f, page: (f.page ?? 1) + 1 }))} className="px-3 py-1.5 rounded-lg border border-border-subtle hover:bg-bg-elevated disabled:opacity-40 transition-all">Next</button>
            </div>
          </div>
        )}
      </div>

      <SlideOver open={!!selected} onClose={() => setSelected(null)} title="Return Request">
        {selected && <DetailPanel rma={selected} />}
      </SlideOver>
    </>
  );
}
