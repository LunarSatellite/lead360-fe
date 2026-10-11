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
  ScrollText,
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
 *    looking at. `navAliases` below records every one of those, because the
 *    merge can only display one name and choosing it is a product decision.
 *
 * 2. A flat rail. 119 items in one scrolling column is not navigation, it is a
 *    list of everything the application can do. The groups here are twelve
 *    questions a user actually arrives with -- where are my customers, where
 *    are my orders -- and no group exceeds twenty items, which
 *    nav-model-coverage.test.ts enforces so this cannot silently regress into
 *    the same column with headings in it.
 *
 * 3. Pages nothing linked to. Seven routes rendered a real page that no array
 *    mentioned, so the only way in was to type the URL -- indistinguishable,
 *    from the outside, from the feature not existing. Among them an agent
 *    emergency stop, a bot settings page a code comment wrongly claimed was
 *    listed under Settings, and a custom-domains page whose backend was built
 *    days earlier. They are in the groups below, and the coverage test fails
 *    if another one appears.
 *
 * Duplicate-looking pairs that remain -- Vendors and Vendor operations, Sales
 * orders and Orders & fulfilment, Return authorisations and Returns queue,
 * Deliveries and Delivery ops, Audit log and Audit trail -- are separate
 * pages, not aliases, so they sit in the same group where the overlap is
 * visible. Deciding which survives means deciding what the product is, and
 * that is not a decision to make by deleting a nav entry.
 *
 * Generated from the old arrays by a script that fails if any page is
 * unplaced, placed twice, or listed under two names; edit this file directly
 * from here on.
 */

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  end?: boolean;
}

export interface NavGroup {
  id: string;
  label: string;
  icon: LucideIcon;
  items: NavItem[];
}

/**
 * Names discarded by the merge, kept so the choice stays reviewable.
 *
 * Each line is one page that the old admin listed twice under two
 * different names. The merge keeps the desktop rail's name because it
 * has to keep exactly one; which name is right is a product decision,
 * and these are the ones to make.
 *
 *   Products & catalogue   was also Business catalogue (/dashboard/business-catalog)
 *   Stores                 was also Organisations      (/dashboard/crm/organizations)
 *   Bot flows              was also Conversation Map   (/dashboard/flows)
 *   Test preview           was also Test Channel       (/dashboard/test-channel)
 *   Control center         was also Home               (/dashboard/commerce-control)
 *   Products & catalogue   was also Products           (/dashboard/business-catalog)
 *
 * Searching the old name should still find the page, so these feed the
 * command palette as hidden search terms rather than being deleted.
 */
export const navAliases: ReadonlyArray<{ label: string; alsoKnownAs: string }> = [
  { label: 'Products & catalogue', alsoKnownAs: 'Business catalogue' },
  { label: 'Stores', alsoKnownAs: 'Organisations' },
  { label: 'Bot flows', alsoKnownAs: 'Conversation Map' },
  { label: 'Test preview', alsoKnownAs: 'Test Channel' },
  { label: 'Control center', alsoKnownAs: 'Home' },
  { label: 'Products & catalogue', alsoKnownAs: 'Products' },
];

export const navGroups: NavGroup[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: LayoutDashboard,
    items: [
      { label: 'Control center', href: '/dashboard/commerce-control', icon: LayoutGrid },
      { label: 'Executive cockpit', href: '/dashboard/intelligence-console/cockpit', icon: TrendingUp },
      { label: 'Ops dashboard', href: '/dashboard/crm/ops-dashboard', icon: LayoutDashboard },
      { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
      { label: 'Reports', href: '/dashboard/crm/reports', icon: FileBarChart },
      { label: 'Dashboards', href: '/dashboard/crm/dashboards', icon: LayoutPanelTop },
      { label: 'Activity feed', href: '/dashboard/crm/activity', icon: Globe },
    ],
  },
  {
    id: 'inbox',
    label: 'Inbox & channels',
    icon: MessagesSquare,
    items: [
      { label: 'Chat', href: '/dashboard/chat', icon: MessageSquare },
      { label: 'Overview', href: '/dashboard/home', icon: LayoutGrid },
      { label: 'Conversations', href: '/dashboard/conversations', icon: MessageSquare },
      { label: 'Shared inbox', href: '/dashboard/crm/inbox', icon: LayoutDashboard },
      { label: 'Channels', href: '/dashboard/channels', icon: Phone },
      { label: 'Test preview', href: '/dashboard/test-channel', icon: Terminal },
      { label: 'Announcements', href: '/dashboard/crm/announcements', icon: Newspaper },
      { label: 'Notification settings', href: '/dashboard/crm/notification-settings', icon: Settings },
      { label: 'Email sync', href: '/dashboard/crm/email-sync', icon: Mail },
    ],
  },
  {
    id: 'customers',
    label: 'Customers',
    icon: Users,
    items: [
      { label: 'Leads', href: '/dashboard/crm/leads', icon: Users },
      { label: 'Contacts', href: '/dashboard/crm/contacts', icon: UserCheck },
      { label: 'Stores', href: '/dashboard/crm/organizations', icon: Store },
      { label: 'Accounts', href: '/dashboard/crm/accounts', icon: Building },
      { label: 'Duplicates', href: '/dashboard/crm/dedup', icon: GitMerge },
      { label: 'Customers', href: '/dashboard/stylemint/customers', icon: Users },
      { label: 'Customer onboarding', href: '/dashboard/crm/customer-onboarding', icon: UserPlus },
      { label: 'Contact cards', href: '/dashboard/crm/contact-cards', icon: IdCard },
      { label: 'NPS', href: '/dashboard/crm/nps', icon: Star },
      { label: 'Territories', href: '/dashboard/crm/territories', icon: MapPin },
      { label: 'Web forms', href: '/dashboard/crm/webforms', icon: Globe },
    ],
  },
  {
    id: 'sales',
    label: 'Sales',
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
      { label: 'Meetings', href: '/dashboard/crm/meetings', icon: CalendarCheck },
      { label: 'Tasks', href: '/dashboard/crm/tasks', icon: CheckSquare },
      { label: 'Time Tracking', href: '/dashboard/crm/time-tracking', icon: Clock },
      { label: 'Processes', href: '/dashboard/crm/process-tasks', icon: ListChecks },
    ],
  },
  {
    id: 'marketing',
    label: 'Marketing',
    icon: Megaphone,
    items: [
      { label: 'Outreach', href: '/dashboard/crm/campaigns', icon: Megaphone },
      { label: 'Automated campaigns', href: '/dashboard/crm/workflow-campaigns', icon: Target },
      { label: 'Nurture', href: '/dashboard/crm/nurture', icon: Workflow },
      { label: 'Meta ads', href: '/dashboard/crm/meta-ads', icon: Facebook },
      { label: 'Storefront campaigns', href: '/dashboard/stylemint/campaigns', icon: Megaphone },
      { label: 'Demand content', href: '/dashboard/stylemint/demand-content', icon: FileSearch },
      { label: 'Discovery', href: '/dashboard/stylemint/discovery', icon: Compass },
      { label: 'Collections', href: '/dashboard/stylemint/collections', icon: LayoutGrid },
      { label: 'Cart offer holdout', href: '/dashboard/stylemint/cart-offers', icon: FlaskConical },
    ],
  },
  {
    id: 'catalogue',
    label: 'Catalogue & content',
    icon: Package,
    items: [
      { label: 'Products & catalogue', href: '/dashboard/business-catalog', icon: Boxes },
      { label: 'Catalogue', href: '/dashboard/catalog', icon: Package },
      { label: 'Bundles', href: '/dashboard/crm/product-bundles', icon: Package },
      { label: 'Content & media', href: '/dashboard/stylemint/content', icon: Images },
      { label: 'Audio', href: '/dashboard/stylemint/audio', icon: Music },
      { label: 'Reel recipes', href: '/dashboard/stylemint/recipes', icon: ChefHat },
      { label: 'Unit markers', href: '/dashboard/stylemint/unit-markers', icon: QrCode },
    ],
  },
  {
    id: 'orders',
    label: 'Orders & fulfilment',
    icon: ShoppingCart,
    items: [
      { label: 'Orders & fulfilment', href: '/dashboard/stylemint/orders', icon: ShoppingBag },
      { label: 'Sales orders', href: '/dashboard/crm/orders', icon: Package },
      { label: 'Invoices', href: '/dashboard/crm/invoices', icon: Receipt },
      { label: 'Credit notes', href: '/dashboard/crm/credit-notes', icon: Undo2 },
      { label: 'Subscriptions', href: '/dashboard/crm/subscriptions', icon: RefreshCw },
      { label: 'Returns queue', href: '/dashboard/stylemint/returns', icon: PackageOpen },
      { label: 'Return authorisations', href: '/dashboard/crm/returns', icon: RotateCw },
      { label: 'Deliveries', href: '/dashboard/crm/deliveries', icon: Truck },
      { label: 'Delivery ops', href: '/dashboard/stylemint/logistics', icon: Route },
      { label: 'Couriers', href: '/dashboard/stylemint/couriers', icon: Truck },
      { label: 'Counter handover', href: '/dashboard/stylemint/counter-handover', icon: Store },
      { label: 'Inventory', href: '/dashboard/crm/inventory', icon: Package },
      { label: 'Work orders', href: '/dashboard/crm/work-orders', icon: Wrench },
      { label: 'Equipment', href: '/dashboard/crm/equipment', icon: Wrench },
      { label: 'Commerce operations', href: '/dashboard/stylemint/operations', icon: SlidersHorizontal },
    ],
  },
  {
    id: 'procurement',
    label: 'Procurement & vendors',
    icon: Truck,
    items: [
      { label: 'Vendors', href: '/dashboard/crm/vendors', icon: Truck },
      { label: 'Vendor operations', href: '/dashboard/stylemint/vendor', icon: Building2 },
      { label: 'Vendor desk', href: '/dashboard/stylemint/vendor-desk', icon: Store },
      { label: 'Applications', href: '/dashboard/stylemint/applications', icon: ShieldCheck },
      { label: 'Purchase orders', href: '/dashboard/crm/purchase-orders', icon: ShoppingCart },
      { label: 'Goods receipts', href: '/dashboard/crm/goods-receipts', icon: PackageCheck },
      { label: 'Supplier invoices', href: '/dashboard/crm/supplier-invoices', icon: CreditCard },
      { label: 'Seller finance', href: '/dashboard/stylemint/finance', icon: WalletCards },
      { label: 'Payouts', href: '/dashboard/stylemint/payouts', icon: Banknote },
    ],
  },
  {
    id: 'automation',
    label: 'Automation & AI',
    icon: Bot,
    items: [
      { label: 'Bot flows', href: '/dashboard/flows', icon: GitBranch },
      { label: 'Intentions', href: '/dashboard/intents', icon: Target },
      { label: 'API Connection', href: '/dashboard/api-connection', icon: Plug },
      { label: 'Experiments', href: '/dashboard/flows/experiments', icon: FlaskConical },
      { label: 'Agents', href: '/dashboard/agents', icon: Bot },
      { label: 'Automations', href: '/dashboard/crm/workflows', icon: Zap },
      { label: 'Agent approvals', href: '/dashboard/agent-governance/approvals', icon: Gavel },
      { label: 'Agent credentials', href: '/dashboard/agent-governance/credentials', icon: KeyRound },
      { label: 'Emergency stop', href: '/dashboard/agent-governance/emergency-stop', icon: OctagonX },
      { label: 'Autonomous operations', href: '/dashboard/intelligence-console/autonomous-operations', icon: Gauge },
      { label: 'Decision twin', href: '/dashboard/decision-twin', icon: Network },
      { label: 'Decision ledger', href: '/dashboard/intelligence-console/ledger', icon: BookOpen },
      { label: 'Failure diagnosis', href: '/dashboard/intelligence-console/diagnosis', icon: Stethoscope },
      { label: 'Related signals', href: '/dashboard/intelligence-console/related-signals', icon: Link2 },
      { label: 'Simulation & rules', href: '/dashboard/stylemint/intelligence', icon: FlaskConical },
      { label: 'Goal templates', href: '/dashboard/stylemint/goal-templates', icon: Target },
      { label: 'Event Tracking', href: '/dashboard/crm/event-ingestion', icon: Globe },
    ],
  },
  {
    id: 'support',
    label: 'Support',
    icon: LifeBuoy,
    items: [
      { label: 'Support', href: '/dashboard/support', icon: LifeBuoy },
      { label: 'Knowledge base', href: '/dashboard/crm/knowledge-base', icon: BookOpen },
      { label: 'Moderation', href: '/dashboard/stylemint/moderation', icon: ShieldAlert },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    items: [
      { label: 'Team', href: '/dashboard/team', icon: Users },
      { label: 'Settings', href: '/dashboard/settings', icon: Settings },
      { label: 'Bot settings', href: '/dashboard/bot-settings', icon: Bot },
      { label: 'Platform config', href: '/dashboard/stylemint/platform-config', icon: Settings2 },
      { label: 'Platform configuration', href: '/dashboard/crm/platform', icon: Sigma },
      { label: 'Feature flags', href: '/dashboard/stylemint/feature-flags', icon: Flag },
      { label: 'Feature settings', href: '/dashboard/crm/feature-settings', icon: SlidersHorizontal },
      { label: 'Custom Fields', href: '/dashboard/crm/custom-fields', icon: SlidersHorizontal },
      { label: 'Custom objects', href: '/dashboard/crm/custom-objects', icon: Boxes },
      { label: 'Currencies', href: '/dashboard/crm/currencies', icon: Coins },
      { label: 'Tax rules', href: '/dashboard/crm/tax-rules', icon: Percent },
      { label: 'Payment terms', href: '/dashboard/crm/payment-terms', icon: Calendar },
      { label: 'Time periods', href: '/dashboard/crm/time-periods', icon: Calendar },
      { label: 'Custom domains', href: '/dashboard/settings/custom-domains', icon: Globe },
      { label: 'Video conferencing', href: '/dashboard/settings/video-conferencing', icon: Video },
      { label: 'Calendar', href: '/dashboard/settings/calendar', icon: CalendarDays },
      { label: 'Booking page', href: '/dashboard/settings/booking-page', icon: CalendarCheck },
    ],
  },
  {
    id: 'governance',
    label: 'Governance & compliance',
    icon: ShieldCheck,
    items: [
      { label: 'Operator access', href: '/dashboard/stylemint/access', icon: KeyRound },
      { label: 'Single sign-on', href: '/dashboard/crm/sso', icon: KeyRound },
      { label: 'Approvals', href: '/dashboard/crm/approvals', icon: ShieldCheck },
      { label: 'Approval chains', href: '/dashboard/crm/approval-chains', icon: ArrowRight },
      { label: 'Assignment rotation', href: '/dashboard/crm/assignment-rotation', icon: Shuffle },
      { label: 'Audit trail', href: '/dashboard/stylemint/audit', icon: ScrollText },
      { label: 'Audit log', href: '/dashboard/crm/audit', icon: ScrollText },
      { label: 'Data rights', href: '/dashboard/stylemint/privacy', icon: ShieldCheck },
      { label: 'Data requests', href: '/dashboard/crm/gdpr', icon: ShieldAlert },
      { label: 'Compliance', href: '/dashboard/compliance', icon: ScrollText },
      { label: 'Trust', href: '/dashboard/stylemint/trust', icon: BadgeCheck },
    ],
  },
];

/** Every item, flattened - for coverage tests and the command palette. */
export const allNavItems: NavItem[] = navGroups.flatMap((g) => g.items);
