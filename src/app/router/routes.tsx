import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { AuthLayout } from '@/app/layouts/AuthLayout';
import { DashboardLayout } from '@/app/layouts/DashboardLayout';
import { RequireAuth, RedirectIfAuth, RequirePortalAuth, RedirectIfPortalAuth } from './guards';
import { RouteErrorBoundary } from '@/shared/ui/RouteErrorBoundary';
import PortalLayout from '@/app/layouts/PortalLayout';

export const router = createBrowserRouter([
  // ─── Landing — logged in users skip to dashboard ───
  {
    path: '/',
    lazy: async () => {
      const token = localStorage.getItem('omniflow_token');
      if (token) {
        return { Component: () => <Navigate to="/dashboard/crm/analytics" replace /> };
      }
      return import('@/features/landing/pages/LandingPage');
    },
  },

  // ─── Auth — redirect if already logged in ───
  {
    path: '/auth',
    element: (
      <RedirectIfAuth>
        <AuthLayout />
      </RedirectIfAuth>
    ),
    children: [
      { path: 'login', lazy: () => import('@/features/auth/pages/LoginPage')},
      { path: 'register', lazy: () => import('@/features/auth/pages/RegisterPage') },
      { path: 'forgot-password', lazy: () => import('@/features/auth/pages/ForgotPasswordPage') },
      { path: 'reset-password', lazy: () => import('@/features/auth/pages/ResetPasswordPage') },
    ],
  },

  // ─── Verify email — public ───
  {
    path: '/verify-email',
    element: <AuthLayout />,
    children: [{ index: true, lazy: () => import('@/features/auth/pages/VerifyEmailPage') }],
  },

  // ─── Accept invitation — public ───
  {
    path: '/accept-invitation',
    element: <AuthLayout />,
    children: [{ index: true, lazy: () => import('@/features/team/pages/AcceptInvitationPage') }],
  },

  // ─── Public scheduling page — no auth ───
  {
    path: '/schedule/:token',
    lazy: () => import('@/features/crm/pages/PublicSchedulePage'),
  },

  // ─── Public pay-online page — no auth ───
  {
    path: '/pay/:token',
    lazy: () => import('@/features/crm/pages/PublicPayPage'),
  },

  // ─── Public booking pages — no auth ───
  {
    path: '/book/:slug',
    lazy: () => import('@/features/booking/pages/PublicBookingListPage'),
  },
  {
    path: '/book/:slug/:eventTypeId',
    lazy: () => import('@/features/booking/pages/PublicBookingEventPage'),
  },

  // ─── Approval landing page — semi-public ───
  // Reached via the email link sent to an approver. Handles its own
  // auth gate (redirects to /auth/login?return=… preserving the
  // ?token=&decision= query string) so this route stays bare — no
  // AuthLayout wrapper, no RequireAuth guard. The page renders its
  // own full-screen shell with the correct background.
  {
    path: '/approvals/:runId',
    lazy: () => import('@/features/agents/pages/ApprovalLandingPage'),
  },

  // ─── Dashboard (protected) ───
  {
    path: '/dashboard',
    element: (
      <RequireAuth>
        <DashboardLayout />
      </RequireAuth>
    ),
    errorElement: <RouteErrorBoundary />,
    children: [
      // ── Chat-first primary surfaces (new) ──
      { path: 'chat', lazy: () => import('@/features/chat/pages/ChatPage') },
      { path: 'home', lazy: () => import('@/features/home/pages/HomePage') },
      // ── Existing pages (still routed for power users / direct URLs) ──

      // ── COMMENTED: Setup tabs page — chat-first onboarding replaces this.
      //    Uncomment if you need to fall back. The file
      //    src/features/tenant/pages/SetupPage.tsx is intact on disk.
      // { path: 'setup', lazy: () => import('@/features/tenant/pages/SetupPage') },
      { path: 'settings', lazy: () => import('@/features/auth/pages/AccountSettingsPage') },
      { path: 'settings/video-conferencing', lazy: () => import('@/features/integrations/pages/VideoConferencingSettingsPage') },
      { path: 'settings/calendar', lazy: () => import('@/features/integrations/pages/CalendarIntegrationSettingsPage') },
      { path: 'settings/booking-page', lazy: () => import('@/features/booking/pages/BookingPageSettingsPage') },
      { path: 'intents', lazy: () => import('@/features/intents/pages/IntentListPage') },
      { path: 'api-specs', element: <Navigate to="/dashboard/api-connection" replace /> },
      { path: 'api-specs/:id', element: <Navigate to="/dashboard/api-connection" replace /> },
      { path: 'api-connection', lazy: () => import('@/features/api-connection/pages/ApiConnectionPage') },
      { path: 'api-connection/:specId', lazy: () => import('@/features/api-connection/pages/ApiSpecDetailPage') },
      { path: 'intent-suggestions', element: <Navigate to="/dashboard/api-connection" replace /> },
      { path: 'catalog', lazy: () => import('@/features/catalog/pages/CatalogDashboardPage') },
      { path: 'business-catalog', lazy: () => import('@/features/business-catalog/pages/BusinessCatalogPage') },
      { path: 'flows', lazy: () => import('@/features/flow-builder/pages/FlowBuilderPage') },
      { path: 'bot-settings', lazy: () => import('@/features/flow-builder/pages/BotSettingsPage') },
      { path: 'channels', lazy: () => import('@/features/channels/pages/ChannelListPage') },
      { path: 'agents', lazy: () => import('@/features/agents/pages/AgentListPage') },
      { path: 'test-channel', lazy: () => import('@/features/test-channel/pages/TestChannelPage') },
      { path: 'conversations', lazy: () => import('@/features/conversations/pages/ConversationsPage') },
      { path: 'analytics', lazy: () => import('@/features/analytics/pages/AnalyticsPage') },
      { path: 'compliance', lazy: () => import('@/features/compliance/pages/ComplianceSettings') },
      // ── COMMENTED: 6-step Onboarding wizard — chat-first replaces it.
      //    Uncomment if you need the wizard back. The file
      //    src/features/onboarding/pages/OnboardingPage.tsx is intact on disk.
      //    NOTE: src/features/auth/pages/OnboardingPage.tsx (the duplicate) is
      //    not routed anywhere — it's dead code that can be deleted in a later PR.
      // { path: 'onboarding', lazy: () => import('@/features/onboarding/pages/OnboardingPage') },
      { path: 'team', lazy: () => import('@/features/team/pages/TeamManagementPage') },
      // ── CRM ──
      { path: 'crm/leads', lazy: () => import('@/features/crm/pages/LeadsPage') },
      { path: 'crm/leads/:id', lazy: () => import('@/features/crm/pages/LeadDetailPage') },
      { path: 'crm/contacts', lazy: () => import('@/features/crm/pages/CrmContactsHubPage') },
      { path: 'crm/contacts/:id', lazy: () => import('@/features/crm/pages/ContactDetailPage') },
      { path: 'crm/organizations', lazy: () => import('@/features/crm/pages/OrganizationsPage') },
      { path: 'crm/accounts', lazy: () => import('@/features/crm/pages/AccountsPage') },
      { path: 'crm/deals-hub', lazy: () => import('@/features/crm/pages/CrmDealsHubPage') },
      { path: 'crm/deals', lazy: () => import('@/features/crm/pages/DealsPage') },
      { path: 'crm/deals/:id', lazy: () => import('@/features/crm/pages/DealDetailPage') },
      { path: 'crm/pipelines', lazy: () => import('@/features/crm/pages/CrmPipelinesPage') },
      { path: 'crm/approvals', lazy: () => import('@/features/crm/pages/CrmApprovalsPage') },
      { path: 'crm/nurture', lazy: () => import('@/features/crm/pages/NurtureSequencesPage') },
      { path: 'crm/campaigns', lazy: () => import('@/features/crm/pages/CampaignsPage') },
      { path: 'crm/analytics', lazy: () => import('@/features/crm/pages/CrmAnalyticsPage') },
      { path: 'crm/audit-log', lazy: () => import('@/features/crm/pages/AuditLogPage') },
      { path: 'crm/feature-settings', lazy: () => import('@/features/crm/pages/FeatureSettingsPage') },
      { path: 'crm/support', lazy: () => import('@/features/crm/pages/CrmSupportPage') },
      { path: 'crm/tasks', lazy: () => import('@/features/crm/pages/CrmTasksPage') },
      { path: 'crm/quotes', lazy: () => import('@/features/crm/pages/CrmQuotesPage') },
      { path: 'crm/proposals', lazy: () => import('@/features/crm/pages/CrmProposalsPage') },
      { path: 'crm/invoices', lazy: () => import('@/features/crm/pages/CrmInvoicesPage') },
      { path: 'crm/credit-notes', lazy: () => import('@/features/crm/pages/CreditNotesPage') },
      { path: 'crm/subscriptions', lazy: () => import('@/features/crm/pages/CrmSubscriptionsPage') },
      { path: 'crm/product-bundles', lazy: () => import('@/features/crm/pages/ProductBundlesPage') },
      { path: 'crm/reports', lazy: () => import('@/features/crm/pages/CrmReportsPage') },
      { path: 'crm/dashboards', lazy: () => import('@/features/crm/pages/CrmDashboardsPage') },
      { path: 'crm/knowledge-base', lazy: () => import('@/features/crm/pages/CrmKnowledgeBasePage') },
      { path: 'crm/orders', lazy: () => import('@/features/crm/pages/CrmOrdersPage') },
      { path: 'crm/deliveries', lazy: () => import('@/features/crm/pages/CrmDeliveriesPage') },
      { path: 'crm/meetings', lazy: () => import('@/features/crm/pages/CrmMeetingsPage') },
      { path: 'crm/workflows', lazy: () => import('@/features/crm/pages/CrmWorkflowsPage') },
      { path: 'crm/workflow-campaigns', lazy: () => import('@/features/crm/pages/CrmWorkflowCampaignsPage') },
      { path: 'crm/meta-ads', lazy: () => import('@/features/crm/pages/MetaIntegrationPage') },
      { path: 'crm/announcements', lazy: () => import('@/features/crm/pages/AnnouncementsPage') },
      { path: 'crm/process-tasks', lazy: () => import('@/features/crm/pages/ProcessTasksPage') },
      { path: 'crm/event-ingestion', lazy: () => import('@/features/crm/pages/EventIngestionPage') },
      { path: 'crm/nps', lazy: () => import('@/features/crm/pages/CrmNpsPage') },
      { path: 'crm/time-tracking', lazy: () => import('@/features/crm/pages/CrmTimeTrackingPage') },
      { path: 'crm/custom-fields', lazy: () => import('@/features/crm/pages/CustomFieldsPage') },
      { path: 'crm/dedup', lazy: () => import('@/features/crm/pages/CrmDeduplicationPage') },
      { path: 'crm/inbox', lazy: () => import('@/features/crm/pages/SharedInboxPage') },
      { path: 'crm/activity', lazy: () => import('@/features/crm/pages/ActivityFeedPage') },
      { path: 'crm/audit', lazy: () => import('@/features/crm/pages/AuditLogPage') },
      { path: 'crm/notification-settings', lazy: () => import('@/features/crm/pages/NotificationSettingsPage') },
      { path: 'crm/returns', lazy: () => import('@/features/crm/pages/CrmReturnsPage') },
      { path: 'crm/work-orders', lazy: () => import('@/features/crm/pages/CrmWorkOrdersPage') },
      { path: 'crm/customer-onboarding', lazy: () => import('@/features/crm/pages/CrmCustomerOnboardingPage') },
      { path: 'crm/ops-dashboard', lazy: () => import('@/features/crm/pages/CrmOpsDashboardPage') },
      { path: 'crm/time-periods', lazy: () => import('@/features/crm/pages/CrmTimePeriodsPage') },
      { path: 'crm/approval-chains', lazy: () => import('@/features/crm/pages/CrmApprovalChainsPage') },
      { path: 'crm/assignment-rotation', lazy: () => import('@/features/crm/pages/CrmAssignmentRotationPage') },
      { path: 'crm/territories', lazy: () => import('@/features/crm/pages/CrmTerritoriesPage') },
      { path: 'crm/deliveries', lazy: () => import('@/features/crm/pages/CrmDeliveriesPage') },
      { path: 'crm/equipment', lazy: () => import('@/features/crm/pages/CrmEquipmentPage') },
      { path: 'crm/deals-hub', lazy: () => import('@/features/crm/pages/CrmDealsHubPage') },
      { path: 'crm/vendors', lazy: () => import('@/features/crm/pages/VendorsPage') },
      { path: 'crm/purchase-orders', lazy: () => import('@/features/crm/pages/PurchaseOrdersPage') },
      { path: 'crm/goods-receipts', lazy: () => import('@/features/crm/pages/GoodsReceiptsPage') },
      { path: 'crm/supplier-invoices', lazy: () => import('@/features/crm/pages/SupplierInvoicesPage') },
      { path: 'crm/price-books', lazy: () => import('@/features/crm/pages/PriceBooksPage') },
      { path: 'crm/renewals', lazy: () => import('@/features/crm/pages/RenewalsPage') },
      { path: 'crm/contracts', lazy: () => import('@/features/crm/pages/ContractsPage') },

      { path: 'crm/returns', lazy: () => import('@/features/crm/pages/CrmReturnsPage') },
      { path: 'crm/work-orders', lazy: () => import('@/features/crm/pages/CrmWorkOrdersPage') },
      { path: 'crm/customer-onboarding', lazy: () => import('@/features/crm/pages/CrmCustomerOnboardingPage') },
      { path: 'crm/competitors', lazy: () => import('@/features/crm/pages/CompetitorsPage') },
      { path: 'crm/scoring-rules', lazy: () => import('@/features/crm/pages/ScoringRulesPage') },
      { path: 'crm/tax-rules', lazy: () => import('@/features/crm/pages/TaxRulesPage') },
      { path: 'crm/payment-terms', lazy: () => import('@/features/crm/pages/PaymentTermsPage') },
      { path: 'crm/inventory', lazy: () => import('@/features/crm/pages/InventoryPage') },
      { path: 'crm/commissions', lazy: () => import('@/features/crm/pages/CommissionsPage') },
      // ── Flow A/B Experiments ──
      { path: 'flows/experiments', lazy: () => import('@/features/flow-builder/pages/ExperimentsPage') },
      { index: true, element: <Navigate to="chat" replace /> },
      // OLD: { index: true, element: <Navigate to="setup" replace /> },
    ],
  },

  // ─── Campaign reply page — public, no auth ───
  {
    path: '/campaign-reply/:recipientId',
    lazy: () => import('@/features/crm/pages/CampaignReplyPage'),
  },

  // ─── Customer Portal — magic-link auth ───
  {
    path: '/portal/auth',
    element: (
      <RedirectIfPortalAuth>
        <Outlet />
      </RedirectIfPortalAuth>
    ),
    children: [
      { index: true, lazy: () => import('@/features/portal/pages/PortalAuthPage') },
    ],
  },
  {
    path: '/portal',
    element: (
      <RequirePortalAuth>
        <PortalLayout />
      </RequirePortalAuth>
    ),
    children: [
      { path: 'cases', lazy: () => import('@/features/portal/pages/PortalCasesPage') },
      { path: 'cases/new', lazy: () => import('@/features/portal/pages/PortalNewCasePage') },
      { path: 'cases/:id', lazy: () => import('@/features/portal/pages/PortalCaseDetailPage') },
      { path: 'invoices', lazy: () => import('@/features/portal/pages/PortalInvoicesPage') },
      { path: 'orders', lazy: () => import('@/features/portal/pages/PortalOrdersPage') },
      { path: 'subscriptions', lazy: () => import('@/features/portal/pages/PortalSubscriptionsPage') },
      { index: true, element: <Navigate to="cases" replace /> },
    ],
  },

  // ─── Legacy redirects ───
  { path: '/biz/*', element: <Navigate to="/dashboard/chat" replace /> },
  { path: '/tech/*', element: <Navigate to="/dashboard/chat" replace /> },
  // OLD targets pointed to /dashboard/setup before the chat-first pivot.
]);
