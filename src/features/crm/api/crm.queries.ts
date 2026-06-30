import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { crmApi } from './crm.api';
import { getApiError } from '@/shared/lib/get-api-error';
import type {
  LeadFilter,
  LeadStage,
  NurtureSequenceCreateRequest,
  NurtureSequenceUpdateRequest,
  NurtureEnrollmentDto,
  LeadCampaignCreateRequest,
  LeadSegmentFilter,
  CrmContactFilter,
  CrmContactCreateRequest,
  CrmContactUpdateRequest,
  CrmOrganizationFilter,
  CrmOrganizationCreateRequest,
  CrmOrganizationUpdateRequest,
  CrmAccountFilter,
  CrmAccountCreateRequest,
  CrmAccountUpdateRequest,
  AddAccountContactRequest,
  CrmDealStageCreateRequest,
  CrmDealStageUpdateRequest,
  CrmDealFilter,
  CrmDealCreateRequest,
  CrmDealUpdateRequest,
  MoveDealStageRequest,
  CloseDealRequest,
  CrmManualSignalCreateRequest,
  CrmSignalFilter,
  CrmCampaignCreateRequest,
  CrmCampaignUpdateRequest,
  CrmCampaignBudgetUpdateRequest,
  CrmCampaignAttributionCreateRequest,
   FlowExperimentCreateRequest,
   FlowExperimentUpdateRequest,
   ExperimentVariantKind,
   DealStrategyDto,
   ActivityLogRequest,
} from '../types/crm.types';

// ─── Query key constants ──────────────────────────────────────────────────────
const CRM_KEYS = {
  all: ['crm'] as const,
  leads: () => ['crm', 'leads'] as const,
  leadStats: () => ['crm', 'leads', 'stats'] as const,
  leadById: (id: string) => ['crm', 'leads', id] as const,
  leadList: (filter: LeadFilter) => ['crm', 'leads', filter] as const,
  notifications: (page: number) => ['crm', 'notifications', page] as const,
  notificationsAll: () => ['crm', 'notifications'] as const,
  nurture: () => ['crm', 'nurture'] as const,
  leadEnrollments: (leadId: string) => ['crm', 'nurture', 'lead', leadId] as const,
  campaigns: (page: number) => ['crm', 'campaigns', page] as const,
  campaignsAll: () => ['crm', 'campaigns'] as const,
  campaignById: (id: string) => ['crm', 'campaigns', id] as const,
  contacts: () => ['crm', 'contacts'] as const,
  dedup: () => ['crm', 'dedup'] as const,
  contactList: (filter: CrmContactFilter) => ['crm', 'contacts', filter] as const,
  contactById: (id: string) => ['crm', 'contacts', id] as const,
  organizations: () => ['crm', 'organizations'] as const,
  organizationList: (filter: CrmOrganizationFilter) => ['crm', 'organizations', filter] as const,
  organizationById: (id: string) => ['crm', 'organizations', id] as const,
  accounts: () => ['crm', 'accounts'] as const,
  accountList: (filter: CrmAccountFilter) => ['crm', 'accounts', filter] as const,
  accountById: (id: string) => ['crm', 'accounts', id] as const,
  accountContacts: (id: string) => ['crm', 'accounts', id, 'contacts'] as const,
  stageGates: (stageId: string) => ['crm', 'stage-gates', stageId] as const,
  dealGateStatus: (dealId: string) => ['crm', 'deal-gate-status', dealId] as const,
  pipelines: () => ['crm', 'pipelines'] as const,
  pipelineById: (id: string) => ['crm', 'pipelines', id] as const,
  pipelineStages: (id: string) => ['crm', 'pipelines', id, 'stages'] as const,
  dealStages: (params?: { dealType?: number; pipelineId?: string }) => ['crm', 'deal-stages', params] as const,
  deals: () => ['crm', 'deals'] as const,
  dealList: (filter: CrmDealFilter) => ['crm', 'deals', filter] as const,
  dealById: (id: string) => ['crm', 'deals', id] as const,
  timeline: (kind: number, entityId: string) => ['crm', 'timeline', kind, entityId] as const,
  activityFeed: (filter: import('../types/crm.types').CrmActivityFeedFilter) => ['crm', 'activity-feed', filter] as const,
  featureSettings: () => ['crm', 'feature-settings'] as const,
  dealStrategy: (id: string) => ['crm', 'deals', id, 'strategy'] as const,
  signals: (filter: CrmSignalFilter) => ['crm', 'signals', filter] as const,
  crmCampaigns: (page: number) => ['crm', 'crm-campaigns', page] as const,
  crmCampaignsAll: () => ['crm', 'crm-campaigns'] as const,
  crmCampaignById: (id: string) => ['crm', 'crm-campaigns', id] as const,
  crmCampaignRecipients: (id: string) => ['crm', 'crm-campaigns', id, 'recipients'] as const,
  analytics: {
    pipeline: () => ['crm', 'analytics', 'pipeline'] as const,
    deals: () => ['crm', 'analytics', 'deals'] as const,
    contacts: () => ['crm', 'analytics', 'contacts'] as const,
    campaigns: () => ['crm', 'analytics', 'campaigns'] as const,
    revenue: () => ['crm', 'analytics', 'revenue'] as const,
    activity: () => ['crm', 'analytics', 'activity'] as const,
    velocity: () => ['crm', 'analytics', 'velocity'] as const,
    leadFunnel: () => ['crm', 'analytics', 'lead-funnel'] as const,
    nurture: () => ['crm', 'analytics', 'nurture'] as const,
  },
  contactEnrollments: (contactId: string) => ['crm', 'contact-enrollments', contactId] as const,
  experiments: () => ['crm', 'experiments'] as const,
  experimentById: (id: string) => ['crm', 'experiments', id] as const,
  supportCases: () => ['crm', 'support-cases'] as const,
  supportCaseById: (id: string) => ['crm', 'support-cases', id] as const,
  slaPolicies: () => ['crm', 'sla-policies'] as const,
  tasks: () => ['crm', 'tasks'] as const,
  taskById: (id: string) => ['crm', 'tasks', id] as const,
  quotes: () => ['crm', 'quotes'] as const,
  quoteById: (id: string) => ['crm', 'quotes', id] as const,
  proposals: () => ['crm', 'proposals'] as const,
  proposalById: (id: string) => ['crm', 'proposals', id] as const,
  proposalTemplates: () => ['crm', 'proposal-templates'] as const,
  invoices: () => ['crm', 'invoices'] as const,
  invoiceById: (id: string) => ['crm', 'invoices', id] as const,
  subscriptions: () => ['crm', 'subscriptions'] as const,
  subscriptionById: (id: string) => ['crm', 'subscriptions', id] as const,
  orders: () => ['crm', 'orders'] as const,
  orderById: (id: string) => ['crm', 'orders', id] as const,
  deliveries: (orderId: string) => ['crm', 'orders', orderId, 'deliveries'] as const,
  meetings: () => ['crm', 'meetings'] as const,
  meetingById: (id: string) => ['crm', 'meetings', id] as const,
  callSummaries: () => ['crm', 'call-summaries'] as const,
  callSummaryById: (id: string) => ['crm', 'call-summaries', id] as const,
  nps: () => ['crm', 'nps'] as const,
  npsSummary: () => ['crm', 'nps', 'summary'] as const,
  timeEntries: () => ['crm', 'time-entries'] as const,
  timeSummary: () => ['crm', 'time-entries', 'summary'] as const,
  comments: (kind: number, entityId: string) => ['crm', 'comments', kind, entityId] as const,
  workflows: () => ['crm', 'workflows'] as const,
  workflowTriggerDefinitions: () => ['crm', 'workflows', 'trigger-definitions'] as const,
  workflowById: (id: string) => ['crm', 'workflows', id] as const,
  workflowExecutions: (id: string) => ['crm', 'workflows', id, 'executions'] as const,
  workflowCampaigns: () => ['crm', 'workflow-campaigns'] as const,
  workflowCampaignById: (id: string) => ['crm', 'workflow-campaigns', id] as const,
  aiActions: () => ['crm', 'ai-actions'] as const,
  aiActionsPending: () => ['crm', 'ai-actions', 'pending'] as const,
  fbAdAccount: () => ['crm', 'fb-ads', 'account'] as const,
  fbAdCampaigns: () => ['crm', 'fb-ads', 'campaigns'] as const,
  fbAdAggregate: () => ['crm', 'fb-ads', 'aggregate'] as const,
  announcements: (status?: number) => ['announcements', status] as const,
  announcementById: (id: string) => ['announcements', id] as const,
  approvals: (status?: number) => ['crm', 'approvals', status] as const,
  approvalsPending: () => ['crm', 'approvals', 'pending'] as const,
  approvalById: (id: string) => ['crm', 'approvals', id] as const,
  approvalForEntity: (entityType: number, entityId: string) => ['crm', 'approvals', 'entity', entityType, entityId] as const,
  vendors: () => ['crm', 'vendors'] as const,
  vendorById: (id: string) => ['crm', 'vendors', id] as const,
  activeVendors: () => ['crm', 'vendors', 'active'] as const,
  purchaseOrders: () => ['crm', 'purchase-orders'] as const,
  purchaseOrderById: (id: string) => ['crm', 'purchase-orders', id] as const,
  goodsReceipts: () => ['crm', 'goods-receipts'] as const,
  goodsReceiptById: (id: string) => ['crm', 'goods-receipts', id] as const,
  supplierInvoices: () => ['crm', 'supplier-invoices'] as const,
  supplierInvoiceById: (id: string) => ['crm', 'supplier-invoices', id] as const,
  overdueSupplierInvoices: () => ['crm', 'supplier-invoices', 'overdue'] as const,
} as const;

// ─── Leads ────────────────────────────────────────────────────────────────────

export function useLeads(filter: LeadFilter = {}) {
  return useQuery({
    queryKey: CRM_KEYS.leadList(filter),
    queryFn: () => crmApi.getLeads(filter),
  });
}

export function useLeadStats() {
  return useQuery({
    queryKey: CRM_KEYS.leadStats(),
    queryFn: () => crmApi.getLeadStats(),
  });
}

export function useLeadById(id: string | undefined) {
  return useQuery({
    queryKey: CRM_KEYS.leadById(id ?? ''),
    queryFn: () => crmApi.getLeadById(id!),
    enabled: !!id,
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: import('../types/crm.types').CreateManualLeadRequest) => crmApi.createLead(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CRM_KEYS.leads() });
      queryClient.invalidateQueries({ queryKey: CRM_KEYS.leadStats() });
      queryClient.invalidateQueries({ queryKey: CRM_KEYS.contacts() });
      toast.success('Lead and contact created');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Failed to create lead');
    },
  });
}

export function useUpdateLeadStage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, stage, reason }: { id: string; stage: LeadStage; reason?: string }) =>
      crmApi.updateLeadStage(id, stage, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CRM_KEYS.leads() });
      toast.success('Lead stage updated.');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Something went wrong.');
    },
  });
}

export function useConvertLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: import('../types/crm.types').ConvertLeadRequest }) =>
      crmApi.convertLead(id, data),
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: CRM_KEYS.leadById(id) });
      qc.invalidateQueries({ queryKey: CRM_KEYS.leads() });
      qc.invalidateQueries({ queryKey: CRM_KEYS.deals() });
      toast.success('Lead converted — Contact and Deal created.');
    },
    onError: (err: any) => toast.error(err?.message || 'Conversion failed.'),
  });
}

export function useAssignLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, userId }: { id: string; userId: string | null }) =>
      crmApi.assignLead(id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CRM_KEYS.leads() });
      toast.success('Lead assigned.');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Something went wrong.');
    },
  });
}

export function useBulkLeadAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: import('../types/crm.types').BulkLeadActionRequest) =>
      crmApi.bulkLeadAction(req),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: CRM_KEYS.leads() });
      queryClient.invalidateQueries({ queryKey: CRM_KEYS.leadStats() });
      const r = (res ?? {}) as import('../types/crm.types').BulkLeadActionResult;
      const skipped = r.skipped ? `, ${r.skipped} skipped` : '';
      toast.success(`${r.succeeded ?? 0} lead(s) updated${skipped}.`);
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Bulk action failed.');
    },
  });
}

export function useAddNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) =>
      crmApi.addNote(id, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CRM_KEYS.leads() });
      toast.success('Note added.');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Something went wrong.');
    },
  });
}

// ─── Notifications ────────────────────────────────────────────────────────────

export function useNotifications(page = 1) {
  return useQuery({
    queryKey: CRM_KEYS.notifications(page),
    queryFn: () => crmApi.getNotifications(page),
  });
}

export function useMarkRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CRM_KEYS.notificationsAll() });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Something went wrong.');
    },
  });
}

export function useMarkAllRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => crmApi.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CRM_KEYS.notificationsAll() });
      toast.success('All notifications marked as read.');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Something went wrong.');
    },
  });
}

// ─── Nurture Sequences ────────────────────────────────────────────────────────

export function useNurtureSequences() {
  return useQuery({
    queryKey: CRM_KEYS.nurture(),
    queryFn: () => crmApi.getNurtureSequences(),
  });
}

export function useCreateNurtureSequence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: NurtureSequenceCreateRequest) =>
      crmApi.createNurtureSequence(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CRM_KEYS.nurture() });
      toast.success('Nurture sequence created.');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Something went wrong.');
    },
  });
}

export function useUpdateNurtureSequence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: NurtureSequenceUpdateRequest }) =>
      crmApi.updateNurtureSequence(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CRM_KEYS.nurture() });
      toast.success('Nurture sequence updated.');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Something went wrong.');
    },
  });
}

export function useDeleteNurtureSequence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmApi.deleteNurtureSequence(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CRM_KEYS.nurture() });
      toast.success('Sequence deleted.');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Something went wrong.');
    },
  });
}

export function useEnrollLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sequenceId, leadId }: { sequenceId: string; leadId: string }) =>
      crmApi.enrollLead(sequenceId, leadId),
    onSuccess: (_data, { leadId }) => {
      queryClient.invalidateQueries({ queryKey: CRM_KEYS.leads() });
      queryClient.invalidateQueries({ queryKey: CRM_KEYS.leadEnrollments(leadId) });
      toast.success('Lead enrolled.');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Something went wrong.');
    },
  });
}

export function useLeadEnrollments(leadId: string) {
  return useQuery({
    queryKey: CRM_KEYS.leadEnrollments(leadId),
    queryFn: () => crmApi.getLeadEnrollments(leadId),
    enabled: !!leadId,
    select: (data) => data as unknown as NurtureEnrollmentDto[],
  });
}

// ─── Campaigns ────────────────────────────────────────────────────────────────

export function useCampaigns(page = 1) {
  return useQuery({
    queryKey: CRM_KEYS.campaigns(page),
    queryFn: () => crmApi.getCampaigns(page),
  });
}

export function useCampaignById(id: string | undefined) {
  return useQuery({
    queryKey: CRM_KEYS.campaignById(id ?? ''),
    queryFn: () => crmApi.getCampaignById(id!),
    enabled: !!id,
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: LeadCampaignCreateRequest) => crmApi.createCampaign(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CRM_KEYS.campaignsAll() });
      toast.success('Campaign created.');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Something went wrong.');
    },
  });
}

export function usePreviewSegment() {
  return useMutation({
    mutationFn: (filter: LeadSegmentFilter) => crmApi.previewSegment(filter),
    onError: (err: any) => {
      toast.error(err?.message || 'Something went wrong.');
    },
  });
}

export function useExecuteCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmApi.executeCampaign(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CRM_KEYS.campaignsAll() });
      toast.success('Campaign launched.');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Something went wrong.');
    },
  });
}

// ─── Contacts ─────────────────────────────────────────────────────────────────

export function useContacts(filter: CrmContactFilter = {}) {
  return useQuery({
    queryKey: CRM_KEYS.contactList(filter),
    queryFn: () => crmApi.getContacts(filter),
  });
}

export function useContactById(id: string | undefined) {
  return useQuery({
    queryKey: CRM_KEYS.contactById(id ?? ''),
    queryFn: () => crmApi.getContactById(id!),
    enabled: !!id,
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CrmContactCreateRequest) => crmApi.createContact(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CRM_KEYS.contacts() });
      toast.success('Contact created.');
    },
    onError: (err: unknown) => {
      const { message, errors } = getApiError(err, 'Failed to create contact.');
      toast.error(errors.length ? `${message}: ${errors.join(', ')}` : message);
    },
  });
}

/**
 * Real-time duplicate check for the contact create flow. Enabled only when an email or phone is
 * present; debounce in the calling component. Returns existing contacts/leads that match.
 */
export function useFindContactDuplicates(email?: string, phone?: string) {
  const e = email?.trim() || undefined;
  const p = phone?.trim() || undefined;
  return useQuery({
    queryKey: ['crm', 'contact-duplicates', e ?? '', p ?? ''],
    queryFn: () => crmApi.findContactDuplicates(e, p),
    enabled: !!(e || p),
    staleTime: 10_000,
  });
}

// ── Contracts (CLM) ─────────────────────────────────────────────────────────────
const CONTRACT_KEY = ['crm', 'contracts'] as const;

export function useContracts(params?: { status?: number; accountId?: string }) {
  return useQuery({ queryKey: [...CONTRACT_KEY, params ?? {}], queryFn: () => crmApi.getContracts(params) });
}
export function useCreateContract() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (d: import('../types/crm.types').CrmContractCreateRequest) => crmApi.createContract(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: CONTRACT_KEY }); toast.success('Contract created.'); },
    onError: (err: unknown) => toast.error(getApiError(err, 'Failed to create contract.').message),
  });
}
export function useUpdateContractStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: number }) => crmApi.updateContractStatus(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: CONTRACT_KEY }); toast.success('Contract updated.'); },
    onError: (err: unknown) => toast.error(getApiError(err).message),
  });
}
export function useDeleteContract() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmApi.deleteContract(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: CONTRACT_KEY }); toast.success('Contract deleted.'); },
    onError: (err: unknown) => toast.error(getApiError(err).message),
  });
}
export function useGenerateInvoicePaymentLink() {
  return useMutation({
    mutationFn: (id: string) => crmApi.generateInvoicePaymentLink(id),
    onError: (err: unknown) => toast.error(getApiError(err, 'Could not create payment link.').message),
  });
}

// ── Business Catalog Items ──────────────────────────────────────────────────────
const CATALOG_ITEMS_KEY = ['crm', 'catalog-items'] as const;
export function useCatalogItems() {
  return useQuery({ queryKey: CATALOG_ITEMS_KEY, queryFn: () => crmApi.getCatalogItems() });
}

// ── CPQ Price Books ─────────────────────────────────────────────────────────────
const PRICEBOOK_KEY = ['crm', 'price-books'] as const;

export function usePriceBooks() {
  return useQuery({ queryKey: PRICEBOOK_KEY, queryFn: () => crmApi.getPriceBooks() });
}
export function usePriceBook(id: string | undefined) {
  return useQuery({
    queryKey: [...PRICEBOOK_KEY, id],
    queryFn: () => crmApi.getPriceBookById(id!),
    enabled: !!id,
  });
}
function priceBookMutation<TArgs>(fn: (a: TArgs) => Promise<unknown>, okMsg: string) {
  return () => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: fn,
      onSuccess: () => { qc.invalidateQueries({ queryKey: PRICEBOOK_KEY }); toast.success(okMsg); },
      onError: (err: unknown) => toast.error(getApiError(err).message),
    });
  };
}
export const useCreatePriceBook = priceBookMutation(
  (d: import('../types/crm.types').CrmPriceBookCreateRequest) => crmApi.createPriceBook(d), 'Price book created.');
export const useUpdatePriceBook = priceBookMutation(
  (d: { id: string; data: Partial<import('../types/crm.types').CrmPriceBookDto> }) => crmApi.updatePriceBook(d.id, d.data), 'Price book updated.');
export const useDeletePriceBook = priceBookMutation((id: string) => crmApi.deletePriceBook(id), 'Price book deleted.');
export const useAddPriceBookEntry = priceBookMutation(
  (a: { id: string; data: import('../types/crm.types').CrmPriceBookEntryRequest }) => crmApi.addPriceBookEntry(a.id, a.data),
  'Entry added.');
export const useUpdatePriceBookEntry = priceBookMutation(
  (a: { entryId: string; data: import('../types/crm.types').CrmPriceBookEntryRequest }) => crmApi.updatePriceBookEntry(a.entryId, a.data),
  'Entry updated.');
export const useDeletePriceBookEntry = priceBookMutation((entryId: string) => crmApi.deletePriceBookEntry(entryId), 'Entry removed.');

// ── CPQ Product Bundles ─────────────────────────────────────────────────────────
const BUNDLE_KEY = ['crm', 'product-bundles'] as const;

export function useProductBundles() {
  return useQuery({ queryKey: BUNDLE_KEY, queryFn: () => crmApi.getProductBundles() });
}
export function useProductBundle(id: string | undefined) {
  return useQuery({
    queryKey: [...BUNDLE_KEY, id],
    queryFn: () => crmApi.getProductBundleById(id!),
    enabled: !!id,
  });
}
function bundleMutation<TArgs>(fn: (a: TArgs) => Promise<unknown>, okMsg: string) {
  return () => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: fn,
      onSuccess: () => { qc.invalidateQueries({ queryKey: BUNDLE_KEY }); toast.success(okMsg); },
      onError: (err: unknown) => toast.error(getApiError(err).message),
    });
  };
}
export const useCreateProductBundle = bundleMutation(
  (d: import('../types/crm.types').CrmProductBundleCreateRequest) => crmApi.createProductBundle(d), 'Bundle created.');
export const useDeleteProductBundle = bundleMutation((id: string) => crmApi.deleteProductBundle(id), 'Bundle deleted.');
export const useAddProductBundleItem = bundleMutation(
  (a: { id: string; data: import('../types/crm.types').CrmProductBundleItemRequest }) => crmApi.addProductBundleItem(a.id, a.data),
  'Item added.');
export const useDeleteProductBundleItem = bundleMutation((itemId: string) => crmApi.deleteProductBundleItem(itemId), 'Item removed.');

// ── Renewals ───────────────────────────────────────────────────────────────────
const RENEWAL_KEY = ['crm', 'renewals'] as const;

export function useRenewals(filter: import('../types/crm.types').CrmRenewalFilter = {}) {
  return useQuery({
    queryKey: [...RENEWAL_KEY, filter],
    queryFn: () => crmApi.getRenewals(filter),
  });
}

export function useInitiateRenewalOutreach() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmApi.initiateRenewalOutreach(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: RENEWAL_KEY });
      toast.success('Renewal outreach sent.');
    },
    onError: (err: unknown) => toast.error(getApiError(err, 'Failed to send outreach.').message),
  });
}

export function useRecordRenewalOutcome() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: import('../types/crm.types').CrmRenewalOutcomeRequest }) =>
      crmApi.recordRenewalOutcome(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: RENEWAL_KEY });
      toast.success('Outcome recorded.');
    },
    onError: (err: unknown) => toast.error(getApiError(err, 'Failed to record outcome.').message),
  });
}

export function useEvaluateRenewals() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => crmApi.evaluateRenewals(),
    onSuccess: (n) => {
      qc.invalidateQueries({ queryKey: RENEWAL_KEY });
      toast.success(`Evaluated ${n ?? 0} renewal${n === 1 ? '' : 's'}.`);
    },
    onError: (err: unknown) => toast.error(getApiError(err, 'Evaluation failed.').message),
  });
}

export function useUpdateContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CrmContactUpdateRequest }) =>
      crmApi.updateContact(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CRM_KEYS.contacts() });
      toast.success('Contact updated.');
    },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmApi.deleteContact(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CRM_KEYS.contacts() });
      toast.success('Contact deleted.');
    },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}

export function useBulkDeleteContacts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => crmApi.bulkDeleteContacts(ids),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: CRM_KEYS.contacts() });
      const r = (res ?? {}) as import('../types/crm.types').CrmBulkResult;
      const skipped = r.skipped ? `, ${r.skipped} skipped` : '';
      toast.success(`${r.succeeded ?? 0} contact(s) deleted${skipped}.`);
    },
    onError: (err: any) => toast.error(err?.message || 'Bulk delete failed.'),
  });
}

export function useSetContactLanguage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, language }: { id: string; language: string | null }) =>
      crmApi.setContactLanguage(id, language),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: CRM_KEYS.contactById(id) });
      toast.success('Language preference saved.');
    },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}

// ─── Organizations ────────────────────────────────────────────────────────────

export function useOrganizations(filter: CrmOrganizationFilter = {}) {
  return useQuery({
    queryKey: CRM_KEYS.organizationList(filter),
    queryFn: () => crmApi.getOrganizations(filter),
  });
}

export function useOrganizationById(id: string | undefined) {
  return useQuery({
    queryKey: CRM_KEYS.organizationById(id ?? ''),
    queryFn: () => crmApi.getOrganizationById(id!),
    enabled: !!id,
  });
}

export function useCreateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CrmOrganizationCreateRequest) => crmApi.createOrganization(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CRM_KEYS.organizations() });
      toast.success('Organization created.');
    },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CrmOrganizationUpdateRequest }) =>
      crmApi.updateOrganization(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CRM_KEYS.organizations() });
      toast.success('Organization updated.');
    },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}

export function useDeleteOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmApi.deleteOrganization(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CRM_KEYS.organizations() });
      toast.success('Organization deleted.');
    },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}

// ─── Accounts ─────────────────────────────────────────────────────────────────

export function useAccounts(filter: CrmAccountFilter = {}) {
  return useQuery({
    queryKey: CRM_KEYS.accountList(filter),
    queryFn: () => crmApi.getAccounts(filter),
  });
}

export function useAccountById(id: string | undefined) {
  return useQuery({
    queryKey: CRM_KEYS.accountById(id ?? ''),
    queryFn: () => crmApi.getAccountById(id!),
    enabled: !!id,
  });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CrmAccountCreateRequest) => crmApi.createAccount(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CRM_KEYS.accounts() });
      toast.success('Account created.');
    },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CrmAccountUpdateRequest }) =>
      crmApi.updateAccount(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CRM_KEYS.accounts() });
      toast.success('Account updated.');
    },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmApi.deleteAccount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CRM_KEYS.accounts() });
      toast.success('Account deleted.');
    },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}

export function useAccountContacts(id: string | undefined) {
  return useQuery({
    queryKey: CRM_KEYS.accountContacts(id ?? ''),
    queryFn: () => crmApi.getAccountContacts(id!),
    enabled: !!id,
  });
}

export function useAddAccountContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ accountId, data }: { accountId: string; data: AddAccountContactRequest }) =>
      crmApi.addAccountContact(accountId, data),
    onSuccess: (_data, { accountId }) => {
      queryClient.invalidateQueries({ queryKey: CRM_KEYS.accountContacts(accountId) });
      toast.success('Contact linked to account.');
    },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}

export function useRemoveAccountContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ accountId, linkId }: { accountId: string; linkId: string }) =>
      crmApi.removeAccountContact(accountId, linkId),
    onSuccess: (_data, { accountId }) => {
      queryClient.invalidateQueries({ queryKey: CRM_KEYS.accountContacts(accountId) });
      toast.success('Contact removed from account.');
    },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}

// ─── Stage Exit Gates ─────────────────────────────────────────────────────────

export function useStageGates(stageId: string | undefined) {
  return useQuery({
    queryKey: CRM_KEYS.stageGates(stageId ?? ''),
    queryFn: () => crmApi.getStageGates(stageId!),
    enabled: !!stageId,
  });
}

export function useCreateStageGate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ stageId, data }: { stageId: string; data: import('../types/crm.types').CrmStageGateCreateRequest }) =>
      crmApi.createStageGate(stageId, data),
    onSuccess: (_, { stageId }) => {
      queryClient.invalidateQueries({ queryKey: CRM_KEYS.stageGates(stageId) });
      toast.success('Gate added.');
    },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}

export function useUpdateStageGate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ gateId, stageId, data }: { gateId: string; stageId: string; data: import('../types/crm.types').CrmStageGateUpdateRequest }) =>
      crmApi.updateStageGate(gateId, data),
    onSuccess: (_, { stageId }) => {
      queryClient.invalidateQueries({ queryKey: CRM_KEYS.stageGates(stageId) });
      toast.success('Gate updated.');
    },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}

export function useDeleteStageGate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ gateId, stageId }: { gateId: string; stageId: string }) =>
      crmApi.deleteStageGate(gateId),
    onSuccess: (_, { stageId }) => {
      queryClient.invalidateQueries({ queryKey: CRM_KEYS.stageGates(stageId) });
      toast.success('Gate removed.');
    },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}

export function useDealGateStatus(dealId: string | undefined) {
  return useQuery({
    queryKey: CRM_KEYS.dealGateStatus(dealId ?? ''),
    queryFn: () => crmApi.getDealGateStatus(dealId!),
    enabled: !!dealId,
  });
}

export function useToggleGateCheck() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ dealId, gateId, isChecked }: { dealId: string; gateId: string; isChecked: boolean }) =>
      crmApi.toggleGateCheck(dealId, gateId, isChecked),
    onSuccess: (_, { dealId }) => {
      queryClient.invalidateQueries({ queryKey: CRM_KEYS.dealGateStatus(dealId) });
    },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}

// ─── Pipelines ────────────────────────────────────────────────────────────────

export function usePipelines() {
  return useQuery({
    queryKey: CRM_KEYS.pipelines(),
    queryFn: () => crmApi.getPipelines(),
  });
}

export function usePipelineById(id: string) {
  return useQuery({
    queryKey: CRM_KEYS.pipelineById(id),
    queryFn: () => crmApi.getPipelineById(id),
    enabled: !!id,
  });
}

export function usePipelineStages(pipelineId: string) {
  return useQuery({
    queryKey: CRM_KEYS.pipelineStages(pipelineId),
    queryFn: () => crmApi.getPipelineStages(pipelineId),
    enabled: !!pipelineId,
  });
}

export function useCreatePipeline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: import('../types/crm.types').CrmPipelineCreateRequest) => crmApi.createPipeline(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CRM_KEYS.pipelines() });
      toast.success('Pipeline created.');
    },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}

export function useUpdatePipeline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: import('../types/crm.types').CrmPipelineUpdateRequest }) =>
      crmApi.updatePipeline(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: CRM_KEYS.pipelines() });
      queryClient.invalidateQueries({ queryKey: CRM_KEYS.pipelineById(id) });
      toast.success('Pipeline updated.');
    },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}

export function useDeletePipeline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmApi.deletePipeline(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CRM_KEYS.pipelines() });
      toast.success('Pipeline deleted.');
    },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}

export function useSetPipelineDefault() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmApi.setPipelineDefault(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CRM_KEYS.pipelines() });
      toast.success('Default pipeline updated.');
    },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}

// ─── Deal Stages ──────────────────────────────────────────────────────────────

export function useDealStages(params?: { dealType?: number; pipelineId?: string }) {
  return useQuery({
    queryKey: CRM_KEYS.dealStages(params),
    queryFn: () => crmApi.getDealStages(params),
  });
}

export function useCreateDealStage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CrmDealStageCreateRequest) => crmApi.createDealStage(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm', 'deal-stages'] });
      toast.success('Stage created.');
    },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}

export function useUpdateDealStage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CrmDealStageUpdateRequest }) =>
      crmApi.updateDealStage(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm', 'deal-stages'] });
      toast.success('Stage updated.');
    },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}

export function useDeleteDealStage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmApi.deleteDealStage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm', 'deal-stages'] });
      toast.success('Stage deleted.');
    },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}

// ─── Deals ────────────────────────────────────────────────────────────────────

export function useDeals(filter: CrmDealFilter = {}) {
  return useQuery({
    queryKey: CRM_KEYS.dealList(filter),
    queryFn: () => crmApi.getDeals(filter),
  });
}

export function useContactDeals(contactId: string | undefined) {
  return useQuery({
    queryKey: ['crm', 'contact-deals', contactId],
    queryFn: () => crmApi.getDeals({ contactId, pageSize: 50 }),
    enabled: !!contactId,
  });
}

export function useDealById(id: string | undefined) {
  return useQuery({
    queryKey: CRM_KEYS.dealById(id ?? ''),
    queryFn: () => crmApi.getDealById(id!),
    enabled: !!id,
  });
}

export function useCreateDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CrmDealCreateRequest) => crmApi.createDeal(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CRM_KEYS.deals() });
      toast.success('Deal created.');
    },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}

export function useUpdateDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CrmDealUpdateRequest }) =>
      crmApi.updateDeal(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CRM_KEYS.deals() });
      toast.success('Deal updated.');
    },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}

export function useDeleteDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmApi.deleteDeal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CRM_KEYS.deals() });
      toast.success('Deal deleted.');
    },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}

export function useBulkDeleteDeals() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => crmApi.bulkDeleteDeals(ids),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: CRM_KEYS.deals() });
      const r = (res ?? {}) as import('../types/crm.types').CrmBulkResult;
      const skipped = r.skipped ? `, ${r.skipped} skipped` : '';
      toast.success(`${r.succeeded ?? 0} deal(s) deleted${skipped}.`);
    },
    onError: (err: any) => toast.error(err?.message || 'Bulk delete failed.'),
  });
}

export function useMoveDealStage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: MoveDealStageRequest }) =>
      crmApi.moveDealStage(id, data),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: CRM_KEYS.dealById(id) });
      queryClient.invalidateQueries({ queryKey: CRM_KEYS.deals() });
      toast.success('Deal stage updated.');
    },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}

export function useCloseDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CloseDealRequest }) =>
      crmApi.closeDeal(id, data),
    onSuccess: (_data, { data }) => {
      queryClient.invalidateQueries({ queryKey: CRM_KEYS.deals() });
      toast.success(data.isWon ? 'Deal marked as won.' : 'Deal marked as lost.');
    },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}

export function useRefreshDealSummary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmApi.refreshDealSummary(id),
    onSuccess: (_data, id) => qc.invalidateQueries({ queryKey: CRM_KEYS.dealById(id) }),
    onError: (err: any) => toast.error(err?.message || 'Failed to generate summary.'),
  });
}

// ─── Activity Timeline ─────────────────────────────────────────────────────────
export function useTimeline(kind: number, entityId: string | undefined) {
  return useQuery({
    queryKey: CRM_KEYS.timeline(kind, entityId ?? ''),
    queryFn: () => crmApi.getTimeline(kind, entityId!),
    enabled: !!entityId,
  });
}
export function useFeatureSettings() {
  return useQuery({
    queryKey: CRM_KEYS.featureSettings(),
    queryFn: () => crmApi.getFeatureSettings(),
    staleTime: 30_000,
  });
}

export function useUpdateFeatureSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (settings: import('../types/crm.types').TenantFeatureSettings) =>
      crmApi.updateFeatureSettings(settings),
    onSuccess: (data: any) => {
      queryClient.setQueryData(CRM_KEYS.featureSettings(), data);
      toast.success('Feature settings saved.');
    },
    onError: (err: any) => toast.error(err?.message || 'Could not save settings.'),
  });
}

export function useActivityFeed(filter: import('../types/crm.types').CrmActivityFeedFilter) {
  return useQuery({
    queryKey: CRM_KEYS.activityFeed(filter),
    queryFn: () => crmApi.getActivityFeed(filter),
    placeholderData: (prev) => prev,
  });
}
export function useLogActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ActivityLogRequest) => crmApi.logActivity(data),
    onSuccess: (_d, req) => { qc.invalidateQueries({ queryKey: CRM_KEYS.timeline(req.entityKind, req.entityId) }); toast.success('Activity logged.'); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}

// ─── Deal Strategy ─────────────────────────────────────────────────────────────
export function useDealStrategy(id: string | undefined) {
  return useQuery({
    queryKey: CRM_KEYS.dealStrategy(id ?? ''),
    queryFn: () => crmApi.getDealStrategy(id!),
    enabled: !!id,
  });
}
export function useUpdateDealStrategy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: DealStrategyDto }) => crmApi.updateDealStrategy(id, data),
    onSuccess: (_d, { id }) => { qc.invalidateQueries({ queryKey: CRM_KEYS.dealStrategy(id) }); toast.success('Strategy saved.'); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}

// ─── Signals ──────────────────────────────────────────────────────────────────

export function useSignals(filter: CrmSignalFilter = {}) {
  return useQuery({
    queryKey: CRM_KEYS.signals(filter),
    queryFn: () => crmApi.getSignals(filter),
  });
}

export function useCreateSignal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CrmManualSignalCreateRequest) => crmApi.createSignal(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm', 'signals'] });
      toast.success('Signal logged.');
    },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}

// ─── CRM Analytics ────────────────────────────────────────────────────────────

export function usePipelineAnalytics() {
  return useQuery({ queryKey: CRM_KEYS.analytics.pipeline(), queryFn: () => crmApi.getPipelineAnalytics() });
}

export function useDealStatsAnalytics() {
  return useQuery({ queryKey: CRM_KEYS.analytics.deals(), queryFn: () => crmApi.getDealStats() });
}

export function useContactStatsAnalytics() {
  return useQuery({ queryKey: CRM_KEYS.analytics.contacts(), queryFn: () => crmApi.getContactStats() });
}

export function useCampaignAnalytics() {
  return useQuery({ queryKey: CRM_KEYS.analytics.campaigns(), queryFn: () => crmApi.getCampaignAnalytics() });
}

export function useRevenueAnalytics() {
  return useQuery({ queryKey: CRM_KEYS.analytics.revenue(), queryFn: () => crmApi.getRevenueAnalytics() });
}

export function useActivityAnalytics() {
  return useQuery({ queryKey: CRM_KEYS.analytics.activity(), queryFn: () => crmApi.getActivityAnalytics() });
}

export function useVelocityAnalytics() {
  return useQuery({ queryKey: CRM_KEYS.analytics.velocity(), queryFn: () => crmApi.getVelocityAnalytics() });
}

export function useLeadFunnelAnalytics() {
  return useQuery({ queryKey: CRM_KEYS.analytics.leadFunnel(), queryFn: () => crmApi.getLeadFunnelAnalytics() });
}

export function useNurtureAnalytics() {
  return useQuery({ queryKey: CRM_KEYS.analytics.nurture(), queryFn: () => crmApi.getNurtureAnalytics() });
}

// ─── Flow A/B Experiments ─────────────────────────────────────────────────────

export function useExperiments() {
  return useQuery({
    queryKey: CRM_KEYS.experiments(),
    queryFn: () => crmApi.getExperiments(),
  });
}

export function useExperimentById(id: string | undefined) {
  return useQuery({
    queryKey: CRM_KEYS.experimentById(id ?? ''),
    queryFn: () => crmApi.getExperimentById(id!),
    enabled: !!id,
  });
}

export function useCreateExperiment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: FlowExperimentCreateRequest) => crmApi.createExperiment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CRM_KEYS.experiments() });
      toast.success('Experiment created.');
    },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}

export function useUpdateExperiment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: FlowExperimentUpdateRequest }) =>
      crmApi.updateExperiment(id, data),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: CRM_KEYS.experimentById(id) });
      queryClient.invalidateQueries({ queryKey: CRM_KEYS.experiments() });
      toast.success('Experiment updated.');
    },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}

export function useDeleteExperiment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmApi.deleteExperiment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CRM_KEYS.experiments() });
      toast.success('Experiment deleted.');
    },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}

export function useStartExperiment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmApi.startExperiment(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: CRM_KEYS.experimentById(id) });
      queryClient.invalidateQueries({ queryKey: CRM_KEYS.experiments() });
      toast.success('Experiment started.');
    },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}

export function usePauseExperiment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmApi.pauseExperiment(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: CRM_KEYS.experimentById(id) });
      queryClient.invalidateQueries({ queryKey: CRM_KEYS.experiments() });
      toast.success('Experiment paused.');
    },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}

export function useResumeExperiment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmApi.resumeExperiment(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: CRM_KEYS.experimentById(id) });
      queryClient.invalidateQueries({ queryKey: CRM_KEYS.experiments() });
      toast.success('Experiment resumed.');
    },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}

export function useCompleteExperiment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmApi.completeExperiment(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: CRM_KEYS.experimentById(id) });
      queryClient.invalidateQueries({ queryKey: CRM_KEYS.experiments() });
      toast.success('Experiment completed.');
    },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}

export function useDeclareExperimentWinner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, winner }: { id: string; winner: ExperimentVariantKind }) =>
      crmApi.declareExperimentWinner(id, winner),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: CRM_KEYS.experimentById(id) });
      queryClient.invalidateQueries({ queryKey: CRM_KEYS.experiments() });
      toast.success('Winner declared.');
    },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}

// ─── CRM Nurture (B2B contacts — Phase 3C) ────────────────────────────────────

export function useCrmContactEnrollments(contactId: string) {
  return useQuery({
    queryKey: CRM_KEYS.contactEnrollments(contactId),
    queryFn: () => crmApi.getCrmContactEnrollments(contactId),
    enabled: !!contactId,
  });
}

export function useEnrollCrmContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ contactId, sequenceId }: { contactId: string; sequenceId: string }) =>
      crmApi.enrollCrmContact(contactId, sequenceId),
    onSuccess: (_data, { contactId }) => {
      queryClient.invalidateQueries({ queryKey: CRM_KEYS.contactEnrollments(contactId) });
      toast.success('Contact enrolled in sequence.');
    },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}

export function useCancelCrmContactEnrollments() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (contactId: string) => crmApi.cancelCrmContactEnrollments(contactId),
    onSuccess: (_data, contactId) => {
      queryClient.invalidateQueries({ queryKey: CRM_KEYS.contactEnrollments(contactId) });
      toast.success('Enrollments cancelled.');
    },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}

// ─── CRM B2B Campaigns ────────────────────────────────────────────────────────

export function useCrmCampaigns() {
  return useQuery({
    queryKey: CRM_KEYS.crmCampaignsAll(),
    queryFn: () => crmApi.getCrmCampaigns(),
  });
}

export function useCrmCampaignById(id: string | undefined) {
  return useQuery({
    queryKey: CRM_KEYS.crmCampaignById(id ?? ''),
    queryFn: () => crmApi.getCrmCampaignById(id!),
    enabled: !!id,
  });
}

export function useCreateCrmCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CrmCampaignCreateRequest) => crmApi.createCrmCampaign(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CRM_KEYS.crmCampaignsAll() });
      toast.success('Campaign created.');
    },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}

export function useUpdateCrmCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CrmCampaignUpdateRequest }) =>
      crmApi.updateCrmCampaign(id, data),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: CRM_KEYS.crmCampaignById(id) });
      queryClient.invalidateQueries({ queryKey: CRM_KEYS.crmCampaignsAll() });
      toast.success('Campaign updated.');
    },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}

export function useDeleteCrmCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmApi.deleteCrmCampaign(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CRM_KEYS.crmCampaignsAll() });
      toast.success('Campaign deleted.');
    },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}

export function usePreviewCrmCampaign() {
  return useMutation({
    mutationFn: (targetFilterJson: string) =>
      crmApi.previewCrmCampaign(targetFilterJson),
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}

export function useScheduleCrmCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, scheduledAt }: { id: string; scheduledAt: string }) =>
      crmApi.scheduleCrmCampaign(id, scheduledAt),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: CRM_KEYS.crmCampaignById(id) });
      queryClient.invalidateQueries({ queryKey: CRM_KEYS.crmCampaignsAll() });
      toast.success('Campaign scheduled.');
    },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}

export function useLaunchCrmCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmApi.launchCrmCampaign(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: CRM_KEYS.crmCampaignById(id) });
      queryClient.invalidateQueries({ queryKey: CRM_KEYS.crmCampaignsAll() });
      toast.success('Campaign launched.');
    },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}

export function useCancelCrmCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmApi.cancelCrmCampaign(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: CRM_KEYS.crmCampaignById(id) });
      queryClient.invalidateQueries({ queryKey: CRM_KEYS.crmCampaignsAll() });
      toast.success('Campaign cancelled.');
    },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}

export function useCrmCampaignStats(id: string | undefined) {
  return useQuery({
    queryKey: [...CRM_KEYS.crmCampaignById(id ?? ''), 'stats'] as const,
    queryFn: () => crmApi.getCrmCampaignStats(id!),
    enabled: !!id,
  });
}

export function useCrmCampaignPerformance(id: string | undefined) {
  return useQuery({
    queryKey: [...CRM_KEYS.crmCampaignById(id ?? ''), 'performance'] as const,
    queryFn: () => crmApi.getCrmCampaignPerformance(id!),
    enabled: !!id,
  });
}

export function useCrmCampaignsAggregate() {
  return useQuery({
    queryKey: [...CRM_KEYS.crmCampaignsAll(), 'aggregate'] as const,
    queryFn: () => crmApi.getCrmCampaignsAggregate(),
  });
}

export function useCrmCampaignAttributions(id: string | undefined) {
  return useQuery({
    queryKey: [...CRM_KEYS.crmCampaignById(id ?? ''), 'attributions'] as const,
    queryFn: () => crmApi.getCrmCampaignAttributions(id!),
    enabled: !!id,
  });
}

export function useAddCrmCampaignAttribution() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CrmCampaignAttributionCreateRequest }) =>
      crmApi.addCrmCampaignAttribution(id, data),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: [...CRM_KEYS.crmCampaignById(id), 'attributions'] });
      queryClient.invalidateQueries({ queryKey: CRM_KEYS.crmCampaignById(id) });
      queryClient.invalidateQueries({ queryKey: CRM_KEYS.crmCampaignsAll() });
      toast.success('Attribution recorded.');
    },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}

export function useDeleteCrmCampaignAttribution() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, attributionId }: { campaignId: string; attributionId: string }) =>
      crmApi.deleteCrmCampaignAttribution(campaignId, attributionId),
    onSuccess: (_data, { campaignId }) => {
      queryClient.invalidateQueries({ queryKey: [...CRM_KEYS.crmCampaignById(campaignId), 'attributions'] });
      queryClient.invalidateQueries({ queryKey: CRM_KEYS.crmCampaignById(campaignId) });
      queryClient.invalidateQueries({ queryKey: CRM_KEYS.crmCampaignsAll() });
      toast.success('Attribution removed.');
    },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}

export function useUpdateCrmCampaignBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CrmCampaignBudgetUpdateRequest }) =>
      crmApi.updateCrmCampaignBudget(id, data),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: CRM_KEYS.crmCampaignById(id) });
      queryClient.invalidateQueries({ queryKey: CRM_KEYS.crmCampaignsAll() });
      toast.success('Budget updated.');
    },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}

export function useCrmCampaignRecipients(id: string | undefined) {
  return useQuery({
    queryKey: CRM_KEYS.crmCampaignRecipients(id ?? ''),
    queryFn: () => crmApi.getCrmCampaignRecipients(id!),
    enabled: !!id,
  });
}

// ─── Support Cases ────────────────────────────────────────────────────────────

export function useSupportCases(filter: import('../types/crm.types').CrmSupportCaseFilter = {}) {
  return useQuery({ queryKey: [...CRM_KEYS.supportCases(), filter] as const, queryFn: () => crmApi.getSupportCases(filter) });
}
export function useSupportCaseById(id: string | undefined) {
  return useQuery({ queryKey: CRM_KEYS.supportCaseById(id ?? ''), queryFn: () => crmApi.getSupportCaseById(id!), enabled: !!id });
}
export function useSlaPolicies() {
  return useQuery({ queryKey: CRM_KEYS.slaPolicies(), queryFn: () => crmApi.getSlaPolicies() });
}
export function useCreateSlaPolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: import('../types/crm.types').CrmSlaPolicyCreateRequest) => crmApi.createSlaPolicy(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: CRM_KEYS.slaPolicies() }); toast.success('SLA policy created.'); },
    onError: () => toast.error('Failed to create SLA policy.'),
  });
}
export function useDeleteSlaPolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmApi.deleteSlaPolicy(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: CRM_KEYS.slaPolicies() }); toast.success('SLA policy deleted.'); },
    onError: () => toast.error('Failed to delete SLA policy.'),
  });
}
export function useCreateSupportCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: import('../types/crm.types').CrmSupportCaseCreateRequest) => crmApi.createSupportCase(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: CRM_KEYS.supportCases() }); toast.success('Support case created.'); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}
export function useTransitionSupportCaseStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: number; reason?: string }) => crmApi.transitionSupportCaseStatus(id, status, reason),
    onSuccess: (_d, { id }) => { qc.invalidateQueries({ queryKey: CRM_KEYS.supportCaseById(id) }); qc.invalidateQueries({ queryKey: CRM_KEYS.supportCases() }); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}
export function useAddSupportCaseMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: string }) => crmApi.addSupportCaseMessage(id, body),
    onSuccess: (_d, { id }) => { qc.invalidateQueries({ queryKey: CRM_KEYS.supportCaseById(id) }); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}
export function useEscalateSupportCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmApi.escalateSupportCase(id),
    onSuccess: (_d, id) => { qc.invalidateQueries({ queryKey: CRM_KEYS.supportCaseById(id) }); qc.invalidateQueries({ queryKey: CRM_KEYS.supportCases() }); toast.success('Case escalated.'); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}
export function useResolveSupportCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmApi.resolveSupportCase(id),
    onSuccess: (_d, id) => { qc.invalidateQueries({ queryKey: CRM_KEYS.supportCaseById(id) }); qc.invalidateQueries({ queryKey: CRM_KEYS.supportCases() }); toast.success('Case resolved.'); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}
export function useCloseSupportCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmApi.closeSupportCase(id),
    onSuccess: (_d, id) => { qc.invalidateQueries({ queryKey: CRM_KEYS.supportCaseById(id) }); qc.invalidateQueries({ queryKey: CRM_KEYS.supportCases() }); toast.success('Case closed.'); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export function useTasks(filter: import('../types/crm.types').CrmTaskFilter = {}) {
  return useQuery({ queryKey: [...CRM_KEYS.tasks(), filter] as const, queryFn: () => crmApi.getTasks(filter) });
}
export function useTaskById(id: string | undefined) {
  return useQuery({ queryKey: CRM_KEYS.taskById(id ?? ''), queryFn: () => crmApi.getTaskById(id!), enabled: !!id });
}
export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: import('../types/crm.types').CrmTaskCreateRequest) => crmApi.createTask(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: CRM_KEYS.tasks() }); toast.success('Task created.'); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}
export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: import('../types/crm.types').CrmTaskUpdateRequest }) => crmApi.updateTask(id, data),
    onSuccess: (_d, { id }) => { qc.invalidateQueries({ queryKey: CRM_KEYS.taskById(id) }); qc.invalidateQueries({ queryKey: CRM_KEYS.tasks() }); toast.success('Task updated.'); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}
export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmApi.deleteTask(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: CRM_KEYS.tasks() }); toast.success('Task deleted.'); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}
export function useCompleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmApi.completeTask(id),
    onSuccess: (_d, id) => { qc.invalidateQueries({ queryKey: CRM_KEYS.taskById(id) }); qc.invalidateQueries({ queryKey: CRM_KEYS.tasks() }); toast.success('Task completed.'); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}

// ─── Quotes ───────────────────────────────────────────────────────────────────

export function useQuotes(filter: import('../types/crm.types').CrmQuoteFilter = {}) {
  return useQuery({ queryKey: [...CRM_KEYS.quotes(), filter] as const, queryFn: () => crmApi.getQuotes(filter) });
}
export function useQuoteById(id: string | undefined) {
  return useQuery({ queryKey: CRM_KEYS.quoteById(id ?? ''), queryFn: () => crmApi.getQuoteById(id!), enabled: !!id });
}
export function useCreateQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: import('../types/crm.types').CrmQuoteCreateRequest) => crmApi.createQuote(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: CRM_KEYS.quotes() }); toast.success('Quote created.'); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}
export function useUpdateQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: import('../types/crm.types').CrmQuoteUpdateRequest }) => crmApi.updateQuote(id, data),
    onSuccess: (_d, { id }) => { qc.invalidateQueries({ queryKey: CRM_KEYS.quoteById(id) }); qc.invalidateQueries({ queryKey: CRM_KEYS.quotes() }); toast.success('Quote updated.'); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}
export function useSendQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmApi.sendQuote(id),
    onSuccess: (_d, id) => { qc.invalidateQueries({ queryKey: CRM_KEYS.quoteById(id) }); qc.invalidateQueries({ queryKey: CRM_KEYS.quotes() }); toast.success('Quote sent.'); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}
export function useAcceptQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmApi.acceptQuote(id),
    onSuccess: (_d, id) => { qc.invalidateQueries({ queryKey: CRM_KEYS.quoteById(id) }); qc.invalidateQueries({ queryKey: CRM_KEYS.quotes() }); toast.success('Quote accepted.'); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}
export function useRejectQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmApi.rejectQuote(id),
    onSuccess: (_d, id) => { qc.invalidateQueries({ queryKey: CRM_KEYS.quoteById(id) }); qc.invalidateQueries({ queryKey: CRM_KEYS.quotes() }); toast.success('Quote rejected.'); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}
export function useReviseQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmApi.reviseQuote(id),
    onSuccess: (_d, id) => { qc.invalidateQueries({ queryKey: CRM_KEYS.quotes() }); toast.success('Quote revised — new draft created.'); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}
export function useDeleteQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmApi.deleteQuote(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: CRM_KEYS.quotes() }); toast.success('Quote deleted.'); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}
export function useCreateOrderFromQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (quoteId: string) => crmApi.createOrderFromQuote(quoteId),
    onSuccess: (_d) => { qc.invalidateQueries({ queryKey: CRM_KEYS.orders() }); toast.success('Order created from quote.'); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}

// ─── Proposals ────────────────────────────────────────────────────────────────

export function useProposals(filter: import('../types/crm.types').CrmProposalFilter = {}) {
  return useQuery({ queryKey: [...CRM_KEYS.proposals(), filter] as const, queryFn: () => crmApi.getProposals(filter) });
}
export function useProposalById(id: string | undefined) {
  return useQuery({ queryKey: CRM_KEYS.proposalById(id ?? ''), queryFn: () => crmApi.getProposalById(id!), enabled: !!id });
}
export function useProposalTemplates() {
  return useQuery({ queryKey: CRM_KEYS.proposalTemplates(), queryFn: () => crmApi.getProposalTemplates() });
}
export function useGenerateProposal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: import('../types/crm.types').CrmProposalGenerateRequest) => crmApi.generateProposal(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: CRM_KEYS.proposals() }); toast.success('Proposal generated.'); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}
export function useCreateProposal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: import('../types/crm.types').CrmProposalCreateRequest) => crmApi.createProposal(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: CRM_KEYS.proposals() }); toast.success('Proposal created.'); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}
export function useCreateProposalFromLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: import('../types/crm.types').CrmProposalFromLeadRequest) => crmApi.createProposalFromLead(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: CRM_KEYS.proposals() }); toast.success('Proposal created from lead.'); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}
export function useSendProposal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmApi.sendProposal(id),
    onSuccess: (_d, id) => { qc.invalidateQueries({ queryKey: CRM_KEYS.proposalById(id) }); qc.invalidateQueries({ queryKey: CRM_KEYS.proposals() }); toast.success('Proposal sent.'); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}
export function useAcceptProposal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmApi.acceptProposal(id),
    onSuccess: (_d, id) => { qc.invalidateQueries({ queryKey: CRM_KEYS.proposalById(id) }); qc.invalidateQueries({ queryKey: CRM_KEYS.proposals() }); toast.success('Proposal accepted.'); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}
export function useRejectProposal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmApi.rejectProposal(id),
    onSuccess: (_d, id) => { qc.invalidateQueries({ queryKey: CRM_KEYS.proposalById(id) }); qc.invalidateQueries({ queryKey: CRM_KEYS.proposals() }); toast.success('Proposal rejected.'); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}
export function useUpdateProposalSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ proposalId, sectionId, content }: { proposalId: string; sectionId: string; content: string }) => crmApi.updateProposalSection(proposalId, sectionId, content),
    onSuccess: (_d, vars) => { qc.invalidateQueries({ queryKey: CRM_KEYS.proposalById(vars.proposalId) }); toast.success('Section updated.'); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}
export function useRegenerateProposalSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ proposalId, sectionId }: { proposalId: string; sectionId: string }) => crmApi.regenerateProposalSection(proposalId, sectionId),
    onSuccess: (_d, vars) => { qc.invalidateQueries({ queryKey: CRM_KEYS.proposalById(vars.proposalId) }); toast.success('Section regenerated.'); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}

// ─── Invoices ─────────────────────────────────────────────────────────────────

export function useInvoices(filter: import('../types/crm.types').CrmInvoiceFilter = {}) {
  return useQuery({ queryKey: [...CRM_KEYS.invoices(), filter] as const, queryFn: () => crmApi.getInvoices(filter) });
}
export function useInvoiceById(id: string | undefined) {
  return useQuery({ queryKey: CRM_KEYS.invoiceById(id ?? ''), queryFn: () => crmApi.getInvoiceById(id!), enabled: !!id });
}
export function useGenerateInvoiceFromDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dealId: string) => crmApi.generateInvoiceFromDeal(dealId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: CRM_KEYS.invoices() }); toast.success('Invoice generated.'); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}
export function useRecordPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: import('../types/crm.types').CrmRecordPaymentRequest }) => crmApi.recordInvoicePayment(id, data),
    onSuccess: (_d, { id }) => { qc.invalidateQueries({ queryKey: CRM_KEYS.invoiceById(id) }); qc.invalidateQueries({ queryKey: CRM_KEYS.invoices() }); toast.success('Payment recorded.'); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}
export function useDisputeInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmApi.disputeInvoice(id),
    onSuccess: (_d, id) => { qc.invalidateQueries({ queryKey: CRM_KEYS.invoiceById(id) }); qc.invalidateQueries({ queryKey: CRM_KEYS.invoices() }); toast.success('Invoice disputed.'); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}
export function useSendInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmApi.sendInvoice(id),
    onSuccess: (_d, id) => { qc.invalidateQueries({ queryKey: CRM_KEYS.invoiceById(id) }); qc.invalidateQueries({ queryKey: CRM_KEYS.invoices() }); toast.success('Invoice sent.'); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}
export function useVoidInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmApi.voidInvoice(id),
    onSuccess: (_d, id) => { qc.invalidateQueries({ queryKey: CRM_KEYS.invoiceById(id) }); qc.invalidateQueries({ queryKey: CRM_KEYS.invoices() }); toast.success('Invoice voided.'); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}

// ─── Subscriptions ────────────────────────────────────────────────────────────

export function useSubscriptions(filter: import('../types/crm.types').CrmSubscriptionFilter = {}) {
  return useQuery({ queryKey: [...CRM_KEYS.subscriptions(), filter] as const, queryFn: () => crmApi.getSubscriptions(filter) });
}
export function useSubscriptionById(id: string | undefined) {
  return useQuery({ queryKey: CRM_KEYS.subscriptionById(id ?? ''), queryFn: () => crmApi.getSubscriptionById(id!), enabled: !!id });
}
export function useCreateSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: import('../types/crm.types').CrmSubscriptionCreateRequest) => crmApi.createSubscription(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: CRM_KEYS.subscriptions() }); toast.success('Subscription created.'); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}
export function useUpdateSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: import('../types/crm.types').CrmSubscriptionUpdateRequest }) => crmApi.updateSubscription(id, data),
    onSuccess: (_d, { id }) => { qc.invalidateQueries({ queryKey: CRM_KEYS.subscriptionById(id) }); qc.invalidateQueries({ queryKey: CRM_KEYS.subscriptions() }); toast.success('Subscription updated.'); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}
export function useCancelSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmApi.cancelSubscription(id),
    onSuccess: (_d, id) => { qc.invalidateQueries({ queryKey: CRM_KEYS.subscriptionById(id) }); qc.invalidateQueries({ queryKey: CRM_KEYS.subscriptions() }); toast.success('Subscription cancelled.'); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}
export function usePauseSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmApi.pauseSubscription(id),
    onSuccess: (_d, id) => { qc.invalidateQueries({ queryKey: CRM_KEYS.subscriptionById(id) }); qc.invalidateQueries({ queryKey: CRM_KEYS.subscriptions() }); toast.success('Subscription paused.'); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}
export function useResumeSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmApi.resumeSubscription(id),
    onSuccess: (_d, id) => { qc.invalidateQueries({ queryKey: CRM_KEYS.subscriptionById(id) }); qc.invalidateQueries({ queryKey: CRM_KEYS.subscriptions() }); toast.success('Subscription resumed.'); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export function useOrders(filter: import('../types/crm.types').CrmOrderFilter = {}) {
  return useQuery({ queryKey: [...CRM_KEYS.orders(), filter] as const, queryFn: () => crmApi.getOrders(filter) });
}
export function useOrderById(id: string | undefined) {
  return useQuery({ queryKey: CRM_KEYS.orderById(id ?? ''), queryFn: () => crmApi.getOrderById(id!), enabled: !!id });
}
export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: import('../types/crm.types').CrmOrderCreateRequest) => crmApi.createOrder(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: CRM_KEYS.orders() }); toast.success('Order created.'); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}
export function useUpdateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: import('../types/crm.types').CrmOrderUpdateRequest }) => crmApi.updateOrder(id, data),
    onSuccess: (_d, { id }) => { qc.invalidateQueries({ queryKey: CRM_KEYS.orderById(id) }); qc.invalidateQueries({ queryKey: CRM_KEYS.orders() }); toast.success('Order updated.'); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}
export function useConfirmOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmApi.confirmOrder(id),
    onSuccess: (_d, id) => { qc.invalidateQueries({ queryKey: CRM_KEYS.orderById(id) }); qc.invalidateQueries({ queryKey: CRM_KEYS.orders() }); toast.success('Order confirmed.'); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}
export function useFulfillOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmApi.fulfillOrder(id),
    onSuccess: (_d, id) => { qc.invalidateQueries({ queryKey: CRM_KEYS.orderById(id) }); qc.invalidateQueries({ queryKey: CRM_KEYS.orders() }); toast.success('Order fulfilled.'); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}
export function useCancelOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmApi.cancelOrder(id, 'Cancelled by user'),
    onSuccess: (_d, id) => { qc.invalidateQueries({ queryKey: CRM_KEYS.orderById(id) }); qc.invalidateQueries({ queryKey: CRM_KEYS.orders() }); toast.success('Order cancelled.'); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}
export function useDealHandover(dealId: string | undefined) {
  return useQuery({ queryKey: ['crm', 'deal-handover', dealId], queryFn: () => crmApi.getDealHandover(dealId!), enabled: !!dealId });
}
export function useSubmitDealHandover() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ dealId, data }: { dealId: string; data: import('../types/crm.types').DealHandoverSubmitRequest }) => crmApi.submitDealHandover(dealId, data),
    onSuccess: (_d, vars) => { qc.invalidateQueries({ queryKey: ['crm', 'deal-handover', vars.dealId] }); toast.success('Handover submitted.'); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}
export function useCreditCheck() {
  return useMutation({
    mutationFn: ({ accountId, orderValue }: { accountId: string; orderValue: number }) => crmApi.creditCheck(accountId, orderValue),
  });
}

// ── Inventory ──────────────────────────────────────────────────────────────────
export function useInventory(filter?: any) {
  return useQuery({ queryKey: ['crm', 'inventory', filter], queryFn: () => crmApi.getInventory(filter) });
}
export function useCheckStock() {
  return useMutation({
    mutationFn: (items: import('../types/crm.types').StockCheckItem[]) => crmApi.checkStock(items),
  });
}
export function useAdjustInventory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, data }: { productId: string; data: import('../types/crm.types').InventoryAdjustRequest }) => crmApi.adjustInventory(productId, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['crm', 'inventory'] }); toast.success('Inventory adjusted.'); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}
export function useAcknowledgeOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmApi.acknowledgeOrder(id),
    onSuccess: (_d, id) => { qc.invalidateQueries({ queryKey: CRM_KEYS.orderById(id) }); qc.invalidateQueries({ queryKey: CRM_KEYS.orders() }); toast.success('Acknowledgment sent.'); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}
export function useRecordOrderPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { amount: number; paymentMethod?: string; paymentReference?: string } }) => crmApi.recordOrderPayment(id, data),
    onSuccess: (_d, { id }) => { qc.invalidateQueries({ queryKey: CRM_KEYS.orderById(id) }); qc.invalidateQueries({ queryKey: CRM_KEYS.orders() }); toast.success('Payment recorded.'); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}
export function useUpdateOrderFulfillment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { status: number; carrier?: string; trackingNumber?: string; actualDeliveryDate?: string; failureReason?: string } }) => crmApi.updateOrderFulfillment(id, data),
    onSuccess: (_d, { id }) => { qc.invalidateQueries({ queryKey: CRM_KEYS.orderById(id) }); qc.invalidateQueries({ queryKey: CRM_KEYS.orders() }); toast.success('Fulfillment updated.'); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}

// ─── Deliveries ──────────────────────────────────────────────────────────────
export function useDeliveries(orderId: string | undefined) {
  return useQuery({
    queryKey: [...CRM_KEYS.deliveries(orderId ?? ''), 'deliveries'] as const,
    queryFn: () => crmApi.getDeliveries(orderId!),
    enabled: !!orderId,
  });
}
export function useCreateDelivery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, data }: { orderId: string; data: import('../types/crm.types').CrmCreateDeliveryRequest }) => crmApi.createDelivery(orderId, data),
    onSuccess: (_d, { orderId }) => { qc.invalidateQueries({ queryKey: CRM_KEYS.deliveries(orderId) }); qc.invalidateQueries({ queryKey: CRM_KEYS.orderById(orderId) }); toast.success('Shipment created.'); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}
export function useUpdateDeliveryStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ deliveryId, data }: { deliveryId: string; data: import('../types/crm.types').CrmUpdateDeliveryStatusRequest }) => crmApi.updateDeliveryStatus(deliveryId, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['crm', 'orders'] }); toast.success('Delivery status updated.'); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}

// ─── Meetings ─────────────────────────────────────────────────────────────────

export function useMeetings(filter: import('../types/crm.types').CrmMeetingFilter = {}) {
  return useQuery({ queryKey: [...CRM_KEYS.meetings(), filter] as const, queryFn: () => crmApi.getMeetings(filter) });
}
export function useMeetingById(id: string | undefined) {
  return useQuery({ queryKey: CRM_KEYS.meetingById(id ?? ''), queryFn: () => crmApi.getMeetingById(id!), enabled: !!id });
}
export function useInitiateMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: import('../types/crm.types').CrmMeetingInitiateRequest) => crmApi.initiateMeeting(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: CRM_KEYS.meetings() }); toast.success('Meeting initiated.'); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}
export function useBookMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, selectedSlot, durationMinutes }: { id: string; selectedSlot: string; durationMinutes: number }) => crmApi.bookMeeting(id, selectedSlot, durationMinutes),
    onSuccess: (_d, { id }) => { qc.invalidateQueries({ queryKey: CRM_KEYS.meetingById(id) }); qc.invalidateQueries({ queryKey: CRM_KEYS.meetings() }); toast.success('Meeting booked.'); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}
export function useCancelMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmApi.cancelMeeting(id),
    onSuccess: (_d, id) => { qc.invalidateQueries({ queryKey: CRM_KEYS.meetingById(id) }); qc.invalidateQueries({ queryKey: CRM_KEYS.meetings() }); toast.success('Meeting cancelled.'); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}
export function useUpdateMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { status?: number; notes?: string } }) => crmApi.updateMeeting(id, data),
    onSuccess: (_d, id) => { qc.invalidateQueries({ queryKey: CRM_KEYS.meetingById(id) }); qc.invalidateQueries({ queryKey: CRM_KEYS.meetings() }); toast.success('Meeting updated.'); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}
export function useCreateTaskFromMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, title, assignedToUserId }: { id: string; title?: string; assignedToUserId?: string }) => crmApi.createTaskFromMeeting(id, title, assignedToUserId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: CRM_KEYS.tasks() }); toast.success('Task created from meeting.'); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}

// ─── Call Summaries ───────────────────────────────────────────────────────────

export function useCallSummaries(filter: import('../types/crm.types').CrmCallSummaryFilter = {}) {
  return useQuery({ queryKey: [...CRM_KEYS.callSummaries(), filter] as const, queryFn: () => crmApi.getCallSummaries(filter) });
}
export function useCallSummaryById(id: string | undefined) {
  return useQuery({ queryKey: CRM_KEYS.callSummaryById(id ?? ''), queryFn: () => crmApi.getCallSummaryById(id!), enabled: !!id });
}
export function useRequestCallSummary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: import('../types/crm.types').CrmCallSummaryRequestDto) => crmApi.requestCallSummary(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: CRM_KEYS.callSummaries() }); toast.success('Call summary requested.'); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}
export function useGenerateCallSummary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmApi.generateCallSummary(id),
    onSuccess: (_d, id) => { qc.invalidateQueries({ queryKey: CRM_KEYS.callSummaryById(id) }); qc.invalidateQueries({ queryKey: CRM_KEYS.callSummaries() }); toast.success('Generating summary…'); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}

// ─── NPS ──────────────────────────────────────────────────────────────────────

export function useNpsSurveys(filter: import('../types/crm.types').CrmNpsFilter = {}) {
  return useQuery({ queryKey: [...CRM_KEYS.nps(), filter] as const, queryFn: () => crmApi.getNpsSurveys(filter) });
}
export function useNpsTenantSummary() {
  return useQuery({ queryKey: CRM_KEYS.npsSummary(), queryFn: () => crmApi.getNpsTenantSummary() });
}
export function useSendNpsSurvey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: import('../types/crm.types').CrmNpsSendRequest) => crmApi.sendNpsSurvey(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: CRM_KEYS.nps() }); toast.success('NPS survey sent.'); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}

// ─── Time Tracking ────────────────────────────────────────────────────────────

export function useTimeEntries(filter: import('../types/crm.types').CrmTimeEntryFilter = {}) {
  return useQuery({ queryKey: [...CRM_KEYS.timeEntries(), filter] as const, queryFn: () => crmApi.getTimeEntries(filter) });
}
export function useTimeSummary() {
  return useQuery({ queryKey: CRM_KEYS.timeSummary(), queryFn: () => crmApi.getTimeSummary() });
}
export function useLogTime() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: import('../types/crm.types').CrmLogTimeRequest) => crmApi.logTime(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: CRM_KEYS.timeEntries() }); qc.invalidateQueries({ queryKey: CRM_KEYS.timeSummary() }); toast.success('Time logged.'); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}
export function useDeleteTimeEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmApi.deleteTimeEntry(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: CRM_KEYS.timeEntries() }); qc.invalidateQueries({ queryKey: CRM_KEYS.timeSummary() }); toast.success('Time entry deleted.'); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}

// ─── Comments ─────────────────────────────────────────────────────────────────

export function useComments(kind: number, entityId: string) {
  return useQuery({ queryKey: CRM_KEYS.comments(kind, entityId), queryFn: () => crmApi.getComments(kind, entityId), enabled: !!entityId });
}
export function useAddComment(kind: number, entityId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: import('../types/crm.types').CrmCommentCreateRequest) => crmApi.addComment(kind, entityId, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: CRM_KEYS.comments(kind, entityId) }); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}
export function useEditComment(kind: number, entityId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ commentId, data }: { commentId: string; data: import('../types/crm.types').CrmCommentEditRequest }) => crmApi.editComment(commentId, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: CRM_KEYS.comments(kind, entityId) }); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}
export function useDeleteComment(kind: number, entityId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) => crmApi.deleteComment(commentId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: CRM_KEYS.comments(kind, entityId) }); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}

// ─── Workflows ────────────────────────────────────────────────────────────────

export function useWorkflows(filter: import('../types/crm.types').CrmWorkflowFilter = {}) {
  return useQuery({ queryKey: [...CRM_KEYS.workflows(), filter] as const, queryFn: () => crmApi.getWorkflows(filter) });
}
export function useWorkflowById(id: string | undefined) {
  return useQuery({ queryKey: CRM_KEYS.workflowById(id ?? ''), queryFn: () => crmApi.getWorkflowById(id!), enabled: !!id });
}
export function useWorkflowExecutions(workflowId: string | undefined) {
  return useQuery({ queryKey: CRM_KEYS.workflowExecutions(workflowId ?? ''), queryFn: () => crmApi.getWorkflowExecutions(workflowId!), enabled: !!workflowId });
}
export function useWorkflowTriggerDefinitions() {
  return useQuery({ queryKey: CRM_KEYS.workflowTriggerDefinitions(), queryFn: () => crmApi.getTriggerDefinitions(), staleTime: 5 * 60 * 1000 });
}
export function useCreateWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: import('../types/crm.types').CrmWorkflowCreateRequest) => crmApi.createWorkflow(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: CRM_KEYS.workflows() }); toast.success('Workflow created.'); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}
export function useUpdateWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: import('../types/crm.types').CrmWorkflowUpdateRequest }) => crmApi.updateWorkflow(id, data),
    onSuccess: (_d, { id }) => { qc.invalidateQueries({ queryKey: CRM_KEYS.workflowById(id) }); qc.invalidateQueries({ queryKey: CRM_KEYS.workflows() }); toast.success('Workflow updated.'); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}
export function useDeleteWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmApi.deleteWorkflow(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: CRM_KEYS.workflows() }); toast.success('Workflow deleted.'); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}
export function useTriggerWorkflow() {
  return useMutation({
    mutationFn: (data: import('../types/crm.types').CrmWorkflowTriggerRequest) => crmApi.triggerWorkflow(data),
    onSuccess: () => toast.success('Workflow triggered.'),
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}

export function useRunWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmApi.runWorkflow(id),
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: CRM_KEYS.workflowExecutions(id) });
      qc.invalidateQueries({ queryKey: CRM_KEYS.workflows() });
      toast.success('Workflow queued — will run within 30 seconds.');
    },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}

export function useGenerateWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { Instruction: string; WorkflowName?: string }) => crmApi.generateWorkflow(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: CRM_KEYS.workflows() }); },
    onError: (err: any) => toast.error(err?.message || 'Failed to generate workflow.'),
  });
}

export function useChatWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, message }: { id: string; message: string }) => crmApi.chatWorkflow(id, { Message: message }),
    onSuccess: (_d, { id }) => { qc.invalidateQueries({ queryKey: CRM_KEYS.workflowById(id) }); },
    onError: (err: any) => toast.error(err?.message || 'Failed to update workflow.'),
  });
}

// ─── Workflow Campaigns ─────────────────────────────────────────────────────────
export function useWorkflowCampaigns() {
  return useQuery({ queryKey: CRM_KEYS.workflowCampaigns(), queryFn: () => crmApi.getWorkflowCampaigns() });
}
export function useWorkflowCampaignById(id: string | undefined) {
  return useQuery({ queryKey: CRM_KEYS.workflowCampaignById(id ?? ''), queryFn: () => crmApi.getWorkflowCampaignById(id!), enabled: !!id });
}
export function useCreateWorkflowCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: import('../types/crm.types').CrmWorkflowCampaignCreateRequest) => crmApi.createWorkflowCampaign(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: CRM_KEYS.workflowCampaigns() }); toast.success('Campaign created.'); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}
export function useExecuteWorkflowCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmApi.executeWorkflowCampaign(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: CRM_KEYS.workflowCampaigns() }); toast.success('Campaign executed.'); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}

// ─── AI Actions ───────────────────────────────────────────────────────────────

export function useAiActions(page = 1) {
  return useQuery({ queryKey: [...CRM_KEYS.aiActions(), page] as const, queryFn: () => crmApi.getAiActions(page) });
}
export function usePendingAiActions() {
  return useQuery({ queryKey: CRM_KEYS.aiActionsPending(), queryFn: () => crmApi.getPendingAiActions() });
}
export function useApproveAiAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmApi.approveAiAction(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: CRM_KEYS.aiActions() }); qc.invalidateQueries({ queryKey: CRM_KEYS.aiActionsPending() }); toast.success('AI action approved.'); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}
export function useRejectAiAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmApi.rejectAiAction(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: CRM_KEYS.aiActions() }); qc.invalidateQueries({ queryKey: CRM_KEYS.aiActionsPending() }); toast.success('AI action rejected.'); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}
export function useUndoAiAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmApi.undoAiAction(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: CRM_KEYS.aiActions() }); toast.success('AI action undone.'); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}

// ─── Facebook / Instagram Ads ─────────────────────────────────────────────────

export function useFbAdAccount() {
  return useQuery({ queryKey: CRM_KEYS.fbAdAccount(), queryFn: () => crmApi.getFbAdAccount() });
}
export function useFbAdCampaigns() {
  return useQuery({ queryKey: CRM_KEYS.fbAdCampaigns(), queryFn: () => crmApi.getFbAdCampaigns() });
}
export function useFbAdAggregate() {
  return useQuery({ queryKey: CRM_KEYS.fbAdAggregate(), queryFn: () => crmApi.getFbAdAggregate() });
}
export function useConnectFbAdAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: import('../types/crm.types').FbAdAccountConnectRequest) => crmApi.connectFbAdAccount(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CRM_KEYS.fbAdAccount() });
      toast.success('Facebook Ad Account connected.');
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to connect account.'),
  });
}
export function useDisconnectFbAdAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => crmApi.disconnectFbAdAccount(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CRM_KEYS.fbAdAccount() });
      qc.invalidateQueries({ queryKey: CRM_KEYS.fbAdCampaigns() });
      qc.invalidateQueries({ queryKey: CRM_KEYS.fbAdAggregate() });
      toast.success('Facebook Ad Account disconnected.');
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to disconnect account.'),
  });
}
export function useSyncFbAdCampaigns() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => crmApi.syncFbAdCampaigns(),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: CRM_KEYS.fbAdCampaigns() });
      qc.invalidateQueries({ queryKey: CRM_KEYS.fbAdAggregate() });
      qc.invalidateQueries({ queryKey: CRM_KEYS.fbAdAccount() });
      const data = (res as any)?.data;
      const synced = data?.campaignsSynced ?? 0;
      const errors = data?.errors ?? [];
      if (errors.length > 0) toast.warning(`Synced ${synced} campaigns with ${errors.length} error(s).`);
      else toast.success(`Synced ${synced} campaign${synced !== 1 ? 's' : ''} from Meta.`);
    },
    onError: (err: any) => toast.error(err?.message || 'Sync failed.'),
  });
}

// ─── Announcements ────────────────────────────────────────────────────────────

export function useAnnouncements(status?: import('../types/crm.types').AnnouncementStatus) {
  return useQuery({ queryKey: CRM_KEYS.announcements(status), queryFn: () => crmApi.getAnnouncements(status) });
}
export function useAnnouncementById(id: string | undefined) {
  return useQuery({ queryKey: CRM_KEYS.announcementById(id ?? ''), queryFn: () => crmApi.getAnnouncementById(id!), enabled: !!id });
}
export function useCreateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: import('../types/crm.types').AnnouncementCreateRequest) => crmApi.createAnnouncement(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: CRM_KEYS.announcements() }); toast.success('Announcement created.'); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}
export function useUpdateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: import('../types/crm.types').AnnouncementUpdateRequest }) => crmApi.updateAnnouncement(id, data),
    onSuccess: (_d, { id }) => { qc.invalidateQueries({ queryKey: CRM_KEYS.announcementById(id) }); qc.invalidateQueries({ queryKey: CRM_KEYS.announcements() }); toast.success('Announcement updated.'); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}
export function useDeleteAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmApi.deleteAnnouncement(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: CRM_KEYS.announcements() }); toast.success('Announcement deleted.'); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}
export function usePublishAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmApi.publishAnnouncement(id),
    onSuccess: (_d, id) => { qc.invalidateQueries({ queryKey: CRM_KEYS.announcementById(id) }); qc.invalidateQueries({ queryKey: CRM_KEYS.announcements() }); toast.success('Announcement published.'); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}
export function useArchiveAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmApi.archiveAnnouncement(id),
    onSuccess: (_d, id) => { qc.invalidateQueries({ queryKey: CRM_KEYS.announcementById(id) }); qc.invalidateQueries({ queryKey: CRM_KEYS.announcements() }); toast.success('Announcement archived.'); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}
export function useScheduleAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, scheduledAt }: { id: string; scheduledAt: string }) => crmApi.scheduleAnnouncement(id, scheduledAt),
    onSuccess: (_d, { id }) => { qc.invalidateQueries({ queryKey: CRM_KEYS.announcementById(id) }); qc.invalidateQueries({ queryKey: CRM_KEYS.announcements() }); toast.success('Announcement scheduled.'); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}

// ─── Approval Workflows ───────────────────────────────────────────────────────

export function useApprovals(status?: import('../types/crm.types').ApprovalStatus) {
  return useQuery({
    queryKey: CRM_KEYS.approvals(status),
    queryFn: () => crmApi.getApprovals(status),
  });
}

export function useMyApprovals(status?: import('../types/crm.types').ApprovalStatus) {
  return useQuery({
    queryKey: CRM_KEYS.approvals(status != null ? `my-${status}` : 'my'),
    queryFn: () => crmApi.getMyApprovals(status),
  });
}

export function usePendingApprovals() {
  return useQuery({
    queryKey: CRM_KEYS.approvalsPending(),
    queryFn: () => crmApi.getPendingApprovals(),
    refetchInterval: 30_000,
  });
}

export function useApprovalForEntity(entityType: number, entityId: string | undefined) {
  return useQuery({
    queryKey: CRM_KEYS.approvalForEntity(entityType, entityId ?? ''),
    queryFn: () => crmApi.getApprovalForEntity(entityType, entityId!),
    enabled: !!entityId,
  });
}

export function useSubmitApproval() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: import('../types/crm.types').CrmSubmitApprovalRequest) => crmApi.submitApproval(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm', 'approvals'] });
      toast.success('Sent for approval.');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err?.message || 'Something went wrong.'),
  });
}

export function useApproveRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: import('../types/crm.types').CrmReviewApprovalRequest }) =>
      crmApi.approveRequest(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm', 'approvals'] });
      toast.success('Approved.');
    },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}

export function useRejectRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: import('../types/crm.types').CrmReviewApprovalRequest }) =>
      crmApi.rejectRequest(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm', 'approvals'] });
      toast.success('Rejected.');
    },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}

export function useCancelApproval() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmApi.cancelApproval(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm', 'approvals'] });
      toast.success('Approval request cancelled.');
    },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}

// ── Custom Fields ─────────────────────────────────────────────────────────────

export function useCustomFieldDefinitions(entityType: number) {
  return useQuery({
    queryKey: ['crm', 'custom-fields', entityType],
    queryFn: () => crmApi.getCustomFieldDefinitions(entityType),
    enabled: entityType > 0,
  });
}

export function useCreateCustomFieldDefinition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: import('../types/crm.types').CreateCustomFieldDefinitionRequest) =>
      crmApi.createCustomFieldDefinition(data),
    onSuccess: (_r, vars) => {
      qc.invalidateQueries({ queryKey: ['crm', 'custom-fields', vars.entityType] });
      toast.success('Field created.');
    },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}

export function useUpdateCustomFieldDefinition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: import('../types/crm.types').UpdateCustomFieldDefinitionRequest & { entityType: number } }) =>
      crmApi.updateCustomFieldDefinition(id, data),
    onSuccess: (_r, vars) => {
      qc.invalidateQueries({ queryKey: ['crm', 'custom-fields', vars.data.entityType] });
      toast.success('Field updated.');
    },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}

export function useDeleteCustomFieldDefinition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, entityType }: { id: string; entityType: number }) =>
      crmApi.deleteCustomFieldDefinition(id),
    onSuccess: (_r, vars) => {
      qc.invalidateQueries({ queryKey: ['crm', 'custom-fields', vars.entityType] });
      toast.success('Field deleted.');
    },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}

export function useCustomFieldValues(recordId: string | undefined, entityType: number) {
  return useQuery({
    queryKey: ['crm', 'custom-field-values', recordId, entityType],
    queryFn: () => crmApi.getCustomFieldValues(recordId!, entityType),
    enabled: !!recordId && entityType > 0,
  });
}

export function useSetCustomFieldValues(entityType: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ recordId, data }: { recordId: string; data: import('../types/crm.types').SetCustomFieldValuesRequest }) =>
      crmApi.setCustomFieldValues(recordId, entityType, data),
    onSuccess: (_r, vars) => {
      qc.invalidateQueries({ queryKey: ['crm', 'custom-field-values', vars.recordId, entityType] });
      toast.success('Custom fields saved.');
    },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}

// ── CSV Import ────────────────────────────────────────────────────────────────

export function useImportContactsCsv() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => crmApi.importContactsCsv(file),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['crm', 'contacts'] });
      toast.success(`Imported ${(res as any)?.succeeded ?? 0} contacts.`);
    },
    onError: (err: any) => toast.error(err?.message || 'Import failed.'),
  });
}

export function useImportLeadsCsv() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => crmApi.importLeadsCsv(file),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['crm', 'leads'] });
      toast.success(`Imported ${(res as any)?.succeeded ?? 0} leads.`);
    },
    onError: (err: any) => toast.error(err?.message || 'Import failed.'),
  });
}

export function useImportDealsCsv() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => crmApi.importDealsCsv(file),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['crm', 'deals'] });
      const r = res as unknown as import('../types/crm.types').CsvImportResultDto;
      if (r.succeeded > 0) toast.success(`Imported ${r.succeeded} of ${r.total} deals.`);
      if (r.failed > 0) {
        const msg = r.errors?.[0]?.error ?? `${r.failed} rows failed`;
        toast.error(r.succeeded === 0 ? msg : `${r.failed} rows skipped: ${msg}`);
      }
    },
    onError: (err: any) => toast.error(err?.message || 'Import failed.'),
  });
}

// ─── Deduplication ────────────────────────────────────────────────────────────

export function useDedupPending() {
  return useQuery({
    queryKey: CRM_KEYS.dedup(),
    queryFn: () => crmApi.getDedupPending(),
  });
}

export function usePendingDedupCount() {
  const { data } = useDedupPending();
  return ((data as unknown as unknown[] | undefined) ?? []).length;
}

export function useResolveDedup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ candidateId, winnerId }: { candidateId: string; winnerId: string }) =>
      crmApi.resolveDedup(candidateId, { winnerId }),
    onSuccess: (_, { winnerId }) => {
      qc.invalidateQueries({ queryKey: CRM_KEYS.dedup() });
      qc.invalidateQueries({ queryKey: CRM_KEYS.contacts() });
      toast.success(winnerId === '00000000-0000-0000-0000-000000000000' ? 'Marked as not a duplicate' : 'Contacts merged');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Merge failed');
    },
  });
}

export function useScanDedup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => crmApi.scanDedup(),
    onSuccess: (count) => {
      qc.invalidateQueries({ queryKey: CRM_KEYS.dedup() });
      toast.success(`Scan complete — ${count as unknown as number} new candidate pairs found`);
    },
    onError: () => toast.error('Scan failed'),
  });
}

// ─── Deliveries (standalone list) ────────────────────────────────────────────

import type { CrmDeliveryFilter, CrmEquipmentFilter, CrmEquipmentCreateRequest, CrmEquipmentUpdateRequest, CrmEquipmentStatusRequest, AddEquipmentNoteRequest, CrmReturnFilter, CrmRecordInspectionRequest, CrmWorkOrderFilter, CrmCreateWorkOrderRequest, CrmUpdateWorkOrderRequest, CrmWorkOrderStatusRequest, CrmAddWorkOrderNoteRequest, CrmOnboardingFilter, CrmStartOnboardingRequest, CrmUpdateOnboardingRequest, CrmUpdateMilestoneRequest } from '../types/crm.types';

export function useAllDeliveries(filter: CrmDeliveryFilter) {
  return useQuery({
    queryKey: ['crm', 'deliveries', 'list', filter],
    queryFn: () => crmApi.getAllDeliveries(filter),
  });
}

// ─── Equipment ────────────────────────────────────────────────────────────────

export function useEquipment(filter: CrmEquipmentFilter) {
  return useQuery({
    queryKey: ['crm', 'equipment', 'list', filter],
    queryFn: () => crmApi.getEquipment(filter),
  });
}

export function useEquipmentById(id: string | null) {
  return useQuery({
    queryKey: ['crm', 'equipment', id],
    queryFn: () => crmApi.getEquipmentById(id!),
    enabled: !!id,
  });
}

export function useCreateEquipment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CrmEquipmentCreateRequest) => crmApi.createEquipment(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm', 'equipment'] });
      toast.success('Equipment registered');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Failed to register equipment');
    },
  });
}

export function useUpdateEquipment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CrmEquipmentUpdateRequest }) => crmApi.updateEquipment(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm', 'equipment'] });
      toast.success('Equipment updated');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Failed to update equipment');
    },
  });
}

export function useUpdateEquipmentStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CrmEquipmentStatusRequest }) => crmApi.updateEquipmentStatus(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm', 'equipment'] });
      toast.success('Equipment status updated');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Failed to update status');
    },
  });
}

export function useDeleteEquipment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmApi.deleteEquipment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm', 'equipment'] });
      toast.success('Equipment removed');
    },
    onError: () => toast.error('Failed to remove equipment'),
  });
}

export function useAddEquipmentNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AddEquipmentNoteRequest }) => crmApi.addEquipmentNote(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['crm', 'equipment', id] });
      toast.success('Note added');
    },
    onError: () => toast.error('Failed to add note'),
  });
}

// ─── Returns / RMA ────────────────────────────────────────────────────────────

export function useReturns(filter: CrmReturnFilter) {
  return useQuery({
    queryKey: ['crm', 'returns', 'list', filter],
    queryFn: () => crmApi.getReturns(filter),
  });
}

export function useReturnById(id: string | null) {
  return useQuery({
    queryKey: ['crm', 'returns', id],
    queryFn: () => crmApi.getReturnById(id!),
    enabled: !!id,
  });
}

export function useApproveReturn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmApi.approveReturn(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['crm', 'returns'] }); toast.success('Return approved'); },
    onError: () => toast.error('Failed to approve return'),
  });
}

export function useRejectReturn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => crmApi.rejectReturn(id, reason),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['crm', 'returns'] }); toast.success('Return rejected'); },
    onError: () => toast.error('Failed to reject return'),
  });
}

export function useMarkReturnReceived() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmApi.markReturnReceived(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['crm', 'returns'] }); toast.success('Return marked received'); },
    onError: () => toast.error('Failed to update return'),
  });
}

export function useRecordReturnInspection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CrmRecordInspectionRequest }) => crmApi.recordReturnInspection(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['crm', 'returns'] }); toast.success('Inspection recorded'); },
    onError: () => toast.error('Failed to record inspection'),
  });
}

export function useResolveReturn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmApi.resolveReturn(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['crm', 'returns'] }); toast.success('Return resolved'); },
    onError: () => toast.error('Failed to resolve return'),
  });
}

export function useCancelReturn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmApi.cancelReturn(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['crm', 'returns'] }); toast.success('Return cancelled'); },
    onError: () => toast.error('Failed to cancel return'),
  });
}

// ─── Work Orders ──────────────────────────────────────────────────────────────

export function useWorkOrders(filter: CrmWorkOrderFilter) {
  return useQuery({
    queryKey: ['crm', 'work-orders', 'list', filter],
    queryFn: () => crmApi.getWorkOrders(filter),
  });
}

export function useWorkOrderById(id: string | null) {
  return useQuery({
    queryKey: ['crm', 'work-orders', id],
    queryFn: () => crmApi.getWorkOrderById(id!),
    enabled: !!id,
  });
}

export function useWorkOrdersScheduledToday() {
  return useQuery({
    queryKey: ['crm', 'work-orders', 'scheduled-today'],
    queryFn: () => crmApi.getWorkOrdersScheduledToday(),
  });
}

export function useCreateWorkOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CrmCreateWorkOrderRequest) => crmApi.createWorkOrder(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm', 'work-orders'] });
      toast.success('Work order created');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Failed to create work order');
    },
  });
}

export function useUpdateWorkOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CrmUpdateWorkOrderRequest }) => crmApi.updateWorkOrder(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm', 'work-orders'] });
      toast.success('Work order updated');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Failed to update work order');
    },
  });
}

export function useUpdateWorkOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CrmWorkOrderStatusRequest }) => crmApi.updateWorkOrderStatus(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm', 'work-orders'] });
      toast.success('Status updated');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Failed to update status');
    },
  });
}

export function useDeleteWorkOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmApi.deleteWorkOrder(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['crm', 'work-orders'] }); toast.success('Work order deleted'); },
    onError: () => toast.error('Failed to delete work order'),
  });
}

export function useAddWorkOrderNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CrmAddWorkOrderNoteRequest }) => crmApi.addWorkOrderNote(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['crm', 'work-orders', id] });
      toast.success('Note added');
    },
    onError: () => toast.error('Failed to add note'),
  });
}

// ─── Customer Onboarding ──────────────────────────────────────────────────────

export function useOnboardings(filter: CrmOnboardingFilter) {
  return useQuery({
    queryKey: ['crm', 'onboardings', 'list', filter],
    queryFn: () => crmApi.getOnboardings(filter),
  });
}

export function useOnboardingById(id: string | null) {
  return useQuery({
    queryKey: ['crm', 'onboardings', id],
    queryFn: () => crmApi.getOnboardingById(id!),
    enabled: !!id,
  });
}

export function useStartOnboarding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CrmStartOnboardingRequest) => crmApi.startOnboarding(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm', 'onboardings'] });
      toast.success('Onboarding started');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Failed to start onboarding');
    },
  });
}

export function useUpdateOnboarding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CrmUpdateOnboardingRequest }) => crmApi.updateOnboarding(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['crm', 'onboardings'] }); toast.success('Onboarding updated'); },
    onError: () => toast.error('Failed to update onboarding'),
  });
}

export function useUpdateOnboardingMilestone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, milestoneId, data }: { id: string; milestoneId: string; data: CrmUpdateMilestoneRequest }) =>
      crmApi.updateOnboardingMilestone(id, milestoneId, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['crm', 'onboardings', id] });
      qc.invalidateQueries({ queryKey: ['crm', 'onboardings', 'list'] });
      toast.success('Milestone updated');
    },
    onError: () => toast.error('Failed to update milestone'),
  });
}

export function useCompleteOnboarding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmApi.completeOnboarding(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['crm', 'onboardings'] }); toast.success('Onboarding completed'); },
    onError: () => toast.error('Failed to complete onboarding'),
  });
}

// ─── Vendors ──────────────────────────────────────────────────────────────────

export function useVendors(filter: import('../types/crm.types').VendorFilter = {}) {
  return useQuery({ queryKey: [...CRM_KEYS.vendors(), filter] as const, queryFn: () => crmApi.getVendors(filter) });
}
export function useVendorById(id: string | undefined) {
  return useQuery({ queryKey: CRM_KEYS.vendorById(id ?? ''), queryFn: () => crmApi.getVendorById(id!), enabled: !!id });
}
export function useActiveVendors() {
  return useQuery({ queryKey: CRM_KEYS.activeVendors(), queryFn: () => crmApi.getActiveVendors() });
}
export function useCreateVendor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: import('../types/crm.types').VendorCreateRequest) => crmApi.createVendor(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: CRM_KEYS.vendors() }); qc.invalidateQueries({ queryKey: CRM_KEYS.activeVendors() }); toast.success('Vendor created.'); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}
export function useUpdateVendor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: import('../types/crm.types').VendorUpdateRequest }) => crmApi.updateVendor(id, data),
    onSuccess: (_d, { id }) => { qc.invalidateQueries({ queryKey: CRM_KEYS.vendorById(id) }); qc.invalidateQueries({ queryKey: CRM_KEYS.vendors() }); qc.invalidateQueries({ queryKey: CRM_KEYS.activeVendors() }); toast.success('Vendor updated.'); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}
export function useDeleteVendor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmApi.deleteVendor(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: CRM_KEYS.vendors() }); qc.invalidateQueries({ queryKey: CRM_KEYS.activeVendors() }); toast.success('Vendor deleted.'); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}

// ─── Purchase Orders ──────────────────────────────────────────────────────────

export function usePurchaseOrders(filter: import('../types/crm.types').PurchaseOrderFilter = {}) {
  return useQuery({ queryKey: [...CRM_KEYS.purchaseOrders(), filter] as const, queryFn: () => crmApi.getPurchaseOrders(filter) });
}
export function usePurchaseOrderById(id: string | undefined) {
  return useQuery({ queryKey: CRM_KEYS.purchaseOrderById(id ?? ''), queryFn: () => crmApi.getPurchaseOrderById(id!), enabled: !!id });
}
export function useCreatePurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: import('../types/crm.types').PurchaseOrderCreateRequest) => crmApi.createPurchaseOrder(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: CRM_KEYS.purchaseOrders() }); toast.success('Purchase order created.'); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}
export function useSubmitPurchaseOrderForApproval() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmApi.submitPurchaseOrderForApproval(id),
    onSuccess: (_d, id) => { qc.invalidateQueries({ queryKey: CRM_KEYS.purchaseOrderById(id) }); qc.invalidateQueries({ queryKey: CRM_KEYS.purchaseOrders() }); toast.success('Submitted for approval.'); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}
export function useApprovePurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmApi.approvePurchaseOrder(id),
    onSuccess: (_d, id) => { qc.invalidateQueries({ queryKey: CRM_KEYS.purchaseOrderById(id) }); qc.invalidateQueries({ queryKey: CRM_KEYS.purchaseOrders() }); toast.success('Purchase order approved.'); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}
export function useRejectPurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: import('../types/crm.types').PoRejectRequest }) => crmApi.rejectPurchaseOrder(id, data),
    onSuccess: (_d, { id }) => { qc.invalidateQueries({ queryKey: CRM_KEYS.purchaseOrderById(id) }); qc.invalidateQueries({ queryKey: CRM_KEYS.purchaseOrders() }); toast.success('Purchase order rejected.'); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}
export function useMarkPurchaseOrderSentToVendor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmApi.markPurchaseOrderSentToVendor(id),
    onSuccess: (_d, id) => { qc.invalidateQueries({ queryKey: CRM_KEYS.purchaseOrderById(id) }); qc.invalidateQueries({ queryKey: CRM_KEYS.purchaseOrders() }); toast.success('Marked as sent to vendor.'); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}
export function useCancelPurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => crmApi.cancelPurchaseOrder(id, reason),
    onSuccess: (_d, { id }) => { qc.invalidateQueries({ queryKey: CRM_KEYS.purchaseOrderById(id) }); qc.invalidateQueries({ queryKey: CRM_KEYS.purchaseOrders() }); toast.success('Purchase order cancelled.'); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}
export function useClosePurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmApi.closePurchaseOrder(id),
    onSuccess: (_d, id) => { qc.invalidateQueries({ queryKey: CRM_KEYS.purchaseOrderById(id) }); qc.invalidateQueries({ queryKey: CRM_KEYS.purchaseOrders() }); toast.success('Purchase order closed.'); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}

// ─── Goods Receipts ───────────────────────────────────────────────────────────

export function useGoodsReceipts(filter: import('../types/crm.types').GoodsReceiptFilter = {}) {
  return useQuery({ queryKey: [...CRM_KEYS.goodsReceipts(), filter] as const, queryFn: () => crmApi.getGoodsReceipts(filter) });
}
export function useGoodsReceiptById(id: string | undefined) {
  return useQuery({ queryKey: CRM_KEYS.goodsReceiptById(id ?? ''), queryFn: () => crmApi.getGoodsReceiptById(id!), enabled: !!id });
}
export function useCreateGoodsReceipt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: import('../types/crm.types').GoodsReceiptCreateRequest) => crmApi.createGoodsReceipt(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: CRM_KEYS.goodsReceipts() }); qc.invalidateQueries({ queryKey: CRM_KEYS.purchaseOrders() }); toast.success('Goods receipt created.'); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}
export function useConfirmGoodsReceipt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmApi.confirmGoodsReceipt(id),
    onSuccess: (_d, id) => { qc.invalidateQueries({ queryKey: CRM_KEYS.goodsReceiptById(id) }); qc.invalidateQueries({ queryKey: CRM_KEYS.goodsReceipts() }); qc.invalidateQueries({ queryKey: CRM_KEYS.purchaseOrders() }); toast.success('Goods receipt confirmed. Stock updated.'); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}
export function useVoidGoodsReceipt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmApi.voidGoodsReceipt(id),
    onSuccess: (_d, id) => { qc.invalidateQueries({ queryKey: CRM_KEYS.goodsReceiptById(id) }); qc.invalidateQueries({ queryKey: CRM_KEYS.goodsReceipts() }); qc.invalidateQueries({ queryKey: CRM_KEYS.purchaseOrders() }); toast.success('Goods receipt voided.'); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}

// ─── Supplier Invoices ────────────────────────────────────────────────────────

export function useSupplierInvoices(filter: import('../types/crm.types').SupplierInvoiceFilter = {}) {
  return useQuery({ queryKey: [...CRM_KEYS.supplierInvoices(), filter] as const, queryFn: () => crmApi.getSupplierInvoices(filter) });
}
export function useSupplierInvoiceById(id: string | undefined) {
  return useQuery({ queryKey: CRM_KEYS.supplierInvoiceById(id ?? ''), queryFn: () => crmApi.getSupplierInvoiceById(id!), enabled: !!id });
}
export function useOverdueSupplierInvoices() {
  return useQuery({ queryKey: CRM_KEYS.overdueSupplierInvoices(), queryFn: () => crmApi.getOverdueSupplierInvoices() });
}
export function useCreateSupplierInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: import('../types/crm.types').SupplierInvoiceCreateRequest) => crmApi.createSupplierInvoice(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: CRM_KEYS.supplierInvoices() }); toast.success('Supplier invoice created.'); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}
export function useApproveSupplierInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmApi.approveSupplierInvoice(id),
    onSuccess: (_d, id) => { qc.invalidateQueries({ queryKey: CRM_KEYS.supplierInvoiceById(id) }); qc.invalidateQueries({ queryKey: CRM_KEYS.supplierInvoices() }); toast.success('Invoice approved.'); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}
export function useRecordSupplierInvoicePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: import('../types/crm.types').SupplierInvoiceRecordPaymentRequest }) => crmApi.recordSupplierInvoicePayment(id, data),
    onSuccess: (_d, { id }) => { qc.invalidateQueries({ queryKey: CRM_KEYS.supplierInvoiceById(id) }); qc.invalidateQueries({ queryKey: CRM_KEYS.supplierInvoices() }); toast.success('Payment recorded.'); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}
export function useDisputeSupplierInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: import('../types/crm.types').SupplierInvoiceDisputeRequest }) => crmApi.disputeSupplierInvoice(id, data),
    onSuccess: (_d, { id }) => { qc.invalidateQueries({ queryKey: CRM_KEYS.supplierInvoiceById(id) }); qc.invalidateQueries({ queryKey: CRM_KEYS.supplierInvoices() }); toast.success('Invoice disputed.'); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}
export function useVoidSupplierInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmApi.voidSupplierInvoice(id),
    onSuccess: (_d, id) => { qc.invalidateQueries({ queryKey: CRM_KEYS.supplierInvoiceById(id) }); qc.invalidateQueries({ queryKey: CRM_KEYS.supplierInvoices() }); toast.success('Invoice voided.'); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}

// ── Commissions ────────────────────────────────────────────────────────────────
export function useCommissionEntries(filter: import('../types/crm.types').CrmCommissionFilter) {
  return useQuery({ queryKey: ['crm', 'commission-entries', filter], queryFn: () => crmApi.getCommissionEntries(filter) });
}
export function useCommissionPayouts(periodCode?: string) {
  return useQuery({ queryKey: ['crm', 'commission-payouts', periodCode], queryFn: () => crmApi.getCommissionPayouts(periodCode) });
}
export function useFinalizePayout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: import('../types/crm.types').CrmFinalizePayoutRequest }) => crmApi.finalizePayout(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['crm', 'commission-payouts'] }); qc.invalidateQueries({ queryKey: ['crm', 'commission-entries'] }); toast.success('Payout finalized.'); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}
export function useMarkPayoutPaid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmApi.markPayoutPaid(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['crm', 'commission-payouts'] }); toast.success('Payout marked paid.'); },
    onError: (err: any) => toast.error(err?.message || 'Something went wrong.'),
  });
}


