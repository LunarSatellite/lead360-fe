import { useState } from 'react';
import { toast } from 'sonner';
import { Plus, X, Loader2, CalendarCheck, PhoneCall, Play, Copy, Sparkles } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import {
  useMeetings, useMeetingById, useInitiateMeeting, useBookMeeting, useCancelMeeting,
  useUpdateMeeting, useCreateTaskFromMeeting,
  useCallSummaries, useRequestCallSummary, useGenerateCallSummary,
  useContacts, useDeals, useLogActivity,
} from '../api/crm.queries';
import type {
  CrmMeetingSummaryDto, CrmMeetingInitiateRequest, CrmMeetingAttendeeDto, CrmMeetingFilter,
  CrmCallSummarySummaryDto, CrmCallSummaryRequestDto, CrmCallSummaryFilter,
} from '../types/crm.types';
import { useTeamMembers } from '@/features/team/api/team.queries';
import {
  CrmMeetingStatus,
  CRM_MEETING_STATUS_LABELS, CRM_MEETING_STATUS_COLORS,
  CRM_CALL_SUMMARY_STATUS_LABELS, CrmCallSummaryStatus,
} from '../types/crm.types';

const inputCls = 'w-full px-3 py-2 rounded-xl bg-bg-elevated border border-border-subtle text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-glow';
const selectCls = 'w-full px-3 py-2 rounded-xl bg-bg-elevated border border-border-subtle text-sm text-text-primary focus:outline-none focus:border-border-glow';

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
      <div className="drawer-slide-in relative w-[520px] h-full flex flex-col bg-bg-shell border-l border-thin border-border-subtle" style={{ boxShadow: '-8px 0 40px rgba(0,0,0,0.5)' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle shrink-0">
          <h3 className="text-base font-bold text-text-primary">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-bg-card text-text-muted hover:text-text-primary transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}

const CALL_STATUS_COLORS: Record<number, string> = {
  1: 'text-[#F59E0B] bg-[rgba(245,158,11,0.1)] border-[rgba(245,158,11,0.2)]',
  2: 'text-brand bg-brand-soft border-border-glow',
  3: 'text-success bg-success-soft border-[rgba(34,197,94,0.2)]',
  4: 'text-danger bg-danger-soft border-[rgba(244,63,94,0.2)]',
};

// ─── Meetings Tab ─────────────────────────────────────────────────────────────

function MeetingsTab() {
  const [filter, setFilter] = useState<CrmMeetingFilter>({ page: 1, pageSize: 20 });
  const [statusF, setStatusF] = useState('');
  const [search, setSearch] = useState('');

  const [showInitiate, setShowInitiate] = useState(false);
  const [initForm, setInitForm] = useState<{ contactId: string; dealId: string; title: string; agendaText: string; joinUrl: string; durationMinutes: string; generateSlots: boolean; scheduledAt: string }>({ contactId: '', dealId: '', title: '', agendaText: '', joinUrl: '', durationMinutes: '30', generateSlots: false, scheduledAt: '' });
  const [selectedAttendees, setSelectedAttendees] = useState<Set<string>>(new Set());

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [bookDate, setBookDate] = useState('');
  const [bookTime, setBookTime] = useState('');
  const [bookDuration, setBookDuration] = useState('30');

  const { data: raw, isLoading } = useMeetings(filter);
  const items: CrmMeetingSummaryDto[] = (raw as any)?.items ?? [];

  const { data: meetingDetail, isLoading: detailLoading } = useMeetingById(selectedId ?? undefined);

  const { data: contactsRaw } = useContacts({ pageSize: 200 });
  const contactsList: { id: string; fullName: string; email: string | null }[] = (contactsRaw as any)?.items ?? [];

  const { data: dealsRaw } = useDeals({ pageSize: 200 });
  const dealsList: { id: string; name: string }[] = (dealsRaw as any)?.items ?? [];
  const { data: teamRaw } = useTeamMembers();
  const teamMembers: UserDto[] = (teamRaw as any) ?? [];

  const [notes, setNotes] = useState('');
  const [showCompleteSummary, setShowCompleteSummary] = useState(false);
  const [completeSummaryText, setCompleteSummaryText] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskAssigneeId, setTaskAssigneeId] = useState('');
  const [showRequestSummary, setShowRequestSummary] = useState(false);
  const [reqSummaryText, setReqSummaryText] = useState('');

  const initiateMeeting = useInitiateMeeting();
  const bookMeeting = useBookMeeting();
  const cancelMeeting = useCancelMeeting();
  const updateMeeting = useUpdateMeeting();
  const createTask = useCreateTaskFromMeeting();
  const requestSummary = useRequestCallSummary();
  const logActivity = useLogActivity();

  const applyFilter = () => setFilter({ page: 1, pageSize: 20, search: search || undefined, status: statusF ? Number(statusF) as CrmMeetingStatus : undefined });

  const handleInitiate = (e: React.FormEvent) => {
    e.preventDefault();

    if (!initForm.contactId.trim()) {
      toast.error('Please select a primary contact.');
      return;
    }

    const dealIdRaw = initForm.dealId.trim();

    const attendees: CrmMeetingAttendeeDto[] = [];
    selectedAttendees.forEach(cId => {
      const c = contactsList.find(c => c.id === cId);
      if (c) attendees.push({ name: c.fullName, email: c.email ?? '', role: 'Attendee' });
    });
    const req: CrmMeetingInitiateRequest = {
      contactId: initForm.contactId.trim(),
      title: initForm.title.trim(),
      dealId: dealIdRaw || undefined,
      agendaText: initForm.agendaText.trim() || undefined,
      joinUrl: initForm.joinUrl.trim() || undefined,
      attendees: attendees.length > 0 ? attendees : undefined,
      generateSlots: initForm.generateSlots,
      durationMinutes: Number(initForm.durationMinutes) || 30,
      scheduledAt: initForm.scheduledAt ? initForm.scheduledAt + 'T00:00:00Z' : undefined,
    };
    initiateMeeting.mutate(req, { onSuccess: () => { setShowInitiate(false); setInitForm({ contactId: '', dealId: '', title: '', agendaText: '', joinUrl: '', durationMinutes: '30', generateSlots: false, scheduledAt: '' }); setSelectedAttendees(new Set()); } });
  };

  const toggleAttendee = (id: string) => {
    setSelectedAttendees(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const setI = (k: keyof typeof initForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setInitForm(f => ({ ...f, [k]: e.target.value }));

  const detail = meetingDetail as unknown as import('../types/crm.types').CrmMeetingDetailDto | undefined;
  const selectedSummary = items.find(m => m.id === selectedId);

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4 shrink-0">
          <div className="flex gap-2 flex-1">
            <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && applyFilter()} placeholder="Search meetings..." className={inputCls + ' flex-1'} />
            <select value={statusF} onChange={e => setStatusF(e.target.value)} className={selectCls + ' w-44'}>
              <option value="">All Statuses</option>
              {Object.entries(CRM_MEETING_STATUS_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </div>
          <button onClick={() => setShowInitiate(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-bg bg-brand hover:bg-brand-light transition-all shrink-0">
            <Plus className="w-3.5 h-3.5" strokeWidth={2.5} /> Initiate Meeting
          </button>
        </div>

        <div className="rounded-2xl border border-border-subtle bg-bg-card overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-40 text-text-muted"><Loader2 className="w-5 h-5 animate-spin" /></div>
          ) : !items.length ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-text-muted">
              <CalendarCheck className="w-8 h-8 opacity-30" strokeWidth={1.2} />
              <p className="text-sm">No meetings found.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle">
                  {['Title', 'Contact', 'Deal', 'Status', 'Join Link'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((m: CrmMeetingSummaryDto) => (
                  <tr key={m.id} onClick={() => { setSelectedId(m.id); setBookDate(''); setBookTime(''); setBookDuration('30'); setNotes(''); }} className="border-b border-border-subtle last:border-0 hover:bg-bg-elevated cursor-pointer transition-colors">
                    <td className="px-4 py-3 font-medium text-text-primary">{m.title}</td>
                    <td className="px-4 py-3 text-text-secondary">{m.contactName ?? '—'}</td>
                    <td className="px-4 py-3 text-text-secondary">{m.dealName ?? '—'}</td>
                    <td className="px-4 py-3"><Badge value={m.status} labels={CRM_MEETING_STATUS_LABELS} colors={CRM_MEETING_STATUS_COLORS} /></td>
                    <td className="px-4 py-3 text-text-muted text-xs truncate max-w-32">{m.joinUrl ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Initiate SlideOver */}
      <SlideOver open={showInitiate} onClose={() => setShowInitiate(false)} title="Initiate Meeting">
        <form onSubmit={handleInitiate} className="space-y-4">
          <Field label="Title *"><input required value={initForm.title} onChange={setI('title')} placeholder="Discovery Call" className={inputCls} /></Field>
          <Field label="Primary Contact *">
            <select required value={initForm.contactId} onChange={setI('contactId')} className={selectCls}>
              <option value="">Select primary contact</option>
              {contactsList.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}
            </select>
          </Field>
          <Field label="Additional Attendees">
            <div className="max-h-40 overflow-y-auto space-y-1.5 rounded-xl bg-bg-elevated border border-border-subtle p-2">
              {contactsList.filter(c => c.id !== initForm.contactId).map(c => (
                <label key={c.id} className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-bg-card cursor-pointer text-sm text-text-secondary">
                  <input type="checkbox" checked={selectedAttendees.has(c.id)} onChange={() => toggleAttendee(c.id)} className="accent-brand" />
                  {c.fullName}
                </label>
              ))}
            </div>
          </Field>
          <Field label="Date (leave blank for scheduling)">
            <input type="date" value={initForm.scheduledAt} onChange={e => setInitForm(f => ({ ...f, scheduledAt: e.target.value }))} className={inputCls} />
          </Field>
          <Field label="Duration">
            <select value={initForm.durationMinutes} onChange={setI('durationMinutes')} className={selectCls}>
              <option value="15">15 min</option>
              <option value="30">30 min</option>
              <option value="45">45 min</option>
              <option value="60">1 hour</option>
              <option value="90">1.5 hours</option>
            </select>
          </Field>
          <Field label="Deal (optional)">
            <select value={initForm.dealId} onChange={setI('dealId')} className={selectCls}>
              <option value="">No deal linked</option>
              {dealsList.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </Field>
          <Field label="Agenda"><textarea value={initForm.agendaText} onChange={setI('agendaText')} placeholder="Meeting agenda..." className={inputCls + ' min-h-[80px]'} /></Field>
          <Field label="Join Link"><input value={initForm.joinUrl} onChange={setI('joinUrl')} placeholder="https://zoom.us/j/..." className={inputCls} /></Field>
          <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl bg-bg-elevated border border-border-subtle">
            <input
              type="checkbox"
              checked={initForm.generateSlots}
              onChange={e => setInitForm(f => ({ ...f, generateSlots: e.target.checked }))}
              className="accent-brand w-4 h-4"
            />
            <div>
              <p className="text-sm font-medium text-text-primary">Generate slots from Google Calendar</p>
              <p className="text-xs text-text-muted">Auto-detect your available times for the contact to pick from</p>
            </div>
          </label>
          <button type="submit" disabled={initiateMeeting.isPending} className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-brand text-bg text-sm font-bold hover:bg-brand-light disabled:opacity-60 transition-all">
            {initiateMeeting.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Initiate'}
          </button>
        </form>
      </SlideOver>

      {/* Detail SlideOver */}
      <SlideOver open={!!selectedId} onClose={() => setSelectedId(null)} title="Meeting Detail">
        {detailLoading ? (
          <div className="flex items-center justify-center py-12 text-text-muted"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : detail ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Title"><span className="text-text-primary font-semibold text-sm">{detail.title}</span></Field>
              <Field label="Status"><Badge value={detail.status} labels={CRM_MEETING_STATUS_LABELS} colors={CRM_MEETING_STATUS_COLORS} /></Field>
              <Field label="Contact"><span className="text-text-secondary text-sm">{selectedSummary?.contactName ?? '—'}</span></Field>
              <Field label="Deal"><span className="text-text-secondary text-sm">{selectedSummary?.dealName ?? '—'}</span></Field>
              {detail.acceptedSlot && (
                <Field label="Scheduled"><span className="text-text-secondary text-sm">{format(parseISO(detail.acceptedSlot), 'MMM d, yyyy HH:mm')}</span></Field>
              )}
              <Field label="Duration"><span className="text-text-secondary text-sm">{detail.durationMinutes} min</span></Field>
            </div>

            {detail.joinUrl && (
              <Field label="Join Link">
                <a href={detail.joinUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-brand hover:underline break-all">{detail.joinUrl}</a>
              </Field>
            )}

            {detail.schedulingToken && detail.status === 1 /* ProposalDrafted */ && (
              <Field label="Scheduling Link">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-muted truncate flex-1">
                    {`${window.location.origin}/schedule/${detail.schedulingToken}`}
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/schedule/${detail.schedulingToken}`);
                      toast.success('Scheduling link copied!');
                    }}
                    className="p-1.5 rounded-lg hover:bg-bg-card text-text-muted hover:text-text-primary transition-colors shrink-0"
                    title="Copy link"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs text-text-muted mt-1">Share this link with the contact to let them pick a time.</p>
              </Field>
            )}

            {detail.agendaText && (
              <Field label="Agenda">
                <p className="text-sm text-text-secondary whitespace-pre-line leading-relaxed bg-bg-elevated rounded-xl border border-border-subtle px-4 py-3">{detail.agendaText}</p>
              </Field>
            )}

            <Field label="Notes">
              <textarea value={notes || detail.notes || ''} onChange={e => setNotes(e.target.value)} placeholder="Meeting notes..." rows={4} className={inputCls + ' min-h-[80px]'} />
              {notes !== (detail.notes ?? '') && (
                <button onClick={() => updateMeeting.mutate({ id: detail.id, data: { notes } })} disabled={updateMeeting.isPending} className="mt-1 text-xs text-brand hover:underline">
                  {updateMeeting.isPending ? 'Saving...' : 'Save notes'}
                </button>
              )}
            </Field>

            {detail.status === CrmMeetingStatus.ProposalDrafted && (
              <div className="grid grid-cols-2 gap-3">
                <Field label="Date"><input type="date" value={bookDate} onChange={e => setBookDate(e.target.value)} className={inputCls} /></Field>
                <Field label="Time"><input type="time" value={bookTime} onChange={e => setBookTime(e.target.value)} className={inputCls} /></Field>
                <Field label="Duration">
                  <select value={bookDuration} onChange={e => setBookDuration(e.target.value)} className={selectCls}>
                    <option value="15">15 min</option>
                    <option value="30">30 min</option>
                    <option value="45">45 min</option>
                    <option value="60">1 hour</option>
                    <option value="90">1.5 hours</option>
                    <option value="120">2 hours</option>
                  </select>
                </Field>
              </div>
            )}

            {detail.attendees?.length > 0 && (
              <Field label="Attendees">
                <div className="space-y-1">
                  {detail.attendees.map((a, i) => (
                    <p key={i} className="text-sm text-text-secondary">{a.name} ({a.email}) — {a.role}</p>
                  ))}
                </div>
              </Field>
            )}

            {/* Complete with summary prompt */}
            {detail.status === CrmMeetingStatus.Booked && showCompleteSummary && (
              <div className="p-4 rounded-xl bg-bg-subtle border border-border-subtle space-y-3">
                <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Meeting Summary</p>
                <textarea
                  autoFocus
                  value={completeSummaryText}
                  onChange={e => setCompleteSummaryText(e.target.value)}
                  placeholder="What was discussed? Key outcomes, decisions, next steps..."
                  rows={4}
                  className={inputCls + ' min-h-[80px]'}
                />
                <div className="flex gap-2">
                  <button
                    disabled={updateMeeting.isPending || logActivity.isPending}
                    onClick={() => {
                      updateMeeting.mutate({ id: detail.id, data: { status: CrmMeetingStatus.Completed } }, {
                        onSuccess: () => {
                          if (detail.dealId && completeSummaryText.trim()) {
                            logActivity.mutate({
                              entityKind: 2,
                              entityId: detail.dealId,
                              eventKind: 18,
                              summary: completeSummaryText.trim(),
                            });
                          }
                          setShowCompleteSummary(false);
                          setCompleteSummaryText('');
                        },
                      });
                    }}
                    className="px-4 py-2 rounded-xl bg-success-soft text-success text-sm font-bold hover:bg-success hover:text-bg disabled:opacity-60 transition-all"
                  >
                    {updateMeeting.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Complete & Log'}
                  </button>
                  <button onClick={() => { setShowCompleteSummary(false); setCompleteSummaryText(''); }} className="px-4 py-2 rounded-xl bg-bg-elevated border border-border-subtle text-xs text-text-muted transition-all">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {showRequestSummary ? (
              <div className="rounded-xl border border-border-subtle bg-bg-elevated p-4 space-y-3">
                <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Request AI Call Summary</p>
                <input value={reqSummaryText} onChange={e => setReqSummaryText(e.target.value)} placeholder="What happened in this call / meeting?" className="w-full px-3 py-2 rounded-xl bg-bg-input border border-border-subtle text-sm text-text-primary focus:outline-none focus:border-border-glow" />
                <div className="flex gap-2">
                  <button onClick={() => {
                    requestSummary.mutate({ contactId: detail.contactId, meetingId: detail.id, trigger: 1 }, { onSuccess: () => { setShowRequestSummary(false); setReqSummaryText(''); toast.success('Summary requested.'); } });
                  }} disabled={requestSummary.isPending} className="px-3 py-1.5 rounded-lg bg-brand text-bg text-xs font-bold disabled:opacity-50">
                    {requestSummary.isPending ? 'Requesting...' : 'Request Summary'}
                  </button>
                  <button onClick={() => setShowRequestSummary(false)} className="px-3 py-1.5 rounded-lg border border-border-subtle text-xs text-text-secondary">Cancel</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowRequestSummary(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-bg-elevated border border-border-subtle text-text-secondary text-sm font-bold hover:bg-bg-card transition-all">
                <Sparkles className="w-4 h-4" strokeWidth={1.5} /> Request AI Summary
              </button>
            )}
            <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-border-subtle">
              {detail.status === CrmMeetingStatus.ProposalDrafted && bookDate && bookTime && (
                <button
                  onClick={() => bookMeeting.mutate(
                    { id: detail.id, selectedSlot: `${bookDate}T${bookTime}:00`, durationMinutes: Number(bookDuration) },
                    {
                      onSuccess: () => {
                        if (detail.dealId) {
                          logActivity.mutate({
                            entityKind: 2,
                            entityId: detail.dealId,
                            eventKind: 18,
                            summary: `Meeting booked: ${detail.title}`,
                          });
                        }
                      },
                    }
                  )}
                  disabled={bookMeeting.isPending}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand text-bg text-sm font-bold hover:bg-brand-light disabled:opacity-60 transition-all"
                >
                  {bookMeeting.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarCheck className="w-4 h-4" strokeWidth={1.5} />} Book
                </button>
              )}
              {detail.status === CrmMeetingStatus.Booked && !showCompleteSummary && (
                <button
                  onClick={() => { setShowCompleteSummary(true); setCompleteSummaryText(''); }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-success-soft text-success text-sm font-bold hover:bg-success hover:text-bg transition-all"
                >
                  <CalendarCheck className="w-4 h-4" strokeWidth={1.5} /> Mark Completed
                </button>
              )}
              <div className="space-y-2">
                <div className="flex gap-2 items-center">
                  <input value={taskTitle} onChange={e => setTaskTitle(e.target.value)} placeholder="Task description..."
                    className="flex-1 px-3 py-2 rounded-xl bg-bg-input border border-border-subtle text-sm text-text-primary focus:outline-none focus:border-border-glow" />
                  <button onClick={() => taskTitle.trim() && createTask.mutate({ id: detail.id, title: taskTitle.trim(), assignedToUserId: taskAssigneeId || undefined })}
                    disabled={createTask.isPending || !taskTitle.trim()}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand text-bg text-sm font-bold hover:bg-brand-light disabled:opacity-60 transition-all shrink-0">
                    {createTask.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" strokeWidth={1.5} />}
                    {createTask.isPending ? 'Creating...' : 'Create Task'}
                  </button>
                </div>
                <div className="flex justify-end">
                  <select value={taskAssigneeId} onChange={e => setTaskAssigneeId(e.target.value)}
                    className="px-2 py-1 rounded-lg bg-bg-input border border-border-subtle text-xs text-text-primary focus:outline-none focus:border-border-glow w-48">
                    <option value="">Assign to me (default)</option>
                    {teamMembers.filter((u: any) => u.role !== 1).map((u: any) => (
                      <option key={u.id} value={u.id}>{u.fullName || `${u.firstName} ${u.lastName}`}</option>
                    ))}
                  </select>
                </div>
              </div>
              {detail.status !== CrmMeetingStatus.Cancelled && detail.status !== CrmMeetingStatus.Completed && (
                <button onClick={() => { cancelMeeting.mutate(detail.id, { onSuccess: () => setSelectedId(null) }); }} disabled={cancelMeeting.isPending} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-danger-soft text-danger text-sm font-bold hover:bg-danger hover:text-bg transition-all disabled:opacity-60">
                  {cancelMeeting.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" strokeWidth={1.5} />} Cancel
                </button>
              )}
            </div>
          </div>
        ) : null}
      </SlideOver>
    </>
  );
}

// ─── Call Summaries Tab ───────────────────────────────────────────────────────

function CallSummariesTab() {
  const [filter] = useState<CrmCallSummaryFilter>({ page: 1, pageSize: 20 });
  const [showRequest, setShowRequest] = useState(false);
  const [reqForm, setReqForm] = useState<{ signalId: string; contactId: string; dealId: string }>({ signalId: '', contactId: '', dealId: '' });
  const [selectedCs, setSelectedCs] = useState<CrmCallSummarySummaryDto | null>(null);

  const { data: raw, isLoading } = useCallSummaries(filter);
  const items: CrmCallSummarySummaryDto[] = (raw as any)?.items ?? [];

  const requestSummary = useRequestCallSummary();
  const generateSummary = useGenerateCallSummary();

  const handleRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const req: CrmCallSummaryRequestDto = {
      signalId: reqForm.signalId.trim(),
      contactId: reqForm.contactId.trim() || undefined,
      dealId: reqForm.dealId.trim() || undefined,
    };
    requestSummary.mutate(req, { onSuccess: () => { setShowRequest(false); setReqForm({ signalId: '', contactId: '', dealId: '' }); } });
  };

  const setR = (k: keyof typeof reqForm) => (e: React.ChangeEvent<HTMLInputElement>) => setReqForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4 shrink-0">
          <div />
          <button onClick={() => setShowRequest(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-bg bg-brand hover:bg-brand-light transition-all">
            <Plus className="w-3.5 h-3.5" strokeWidth={2.5} /> Request Summary
          </button>
        </div>

        <div className="rounded-2xl border border-border-subtle bg-bg-card overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-40 text-text-muted"><Loader2 className="w-5 h-5 animate-spin" /></div>
          ) : !items.length ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-text-muted">
              <PhoneCall className="w-8 h-8 opacity-30" strokeWidth={1.2} />
              <p className="text-sm">No call summaries found.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle">
                  {['Contact', 'Deal', 'Status', 'Summary', 'Created'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((cs: CrmCallSummarySummaryDto) => (
                  <tr key={cs.id} onClick={() => setSelectedCs(cs)} className="border-b border-border-subtle last:border-0 hover:bg-bg-elevated cursor-pointer transition-colors">
                    <td className="px-4 py-3 font-medium text-text-primary">{cs.contactName ?? '—'}</td>
                    <td className="px-4 py-3 text-text-secondary">{cs.dealName ?? '—'}</td>
                    <td className="px-4 py-3"><Badge value={cs.status} labels={CRM_CALL_SUMMARY_STATUS_LABELS} colors={CALL_STATUS_COLORS} /></td>
                    <td className="px-4 py-3 text-text-muted text-xs max-w-48 truncate">{cs.summaryText ? cs.summaryText.slice(0, 80) + (cs.summaryText.length > 80 ? '…' : '') : '—'}</td>
                    <td className="px-4 py-3 text-text-muted text-xs">{format(parseISO(cs.createdAt), 'MMM d, yyyy')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Request SlideOver */}
      <SlideOver open={showRequest} onClose={() => setShowRequest(false)} title="Request Call Summary">
        <form onSubmit={handleRequest} className="space-y-4">
          <Field label="Signal ID *"><input required value={reqForm.signalId} onChange={setR('signalId')} placeholder="Signal ID (required)" className={inputCls} /></Field>
          <Field label="Contact ID"><input value={reqForm.contactId} onChange={setR('contactId')} placeholder="Contact ID (optional)" className={inputCls} /></Field>
          <Field label="Deal ID"><input value={reqForm.dealId} onChange={setR('dealId')} placeholder="Deal ID (optional)" className={inputCls} /></Field>
          <button type="submit" disabled={requestSummary.isPending} className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-brand text-bg text-sm font-bold hover:bg-brand-light disabled:opacity-60 transition-all">
            {requestSummary.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Request'}
          </button>
        </form>
      </SlideOver>

      {/* Detail SlideOver */}
      <SlideOver open={!!selectedCs} onClose={() => setSelectedCs(null)} title="Call Summary">
        {selectedCs && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Contact"><span className="text-text-primary font-semibold text-sm">{selectedCs.contactName ?? '—'}</span></Field>
              <Field label="Status"><Badge value={selectedCs.status} labels={CRM_CALL_SUMMARY_STATUS_LABELS} colors={CALL_STATUS_COLORS} /></Field>
              <Field label="Deal"><span className="text-text-secondary text-sm">{selectedCs.dealName ?? '—'}</span></Field>
            </div>

            {selectedCs.summaryText && (
              <div>
                <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Summary</p>
                <p className="text-sm text-text-secondary whitespace-pre-line leading-relaxed bg-bg-elevated rounded-xl border border-border-subtle px-4 py-3">{selectedCs.summaryText}</p>
              </div>
            )}

            {selectedCs.status === CrmCallSummaryStatus.Pending && (
              <button onClick={() => generateSummary.mutate(selectedCs.id)} disabled={generateSummary.isPending} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand text-bg text-sm font-bold hover:bg-brand-light disabled:opacity-60 transition-all">
                {generateSummary.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Play className="w-4 h-4" strokeWidth={1.5} /> Generate</>}
              </button>
            )}

            <p className="text-xs text-text-muted">Created {format(parseISO(selectedCs.createdAt), 'MMM d, yyyy HH:mm')}</p>
          </div>
        )}
      </SlideOver>
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function Component() {
  const [tab, setTab] = useState<'meetings' | 'calls'>('meetings');

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-extrabold text-text-primary tracking-tight">Meetings</h2>

      <div className="flex gap-2">
        {([['meetings', 'Meetings'], ['calls', 'Call Summaries']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-3.5 py-1.5 rounded-full text-2xs font-semibold transition-all border ${tab === key ? 'bg-brand-soft border-border-glow text-brand' : 'bg-bg-card border-border-subtle text-text-muted hover:text-text-secondary'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'meetings' ? <MeetingsTab /> : <CallSummariesTab />}
    </div>
  );
}
