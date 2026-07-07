import { apiClient } from '@/shared/lib/api-client';
import type { AnnouncementSummaryDto, AnnouncementDetailDto, AnnouncementCreateRequest, AnnouncementUpdateRequest, AnnouncementStatus, CrmPipelineSummaryDto, CrmPipelineDetailDto, CrmPipelineCreateRequest, CrmPipelineUpdateRequest, CrmStageGateSummaryDto, CrmStageGateCreateRequest, CrmStageGateUpdateRequest, CrmExitGateEvaluationDto, CrmDealGateStatusDto } from '../types/crm.types';
import type {
  LeadSummaryDto,
  LeadDetailDto,
  LeadStatsDto,
  LeadFilter,
  NurtureSequenceDto,
  NurtureSequenceCreateRequest,
  NurtureSequenceUpdateRequest,
  NurtureEnrollmentDto,
  LeadCampaignDto,
  LeadCampaignCreateRequest,
  LeadSegmentFilter,
  LeadSegmentPreviewDto,
  StaffNotificationDto,
  PagedResult,
  CrmContactSummaryDto,
  CrmContactDetailDto,
  CrmContactCreateRequest,
  CrmContactUpdateRequest,
  CrmContactFilter,
  CrmOrganizationSummaryDto,
  CrmOrganizationDetailDto,
  CrmOrganizationCreateRequest,
  CrmOrganizationUpdateRequest,
  CrmOrganizationFilter,
  CrmAccountSummaryDto,
  CrmAccountDetailDto,
  CrmAccountCreateRequest,
  CrmAccountUpdateRequest,
  CrmAccountFilter,
  CrmAccountContactDto,
  AddAccountContactRequest,
  CrmDealStageSummaryDto,
  CrmDealStageCreateRequest,
  CrmDealStageUpdateRequest,
  CrmDealSummaryDto,
  CrmDealDetailDto,
  CrmDealCreateRequest,
  CrmDealUpdateRequest,
  CrmDealFilter,
  MoveDealStageRequest,
  CloseDealRequest,
  CrmSignalDto,
  CrmManualSignalCreateRequest,
  CrmSignalFilter,
  CrmCampaignSummaryDto,
  CrmCampaignDetailDto,
  CrmCampaignCreateRequest,
  CrmCampaignUpdateRequest,
  CrmCampaignBudgetUpdateRequest,
  CrmCampaignPreviewDto,
  CrmCampaignStatsDto,
  CrmCampaignPerformanceDashboardDto,
  CrmCampaignAttributionDto,
  CrmCampaignAttributionCreateRequest,
  CrmCampaignRecipientDto,
  CrmCampaignAggregateDto,
  DealPipelineDto,
  DealStatsDto,
  ContactStatsDto,
  RevenueAnalyticsDto,
  ActivityAnalyticsDto,
  VelocityAnalyticsDto,
  LeadFunnelAnalyticsDto,
  NurtureAnalyticsDto,
  CrmNurtureEnrollmentDto,
  FlowExperimentSummaryDto,
  FlowExperimentDetailDto,
  FlowExperimentCreateRequest,
  FlowExperimentUpdateRequest,
  ExperimentVariantKind,
} from '../types/crm.types';

const BASE = '/v1/crm';
const EXPERIMENTS_BASE = '/v1/flows/experiments';
const ANN_BASE = '/v1/announcements';

export const crmApi = {
  // ─── Leads ───────────────────────────────────────────────────────────────
  getLeads: (filter: LeadFilter = {}) =>
    apiClient.get<PagedResult<LeadSummaryDto>>(`${BASE}/leads`, { params: filter }),

  getLeadStats: () =>
    apiClient.get<LeadStatsDto>(`${BASE}/leads/stats`),

  getLeadById: (id: string) =>
    apiClient.get<LeadDetailDto>(`${BASE}/leads/${id}`),

  createLead: (data: import('../types/crm.types').CreateManualLeadRequest) =>
    apiClient.post<import('../types/crm.types').LeadDetailDto>(`${BASE}/leads`, data),

  updateLeadStage: (id: string, stage: number, reason?: string) =>
    apiClient.put<LeadDetailDto>(`${BASE}/leads/${id}/stage`, { stage, reason }),

  assignLead: (id: string, userId: string | null) =>
    apiClient.put<LeadDetailDto>(`${BASE}/leads/${id}/assign`, { userId }),

  bulkLeadAction: (req: import('../types/crm.types').BulkLeadActionRequest) =>
    apiClient.post<import('../types/crm.types').BulkLeadActionResult>(`${BASE}/leads/bulk`, req),

  addNote: (id: string, note: string) =>
    apiClient.post(`${BASE}/leads/${id}/notes`, { note }),

  // ─── Notifications ────────────────────────────────────────────────────────
  getNotifications: (page = 1, pageSize = 20) =>
    apiClient.get<PagedResult<StaffNotificationDto>>(`${BASE}/notifications`, {
      params: { page, pageSize },
    }),

  markRead: (id: string) =>
    apiClient.put(`${BASE}/notifications/${id}/read`, {}),

  markAllRead: () =>
    apiClient.put(`${BASE}/notifications/read-all`, {}),

  getNotifPreferences: () =>
    apiClient.get<import('../types/crm.types').CrmNotifPreferenceDto[]>(`${BASE}/notifications/preferences`),
  saveNotifPreferences: (data: { preferences: import('../types/crm.types').CrmNotifPreferenceDto[] }) =>
    apiClient.put(`${BASE}/notifications/preferences`, data),

  // ─── Nurture Sequences ────────────────────────────────────────────────────
  getNurtureSequences: () =>
    apiClient.get<NurtureSequenceDto[]>(`${BASE}/nurture-sequences`),

  createNurtureSequence: (data: NurtureSequenceCreateRequest) =>
    apiClient.post<NurtureSequenceDto>(`${BASE}/nurture-sequences`, data),

  updateNurtureSequence: (id: string, data: NurtureSequenceUpdateRequest) =>
    apiClient.put<NurtureSequenceDto>(`${BASE}/nurture-sequences/${id}`, data),

  deleteNurtureSequence: (id: string) =>
    apiClient.delete(`${BASE}/nurture-sequences/${id}`),

  enrollLead: (sequenceId: string, leadId: string) =>
    apiClient.post(`${BASE}/nurture-sequences/${sequenceId}/enroll/${leadId}`, {}),

  getLeadEnrollments: (leadId: string) =>
    apiClient.get<NurtureEnrollmentDto[]>(`${BASE}/nurture-sequences/lead/${leadId}`),

  // ─── Campaigns ────────────────────────────────────────────────────────────
  getCampaigns: (page = 1, pageSize = 20) =>
    apiClient.get<PagedResult<LeadCampaignDto>>(`${BASE}/campaigns`, {
      params: { page, pageSize },
    }),

  getCampaignById: (id: string) =>
    apiClient.get<LeadCampaignDto>(`${BASE}/campaigns/${id}`),

  createCampaign: (data: LeadCampaignCreateRequest) =>
    apiClient.post<LeadCampaignDto>(`${BASE}/campaigns`, data),

  previewSegment: (filter: LeadSegmentFilter) =>
    apiClient.post<LeadSegmentPreviewDto>(`${BASE}/campaigns/preview-segment`, filter),

  executeCampaign: (id: string) =>
    apiClient.post(`${BASE}/campaigns/${id}/execute`, {}),

  // ─── Contacts ─────────────────────────────────────────────────────────────
  getContacts: (filter: CrmContactFilter = {}) =>
    apiClient.get<PagedResult<CrmContactSummaryDto>>(`${BASE}/contacts`, { params: filter }),

  getContactById: (id: string) =>
    apiClient.get<CrmContactDetailDto>(`${BASE}/contacts/${id}`),

  createContact: (data: CrmContactCreateRequest) =>
    apiClient.post<CrmContactDetailDto>(`${BASE}/contacts`, data),

  findContactDuplicates: (email?: string, phone?: string) =>
    apiClient.get<import('../types/crm.types').CrmDuplicateMatchDto[]>(`${BASE}/contacts/duplicates`, {
      params: { email: email || undefined, phone: phone || undefined },
    }),

  updateContact: (id: string, data: CrmContactUpdateRequest) =>
    apiClient.put<CrmContactDetailDto>(`${BASE}/contacts/${id}`, data),

  deleteContact: (id: string) =>
    apiClient.delete(`${BASE}/contacts/${id}`),

  bulkDeleteContacts: (ids: string[]) =>
    apiClient.post<import('../types/crm.types').CrmBulkResult>(`${BASE}/contacts/bulk-delete`, { ids }),

  setContactLanguage: (id: string, language: string | null) =>
    apiClient.put(`${BASE}/contacts/${id}/language`, { language }),

  // ─── Organizations ────────────────────────────────────────────────────────
  getOrganizations: (filter: CrmOrganizationFilter = {}) =>
    apiClient.get<PagedResult<CrmOrganizationSummaryDto>>(`${BASE}/organizations`, { params: filter }),

  getOrganizationById: (id: string) =>
    apiClient.get<CrmOrganizationDetailDto>(`${BASE}/organizations/${id}`),

  createOrganization: (data: CrmOrganizationCreateRequest) =>
    apiClient.post<CrmOrganizationDetailDto>(`${BASE}/organizations`, data),

  updateOrganization: (id: string, data: CrmOrganizationUpdateRequest) =>
    apiClient.put<CrmOrganizationDetailDto>(`${BASE}/organizations/${id}`, data),

  deleteOrganization: (id: string) =>
    apiClient.delete(`${BASE}/organizations/${id}`),

  // ─── Accounts ─────────────────────────────────────────────────────────────
  getAccounts: (filter: CrmAccountFilter = {}) =>
    apiClient.get<PagedResult<CrmAccountSummaryDto>>(`${BASE}/accounts`, { params: filter }),

  getAccountById: (id: string) =>
    apiClient.get<CrmAccountDetailDto>(`${BASE}/accounts/${id}`),

  createAccount: (data: CrmAccountCreateRequest) =>
    apiClient.post<CrmAccountDetailDto>(`${BASE}/accounts`, data),

  updateAccount: (id: string, data: CrmAccountUpdateRequest) =>
    apiClient.put<CrmAccountDetailDto>(`${BASE}/accounts/${id}`, data),

  deleteAccount: (id: string) =>
    apiClient.delete(`${BASE}/accounts/${id}`),

  getAccountContacts: (id: string) =>
    apiClient.get<CrmAccountContactDto[]>(`${BASE}/accounts/${id}/contacts`),

  addAccountContact: (id: string, data: AddAccountContactRequest) =>
    apiClient.post<CrmAccountContactDto>(`${BASE}/accounts/${id}/contacts`, data),

  removeAccountContact: (accountId: string, linkId: string) =>
    apiClient.delete(`${BASE}/accounts/${accountId}/contacts/${linkId}`),

  // ─── Stage Exit Gates ─────────────────────────────────────────────────────
  getStageGates: (stageId: string) =>
    apiClient.get<CrmStageGateSummaryDto[]>(`${BASE}/stages/${stageId}/gates`),

  createStageGate: (stageId: string, data: CrmStageGateCreateRequest) =>
    apiClient.post<CrmStageGateSummaryDto>(`${BASE}/stages/${stageId}/gates`, data),

  updateStageGate: (gateId: string, data: CrmStageGateUpdateRequest) =>
    apiClient.put<CrmStageGateSummaryDto>(`${BASE}/stages/gates/${gateId}`, data),

  deleteStageGate: (gateId: string) =>
    apiClient.delete(`${BASE}/stages/gates/${gateId}`),

  getDealGateStatus: (dealId: string) =>
    apiClient.get<CrmExitGateEvaluationDto>(`${BASE}/deals/${dealId}/gate-status`),

  toggleGateCheck: (dealId: string, gateId: string, isChecked: boolean) =>
    apiClient.post<CrmDealGateStatusDto>(`${BASE}/deals/${dealId}/gates/${gateId}/check`, { isChecked }),

  // ─── Pipelines ────────────────────────────────────────────────────────────
  getPipelines: () =>
    apiClient.get<CrmPipelineSummaryDto[]>(`${BASE}/pipelines`),

  getPipelineById: (id: string) =>
    apiClient.get<CrmPipelineDetailDto>(`${BASE}/pipelines/${id}`),

  createPipeline: (data: CrmPipelineCreateRequest) =>
    apiClient.post<CrmPipelineSummaryDto>(`${BASE}/pipelines`, data),

  updatePipeline: (id: string, data: CrmPipelineUpdateRequest) =>
    apiClient.put<CrmPipelineSummaryDto>(`${BASE}/pipelines/${id}`, data),

  deletePipeline: (id: string) =>
    apiClient.delete(`${BASE}/pipelines/${id}`),

  setPipelineDefault: (id: string) =>
    apiClient.post<CrmPipelineSummaryDto>(`${BASE}/pipelines/${id}/set-default`, {}),

  getPipelineStages: (pipelineId: string) =>
    apiClient.get<CrmDealStageSummaryDto[]>(`${BASE}/pipelines/${pipelineId}/stages`),

  // ─── Deal Stages ──────────────────────────────────────────────────────────
  getDealStages: (params?: { dealType?: number; pipelineId?: string }) =>
    apiClient.get<CrmDealStageSummaryDto[]>(`${BASE}/deals/stages`, { params }),

  createDealStage: (data: CrmDealStageCreateRequest) =>
    apiClient.post<CrmDealStageSummaryDto>(`${BASE}/deals/stages`, data),

  updateDealStage: (id: string, data: CrmDealStageUpdateRequest) =>
    apiClient.put<CrmDealStageSummaryDto>(`${BASE}/deals/stages/${id}`, data),

  deleteDealStage: (id: string) =>
    apiClient.delete(`${BASE}/deals/stages/${id}`),

  // ─── Deals ────────────────────────────────────────────────────────────────
  getDeals: (filter: CrmDealFilter = {}) =>
    apiClient.get<PagedResult<CrmDealSummaryDto>>(`${BASE}/deals`, { params: filter }),

  getDealById: (id: string) =>
    apiClient.get<CrmDealDetailDto>(`${BASE}/deals/${id}`),

  createDeal: (data: CrmDealCreateRequest) =>
    apiClient.post<CrmDealDetailDto>(`${BASE}/deals`, data),

  updateDeal: (id: string, data: CrmDealUpdateRequest) =>
    apiClient.put<CrmDealDetailDto>(`${BASE}/deals/${id}`, data),

  deleteDeal: (id: string) =>
    apiClient.delete(`${BASE}/deals/${id}`),

  bulkDeleteDeals: (ids: string[]) =>
    apiClient.post<import('../types/crm.types').CrmBulkResult>(`${BASE}/deals/bulk-delete`, { ids }),

  moveDealStage: (id: string, data: MoveDealStageRequest) =>
    apiClient.put<CrmDealDetailDto>(`${BASE}/deals/${id}/stage`, data),
  convertLead: (id: string, data: import('../types/crm.types').ConvertLeadRequest) =>
    apiClient.post<import('../types/crm.types').ConvertLeadResponse>(`${BASE}/leads/${id}/convert`, data),

  closeDeal: (id: string, data: CloseDealRequest) =>
    apiClient.post<CrmDealDetailDto>(`${BASE}/deals/${id}/close`, data),

  refreshDealSummary: (id: string) =>
    apiClient.post<import('../types/crm.types').CrmDealAiSummaryDto>(`${BASE}/deals/${id}/summary/refresh`),

  getDealContacts: (dealId: string) =>
    apiClient.get<any[]>(`${BASE}/deals/${dealId}/contacts`),
  addDealContact: (dealId: string, data: { contactId: string; role?: string }) =>
    apiClient.post<any>(`${BASE}/deals/${dealId}/contacts`, data),
  removeDealContact: (dealContactId: string) =>
    apiClient.delete<void>(`${BASE}/deals/contacts/${dealContactId}`),
  getDealTimeline: (id: string) =>
    apiClient.get<DealTimelineDto>(`${BASE}/deals/${id}/timeline`),

  getDealStrategy: (id: string) =>
    apiClient.get<DealStrategyDto>(`${BASE}/deals/${id}/strategy`),

  updateDealStrategy: (id: string, data: DealStrategyDto) =>
    apiClient.put(`${BASE}/deals/${id}/strategy`, data),

  getFeatureSettings: () =>
    apiClient.get<import('../types/crm.types').TenantFeatureSettings>(`${BASE}/feature-settings`),

  updateFeatureSettings: (settings: import('../types/crm.types').TenantFeatureSettings) =>
    apiClient.put<import('../types/crm.types').TenantFeatureSettings>(`${BASE}/feature-settings`, settings),

  getTimeline: (kind: number, entityId: string, page = 1, pageSize = 50) =>
    apiClient.get<PagedResult<ActivityEventDto>>(`${BASE}/timeline/${kind}/${entityId}`, { params: { page, pageSize } }),

  getActivityFeed: (filter: import('../types/crm.types').CrmActivityFeedFilter) =>
    // `indexes: null` => arrays serialize as repeated `eventKinds=1&eventKinds=2`,
    // which ASP.NET model-binds to List<T> (the default `eventKinds[]=` form does not).
    apiClient.get<PagedResult<ActivityEventDto>>(`${BASE}/activity-feed`, {
      params: filter,
      paramsSerializer: { indexes: null },
    }),

  getAuditFeed: (filter: import('../types/crm.types').CrmAuditFilter) =>
    apiClient.get<import('../types/crm.types').PagedResult<import('../types/crm.types').CrmAuditLogDto>>(`${BASE}/audit-feed`, {
      params: filter,
      paramsSerializer: { indexes: null },
    }),

  logActivity: (data: ActivityLogRequest) =>
    apiClient.post<ActivityEventDto>(`${BASE}/activities`, data),

  // ─── Signals ──────────────────────────────────────────────────────────────
  getSignals: (filter: CrmSignalFilter = {}) =>
    apiClient.get<PagedResult<CrmSignalDto>>(`${BASE}/signals`, { params: filter }),

  createSignal: (data: CrmManualSignalCreateRequest) =>
    apiClient.post<CrmSignalDto>(`${BASE}/signals`, data),

  // ─── CRM Campaigns (B2B) ─────────────────────────────────────────────────
  getCrmCampaigns: () =>
    apiClient.get<CrmCampaignSummaryDto[]>(`${BASE}/campaigns`),

  getCrmCampaignById: (id: string) =>
    apiClient.get<CrmCampaignDetailDto>(`${BASE}/campaigns/${id}`),

  createCrmCampaign: (data: CrmCampaignCreateRequest) =>
    apiClient.post<CrmCampaignDetailDto>(`${BASE}/campaigns`, data),

  updateCrmCampaign: (id: string, data: CrmCampaignUpdateRequest) =>
    apiClient.put<CrmCampaignDetailDto>(`${BASE}/campaigns/${id}`, data),

  deleteCrmCampaign: (id: string) =>
    apiClient.delete(`${BASE}/campaigns/${id}`),

  previewCrmCampaign: (targetFilterJson: string) =>
    apiClient.post<CrmCampaignPreviewDto>(`${BASE}/campaigns/preview`, { targetFilterJson }),

  scheduleCrmCampaign: (id: string, scheduledAt: string) =>
    apiClient.post<CrmCampaignDetailDto>(`${BASE}/campaigns/${id}/schedule`, { scheduledAt }),

  launchCrmCampaign: (id: string) =>
    apiClient.post<CrmCampaignDetailDto>(`${BASE}/campaigns/${id}/launch`, {}),

  cancelCrmCampaign: (id: string) =>
    apiClient.post(`${BASE}/campaigns/${id}/cancel`, {}),

  getCrmCampaignStats: (id: string) =>
    apiClient.get<CrmCampaignStatsDto>(`${BASE}/campaigns/${id}/stats`),

  getCrmCampaignPerformance: (id: string) =>
    apiClient.get<CrmCampaignPerformanceDashboardDto>(`${BASE}/campaigns/${id}/performance`),

  getCrmCampaignsAggregate: () =>
    apiClient.get<CrmCampaignAggregateDto>(`${BASE}/campaigns/aggregate`),

  getCrmCampaignRecipients: (id: string) =>
    apiClient.get<CrmCampaignRecipientDto[]>(`${BASE}/campaigns/${id}/recipients`),

  updateCrmCampaignBudget: (id: string, data: CrmCampaignBudgetUpdateRequest) =>
    apiClient.put<CrmCampaignDetailDto>(`${BASE}/campaigns/${id}/budget`, data),

  getCrmCampaignAttributions: (id: string) =>
    apiClient.get<CrmCampaignAttributionDto[]>(`${BASE}/campaigns/${id}/attributions`),

  addCrmCampaignAttribution: (id: string, data: CrmCampaignAttributionCreateRequest) =>
    apiClient.post<CrmCampaignAttributionDto>(`${BASE}/campaigns/${id}/attributions`, data),

  deleteCrmCampaignAttribution: (campaignId: string, attributionId: string) =>
    apiClient.delete(`${BASE}/campaigns/${campaignId}/attributions/${attributionId}`),

  // ─── CRM Analytics ────────────────────────────────────────────────────────
  getPipelineAnalytics: () =>
    apiClient.get<DealPipelineDto>(`${BASE}/analytics/pipeline`),

  getDealStats: () =>
    apiClient.get<DealStatsDto>(`${BASE}/analytics/deals`),

  getContactStats: () =>
    apiClient.get<ContactStatsDto>(`${BASE}/analytics/contacts`),

  getCampaignAnalytics: () =>
    apiClient.get<CrmCampaignAggregateDto>(`${BASE}/campaigns/aggregate`),

  getRevenueAnalytics: () =>
    apiClient.get<RevenueAnalyticsDto>(`${BASE}/analytics/revenue`),

  getActivityAnalytics: () =>
    apiClient.get<ActivityAnalyticsDto>(`${BASE}/analytics/activity`),

  getVelocityAnalytics: () =>
    apiClient.get<VelocityAnalyticsDto>(`${BASE}/analytics/velocity`),

  getLeadFunnelAnalytics: () =>
    apiClient.get<LeadFunnelAnalyticsDto>(`${BASE}/analytics/leads/funnel`),

  getNurtureAnalytics: () =>
    apiClient.get<NurtureAnalyticsDto>(`${BASE}/analytics/nurture`),

  // ─── Deliveries ──────────────────────────────────────────────────────────
  getAllDeliveries: (filter: import('../types/crm.types').CrmDeliveryFilter) =>
    apiClient.get<import('../types/crm.types').PagedResult<import('../types/crm.types').CrmDeliveryDto>>(`${BASE}/deliveries`, { params: filter }),
  getDeliveries: (orderId: string) =>
    apiClient.get<import('../types/crm.types').CrmDeliveryDto[]>(`${BASE}/orders/${orderId}/deliveries`),
  createDelivery: (orderId: string, data: import('../types/crm.types').CrmCreateDeliveryRequest) =>
    apiClient.post<import('../types/crm.types').CrmDeliveryDto>(`${BASE}/orders/${orderId}/deliveries`, data),
  updateDeliveryStatus: (deliveryId: string, data: import('../types/crm.types').CrmUpdateDeliveryStatusRequest) =>
    apiClient.patch<import('../types/crm.types').CrmDeliveryDto>(`${BASE}/deliveries/${deliveryId}/status`, data),
  recordDeliveryPOD: (deliveryId: string, formData: FormData) =>
    apiClient.post<import('../types/crm.types').CrmDeliveryDto>(`${BASE}/deliveries/${deliveryId}/pod`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),

  // ─── Equipment / Asset ────────────────────────────────────────────────────
  getEquipment: (filter: import('../types/crm.types').CrmEquipmentFilter) =>
    apiClient.get<{ item1: import('../types/crm.types').CrmEquipmentSummaryDto[]; item2: number }>(`${BASE}/equipment`, { params: filter }),
  getEquipmentById: (id: string) =>
    apiClient.get<import('../types/crm.types').CrmEquipmentDetailDto>(`${BASE}/equipment/${id}`),
  createEquipment: (data: import('../types/crm.types').CrmEquipmentCreateRequest) =>
    apiClient.post<import('../types/crm.types').CrmEquipmentDetailDto>(`${BASE}/equipment`, data),
  updateEquipment: (id: string, data: import('../types/crm.types').CrmEquipmentUpdateRequest) =>
    apiClient.put<import('../types/crm.types').CrmEquipmentDetailDto>(`${BASE}/equipment/${id}`, data),
  updateEquipmentStatus: (id: string, data: import('../types/crm.types').CrmEquipmentStatusRequest) =>
    apiClient.patch<import('../types/crm.types').CrmEquipmentDetailDto>(`${BASE}/equipment/${id}/status`, data),
  deleteEquipment: (id: string) =>
    apiClient.delete(`${BASE}/equipment/${id}`),
  addEquipmentNote: (id: string, data: import('../types/crm.types').AddEquipmentNoteRequest) =>
    apiClient.post<import('../types/crm.types').CrmEquipmentDetailDto>(`${BASE}/equipment/${id}/notes`, data),

  // ─── Returns / RMA ────────────────────────────────────────────────────────
  getReturns: (filter: import('../types/crm.types').CrmReturnFilter) =>
    apiClient.get<{ item1: import('../types/crm.types').CrmReturnRequestDto[]; item2: number }>(`${BASE}/returns`, { params: filter }),
  getReturnById: (id: string) =>
    apiClient.get<import('../types/crm.types').CrmReturnRequestDto>(`${BASE}/returns/${id}`),
  approveReturn: (id: string) =>
    apiClient.post<import('../types/crm.types').CrmReturnRequestDto>(`${BASE}/returns/${id}/approve`, {}),
  rejectReturn: (id: string, reason: string) =>
    apiClient.post<import('../types/crm.types').CrmReturnRequestDto>(`${BASE}/returns/${id}/reject?reason=${encodeURIComponent(reason)}`, {}),
  markReturnReceived: (id: string) =>
    apiClient.post<import('../types/crm.types').CrmReturnRequestDto>(`${BASE}/returns/${id}/receive`, {}),
  recordReturnInspection: (id: string, data: import('../types/crm.types').CrmRecordInspectionRequest) =>
    apiClient.post<import('../types/crm.types').CrmReturnRequestDto>(`${BASE}/returns/${id}/inspect`, data),
  resolveReturn: (id: string) =>
    apiClient.post<import('../types/crm.types').CrmReturnRequestDto>(`${BASE}/returns/${id}/resolve`, {}),
  cancelReturn: (id: string) =>
    apiClient.post<import('../types/crm.types').CrmReturnRequestDto>(`${BASE}/returns/${id}/cancel`, {}),

  // ─── Work Orders ──────────────────────────────────────────────────────────
  getWorkOrders: (filter: import('../types/crm.types').CrmWorkOrderFilter) =>
    apiClient.get<{ item1: import('../types/crm.types').CrmWorkOrderSummaryDto[]; item2: number }>(`${BASE}/work-orders`, { params: filter }),
  getWorkOrderById: (id: string) =>
    apiClient.get<import('../types/crm.types').CrmWorkOrderDetailDto>(`${BASE}/work-orders/${id}`),
  getWorkOrdersScheduledToday: () =>
    apiClient.get<import('../types/crm.types').CrmWorkOrderSummaryDto[]>(`${BASE}/work-orders/scheduled-today`),
  createWorkOrder: (data: import('../types/crm.types').CrmCreateWorkOrderRequest) =>
    apiClient.post<import('../types/crm.types').CrmWorkOrderDetailDto>(`${BASE}/work-orders`, data),
  updateWorkOrder: (id: string, data: import('../types/crm.types').CrmUpdateWorkOrderRequest) =>
    apiClient.put<import('../types/crm.types').CrmWorkOrderDetailDto>(`${BASE}/work-orders/${id}`, data),
  updateWorkOrderStatus: (id: string, data: import('../types/crm.types').CrmWorkOrderStatusRequest) =>
    apiClient.patch<import('../types/crm.types').CrmWorkOrderDetailDto>(`${BASE}/work-orders/${id}/status`, data),
  deleteWorkOrder: (id: string) =>
    apiClient.delete(`${BASE}/work-orders/${id}`),
  addWorkOrderNote: (id: string, data: import('../types/crm.types').CrmAddWorkOrderNoteRequest) =>
    apiClient.post<import('../types/crm.types').CrmWorkOrderDetailDto>(`${BASE}/work-orders/${id}/notes`, data),

  // ─── Customer Onboarding ─────────────────────────────────────────────────
  getOnboardings: (filter: import('../types/crm.types').CrmOnboardingFilter) =>
    apiClient.get<{ item1: import('../types/crm.types').CrmCustomerOnboardingDto[]; item2: number }>(`${BASE}/onboardings`, { params: filter }),
  getOnboardingById: (id: string) =>
    apiClient.get<import('../types/crm.types').CrmCustomerOnboardingDto>(`${BASE}/onboardings/${id}`),
  startOnboarding: (data: import('../types/crm.types').CrmStartOnboardingRequest) =>
    apiClient.post<import('../types/crm.types').CrmCustomerOnboardingDto>(`${BASE}/onboardings`, data),
  updateOnboarding: (id: string, data: import('../types/crm.types').CrmUpdateOnboardingRequest) =>
    apiClient.put<import('../types/crm.types').CrmCustomerOnboardingDto>(`${BASE}/onboardings/${id}`, data),
  updateOnboardingMilestone: (id: string, milestoneId: string, data: import('../types/crm.types').CrmUpdateMilestoneRequest) =>
    apiClient.post<import('../types/crm.types').CrmCustomerOnboardingDto>(`${BASE}/onboardings/${id}/milestones/${milestoneId}`, data),
  completeOnboarding: (id: string) =>
    apiClient.post<import('../types/crm.types').CrmCustomerOnboardingDto>(`${BASE}/onboardings/${id}/complete`, {}),

  // ─── CRM Nurture (B2B contacts — Phase 3C) ────────────────────────────────
  enrollCrmContact: (contactId: string, sequenceId: string) =>
    apiClient.post(`${BASE}/nurture/enroll`, { contactId, sequenceId }),

  getCrmContactEnrollments: (contactId: string) =>
    apiClient.get<CrmNurtureEnrollmentDto[]>(`${BASE}/nurture/contacts/${contactId}`),

  cancelCrmContactEnrollments: (contactId: string) =>
    apiClient.delete(`${BASE}/nurture/contacts/${contactId}`),

  // ─── Flow A/B Experiments ─────────────────────────────────────────────────
  getExperiments: () =>
    apiClient.get<FlowExperimentSummaryDto[]>(EXPERIMENTS_BASE),

  getExperimentById: (id: string) =>
    apiClient.get<FlowExperimentDetailDto>(`${EXPERIMENTS_BASE}/${id}`),

  createExperiment: (data: FlowExperimentCreateRequest) =>
    apiClient.post<FlowExperimentDetailDto>(EXPERIMENTS_BASE, data),

  updateExperiment: (id: string, data: FlowExperimentUpdateRequest) =>
    apiClient.put<FlowExperimentDetailDto>(`${EXPERIMENTS_BASE}/${id}`, data),

  deleteExperiment: (id: string) =>
    apiClient.delete(`${EXPERIMENTS_BASE}/${id}`),

  startExperiment: (id: string) =>
    apiClient.post<FlowExperimentDetailDto>(`${EXPERIMENTS_BASE}/${id}/start`, {}),

  pauseExperiment: (id: string) =>
    apiClient.post<FlowExperimentDetailDto>(`${EXPERIMENTS_BASE}/${id}/pause`, {}),

  resumeExperiment: (id: string) =>
    apiClient.post<FlowExperimentDetailDto>(`${EXPERIMENTS_BASE}/${id}/resume`, {}),

  completeExperiment: (id: string) =>
    apiClient.post<FlowExperimentDetailDto>(`${EXPERIMENTS_BASE}/${id}/complete`, {}),

  declareExperimentWinner: (id: string, winner: ExperimentVariantKind) =>
    apiClient.post<FlowExperimentDetailDto>(`${EXPERIMENTS_BASE}/${id}/winner`, { winner }),

  // ─── Support Cases ────────────────────────────────────────────────────────
  getSupportCases: (filter: import('../types/crm.types').CrmSupportCaseFilter = {}) =>
    apiClient.get<PagedResult<import('../types/crm.types').CrmSupportCaseSummaryDto>>(`${BASE}/support-cases`, { params: filter }),
  getSupportCaseById: (id: string) =>
    apiClient.get<import('../types/crm.types').CrmSupportCaseDetailDto>(`${BASE}/support-cases/${id}`),
  createSupportCase: (data: import('../types/crm.types').CrmSupportCaseCreateRequest) =>
    apiClient.post<import('../types/crm.types').CrmSupportCaseDetailDto>(`${BASE}/support-cases`, data),
  transitionSupportCaseStatus: (id: string, status: number, reason?: string) =>
    apiClient.patch(`${BASE}/support-cases/${id}/status`, { status, reason }),
  addSupportCaseMessage: (id: string, body: string) =>
    apiClient.post(`${BASE}/support-cases/${id}/messages`, { body }),
  escalateSupportCase: (id: string) =>
    apiClient.post(`${BASE}/support-cases/${id}/escalate`, {}),
  assignSupportCase: (id: string, userId: string) =>
    apiClient.post(`${BASE}/support-cases/${id}/assign/${userId}`, {}),
  resolveSupportCase: (id: string) =>
    apiClient.post(`${BASE}/support-cases/${id}/resolve`, {}),
  closeSupportCase: (id: string) =>
    apiClient.post(`${BASE}/support-cases/${id}/close`, {}),
  getSlaPolicies: () =>
    apiClient.get<import('../types/crm.types').CrmSlaPolicySummaryDto[]>(`${BASE}/sla-policies`),
  createSlaPolicy: (data: import('../types/crm.types').CrmSlaPolicyCreateRequest) =>
    apiClient.post(`${BASE}/sla-policies`, data),
  deleteSlaPolicy: (id: string) =>
    apiClient.delete(`${BASE}/sla-policies/${id}`),

  // ─── Tasks ────────────────────────────────────────────────────────────────
  getTasks: (filter: import('../types/crm.types').CrmTaskFilter = {}) =>
    apiClient.get<PagedResult<import('../types/crm.types').CrmTaskSummaryDto>>(`${BASE}/tasks`, { params: filter }),
  getTaskById: (id: string) =>
    apiClient.get<import('../types/crm.types').CrmTaskDetailDto>(`${BASE}/tasks/${id}`),
  createTask: (data: import('../types/crm.types').CrmTaskCreateRequest) =>
    apiClient.post<import('../types/crm.types').CrmTaskDetailDto>(`${BASE}/tasks`, data),
  updateTask: (id: string, data: import('../types/crm.types').CrmTaskUpdateRequest) =>
    apiClient.put<import('../types/crm.types').CrmTaskDetailDto>(`${BASE}/tasks/${id}`, data),
  deleteTask: (id: string) =>
    apiClient.delete(`${BASE}/tasks/${id}`),
  completeTask: (id: string) =>
    apiClient.post(`${BASE}/tasks/${id}/complete`, {}),

  // ─── Quotes ───────────────────────────────────────────────────────────────
  getQuotes: (filter: import('../types/crm.types').CrmQuoteFilter = {}) =>
    apiClient.get<PagedResult<import('../types/crm.types').CrmQuoteSummaryDto>>(`${BASE}/quotes`, { params: filter }),
  getQuoteById: (id: string) =>
    apiClient.get<import('../types/crm.types').CrmQuoteDetailDto>(`${BASE}/quotes/${id}`),
  createQuote: (data: import('../types/crm.types').CrmQuoteCreateRequest) =>
    apiClient.post<import('../types/crm.types').CrmQuoteDetailDto>(`${BASE}/quotes`, data),
  updateQuote: (id: string, data: import('../types/crm.types').CrmQuoteUpdateRequest) =>
    apiClient.put<import('../types/crm.types').CrmQuoteDetailDto>(`${BASE}/quotes/${id}`, data),
  sendQuote: (id: string) =>
    apiClient.post(`${BASE}/quotes/${id}/send`, {}),
  acceptQuote: (id: string) =>
    apiClient.post(`${BASE}/quotes/${id}/accept`, {}),
  rejectQuote: (id: string) =>
    apiClient.post(`${BASE}/quotes/${id}/reject`, {}),
  reviseQuote: (id: string) =>
    apiClient.post<import('../types/crm.types').CrmQuoteSummaryDto>(`${BASE}/quotes/${id}/revise`),
  createOrderFromQuote: (quoteId: string) =>
    apiClient.post<import('../types/crm.types').CrmOrderDetailDto>(`${BASE}/orders/from-quote/${quoteId}`),
  updateQuoteStatus: (id: string, status: number) =>
    apiClient.patch(`${BASE}/quotes/${id}/status`, { status }),
  deleteQuote: (id: string) =>
    apiClient.delete(`${BASE}/quotes/${id}`),

  // ─── Proposals ────────────────────────────────────────────────────────────
  getProposals: (filter: import('../types/crm.types').CrmProposalFilter = {}) =>
    apiClient.get<PagedResult<import('../types/crm.types').CrmProposalSummaryDto>>(`${BASE}/proposals`, { params: filter }),
  getProposalById: (id: string) =>
    apiClient.get<import('../types/crm.types').CrmProposalDetailDto>(`${BASE}/proposals/${id}`),
  generateProposal: (data: import('../types/crm.types').CrmProposalGenerateRequest) =>
    apiClient.post<import('../types/crm.types').CrmProposalDetailDto>(`${BASE}/proposals/generate`, data),
  createProposal: (data: import('../types/crm.types').CrmProposalCreateRequest) =>
    apiClient.post<import('../types/crm.types').CrmProposalDetailDto>(`${BASE}/proposals/manual`, data),
  createProposalFromLead: (data: import('../types/crm.types').CrmProposalFromLeadRequest) =>
    apiClient.post<import('../types/crm.types').CrmProposalDetailDto>(`${BASE}/proposals/from-lead`, data),
  sendProposal: (id: string) =>
    apiClient.post(`${BASE}/proposals/${id}/send`, {}),
  acceptProposal: (id: string) =>
    apiClient.post(`${BASE}/proposals/${id}/accept`, {}),
  rejectProposal: (id: string) =>
    apiClient.post(`${BASE}/proposals/${id}/reject`, {}),
  getProposalTemplates: () =>
    apiClient.get<import('../types/crm.types').CrmProposalTemplateSummaryDto[]>(`${BASE}/proposals/templates`),
  updateProposalSection: (proposalId: string, sectionId: string, content: string) =>
    apiClient.put<import('../types/crm.types').CrmProposalSectionDto>(`${BASE}/proposals/${proposalId}/sections/${sectionId}`, { content }),
  regenerateProposalSection: (proposalId: string, sectionId: string) =>
    apiClient.post(`${BASE}/proposals/${proposalId}/sections/${sectionId}/regenerate`, {}),

  // ─── Invoices ─────────────────────────────────────────────────────────────
  getInvoices: (filter: import('../types/crm.types').CrmInvoiceFilter = {}) =>
    apiClient.get<PagedResult<import('../types/crm.types').CrmInvoiceSummaryDto>>(`${BASE}/invoices`, { params: filter }),
  getInvoiceById: (id: string) =>
    apiClient.get<import('../types/crm.types').CrmInvoiceDetailDto>(`${BASE}/invoices/${id}`),
  generateInvoiceFromDeal: (dealId: string) =>
    apiClient.post<import('../types/crm.types').CrmInvoiceDetailDto>(`${BASE}/invoices/generate-from-deal/${dealId}`, {}),
  generateInvoiceFromOrder: (orderId: string) =>
    apiClient.post<import('../types/crm.types').CrmInvoiceDetailDto>(`${BASE}/invoices/generate-from-order/${orderId}`, {}),
  recordInvoicePayment: (id: string, data: import('../types/crm.types').CrmRecordPaymentRequest) =>
    apiClient.post(`${BASE}/invoices/${id}/payment`, data),
  disputeInvoice: (id: string) =>
    apiClient.post(`${BASE}/invoices/${id}/dispute`, {}),
  voidInvoice: (id: string) =>
    apiClient.post(`${BASE}/invoices/${id}/void`, {}),
  sendInvoice: (id: string) =>
    apiClient.post(`${BASE}/invoices/${id}/send`, {}),

  // ─── Subscriptions ────────────────────────────────────────────────────────
  getSubscriptions: (filter: import('../types/crm.types').CrmSubscriptionFilter = {}) =>
    apiClient.get<PagedResult<import('../types/crm.types').CrmSubscriptionSummaryDto>>(`${BASE}/subscriptions`, { params: filter }),
  getSubscriptionById: (id: string) =>
    apiClient.get<import('../types/crm.types').CrmSubscriptionDetailDto>(`${BASE}/subscriptions/${id}`),
  createSubscription: (data: import('../types/crm.types').CrmSubscriptionCreateRequest) =>
    apiClient.post<import('../types/crm.types').CrmSubscriptionDetailDto>(`${BASE}/subscriptions`, data),
  updateSubscription: (id: string, data: import('../types/crm.types').CrmSubscriptionUpdateRequest) =>
    apiClient.put<import('../types/crm.types').CrmSubscriptionDetailDto>(`${BASE}/subscriptions/${id}`, data),
  cancelSubscription: (id: string) =>
    apiClient.post(`${BASE}/subscriptions/${id}/cancel`, {}),
  pauseSubscription: (id: string) =>
    apiClient.post(`${BASE}/subscriptions/${id}/pause`, {}),
  resumeSubscription: (id: string) =>
    apiClient.post(`${BASE}/subscriptions/${id}/resume`, {}),

  // ─── Orders ───────────────────────────────────────────────────────────────
  getOrders: (filter: import('../types/crm.types').CrmOrderFilter = {}) =>
    apiClient.get<PagedResult<import('../types/crm.types').CrmOrderDetailDto>>(`${BASE}/orders`, { params: filter }),
  getOrderById: (id: string) =>
    apiClient.get<import('../types/crm.types').CrmOrderDetailDto>(`${BASE}/orders/${id}`),
  createOrder: (data: import('../types/crm.types').CrmOrderCreateRequest) =>
    apiClient.post<import('../types/crm.types').CrmOrderDetailDto>(`${BASE}/orders`, data),
  updateOrder: (id: string, data: import('../types/crm.types').CrmOrderUpdateRequest) =>
    apiClient.put<import('../types/crm.types').CrmOrderDetailDto>(`${BASE}/orders/${id}`, data),
  confirmOrder: (id: string) =>
    apiClient.post<import('../types/crm.types').CrmOrderDetailDto>(`${BASE}/orders/${id}/confirm`, {}),
  fulfillOrder: (id: string) =>
    apiClient.post<import('../types/crm.types').CrmOrderDetailDto>(`${BASE}/orders/${id}/fulfill`, {}),
  cancelOrder: (id: string, reason?: string) =>
    apiClient.post<import('../types/crm.types').CrmOrderDetailDto>(`${BASE}/orders/${id}/cancel`, {}, { params: { reason } }),
  recordOrderPayment: (id: string, data: { amount: number; paymentMethod?: string; paymentReference?: string }) =>
    apiClient.post<import('../types/crm.types').CrmOrderDetailDto>(`${BASE}/orders/${id}/payment`, data),
  updateOrderFulfillment: (id: string, data: { status: number; carrier?: string; trackingNumber?: string; actualDeliveryDate?: string; failureReason?: string }) =>
    apiClient.patch<import('../types/crm.types').CrmOrderDetailDto>(`${BASE}/orders/${id}/fulfillment`, data),

  // ─── Pick List / Packing ──────────────────────────────────────────────────
  generatePickList: (orderId: string) =>
    apiClient.post<import('../types/crm.types').PickListDto>(`${BASE}/orders/${orderId}/pick-list`),
  getPickList: (orderId: string) =>
    apiClient.get<import('../types/crm.types').PickListDto>(`${BASE}/orders/${orderId}/pick-list`),
  updatePickListItem: (orderId: string, itemId: string, data: import('../types/crm.types').UpdatePickListItemRequest) =>
    apiClient.put<import('../types/crm.types').PickListItemDto>(`${BASE}/orders/${orderId}/pick-list/items/${itemId}`, data),
  markPickListPicked: (orderId: string) =>
    apiClient.post<import('../types/crm.types').PickListDto>(`${BASE}/orders/${orderId}/pick-list/mark-picked`),
  markPickListPacked: (orderId: string, data: import('../types/crm.types').MarkPackedRequest) =>
    apiClient.post<import('../types/crm.types').PickListDto>(`${BASE}/orders/${orderId}/pick-list/pack`, data),

  // ─── Meetings ─────────────────────────────────────────────────────────────
  getMeetings: (filter: import('../types/crm.types').CrmMeetingFilter = {}) =>
    apiClient.get<PagedResult<import('../types/crm.types').CrmMeetingSummaryDto>>(`${BASE}/meetings`, { params: filter }),
  getMeetingById: (id: string) =>
    apiClient.get<import('../types/crm.types').CrmMeetingDetailDto>(`${BASE}/meetings/${id}`),
  initiateMeeting: (data: import('../types/crm.types').CrmMeetingInitiateRequest) =>
    apiClient.post<import('../types/crm.types').CrmMeetingDetailDto>(`${BASE}/meetings`, data),
  bookMeeting: (id: string, selectedSlot: string, durationMinutes: number) =>
    apiClient.post(`${BASE}/meetings/${id}/book`, { selectedSlot, durationMinutes }),
  cancelMeeting: (id: string) =>
    apiClient.post(`${BASE}/meetings/${id}/cancel`, {}),
  updateMeeting: (id: string, data: { status?: number; notes?: string }) =>
    apiClient.put<import('../types/crm.types').CrmMeetingDetailDto>(`${BASE}/meetings/${id}`, data),
  createTaskFromMeeting: (id: string, title?: string, assignedToUserId?: string) =>
    apiClient.post(`${BASE}/meetings/${id}/tasks`, { title, assignedToUserId }),

  // ─── Public Scheduling (no-auth) ─────────────────────────────────────────
  getPublicSchedule: (token: string) =>
    apiClient.get<import('../types/crm.types').PublicScheduleDto>(`/v1/public/schedule/${token}`),
  confirmPublicSlot: (token: string, data: import('../types/crm.types').PublicScheduleConfirmRequest) =>
    apiClient.post<import('../types/crm.types').PublicScheduleConfirmedDto>(`/v1/public/schedule/${token}/confirm`, data),

  // ─── Call Summaries ───────────────────────────────────────────────────────
  getCallSummaries: (filter: import('../types/crm.types').CrmCallSummaryFilter = {}) =>
    apiClient.get<PagedResult<import('../types/crm.types').CrmCallSummarySummaryDto>>(`${BASE}/call-summaries`, { params: filter }),
  getCallSummaryById: (id: string) =>
    apiClient.get<import('../types/crm.types').CrmCallSummaryDetailDto>(`${BASE}/call-summaries/${id}`),
  requestCallSummary: (data: import('../types/crm.types').CrmCallSummaryRequestDto) =>
    apiClient.post<import('../types/crm.types').CrmCallSummaryDetailDto>(`${BASE}/call-summaries`, data),
  generateCallSummary: (id: string) =>
    apiClient.post(`${BASE}/call-summaries/${id}/generate`, {}),

  // ─── NPS Surveys ─────────────────────────────────────────────────────────
  getNpsSurveys: (filter: import('../types/crm.types').CrmNpsFilter = {}) =>
    apiClient.get<PagedResult<import('../types/crm.types').CrmNpsSurveySummaryDto>>(`${BASE}/nps`, { params: filter }),
  getNpsTenantSummary: () =>
    apiClient.get<import('../types/crm.types').CrmNpsTenantSummaryDto>(`${BASE}/nps/summary`),
  sendNpsSurvey: (data: import('../types/crm.types').CrmNpsSendRequest) =>
    apiClient.post<import('../types/crm.types').CrmNpsSurveySummaryDto>(`${BASE}/nps/send`, data),

  // ─── Time Tracking ────────────────────────────────────────────────────────
  getTimeEntries: (filter: import('../types/crm.types').CrmTimeEntryFilter = {}) =>
    apiClient.get<PagedResult<import('../types/crm.types').CrmTimeEntrySummaryDto>>(`${BASE}/time-tracking`, { params: filter }),
  getTimeSummary: () =>
    apiClient.get<import('../types/crm.types').CrmTimeSummaryDto>(`${BASE}/time-tracking/summary`),
  logTime: (data: import('../types/crm.types').CrmLogTimeRequest) =>
    apiClient.post<import('../types/crm.types').CrmTimeEntrySummaryDto>(`${BASE}/time-tracking`, data),
  deleteTimeEntry: (id: string) =>
    apiClient.delete(`${BASE}/time-tracking/${id}`),

  // ─── Comments ─────────────────────────────────────────────────────────────
  getComments: (kind: number, entityId: string, page = 1, pageSize = 50) =>
    apiClient.get<PagedResult<import('../types/crm.types').CrmCommentDto>>(`${BASE}/comments/${kind}/${entityId}`, { params: { page, pageSize } }),
  addComment: (kind: number, entityId: string, data: import('../types/crm.types').CrmCommentCreateRequest) =>
    apiClient.post<import('../types/crm.types').CrmCommentDto>(`${BASE}/comments/${kind}/${entityId}`, data),
  editComment: (commentId: string, data: import('../types/crm.types').CrmCommentEditRequest) =>
    apiClient.put<import('../types/crm.types').CrmCommentDto>(`${BASE}/comments/${commentId}`, data),
  deleteComment: (commentId: string) =>
    apiClient.delete(`${BASE}/comments/${commentId}`),

  // ─── Workflows ────────────────────────────────────────────────────────────
  getWorkflows: (filter: import('../types/crm.types').CrmWorkflowFilter = {}) =>
    apiClient.get<PagedResult<import('../types/crm.types').CrmWorkflowSummaryDto>>(`${BASE}/workflows`, { params: filter }),
  getWorkflowById: (id: string) =>
    apiClient.get<import('../types/crm.types').CrmWorkflowDetailDto>(`${BASE}/workflows/${id}`),
  createWorkflow: (data: import('../types/crm.types').CrmWorkflowCreateRequest) =>
    apiClient.post<import('../types/crm.types').CrmWorkflowDetailDto>(`${BASE}/workflows`, data),
  updateWorkflow: (id: string, data: import('../types/crm.types').CrmWorkflowUpdateRequest) =>
    apiClient.put<import('../types/crm.types').CrmWorkflowDetailDto>(`${BASE}/workflows/${id}`, data),
  deleteWorkflow: (id: string) =>
    apiClient.delete(`${BASE}/workflows/${id}`),
  triggerWorkflow: (data: import('../types/crm.types').CrmWorkflowTriggerRequest) =>
    apiClient.post(`${BASE}/workflows/trigger`, data),
  runWorkflow: (id: string) =>
    apiClient.post<import('../types/crm.types').CrmWorkflowExecutionDto>(`${BASE}/workflows/${id}/run`),
  getWorkflowExecutions: (workflowId: string, page = 1, pageSize = 20) =>
    apiClient.get<PagedResult<import('../types/crm.types').CrmWorkflowExecutionDto>>(`${BASE}/workflows/${workflowId}/executions`, { params: { page, pageSize } }),
  generateWorkflow: (data: { Instruction: string; WorkflowName?: string }) =>
    apiClient.post<import('../types/crm.types').CrmWorkflowDetailDto>(`${BASE}/workflows/generate`, data),
  chatWorkflow: (id: string, data: { Message: string }) =>
    apiClient.post<import('../types/crm.types').CrmWorkflowDetailDto>(`${BASE}/workflows/${id}/chat`, data),
  getTriggerDefinitions: () =>
    apiClient.get<{ triggerType: string; displayName: string }[]>(`${BASE}/workflows/trigger-definitions`),

  // ─── Workflow Campaigns ──────────────────────────────────────────────────
  getWorkflowCampaigns: () =>
    apiClient.get<import('../types/crm.types').CrmWorkflowCampaignDto[]>(`${BASE}/workflow-campaigns`),
  getWorkflowCampaignById: (id: string) =>
    apiClient.get<import('../types/crm.types').CrmWorkflowCampaignDto>(`${BASE}/workflow-campaigns/${id}`),
  createWorkflowCampaign: (data: import('../types/crm.types').CrmWorkflowCampaignCreateRequest) =>
    apiClient.post<import('../types/crm.types').CrmWorkflowCampaignDto>(`${BASE}/workflow-campaigns`, data),
  updateWorkflowCampaign: (id: string, data: import('../types/crm.types').CrmWorkflowCampaignUpdateRequest) =>
    apiClient.put<import('../types/crm.types').CrmWorkflowCampaignDto>(`${BASE}/workflow-campaigns/${id}`, data),
  executeWorkflowCampaign: (id: string) =>
    apiClient.post<import('../types/crm.types').CrmWorkflowCampaignDto>(`${BASE}/workflow-campaigns/${id}/execute`),

  // ─── AI Actions ───────────────────────────────────────────────────────────
  getAiActions: (page = 1, pageSize = 20) =>
    apiClient.get<PagedResult<import('../types/crm.types').CrmAiActionDto>>(`${BASE}/ai-actions`, { params: { page, pageSize } }),
  getPendingAiActions: () =>
    apiClient.get<import('../types/crm.types').CrmAiActionDto[]>(`${BASE}/ai-actions/pending`),
  approveAiAction: (id: string) =>
    apiClient.post(`${BASE}/ai-actions/${id}/approve`, {}),
  rejectAiAction: (id: string) =>
    apiClient.post(`${BASE}/ai-actions/${id}/reject`, {}),
  undoAiAction: (id: string) =>
    apiClient.post(`${BASE}/ai-actions/${id}/undo`, {}),

  // ─── Facebook / Instagram Ads ─────────────────────────────────────────────
  getFbAdAccount: () =>
    apiClient.get<import('../types/crm.types').FbAdAccountDto | null>(`${BASE}/fb-ads/account`),
  connectFbAdAccount: (data: import('../types/crm.types').FbAdAccountConnectRequest) =>
    apiClient.post<import('../types/crm.types').FbAdAccountDto>(`${BASE}/fb-ads/account`, data),
  disconnectFbAdAccount: () =>
    apiClient.delete(`${BASE}/fb-ads/account`),
  getFbAdCampaigns: () =>
    apiClient.get<import('../types/crm.types').FbAdCampaignDto[]>(`${BASE}/fb-ads/campaigns`),
  syncFbAdCampaigns: () =>
    apiClient.post<import('../types/crm.types').FbAdSyncResultDto>(`${BASE}/fb-ads/campaigns/sync`, {}),
  getFbAdAggregate: () =>
    apiClient.get<import('../types/crm.types').FbAdAggregateDto>(`${BASE}/fb-ads/aggregate`),

  // ─── TikTok Ads ───────────────────────────────────────────────────────────
  getTikTokAdAccount: () =>
    apiClient.get<import('../types/crm.types').TikTokAdAccountDto | null>(`${BASE}/tiktok-ads/account`),
  connectTikTokAdAccount: (data: import('../types/crm.types').TikTokAdAccountConnectRequest) =>
    apiClient.post<import('../types/crm.types').TikTokAdAccountDto>(`${BASE}/tiktok-ads/account`, data),
  disconnectTikTokAdAccount: () =>
    apiClient.delete(`${BASE}/tiktok-ads/account`),
  getTikTokAdCampaigns: () =>
    apiClient.get<import('../types/crm.types').TikTokAdCampaignDto[]>(`${BASE}/tiktok-ads/campaigns`),
  syncTikTokAdCampaigns: () =>
    apiClient.post<import('../types/crm.types').TikTokAdSyncResultDto>(`${BASE}/tiktok-ads/campaigns/sync`, {}),
  getTikTokAdAggregate: () =>
    apiClient.get<import('../types/crm.types').TikTokAdAggregateDto>(`${BASE}/tiktok-ads/aggregate`),

  // ─── Announcements ────────────────────────────────────────────────────────
  getAnnouncements: (status?: AnnouncementStatus) =>
    apiClient.get<AnnouncementSummaryDto[]>(ANN_BASE, { params: status != null ? { status } : undefined }),
  getAnnouncementById: (id: string) =>
    apiClient.get<AnnouncementDetailDto>(`${ANN_BASE}/${id}`),
  createAnnouncement: (data: AnnouncementCreateRequest) =>
    apiClient.post<AnnouncementDetailDto>(ANN_BASE, data),
  updateAnnouncement: (id: string, data: AnnouncementUpdateRequest) =>
    apiClient.put<AnnouncementDetailDto>(`${ANN_BASE}/${id}`, data),
  deleteAnnouncement: (id: string) =>
    apiClient.delete(`${ANN_BASE}/${id}`),
  publishAnnouncement: (id: string) =>
    apiClient.post<AnnouncementDetailDto>(`${ANN_BASE}/${id}/publish`, {}),
  archiveAnnouncement: (id: string) =>
    apiClient.post<AnnouncementDetailDto>(`${ANN_BASE}/${id}/archive`, {}),
  scheduleAnnouncement: (id: string, scheduledAt: string) =>
    apiClient.post<AnnouncementDetailDto>(`${ANN_BASE}/${id}/schedule`, { scheduledAt }),
  getAnnouncementAnalytics: (id: string) =>
    apiClient.get<any>(`${ANN_BASE}/${id}/analytics`),
  getAnnouncementRecipients: (id: string, page = 1) =>
    apiClient.get<any[]>(`${ANN_BASE}/${id}/recipients`, { params: { page, pageSize: 50 } }),
  getAnnouncementSummaryStats: () =>
    apiClient.get<any>(`${ANN_BASE}/analytics/summary`),

  // ─── Approval Workflows ───────────────────────────────────────────────────
  getApprovals: (status?: import('../types/crm.types').ApprovalStatus) =>
    apiClient.get<import('../types/crm.types').CrmApprovalSummaryDto[]>(`${BASE}/approvals`, { params: status != null ? { status } : undefined }),
  getMyApprovals: (status?: import('../types/crm.types').ApprovalStatus) =>
    apiClient.get<import('../types/crm.types').CrmApprovalSummaryDto[]>(`${BASE}/approvals/my`, { params: status != null ? { status } : undefined }),
  getPendingApprovals: () =>
    apiClient.get<import('../types/crm.types').CrmApprovalSummaryDto[]>(`${BASE}/approvals/pending`),
  getApprovalById: (id: string) =>
    apiClient.get<import('../types/crm.types').CrmApprovalSummaryDto>(`${BASE}/approvals/${id}`),
  getApprovalForEntity: (entityType: number, entityId: string) =>
    apiClient.get<import('../types/crm.types').CrmApprovalSummaryDto | null>(`${BASE}/approvals/entity/${entityType}/${entityId}`),
  submitApproval: (data: import('../types/crm.types').CrmSubmitApprovalRequest) =>
    apiClient.post<import('../types/crm.types').CrmApprovalSummaryDto>(`${BASE}/approvals`, data),
  approveRequest: (id: string, data: import('../types/crm.types').CrmReviewApprovalRequest) =>
    apiClient.post(`${BASE}/approvals/${id}/approve`, data),
  rejectRequest: (id: string, data: import('../types/crm.types').CrmReviewApprovalRequest) =>
    apiClient.post(`${BASE}/approvals/${id}/reject`, data),
  cancelApproval: (id: string) =>
    apiClient.post(`${BASE}/approvals/${id}/cancel`, {}),

  // ─── Custom Fields — Definitions ─────────────────────────────────────────
  getCustomFieldDefinitions: (entityType: number) =>
    apiClient.get<import('../types/crm.types').CustomFieldDefinitionDto[]>(`${BASE}/custom-fields`, { params: { entityType } }),
  createCustomFieldDefinition: (data: import('../types/crm.types').CreateCustomFieldDefinitionRequest) =>
    apiClient.post<import('../types/crm.types').CustomFieldDefinitionDto>(`${BASE}/custom-fields`, data),
  updateCustomFieldDefinition: (id: string, data: import('../types/crm.types').UpdateCustomFieldDefinitionRequest) =>
    apiClient.put<import('../types/crm.types').CustomFieldDefinitionDto>(`${BASE}/custom-fields/${id}`, data),
  deleteCustomFieldDefinition: (id: string) =>
    apiClient.delete(`${BASE}/custom-fields/${id}`),

  // ─── Custom Fields — Values ───────────────────────────────────────────────
  getCustomFieldValues: (recordId: string, entityType: number) =>
    apiClient.get<import('../types/crm.types').CustomFieldValueDto[]>(`${BASE}/custom-field-values/${recordId}`, { params: { entityType } }),
  setCustomFieldValues: (recordId: string, entityType: number, data: import('../types/crm.types').SetCustomFieldValuesRequest) =>
    apiClient.put(`${BASE}/custom-field-values/${recordId}`, data, { params: { entityType } }),

  // ─── CSV Export ───────────────────────────────────────────────────────────
  getContactsCsvTemplate: () => `${BASE}/contacts/csv-template`,
  getLeadsCsvTemplate:    () => `${BASE}/leads/csv-template`,
  getDealsCsvTemplate:    () => `${BASE}/deals/csv-template`,
  exportContactsCsv: () => `${BASE}/contacts/export-csv`,
  exportLeadsCsv:    () => `${BASE}/leads/export-csv`,
  exportDealsCsv:    () => `${BASE}/deals/export-csv`,

  // ─── CSV Import ───────────────────────────────────────────────────────────
  importContactsCsv: (file: File) => {
    const form = new FormData(); form.append('file', file);
    return apiClient.post<import('../types/crm.types').CsvImportResultDto>(`${BASE}/contacts/import-csv`, form, { headers: { 'Content-Type': undefined } });
  },
  importLeadsCsv: (file: File) => {
    const form = new FormData(); form.append('file', file);
    return apiClient.post<import('../types/crm.types').CsvImportResultDto>(`${BASE}/leads/import-csv`, form, { headers: { 'Content-Type': undefined } });
  },
  importDealsCsv: (file: File) => {
    const form = new FormData(); form.append('file', file);
    return apiClient.post<import('../types/crm.types').CsvImportResultDto>(`${BASE}/deals/import-csv`, form, { headers: { 'Content-Type': undefined } });
  },

  // ─── Contracts (CLM) ──────────────────────────────────────────────────────
  getContracts: (params?: { status?: number; accountId?: string }) =>
    apiClient.get<import('../types/crm.types').CrmContractDto[]>(`${BASE}/contracts`, { params }),
  getContractById: (id: string) =>
    apiClient.get<import('../types/crm.types').CrmContractDetailDto>(`${BASE}/contracts/${id}`),
  createContract: (data: import('../types/crm.types').CrmContractCreateRequest) =>
    apiClient.post<import('../types/crm.types').CrmContractDetailDto>(`${BASE}/contracts`, data),
  updateContractStatus: (id: string, status: number) =>
    apiClient.patch<import('../types/crm.types').CrmContractDetailDto>(`${BASE}/contracts/${id}/status`, { status }),
  deleteContract: (id: string) =>
    apiClient.delete(`${BASE}/contracts/${id}`),
  // Signatories
  addContractSignatory: (contractId: string, data: import('../types/crm.types').CrmContractSignatoryRequest) =>
    apiClient.post<import('../types/crm.types').CrmContractSignatoryDto>(`${BASE}/contracts/${contractId}/signatories`, data),
  recordContractSignature: (signatoryId: string, data: import('../types/crm.types').CrmRecordSignatureRequest) =>
    apiClient.put<import('../types/crm.types').CrmContractSignatoryDto>(`${BASE}/contracts/signatories/${signatoryId}/sign`, data),
  removeContractSignatory: (signatoryId: string) =>
    apiClient.delete(`${BASE}/contracts/signatories/${signatoryId}`),
  // Templates
  getContractTemplates: (category?: number) =>
    apiClient.get<import('../types/crm.types').CrmContractTemplateDto[]>(`${BASE}/contracts/templates`, { params: { category } }),
  getContractTemplateById: (id: string) =>
    apiClient.get<import('../types/crm.types').CrmContractTemplateDto>(`${BASE}/contracts/templates/${id}`),
  createContractTemplate: (data: import('../types/crm.types').CrmContractTemplateCreateRequest) =>
    apiClient.post<import('../types/crm.types').CrmContractTemplateDto>(`${BASE}/contracts/templates`, data),
  updateContractTemplate: (id: string, data: Partial<import('../types/crm.types').CrmContractTemplateDto>) =>
    apiClient.put<import('../types/crm.types').CrmContractTemplateDto>(`${BASE}/contracts/templates/${id}`, data),
  deleteContractTemplate: (id: string) =>
    apiClient.delete(`${BASE}/contracts/templates/${id}`),
  previewContractTemplate: (id: string, context: import('../types/crm.types').CrmContractCreateRequest) =>
    apiClient.post<string>(`${BASE}/contracts/templates/${id}/preview`, context),

  // ─── Invoice payment links ────────────────────────────────────────────────
  generateInvoicePaymentLink: (id: string) =>
    apiClient.post<string>(`${BASE}/invoices/${id}/payment-link`, {}),

  // public, no-auth (token is the secret)
  getPublicInvoice: (token: string) =>
    apiClient.get<import('../types/crm.types').CrmInvoicePublicDto>(`/v1/public/pay/${token}`),
  payPublicInvoice: (token: string, reference?: string) =>
    apiClient.post<boolean>(`/v1/public/pay/${token}`, { reference }),

  // ─── Business Catalog Items (for Price Book product picker) ───────────────
  getCatalogItems: () =>
    apiClient.get<any>('/v1/business-catalog/items', { params: { pageSize: 1000 } })
      .then((r: any) => r?.items ?? []),

  // ─── CPQ Price Books ──────────────────────────────────────────────────────
  getPriceBooks: () =>
    apiClient.get<import('../types/crm.types').CrmPriceBookDto[]>(`${BASE}/price-books`),
  getPriceBookById: (id: string) =>
    apiClient.get<import('../types/crm.types').CrmPriceBookDetailDto>(`${BASE}/price-books/${id}`),
  createPriceBook: (data: import('../types/crm.types').CrmPriceBookCreateRequest) =>
    apiClient.post<import('../types/crm.types').CrmPriceBookDto>(`${BASE}/price-books`, data),
  updatePriceBook: (id: string, data: Partial<import('../types/crm.types').CrmPriceBookDto>) =>
    apiClient.put<import('../types/crm.types').CrmPriceBookDto>(`${BASE}/price-books/${id}`, data),
  deletePriceBook: (id: string) =>
    apiClient.delete(`${BASE}/price-books/${id}`),
  addPriceBookEntry: (id: string, data: import('../types/crm.types').CrmPriceBookEntryRequest) =>
    apiClient.post<import('../types/crm.types').CrmPriceBookEntryDto>(`${BASE}/price-books/${id}/entries`, data),
  updatePriceBookEntry: (entryId: string, data: import('../types/crm.types').CrmPriceBookEntryRequest) =>
    apiClient.put<import('../types/crm.types').CrmPriceBookEntryDto>(`${BASE}/price-books/entries/${entryId}`, data),
  deletePriceBookEntry: (entryId: string) =>
    apiClient.delete(`${BASE}/price-books/entries/${entryId}`),

  // ─── Product bundles (CPQ) ────────────────────────────────────────────────
  getProductBundles: () =>
    apiClient.get<import('../types/crm.types').CrmProductBundleDto[]>(`${BASE}/product-bundles`),
  getProductBundleById: (id: string) =>
    apiClient.get<import('../types/crm.types').CrmProductBundleDetailDto>(`${BASE}/product-bundles/${id}`),
  createProductBundle: (data: import('../types/crm.types').CrmProductBundleCreateRequest) =>
    apiClient.post<import('../types/crm.types').CrmProductBundleDto>(`${BASE}/product-bundles`, data),
  deleteProductBundle: (id: string) =>
    apiClient.delete(`${BASE}/product-bundles/${id}`),
  addProductBundleItem: (id: string, data: import('../types/crm.types').CrmProductBundleItemRequest) =>
    apiClient.post<import('../types/crm.types').CrmProductBundleItemDto>(`${BASE}/product-bundles/${id}/items`, data),
  deleteProductBundleItem: (itemId: string) =>
    apiClient.delete(`${BASE}/product-bundles/items/${itemId}`),

  // ─── Renewals ─────────────────────────────────────────────────────────────
  getRenewals: (filter: import('../types/crm.types').CrmRenewalFilter = {}) =>
    apiClient.get<PagedResult<import('../types/crm.types').CrmRenewalListItemDto>>(`${BASE}/renewals`, { params: filter }),
  initiateRenewalOutreach: (id: string) =>
    apiClient.post(`${BASE}/renewals/${id}/initiate-outreach`, {}),
  recordRenewalOutcome: (id: string, data: import('../types/crm.types').CrmRenewalOutcomeRequest) =>
    apiClient.post(`${BASE}/renewals/${id}/outcome`, data),
  evaluateRenewals: () =>
    apiClient.post<number>(`${BASE}/renewals/evaluate-all`, {}),

  // ─── Deduplication ──────────────────────────────────────────────────────────
  getDedupPending: () =>
    apiClient.get<import('../types/crm.types').CrmDedupCandidateDto[]>(`${BASE}/deduplication/pending`),
  resolveDedup: (candidateId: string, data: import('../types/crm.types').CrmDedupResolutionRequest) =>
    apiClient.post<import('../types/crm.types').CrmDedupCandidateDto>(`${BASE}/deduplication/${candidateId}/resolve`, data),
  scanDedup: () =>
    apiClient.post<number>(`${BASE}/deduplication/scan`),


  // ─── Ops Dashboard ────────────────────────────────────────────────────────────
  getOpsDashboard: () =>
    apiClient.get<import('../types/crm.types').OpsDashboardDto>(`${BASE}/ops-dashboard`),

  // ─── Dispatch Calendar ────────────────────────────────────────────────────────
  getDispatchCalendar: (from: string, to: string, technicianId?: string) =>
    apiClient.get<import('../types/crm.types').DispatchCalendarDto>(`${BASE}/dispatch/calendar`, {
      params: { from, to, technicianId },
    }),

  // ─── Time Periods ─────────────────────────────────────────────────────────────
  getTimePeriods: (filter: import('../types/crm.types').CrmTimePeriodFilter) =>
    apiClient.get<import('../types/crm.types').PagedResult<import('../types/crm.types').CrmTimePeriodDto>>(`${BASE}/time-periods`, { params: filter }),
  getTimePeriodById: (id: string) =>
    apiClient.get<import('../types/crm.types').CrmTimePeriodDto>(`${BASE}/time-periods/${id}`),
  createTimePeriod: (data: import('../types/crm.types').CrmCreateTimePeriodRequest) =>
    apiClient.post<import('../types/crm.types').CrmTimePeriodDto>(`${BASE}/time-periods`, data),
  submitTimePeriod: (id: string, data: import('../types/crm.types').CrmSubmitTimePeriodRequest) =>
    apiClient.post<import('../types/crm.types').CrmTimePeriodDto>(`${BASE}/time-periods/${id}/submit`, data),
  approveTimePeriod: (id: string, data: import('../types/crm.types').CrmReviewTimePeriodRequest) =>
    apiClient.post<import('../types/crm.types').CrmTimePeriodDto>(`${BASE}/time-periods/${id}/approve`, data),
  rejectTimePeriod: (id: string, data: import('../types/crm.types').CrmReviewTimePeriodRequest) =>
    apiClient.post<import('../types/crm.types').CrmTimePeriodDto>(`${BASE}/time-periods/${id}/reject`, data),
  deleteTimePeriod: (id: string) =>
    apiClient.delete(`${BASE}/time-periods/${id}`),

  // ─── Approval Chains ──────────────────────────────────────────────────────────
  getApprovalChains: () =>
    apiClient.get<import('../types/crm.types').CrmApprovalChainDefinitionDto[]>(`${BASE}/approval-chains`),
  getApprovalChainById: (id: string) =>
    apiClient.get<import('../types/crm.types').CrmApprovalChainDefinitionDto>(`${BASE}/approval-chains/${id}`),
  createApprovalChain: (data: import('../types/crm.types').CrmCreateApprovalChainRequest) =>
    apiClient.post<import('../types/crm.types').CrmApprovalChainDefinitionDto>(`${BASE}/approval-chains`, data),
  updateApprovalChain: (id: string, data: import('../types/crm.types').CrmCreateApprovalChainRequest) =>
    apiClient.put<import('../types/crm.types').CrmApprovalChainDefinitionDto>(`${BASE}/approval-chains/${id}`, data),
  deleteApprovalChain: (id: string) =>
    apiClient.delete(`${BASE}/approval-chains/${id}`),
  submitForChain: (data: import('../types/crm.types').CrmSubmitForChainRequest) =>
    apiClient.post<import('../types/crm.types').CrmApprovalSummaryDto>(`${BASE}/approvals/chain`, data),

  // ─── Assignment Rotation ──────────────────────────────────────────────────────
  getRotationMembers: (entityType: string) =>
    apiClient.get<string[]>(`${BASE}/assignment-rotation/${entityType}/members`),
  addRotationMember: (entityType: string, userId: string) =>
    apiClient.post(`${BASE}/assignment-rotation/${entityType}/members/${userId}`),
  removeRotationMember: (entityType: string, userId: string) =>
    apiClient.delete(`${BASE}/assignment-rotation/${entityType}/members/${userId}`),

  // ─── Web Events ───────────────────────────────────────────────────────────────
  getWebEvents: (page = 1, pageSize = 50) =>
    apiClient.get<import('../types/crm.types').PagedResult<import('../types/crm.types').WebEventSummaryDto>>('/v1/events', { params: { page, pageSize } }),

  // ─── Vendors ──────────────────────────────────────────────────────────────────
  getVendors: (filter: import('../types/crm.types').VendorFilter) =>
    apiClient.get<import('../types/crm.types').PagedResult<import('../types/crm.types').VendorDto>>(`${BASE}/vendors`, { params: filter }),
  getVendorById: (id: string) =>
    apiClient.get<import('../types/crm.types').VendorDto>(`${BASE}/vendors/${id}`),
  getActiveVendors: () =>
    apiClient.get<import('../types/crm.types').VendorDto[]>(`${BASE}/vendors/active`),
  createVendor: (data: import('../types/crm.types').VendorCreateRequest) =>
    apiClient.post<import('../types/crm.types').VendorDto>(`${BASE}/vendors`, data),
  updateVendor: (id: string, data: import('../types/crm.types').VendorUpdateRequest) =>
    apiClient.put<import('../types/crm.types').VendorDto>(`${BASE}/vendors/${id}`, data),
  deleteVendor: (id: string) =>
    apiClient.delete(`${BASE}/vendors/${id}`),

  // ─── Purchase Orders ──────────────────────────────────────────────────────────
  getPurchaseOrders: (filter: import('../types/crm.types').PurchaseOrderFilter) =>
    apiClient.get<import('../types/crm.types').PagedResult<import('../types/crm.types').PurchaseOrderDto>>(`${BASE}/purchase-orders`, { params: filter }),
  getPurchaseOrderById: (id: string) =>
    apiClient.get<import('../types/crm.types').PurchaseOrderDto>(`${BASE}/purchase-orders/${id}`),
  getPurchaseOrdersByVendor: (vendorId: string) =>
    apiClient.get<import('../types/crm.types').PurchaseOrderDto[]>(`${BASE}/purchase-orders/by-vendor/${vendorId}`),
  createPurchaseOrder: (data: import('../types/crm.types').PurchaseOrderCreateRequest) =>
    apiClient.post<import('../types/crm.types').PurchaseOrderDto>(`${BASE}/purchase-orders`, data),
  updatePurchaseOrder: (id: string, data: import('../types/crm.types').PurchaseOrderUpdateRequest) =>
    apiClient.put<import('../types/crm.types').PurchaseOrderDto>(`${BASE}/purchase-orders/${id}`, data),
  submitPurchaseOrderForApproval: (id: string) =>
    apiClient.post<import('../types/crm.types').PurchaseOrderDto>(`${BASE}/purchase-orders/${id}/submit`, {}),
  approvePurchaseOrder: (id: string) =>
    apiClient.post<import('../types/crm.types').PurchaseOrderDto>(`${BASE}/purchase-orders/${id}/approve`, {}),
  rejectPurchaseOrder: (id: string, data: import('../types/crm.types').PoRejectRequest) =>
    apiClient.post<import('../types/crm.types').PurchaseOrderDto>(`${BASE}/purchase-orders/${id}/reject`, data),
  markPurchaseOrderSentToVendor: (id: string) =>
    apiClient.post<import('../types/crm.types').PurchaseOrderDto>(`${BASE}/purchase-orders/${id}/send`, {}),
  cancelPurchaseOrder: (id: string, reason?: string) =>
    apiClient.post<import('../types/crm.types').PurchaseOrderDto>(`${BASE}/purchase-orders/${id}/cancel`, { reason }),
  closePurchaseOrder: (id: string) =>
    apiClient.post<import('../types/crm.types').PurchaseOrderDto>(`${BASE}/purchase-orders/${id}/close`, {}),

  // ─── Goods Receipts ───────────────────────────────────────────────────────────
  getGoodsReceipts: (filter: import('../types/crm.types').GoodsReceiptFilter) =>
    apiClient.get<import('../types/crm.types').PagedResult<import('../types/crm.types').GoodsReceiptDto>>(`${BASE}/goods-receipts`, { params: filter }),
  getGoodsReceiptById: (id: string) =>
    apiClient.get<import('../types/crm.types').GoodsReceiptDto>(`${BASE}/goods-receipts/${id}`),
  getGoodsReceiptsByPurchaseOrder: (poId: string) =>
    apiClient.get<import('../types/crm.types').GoodsReceiptDto[]>(`${BASE}/goods-receipts/by-purchase-order/${poId}`),
  createGoodsReceipt: (data: import('../types/crm.types').GoodsReceiptCreateRequest) =>
    apiClient.post<import('../types/crm.types').GoodsReceiptDto>(`${BASE}/goods-receipts`, data),
  confirmGoodsReceipt: (id: string) =>
    apiClient.post<import('../types/crm.types').GoodsReceiptDto>(`${BASE}/goods-receipts/${id}/confirm`, {}),
  voidGoodsReceipt: (id: string) =>
    apiClient.post<import('../types/crm.types').GoodsReceiptDto>(`${BASE}/goods-receipts/${id}/void`, {}),

  // ─── Supplier Invoices ────────────────────────────────────────────────────────
  getSupplierInvoices: (filter: import('../types/crm.types').SupplierInvoiceFilter) =>
    apiClient.get<import('../types/crm.types').PagedResult<import('../types/crm.types').SupplierInvoiceDto>>(`${BASE}/supplier-invoices`, { params: filter }),
  getSupplierInvoiceById: (id: string) =>
    apiClient.get<import('../types/crm.types').SupplierInvoiceDto>(`${BASE}/supplier-invoices/${id}`),
  getOverdueSupplierInvoices: () =>
    apiClient.get<import('../types/crm.types').SupplierInvoiceDto[]>(`${BASE}/supplier-invoices/overdue`),
  createSupplierInvoice: (data: import('../types/crm.types').SupplierInvoiceCreateRequest) =>
    apiClient.post<import('../types/crm.types').SupplierInvoiceDto>(`${BASE}/supplier-invoices`, data),
  updateSupplierInvoice: (id: string, data: import('../types/crm.types').SupplierInvoiceUpdateRequest) =>
    apiClient.put<import('../types/crm.types').SupplierInvoiceDto>(`${BASE}/supplier-invoices/${id}`, data),
  approveSupplierInvoice: (id: string) =>
    apiClient.post<import('../types/crm.types').SupplierInvoiceDto>(`${BASE}/supplier-invoices/${id}/approve`, {}),
  recordSupplierInvoicePayment: (id: string, data: import('../types/crm.types').SupplierInvoiceRecordPaymentRequest) =>
    apiClient.post<import('../types/crm.types').SupplierInvoiceDto>(`${BASE}/supplier-invoices/${id}/pay`, data),
  disputeSupplierInvoice: (id: string, data: import('../types/crm.types').SupplierInvoiceDisputeRequest) =>
    apiClient.post<import('../types/crm.types').SupplierInvoiceDto>(`${BASE}/supplier-invoices/${id}/dispute`, data),
  voidSupplierInvoice: (id: string) =>
    apiClient.post<import('../types/crm.types').SupplierInvoiceDto>(`${BASE}/supplier-invoices/${id}/void`, {}),

  // ─── Tax Rules ────────────────────────────────────────────────────────────────
  getTaxRules: () =>
    apiClient.get<import('../types/crm.types').CrmTaxRuleDto[]>('/v1/crm/tax-rules'),
  getTaxRuleById: (id: string) =>
    apiClient.get<import('../types/crm.types').CrmTaxRuleDto>(`/v1/crm/tax-rules/${id}`),
  createTaxRule: (data: import('../types/crm.types').CrmTaxRuleCreateRequest) =>
    apiClient.post<import('../types/crm.types').CrmTaxRuleDto>('/v1/crm/tax-rules', data),
  updateTaxRule: (id: string, data: import('../types/crm.types').CrmTaxRuleUpdateRequest) =>
    apiClient.put<import('../types/crm.types').CrmTaxRuleDto>(`/v1/crm/tax-rules/${id}`, data),
  deleteTaxRule: (id: string) =>
    apiClient.delete<void>(`/v1/crm/tax-rules/${id}`),

  // ─── Lead Scoring Rules ─────────────────────────────────────────────────────────
  getScoringRules: () =>
    apiClient.get<any[]>('/v1/crm/scoring-rules'),
  createScoringRule: (data: any) =>
    apiClient.post<any>('/v1/crm/scoring-rules', data),
  updateScoringRule: (id: string, data: any) =>
    apiClient.put<any>(`/v1/crm/scoring-rules/${id}`, data),
  deleteScoringRule: (id: string) =>
    apiClient.delete<void>(`/v1/crm/scoring-rules/${id}`),
  triggerScoreEvent: (leadId: string, data: { eventType: string; note?: string }) =>
    apiClient.post<any>(`/v1/crm/scoring-rules/trigger/${leadId}`, data),
  getScoreEventHistory: (leadId: string) =>
    apiClient.get<any[]>(`/v1/crm/scoring-rules/history/${leadId}`),

  // ─── Payment Terms ────────────────────────────────────────────────────────────
  getPaymentTerms: () =>
    apiClient.get<any[]>('/v1/crm/payment-terms'),
  createPaymentTerm: (data: any) =>
    apiClient.post<any>('/v1/crm/payment-terms', data),
  updatePaymentTerm: (id: string, data: any) =>
    apiClient.put<any>(`/v1/crm/payment-terms/${id}`, data),
  deletePaymentTerm: (id: string) =>
    apiClient.delete<void>(`/v1/crm/payment-terms/${id}`),

  // ─── Competitors ────────────────────────────────────────────────────────────
  getCompetitors: () =>
    apiClient.get<import('../types/crm.types').CrmCompetitorDto[]>('/v1/crm/competitors'),
  createCompetitor: (data: import('../types/crm.types').CrmCompetitorCreateRequest) =>
    apiClient.post<import('../types/crm.types').CrmCompetitorDto>('/v1/crm/competitors', data),
  updateCompetitor: (id: string, data: Partial<import('../types/crm.types').CrmCompetitorDto>) =>
    apiClient.put<import('../types/crm.types').CrmCompetitorDto>(`/v1/crm/competitors/${id}`, data),
  deleteCompetitor: (id: string) =>
    apiClient.delete<void>(`/v1/crm/competitors/${id}`),
  getCompetitorAnalytics: () =>
    apiClient.get<import('../types/crm.types').CrmCompetitorAnalyticsDto[]>('/v1/crm/competitors/analytics'),
  getCompetitorDetail: (id: string) =>
    apiClient.get<import('../types/crm.types').CrmCompetitorDetailDto>(`/v1/crm/competitors/${id}/detail`),
  getDealCompetitors: (dealId: string) =>
    apiClient.get<import('../types/crm.types').CrmDealCompetitorDto[]>(`/v1/crm/competitors/deal/${dealId}`),
  addDealCompetitor: (dealId: string, data: { competitorId: string; ourStrengths?: string; theirStrengths?: string }) =>
    apiClient.post<import('../types/crm.types').CrmDealCompetitorDto>(`/v1/crm/competitors/deal/${dealId}`, data),
  updateDealCompetitorOutcome: (dealCompetitorId: string, outcome: number) =>
    apiClient.put<import('../types/crm.types').CrmDealCompetitorDto>(`/v1/crm/competitors/deal/${dealCompetitorId}/outcome`, outcome),
  removeDealCompetitor: (dealCompetitorId: string) =>
    apiClient.delete<void>(`/v1/crm/competitors/deal/${dealCompetitorId}`),

  // ─── Inventory ────────────────────────────────────────────────────────────────
  getInventory: (filter?: { belowReorderPoint?: boolean; search?: string; page?: number; pageSize?: number }) =>
    apiClient.get<PagedResult<import('../types/crm.types').InventoryItemDto>>(`/v1/inventory`, { params: filter }),
  getInventoryByProduct: (productId: string) =>
    apiClient.get<import('../types/crm.types').InventoryItemDto>(`/v1/inventory/${productId}`),
  checkStock: (items: import('../types/crm.types').StockCheckItem[]) =>
    apiClient.post<import('../types/crm.types').StockCheckResult>(`/v1/inventory/check`, items),
  adjustInventory: (productId: string, data: import('../types/crm.types').InventoryAdjustRequest) =>
    apiClient.post<import('../types/crm.types').InventoryItemDto>(`/v1/inventory/${productId}/adjust`, data),
  getInventoryTransactions: (productId: string) =>
    apiClient.get<any[]>(`/v1/inventory/${productId}/transactions`),

  acknowledgeOrder: (id: string) =>
    apiClient.post(`/v1/crm/orders/${id}/acknowledge`),
  creditCheck: (accountId: string, orderValue: number) =>
    apiClient.post<import('../types/crm.types').CreditCheckResult>(`/v1/crm/orders/credit-check`, { accountId, orderValue }),
  getDealHandover: (dealId: string) =>
    apiClient.get<import('../types/crm.types').DealHandoverDto | null>(`/v1/crm/deals/${dealId}/handover`),
  submitDealHandover: (dealId: string, data: import('../types/crm.types').DealHandoverSubmitRequest) =>
    apiClient.post<import('../types/crm.types').DealHandoverDto>(`/v1/crm/deals/${dealId}/handover`, data),

  // ─── Shared Inbox ──────────────────────────────────────────────────────────────
  getInbox: (filter: { kind?: number }) =>
    apiClient.get<{ items: import('../types/crm.types').CrmInboxItemDto[] }>(`/v1/crm/inbox`, { params: filter }),
  getInboxSummary: () =>
    apiClient.get<import('../types/crm.types').CrmInboxSummaryDto>(`/v1/crm/inbox/summary`),
  claimInboxItem: ({ kind, entityId }: { kind: number; entityId: string }) =>
    apiClient.post(`/v1/crm/inbox/${kind}/${entityId}/claim`),

  // ─── Commissions ──────────────────────────────────────────────────────────────
  getCommissionEntries: (filter: import('../types/crm.types').CrmCommissionFilter) =>
    apiClient.get<import('../types/crm.types').CrmCommissionEntryDto[]>(`/v1/crm/commissions/entries`, { params: filter }),
  getCommissionPayouts: (periodCode?: string) =>
    apiClient.get<import('../types/crm.types').CrmCommissionPayoutDto[]>(`/v1/crm/commissions/payouts`, { params: periodCode ? { periodCode } : undefined }),
  runCommission: (data: { periodCode: string; periodStart: string; periodEnd: string }) =>
    apiClient.post(`/v1/crm/commissions/run`, data),
  createCommissionPlan: (data: { name: string; rateType: number; rateValue: number; targetEntity: number }) =>
    apiClient.post(`/v1/crm/commissions/plans`, data),
  finalizePayout: (id: string, data: import('../types/crm.types').CrmFinalizePayoutRequest) =>
    apiClient.post(`/v1/crm/commissions/payouts/${id}/finalize`, data),
  markPayoutPaid: (id: string) =>
    apiClient.post(`/v1/crm/commissions/payouts/${id}/pay`),
} as const;
