import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { Clock, Calendar, CheckCircle2, Loader2, ArrowLeft, Video } from 'lucide-react';
import {
  usePublicBookingPage,
  usePublicSlots,
  useConfirmBooking,
} from '../api/booking.queries';
import type { PublicBookingPageDto, MeetingSlotDto } from '../api/booking.api';

const inputCls =
  'w-full px-3 py-2 rounded-xl bg-[#0f1117] border border-border-subtle text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-glow transition-all';

function PublicBookingEventPage() {
  const { slug, eventTypeId } = useParams<{ slug: string; eventTypeId: string }>();
  const navigate = useNavigate();

  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [step, setStep] = useState<'slots' | 'form'>('slots');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [confirmed, setConfirmed] = useState<{
    meetingTitle: string;
    confirmedSlot: string;
    durationMinutes: number;
    joinUrl: string | null;
    message: string;
  } | null>(null);

  const { data: rawPage, isLoading: pageLoading } = usePublicBookingPage(slug ?? '');
  const page = rawPage as unknown as PublicBookingPageDto | undefined;
  const eventType = (page?.eventTypes ?? []).find((e) => e.id === eventTypeId);

  const { data: rawSlots, isLoading: slotsLoading } = usePublicSlots(
    slug ?? '',
    eventTypeId ?? '',
    !!page && !!eventTypeId
  );
  const slots = rawSlots as unknown as MeetingSlotDto[] | undefined;

  const confirm = useConfirmBooking(slug ?? '', eventTypeId ?? '');

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot || !name.trim() || !email.trim()) return;
    confirm.mutate(
      {
        contactName: name.trim(),
        contactEmail: email.trim(),
        contactPhone: phone.trim() || undefined,
        selectedSlot,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        notes: notes.trim() || undefined,
      },
      {
        onSuccess: (data: any) => {
          const d = data as unknown as {
            meetingTitle: string; confirmedSlot: string;
            durationMinutes: number; joinUrl: string | null; message: string;
          };
          setConfirmed({
            meetingTitle: d.meetingTitle,
            confirmedSlot: d.confirmedSlot,
            durationMinutes: d.durationMinutes,
            joinUrl: d.joinUrl,
            message: d.message,
          });
        },
        onError: (err: any) => {
          alert(err?.response?.data?.message ?? 'Booking failed. Please try again.');
        },
      }
    );
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-[#0f1117] flex items-center justify-center">
        <Loader2 className="w-7 h-7 animate-spin text-indigo-400" />
      </div>
    );
  }

  if (!page || !eventType) {
    return (
      <div className="min-h-screen bg-[#0f1117] flex items-center justify-center p-4">
        <div className="bg-bg-elevated border border-border-subtle rounded-card p-10 max-w-md w-full text-center">
          <Calendar className="w-10 h-10 text-text-muted mx-auto mb-4 opacity-40" />
          <h1 className="text-lg font-bold text-text-primary mb-2">Not found</h1>
          <p className="text-sm text-text-muted">This event type doesn't exist or is no longer active.</p>
        </div>
      </div>
    );
  }

  if (confirmed) {
    const slotDate = parseISO(confirmed.confirmedSlot);
    return (
      <div className="min-h-screen bg-[#0f1117] flex items-center justify-center p-4">
        <div className="bg-bg-elevated border border-border-subtle rounded-card p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-green-400/10 border border-green-400/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-green-400" />
          </div>
          <h1 className="text-xl font-bold text-text-primary mb-2">You're booked!</h1>
          <p className="text-sm text-text-muted mb-6">{confirmed.message}</p>

          <div className="bg-bg-card border border-border-subtle rounded-xl p-4 text-left space-y-2.5 mb-6">
            <div className="flex items-center gap-2 text-sm text-text-primary">
              <Calendar className="w-4 h-4 text-indigo-400" />
              <span>{format(slotDate, 'EEEE, MMMM d, yyyy')}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-text-primary">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span>{format(slotDate, 'h:mm a')} · {confirmed.durationMinutes} min</span>
            </div>
            {confirmed.joinUrl && (
              <a
                href={confirmed.joinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                <Video className="w-4 h-4" />
                <span>Join meeting link</span>
              </a>
            )}
          </div>

          <p className="text-xs text-text-muted opacity-60">A calendar invite has been sent to your email.</p>
        </div>
      </div>
    );
  }

  const groupedSlots = groupSlotsByDate(slots ?? []);

  return (
    <div className="min-h-screen bg-[#0f1117] p-4">
      <div className="max-w-lg mx-auto pt-8 pb-16">
        {/* Back */}
        <button
          onClick={() => navigate(`/book/${slug}`)}
          className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Event type header */}
        <div className="bg-bg-elevated border border-border-subtle rounded-card p-5 mb-4">
          <div className="w-2 h-2 rounded-full mb-3" style={{ backgroundColor: eventType.color }} />
          <h1 className="text-xl font-bold text-text-primary">{eventType.title}</h1>
          {eventType.description && (
            <p className="text-sm text-text-muted mt-1">{eventType.description}</p>
          )}
          <div className="flex items-center gap-1.5 mt-3 text-sm text-text-muted">
            <Clock className="w-4 h-4" />
            <span>{eventType.durationMinutes} minutes</span>
          </div>
        </div>

        {step === 'slots' ? (
          <div className="bg-bg-elevated border border-border-subtle rounded-card p-5">
            <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4">Select a time</h2>

            {slotsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
              </div>
            ) : Object.keys(groupedSlots).length === 0 ? (
              <p className="text-sm text-text-muted text-center py-8 opacity-60">
                No available times right now. Please check back later.
              </p>
            ) : (
              <div className="space-y-5">
                {Object.entries(groupedSlots).map(([date, daySlots]) => (
                  <div key={date}>
                    <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">
                      {format(new Date(date), 'EEEE, MMMM d')}
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {daySlots.map((slot) => {
                        const isSelected = selectedSlot === slot.start;
                        return (
                          <button
                            key={slot.start}
                            onClick={() => setSelectedSlot(slot.start)}
                            className={`py-2 px-3 rounded-xl text-sm font-medium border transition-all ${
                              isSelected
                                ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-900/30'
                                : 'bg-bg-card text-text-primary border-border-subtle hover:border-[rgba(99,102,241,0.5)] hover:text-indigo-300'
                            }`}
                          >
                            {format(parseISO(slot.start), 'h:mm a')}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedSlot && (
              <button
                onClick={() => setStep('form')}
                className="w-full mt-6 py-3 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition-colors"
              >
                Continue →
              </button>
            )}
          </div>
        ) : (
          <div className="bg-bg-elevated border border-border-subtle rounded-card p-5">
            {selectedSlot && (
              <div className="flex items-center justify-between mb-5 pb-4 border-b border-border-subtle">
                <div className="flex items-center gap-2 text-sm text-text-primary">
                  <Clock className="w-4 h-4 text-indigo-400" />
                  <span>
                    {format(parseISO(selectedSlot), 'EEEE, MMM d')} at{' '}
                    {format(parseISO(selectedSlot), 'h:mm a')}
                  </span>
                </div>
                <button
                  onClick={() => setStep('slots')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Change
                </button>
              </div>
            )}

            <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4">Your details</h2>
            <form onSubmit={handleConfirm} className="space-y-3">
              <input
                type="text"
                placeholder="Your name *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className={inputCls}
              />
              <input
                type="email"
                placeholder="Email address *"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={inputCls}
              />
              <input
                type="tel"
                placeholder="Phone (optional)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputCls}
              />
              <textarea
                placeholder="Notes or questions (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className={`${inputCls} resize-none`}
              />

              <button
                type="submit"
                disabled={confirm.isPending || !name.trim() || !email.trim()}
                className="w-full py-3 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
              >
                {confirm.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Confirming…
                  </>
                ) : (
                  'Confirm booking'
                )}
              </button>
            </form>
          </div>
        )}

        <p className="text-center text-xs text-text-muted opacity-30 mt-8">Powered by OmniFlow</p>
      </div>
    </div>
  );
}

function groupSlotsByDate(slots: MeetingSlotDto[]): Record<string, MeetingSlotDto[]> {
  const groups: Record<string, MeetingSlotDto[]> = {};
  for (const slot of slots) {
    const date = slot.start.slice(0, 10);
    if (!groups[date]) groups[date] = [];
    groups[date].push(slot);
  }
  return groups;
}

export const Component = PublicBookingEventPage;
export default PublicBookingEventPage;
