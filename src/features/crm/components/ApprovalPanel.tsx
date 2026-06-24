import { useState } from 'react';
import { CheckCircle2, XCircle, Clock, Send, X, Loader2 } from 'lucide-react';
import {
  useApprovalForEntity, useSubmitApproval, useApproveRequest,
  useRejectRequest, useCancelApproval,
} from '../api/crm.queries';
import type { CrmApprovalSummaryDto, CrmSubmitApprovalRequest } from '../types/crm.types';
import {
  ApprovalEntityType, ApprovalStatus,
  APPROVAL_STATUS_LABELS, APPROVAL_STATUS_COLORS,
} from '../types/crm.types';
import { formatDistanceToNow } from 'date-fns';

interface Props {
  entityType: ApprovalEntityType;
  entityId: string;
  entityName: string;
}

function ReviewModal({
  mode,
  approvalId,
  onClose,
}: {
  mode: 'approve' | 'reject';
  approvalId: string;
  onClose: () => void;
}) {
  const [comment, setComment] = useState('');
  const approve = useApproveRequest();
  const reject = useRejectRequest();

  const mutation = mode === 'approve' ? approve : reject;

  const handleSubmit = () => {
    mutation.mutate({ id: approvalId, data: { comment: comment.trim() || undefined } }, {
      onSuccess: onClose,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-bg-card border border-border-subtle shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-text-primary">
            {mode === 'approve' ? 'Approve Request' : 'Reject Request'}
          </h3>
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

function StatusBadge({ status }: { status: ApprovalStatus }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold border ${APPROVAL_STATUS_COLORS[status]}`}>
      {status === ApprovalStatus.Pending && <Clock className="w-3 h-3" />}
      {status === ApprovalStatus.Approved && <CheckCircle2 className="w-3 h-3" />}
      {status === ApprovalStatus.Rejected && <XCircle className="w-3 h-3" />}
      {APPROVAL_STATUS_LABELS[status]}
    </span>
  );
}

export function ApprovalPanel({ entityType, entityId, entityName }: Props) {
  const { data: raw, isLoading } = useApprovalForEntity(entityType, entityId);
  const approval = raw as unknown as CrmApprovalSummaryDto | null | undefined;
  const submit = useSubmitApproval();
  const cancel = useCancelApproval();
  const [reviewMode, setReviewMode] = useState<'approve' | 'reject' | null>(null);

  const handleSubmit = () => {
    const req: CrmSubmitApprovalRequest = { entityType, entityId, entityName };
    submit.mutate(req);
  };

  if (isLoading) return null;

  const hasPending = approval?.status === ApprovalStatus.Pending;
  const hasReviewed = approval?.status === ApprovalStatus.Approved || approval?.status === ApprovalStatus.Rejected;

  return (
    <>
      {reviewMode && approval && (
        <ReviewModal
          mode={reviewMode}
          approvalId={approval.id}
          onClose={() => setReviewMode(null)}
        />
      )}

      <div className="rounded-2xl border border-border-subtle bg-bg-card p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-bold text-text-primary">Approval</p>
          {approval && <StatusBadge status={approval.status} />}
        </div>

        {!approval && (
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-text-muted">Not yet submitted for approval.</p>
            <button
              onClick={handleSubmit}
              disabled={submit.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-bg bg-brand hover:bg-brand-light disabled:opacity-50"
            >
              {submit.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Send className="w-3.5 h-3.5" /> Submit for Approval</>}
            </button>
          </div>
        )}

        {hasPending && approval && (
          <div className="space-y-2">
            <p className="text-xs text-text-muted">
              Submitted by <span className="text-text-secondary font-semibold">{approval.requestedByUserName}</span>
              {' '}· {formatDistanceToNow(new Date(approval.createdAt), { addSuffix: true })}
              {approval.assignedToUserName && (
                <> · Assigned to <span className="text-text-secondary font-semibold">{approval.assignedToUserName}</span></>
              )}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setReviewMode('approve')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-success hover:bg-success/80"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Approve
              </button>
              <button
                onClick={() => setReviewMode('reject')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-danger hover:bg-danger/80"
              >
                <XCircle className="w-3.5 h-3.5" /> Reject
              </button>
              <button
                onClick={() => cancel.mutate(approval.id)}
                disabled={cancel.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-text-secondary border border-border-subtle hover:bg-bg-elevated disabled:opacity-50 ml-auto"
              >
                Cancel Request
              </button>
            </div>
          </div>
        )}

        {hasReviewed && approval && (
          <div className="space-y-2">
            <p className="text-xs text-text-muted">
              Reviewed {approval.reviewedAt ? formatDistanceToNow(new Date(approval.reviewedAt), { addSuffix: true }) : ''}
              {' '}by <span className="text-text-secondary font-semibold">{approval.assignedToUserName ?? 'Manager'}</span>
            </p>
            {approval.comment && (
              <p className="text-xs text-text-secondary bg-bg-elevated rounded-xl px-3 py-2 italic">
                "{approval.comment}"
              </p>
            )}
            <button
              onClick={handleSubmit}
              disabled={submit.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-text-secondary border border-border-subtle hover:bg-bg-elevated disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" /> Resubmit for Approval
            </button>
          </div>
        )}
      </div>
    </>
  );
}
