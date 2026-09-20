export const ROUTES = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
    verifyEmail: '/verify-email',
  },
  public: {
    acceptInvitation: '/accept-invitation',
    approval: (runId: string) => `/approvals/${runId}`,
  },
  dashboard: {
    root: '/dashboard',
    commerceControl: '/dashboard/commerce-control',
    stylemintOrders: '/dashboard/stylemint/orders',
    vendorOperations: '/dashboard/stylemint/vendor',
    contentOperations: '/dashboard/stylemint/content',
    stylemintCustomers: '/dashboard/stylemint/customers',
    sellerFinance: '/dashboard/stylemint/finance',
    commerceOperations: '/dashboard/stylemint/operations',
    kycReview: '/dashboard/stylemint/applications',
    operatorAccess: '/dashboard/stylemint/access',
    moderation: '/dashboard/stylemint/moderation',
    featureFlags: '/dashboard/stylemint/feature-flags',
    couriers: '/dashboard/stylemint/couriers',
    collections: '/dashboard/stylemint/collections',
    audio: '/dashboard/stylemint/audio',
    platformConfig: '/dashboard/stylemint/platform-config',
    auditTrail: '/dashboard/stylemint/audit',
    returns: '/dashboard/stylemint/returns',
    counterHandover: '/dashboard/stylemint/counter-handover',
    payouts: '/dashboard/stylemint/payouts',
    privacyRequests: '/dashboard/stylemint/privacy',
    recipes: '/dashboard/stylemint/recipes',
    logistics: '/dashboard/stylemint/logistics',
    commerceCampaigns: '/dashboard/stylemint/campaigns',
    discovery: '/dashboard/stylemint/discovery',
    intelligence: '/dashboard/stylemint/intelligence',
    // Decision intelligence is five reports behind five tabs. They answer on
    // their own URLs so a demo script, an agenda or a bug report can point at
    // one of them; bare /stylemint/intelligence still opens the cockpit.
    intelligenceTab: (tab: string) => `/dashboard/stylemint/intelligence/${tab}`,
    demandContent: '/dashboard/stylemint/demand-content',
    cartOfferIncrementality: '/dashboard/stylemint/cart-offers',
    goalTemplates: '/dashboard/stylemint/goal-templates',
    trust: '/dashboard/stylemint/trust',
    // ── Agent governance — the human half of the approval machinery ──
    agentApprovals: '/dashboard/agent-governance/approvals',
    agentActionRecord: (id: string) => `/dashboard/agent-governance/actions/${id}`,
    agentEmergencyStop: '/dashboard/agent-governance/emergency-stop',
    agentCredentials: '/dashboard/agent-governance/credentials',
    // ── Intelligence console — the operator screens for the five Phase-4
    //    read surfaces. Note `intelligence` above is a different, older page
    //    under stylemint/; these live on their own prefix to avoid colliding
    //    with it.
    intelCockpit: '/dashboard/intelligence-console/cockpit',
    intelCockpitDecision: (id: string) =>
      `/dashboard/intelligence-console/cockpit/decisions/${id}`,
    intelLedger: '/dashboard/intelligence-console/ledger',
    intelLedgerEntry: (decisionId: string) =>
      `/dashboard/intelligence-console/ledger/${decisionId}`,
    intelDiagnosis: '/dashboard/intelligence-console/diagnosis',
    intelDiagnosisFingerprint: (fingerprint: string) =>
      `/dashboard/intelligence-console/diagnosis/${encodeURIComponent(fingerprint)}`,
    intelRelatedSignals: '/dashboard/intelligence-console/related-signals',
    intelRecordSignals: (targetKind: string, targetId: string) =>
      `/dashboard/intelligence-console/related-signals/${encodeURIComponent(targetKind)}/${encodeURIComponent(targetId)}`,
    intelAutonomousOperations: '/dashboard/intelligence-console/autonomous-operations',
    // ── Retail decision twin — the operator-side twin (Define, Simulate,
    //    Compare, Learn) over `v1/admin/retail-decision-twin`. Not to be
    //    confused with `v1/vendor/store/digital-twin` (a dashboard field) or
    //    `v1/vendor/digital-twin` (the vendor scenario runner, mobile-only).
    decisionTwin: '/dashboard/decision-twin',
    decisionTwinStudy: (studyId: string) =>
      `/dashboard/decision-twin/studies/${encodeURIComponent(studyId)}`,
    // ── Chat-first primary surfaces (new) ──
    chat: '/dashboard/chat',
    home: '/dashboard/home',
    // ── Existing pages (still reachable, still routed) ──
    // NOTE: setup + onboarding kept for the type, but their routes are
    // commented out in routes.tsx since chat-first replaces them. Don't
    // link to them in new code.
    setup: '/dashboard/setup',
    settings: '/dashboard/settings',
    team: '/dashboard/team',
    intents: '/dashboard/intents',
    intentDetail: (id: string) => `/dashboard/intents/${id}`,
    apiSpecs: '/dashboard/api-specs',
    apiSpecDetail: (id: string) => `/dashboard/api-specs/${id}`,
    apiConnection: '/dashboard/api-connection',
    apiConnectionDetail: (specId: string) => `/dashboard/api-connection/${specId}`,
    intentSuggestions: '/dashboard/intent-suggestions',
    catalog: '/dashboard/catalog',
    businessCatalog: '/dashboard/business-catalog',
    flows: '/dashboard/flows',
    botSettings: '/dashboard/bot-settings',
    channels: '/dashboard/channels',
    testChannel: '/dashboard/test-channel',
    conversations: '/dashboard/conversations',
    campaigns: '/dashboard/campaigns',
    campaignNew: '/dashboard/campaigns/new',
    agents: '/dashboard/agents',
    analytics: '/dashboard/analytics',
    support: '/dashboard/support',
    onboarding: '/dashboard/onboarding',
    // ── CRM ──
    crmLeads: '/dashboard/crm/leads',
    crmLeadDetail: (id: string) => `/dashboard/crm/leads/${id}`,
    crmContacts: '/dashboard/crm/contacts',
    crmContactDetail: (id: string) => `/dashboard/crm/contacts/${id}`,
    crmOrganizations: '/dashboard/crm/organizations',
    crmAccounts: '/dashboard/crm/accounts',
    crmDeals: '/dashboard/crm/deals',
    crmDealDetail: (id: string) => `/dashboard/crm/deals/${id}`,
    crmNurture: '/dashboard/crm/nurture',
    crmCampaigns: '/dashboard/crm/campaigns',
    crmAnalytics: '/dashboard/crm/analytics',
    crmSupport: '/dashboard/crm/support',
    crmTasks: '/dashboard/crm/tasks',
    crmQuotes: '/dashboard/crm/quotes',
    crmProposals: '/dashboard/crm/proposals',
    crmInvoices: '/dashboard/crm/invoices',
    crmSubscriptions: '/dashboard/crm/subscriptions',
    crmOrders: '/dashboard/crm/orders',
    crmMeetings: '/dashboard/crm/meetings',
    crmWorkflows: '/dashboard/crm/workflows',
    crmNps: '/dashboard/crm/nps',
    crmTimeTracking: '/dashboard/crm/time-tracking',
    crmCustomFields: '/dashboard/crm/custom-fields',
    crmDedup: '/dashboard/crm/dedup',
    crmAnnouncements: '/dashboard/crm/announcements',
    crmProcessTasks: '/dashboard/crm/process-tasks',
    crmProcessDefinitions: '/dashboard/crm/process-definitions',
    crmProcessInstances: '/dashboard/crm/process-instances',
    crmEventIngestion: '/dashboard/crm/event-ingestion',
    // ── Flow A/B Experiments ──
    flowExperiments: '/dashboard/flows/experiments',
    // ── Integrations ──
    videoConferencingSettings: '/dashboard/settings/video-conferencing',
    calendarSettings: '/dashboard/settings/calendar',
    bookingPageSettings: '/dashboard/settings/booking-page',
  },
  schedule: (token: string) => `/schedule/${token}`,
  book: (slug: string) => `/book/${slug}`,
  bookEventType: (slug: string, eventTypeId: string) => `/book/${slug}/${eventTypeId}`,
} as const;

/**
 * Where an authenticated operator lands.
 *
 * There used to be two answers. `routes.tsx` sent `/` and the `/dashboard`
 * index to the commerce control centre; `RedirectIfAuth` sent anyone who hit
 * an `/auth/*` URL while logged in to CRM analytics instead. So the landing
 * surface depended on which door you came through.
 *
 * The commerce control centre wins, for three reasons: it is what every other
 * entry point in the shell already points at (the `/` redirect, the
 * `/dashboard` index, the mobile "Home" tab and the header's "Review
 * operations" button); it is the console this product is; and the CRM database
 * is created empty by the cutover, so CRM analytics opens on a screen of
 * zeroes that reads as a product with no customers.
 *
 * Both paths now import this constant. Changing where operators land is one
 * edit, in one place.
 */
export const POST_AUTH_LANDING: string = ROUTES.dashboard.commerceControl;
