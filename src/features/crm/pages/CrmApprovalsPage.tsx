import { useState } from 'react';
import { CheckCircle2, XCircle, Clock, Loader2, ShieldCheck, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useApprovals, usePendingApprovals, useApproveRequest, useRejectRequest } from '../api/crm.queries';
import type { CrmApprovalSummaryDto } from '../types/crm.types';
import {
  ApprovalStatus, APPROVAL_STATUS_LABELS, APPROVAL_STATUS_COLORS,
  APPROVAL_ENTITY_TYPE_LABELS,
} from '../types/crm.types';

// ─── Review Modal ──────────────────────────────────────────────────────────────

function ReviewModal({
  mode, approval, onClose,
}: { mode: 'approve' | 'reject'; approval: CrmApprovalSummaryDto; onClose: () => void }) {
  const [comment, setComment] = useState('');
  const approve = useApproveRequest();
  const reject = useRejectRequest();
  const mutation = mode === 'approve' ? approve : reject;

  const handleSubmit = () => {
    mutation.mutate({ id: approval.id, data: { comment: comment.trim() || undefined } }, {
      onSuccess: onClose,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-bg-card border border-border-subtle shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-text-primary">
              {mode === 'approve' ? 'Approve' : 'Reject'} — {approval.entityName}
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              Requested by {approval.requestedByUserName}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-text-muted hover:bg-bg-elevated">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <label className="text-xs text-text-muted font-semibold uppercase tracking-wide block mb-1.5">
            Comment {mode === 'reject' ? '(required)' : '(optional)'}
          </label>
          <textarea
            autoFocus
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder={mode === 'approve' ? 'Add a note…' : 'Reason for rejection…'}
            className="w-full px-3 py-2 rounded-xl text-sm border border-border-subtle bg-bg-elevated text-text-primary focus:outline-none focus:ring-1 focus:ring-brand resize-none"
          />
        </div>

        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-semibold text-text-secondary border border-border-subtle hover:bg-bg-elevated">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={mutation.isPending || (mode === 'reject' && !comment.trim())}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-50 ${
              mode === 'approve' ? 'bg-success hover:bg-success/80' : 'bg-danger hover:bg-danger/80'
            }`}
          >
            {mutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : mode === 'approve' ? (
              <><CheckCircle2 className="w-4 h-4" /> Approve</>
            ) : (
              <><XCircle className="w-4 h-4" /> Reject</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Approval Row ──────────────────────────────────────────────────────────────

function ApprovalRow({ approval }: { approval: CrmApprovalSummaryDto }) {
  const [reviewMode, setReviewMode] = useState<'approve' | 'reject' | null>(null);
  const isPending = approval.status === ApprovalStatus.Pending;

  return (
    <>
      {reviewMode && (
        <ReviewModal
          mode={reviewMode}
          approval={approval}
          onClose={() => setReviewMode(null)}
        />
      )}
      <div className="flex items-start gap-4 py-4 border-b border-border-subtle last:border-0">
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-text-primary">{approval.entityName}</span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-bg-elevated text-text-muted border border-border-subtle">
              {APPROVAL_ENTITY_TYPE_LABELS[approval.entityType]}
            </span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold border ${APPROVAL_STATUS_COLORS[approval.status]}`}>
              {approval.status === ApprovalStatus.Pending && <Clock className="w-3 h-3" />}
              {approval.status === ApprovalStatus.Approved && <CheckCircle2 className="w-3 h-3" />}
              {approval.status === ApprovalStatus.Rejected && <XCircle className="w-3 h-3" />}
              {APPROVAL_STATUS_LABELS[approval.status]}
            </span>
          </div>

          <p className="text-xs text-text-muted">
            Requested by <span className="text-text-secondary font-medium">{approval.requestedByUserName}</span>
            {' · '}{formatDistanceToNow(new Date(approval.createdAt), { addSuffix: true })}
            {approval.assignedToUserName && (
              <> · Assigned to <span className="text-text-secondary font-medium">{approval.assignedToUserName}</span></>
            )}
          </p>

          {approval.comment && (
            <p className="text-xs text-text-secondary italic">"{approval.comment}"</p>
          )}
        </div>

        {isPending && (
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setReviewMode('approve')}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-success hover:bg-success/80"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Approve
            </button>
            <button
              onClick={() => setReviewMode('reject')}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-danger hover:bg-danger/80"
            >
              <XCircle className="w-3.5 h-3.5" /> Reject
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Tab = 'pending' | 'all';

export function Component() {
  const [tab, setTab] = useState<Tab>('pending');
  const { data: pendingRaw, isLoading: pendingLoading } = usePendingApprovals();
  const { data: allRaw, isLoading: allLoading } = useApprovals();

  const pending = (pendingRaw as unknown as CrmApprovalSummaryDto[] | undefined) ?? [];
  const all = (allRaw as unknown as CrmApprovalSummaryDto[] | undefined) ?? [];
  const displayed = tab === 'pending' ? pending : all;
  const isLoading = tab === 'pending' ? pendingLoading : allLoading;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-text-primary tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-brand" strokeWidth={1.5} />
            Approvals
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            Review and action approval requests for quotes, proposals, and deals.
          </p>
        </div>

        {pending.length > 0 && (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-warning-soft text-warning border border-[rgba(245,158,11,0.3)]">
            {pending.length} pending
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border-subtle">
        {([['pending', 'Pending'], ['all', 'All Requests']] as [Tab, string][]).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            className={`px-4 py-2 text-sm font-semibold transition-colors border-b-2 -mb-px ${
              tab === value
                ? 'border-brand text-brand'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            {label}
            {value === 'pending' && pending.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-warning-soft text-warning">
                {pending.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="rounded-2xl border border-border-subtle bg-bg-card">
        {isLoading ? (
          <div className="flex items-center justify-center h-40 text-text-muted">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-16 text-text-muted">
            <ShieldCheck className="w-10 h-10 mx-auto mb-3 opacity-30" strokeWidth={1} />
            <p className="text-sm font-semibold">
              {tab === 'pending' ? 'No pending approvals' : 'No approval requests yet'}
            </p>
            {tab === 'pending' && (
              <p className="text-xs mt-1">All caught up — nothing waiting for your review.</p>
            )}
          </div>
        ) : (
          <div className="px-5">
            {displayed.map((a) => (
              <ApprovalRow key={a.id} approval={a} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
