import { useState, useRef, useEffect, type ReactNode } from 'react';
import { useTokenAutoRefresh } from '@/features/auth/hooks/useTokenAutoRefresh';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutGrid,
  Target,
  MessageSquare,
  GitBranch,
  Phone,
  BarChart3,
  Settings,
  Zap,
  LogOut,
  User,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Terminal,
  Bot,
  Plug,
  Package,
  Boxes,
  Rocket,
  Menu,
  X,
  Users,
  Workflow,
  Megaphone,
  UserCheck,
  Briefcase,
  Building2,
  Building,
  TrendingUp,
  FlaskConical,
  LifeBuoy,
  CheckSquare,
  FileText,
  ClipboardList,
  Receipt,
  RefreshCw,
  CalendarCheck,
  CalendarClock,
  BookOpen,
  FileSignature,
  Search,
  History,
  // SlidersHorizontal,
  Star,
  Clock,
  Facebook,
  Newspaper,
  ListChecks,
  Globe,
  SlidersHorizontal,
  RotateCw,
  Wrench,
  UserPlus,
  LayoutDashboard,
  Calendar,
  Shuffle,
  ShoppingCart,
  PackageCheck,
  CreditCard,
  Truck,
  MapPin,
  Percent,
  Crosshair,
  DollarSign,
  Undo2,
  FileBarChart,
  LayoutPanelTop,
} from 'lucide-react';
import { ROUTES } from '@/app/router/route-paths';
import { useLogout, useProfile } from '@/features/auth/api/auth.queries';
import { usePendingDedupCount } from '@/features/crm/api/crm.queries';
import { NotificationBell } from '@/features/crm/components/NotificationBell';
import { CommandPalette, openCommandPalette } from '@/shared/ui/CommandPalette';
import { CopilotPanel, openCopilot } from '@/features/crm/components/CopilotPanel';
import { useLeadAlerts } from '@/features/crm/hooks/useLeadAlerts';

// ═══════════════════════════════════════════════════════════════════════════
// CHAT-FIRST NAVIGATION (new — primary rail shown to all users)
// The 6 icons the non-technical user needs. Everything in the previous
// buildNav/configureNav arrays is still reachable via direct URLs and still
// rendered inside the app — we just no longer list all 11 items in the rail.
// ═══════════════════════════════════════════════════════════════════════════
const primaryNav = [
  { label: 'Chat',         href: '/dashboard/chat',                   icon: MessageSquare },
  { label: 'Overview',     href: '/dashboard/home',                   icon: LayoutGrid },
  { label: 'Bot flow',     href: ROUTES.dashboard.flows,              icon: GitBranch, badge: 'AI' },
  { label: 'API Pipeline', href: ROUTES.dashboard.apiConnection,      icon: Plug },
  // { label: 'Bot Settings', href: ROUTES.dashboard.botSettings,        icon: Settings },
  { label: 'Experiments',  href: ROUTES.dashboard.flowExperiments,    icon: FlaskConical },
  { label: 'Agents',       href: ROUTES.dashboard.agents,             icon: Bot },
  { label: 'Test preview', href: ROUTES.dashboard.testChannel,        icon: Terminal },
  { label: 'Channels',     href: ROUTES.dashboard.channels,           icon: Phone },
  { label: 'Business Catalog', href: ROUTES.dashboard.businessCatalog, icon: Boxes },
];

const settingsNav = [
  { label: 'Team',     href: ROUTES.dashboard.team,     icon: Users },
  { label: 'Settings', href: '/dashboard/settings',     icon: Settings },
];

// CRM nav, split into sub-groups so the 53-item list has scannable structure
// and each group can collapse independently.
const crmNavGroups = [
  {
    key: 'sales',
    label: 'Sales',
    items: [
      { label: 'Leads',      href: ROUTES.dashboard.crmLeads,      icon: Users },
      { label: 'Deals',      href: ROUTES.dashboard.crmDealsHub,   icon: Briefcase },
      { label: 'Quotes',     href: ROUTES.dashboard.crmQuotes,     icon: FileText },
      { label: 'Proposals',  href: ROUTES.dashboard.crmProposals,  icon: ClipboardList },
      { label: 'Contracts',  href: ROUTES.dashboard.crmContracts,  icon: FileSignature },
      { label: 'Renewals',   href: ROUTES.dashboard.crmRenewals,   icon: CalendarClock },
      { label: 'Price Books', href: ROUTES.dashboard.crmPriceBooks, icon: BookOpen },
      { label: 'Competitors', href: ROUTES.dashboard.crmCompetitors, icon: Crosshair },
    ],
  },
  {
    key: 'accounts',
    label: 'Accounts',
    items: [
      { label: 'Accounts',      href: ROUTES.dashboard.crmAccounts,      icon: Building },
      { label: 'Contacts',      href: ROUTES.dashboard.crmContacts,      icon: UserCheck },
      { label: 'Organizations', href: ROUTES.dashboard.crmOrganizations, icon: Building2 },
      { label: 'Territories',   href: ROUTES.dashboard.crmTerritories,   icon: MapPin },
      { label: 'Assignment Rotation', href: ROUTES.dashboard.crmAssignmentRotation, icon: Shuffle },
    ],
  },
  {
    key: 'marketing',
    label: 'Marketing',
    items: [
      { label: 'Campaigns',          href: ROUTES.dashboard.crmCampaigns,        icon: Megaphone },
      { label: 'Workflow Campaigns', href: '/dashboard/crm/workflow-campaigns', icon: Target },
      { label: 'Announcements',      href: ROUTES.dashboard.crmAnnouncements,   icon: Newspaper },
      { label: 'Nurture',            href: ROUTES.dashboard.crmNurture,         icon: Workflow },
      { label: 'Meta Ads',           href: '/dashboard/crm/meta-ads',           icon: Facebook },
      { label: 'Event Tracking',     href: ROUTES.dashboard.crmEventIngestion,  icon: Globe },
    ],
  },
  {
    key: 'operations',
    label: 'Operations',
    items: [
      { label: 'Orders',           href: ROUTES.dashboard.crmOrders,         icon: Package },
      { label: 'Deliveries',       href: ROUTES.dashboard.crmDeliveries,     icon: Truck },
      { label: 'Returns',          href: ROUTES.dashboard.crmReturns,        icon: RotateCw },
      { label: 'Work Orders',      href: ROUTES.dashboard.crmWorkOrders,     icon: Wrench },
      { label: 'Vendors',          href: ROUTES.dashboard.crmVendors,        icon: Truck },
      { label: 'Purchase Orders',  href: ROUTES.dashboard.crmPurchaseOrders, icon: ShoppingCart },
      { label: 'Goods Receipts',   href: ROUTES.dashboard.crmGoodsReceipts,  icon: PackageCheck },
      { label: 'Inventory',        href: ROUTES.dashboard.crmInventory,      icon: Package },
      { label: 'Bundles',          href: ROUTES.dashboard.crmProductBundles, icon: Package },
      { label: 'Process Workflows', href: ROUTES.dashboard.crmProcessTasks,  icon: ListChecks },
      { label: 'Workflows',        href: ROUTES.dashboard.crmWorkflows,      icon: Zap },
    ],
  },
  {
    key: 'finance',
    label: 'Finance',
    items: [
      { label: 'Invoices',          href: ROUTES.dashboard.crmInvoices,         icon: Receipt },
      { label: 'Credit Notes',      href: ROUTES.dashboard.crmCreditNotes,      icon: Undo2 },
      { label: 'Supplier Invoices', href: ROUTES.dashboard.crmSupplierInvoices, icon: CreditCard },
      { label: 'Payment Terms',     href: ROUTES.dashboard.crmPaymentTerms,     icon: Calendar },
      { label: 'Tax Rules',         href: ROUTES.dashboard.crmTaxRules,         icon: Percent },
      { label: 'Subscriptions',     href: ROUTES.dashboard.crmSubscriptions,    icon: RefreshCw },
      { label: 'Commissions',       href: ROUTES.dashboard.crmCommissions,      icon: DollarSign },
    ],
  },
  {
    key: 'support',
    label: 'Support & Success',
    items: [
      { label: 'Support',        href: ROUTES.dashboard.crmSupport,            icon: LifeBuoy },
      { label: 'NPS',            href: ROUTES.dashboard.crmNps,                icon: Star },
      { label: 'Knowledge Base', href: ROUTES.dashboard.crmKnowledgeBase,      icon: BookOpen },
      { label: 'Onboarding',     href: ROUTES.dashboard.crmCustomerOnboarding, icon: UserPlus },
      { label: 'Meetings',       href: ROUTES.dashboard.crmMeetings,           icon: CalendarCheck },
      { label: 'Tasks',          href: ROUTES.dashboard.crmTasks,              icon: CheckSquare },
      { label: 'Time Tracking',  href: ROUTES.dashboard.crmTimeTracking,       icon: Clock },
      { label: 'Time Periods',   href: ROUTES.dashboard.crmTimePeriods,        icon: Calendar },
    ],
  },
  {
    key: 'insights',
    label: 'Insights & Admin',
    items: [
      { label: 'Analytics',        href: ROUTES.dashboard.crmAnalytics,      icon: TrendingUp },
      { label: 'Reports',          href: ROUTES.dashboard.crmReports,        icon: FileBarChart },
      { label: 'Dashboards',       href: ROUTES.dashboard.crmDashboards,     icon: LayoutPanelTop },
      { label: 'Ops Dashboard',    href: ROUTES.dashboard.crmOpsDashboard,   icon: LayoutDashboard },
      { label: 'Scoring Rules',    href: ROUTES.dashboard.crmScoringRules,   icon: TrendingUp },
      { label: 'Custom Fields',    href: ROUTES.dashboard.crmCustomFields,   icon: SlidersHorizontal },
      { label: 'Feature Settings', href: ROUTES.dashboard.crmFeatureSettings, icon: SlidersHorizontal },
      { label: 'Audit Log',        href: ROUTES.dashboard.crmAuditLog,       icon: History },
    ],
  },
];

// Flattened view — used by the mobile "More" sheet and icon-only rail mode,
// where sub-group headers don't apply.
const crmNav = crmNavGroups.flatMap((g) => g.items);

// ─── Mobile bottom tabs — 4 primary + More for the rest ───
const primaryMobileTabs = [
  { label: 'Chat',     href: '/dashboard/chat',            icon: MessageSquare },
  { label: 'Home',     href: '/dashboard/home',            icon: LayoutGrid },
  { label: 'Flow',     href: ROUTES.dashboard.flows,       icon: GitBranch },
  { label: 'Test',     href: ROUTES.dashboard.testChannel, icon: Terminal },
];

// ─── Mobile "More" sheet — reaches every legacy page so nothing is lost ───
// NOTE: Setup Wizard + Setup tabs are commented from here because their
// routes are currently commented out in routes.tsx. Re-add them here if you
// uncomment the routes.
const moreNav_build = [
  { label: 'Conversation Map', href: ROUTES.dashboard.flows, icon: GitBranch, badge: 'AI' },
  { label: 'Test Channel',     href: ROUTES.dashboard.testChannel, icon: Terminal },
  // { label: 'Setup Wizard',  href: ROUTES.dashboard.onboarding, icon: Rocket },
];

const moreNav_configure = [
  // { label: 'Setup',         href: ROUTES.dashboard.setup, icon: LayoutGrid },
  { label: 'Intents',       href: ROUTES.dashboard.intents, icon: Target },
  { label: 'Agents',        href: ROUTES.dashboard.agents, icon: Bot },
  { label: 'API Pipeline',  href: ROUTES.dashboard.apiConnection, icon: Plug },
  { label: 'Catalog',       href: ROUTES.dashboard.catalog, icon: Package },
  { label: 'Business Catalog', href: ROUTES.dashboard.businessCatalog, icon: Boxes },
  { label: 'Channels',      href: ROUTES.dashboard.channels, icon: Phone },
  { label: 'Conversations', href: ROUTES.dashboard.conversations, icon: MessageSquare },
  { label: 'Analytics',     href: ROUTES.dashboard.analytics, icon: BarChart3 },
];

// ═══════════════════════════════════════════════════════════════════════════
// OLD NAVIGATION — kept as reference, pages below are still reachable by URL.
// When we're confident the chat-first rail works for everyone, delete the
// commented blocks below and the unused icon imports at the top of the file.
// ═══════════════════════════════════════════════════════════════════════════
// const buildNav = [
//   { label: 'Conversation Map', href: ROUTES.dashboard.flows, icon: GitBranch, badge: 'AI' },
//   { label: 'Test Channel', href: ROUTES.dashboard.testChannel, icon: Terminal },
//   { label: 'Setup Wizard', href: ROUTES.dashboard.onboarding, icon: Rocket },
// ];
//
// const configureNav = [
//   { label: 'Setup', href: ROUTES.dashboard.setup, icon: LayoutGrid },
//   { label: 'Intents', href: ROUTES.dashboard.intents, icon: Target },
//   { label: 'API Pipeline', href: ROUTES.dashboard.apiConnection, icon: Plug },
//   { label: 'Catalog', href: ROUTES.dashboard.catalog, icon: Package },
//   { label: 'Channels', href: ROUTES.dashboard.channels, icon: Phone },
//   { label: 'Conversations', href: ROUTES.dashboard.conversations, icon: MessageSquare },
//   { label: 'Analytics', href: ROUTES.dashboard.analytics, icon: BarChart3 },
// ];
//
// const OLD_primaryMobileTabs = [
//   { label: 'Setup', href: ROUTES.dashboard.setup, icon: LayoutGrid },
//   { label: 'Chats', href: ROUTES.dashboard.conversations, icon: MessageSquare },
//   { label: 'Test', href: ROUTES.dashboard.testChannel, icon: Terminal },
//   { label: 'Analytics', href: ROUTES.dashboard.analytics, icon: BarChart3 },
// ];

const PRIMARY_HREFS: Set<string> = new Set(primaryMobileTabs.map((t) => t.href));

export function DashboardLayout() {
  useTokenAutoRefresh();
  useLeadAlerts();
  const dedupCount = usePendingDedupCount();
  const location = useLocation();
  const logout = useLogout();
  const { data: profile } = useProfile();
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [moreSheetOpen, setMoreSheetOpen] = useState(false);
  const [openSections, setOpenSections] = useState({ yourBot: true, crm: true, system: true });
  const [openCrmGroups, setOpenCrmGroups] = useState(() =>
    Object.fromEntries(crmNavGroups.map((g) => [g.key, false]))
  );

  const toggleSection = (key: keyof typeof openSections) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  const toggleCrmGroup = (key: string) =>
    setOpenCrmGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close "More" sheet on route change
  useEffect(() => {
    setMoreSheetOpen(false);
  }, [location.pathname]);

  // Lock body scroll when "More" sheet is open
  useEffect(() => {
    if (moreSheetOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [moreSheetOpen]);

  const profileData = profile as any;
  const initials = profileData
    ? `${(profileData.firstName?.[0] || '').toUpperCase()}${(profileData.lastName?.[0] || '').toUpperCase()}`
    : 'U';
  const displayName = profileData
    ? `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim()
    : 'User';
  const displayEmail = profileData?.email || '';
  const displayRole = profileData?.role || 'Admin';

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/chat')) return 'Chat';
    if (path.includes('/home')) return 'Overview';
    if (path.includes('/onboarding')) return 'Setup Wizard';
    if (path.includes('/flows')) return 'AI Flow Builder';
    if (path.includes('/test-channel')) return 'Simulator';
    if (path.includes('/setup')) return 'Setup';
    if (path.includes('/api-connection')) return 'API Pipeline';
    if (path.includes('/business-catalog')) return 'Business Catalog';
    if (path.includes('/catalog')) return 'Catalog';
    if (path.includes('/intents')) return 'Intents';
    if (path.includes('/channels')) return 'Channels';
    if (path.includes('/conversations')) return 'Conversations';
    if (path.includes('/analytics')) return 'Analytics';
    if (path.includes('/compliance')) return 'Compliance';
    if (path.includes('/settings')) return 'Settings';
    if (path.includes('/crm/dedup')) return 'Duplicate Contacts';
    if (path.includes('/crm/contacts')) return 'Contacts';
    if (path.includes('/crm/leads')) return 'Leads';
    if (path.includes('/crm/deals-hub')) return 'Deals';
    if (path.includes('/crm/deals')) return 'Deals';
    if (path.includes('/crm/organizations')) return 'Organizations';
    if (path.includes('/crm/accounts')) return 'Accounts';
    if (path.includes('/crm/nurture')) return 'Nurture Sequences';
    if (path.includes('/crm/campaigns')) return 'Campaigns';
    if (path.includes('/crm/analytics')) return 'CRM Analytics';
    if (path.includes('/crm/support')) return 'Support Cases';
    if (path.includes('/crm/tasks')) return 'Tasks';
    if (path.includes('/crm/quotes')) return 'Quotes';
    if (path.includes('/crm/proposals')) return 'Proposals';
    if (path.includes('/crm/invoices')) return 'Invoices';
    if (path.includes('/crm/subscriptions')) return 'Subscriptions';
    if (path.includes('/crm/orders')) return 'Orders';
    if (path.includes('/crm/deliveries')) return 'Deliveries';
    if (path.includes('/crm/meetings')) return 'Meetings';
    if (path.includes('/crm/nps')) return 'NPS Surveys';
    if (path.includes('/crm/time-tracking')) return 'Time Tracking';
    if (path.includes('/crm/custom-fields')) return 'Custom Fields';
    if (path.includes('/crm/workflows')) return 'Workflows';
    if (path.includes('/flows/experiments')) return 'A/B Experiments';
    return 'Dashboard';
  };

  const getPageIcon = () => {
    const path = location.pathname;
    if (path.includes('/chat')) return MessageSquare;
    if (path.includes('/home')) return LayoutGrid;
    if (path.includes('/flows')) return GitBranch;
    if (path.includes('/test-channel')) return Terminal;
    if (path.includes('/onboarding')) return Rocket;
    if (path.includes('/setup')) return LayoutGrid;
    if (path.includes('/intents')) return Target;
    if (path.includes('/api-connection')) return Plug;
    if (path.includes('/business-catalog')) return Boxes;
    if (path.includes('/catalog')) return Package;
    if (path.includes('/channels')) return Phone;
    if (path.includes('/conversations')) return MessageSquare;
    if (path.includes('/analytics')) return BarChart3;
    if (path.includes('/settings')) return Settings;
    if (path.includes('/crm/contacts')) return UserCheck;
    if (path.includes('/crm/leads')) return Users;
    if (path.includes('/crm/deals-hub')) return Briefcase;
    if (path.includes('/crm/deals')) return Briefcase;
    if (path.includes('/crm/organizations')) return Building2;
    if (path.includes('/crm/accounts')) return Building;
    if (path.includes('/crm/nurture')) return Workflow;
    if (path.includes('/crm/campaigns')) return Megaphone;
    if (path.includes('/crm/analytics')) return TrendingUp;
    if (path.includes('/flows/experiments')) return FlaskConical;
    return LayoutGrid;
  };

  const PageIcon = getPageIcon();

  const renderNavItem = (item: { label: string; href: string; icon: any; badge?: string; badgeCount?: number; end?: boolean }) => {
    const isActive = item.end
      ? location.pathname === item.href
      : location.pathname === item.href || location.pathname.startsWith(item.href + '/');
    const hasCount = typeof item.badgeCount === 'number' && item.badgeCount > 0;
    return (
      <NavLink
        key={item.href}
        to={item.href}
        title={item.label}
        className={`sidebar-nav-item group relative flex items-center gap-3 rounded-xl transition-all duration-200 ${
          isActive
            ? 'bg-gradient-to-r from-[rgba(0,217,138,0.18)] via-[rgba(0,217,138,0.06)] to-transparent text-text-primary font-semibold'
            : 'text-text-muted hover:text-text-secondary hover:bg-glass-1'
        }`}
        style={{
          padding: showExpanded ? '8px 12px' : '8px',
          justifyContent: showExpanded ? 'flex-start' : 'center',
        }}
      >
        {/* Active accent bar */}
        {isActive && (
          <div className="absolute left-0 top-1 bottom-1 w-[2.5px] rounded-r-full bg-gradient-to-b from-brand-light to-brand" />
        )}
        {/* Icon + collapsed dot */}
        <div className="relative shrink-0">
          <item.icon
            className={`w-[18px] h-[18px] transition-colors ${isActive ? 'text-brand' : ''}`}
            strokeWidth={1.5}
          />
          {hasCount && !showExpanded && (
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-warning flex items-center justify-center text-[8px] font-black text-bg leading-none">
              {item.badgeCount! > 9 ? '9+' : item.badgeCount}
            </span>
          )}
        </div>
        {showExpanded && (
          <>
            <span className="text-xs whitespace-nowrap overflow-hidden">{item.label}</span>
            {item.badge && (
              <span className="ml-auto px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-violet-soft text-violet-light">
                {item.badge}
              </span>
            )}
            {hasCount && (
              <span className="ml-auto px-1.5 py-0.5 rounded-full text-[9px] font-black bg-warning/20 text-warning border border-warning/30">
                {item.badgeCount}
              </span>
            )}
          </>
        )}
      </NavLink>
    );
  };

  // On desktop, expansion follows hover. Mobile hides the sidebar entirely.
  const showExpanded = sidebarExpanded;

  return (
    <div className="flex h-screen bg-bg overflow-hidden">
      {/* ═══ SIDEBAR (desktop only) ═══ */}
      <aside
        className="sidebar-shell hidden lg:flex flex-col bg-[#060908] border-r border-border-subtle flex-shrink-0"
        style={{
          width: showExpanded ? 240 : 64,
          transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Logo + toggle */}
        {showExpanded ? (
          <div className="flex items-center gap-3 border-b border-border-subtle overflow-hidden" style={{ padding: '14px 12px' }}>
            <div className="w-9 h-9 rounded-xl bg-[#050808] flex items-center justify-center p-0.5 shrink-0">
              <img src="/Lead360logo/1.png" alt="Lead360" className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-extrabold text-text-primary tracking-tight leading-tight">Lead360</div>
              <div className="text-2xs text-text-muted">CRM & automation</div>
            </div>
            <button
              type="button"
              onClick={() => { setSidebarExpanded(v => !v); setMenuOpen(false); }}
              aria-label="Collapse sidebar"
              className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-glass-1 transition-all shrink-0"
            >
              <ChevronLeft className="w-4 h-4" strokeWidth={2} />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center border-b border-border-subtle" style={{ padding: '14px 0' }}>
            <button
              type="button"
              onClick={() => { setSidebarExpanded(v => !v); setMenuOpen(false); }}
              aria-label="Expand sidebar"
              className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-glass-1 transition-all"
            >
              <ChevronRight className="w-4 h-4" strokeWidth={2} />
            </button>
          </div>
        )}

        {/* AI status */}
        <div className="overflow-hidden" style={{ padding: showExpanded ? '8px 8px 0' : '8px 8px 0' }}>
          <div
            className="rounded-lg border border-border-glow bg-brand-soft flex items-center gap-1.5 overflow-hidden"
            style={{
              padding: showExpanded ? '6px 10px' : '6px',
              justifyContent: showExpanded ? 'flex-start' : 'center',
            }}
          >
            <div className="w-[5px] h-[5px] rounded-full bg-brand shrink-0 animate-pulse" />
            {showExpanded ? (
              <>
                {/* <span className="text-2xs font-semibold text-brand whitespace-nowrap">Claude 4 Sonnet</span> */}
                <span className="ml-auto text-2xs text-text-muted">online</span>
              </>
            ) : null}
          </div>
        </div>

        {/* Navigation */}
        <nav
          className="flex-1 overflow-y-auto overflow-x-hidden py-2"
          style={{ padding: showExpanded ? '8px 8px' : '8px 6px' }}
        >
          {/* ── Primary (chat-first rail) ── */}
          {showExpanded ? (
            <button
              type="button"
              onClick={() => toggleSection('yourBot')}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-glass-1 border-thin border-border-subtle mb-1.5 mt-1 hover:bg-glass-2 transition-colors"
            >
              <div className="w-5 h-5 rounded-lg bg-brand-soft flex items-center justify-center shrink-0">
                <Bot className="w-[11px] h-[11px] text-brand" strokeWidth={2} />
              </div>
              <span className="text-[9px] font-bold text-text-secondary uppercase tracking-[1.5px] flex-1 text-left">Your Bot</span>
              <ChevronDown
                className={`w-3 h-3 text-text-muted transition-transform duration-200 ${openSections.yourBot ? '' : '-rotate-90'}`}
                strokeWidth={2}
              />
            </button>
          ) : (
            <div className="w-6 h-px bg-border-subtle mx-auto mb-2 mt-1" />
          )}
          {(!showExpanded || openSections.yourBot) && (
            <div className="flex flex-col gap-0.5">{primaryNav.map(renderNavItem)}</div>
          )}

          {/* ── OLD: Build / Configure sections (commented for now) ─────────
          {showExpanded && (
            <div className="text-[9px] font-bold text-text-muted uppercase tracking-[1.5px] px-3 pt-2 pb-1.5">
              Build
            </div>
          )}
          {!showExpanded && <div className="w-6 h-px bg-border-subtle mx-auto mb-2 mt-1" />}
          <div className="flex flex-col gap-0.5">{buildNav.map(renderNavItem)}</div>

          {showExpanded && (
            <div className="text-[9px] font-bold text-text-muted uppercase tracking-[1.5px] px-3 pt-4 pb-1.5">
              Configure
            </div>
          )}
          {!showExpanded && <div className="w-6 h-px bg-border-subtle mx-auto my-2" />}
          <div className="flex flex-col gap-0.5">{configureNav.map(renderNavItem)}</div>
          ─────────────────────────────────────────────────────────────── */}

          {/* ── CRM ── */}
          {showExpanded ? (
            <button
              type="button"
              onClick={() => toggleSection('crm')}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-glass-1 border-thin border-border-subtle mb-1.5 mt-3 hover:bg-glass-2 transition-colors"
            >
              <div className="w-5 h-5 rounded-lg bg-brand-soft flex items-center justify-center shrink-0">
                <Users className="w-[11px] h-[11px] text-brand" strokeWidth={2} />
              </div>
              <span className="text-[9px] font-bold text-text-secondary uppercase tracking-[1.5px] flex-1 text-left">CRM</span>
              <ChevronDown
                className={`w-3 h-3 text-text-muted transition-transform duration-200 ${openSections.crm ? '' : '-rotate-90'}`}
                strokeWidth={2}
              />
            </button>
          ) : (
            <div className="w-6 h-px bg-border-subtle mx-auto my-2" />
          )}
          {(!showExpanded || openSections.crm) && (
            <div className="flex flex-col">
              {crmNavGroups.map((group) => (
                <div key={group.key}>
                  {showExpanded ? (
                    <button
                      type="button"
                      onClick={() => toggleCrmGroup(group.key)}
                      className={`w-full flex items-center gap-1.5 px-3 py-2.5 transition-colors ${
                        openCrmGroups[group.key]
                          ? 'rounded-lg border-thin bg-brand-soft border-border-glow my-0.5'
                          : 'border-thin border-transparent hover:bg-glass-1'
                      }`}
                    >
                      <span className="text-[10px] font-bold text-text-secondary uppercase tracking-[1.5px] flex-1 text-left">
                        {group.label}
                      </span>
                      <ChevronRight
                        className={`w-3 h-3 text-text-muted transition-transform duration-200 ${openCrmGroups[group.key] ? 'rotate-90' : ''}`}
                        strokeWidth={2}
                      />
                    </button>
                  ) : null}
                  {(!showExpanded || openCrmGroups[group.key]) && (
                    <div className="flex flex-col gap-0.5 py-1">
                      {group.items.map((item) =>
                        item.label === 'Contacts'
                          ? renderNavItem({ ...item, badgeCount: dedupCount })
                          : renderNavItem(item)
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── System / Settings ── */}
          {showExpanded ? (
            <button
              type="button"
              onClick={() => toggleSection('system')}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-glass-1 border-thin border-border-subtle mb-1.5 mt-3 hover:bg-glass-2 transition-colors"
            >
              <div className="w-5 h-5 rounded-lg bg-brand-soft flex items-center justify-center shrink-0">
                <Settings className="w-[11px] h-[11px] text-brand" strokeWidth={2} />
              </div>
              <span className="text-[9px] font-bold text-text-secondary uppercase tracking-[1.5px] flex-1 text-left">System</span>
              <ChevronDown
                className={`w-3 h-3 text-text-muted transition-transform duration-200 ${openSections.system ? '' : '-rotate-90'}`}
                strokeWidth={2}
              />
            </button>
          ) : (
            <div className="w-6 h-px bg-border-subtle mx-auto my-2" />
          )}
          {(!showExpanded || openSections.system) && (
            <div className="flex flex-col gap-0.5">{settingsNav.map(renderNavItem)}</div>
          )}
        </nav>

        {/* User */}
        <div
          className="border-t border-border-subtle"
          ref={menuRef}
          style={{ padding: showExpanded ? '8px' : '8px 6px' }}
        >
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-full flex items-center gap-2.5 rounded-xl bg-bg-elevated border border-border-subtle hover:border-border-medium transition-all overflow-hidden"
              style={{
                padding: showExpanded ? '8px 10px' : '8px',
                justifyContent: showExpanded ? 'flex-start' : 'center',
              }}
            >
              <div className="w-8 h-8 rounded-lg bg-[#132A21] flex items-center justify-center text-2xs font-extrabold text-[#8FAEA0] shrink-0">
                {initials}
              </div>
              {showExpanded && (
                <>
                  <div className="flex-1 text-left min-w-0">
                    <div className="text-2xs font-bold text-text-primary truncate">{displayName}</div>
                    <div className="text-[9px] text-text-muted truncate">{displayRole}</div>
                  </div>
                  <ChevronDown
                    className={`w-3 h-3 text-text-muted shrink-0 transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`}
                  />
                </>
              )}
            </button>

            {menuOpen && showExpanded && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-bg-card border border-border-subtle rounded-xl overflow-hidden z-50 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
                <div className="px-4 py-3 border-b border-border-subtle">
                  <div className="text-sm font-bold text-text-primary">{displayName}</div>
                  <div className="text-xs text-text-muted mt-0.5">{displayEmail}</div>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      navigate('/dashboard/settings');
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-all"
                  >
                    <User className="w-4 h-4" strokeWidth={1.6} /> Account settings
                  </button>
                </div>
                <div className="border-t border-border-subtle py-1">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      logout.mutate();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-danger hover:bg-danger-soft transition-all"
                  >
                    <LogOut className="w-4 h-4" strokeWidth={1.6} />
                    {logout.isPending ? 'Logging out...' : 'Log out'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ═══ MAIN CONTENT ═══ */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <header className="bg-[#080A09] border-b border-border-subtle px-4 lg:px-6 h-14 flex items-center gap-3 flex-shrink-0">
          {/* Compact logo on mobile only — sidebar is hidden */}
          <div className="lg:hidden flex items-center shrink-0">
            <div className="w-8 h-8 rounded-lg bg-[#050808] flex items-center justify-center p-0.5">
              <img src="/Lead360logo/1.png" alt="Lead360" className="w-full h-full object-contain" />
            </div>
          </div>

          <div className="hidden lg:flex w-7 h-7 rounded-lg bg-brand-soft border border-border-glow items-center justify-center shrink-0">
            <PageIcon className="w-3.5 h-3.5 text-brand" strokeWidth={1.5} />
          </div>
          <h1 className="text-[15px] font-extrabold text-text-primary tracking-tight truncate">
            {getPageTitle()}
          </h1>
          <div className="ml-auto flex items-center gap-2 shrink-0">
            <button
              onClick={openCommandPalette}
              className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border border-border-subtle text-text-muted hover:text-text-primary hover:border-border-medium hover:bg-bg-elevated transition-all"
              title="Search (Ctrl/Cmd + K)"
            >
              <Search className="w-3.5 h-3.5" strokeWidth={1.8} />
              <span>Search</span>
              <kbd className="text-[10px] border border-border-medium rounded px-1 py-0.5">⌘K</kbd>
            </button>
            <NotificationBell />
            <button
              onClick={openCopilot}
              className="flex px-3 py-2 rounded-xl text-xs font-semibold border border-border-glow text-brand hover:bg-brand-soft transition-all items-center gap-1.5"
              title="CRM Copilot"
            >
              <Bot className="w-3.5 h-3.5" strokeWidth={1.8} /> <span className="hidden sm:inline">Copilot</span>
            </button>
            <button
              onClick={() => navigate(ROUTES.dashboard.flows)}
              className="hidden md:flex px-4 py-2 rounded-xl text-xs font-semibold border border-border-subtle text-text-secondary hover:text-text-primary hover:border-border-medium hover:bg-bg-elevated transition-all items-center gap-1.5"
            >
              <Bot className="w-3.5 h-3.5" strokeWidth={1.8} /> AI Builder
            </button>
            <button
              aria-label="Deploy"
              className="px-3 sm:px-4 py-2 rounded-xl text-xs font-bold text-bg bg-brand hover:bg-brand-light transition-all flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5" strokeWidth={2} />
              <span className="hidden sm:inline">Deploy</span>
            </button>
          </div>
        </header>

        {/* Page Content — pb-20 on mobile clears the bottom tab bar */}
        <div className="flex-1 overflow-auto p-4 pb-20 md:p-6 lg:pb-6">
          <Outlet />
        </div>
      </main>

      {/* ═══ MOBILE BOTTOM TAB BAR ═══ */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-[#080A09] border-t border-border-subtle flex items-stretch h-16"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {primaryMobileTabs.map((tab) => {
          const isActive =
            location.pathname === tab.href || location.pathname.startsWith(tab.href + '/');
          return (
            <NavLink
              key={tab.href}
              to={tab.href}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition-colors ${
                isActive ? 'text-brand' : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {isActive && (
                <div className="absolute top-0 w-10 h-[2px] rounded-b-full bg-brand" />
              )}
              <tab.icon className="w-[22px] h-[22px]" strokeWidth={isActive ? 2 : 1.6} />
              <span>{tab.label}</span>
            </NavLink>
          );
        })}
        <button
          type="button"
          onClick={() => setMoreSheetOpen(true)}
          aria-label="More options"
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition-colors ${
            moreSheetOpen ? 'text-brand' : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          <Menu className="w-[22px] h-[22px]" strokeWidth={moreSheetOpen ? 2 : 1.6} />
          <span>More</span>
        </button>
      </nav>

      {/* ═══ MOBILE "MORE" SHEET ═══ */}
      {moreSheetOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-bg flex flex-col"
          role="dialog"
          aria-label="More options"
        >
          {/* Sheet header */}
          <header className="h-14 flex items-center justify-between px-4 border-b border-border-subtle shrink-0">
            <h2 className="text-sm font-extrabold text-text-primary tracking-tight">More</h2>
            <button
              type="button"
              onClick={() => setMoreSheetOpen(false)}
              aria-label="Close"
              className="w-9 h-9 rounded-lg flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-all"
            >
              <X className="w-5 h-5" strokeWidth={1.8} />
            </button>
          </header>

          {/* Sheet body */}
          <div className="flex-1 overflow-auto px-4 py-4 space-y-5">
            {/* Profile card at top */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-bg-elevated border border-border-subtle">
              <div className="w-10 h-10 rounded-lg bg-[#132A21] flex items-center justify-center text-xs font-extrabold text-[#8FAEA0] shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-text-primary truncate">{displayName}</div>
                <div className="text-[10px] text-text-muted truncate">{displayEmail}</div>
              </div>
            </div>

            {/* Build section — items not already in bottom bar */}
            <MoreSection title="Build">
              {moreNav_build
                .filter((i) => !PRIMARY_HREFS.has(i.href))
                .map((item) => (
                  <MoreNavLink key={item.href} item={item} />
                ))}
            </MoreSection>

            {/* Configure section — items not already in bottom bar */}
            <MoreSection title="Configure">
              {moreNav_configure
                .filter((i) => !PRIMARY_HREFS.has(i.href))
                .map((item) => (
                  <MoreNavLink key={item.href} item={item} />
                ))}
            </MoreSection>

            {/* CRM */}
            <MoreSection title="CRM">
              {crmNav.map((item) => (
                <MoreNavLink key={item.href} item={item} />
              ))}
            </MoreSection>

            {/* System */}
            <MoreSection title="System">
              {settingsNav.map((item) => (
                <MoreNavLink key={item.href} item={item} />
              ))}
            </MoreSection>

            {/* Logout */}
            <button
              onClick={() => {
                setMoreSheetOpen(false);
                logout.mutate();
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-danger hover:bg-danger-soft transition-all border border-border-subtle"
            >
              <LogOut className="w-4 h-4" strokeWidth={1.8} />
              {logout.isPending ? 'Logging out...' : 'Log out'}
            </button>
          </div>
        </div>
      )}
      <CommandPalette />
      <CopilotPanel />
    </div>
  );
}

// ─── Helpers for the mobile "More" sheet ───
function MoreSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-[1.5px] mb-2 px-1">
        {title}
      </h3>
      <div className="flex flex-col gap-1">{children}</div>
    </section>
  );
}

function MoreNavLink({
  item,
}: {
  item: { label: string; href: string; icon: any; badge?: string };
}) {
  return (
    <NavLink
      to={item.href}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
          isActive
            ? 'bg-brand-soft text-text-primary font-semibold border border-border-glow'
            : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated border border-transparent'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <item.icon
            className={`w-5 h-5 shrink-0 ${isActive ? 'text-brand' : ''}`}
            strokeWidth={1.6}
          />
          <span className="text-sm flex-1">{item.label}</span>
          {item.badge && (
            <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-[rgba(167,139,250,0.1)] text-[#A78BFA]">
              {item.badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}
