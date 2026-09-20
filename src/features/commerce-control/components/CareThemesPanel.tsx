import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Loader2, RefreshCw, Stethoscope } from 'lucide-react';
import { stylemintCareApi, type CareTheme } from '../api/stylemint-care.api';

/**
 * What is going wrong with orders, grouped by cause rather than by ticket.
 *
 * Sits with support because that is who reads it: a queue tells you there are forty open
 * tickets, this tells you thirty of them are one carrier dropping handovers. Each theme names
 * the area accountable, which is the part that turns a count into an action.
 */

const WINDOWS = [7, 30, 90];

export function CareThemesPanel() {
  const [windowDays, setWindowDays] = useState(30);

  const report = useQuery({
    queryKey: ['stylemint-care-themes', windowDays],
    queryFn: () => stylemintCareApi.themes(windowDays),
  });

  const themes = report.data?.themes ?? [];
  const busiest = themes.reduce((max, t) => Math.max(max, t.openCount), 0);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1">
          {WINDOWS.map((w) => (
            <button
              key={w}
              onClick={() => setWindowDays(w)}
              className={`rounded-sm border-thin px-2.5 py-1 text-[11px] font-bold ${
                windowDays === w
                  ? 'border-border-glow bg-brand-soft text-brand'
                  : 'border-border-subtle text-text-secondary hover:bg-glass-2'
              }`}
            >
              {w}d
            </button>
          ))}
        </div>
        <button
          onClick={() => report.refetch()}
          className="flex items-center gap-1.5 text-[11px] font-bold text-text-secondary hover:text-brand"
        >
          <RefreshCw
            className={`h-3 w-3 ${report.isFetching ? 'animate-spin' : ''}`}
            strokeWidth={1.6}
          />
          Refresh
        </button>
      </div>

      {report.isError ? (
        <div className="flex items-start gap-3 rounded-frame border-thin border-rose-400/25 bg-rose-400/5 p-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" strokeWidth={1.6} />
          <p className="text-sm text-text-secondary">{(report.error as Error).message}</p>
        </div>
      ) : report.isLoading ? (
        <div className="flex items-center gap-3 rounded-frame border-thin border-border-subtle bg-bg-card p-8 text-sm text-text-muted">
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.6} /> Loading themes…
        </div>
      ) : themes.length === 0 ? (
        <div className="rounded-frame border-thin border-border-subtle bg-bg-card p-10 text-center">
          <Stethoscope className="mx-auto h-7 w-7 text-text-muted" strokeWidth={1.6} />
          <p className="mt-3 text-sm text-text-secondary">
            Nothing is going wrong with orders in the last {windowDays} days.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-text-muted">
            {themes.length} {themes.length === 1 ? 'theme' : 'themes'} ·{' '}
            {report.data && `generated ${new Date(report.data.generatedUtc).toLocaleString()}`}
          </p>
          {[...themes]
            .sort((a, b) => b.openCount - a.openCount)
            .map((theme) => (
              <ThemeRow key={theme.code} theme={theme} busiest={busiest} />
            ))}
        </div>
      )}
    </div>
  );
}

function ThemeRow({ theme, busiest }: { theme: CareTheme; busiest: number }) {
  // Bar relative to the busiest theme, so the shape of the problem reads at a glance rather
  // than needing the numbers compared by hand.
  const share = busiest > 0 ? Math.round((theme.openCount / busiest) * 100) : 0;

  return (
    <div className="rounded-card border-thin border-border-subtle bg-glass-1 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="font-mono text-xs font-bold text-text-primary">{theme.code}</p>
          <p className="mt-0.5 text-[11px] text-text-muted">
            accountable: {theme.accountableArea || 'unassigned'}
          </p>
        </div>
        <span className="shrink-0 text-sm font-black text-text-primary">{theme.openCount}</span>
      </div>
      <div className="mt-2 h-1 w-full overflow-hidden rounded-xs bg-glass-2">
        <div className="h-full rounded-xs bg-brand" style={{ width: `${share}%` }} />
      </div>
    </div>
  );
}
