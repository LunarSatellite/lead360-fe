import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTeamMembers } from '@/features/team/api/team.queries';
import type { UserDto } from '@/features/auth/types/auth.types';
import {
  ArrowLeft, Phone, Mail, Hash, Clock, Loader2, Flame,
  MessageCircle, CalendarClock, Zap, X, Users, GitMerge, Building2, Layers,
  Globe, MapPin, Link,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { crmApi } from '../api/crm.api';
import { toast } from 'sonner';
import {
  useLeadById, useUpdateLeadStage, useAddNote, useConvertLead, useDealStages,
  useNurtureSequences, useEnrollLead, useLeadEnrollments,
} from '../api/crm.queries';
import type {
  LeadDetailDto, LeadActivityDto, LeadNurtureStatusDto,
  LeadStage as LeadStageType, ConvertLeadRequest,
  NurtureSequenceDto, NurtureEnrollmentDto,
} from '../types/crm.types';
import { LeadStage, LEAD_STAGE_LABELS, LEAD_STAGE_COLORS, CHANNEL_LABELS, CrmEntityType } from '../types/crm.types';
import { CustomFieldsPanel } from '../components/CustomFieldsPanel';

// ─── Activity type color helper ───────────────────────────────────────────────

function activityDotColor(activityType: number): string {
  switch (activityType) {
    case 1:  return 'bg-brand';                  // ConversationStarted
    case 2:  return 'bg-[#A78BFA]';              // IntentDetected (purple)
    case 3:  return 'bg-[#F59E0B]';              // StageChanged (amber)
    case 4:  return 'bg-text-secondary';         // ScoreUpdated
    case 7:  return 'bg-brand';                  // NurtureMessageSent
    case 11: return 'bg-success';                // Converted
    default: return 'bg-text-muted';
  }
}

// ─── Score bar color helper ───────────────────────────────────────────────────

function scoreBadge(score: number): string {
  if (score < 25) return 'bg-glass-2 text-text-muted border-border-medium';
  if (score < 50) return 'bg-warning-soft text-warning border-warning/30';
  return 'bg-success-soft text-success border-success/30';
}

// ─── Main component ───────────────────────────────────────────────────────────

export function Component() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: rawLead, isLoading } = useLeadById(id);
  const lead = rawLead as unknown as LeadDetailDto | undefined;

  const qc = useQueryClient();
  const updateStage = useUpdateLeadStage();
  const addNote = useAddNote();
  const convertLead = useConvertLead();
  const { data: stagesRaw } = useDealStages();
  const dealStages = (stagesRaw as any) ?? [];
  const { data: teamRaw } = useTeamMembers();
  const teamMembers = (teamRaw as unknown as UserDto[] | undefined) ?? [];
  const { data: enrollmentsRaw } = useLeadEnrollments(id ?? '');
  const enrollments = (enrollmentsRaw as unknown as NurtureEnrollmentDto[]) ?? [];

  const [noteText, setNoteText] = useState('');
  const [showNoteBox, setShowNoteBox] = useState(false);
  const [stageEdit, setStageEdit] = useState(false);
  const [showConvertForm, setShowConvertForm] = useState(false);
  const [convertForm, setConvertForm] = useState<ConvertLeadRequest>({});
  const [showEnrollModal, setShowEnrollModal] = useState(false);

  const handleStageChange = (newStage: LeadStageType) => {
    if (!lead) return;
    updateStage.mutate({ id: lead.id, stage: newStage, reason: '' });
    setStageEdit(false);
  };

  const handleAddNote = () => {
    if (!lead || !noteText.trim()) return;
    addNote.mutate({ id: lead.id, note: noteText.trim() }, {
      onSuccess: () => {
        setNoteText('');
        setShowNoteBox(false);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-brand animate-spin" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-text-secondary font-semibold">Lead not found</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 text-sm text-brand hover:underline"
        >
          Go back
        </button>
      </div>
    );
  }

  const displayName = lead.customerName || lead.channelHandle;
  const stageLabel = LEAD_STAGE_LABELS[lead.stage];
  const stageColor = LEAD_STAGE_COLORS[lead.stage];
  const channelLabel = CHANNEL_LABELS[lead.channel] ?? 'Unknown';
  const isConverted = lead.stage === LeadStage.Converted;
  const isHot = lead.stage === LeadStage.Hot;

  const sortedActivities = [...(lead.activities ?? [])]
    .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
    .slice(0, 20);

  return (
    <>
    <div className="space-y-4">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Leads
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left column ──────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Lead header card */}
          <div className="bg-bg-card border border-border-subtle rounded-2xl p-6 space-y-3">
            {/* Top row: badges + score */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${stageColor}`}>
                {stageLabel}
              </span>
              <span className="bg-bg-elevated border border-border-subtle rounded-lg px-2 py-0.5 text-xs text-text-secondary">
                {channelLabel}
              </span>

              {/* Score badge */}
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold border ${scoreBadge(lead.score)}`}>
                {lead.score >= 50 && <Flame className="w-3 h-3" />}
                Score: {lead.score}
                {lead.score >= 50 && <span className="text-[9px] font-semibold uppercase tracking-wider ml-0.5">MQL</span>}
              </span>

              {/* Hot pulsing dot */}
              {isHot && (
                <span className="flex items-center gap-1.5">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger opacity-60" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-danger" />
                  </span>
                  <Flame className="w-3.5 h-3.5 text-danger" />
                </span>
              )}
            </div>

            {/* Name */}
            <div>
              <h2 className="text-xl font-extrabold text-text-primary">{displayName}</h2>
              {lead.customerName && (
                <p className="text-sm text-text-muted font-mono mt-0.5">{lead.channelHandle}</p>
              )}
              {lead.intentSummary && (
                <p className="text-sm text-text-muted italic mt-1">{lead.intentSummary}</p>
              )}
            </div>
          </div>

          {/* Contact Info + Organization Info — side by side in one card */}
          <div className="bg-bg-card border border-border-subtle rounded-2xl p-5">
            <div className="grid grid-cols-2 gap-6">
              {/* Left: Contact Info */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">Contact Info</h3>
                <InfoRow icon={<Phone className="w-4 h-4" />} label="Phone" value={lead.customerPhone} />
                <InfoRow icon={<Mail className="w-4 h-4" />} label="Email" value={lead.customerEmail} />
                <InfoRow icon={<Hash className="w-4 h-4" />} label="Handle" value={lead.channelHandle} />
                <InfoRow icon={<Users className="w-4 h-4" />} label="Assigned" value={lead.assignedToUserName || 'Unassigned'} />
                <AssignFromPoolButton leadId={lead.id} />
              </div>
              {/* Right: Organization Info */}
              <div className="space-y-3 border-l border-border-subtle pl-6">
                <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">Organization Info</h3>
                <InfoRow icon={<Building2 className="w-4 h-4" />} label="Name"     value={lead.companyName} />
                <InfoRow icon={<Globe   className="w-4 h-4" />} label="Domain"   value={lead.companyDomain} />
                <InfoRow icon={<Layers  className="w-4 h-4" />} label="Industry" value={lead.companyIndustry} />
                <InfoRow icon={<Users   className="w-4 h-4" />} label="Employees" value={lead.companyEmployeeCount?.toLocaleString()} />
                <InfoRow icon={<MapPin  className="w-4 h-4" />} label="Country"  value={lead.companyCountry} />
                <InfoRow icon={<MapPin  className="w-4 h-4" />} label="City"     value={lead.companyCity} />
                <InfoRow icon={<Link    className="w-4 h-4" />} label="Website"  value={lead.companyWebsite} />
              </div>
            </div>
          </div>

          {/* Nurture status card */}
          {lead.nurtureStatus && (
            <NurtureStatusCard nurture={lead.nurtureStatus} />
          )}

          {/* Enrollment history */}
          {enrollments.length > 0 && (
            <EnrollmentHistoryCard enrollments={enrollments} />
          )}

          {/* Actions row */}
          <div className="bg-bg-card border border-border-subtle rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
              Actions
            </h3>

            <div className="flex gap-3 flex-wrap">
              {/* Change Stage */}
              {!isConverted && (
                <div className="flex items-center gap-2">
                  {stageEdit ? (
                    <select
                      defaultValue={lead.stage}
                      onChange={(e) => handleStageChange(Number(e.target.value) as LeadStageType)}
                      disabled={updateStage.isPending}
                      autoFocus
                      onBlur={() => setStageEdit(false)}
                      className="text-sm bg-bg-elevated border border-border-glow rounded-xl px-3 py-2 text-text-primary focus:outline-none transition-colors"
                    >
                      {(Object.entries(LEAD_STAGE_LABELS) as [string, string][]).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>
                  ) : (
                    <button
                      onClick={() => setStageEdit(true)}
                      className="px-4 py-2 text-sm font-semibold rounded-xl border border-border-subtle bg-bg-elevated text-text-secondary hover:border-border-medium transition-all"
                    >
                      Change Stage
                    </button>
                  )}
                </div>
              )}

              {/* Add Note */}
              <button
                onClick={() => setShowNoteBox((v) => !v)}
                className="px-4 py-2 text-sm font-semibold rounded-xl border border-border-subtle bg-bg-elevated text-text-secondary hover:border-border-medium transition-all"
              >
                {showNoteBox ? 'Cancel Note' : 'Add Note'}
              </button>

              {/* Enroll in Sequence */}
              {!isConverted && (
                <button
                  onClick={() => setShowEnrollModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl border border-border-subtle bg-bg-elevated text-text-secondary hover:border-border-medium transition-all"
                >
                  <GitMerge className="w-3.5 h-3.5" />
                  Enroll in Sequence
                </button>
              )}

              {/* Convert to Deal — shown for Hot/Warm/New leads not yet converted */}
              {!isConverted && (
                <button
                  onClick={() => {
                    setConvertForm({ dealName: lead.intentSummary ? `Deal — ${lead.intentSummary}` : `Deal — ${displayName}` });
                    setShowConvertForm((v) => !v);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl border border-border-glow bg-brand-soft text-brand hover:bg-brand hover:text-bg transition-all"
                >
                  <Zap className="w-3.5 h-3.5" /> Convert to Deal
                </button>
              )}
            </div>

            {/* Note textarea */}
            {showNoteBox && (
              <div className="space-y-2">
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Write a note..."
                  rows={3}
                  className="w-full text-sm bg-bg-elevated border border-border-subtle rounded-xl px-3 py-2 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-glow resize-none transition-colors"
                />
                <button
                  onClick={handleAddNote}
                  disabled={!noteText.trim() || addNote.isPending}
                  className="px-4 py-2 text-sm font-semibold rounded-xl bg-brand text-bg disabled:opacity-50 hover:opacity-90 transition-opacity"
                >
                  {addNote.isPending ? 'Saving…' : 'Save Note'}
                </button>
              </div>
            )}

            {/* Convert to Deal form */}
            {showConvertForm && !isConverted && (
              <div className="border border-border-glow bg-bg-elevated rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-brand uppercase tracking-wider">Convert to Contact + Account + Deal</span>
                  <button onClick={() => setShowConvertForm(false)} className="text-text-muted hover:text-text-primary"><X className="w-4 h-4" /></button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-xs text-text-muted mb-1 block">Deal Name</label>
                    <input value={convertForm.dealName ?? `Deal — ${displayName}`} onChange={(e) => setConvertForm((f) => ({ ...f, dealName: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-bg border border-border-subtle text-sm text-text-primary focus:outline-none focus:border-border-glow" />
                  </div>
                  <div>
                    <label className="text-xs text-text-muted mb-1 block">Amount</label>
                    <input type="number" min={0} value={convertForm.dealAmount ?? ''}
                      onChange={(e) => setConvertForm((f) => ({ ...f, dealAmount: e.target.value ? Number(e.target.value) : undefined }))}
                      className="w-full px-3 py-2 rounded-xl bg-bg border border-border-subtle text-sm text-text-primary focus:outline-none focus:border-border-glow" placeholder="0" />
                  </div>
                  <div>
                    <label className="text-xs text-text-muted mb-1 block">Close Date</label>
                    <input type="date" value={convertForm.closeDate ?? ''}
                      onChange={(e) => setConvertForm((f) => ({ ...f, closeDate: e.target.value || undefined }))}
                      className="w-full px-3 py-2 rounded-xl bg-bg border border-border-subtle text-sm text-text-primary focus:outline-none focus:border-border-glow" />
                  </div>
                  <div>
                    <label className="text-xs text-text-muted mb-1 block">Stage</label>
                    <select value={convertForm.stageId ?? ''} onChange={(e) => setConvertForm((f) => ({ ...f, stageId: e.target.value || undefined }))}
                      className="w-full px-3 py-2 rounded-xl bg-bg border border-border-subtle text-sm text-text-primary focus:outline-none focus:border-border-glow">
                      <option value="">First open stage</option>
                      {(dealStages as any[]).filter((s: any) => !s.isClosed).map((s: any) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-text-muted mb-1 block">Assign Owner</label>
                    <select value={convertForm.ownedByUserId ?? ''} onChange={(e) => setConvertForm((f) => ({ ...f, ownedByUserId: e.target.value || undefined }))}
                      className="w-full px-3 py-2 rounded-xl bg-bg border border-border-subtle text-sm text-text-primary focus:outline-none focus:border-border-glow">
                      <option value="">Assign to me (default)</option>
                      {teamMembers.map((u) => (<option key={u.id} value={u.id}>{u.fullName ?? `${u.firstName} ${u.lastName}`}</option>))}
                    </select>
                  </div>
                </div>
                <button disabled={convertLead.isPending}
                  onClick={() => convertLead.mutate({ id: lead.id, data: convertForm }, {
                    onSuccess: () => { setShowConvertForm(false); qc.invalidateQueries({ queryKey: ['lead', lead.id] }); toast.success('Lead converted!'); },
                  })}
                  className="w-full py-2 rounded-xl bg-brand text-bg text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                  {convertLead.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Zap className="w-4 h-4" /> Confirm Convert</>}
                </button>
              </div>
            )}

            {/* Score reason */}
            {isConverted && (lead.convertedContactId || lead.convertedDealId) && (
              <div className="bg-bg-elevated border border-border-glow rounded-xl p-3 space-y-1.5">
                <span className="text-xs font-bold text-brand uppercase tracking-wider">Converted Records</span>
                <div className="flex flex-col gap-1 text-xs">
                  {lead.convertedContactId && <a href={`/dashboard/crm/contacts/${lead.convertedContactId}`} className="text-brand hover:underline">→ View Contact</a>}
                  {lead.convertedAccountId && <a href={`/dashboard/crm/accounts/${lead.convertedAccountId}`} className="text-brand hover:underline">→ View Account</a>}
                  {lead.convertedDealId && <a href={`/dashboard/crm/deals/${lead.convertedDealId}`} className="text-brand hover:underline">→ View Deal</a>}
                </div>
              </div>
            )}
            {lead.scoreReason && (
              <div className="bg-bg-elevated border border-border-subtle rounded-xl p-3 text-xs text-text-secondary">
                <span className="font-semibold text-text-muted uppercase tracking-wide mr-2">
                  Score reason:
                </span>
                {lead.scoreReason}
              </div>
            )}
            <ScoreHistory leadId={lead.id} />
            <TriggerScoreEvent leadId={lead.id} />
          </div>
        </div>

        {/* ── Right column: Activity timeline ──────────────────────────────── */}
        <div className="lg:col-span-1">
          <div className="bg-bg-card border border-border-subtle rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-text-muted" />
              <h3 className="text-sm font-semibold text-text-primary">Activity Timeline</h3>
            </div>

            {sortedActivities.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-8">No activity yet</p>
            ) : (
              <div className="overflow-y-auto max-h-[520px] space-y-0">
                {sortedActivities.map((activity, idx) => (
                  <ActivityItem
                    key={activity.id}
                    activity={activity}
                    isLast={idx === sortedActivities.length - 1}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    {lead && <CustomFieldsPanel recordId={lead.id} entityType={CrmEntityType.Lead} />}
    {showEnrollModal && lead && (
      <EnrollModal leadId={lead.id} onClose={() => setShowEnrollModal(false)} />
    )}
    </>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: string | null | undefined;
}

function InfoRow({ icon, label, value }: InfoRowProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-text-muted">{icon}</span>
      <span className="text-xs text-text-muted w-14 flex-shrink-0">{label}</span>
      <span className="text-sm text-text-primary">{value || '—'}</span>
    </div>
  );
}

interface ActivityItemProps {
  activity: LeadActivityDto;
  isLast: boolean;
}

function ActivityItem({ activity, isLast }: ActivityItemProps) {
  const dotColor = activityDotColor(activity.activityType);

  const relativeTime = (() => {
    try {
      return formatDistanceToNow(new Date(activity.occurredAt), { addSuffix: true });
    } catch {
      return '—';
    }
  })();

  return (
    <div className="flex gap-3">
      {/* Timeline line + dot */}
      <div className="flex flex-col items-center">
        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1 ${dotColor}`} />
        {!isLast && <div className="w-0.5 flex-1 bg-border-subtle min-h-[24px] mt-1" />}
      </div>

      {/* Content */}
      <div className="pb-4 flex-1 min-w-0">
        <p className="text-xs text-text-secondary leading-snug">{activity.summary || '—'}</p>
        <p className="text-2xs text-text-muted mt-0.5">{relativeTime}</p>
      </div>
    </div>
  );
}

// ─── Enroll Modal ─────────────────────────────────────────────────────────────

function EnrollModal({ leadId, onClose }: { leadId: string; onClose: () => void }) {
  const { data: seqRaw, isLoading } = useNurtureSequences();
  const sequences = ((seqRaw as unknown as NurtureSequenceDto[]) ?? []).filter((s) => s.isActive);
  const enrollMutation = useEnrollLead();
  const [selected, setSelected] = useState<string>('');

  const handleEnroll = () => {
    if (!selected) return;
    enrollMutation.mutate({ sequenceId: selected, leadId }, { onSuccess: onClose });
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-bg-elevated border border-border-subtle rounded-card shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-text-primary">Enroll in Sequence</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {isLoading && (
          <div className="flex justify-center py-6">
            <Loader2 className="w-5 h-5 text-brand animate-spin" />
          </div>
        )}

        {!isLoading && sequences.length === 0 && (
          <p className="text-sm text-text-muted text-center py-4">
            No active sequences. Create one in{' '}
            <a href="/dashboard/crm/nurture" className="text-brand underline">Nurture Sequences</a>.
          </p>
        )}

        {!isLoading && sequences.length > 0 && (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {sequences.map((seq) => (
              <label
                key={seq.id}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  selected === seq.id
                    ? 'border-brand bg-brand/5'
                    : 'border-border-subtle hover:border-border-medium bg-bg'
                }`}
              >
                <input
                  type="radio"
                  name="sequence"
                  value={seq.id}
                  checked={selected === seq.id}
                  onChange={() => setSelected(seq.id)}
                  className="mt-0.5 accent-brand shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text-primary truncate">{seq.name}</p>
                  <p className="text-xs text-text-muted mt-0.5">
                    {seq.steps.length} steps · triggers on {LEAD_STAGE_LABELS[seq.triggerStage]}
                  </p>
                </div>
              </label>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-1">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-text-secondary bg-bg-elevated border border-border-subtle rounded-xl hover:border-border-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleEnroll}
            disabled={!selected || enrollMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand hover:bg-brand/90 rounded-xl disabled:opacity-50 transition-colors"
          >
            {enrollMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Enroll
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Enrollment History Card ───────────────────────────────────────────────────

function EnrollmentHistoryCard({ enrollments }: { enrollments: NurtureEnrollmentDto[] }) {
  const STATUS_COLORS: Record<number, string> = {
    1: 'text-brand bg-brand/10 border-brand/20',
    2: 'text-warning bg-warning/10 border-warning/20',
    3: 'text-success bg-success/10 border-success/20',
    4: 'text-text-muted bg-bg-elevated border-border-subtle',
  };
  const STATUS_LABELS: Record<number, string> = {
    1: 'Active', 2: 'Paused', 3: 'Completed', 4: 'Cancelled',
  };

  return (
    <div className="bg-bg-card border border-border-subtle rounded-2xl p-5 space-y-3">
      <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
        Enrollment History
      </h3>
      <div className="space-y-2">
        {enrollments.map((e) => (
          <div key={e.id} className="flex items-start justify-between gap-2 text-sm">
            <div className="min-w-0">
              <p className="text-text-primary font-medium truncate">{e.sequenceName ?? 'Unknown sequence'}</p>
              <p className="text-xs text-text-muted mt-0.5">
                Step {e.currentStep}
                {e.nextStepAt && ` · next ${formatDistanceToNow(new Date(e.nextStepAt), { addSuffix: true })}`}
                {e.completedAt && ` · completed ${formatDistanceToNow(new Date(e.completedAt), { addSuffix: true })}`}
              </p>
            </div>
            <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold border ${STATUS_COLORS[e.status] ?? STATUS_COLORS[4]}`}>
              {STATUS_LABELS[e.status] ?? 'Unknown'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Nurture status card ──────────────────────────────────────────────────────

const ENROLLMENT_STATUS_LABELS: Record<number, string> = {
  1: 'Active', 2: 'Paused', 3: 'Completed', 4: 'Cancelled',
};

const ENROLLMENT_STATUS_COLORS: Record<number, string> = {
  1: 'text-brand bg-brand-soft border-border-glow',
  2: 'text-[#F59E0B] bg-[rgba(245,158,11,0.1)] border-[rgba(245,158,11,0.2)]',
  3: 'text-success bg-success-soft border-[rgba(34,197,94,0.2)]',
  4: 'text-text-muted bg-bg-elevated border-border-subtle',
};

function NurtureStatusCard({ nurture }: { nurture: LeadNurtureStatusDto }) {
  const statusLabel = ENROLLMENT_STATUS_LABELS[nurture.status] ?? 'Unknown';
  const statusColor = ENROLLMENT_STATUS_COLORS[nurture.status] ?? ENROLLMENT_STATUS_COLORS[4];

  const nextAt = (() => {
    if (!nurture.nextMessageAt) return null;
    try { return formatDistanceToNow(new Date(nurture.nextMessageAt), { addSuffix: true }); }
    catch { return null; }
  })();

  const lastAt = (() => {
    if (!nurture.lastMessageSentAt) return null;
    try { return formatDistanceToNow(new Date(nurture.lastMessageSentAt), { addSuffix: true }); }
    catch { return null; }
  })();

  return (
    <div className="bg-bg-card border border-border-subtle rounded-2xl p-5 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-brand" />
          <h3 className="text-sm font-semibold text-text-primary">Nurture Sequence</h3>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${statusColor}`}>
          {statusLabel}
        </span>
      </div>

      {/* Sequence name + progress */}
      <div className="space-y-1.5">
        <p className="text-sm font-medium text-text-primary">{nurture.sequenceName}</p>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-bg-elevated overflow-hidden">
            <div
              className="h-full rounded-full bg-brand"
              style={{ width: `${(nurture.currentStep / nurture.totalSteps) * 100}%` }}
            />
          </div>
          <span className="text-xs text-text-muted whitespace-nowrap">
            Step {nurture.currentStep} of {nurture.totalSteps}
          </span>
        </div>
      </div>

      {/* Next message */}
      {nurture.status === 1 && nextAt && (
        <div className="flex items-start gap-2 bg-bg-elevated border border-border-subtle rounded-xl p-3">
          <CalendarClock className="w-4 h-4 text-brand flex-shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-text-secondary">Next message {nextAt}</p>
            {nurture.nextMessagePreview && (
              <p className="text-xs text-text-muted mt-1 leading-relaxed line-clamp-3 italic">
                "{nurture.nextMessagePreview}"
              </p>
            )}
          </div>
        </div>
      )}

      {/* Last message sent */}
      {lastAt && nurture.lastMessageSent && (
        <p className="text-xs text-text-muted">
          Last sent {lastAt}
        </p>
      )}

      {/* Completed/Cancelled state */}
      {(nurture.status === 3 || nurture.status === 4) && (
        <p className="text-xs text-text-muted italic">
          {nurture.status === 3 ? 'Sequence completed.' : 'Sequence cancelled.'}
        </p>
      )}
    </div>
  );
}

function AssignFromPoolButton({ leadId }: { leadId: string }) {
  const qc = useQueryClient();
  const assignMut = useMutation({
    mutationFn: () => crmApi.getRotationMembers('Lead').then(members => {
      const list: string[] = (members as any) ?? [];
      if (list.length === 0) throw new Error('Sales Lead Pool is empty. Add members in Assignment Rotation.');
      return crmApi.assignLead(leadId, list[0]);
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['lead', leadId] }); toast.success('Lead assigned from pool.'); },
    onError: (e: any) => toast.error(e?.message || 'Error'),
  });
  return (
    <button onClick={() => assignMut.mutate()} disabled={assignMut.isPending}
      className="text-xs font-semibold text-brand hover:underline disabled:opacity-50">
      {assignMut.isPending ? 'Assigning...' : 'Assign from pool'}
    </button>
  );
}

function TriggerScoreEvent({ leadId }: { leadId: string }) {
  const [eventType, setEventType] = useState('');
  const qc = useQueryClient();
  const { data: rulesData } = useQuery({ queryKey: ['crm', 'scoring-rules'], queryFn: () => crmApi.getScoringRules() });
  const rules: any[] = (rulesData as any) ?? [];
  const triggerMut = useMutation({
    mutationFn: (d: { eventType: string }) => crmApi.triggerScoreEvent(leadId, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['lead', leadId] }); qc.invalidateQueries({ queryKey: ['crm', 'score-events', leadId] }); setEventType(''); toast.success(`Event "${eventType}" triggered.`); },
    onError: (e: any) => toast.error(e?.message || 'Error'),
  });
  if (rules.length === 0) return null;
  return (
    <div className="flex gap-2 items-center">
      <select value={eventType} onChange={e => setEventType(e.target.value)} className="flex-1 px-2 py-1.5 rounded-lg bg-bg-input border border-border-subtle text-xs text-text-primary">
        <option value="">— Trigger scoring event —</option>
        {rules.map((r: any) => <option key={r.id} value={r.eventType}>{r.label || r.eventType} (+{r.points})</option>)}
      </select>
      <button onClick={() => eventType && triggerMut.mutate({ eventType })}
        disabled={!eventType || triggerMut.isPending}
        className="px-3 py-1.5 rounded-lg bg-brand text-white text-xs font-bold disabled:opacity-50">
        {triggerMut.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Fire'}
      </button>
    </div>
  );
}

function ScoreHistory({ leadId }: { leadId: string }) {
  const { data } = useQuery({
    queryKey: ['crm', 'score-events', leadId],
    queryFn: () => crmApi.getScoreEventHistory(leadId),
  });
  const events: any[] = (data as any) ?? [];
  const [open, setOpen] = useState(false);
  if (events.length === 0) return null;
  return (
    <div className="border border-border-subtle rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 py-2.5 bg-glass-2 text-xs font-semibold text-text-muted hover:text-text-primary transition-all">
        <span>Score History ({events.length} events)</span>
        <span className={`transition-transform ${open ? 'rotate-180' : ''}`}>▼</span>
      </button>
      {open && (
        <div className="divide-y divide-border-subtle max-h-48 overflow-y-auto">
          {events.map((e: any) => (
            <div key={e.id} className="px-4 py-2 text-xs space-y-0.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-brand font-semibold">{e.eventType}</span>
                <span className={`font-bold ${e.points > 0 ? 'text-success' : 'text-danger'}`}>{e.points > 0 ? '+' : ''}{e.points}</span>
              </div>
              <div className="text-text-muted">{e.reason || ''}</div>
              <div className="text-text-muted text-[10px]">{e.scoreBefore} → {e.scoreAfter} · {e.eventAt ? new Date(e.eventAt).toLocaleString() : ''}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
