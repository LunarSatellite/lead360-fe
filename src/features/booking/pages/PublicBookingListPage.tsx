import { useParams, useNavigate } from 'react-router-dom';
import { Clock, Loader2, Calendar, ChevronRight } from 'lucide-react';
import { usePublicBookingPage } from '../api/booking.queries';
import type { PublicBookingPageDto } from '../api/booking.api';

function PublicBookingListPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: rawPage, isLoading, isError } = usePublicBookingPage(slug ?? '');
  const page = rawPage as unknown as PublicBookingPageDto | undefined;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f1117] flex items-center justify-center">
        <Loader2 className="w-7 h-7 animate-spin text-indigo-400" />
      </div>
    );
  }

  if (isError || !page) {
    return (
      <div className="min-h-screen bg-[#0f1117] flex items-center justify-center p-4">
        <div className="bg-bg-elevated border border-border-subtle rounded-card p-10 max-w-md w-full text-center">
          <Calendar className="w-10 h-10 text-text-muted mx-auto mb-4 opacity-40" />
          <h1 className="text-lg font-bold text-text-primary mb-2">Page not found</h1>
          <p className="text-sm text-text-muted">This booking page doesn't exist or is no longer active.</p>
        </div>
      </div>
    );
  }

  const eventTypes = page.eventTypes ?? [];

  return (
    <div className="min-h-screen bg-[#0f1117] p-4">
      <div className="max-w-lg mx-auto pt-12 pb-16">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-900/40">
            <Calendar className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">{page.title}</h1>
          {page.description && (
            <p className="text-sm text-text-muted mt-2 max-w-sm mx-auto">{page.description}</p>
          )}
          {page.welcomeMessage && (
            <p className="text-sm text-indigo-300 mt-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-4 py-3 inline-block">
              {page.welcomeMessage}
            </p>
          )}
        </div>

        {/* Event type cards */}
        <div className="space-y-3">
          {eventTypes.length === 0 && (
            <div className="text-center py-12 text-text-muted">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No meeting types available right now.</p>
            </div>
          )}
          {eventTypes.map((et) => (
            <button
              key={et.id}
              onClick={() => navigate(`/book/${slug}/${et.id}`)}
              className="w-full bg-bg-elevated border border-border-subtle hover:border-[rgba(99,102,241,0.5)] rounded-card p-5 text-left transition-all group hover:bg-[rgba(99,102,241,0.04)]"
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-1 h-12 rounded-full flex-shrink-0"
                  style={{ backgroundColor: et.color }}
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-text-primary group-hover:text-indigo-300 transition-colors">
                    {et.title}
                  </h3>
                  {et.description && (
                    <p className="text-sm text-text-muted mt-0.5 truncate">{et.description}</p>
                  )}
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <Clock className="w-3.5 h-3.5 text-text-muted" />
                    <span className="text-xs text-text-muted">{et.durationMinutes} min</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-indigo-400 transition-colors flex-shrink-0" />
              </div>
            </button>
          ))}
        </div>

        <p className="text-center text-xs text-text-muted opacity-40 mt-10">Powered by OmniFlow</p>
      </div>
    </div>
  );
}

export const Component = PublicBookingListPage;
export default PublicBookingListPage;
