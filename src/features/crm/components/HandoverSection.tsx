import { useState } from 'react';
import { Send, Loader2, CheckCircle2 } from 'lucide-react';
import { useDealHandover, useSubmitDealHandover } from '../api/crm.queries';
import { useTeamMembers } from '@/features/team/api/team.queries';
import type { UserDto } from '@/features/auth/types/auth.types';

export function HandoverSection({ dealId }: { dealId: string }) {
  const { data: handoverRaw, isLoading } = useDealHandover(dealId);
  const handover: any = (handoverRaw as any) ?? null;
  const submitMutation = useSubmitDealHandover();
  const { data: teamRaw } = useTeamMembers();
  const members: UserDto[] = (teamRaw as any) ?? [];

  const [expectations, setExpectations] = useState('');
  const [stakeholders, setStakeholders] = useState('');
  const [commitments, setCommitments] = useState('');
  const [redFlags, setRedFlags] = useState('');
  const [csUserId, setCsUserId] = useState('');

  const isSubmitted = handover?.status === 2;

  const handleSubmit = () => {
    submitMutation.mutate({
      dealId,
      data: {
        customerExpectations: expectations.trim() || undefined,
        stakeholderSummary: stakeholders.trim() || undefined,
        specialCommitments: commitments.trim() || undefined,
        redFlags: redFlags.trim() || undefined,
        handedOverToUserId: csUserId || undefined,
      },
    });
  };

  if (isLoading) return null;

  return (
    <div className="rounded-2xl border border-border-subtle bg-bg-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
          Handover to CS
        </span>
        {isSubmitted && <span className="flex items-center gap-1 text-xs text-success font-semibold"><CheckCircle2 className="w-3 h-3" /> Submitted</span>}
      </div>

      {isSubmitted ? (
        <div className="space-y-3 text-sm">
          {handover.customerExpectations && <div><p className="text-xs text-text-muted font-semibold mb-0.5">Customer Expectations</p><p className="text-text-secondary bg-bg-elevated rounded-xl p-3">{handover.customerExpectations}</p></div>}
          {handover.stakeholderSummary && <div><p className="text-xs text-text-muted font-semibold mb-0.5">Stakeholder Map</p><p className="text-text-secondary bg-bg-elevated rounded-xl p-3">{handover.stakeholderSummary}</p></div>}
          {handover.specialCommitments && <div><p className="text-xs text-text-muted font-semibold mb-0.5">Special Commitments</p><p className="text-text-secondary bg-bg-elevated rounded-xl p-3">{handover.specialCommitments}</p></div>}
          {handover.redFlags && <div><p className="text-xs text-text-muted font-semibold mb-0.5">Red Flags</p><p className="text-text-secondary bg-bg-elevated rounded-xl p-3">{handover.redFlags}</p></div>}
          {handover.handedOverToUserName && <p className="text-xs text-text-muted">Handed over to <span className="text-text-secondary font-semibold">{handover.handedOverToUserName}</span> on {new Date(handover.handedOverAt).toLocaleDateString()}</p>}
          {handover.previousOwnerUserName && <p className="text-xs text-text-muted">Previous owner: <span className="text-text-secondary">{handover.previousOwnerUserName}</span></p>}
        </div>
      ) : (
        <div className="space-y-3">
          <div><label className="text-xs text-text-muted block mb-1">What the customer expects</label><textarea value={expectations} onChange={e => setExpectations(e.target.value)} rows={3} placeholder="e.g. 7-day delivery + full installation..." className="w-full px-3 py-2 rounded-xl bg-bg-elevated border border-border-subtle text-sm resize-none" /></div>
          <div><label className="text-xs text-text-muted block mb-1">Stakeholder map + personalities</label><textarea value={stakeholders} onChange={e => setStakeholders(e.target.value)} rows={3} placeholder="e.g. Anita (champion, tech-focused)..." className="w-full px-3 py-2 rounded-xl bg-bg-elevated border border-border-subtle text-sm resize-none" /></div>
          <div><label className="text-xs text-text-muted block mb-1">Special commitments made</label><textarea value={commitments} onChange={e => setCommitments(e.target.value)} rows={2} placeholder="e.g. Free installation included..." className="w-full px-3 py-2 rounded-xl bg-bg-elevated border border-border-subtle text-sm resize-none" /></div>
          <div><label className="text-xs text-text-muted block mb-1">Red flags / sensitivities</label><textarea value={redFlags} onChange={e => setRedFlags(e.target.value)} rows={2} placeholder="e.g. Rajesh was not fully convinced..." className="w-full px-3 py-2 rounded-xl bg-bg-elevated border border-border-subtle text-sm resize-none" /></div>
          <div><label className="text-xs text-text-muted block mb-1">Assign to CS Rep</label>
            <select value={csUserId} onChange={e => setCsUserId(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-bg-elevated border border-border-subtle text-sm">
              <option value="">— Select CS rep —</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.fullName || m.email}</option>)}
            </select>
          </div>
          <button onClick={handleSubmit} disabled={submitMutation.isPending} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand text-bg text-sm font-bold hover:bg-brand-light disabled:opacity-50">
            {submitMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Submit Handover
          </button>
        </div>
      )}
    </div>
  );
}
