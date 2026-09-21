import { Link } from 'react-router-dom';
import { Users, ArrowUpRight } from 'lucide-react';
import type { CrmDuplicateMatchDto } from '../types/crm.types';
import { ROUTES } from '@/app/router/route-paths';

interface Props {
  matches: CrmDuplicateMatchDto[];
  /** Called when the user explicitly chooses to create the contact anyway. */
  onCreateAnyway: () => void;
  isSaving?: boolean;
}

/**
 * Surfaced at contact-create time when the backend dedup check finds existing contacts/leads
 * matching the email or phone. Lets the user open the existing record or create anyway — the
 * point-of-entry guard against the Lead/Contact duplicate problem.
 */
export function DuplicateWarning({ matches, onCreateAnyway, isSaving }: Props) {
  if (matches.length === 0) return null;

  return (
    <div className="rounded-card border-thin border-warning/40 bg-warning/10 p-3">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-700 text-warning">
        <Users size={14} strokeWidth={1.6} />
        Possible duplicate{matches.length > 1 ? 's' : ''} found
      </div>

      <ul className="flex flex-col gap-1.5">
        {matches.slice(0, 5).map((m) => {
          const to =
            m.kind === 'contact'
              ? ROUTES.dashboard.crmContactDetail(m.id)
              : ROUTES.dashboard.crmLeadDetail(m.id);
          return (
            <li
              key={`${m.kind}-${m.id}`}
              className="flex items-center justify-between gap-2 rounded-sm bg-glass-1 px-2.5 py-1.5"
            >
              <div className="min-w-0">
                <p className="truncate text-xs font-600 text-text-primary">
                  {m.name || '(no name)'}{' '}
                  <span className="font-500 text-text-muted">· {m.kind}</span>
                </p>
                <p className="truncate text-[11px] text-text-muted">
                  matched {m.matchField}: {m.email || m.phone}
                </p>
              </div>
              <Link
                to={to}
                className="flex shrink-0 items-center gap-1 rounded-xs border-thin border-border-medium px-2 py-1 text-[11px] font-600 text-text-secondary hover:bg-glass-2 hover:text-text-primary"
              >
                Open <ArrowUpRight size={11} strokeWidth={1.6} />
              </Link>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        onClick={onCreateAnyway}
        disabled={isSaving}
        className="mt-2.5 text-[11px] font-600 text-text-muted underline underline-offset-2 hover:text-text-secondary disabled:opacity-50"
      >
        Not a match — create anyway
      </button>
    </div>
  );
}
