import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  BarChart3,
  BookOpen,
  Bot,
  Boxes,
  Briefcase,
  Building,
  Building2,
  Calendar,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  CheckSquare,
  ChefHat,
  ClipboardList,
  Clock,
  Coins,
  Compass,
  CreditCard,
  Crosshair,
  DollarSign,
  Facebook,
  FileBarChart,
  FileSearch,
  FileSignature,
  FileText,
  Flag,
  FlaskConical,
  Gauge,
  Gavel,
  GitBranch,
  GitMerge,
  Globe,
  IdCard,
  Images,
  KeyRound,
  LayoutDashboard,
  LayoutGrid,
  LayoutPanelTop,
  LifeBuoy,
  Link2,
  ListChecks,
  Mail,
  MapPin,
  Megaphone,
  MessageSquare,
  MessagesSquare,
  Music,
  Network,
  Newspaper,
  OctagonX,
  Package,
  PackageCheck,
  PackageOpen,
  Percent,
  Phone,
  Plug,
  QrCode,
  Receipt,
  RefreshCw,
  RotateCw,
  Route,
  Palette,
  ScrollText,
  Send,
  Settings,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Shuffle,
  Sigma,
  SlidersHorizontal,
  Star,
  Stethoscope,
  Store,
  Target,
  Terminal,
  TrendingUp,
  Truck,
  Undo2,
  UserCheck,
  UserPlus,
  Users,
  Video,
  WalletCards,
  Workflow,
  Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react';

/**
 * One navigation model for the whole admin.
 *
 * This replaces seven arrays that each described part of the sidebar and
 * disagreed with the rest:
 *
 *   primaryNav (43)        the StyleMint rail
 *   crmNav (68)            the Lead360 rail, shown only when the console flag
 *                          was not 'stylemint'
 *   botNav (8)             the chatbot rail
 *   settingsNav (2)        two items that were neither
 *   primaryMobileTabs (4)  the mobile bottom bar, same pages renamed
 *   moreNav_build (2)      a mobile sheet, same pages renamed again
 *   moreNav_configure (8)  a mobile sheet that was the ONLY way to reach four
 *                          pages -- on desktop they were unreachable
 *
 * Three problems came out of that split, and this file is shaped to fix all
 * three rather than to tidy the lists:
 *
 * 1. Two vocabularies for one product. The same page appeared under a
 *    StyleMint name and a Lead360 name depending on which rail you were
 *    looking at. `navAliases` records every one of those, because the merge
 *    can only display one name and choosing it is a product decision.
 *
 * 2. No order of importance. The two rails were mutually exclusive and each
 *    behaved as if it were the whole product. `navSections` settles it:
 *    commerce first, because that is what this admin is for, then the CRM,
 *    then the settings that serve both. 46 commerce pages, 68 CRM pages, 16
 *    shared -- the CRM is the larger half by page count, which is exactly why
 *    it needed a section of its own rather than the top of the rail.
 *
 * 3. Pages nothing linked to. Seven routes rendered a real page that no array
 *    mentioned, so the only way in was to type the URL -- indistinguishable,
 *    from the outside, from the feature not existing. Among them an agent
 *    emergency stop, a bot settings page a code comment wrongly claimed was
 *    listed under Settings, and a custom-domains page whose backend was built
 *    days earlier. They are in the groups below, and the coverage test fails
 *    if another one appears.
 *
 * Pairs that look duplicated are mostly the CRM and commerce versions of one
 * idea -- Sales orders against Orders & fulfilment, Return authorisations
 * against Returns queue, Audit log against Audit trail. They are separate
 * pages against separate backends, so they sit in their own sections where
 * the overlap reads as two products rather than as two buttons for one job.
 * Collapsing them means deciding which backend survives, which is not a
 * decision to make by deleting a nav entry.
 *
 * Generated from the old arrays by a script that fails if any page is
 * unplaced, placed twice, or listed under two names; edit this file directly
 * from here on.
 */

export type NavSectionId = 'commerce' | 'crm' | 'workspace';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  end?: boolean;
}

/**
 * Pages that are the same idea in the two products, and are not the same
 * page.
 *
 * Four pairs survived the merge: orders, returns, deliveries and vendors
 * each exist once for the CRM and once for commerce. They are not a
 * duplicated screen over one backend -- checked, not assumed: the CRM pages
 * call /v1/crm/orders, /v1/crm/returns and /v1/crm/deliveries, and the
 * commerce pages call /v1/stylemint/* and a separate logistics service.
 * Collapsing them means choosing which backend survives, which is a
 * migration and somebody's decision to make.
 *
 * Until then the honest thing is not to hide the overlap but to label it.
 * An operator who finds one of these should be told the other exists, in
 * the same breath, rather than discovering it a week later and wondering
 * which one has been wrong all along.
 */
export const navCounterparts: ReadonlyArray<readonly [string, string]> = [
  ['/dashboard/crm/orders', '/dashboard/stylemint/orders'],
  ['/dashboard/crm/returns', '/dashboard/stylemint/returns'],
  ['/dashboard/crm/deliveries', '/dashboard/stylemint/logistics'],
  ['/dashboard/crm/vendors', '/dashboard/stylemint/vendor'],
];

/** The other page of a pair, if this page is in one. */
export function counterpartOf(href: string): NavItem | undefined {
  const pair = navCounterparts.find(([a, b]) => a === href || b === href);
  if (!pair) return undefined;
  const otherHref = pair[0] === href ? pair[1] : pair[0];
  return allNavItems.find((item) => item.href === otherHref);
}

export interface NavGroup {
  id: string;
  section: NavSectionId;
  label: string;
  icon: LucideIcon;
  items: NavItem[];
}

/** Rendered in this order; the first one is where an operator lands. */
export const navSections: ReadonlyArray<{ id: NavSectionId; label: string }> = [
  // The product this admin is for. Open by default.
  { id: 'commerce', label: 'Commerce' },
  // The Lead360 side. Still here in full, no longer competing for the top of the rail.
  { id: 'crm', label: 'CRM' },
  // Settings and governance for both of the above.
  { id: 'workspace', label: 'Workspace' },
];

/**
 * Names discarded by the merge, kept so the choice stays reviewable.
 *
 * Each line is one page the old admin listed twice under two different
 * names. The merge keeps the desktop rail's name because it has to keep
 * exactly one; which name is right is a product decision, and these are
 * the ones to make.
 *
 *   Products & catalogue   was also Business catalogue (/dashboard/business-catalog)
 *   Stores                 was also Organisations      (/dashboard/crm/organizations)
 *   Bot flows              was also Conversation Map   (/dashboard/flows)
 *   Test preview           was also Test Channel       (/dashboard/test-channel)
 *   Control center         was also Home               (/dashboard/commerce-control)
 *   Products & catalogue   was also Products           (/dashboard/business-catalog)
 *
 * Searching the old name still finds the page, so these feed the rail
 * filter as hidden search terms rather than being deleted.
 */
export const navAliases: ReadonlyArray<{ label: string; alsoKnownAs: string }> = [
  // /dashboard/business-catalog. "Products" is what an operator calls these,
  // and "& catalog" was doing real harm: it sat directly above a separate
  // page called "Catalog", so the group read as two catalogues.
  { label: 'Products', alsoKnownAs: 'Products & catalog' },
  { label: 'Products', alsoKnownAs: 'Business catalog' },

  // /dashboard/catalog is the ingestion pipeline — a sync config and a run
  // history, not a list of products. Naming it for what it does is the other
  // half of the fix above.
  { label: 'Catalog sync', alsoKnownAs: 'Catalog' },

  // /dashboard/crm/organizations lists companies. "Stores" is the StyleMint
  // word and it collides twice over: with retail locations, and with the
  // vendor stores that exist elsewhere in this admin. In the CRM section
  // "Organizations" is unambiguous and is the term the CRM already uses.
  { label: 'Organizations', alsoKnownAs: 'Stores' },

  // "Conversation Map" is a metaphor; "Bot flows" is the thing.
  { label: 'Bot flows', alsoKnownAs: 'Conversation Map' },

  // The route is /test-channel and the thing is a channel you test in.
  { label: 'Test channel', alsoKnownAs: 'Test preview' },
  { label: 'Test channel', alsoKnownAs: 'Test Channel' },

  // "Home" says nothing about what is there.
  { label: 'Control center', alsoKnownAs: 'Home' },

  // Four more renamed for the same reason, though no second name was ever
  // attached to them: two pages called "Platform config" and "Platform
  // configuration" read as one page listed twice, however far apart they
  // sit in the rail.
  { label: 'Commerce platform', alsoKnownAs: 'Platform config' },
  { label: 'CRM platform', alsoKnownAs: 'Platform configuration' },
  { label: 'Data subject requests', alsoKnownAs: 'Data requests' },
  { label: 'CRM feature toggles', alsoKnownAs: 'Feature settings' },
];

export const navGroups: NavGroup[] = [
  {
    id: 'overview',
    section: 'commerce',
    label: 'Overview',
    icon: LayoutDashboard,
    items: [
      { label: 'Control center', href: '/dashboard/commerce-control', icon: LayoutGrid },
      { label: 'Executive cockpit', href: '/dashboard/intelligence-console/cockpit', icon: TrendingUp },
      { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
    ],
  },
  {
    id: 'catalog',
    section: 'commerce',
    label: 'Catalog',
    icon: Package,
    items: [
      { label: 'Products', href: '/dashboard/business-catalog', icon: Boxes },
      { label: 'Catalog sync', href: '/dashboard/catalog', icon: Package },
      { label: 'Content & media', href: '/dashboard/stylemint/content', icon: Images },
      { label: 'Audio', href: '/dashboard/stylemint/audio', icon: Music },
      { label: 'Reel recipes', href: '/dashboard/stylemint/recipes', icon: ChefHat },
      { label: 'Unit markers', href: '/dashboard/stylemint/unit-markers', icon: QrCode },
    ],
  },
  {
    id: 'orders',
    section: 'commerce',
    label: 'Orders & fulfillment',
    icon: ShoppingCart,
    items: [
      { label: 'Orders & fulfillment', href: '/dashboard/stylemint/orders', icon: ShoppingBag },
      { label: 'Returns queue', href: '/dashboard/stylemint/returns', icon: PackageOpen },
      { label: 'Delivery ops', href: '/dashboard/stylemint/logistics', icon: Route },
      { label: 'Couriers', href: '/dashboard/stylemint/couriers', icon: Truck },
      { label: 'Counter handover', href: '/dashboard/stylemint/counter-handover', icon: Store },
      { label: 'Commerce operations', href: '/dashboard/stylemint/operations', icon: SlidersHorizontal },
    ],
  },
  {
    id: 'storefront',
    section: 'commerce',
    label: 'Storefront & growth',
    icon: Megaphone,
    items: [
      { label: 'Customers', href: '/dashboard/stylemint/customers', icon: Users },
      { label: 'Storefront campaigns', href: '/dashboard/stylemint/campaigns', icon: Megaphone },
      { label: 'Demand content', href: '/dashboard/stylemint/demand-content', icon: FileSearch },
      { label: 'Discovery', href: '/dashboard/stylemint/discovery', icon: Compass },
      { label: 'Collections', href: '/dashboard/stylemint/collections', icon: LayoutGrid },
      { label: 'Cart offer holdout', href: '/dashboard/stylemint/cart-offers', icon: FlaskConical },
    ],
  },
  {
    id: 'vendors',
    section: 'commerce',
    label: 'Vendors & payouts',
    icon: Truck,
    items: [
      { label: 'Vendor operations', href: '/dashboard/stylemint/vendor', icon: Building2 },
      { label: 'Vendor desk', href: '/dashboard/stylemint/vendor-desk', icon: Store },
      { label: 'Applications', href: '/dashboard/stylemint/applications', icon: ShieldCheck },
      { label: 'Seller finance', href: '/dashboard/stylemint/finance', icon: WalletCards },
      { label: 'Payouts', href: '/dashboard/stylemint/payouts', icon: Banknote },
    ],
  },
  {
    id: 'automation',
    section: 'commerce',
    label: 'Automation & AI',
    icon: Bot,
    items: [
      { label: 'Bot flows', href: '/dashboard/flows', icon: GitBranch },
      { label: 'Intentions', href: '/dashboard/intents', icon: Target },
      { label: 'API Connection', href: '/dashboard/api-connection', icon: Plug },
      { label: 'Experiments', href: '/dashboard/flows/experiments', icon: FlaskConical },
      { label: 'Agents', href: '/dashboard/agents', icon: Bot },
      { label: 'Agent approvals', href: '/dashboard/agent-governance/approvals', icon: Gavel },
      { label: 'Agent credentials', href: '/dashboard/agent-governance/credentials', icon: KeyRound },
      { label: 'Emergency stop', href: '/dashboard/agent-governance/emergency-stop', icon: OctagonX },
      {
        label: 'Autonomous operations',
        href: '/dashboard/intelligence-console/autonomous-operations',
        icon: Gauge,
      },
      { label: 'Decision twin', href: '/dashboard/decision-twin', icon: Network },
      { label: 'Decision ledger', href: '/dashboard/intelligence-console/ledger', icon: BookOpen },
      { label: 'Failure diagnosis', href: '/dashboard/intelligence-console/diagnosis', icon: Stethoscope },
      { label: 'Related signals', href: '/dashboard/intelligence-console/related-signals', icon: Link2 },
      { label: 'Simulation & rules', href: '/dashboard/stylemint/intelligence', icon: FlaskConical },
      { label: 'Goal templates', href: '/dashboard/stylemint/goal-templates', icon: Target },
    ],
  },
  {
    id: 'inbox',
    section: 'commerce',
    label: 'Inbox & channels',
    icon: MessagesSquare,
    items: [
      { label: 'Chat', href: '/dashboard/chat', icon: MessageSquare },
      { label: 'Overview', href: '/dashboard/home', icon: LayoutGrid },
      { label: 'Conversations', href: '/dashboard/conversations', icon: MessageSquare },
      { label: 'Channels', href: '/dashboard/channels', icon: Phone },
      { label: 'Test channel', href: '/dashboard/test-channel', icon: Terminal },
    ],
  },
  {
    id: 'crm-overview',
    section: 'crm',
    label: 'Reporting',
    icon: BarChart3,
    items: [
      { label: 'Ops dashboard', href: '/dashboard/crm/ops-dashboard', icon: LayoutDashboard },
      { label: 'Reports', href: '/dashboard/crm/reports', icon: FileBarChart },
      { label: 'Dashboards', href: '/dashboard/crm/dashboards', icon: LayoutPanelTop },
      { label: 'Activity feed', href: '/dashboard/crm/activity', icon: Globe },
    ],
  },
  {
    id: 'crm-contacts',
    section: 'crm',
    label: 'Leads & contacts',
    icon: Users,
    items: [
      { label: 'Leads', href: '/dashboard/crm/leads', icon: Users },
      { label: 'Contacts', href: '/dashboard/crm/contacts', icon: UserCheck },
      { label: 'Organizations', href: '/dashboard/crm/organizations', icon: Store },
      { label: 'Accounts', href: '/dashboard/crm/accounts', icon: Building },
      { label: 'Duplicates', href: '/dashboard/crm/dedup', icon: GitMerge },
      { label: 'Customer onboarding', href: '/dashboard/crm/customer-onboarding', icon: UserPlus },
      { label: 'Contact cards', href: '/dashboard/crm/contact-cards', icon: IdCard },
      { label: 'NPS', href: '/dashboard/crm/nps', icon: Star },
      { label: 'Territories', href: '/dashboard/crm/territories', icon: MapPin },
      { label: 'Web forms', href: '/dashboard/crm/webforms', icon: Globe },
    ],
  },
  {
    id: 'crm-deals',
    section: 'crm',
    label: 'Deals & pipeline',
    icon: Briefcase,
    items: [
      { label: 'Deals', href: '/dashboard/crm/deals', icon: Briefcase },
      { label: 'Deals hub', href: '/dashboard/crm/deals-hub', icon: Briefcase },
      { label: 'Pipelines', href: '/dashboard/crm/pipelines', icon: GitBranch },
      { label: 'Quotes', href: '/dashboard/crm/quotes', icon: FileText },
      { label: 'Proposals', href: '/dashboard/crm/proposals', icon: ClipboardList },
      { label: 'Contracts', href: '/dashboard/crm/contracts', icon: FileSignature },
      { label: 'Renewals', href: '/dashboard/crm/renewals', icon: CalendarClock },
      { label: 'Price books', href: '/dashboard/crm/price-books', icon: BookOpen },
      { label: 'Competitors', href: '/dashboard/crm/competitors', icon: Crosshair },
      { label: 'Commissions', href: '/dashboard/crm/commissions', icon: DollarSign },
      { label: 'Scoring rules', href: '/dashboard/crm/scoring-rules', icon: TrendingUp },
    ],
  },
  {
    id: 'crm-work',
    section: 'crm',
    label: 'Activities & process',
    icon: CheckSquare,
    items: [
      { label: 'Meetings', href: '/dashboard/crm/meetings', icon: CalendarCheck },
      { label: 'Tasks', href: '/dashboard/crm/tasks', icon: CheckSquare },
      { label: 'Time Tracking', href: '/dashboard/crm/time-tracking', icon: Clock },
      { label: 'Processes', href: '/dashboard/crm/process-tasks', icon: ListChecks },
      { label: 'Automations', href: '/dashboard/crm/workflows', icon: Zap },
      { label: 'Approvals', href: '/dashboard/crm/approvals', icon: ShieldCheck },
      { label: 'Approval chains', href: '/dashboard/crm/approval-chains', icon: ArrowRight },
      { label: 'Assignment rotation', href: '/dashboard/crm/assignment-rotation', icon: Shuffle },
    ],
  },
  {
    id: 'crm-marketing',
    section: 'crm',
    label: 'Outreach',
    icon: Send,
    items: [
      { label: 'Outreach', href: '/dashboard/crm/campaigns', icon: Megaphone },
      { label: 'Automated campaigns', href: '/dashboard/crm/workflow-campaigns', icon: Target },
      { label: 'Nurture', href: '/dashboard/crm/nurture', icon: Workflow },
      { label: 'Meta ads', href: '/dashboard/crm/meta-ads', icon: Facebook },
      { label: 'Shared inbox', href: '/dashboard/crm/inbox', icon: LayoutDashboard },
      { label: 'Announcements', href: '/dashboard/crm/announcements', icon: Newspaper },
      { label: 'Email sync', href: '/dashboard/crm/email-sync', icon: Mail },
      { label: 'Event Tracking', href: '/dashboard/crm/event-ingestion', icon: Globe },
    ],
  },
  {
    id: 'crm-orders',
    section: 'crm',
    label: 'Orders & stock',
    icon: ClipboardList,
    items: [
      { label: 'Sales orders', href: '/dashboard/crm/orders', icon: Package },
      { label: 'Invoices', href: '/dashboard/crm/invoices', icon: Receipt },
      { label: 'Credit notes', href: '/dashboard/crm/credit-notes', icon: Undo2 },
      { label: 'Subscriptions', href: '/dashboard/crm/subscriptions', icon: RefreshCw },
      { label: 'Return authorizations', href: '/dashboard/crm/returns', icon: RotateCw },
      { label: 'Deliveries', href: '/dashboard/crm/deliveries', icon: Truck },
      { label: 'Inventory', href: '/dashboard/crm/inventory', icon: Package },
      { label: 'Work orders', href: '/dashboard/crm/work-orders', icon: Wrench },
      { label: 'Equipment', href: '/dashboard/crm/equipment', icon: Wrench },
      { label: 'Bundles', href: '/dashboard/crm/product-bundles', icon: Package },
    ],
  },
  {
    id: 'crm-procurement',
    section: 'crm',
    label: 'Procurement',
    icon: PackageCheck,
    items: [
      { label: 'Vendors', href: '/dashboard/crm/vendors', icon: Truck },
      { label: 'Purchase orders', href: '/dashboard/crm/purchase-orders', icon: ShoppingCart },
      { label: 'Goods receipts', href: '/dashboard/crm/goods-receipts', icon: PackageCheck },
      { label: 'Supplier invoices', href: '/dashboard/crm/supplier-invoices', icon: CreditCard },
    ],
  },
  {
    id: 'crm-settings',
    section: 'crm',
    label: 'CRM settings',
    icon: SlidersHorizontal,
    items: [
      { label: 'CRM platform', href: '/dashboard/crm/platform', icon: Sigma },
      { label: 'CRM feature toggles', href: '/dashboard/crm/feature-settings', icon: SlidersHorizontal },
      { label: 'Custom Fields', href: '/dashboard/crm/custom-fields', icon: SlidersHorizontal },
      { label: 'Custom objects', href: '/dashboard/crm/custom-objects', icon: Boxes },
      { label: 'Currencies', href: '/dashboard/crm/currencies', icon: Coins },
      { label: 'Tax rules', href: '/dashboard/crm/tax-rules', icon: Percent },
      { label: 'Payment terms', href: '/dashboard/crm/payment-terms', icon: Calendar },
      { label: 'Time periods', href: '/dashboard/crm/time-periods', icon: Calendar },
      { label: 'Notification settings', href: '/dashboard/crm/notification-settings', icon: Settings },
      { label: 'Single sign-on', href: '/dashboard/crm/sso', icon: KeyRound },
      { label: 'Audit log', href: '/dashboard/crm/audit', icon: ScrollText },
      { label: 'Data subject requests', href: '/dashboard/crm/gdpr', icon: ShieldAlert },
      { label: 'Knowledge base', href: '/dashboard/crm/knowledge-base', icon: BookOpen },
    ],
  },
  {
    id: 'support',
    section: 'workspace',
    label: 'Support',
    icon: LifeBuoy,
    items: [
      { label: 'Support', href: '/dashboard/support', icon: LifeBuoy },
      { label: 'Moderation', href: '/dashboard/stylemint/moderation', icon: ShieldAlert },
    ],
  },
  {
    id: 'settings',
    section: 'workspace',
    label: 'Settings',
    icon: Settings,
    items: [
      { label: 'Team', href: '/dashboard/team', icon: Users },
      { label: 'Settings', href: '/dashboard/settings', icon: Settings },
      { label: 'Bot settings', href: '/dashboard/bot-settings', icon: Bot },
      { label: 'Commerce platform', href: '/dashboard/stylemint/platform-config', icon: Settings2 },
      { label: 'Feature flags', href: '/dashboard/stylemint/feature-flags', icon: Flag },
      { label: 'Custom domains', href: '/dashboard/settings/custom-domains', icon: Globe },
      { label: 'Video conferencing', href: '/dashboard/settings/video-conferencing', icon: Video },
      { label: 'Calendar', href: '/dashboard/settings/calendar', icon: CalendarDays },
      { label: 'Booking page', href: '/dashboard/settings/booking-page', icon: CalendarCheck },
      { label: 'Design system', href: '/dashboard/design-system', icon: Palette },
    ],
  },
  {
    id: 'governance',
    section: 'workspace',
    label: 'Governance',
    icon: ShieldCheck,
    items: [
      { label: 'Operator access', href: '/dashboard/stylemint/access', icon: KeyRound },
      { label: 'Audit trail', href: '/dashboard/stylemint/audit', icon: ScrollText },
      { label: 'Data rights', href: '/dashboard/stylemint/privacy', icon: ShieldCheck },
      { label: 'Compliance', href: '/dashboard/compliance', icon: ScrollText },
      { label: 'Trust', href: '/dashboard/stylemint/trust', icon: BadgeCheck },
    ],
  },
];

/** Every item, flattened - for coverage tests and the rail filter. */
export const allNavItems: NavItem[] = navGroups.flatMap((g) => g.items);
