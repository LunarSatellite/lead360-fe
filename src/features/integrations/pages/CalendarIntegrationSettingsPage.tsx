import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Calendar, CheckCircle2, AlertCircle, Loader2, LogOut, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import {
  useCalendarIntegrationStatus,
  useConnectCalendar,
  useDisconnectCalendar,
} from '../api/calendarIntegration.queries';

const CALLBACK_URL = 'https://surreal-denote-deviate.ngrok-free.dev/api/v1/calendar/callback';

function CalendarIntegrationSettingsPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const { data: status, isLoading, refetch } = useCalendarIntegrationStatus();
  const connect    = useConnectCalendar();
  const disconnect = useDisconnectCalendar();

  useEffect(() => {
    const connected = params.get('cal_connected');
    const error     = params.get('cal_error');
    if (connected) {
      toast.success('Google Calendar connected successfully!');
      refetch();
      setParams({}, { replace: true });
    } else if (error) {
      toast.error(`Connection failed: ${decodeURIComponent(error)}`);
      setParams({}, { replace: true });
    }
  }, [params]);

  const handleConnect = () => {
    connect.mutate(CALLBACK_URL);
  };

  return (
    <div className="p-6 max-w-xl mx-auto space-y-6">
      {/* Back */}
      <button
        onClick={() => navigate('/dashboard/settings')}
        className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Settings
      </button>

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-text-primary">Google Calendar</h1>
        <p className="text-sm text-text-muted mt-0.5">
          Connect your Google Calendar so contacts can pick from your real available slots when scheduling meetings.
        </p>
      </div>

      {/* Card */}
      {isLoading ? (
        <div className="bg-bg-elevated border border-border-subtle rounded-card p-8 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
        </div>
      ) : status?.isConnected && status.integration ? (
        /* Connected */
        <div className="bg-bg-elevated border border-[rgba(99,102,241,0.4)] rounded-card p-6 space-y-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-400/10 border border-green-400/20 flex items-center justify-center shrink-0">
              <Calendar className="w-6 h-6 text-green-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-text-primary">Google Calendar</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-green-400 bg-green-400/10 border border-green-400/20">
                  <CheckCircle2 className="w-3 h-3" /> Connected
                </span>
              </div>
              {status.integration.connectedEmail && (
                <p className="text-sm text-text-muted mt-0.5 truncate">{status.integration.connectedEmail}</p>
              )}
              <p className="text-xs text-text-muted mt-1">
                Connected {new Date(status.integration.connectedAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-indigo-500/10 border border-indigo-500/20 px-4 py-3 text-sm text-indigo-300">
            Your calendar availability will be used when generating scheduling links for contacts.
            Zoom (or your connected video provider) still handles the meeting links.
          </div>

          <button
            onClick={() => disconnect.mutate()}
            disabled={disconnect.isPending}
            className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 font-medium transition-colors disabled:opacity-50"
          >
            {disconnect.isPending
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <LogOut className="w-4 h-4" />}
            Disconnect Google Calendar
          </button>
        </div>
      ) : (
        /* Not connected */
        <div className="bg-bg-elevated border border-border-subtle rounded-card p-6 space-y-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-bg-card border border-border-subtle flex items-center justify-center shrink-0">
              <Calendar className="w-6 h-6 text-text-muted" />
            </div>
            <div>
              <span className="font-semibold text-text-primary">Google Calendar</span>
              <p className="text-sm text-text-muted mt-0.5">Not connected</p>
            </div>
          </div>

          <div className="rounded-xl bg-amber-400/10 border border-amber-400/20 px-4 py-3 flex gap-3">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-300">
              Connect Google Calendar to enable the "Generate available slots" feature when scheduling meetings with contacts.
              Lead360 only reads your free/busy data — it cannot modify your calendar.
            </p>
          </div>

          <div className="space-y-2 text-sm text-text-muted">
            <p className="font-medium text-text-primary">What Lead360 does with access:</p>
            <ul className="space-y-1.5 list-disc list-inside text-text-muted">
              <li>Reads your free/busy times to generate open slots</li>
              <li>Never reads event titles, descriptions, or attendees</li>
              <li>Never creates or modifies events on your calendar</li>
            </ul>
          </div>

          <button
            onClick={handleConnect}
            disabled={connect.isPending}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 disabled:opacity-60 transition-all"
          >
            {connect.isPending
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Calendar className="w-4 h-4" />}
            Connect Google Calendar
          </button>
        </div>
      )}
    </div>
  );
}

export { CalendarIntegrationSettingsPage as Component };
export default CalendarIntegrationSettingsPage;
