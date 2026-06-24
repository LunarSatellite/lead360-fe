import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { Calendar, Clock, CheckCircle2, Loader2, Video } from 'lucide-react';
import { crmApi } from '../api/crm.api';
import type { PublicScheduleConfirmRequest } from '../types/crm.types';

const inputCls = 'w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all';

function PublicSchedulePage() {
  const { token } = useParams<{ token: string }>();
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [confirmed, setConfirmed] = useState<{ joinUrl: string | null; confirmedSlot: string; message: string } | null>(null);

  const { data: schedule, isLoading, error } = useQuery({
    queryKey: ['public-schedule', token],
    queryFn: () => crmApi.getPublicSchedule(token!) as Promise<any>,
    enabled: !!token,
    retry: false,
  });

  const confirm = useMutation({
    mutationFn: (req: PublicScheduleConfirmRequest) =>
      crmApi.confirmPublicSlot(token!, req) as Promise<any>,
    onSuccess: (data: any) => {
      setConfirmed({ joinUrl: data.joinUrl, confirmedSlot: data.confirmedSlot, message: data.message });
    },
  });

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot || !name.trim() || !email.trim()) return;
    confirm.mutate({
      selectedSlot,
      contactName: name.trim(),
      contactEmail: email.trim(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error || !schedule) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-md w-full text-center">
          <div className="text-4xl mb-4">🔗</div>
          <h1 className="text-lg font-bold text-gray-900 mb-2">Link not found</h1>
          <p className="text-sm text-gray-500">This scheduling link has expired or is no longer valid.</p>
        </div>
      </div>
    );
  }

  if (confirmed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-md w-full text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-green-50 border border-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Meeting Confirmed!</h1>
          <p className="text-sm text-gray-600 leading-relaxed">{confirmed.message}</p>
          {confirmed.joinUrl && (
            <a
              href={confirmed.joinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
            >
              <Video className="w-4 h-4" /> Join Meeting
            </a>
          )}
          <p className="text-xs text-gray-400">A calendar invite has been sent to your email.</p>
        </div>
      </div>
    );
  }

  // Group slots by date
  const slotsByDate: Record<string, typeof schedule.availableSlots> = {};
  (schedule.availableSlots ?? []).forEach((s: any) => {
    const day = format(parseISO(s.start), 'yyyy-MM-dd');
    if (!slotsByDate[day]) slotsByDate[day] = [];
    slotsByDate[day].push(s);
  });

  const sortedDays = Object.keys(slotsByDate).sort();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
              <Calendar className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{schedule.meetingTitle}</h1>
              <p className="text-sm text-gray-500 mt-0.5">with {schedule.organizerName}</p>
              <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-400">
                <Clock className="w-3.5 h-3.5" />
                {schedule.durationMinutes} minutes
              </div>
              {schedule.agendaText && (
                <p className="text-sm text-gray-600 mt-3 leading-relaxed">{schedule.agendaText}</p>
              )}
            </div>
          </div>
        </div>

        {/* Slot picker */}
        {sortedDays.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <p className="text-gray-500 text-sm">No available slots at the moment. Please contact the organizer directly.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
            <h2 className="font-semibold text-gray-900 text-sm">Select a time</h2>
            {sortedDays.map(day => (
              <div key={day}>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  {format(parseISO(day), 'EEEE, MMMM d')}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {slotsByDate[day].map((s: any) => (
                    <button
                      key={s.start}
                      onClick={() => setSelectedSlot(s.start)}
                      className={`py-2 px-3 rounded-xl text-sm font-medium border transition-all ${
                        selectedSlot === s.start
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-400 hover:bg-indigo-50'
                      }`}
                    >
                      {format(parseISO(s.start), 'h:mm a')}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Contact details + confirm */}
        {selectedSlot && (
          <form onSubmit={handleConfirm} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
            <h2 className="font-semibold text-gray-900 text-sm">Your details</h2>
            <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-sm text-indigo-700 font-medium">
              {format(parseISO(selectedSlot), "EEEE, MMMM d 'at' h:mm a")} · {schedule.durationMinutes} min
            </div>
            <input
              required
              placeholder="Your full name"
              value={name}
              onChange={e => setName(e.target.value)}
              className={inputCls}
            />
            <input
              required
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className={inputCls}
            />
            <button
              type="submit"
              disabled={confirm.isPending}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 disabled:opacity-60 transition-all"
            >
              {confirm.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Confirm Meeting
            </button>
            {confirm.isError && (
              <p className="text-xs text-red-500 text-center">
                {(confirm.error as any)?.message ?? 'Failed to confirm. Please try again.'}
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}

export { PublicSchedulePage as Component };
