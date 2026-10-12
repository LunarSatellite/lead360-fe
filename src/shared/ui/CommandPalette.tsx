import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Users, UserSquare2, Briefcase, CornerDownLeft, type LucideIcon } from 'lucide-react';
import { ROUTES } from '@/app/router/route-paths';
import { counterpartOf, navAliases, navGroups, navSections } from '@/app/navigation/nav-model';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { crmApi } from '@/features/crm/api/crm.api';

/* Global command palette — Cmd/Ctrl+K. Quick-navigates the app and searches
   leads / contacts / deals by name. Mounted once in the dashboard shell. */

/** Open the global command palette (used by the header search button). */
export function openCommandPalette() {
  window.dispatchEvent(new Event('lead360:open-command-palette'));
}

interface NavCommand {
  label: string;
  to: string;
  /** The same idea in the other product, when there is one. */
  counterpart?: { label: string; href: string };
  /** The group and section this page sits in, plus any name it used to have. */
  context: string;
  keywords: string;
  icon: LucideIcon;
}

/**
 * Every page in the admin, read from the one navigation model.
 *
 * This was a hand-written list of twenty-four, all of them CRM: Cmd+K could
 * not reach a single commerce page. It was the eighth copy of the navigation
 * in this codebase and, like the other seven, it had drifted — "Organizations"
 * with a z, pointing at the page the rail calls Stores.
 *
 * Deriving it means a page added to the rail is in the palette the same day,
 * and the palette can never again name a page something the rail does not.
 */
const NAV_COMMANDS: NavCommand[] = navGroups.flatMap((group) => {
  const section = navSections.find((s) => s.id === group.section);
  return group.items.map((item) => {
    const alsoKnownAs = navAliases.filter((a) => a.label === item.label).map((a) => a.alsoKnownAs);
    return {
      label: item.label,
      to: item.href,
      context: `${section?.label} · ${group.label}`,
      // Four pages exist once per product — orders, returns, deliveries,
      // vendors — against different backends. Saying so here is the whole
      // remedy available short of merging the backends: someone searching
      // "orders" sees both, and sees that each knows about the other.
      counterpart: counterpartOf(item.href),
      // The group and section are searchable, so "crm invoices" and
      // "procurement" both find something sensible. So are the names the
      // other product used, so nobody is stranded by the merge.
      keywords: [group.label, section?.label, ...alsoKnownAs].join(' ').toLowerCase(),
      icon: item.icon,
    };
  });
});

interface Hit {
  id: string;
  label: string;
  sub?: string;
  to: string;
}

export function CommandPalette() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const q = useDebounce(query.trim(), 250);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener('keydown', onKey);
    window.addEventListener('lead360:open-command-palette', onOpen);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('lead360:open-command-palette', onOpen);
    };
  }, []);

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  const enabled = open && q.length >= 2;
  const leadsQ = useQuery({
    queryKey: ['cmdk', 'leads', q],
    enabled,
    queryFn: () => crmApi.getLeads({ search: q, pageSize: 5 }),
  });
  const contactsQ = useQuery({
    queryKey: ['cmdk', 'contacts', q],
    enabled,
    queryFn: () => crmApi.getContacts({ search: q, pageSize: 5 }),
  });
  const dealsQ = useQuery({
    queryKey: ['cmdk', 'deals', q],
    enabled,
    queryFn: () => crmApi.getDeals({ search: q, pageSize: 5 }),
  });

  /**
   * Capped, because the list is now the whole admin.
   *
   * It used to be twenty-four entries and they all fitted. 130 do not: an
   * unfiltered dump is the scrolling column this work exists to get rid of,
   * reproduced inside the palette. A name match sorts above a match on the
   * group or section, so typing "orders" offers the pages called Orders
   * before the ones that merely live under one.
   */
  const NAV_LIMIT = 8;
  const { navMatches, navOverflow } = useMemo(() => {
    const lc = q.toLowerCase();
    const byName = NAV_COMMANDS.filter((c) => c.label.toLowerCase().includes(lc));
    const byContext = lc
      ? NAV_COMMANDS.filter((c) => !c.label.toLowerCase().includes(lc) && c.keywords.includes(lc))
      : [];
    const all = [...byName, ...byContext];
    return { navMatches: all.slice(0, NAV_LIMIT), navOverflow: all.length - NAV_LIMIT };
  }, [q]);

  const leadHits: Hit[] = (((leadsQ.data as any)?.items ?? []) as any[]).map((l) => ({
    id: l.id,
    label: l.customerName || l.channelHandle || 'Lead',
    sub: l.customerEmail || l.customerPhone || undefined,
    to: ROUTES.dashboard.crmLeadDetail(l.id),
  }));
  const contactHits: Hit[] = (((contactsQ.data as any)?.items ?? []) as any[]).map((c) => ({
    id: c.id,
    label: c.fullName,
    sub: c.email || c.phone || undefined,
    to: ROUTES.dashboard.crmContactDetail(c.id),
  }));
  const dealHits: Hit[] = (((dealsQ.data as any)?.items ?? []) as any[]).map((d) => ({
    id: d.id,
    label: d.name,
    sub: d.accountName || d.stageName || undefined,
    to: ROUTES.dashboard.crmDealDetail(d.id),
  }));

  const go = (to: string) => {
    setOpen(false);
    navigate(to);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-start justify-center bg-black/50 backdrop-blur-sm px-4 pt-[6vh]"
      onClick={() => setOpen(false)}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-xl bg-bg-elevated border-thin border-border-subtle rounded-card shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-3 border-b border-thin border-border-subtle">
          <div className="flex items-center gap-2 h-12 px-3.5 rounded-sm bg-bg-input border-thin border-border-subtle focus-within:border-border-glow focus-within:shadow-[0_0_0_1px_rgba(0,217,138,0.50),0_0_10px_rgba(0,217,138,0.20)] transition-all">
            <Search className="w-4 h-4 text-text-muted shrink-0" strokeWidth={1.8} />
            {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search leads, contacts, deals — or jump to a page…" aria-label="Search leads, contacts, deals — or jump to a page…"
              className="flex-1 min-w-0 h-full bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus-visible:shadow-none"
            />
            <kbd className="shrink-0 text-[10px] text-text-muted border-thin border-border-medium rounded px-1.5 py-0.5">
              esc
            </kbd>
          </div>
        </div>

        <div className="max-h-[55vh] overflow-y-auto py-2">
          <Group title="Go to">
            {navMatches.length === 0 ? (
              <Empty>No matching pages</Empty>
            ) : (
              <>
                {navMatches.map((c) => (
                  <Row
                    key={c.to}
                    icon={<c.icon className="w-3.5 h-3.5" strokeWidth={1.8} />}
                    label={c.label}
                    // Two products name some things alike, so the group and
                    // section say which Orders or which Vendors this is —
                    // and where the other product has its own version of
                    // the same idea, this says so rather than letting
                    // someone find out next week.
                    sub={
                      c.counterpart
                        ? `${c.context} · also in ${c.counterpart.label}`
                        : c.context
                    }
                    onClick={() => go(c.to)}
                  />
                ))}
                {navOverflow > 0 && (
                  <Empty>
                    {navOverflow} more page{navOverflow === 1 ? '' : 's'} match — keep typing
                  </Empty>
                )}
              </>
            )}
          </Group>

          {q.length >= 2 && (
            <>
              <ResultGroup
                title="Leads"
                icon={<Users className="w-3.5 h-3.5" />}
                loading={leadsQ.isLoading}
                hits={leadHits}
                onGo={go}
              />
              <ResultGroup
                title="Contacts"
                icon={<UserSquare2 className="w-3.5 h-3.5" />}
                loading={contactsQ.isLoading}
                hits={contactHits}
                onGo={go}
              />
              <ResultGroup
                title="Deals"
                icon={<Briefcase className="w-3.5 h-3.5" />}
                loading={dealsQ.isLoading}
                hits={dealHits}
                onGo={go}
              />
            </>
          )}
        </div>

        <div className="flex items-center gap-2 px-4 py-2 border-t border-thin border-border-subtle text-[11px] text-text-muted">
          <CornerDownLeft className="w-3 h-3" /> open ·{' '}
          <kbd className="border-thin border-border-medium rounded px-1">⌘K</kbd> toggle
        </div>
      </div>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-2 pb-1">
      <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-text-muted">{title}</p>
      {children}
    </div>
  );
}

function ResultGroup({
  title,
  icon,
  loading,
  hits,
  onGo,
}: {
  title: string;
  icon: React.ReactNode;
  loading: boolean;
  hits: Hit[];
  onGo: (to: string) => void;
}) {
  if (!loading && hits.length === 0) return null;
  return (
    <Group title={title}>
      {loading ? (
        <Empty>Searching…</Empty>
      ) : (
        hits.map((h) => <Row key={h.id} icon={icon} label={h.label} sub={h.sub} onClick={() => onGo(h.to)} />)
      )}
    </Group>
  );
}

function Row({
  icon,
  label,
  sub,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  sub?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-sm text-left hover:bg-glass-2 transition-colors"
    >
      <span className="text-text-muted shrink-0">{icon}</span>
      <span className="flex-1 min-w-0">
        <span className="text-sm text-text-primary">{label}</span>
        {sub && <span className="ml-2 text-xs text-text-muted">{sub}</span>}
      </span>
    </button>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="px-3 py-2 text-xs text-text-muted">{children}</p>;
}
