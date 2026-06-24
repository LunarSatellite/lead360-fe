import { useState } from 'react';
import { Check, X, Edit, ChevronDown, ChevronRight } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { StatusBadge } from '@/shared/components';
import { HttpMethodBadge } from '@/shared/components';
import { useApproveSuggestion, useRejectSuggestion } from '../api/intent-suggestion.queries';
import {
  SUGGESTION_STATUS_COLOR, SUGGESTION_STATUS_LABEL, OPERATION_TYPE_COLOR, SuggestionStatus,
  approveSchema, rejectSchema,
  type SuggestionDto, type SuggestionStatusValue, type ApproveFormData, type RejectFormData,
} from '../types/intent-suggestion.types';

// ═══ Batch Stats ═══

interface BatchStatsProps {
  total: number; pending: number; approved: number; rejected: number;
}

export function BatchStats({ total, pending, approved, rejected }: BatchStatsProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Pill label="Total" value={total} className="bg-glass-2 text-text-primary" />
      <Pill label="Pending" value={pending} className="bg-warning-soft text-warning" />
      <Pill label="Approved" value={approved} className="bg-success-soft text-success" />
      <Pill label="Rejected" value={rejected} className="bg-danger-soft text-danger" />
    </div>
  );
}

function Pill({ label, value, className }: { label: string; value: number; className: string }) {
  return <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${className}`}>{label}: {value}</span>;
}

// ═══ Confidence Bar ═══

export function ConfidenceBar({ score }: { score: number }) {
  const pct = Math.min(100, Math.max(0, score));
  const color = pct >= 80 ? '#10B981' : pct >= 50 ? '#F59E0B' : '#F43F5E';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-glass-2 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[11px] font-bold" style={{ color }}>{pct}%</span>
    </div>
  );
}

// ═══ SuggestionCard ═══

interface SuggestionCardProps {
  suggestion: SuggestionDto;
}

export function SuggestionCard({ suggestion: s }: SuggestionCardProps) {
  const [showReasoning, setShowReasoning] = useState(false);
  const [approveDialog, setApproveDialog] = useState(false);
  const [rejectDialog, setRejectDialog] = useState(false);

  const approve = useApproveSuggestion();
  const reject = useRejectSuggestion();

  const isPending = s.status === SuggestionStatus.Pending;
  const opColor = OPERATION_TYPE_COLOR[s.operationType] || 'muted';
  const keywords = s.keywords ? s.keywords.split(',').map(k => k.trim()).filter(Boolean) : [];

  return (
    <>
      <div className={`bg-white border rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all ${
        s.status === SuggestionStatus.Approved ? 'border-[rgba(16,185,129,0.2)]' :
        s.status === SuggestionStatus.Rejected ? 'border-[rgba(244,63,94,0.15)] opacity-60' : 'border-border-subtle'
      }`}>
        <div className="px-5 py-4 space-y-3">
          {/* Top row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-[14px] font-bold text-text-primary">{s.name}</h4>
                <StatusBadge variant={SUGGESTION_STATUS_COLOR[s.status as SuggestionStatusValue]}>
                  {SUGGESTION_STATUS_LABEL[s.status as SuggestionStatusValue]}
                </StatusBadge>
                <span className="px-2 py-0.5 rounded bg-glass-2 text-[11px] font-bold text-text-muted uppercase tracking-wide">{s.category}</span>
              </div>
              <p className="text-xs text-text-secondary mt-1 leading-relaxed">{s.description}</p>
            </div>
            <div className="w-24 flex-shrink-0"><ConfidenceBar score={s.confidenceScore} /></div>
          </div>

          {/* Meta */}
          <div className="flex items-center gap-3 flex-wrap">
            <StatusBadge variant={opColor}>{s.operationType}</StatusBadge>
            {s.apiMethod && s.apiEndpoint && (
              <div className="flex items-center gap-1.5">
                <HttpMethodBadge method={s.apiMethod as any} />
                <code className="text-[11px] font-mono text-text-muted">{s.apiEndpoint}</code>
              </div>
            )}
            {s.parentIntentName && <span className="text-[11px] text-text-muted">Parent: <strong className="text-text-secondary">{s.parentIntentName}</strong></span>}
          </div>

          {/* Keywords */}
          {keywords.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {keywords.map(k => <span key={k} className="px-2 py-0.5 rounded-md bg-glass-1 border border-border-subtle text-[11px] font-semibold text-text-secondary">{k}</span>)}
            </div>
          )}

          {/* Reasoning */}
          {s.reasoning && (
            <button onClick={() => setShowReasoning(!showReasoning)} className="flex items-center gap-1 text-[11px] font-semibold text-text-muted hover:text-text-secondary transition-all">
              {showReasoning ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              AI Reasoning
            </button>
          )}
          {showReasoning && <p className="text-xs text-text-muted bg-glass-1 rounded-lg p-3 leading-relaxed">{s.reasoning}</p>}

          {/* Actions */}
          {isPending && (
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => approve.mutate({ id: s.id })}
                disabled={approve.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-success text-xs font-bold text-white hover:brightness-110 transition-all disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" strokeWidth={2} /> Approve
              </button>
              <button
                onClick={() => setApproveDialog(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-info text-xs font-bold text-white hover:brightness-110 transition-all"
              >
                <Edit className="w-3.5 h-3.5" strokeWidth={1.8} /> Modify & Approve
              </button>
              <button
                onClick={() => setRejectDialog(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-glass-1 border border-border-subtle text-xs font-semibold text-danger hover:bg-danger-soft transition-all"
              >
                <X className="w-3.5 h-3.5" strokeWidth={2} /> Reject
              </button>
            </div>
          )}
        </div>
      </div>

      {approveDialog && <ApproveDialog suggestion={s} onClose={() => setApproveDialog(false)} />}
      {rejectDialog && <RejectDialog suggestionId={s.id} onClose={() => setRejectDialog(false)} />}
    </>
  );
}

// ═══ ApproveDialog ═══

function ApproveDialog({ suggestion, onClose }: { suggestion: SuggestionDto; onClose: () => void }) {
  const approve = useApproveSuggestion();
  const form = useForm<ApproveFormData>({
    resolver: zodResolver(approveSchema),
    defaultValues: {
      name: suggestion.name,
      description: suggestion.description,
      keywords: suggestion.keywords,
      operationType: suggestion.operationType,
    },
  });

  const onSubmit = (data: ApproveFormData) => {
    approve.mutate({ id: suggestion.id, body: data }, { onSuccess: onClose });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg mx-4 bg-white rounded-2xl border border-border-subtle shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-border-subtle">
          <h3 className="text-base font-bold text-text-primary">Modify & Approve</h3>
          <p className="text-xs text-text-muted mt-0.5">Edit the intent details before approving.</p>
        </div>
        <form onSubmit={form.handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">Name <span className="text-danger">*</span></label>
            <input {...form.register('name')} className="form-input" />
            {form.formState.errors.name && <p className="text-xs text-danger mt-1">{form.formState.errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">Description</label>
            <textarea {...form.register('description')} rows={3} className="form-input resize-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">Keywords</label>
            <input {...form.register('keywords')} className="form-input" placeholder="Comma-separated keywords" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">Operation Type</label>
            <select {...form.register('operationType')} className="form-input appearance-none cursor-pointer">
              {['ApiCall','ProductSearch','CategoryBrowse','StaticResponse','AgentHandoff','MenuNavigation','OutboundAction','DomainConversation'].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-semibold text-text-secondary hover:bg-glass-2 transition-all">Cancel</button>
            <button type="submit" disabled={approve.isPending} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-success text-sm font-bold text-white hover:brightness-110 transition-all disabled:opacity-50">
              <Check className="w-3.5 h-3.5" strokeWidth={2} /> Approve with Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ═══ RejectDialog ═══

function RejectDialog({ suggestionId, onClose }: { suggestionId: string; onClose: () => void }) {
  const reject = useRejectSuggestion();
  const form = useForm<RejectFormData>({ resolver: zodResolver(rejectSchema), defaultValues: { reason: '' } });

  const onSubmit = (data: RejectFormData) => {
    reject.mutate({ id: suggestionId, body: data.reason ? { reason: data.reason } : undefined }, { onSuccess: onClose });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-sm mx-4 bg-white rounded-2xl border border-border-subtle shadow-lg p-6">
        <h3 className="text-[14px] font-bold text-text-primary mb-3">Reject Suggestion</h3>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">Reason (optional)</label>
            <textarea {...form.register('reason')} rows={3} placeholder="Why are you rejecting this?" className="form-input resize-none" />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-semibold text-text-secondary hover:bg-glass-2 transition-all">Cancel</button>
            <button type="submit" disabled={reject.isPending} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-danger text-sm font-bold text-white hover:brightness-110 transition-all disabled:opacity-50">
              <X className="w-3.5 h-3.5" strokeWidth={2} /> Reject
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
