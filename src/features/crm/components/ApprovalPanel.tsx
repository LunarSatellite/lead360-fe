import { useState } from 'react';
import { CheckCircle2, XCircle, Clock, Send, X, Loader2, ArrowRight } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { crmApi } from '../api/crm.api';
import { useApproveRequest, useRejectRequest } from '../api/crm.queries';
import type { CrmApprovalSummaryDto, CrmApprovalChainDefinitionDto } from '../types/crm.types';
import { ApprovalEntityType } from '../types/crm.types';
import { useAuth } from '@/shared/hooks/useAuth';
import { toast } from 'sonner';

function ReviewModal({ mode, approvalId, onClose }: {
  mode: 'approve' | 'reject'; approvalId: string; onClose: () => void;
}) {
  const [comment, setComment] = useState('');
  const approve = useApproveRequest();
  const reject = useRejectRequest();
  const mutation = mode === 'approve' ? approve : reject;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-bg border border-border-subtle shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-text-primary">{mode === 'approve' ? 'Approve' : 'Reject'} Request</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-text-muted hover:bg-bg-elevated"><X className="w-4 h-4" /></button>
        </div>
        <div>
          <label className="text-xs text-text-muted font-semibold uppercase tracking-wide block mb-1.5">
            Comment {mode === 'reject' ? '(required)' : '(optional)'}
          </label>
          <textarea autoFocus value={comment} onChange={e => setComment(e.target.value)} rows={3}
            placeholder={mode === 'approve' ? 'Add a note…' : 'Reason for rejection…'}
            className="w-full px-3 py-2 rounded-xl text-sm border border-border-subtle bg-bg-input text-text-primary focus:outline-none focus:ring-1 focus:ring-brand resize-none" />
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-semibold text-text-secondary border border-border-subtle hover:bg-bg-elevated">Cancel</button>
          <button onClick={() => mutation.mutate({ id: approvalId, data: { comment: comment.trim() || undefined } }, { onSuccess: onClose })}
            disabled={mutation.isPending || (mode === 'reject' && !comment.trim())}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-50 ${mode === 'approve' ? 'bg-success hover:bg-success/80' : 'bg-danger hover:bg-danger/80'}`}>
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : mode === 'approve' ? <><CheckCircle2 className="w-4 h-4" /> Approve</> : <><XCircle className="w-4 h-4" /> Reject</>}
          </button>
        </div>
      </div>
    </div>
  );
}

interface Props { entityType: ApprovalEntityType; entityId: string; entityName: string }

export function ApprovalPanel({ entityType, entityId, entityName }: Props) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [reviewMode, setReviewMode] = useState<'approve' | 'reject' | null>(null);

  // Fetch chains matching this entity type
  const { data: chainsRaw } = useQuery({
    queryKey: ['crm', 'approval-chains'],
    queryFn: () => crmApi.getApprovalChains(),
  });
  const chains: CrmApprovalChainDefinitionDto[] = (chainsRaw as any) ?? [];
  const matchingChain = chains.find((c: any) => c.entityType === entityType);

  // Fetch current approval for this entity
  const { data: approvalRaw, isLoading } = useQuery({
    queryKey: ['crm', 'approval-for', entityType, entityId],
    queryFn: () => crmApi.getApprovalForEntity(entityType, entityId),
    enabled: !!entityId,
  });
  const approval: CrmApprovalSummaryDto | null = (approvalRaw as any) ?? null;

  // Submit approval via chain
  const submitChainMut = useMutation({
    mutationFn: (chainId: string) => crmApi.submitForChain({ entityType, entityId, entityName, chainDefinitionId: chainId }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['crm', 'approval-for', entityType, entityId] }); toast.success('Submitted for approval.'); },
    onError: (e: any) => toast.error(e?.message || 'Error'),
  });

  // Cancel request
  const cancelMut = useMutation({
    mutationFn: (id: string) => crmApi.cancelApproval(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['crm', 'approval-for', entityType, entityId] }); toast.success('Request cancelled.'); },
  });

  // Also invalidate on approve/reject completion
  const afterReview = () => {
    qc.invalidateQueries({ queryKey: ['crm', 'approval-for', entityType, entityId] });
    qc.invalidateQueries({ queryKey: ['crm', 'approvals'] });
  };

  if (isLoading) return null;

  // Find the chain definition for step names
  const chainDef = approval?.chainId ? chains.find((c: any) => c.id === approval.chainId) : null;
  const totalSteps = approval?.totalSteps ?? chainDef?.steps?.length ?? 1;
  const currentStep = approval?.currentStepOrder ?? 1;
  const isAssignedApprover = user?.id && approval?.assignedToUserId === user.id;

  return (
    <>
      {reviewMode && approval && (
        <ReviewModal mode={reviewMode} approvalId={approval.id}
          onClose={() => { setReviewMode(null); afterReview(); }} />
      )}

      <div className="rounded-2xl border border-border-subtle bg-bg-card p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-bold text-text-primary">Approval</p>
          {approval && (
            <div className="flex items-center gap-1.5">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold border ${
                approval.status === 1 ? 'text-warning border-warning/30 bg-warning/10' :
                approval.status === 2 ? 'text-success border-success/30 bg-success/10' :
                'text-danger border-danger/30 bg-danger/10'
              }`}>
                {approval.status === 1 && <><Clock className="w-3 h-3" /> Pending</>}
                {approval.status === 2 && <><CheckCircle2 className="w-3 h-3" /> Approved</>}
                {approval.status === 3 && <><XCircle className="w-3 h-3" /> Rejected</>}
              </span>
              {approval.status !== 1 && approval.decidedViaEmail && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium text-text-muted bg-bg-elevated border border-border-subtle">
                  via email
                </span>
              )}
            </div>
          )}
        </div>

        {/* Step progress indicator */}
        {approval && approval.status === 1 && chainDef && (
          <div className="flex items-center gap-1.5">
            {chainDef.steps.map((s: any, i: number) => (
              <div key={s.id} className="flex items-center gap-1.5">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                  s.stepOrder < currentStep ? 'bg-success-soft text-success' :
                  s.stepOrder === currentStep ? 'bg-brand-soft text-brand border border-border-glow' :
                  'bg-glass-2 text-text-muted'
                }`}>
                  {i + 1}. {s.stepName}
                </span>
                {i < chainDef.steps.length - 1 && <ArrowRight className="w-3 h-3 text-text-muted" />}
              </div>
            ))}
          </div>
        )}

        {/* No approval yet — show submit button */}
        {!approval && (
          <>
            {!matchingChain ? (
              <p className="text-xs text-text-muted">No approval chain defined for this entity type.</p>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-text-muted">Submit via <span className="text-text-secondary font-semibold">{matchingChain.name}</span></p>
                <button onClick={() => submitChainMut.mutate(matchingChain.id)} disabled={submitChainMut.isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-bg bg-brand hover:bg-brand-light disabled:opacity-50">
                  {submitChainMut.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Send className="w-3.5 h-3.5" /> Submit for Approval</>}
                </button>
              </div>
            )}
          </>
        )}

        {/* Pending approval */}
        {approval?.status === 1 && (
          <div className="space-y-2">
            <p className="text-xs text-text-muted">
              Step {currentStep} of {totalSteps} ·
              {approval.assignedToUserName ? (
                <> Assigned to <span className="text-text-secondary font-semibold">{approval.assignedToUserName}</span></>
              ) : (
                <> Awaiting review</>
              )}
            </p>
            <div className="flex gap-2">
              {isAssignedApprover && (
                <>
                  <button onClick={() => setReviewMode('approve')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-success hover:bg-success/80">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button onClick={() => setReviewMode('reject')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-danger hover:bg-danger/80">
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </button>
                </>
              )}
              {user?.id === approval.requestedByUserId && (
                <button onClick={() => cancelMut.mutate(approval.id)} disabled={cancelMut.isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-text-secondary border border-border-subtle hover:bg-bg-elevated disabled:opacity-50 ml-auto">
                  Cancel Request
                </button>
              )}
            </div>
          </div>
        )}

        {/* Approved or rejected */}
        {approval && (approval.status === 2 || approval.status === 3) && (
          <div className="space-y-2">
            {approval.comment && (
              <p className="text-xs text-text-secondary bg-bg-elevated rounded-xl px-3 py-2 italic">"{approval.comment}"</p>
            )}
            {approval.status === 2 && approval.currentStepOrder < totalSteps && (
              <p className="text-xs text-text-muted">Waiting for next step in chain...</p>
            )}
            {approval.status === 3 && (
              <button onClick={() => submitChainMut.mutate(matchingChain!.id)} disabled={submitChainMut.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-text-secondary border border-border-subtle hover:bg-bg-elevated disabled:opacity-50">
                <Send className="w-3.5 h-3.5" /> Resubmit
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
