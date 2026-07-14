import { Link } from 'react-router-dom';
import { Plus, MessageSquare, Loader2, Inbox } from 'lucide-react';
import { usePortalCases } from '../api/portal.queries';
import type { PortalCaseListItemDto } from '../types/portal.types';

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  Open: { bg: 'bg-warning-500/10', text: 'text-warning-400', label: 'Open' },
  InProgress: { bg: 'bg-info-500/10', text: 'text-info-400', label: 'In Progress' },
  Resolved: { bg: 'bg-success-500/10', text: 'text-success-400', label: 'Resolved' },
  Closed: { bg: 'bg-glass-2', text: 'text-text-muted', label: 'Closed' },
};

function getStatus(status: string) {
  return STATUS_STYLES[status] ?? { bg: 'bg-glass-2', text: 'text-text-muted', label: status };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function Component() {
  const { data, isPending } = usePortalCases();
  const cases = (data ?? []) as PortalCaseListItemDto[];

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-extrabold text-text-primary">My Cases</h1>
          <p className="text-xs text-text-muted mt-0.5">View and manage your support cases</p>
        </div>
        <Link
          to="/portal/cases/new"
          className="flex items-center gap-1.5 px-4 py-2 rounded-sm bg-brand text-bg font-bold hover:bg-brand-light transition-all text-xs"
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={1.8} />
          New Case
        </Link>
      </div>

      {isPending ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 text-brand animate-spin" />
        </div>
      ) : cases.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-card bg-glass-1 border-thin border-border-subtle flex items-center justify-center mb-3">
            <Inbox className="w-5 h-5 text-text-muted" strokeWidth={1.6} />
          </div>
          <p className="text-sm font-semibold text-text-secondary mb-1">No cases yet</p>
          <p className="text-xs text-text-muted">Open a new case to get help from our team.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {cases.map((c) => {
            const s = getStatus(c.status);
            return (
              <Link
                key={c.id}
                to={`/portal/cases/${c.id}`}
                className="bg-glass-1 border-thin border-border-subtle rounded-card p-3.5 hover:bg-glass-2 hover:border-border-medium transition-all flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-sm bg-brand-soft flex items-center justify-center shrink-0">
                  <MessageSquare className="w-4 h-4 text-brand" strokeWidth={1.6} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-text-primary truncate">{c.subject}</p>
                  <p className="text-xs text-text-muted mt-0.5">{formatDate(c.createdAt)}</p>
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-xs text-2xs font-semibold ${s.bg} ${s.text} border-thin border-transparent shrink-0`}>
                  {s.label}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
