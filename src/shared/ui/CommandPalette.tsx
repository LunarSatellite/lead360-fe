import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Users, UserSquare2, Briefcase, ArrowRight, CornerDownLeft } from 'lucide-react';
import { ROUTES } from '@/app/router/route-paths';
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
  keywords?: string;
}

const NAV_COMMANDS: NavCommand[] = [
  { label: 'Leads', to: ROUTES.dashboard.crmLeads },
  { label: 'Contacts', to: ROUTES.dashboard.crmContacts },
  { label: 'Deals', to: ROUTES.dashboard.crmDeals },
  { label: 'Pipelines', to: ROUTES.dashboard.crmPipelines, keywords: 'stages kanban' },
  { label: 'Quotes', to: ROUTES.dashboard.crmQuotes },
  { label: 'Proposals', to: ROUTES.dashboard.crmProposals },
  { label: 'Invoices', to: ROUTES.dashboard.crmInvoices, keywords: 'billing' },
  { label: 'Subscriptions', to: ROUTES.dashboard.crmSubscriptions, keywords: 'recurring' },
  { label: 'Renewals', to: ROUTES.dashboard.crmRenewals },
  { label: 'Contracts', to: ROUTES.dashboard.crmContracts, keywords: 'clm agreement' },
  { label: 'Price Books', to: ROUTES.dashboard.crmPriceBooks, keywords: 'cpq pricing' },
  { label: 'Bundles', to: ROUTES.dashboard.crmProductBundles, keywords: 'cpq bundle kit package' },
  { label: 'Tasks', to: ROUTES.dashboard.crmTasks },
  { label: 'Meetings', to: ROUTES.dashboard.crmMeetings },
  { label: 'Nurture', to: ROUTES.dashboard.crmNurture },
  { label: 'Campaigns', to: ROUTES.dashboard.crmCampaigns },
  { label: 'Accounts', to: ROUTES.dashboard.crmAccounts },
  { label: 'Organizations', to: ROUTES.dashboard.crmOrganizations },
  { label: 'Support', to: ROUTES.dashboard.crmSupport, keywords: 'cases tickets' },
  { label: 'Analytics', to: ROUTES.dashboard.crmAnalytics, keywords: 'reports' },
  { label: 'Audit Log', to: ROUTES.dashboard.crmAuditLog, keywords: 'history changes who changed' },
  { label: 'Feature Settings', to: ROUTES.dashboard.crmFeatureSettings, keywords: 'toggles flags pipelines agent enable setup' },
  { label: 'Team', to: ROUTES.dashboard.team, keywords: 'users members' },
  { label: 'Settings', to: ROUTES.dashboard.settings },
].filter((c) => !!c.to);

interface Hit { id: string; label: string; sub?: string; to: string }

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
    queryKey: ['cmdk', 'leads', q], enabled,
    queryFn: () => crmApi.getLeads({ search: q, pageSize: 5 }),
  });
  const contactsQ = useQuery({
    queryKey: ['cmdk', 'contacts', q], enabled,
    queryFn: () => crmApi.getContacts({ search: q, pageSize: 5 }),
  });
  const dealsQ = useQuery({
    queryKey: ['cmdk', 'deals', q], enabled,
    queryFn: () => crmApi.getDeals({ search: q, pageSize: 5 }),
  });

  const navMatches = useMemo(() => {
    if (!q) return NAV_COMMANDS;
    const lc = q.toLowerCase();
    return NAV_COMMANDS.filter(
      (c) => c.label.toLowerCase().includes(lc) || (c.keywords ?? '').includes(lc),
    );
  }, [q]);

  const leadHits: Hit[] = (((leadsQ.data as any)?.items ?? []) as any[]).map((l) => ({
    id: l.id, label: l.customerName || l.channelHandle || 'Lead', sub: l.customerEmail || l.customerPhone || undefined,
    to: ROUTES.dashboard.crmLeadDetail(l.id),
  }));
  const contactHits: Hit[] = (((contactsQ.data as any)?.items ?? []) as any[]).map((c) => ({
    id: c.id, label: c.fullName, sub: c.email || c.phone || undefined,
    to: ROUTES.dashboard.crmContactDetail(c.id),
  }));
  const dealHits: Hit[] = (((dealsQ.data as any)?.items ?? []) as any[]).map((d) => ({
    id: d.id, label: d.name, sub: d.accountName || d.stageName || undefined,
    to: ROUTES.dashboard.crmDealDetail(d.id),
  }));

  const go = (to: string) => { setOpen(false); navigate(to); };

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
              placeholder="Search leads, contacts, deals — or jump to a page…"
              className="flex-1 min-w-0 h-full bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus-visible:shadow-none"
            />
            <kbd className="shrink-0 text-[10px] text-text-muted border-thin border-border-medium rounded px-1.5 py-0.5">esc</kbd>
          </div>
        </div>

        <div className="max-h-[55vh] overflow-y-auto py-2">
          <Group title="Go to">
            {navMatches.length === 0 ? (
              <Empty>No matching pages</Empty>
            ) : (
              navMatches.map((c) => (
                <Row key={c.to} icon={<ArrowRight className="w-3.5 h-3.5" />} label={c.label} onClick={() => go(c.to)} />
              ))
            )}
          </Group>

          {q.length >= 2 && (
            <>
              <ResultGroup title="Leads" icon={<Users className="w-3.5 h-3.5" />} loading={leadsQ.isLoading} hits={leadHits} onGo={go} />
              <ResultGroup title="Contacts" icon={<UserSquare2 className="w-3.5 h-3.5" />} loading={contactsQ.isLoading} hits={contactHits} onGo={go} />
              <ResultGroup title="Deals" icon={<Briefcase className="w-3.5 h-3.5" />} loading={dealsQ.isLoading} hits={dealHits} onGo={go} />
            </>
          )}
        </div>

        <div className="flex items-center gap-2 px-4 py-2 border-t border-thin border-border-subtle text-[11px] text-text-muted">
          <CornerDownLeft className="w-3 h-3" /> open · <kbd className="border-thin border-border-medium rounded px-1">⌘K</kbd> toggle
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
  title, icon, loading, hits, onGo,
}: { title: string; icon: React.ReactNode; loading: boolean; hits: Hit[]; onGo: (to: string) => void }) {
  if (!loading && hits.length === 0) return null;
  return (
    <Group title={title}>
      {loading ? (
        <Empty>Searching…</Empty>
      ) : (
        hits.map((h) => (
          <Row key={h.id} icon={icon} label={h.label} sub={h.sub} onClick={() => onGo(h.to)} />
        ))
      )}
    </Group>
  );
}

function Row({
  icon, label, sub, onClick,
}: { icon: React.ReactNode; label: string; sub?: string; onClick: () => void }) {
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
