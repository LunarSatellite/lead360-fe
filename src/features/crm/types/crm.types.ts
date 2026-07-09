// Lead stages matching backend LeadStage enum
export const LeadStage = {
  New: 1, Warm: 2, Hot: 3, Nurturing: 4, Converted: 5, Lost: 6, Qualified: 7, MQL: 8,
} as const;
export type LeadStage = (typeof LeadStage)[keyof typeof LeadStage];

export const LEAD_STAGE_LABELS: Record<LeadStage, string> = {
  1: 'New', 2: 'Warm', 3: 'Hot', 4: 'Nurturing', 5: 'Converted', 6: 'Lost', 7: 'Qualified', 8: 'MQL',
};

export const LEAD_STAGE_COLORS: Record<LeadStage, string> = {
  1: 'text-text-secondary bg-bg-elevated border-border-subtle',
  2: 'text-[#F59E0B] bg-[rgba(245,158,11,0.1)] border-[rgba(245,158,11,0.2)]',
  3: 'text-danger bg-danger-soft border-[rgba(244,63,94,0.2)]',
  4: 'text-brand bg-brand-soft border-border-glow',
  5: 'text-success bg-success-soft border-[rgba(34,197,94,0.2)]',
  6: 'text-text-muted bg-bg-card border-border-subtle',
  7: 'text-[#A78BFA] bg-[rgba(167,139,250,0.1)] border-[rgba(167,139,250,0.2)]',
  8: 'text-success bg-success-soft border-[rgba(34,197,94,0.2)]',
};

export const ChannelType = {
  WhatsApp: 1, Telegram: 2, Messenger: 3, SMS: 4, Voice: 5, Email: 6, WebChat: 7, Test: 8,
} as const;
export type ChannelType = (typeof ChannelType)[keyof typeof ChannelType];

export const CHANNEL_LABELS: Record<ChannelType, string> = {
  1: 'WhatsApp', 2: 'Telegram', 3: 'Messenger', 4: 'SMS',
  5: 'Voice', 6: 'Email', 7: 'WebChat', 8: 'Test',
};

export const CampaignStatus = {
  Draft: 1, Scheduled: 2, Running: 3, Completed: 4, Cancelled: 5,
} as const;
export type CampaignStatus = (typeof CampaignStatus)[keyof typeof CampaignStatus];

export const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
  1: 'Draft', 2: 'Scheduled', 3: 'Running', 4: 'Completed', 5: 'Cancelled',
};

export const CAMPAIGN_STATUS_COLORS: Record<CampaignStatus, string> = {
  1: 'text-text-secondary bg-bg-elevated border-border-subtle',
  2: 'text-[#A78BFA] bg-[rgba(167,139,250,0.1)] border-[rgba(167,139,250,0.2)]',
  3: 'text-[#F59E0B] bg-[rgba(245,158,11,0.1)] border-[rgba(245,158,11,0.2)]',
  4: 'text-success bg-success-soft border-[rgba(34,197,94,0.2)]',
  5: 'text-text-muted bg-bg-card border-border-subtle',
};

export const NurtureStepAction = {
  SendMessage: 1, ChangeStage: 2, AssignToHuman: 3, AddTag: 4, SendAlert: 5,
} as const;
export type NurtureStepAction = (typeof NurtureStepAction)[keyof typeof NurtureStepAction];

export const NURTURE_ACTION_LABELS: Record<NurtureStepAction, string> = {
  1: 'Send Message', 2: 'Change Stage', 3: 'Assign to Human', 4: 'Add Tag', 5: 'Send Alert',
};

export const NurtureSequenceType = {
  Generic:      0,
  WinBack:      1,
  Onboarding:   2,
  Upsell:       3,
  Reactivation: 4,
  PostPurchase: 5,
} as const;
export type NurtureSequenceType = (typeof NurtureSequenceType)[keyof typeof NurtureSequenceType];

export const NURTURE_SEQUENCE_TYPE_LABELS: Record<NurtureSequenceType, string> = {
  0: 'Generic',
  1: 'Win-Back',
  2: 'Onboarding',
  3: 'Upsell',
  4: 'Reactivation',
  5: 'Post-Purchase',
};

export const NURTURE_SEQUENCE_TYPE_DESCRIPTIONS: Record<NurtureSequenceType, string> = {
  0: 'Friendly check-in for leads who went quiet',
  1: 'Re-engage cold leads without pressure',
  2: 'Guide new leads toward their first action',
  3: 'Introduce a higher-value option to warm leads',
  4: 'Final genuine attempt to recover a lost lead',
  5: 'Retain and delight converted customers',
};

export const NurtureTriggerType = {
  StageEntered: 0,
  ScoreDropped: 1,
  ScoreRaised:  2,
  Manual:       3,
} as const;
export type NurtureTriggerType = (typeof NurtureTriggerType)[keyof typeof NurtureTriggerType];

export const NURTURE_TRIGGER_TYPE_LABELS: Record<NurtureTriggerType, string> = {
  0: 'Stage Entered',
  1: 'Score Dropped',
  2: 'Score Raised',
  3: 'Manual Only',
};

export const NURTURE_TRIGGER_TYPE_DESCRIPTIONS: Record<NurtureTriggerType, string> = {
  0: 'Enrolls when lead reaches a specific stage',
  1: 'Enrolls when lead score falls to or below a threshold',
  2: 'Enrolls when lead score rises to or above a threshold',
  3: 'Never auto-enrolls — sales rep triggers manually',
};

export const NotificationType = {
  HotLead: 1, LeadConverted: 2, CampaignComplete: 3, NurtureReply: 4, LeadAssigned: 5,
} as const;
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

export const LeadSource = {
  Unknown: 0, Chatbot: 1, Campaign: 2, Manual: 3,
} as const;
export type LeadSource = (typeof LeadSource)[keyof typeof LeadSource];

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  0: 'Unknown', 1: 'Chatbot', 2: 'Campaign', 3: 'Manual',
};

export interface LeadActivityDto {
  id: string;
  leadId: string;
  activityType: number;
  summary: string | null;
  occurredAt: string;
}

export interface LeadSummaryDto {
  id: string;
  tenantId: string;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  channel: ChannelType;
  channelHandle: string;
  source: LeadSource;
  stage: LeadStage;
  score: number;
  intentSummary: string | null;
  tags: string | null;
  assignedToUserName: string | null;
  companyName?: string;
  companyDomain?: string;
  companyIndustry?: string;
  companyEmployeeCount?: number;
  companyCity?: string;
  companyCountry?: string;
  companyWebsite?: string;
  notes?: string;
  lastActivityAt: string;
  convertedAt: string | null;
  createdAt: string;
}

export interface LeadNurtureStatusDto {
  enrollmentId: string;
  sequenceName: string;
  status: number; // EnrollmentStatus: 1=Active, 2=Paused, 3=Completed, 4=Cancelled
  currentStep: number;
  totalSteps: number;
  nextMessageAt: string | null;
  nextMessagePreview: string | null;
  lastMessageSent: string | null;
  lastMessageSentAt: string | null;
}

export interface LeadDetailDto extends LeadSummaryDto {
  scoreReason: string | null;
  assignedToUserId: string | null;
  alertSent: boolean;
  convertedContactId?: string;
  convertedAccountId?: string;
  convertedDealId?: string;
  activities: LeadActivityDto[];
  nurtureStatus: LeadNurtureStatusDto | null;
}

export interface LeadStatsDto {
  total: number;
  newCount: number;
  warmCount: number;
  hotCount: number;
  nurturingCount: number;
  convertedCount: number;
  lostCount: number;
  convertedToday: number;
  conversionRate: number;
  chatbotCount: number;
  campaignCount: number;
  inNurtureCount: number;
}

export interface LeadFilter {
  stage?: LeadStage;
  source?: LeadSource;
  hasNurture?: boolean;
  minScore?: number;
  channel?: ChannelType;
  search?: string;
  page?: number;
  pageSize?: number;
}

export enum BulkLeadAction {
  Stage = 1,
  Assign = 2,
  Delete = 3,
}

export interface BulkLeadActionRequest {
  leadIds: string[];
  action: BulkLeadAction;
  stage?: LeadStage;
  assignToUserId?: string | null;
}

export interface BulkLeadActionResult {
  requested: number;
  succeeded: number;
  skipped: number;
  errors: string[];
}

/** Per-tenant feature toggles (mirrors backend TenantFeatureSettingsDto). */
export interface TenantFeatureSettings {
  unifiedLeadPipelineEnabled: boolean;
  webChatPipelineEnabled: boolean;
  conversationalPipelineEnabled: boolean;
  emailPipelineEnabled: boolean;
  eventApiPipelineEnabled: boolean;
  scoringAtIngestEnabled: boolean;
  ragEnrichmentAtIngestEnabled: boolean;
  dedupScanAtIngestEnabled: boolean;
  agentRuntimeEnabled: boolean;
  rerankerEnabled: boolean;
  correctiveRagEnabled: boolean;
  knowledgeRerankerEnabled: boolean;
}

/** Generic bulk-operation outcome shared by contact/deal bulk-delete endpoints. */
export interface CrmBulkResult {
  requested: number;
  succeeded: number;
  skipped: number;
  errors: string[];
}

export enum BulkDealAction {
  Stage = 1,
  Assign = 2,
  Delete = 3,
}

export interface BulkDealActionRequest {
  dealIds: string[];
  action: BulkDealAction;
  stageId?: string;
  assignToUserId?: string | null;
}

export enum CrmFunnelStage {
  Anonymous = 0,
  Identified = 1,
  Inquiring = 2,
  Qualified = 3,
  Negotiating = 4,
  Closing = 5,
  Customer = 6,
  Repeat = 7,
}

export const CRM_FUNNEL_STAGE_LABELS: Record<CrmFunnelStage, string> = {
  [CrmFunnelStage.Anonymous]: 'Anonymous',
  [CrmFunnelStage.Identified]: 'Identified',
  [CrmFunnelStage.Inquiring]: 'Inquiring',
  [CrmFunnelStage.Qualified]: 'Qualified',
  [CrmFunnelStage.Negotiating]: 'Negotiating',
  [CrmFunnelStage.Closing]: 'Closing',
  [CrmFunnelStage.Customer]: 'Customer',
  [CrmFunnelStage.Repeat]: 'Repeat',
};

export enum BulkContactAction {
  FunnelStage = 1,
  Assign = 2,
  Delete = 3,
}

export interface BulkContactActionRequest {
  contactIds: string[];
  action: BulkContactAction;
  funnelStage?: CrmFunnelStage;
  assignToUserId?: string | null;
}

export interface NurtureStepDto {
  id: string;
  sequenceId: string;
  stepOrder: number;
  delayHours: number;
  delayMinutes: number;
  actionType: NurtureStepAction;
  messageTemplate: string | null;
  channel: ChannelType | null;
  newStage: LeadStage | null;
  tagToAdd: string | null;
}

export interface NurtureStepCreateRequest {
  stepOrder: number;
  delayHours: number;
  delayMinutes: number;
  actionType: NurtureStepAction;
  messageTemplate?: string;
  channel?: ChannelType;
  newStage?: LeadStage;
  tagToAdd?: string;
}

export interface NurtureSequenceDto {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  triggerStage: LeadStage;
  triggerDelayHours: number;
  triggerDelayMinutes: number;
  isActive: boolean;
  useAiPersonalization: boolean;
  useAiTiming: boolean;
  sequenceType: NurtureSequenceType;
  triggerType: NurtureTriggerType;
  triggerScoreThreshold: number | null;
  steps: NurtureStepDto[];
  createdAt: string;
}

export interface NurtureSequenceCreateRequest {
  name: string;
  description?: string;
  triggerStage: LeadStage;
  triggerDelayHours: number;
  triggerDelayMinutes: number;
  useAiPersonalization: boolean;
  useAiTiming: boolean;
  sequenceType: NurtureSequenceType;
  triggerType: NurtureTriggerType;
  triggerScoreThreshold?: number;
  steps: NurtureStepCreateRequest[];
}

export interface NurtureSequenceUpdateRequest {
  name?: string;
  description?: string;
  triggerStage?: LeadStage;
  triggerDelayHours?: number;
  triggerDelayMinutes?: number;
  isActive?: boolean;
  useAiPersonalization?: boolean;
  useAiTiming?: boolean;
  sequenceType?: NurtureSequenceType;
  triggerType?: NurtureTriggerType;
  triggerScoreThreshold?: number;
  steps?: NurtureStepCreateRequest[];
}

export interface NurtureEnrollmentDto {
  id: string;
  leadId: string;
  leadName: string | null;
  sequenceId: string;
  sequenceName: string | null;
  currentStep: number;
  status: EnrollmentStatus;
  nextStepAt: string | null;
  completedAt: string | null;
  createdAt: string;
}


export interface CampaignRecipientDto {
  id: string;
  leadId: string;
  status: number;
  sentAt: string | null;
  failureReason: string | null;
}

export interface LeadCampaignDto {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  messageTemplate: string | null;
  segmentFilterJson: string | null;
  status: CampaignStatus;
  scheduledAt: string | null;
  executedAt: string | null;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  createdAt: string;
  recipients: CampaignRecipientDto[];
}

export interface LeadSegmentFilter {
  stages?: LeadStage[];
  minScore?: number;
  channels?: ChannelType[];
  lastActiveDays?: number;
}

export interface LeadSegmentPreviewDto {
  matchCount: number;
  sample: LeadSummaryDto[];
}

export interface LeadCampaignCreateRequest {
  name: string;
  description?: string;
  messageTemplate: string;
  segmentFilter?: LeadSegmentFilter;
}

export interface StaffNotificationDto {
  id: string;
  tenantId: string;
  userId: string | null;
  title: string;
  body: string;
  notificationType: NotificationType;
  isRead: boolean;
  relatedLeadId: string | null;
  createdAt: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

// ─── B2B CRM enums ────────────────────────────────────────────────────────────

export const CrmContactSourceKind = {
  Manual: 1, LeadConversion: 2, EmailSync: 3, Import: 4, WebForm: 5,
} as const;
export type CrmContactSourceKind = (typeof CrmContactSourceKind)[keyof typeof CrmContactSourceKind];
export const CRM_CONTACT_SOURCE_LABELS: Record<CrmContactSourceKind, string> = {
  1: 'Manual', 2: 'Lead Conversion', 3: 'Email Sync', 4: 'Import', 5: 'Web Form',
};

export const CrmAccountStatus = {
  Prospect: 1, Customer: 2, Partner: 3, Churned: 4,
} as const;
export type CrmAccountStatus = (typeof CrmAccountStatus)[keyof typeof CrmAccountStatus];
export const CRM_ACCOUNT_STATUS_LABELS: Record<CrmAccountStatus, string> = {
  1: 'Prospect', 2: 'Customer', 3: 'Partner', 4: 'Churned',
};
export const CRM_ACCOUNT_STATUS_COLORS: Record<CrmAccountStatus, string> = {
  1: 'text-text-secondary bg-bg-elevated border-border-subtle',
  2: 'text-success bg-success-soft border-[rgba(34,197,94,0.2)]',
  3: 'text-brand bg-brand-soft border-border-glow',
  4: 'text-text-muted bg-bg-card border-border-subtle',
};

export const CrmAccountTier = {
  SMB: 1, MidMarket: 2, Enterprise: 3,
} as const;
export type CrmAccountTier = (typeof CrmAccountTier)[keyof typeof CrmAccountTier];
export const CRM_ACCOUNT_TIER_LABELS: Record<CrmAccountTier, string> = {
  1: 'SMB', 2: 'Mid-Market', 3: 'Enterprise',
};

export const CrmDealType = {
  Sales: 1, Service: 2, SupportCase: 3, Renewal: 4,
} as const;
export type CrmDealType = (typeof CrmDealType)[keyof typeof CrmDealType];
export const CRM_DEAL_TYPE_LABELS: Record<CrmDealType, string> = {
  1: 'Sales', 2: 'Service', 3: 'Support', 4: 'Renewal',
};

export const CrmDealStatus = {
  Open: 1, ClosedWon: 2, ClosedLost: 3,
} as const;
export type CrmDealStatus = (typeof CrmDealStatus)[keyof typeof CrmDealStatus];
export const CRM_DEAL_STATUS_LABELS: Record<CrmDealStatus, string> = {
  1: 'Open', 2: 'Closed Won', 3: 'Closed Lost',
};
export const CRM_DEAL_STATUS_COLORS: Record<CrmDealStatus, string> = {
  1: 'text-[#F59E0B] bg-[rgba(245,158,11,0.1)] border-[rgba(245,158,11,0.2)]',
  2: 'text-success bg-success-soft border-[rgba(34,197,94,0.2)]',
  3: 'text-danger bg-danger-soft border-[rgba(244,63,94,0.2)]',
};

export const StageGateType = { RequiredField: 1, ManualCheck: 2 } as const;
export type StageGateType = (typeof StageGateType)[keyof typeof StageGateType];
export const STAGE_GATE_TYPE_LABELS: Record<StageGateType, string> = {
  1: 'Required Field', 2: 'Manual Check',
};

// Valid required field names for RequiredField gates
export const GATE_REQUIRED_FIELDS = [
  { value: 'Amount',        label: 'Amount must be set' },
  { value: 'CloseDate',     label: 'Close date must be set' },
  { value: 'OwnedByUserId', label: 'Owner must be assigned' },
  { value: 'AccountId',     label: 'Account must be linked' },
  { value: 'Notes',         label: 'Notes must be filled' },
  { value: 'Source',        label: 'Source must be set' },
] as const;

export interface CrmStageGateSummaryDto {
  id: string;
  stageId: string;
  gateType: StageGateType;
  label: string;
  requiredFieldName: string | null;
  order: number;
  isRequired: boolean;
  createdAt: string;
}

export interface CrmStageGateCreateRequest {
  gateType: StageGateType;
  label: string;
  requiredFieldName?: string;
  order?: number;
  isRequired?: boolean;
}

export interface CrmStageGateUpdateRequest {
  label?: string;
  requiredFieldName?: string;
  order?: number;
  isRequired?: boolean;
}

export interface CrmDealGateStatusDto {
  gateId: string;
  label: string;
  gateType: StageGateType;
  isRequired: boolean;
  isSatisfied: boolean;
  isChecked: boolean;
  checkedAt: string | null;
  checkedBy: string | null;
}

export interface CrmExitGateEvaluationDto {
  canAdvance: boolean;
  currentStageId: string;
  currentStageName: string;
  gates: CrmDealGateStatusDto[];
  blockingReasons: string[];
}

// ── Approval Workflows ────────────────────────────────────────────────────────

export const ApprovalEntityType = { Quote: 1, Proposal: 2, Deal: 3 } as const;
export type ApprovalEntityType = (typeof ApprovalEntityType)[keyof typeof ApprovalEntityType];
export const APPROVAL_ENTITY_TYPE_LABELS: Record<ApprovalEntityType, string> = {
  1: 'Quote', 2: 'Proposal', 3: 'Deal',
};

export const ApprovalStatus = { Pending: 1, Approved: 2, Rejected: 3, Cancelled: 4 } as const;
export type ApprovalStatus = (typeof ApprovalStatus)[keyof typeof ApprovalStatus];
export const APPROVAL_STATUS_LABELS: Record<ApprovalStatus, string> = {
  1: 'Pending', 2: 'Approved', 3: 'Rejected', 4: 'Cancelled',
};
export const APPROVAL_STATUS_COLORS: Record<ApprovalStatus, string> = {
  1: 'text-warning bg-warning-soft border-[rgba(245,158,11,0.2)]',
  2: 'text-success bg-success-soft border-[rgba(34,197,94,0.2)]',
  3: 'text-danger bg-danger-soft border-[rgba(244,63,94,0.2)]',
  4: 'text-text-muted bg-bg-elevated border-border-subtle',
};

export interface CrmApprovalSummaryDto {
  id: string;
  entityType: ApprovalEntityType;
  entityId: string;
  entityName: string;
  requestedByUserId: string;
  requestedByUserName: string;
  assignedToUserId: string | null;
  assignedToUserName: string | null;
  status: ApprovalStatus;
  comment: string | null;
  chainId?: string;
  currentStepOrder: number;
  totalSteps: number;
  createdAt: string;
  reviewedAt: string | null;
  decidedViaEmail: boolean;
}

export interface CrmSubmitApprovalRequest {
  entityType: ApprovalEntityType;
  entityId: string;
  entityName: string;
  assignedToUserId?: string;
}

export interface CrmReviewApprovalRequest {
  comment?: string;
}

export const CrmAccountContactRole = {
  Champion: 1, EconomicBuyer: 2, User: 3, Blocker: 4, Influencer: 5, TechnicalBuyer: 6,
} as const;
export type CrmAccountContactRole = (typeof CrmAccountContactRole)[keyof typeof CrmAccountContactRole];
export const CRM_ACCOUNT_CONTACT_ROLE_LABELS: Record<CrmAccountContactRole, string> = {
  1: 'Champion', 2: 'Economic Buyer', 3: 'User', 4: 'Blocker', 5: 'Influencer', 6: 'Technical Buyer',
};

export const CrmSignalKind = {
  Email: 1, Call: 2, Meeting: 3, Chat: 4, Note: 5, StageChange: 6,
  ScoreChange: 7, WebVisit: 8, ProductEvent: 9, Conversion: 10,
} as const;
export type CrmSignalKind = (typeof CrmSignalKind)[keyof typeof CrmSignalKind];
export const CRM_SIGNAL_KIND_LABELS: Record<CrmSignalKind, string> = {
  1: 'Email', 2: 'Call', 3: 'Meeting', 4: 'Chat', 5: 'Note', 6: 'Stage Change',
  7: 'Score Change', 8: 'Web Visit', 9: 'Product Event', 10: 'Conversion',
};

export const CrmSignalSubjectKind = {
  Lead: 1, Contact: 2, Account: 3, Deal: 4,
} as const;
export type CrmSignalSubjectKind = (typeof CrmSignalSubjectKind)[keyof typeof CrmSignalSubjectKind];

export const CrmSignalSource = {
  WhatsApp: 1, Telegram: 2, Messenger: 3, SMS: 4, EmailInbound: 5,
  EmailOutbound: 6, WebChat: 7, Voice: 8, Manual: 9, System: 10,
} as const;
export type CrmSignalSource = (typeof CrmSignalSource)[keyof typeof CrmSignalSource];
export const CRM_SIGNAL_SOURCE_LABELS: Record<CrmSignalSource, string> = {
  1: 'WhatsApp', 2: 'Telegram', 3: 'Messenger', 4: 'SMS', 5: 'Email Inbound',
  6: 'Email Outbound', 7: 'WebChat', 8: 'Voice', 9: 'Manual', 10: 'System',
};

export const CrmSignalSentiment = { Positive: 1, Neutral: 2, Negative: 3 } as const;
export type CrmSignalSentiment = (typeof CrmSignalSentiment)[keyof typeof CrmSignalSentiment];

export const CrmCampaignChannelType = { Email: 1, WhatsApp: 2, SMS: 3 } as const;
export type CrmCampaignChannelType = (typeof CrmCampaignChannelType)[keyof typeof CrmCampaignChannelType];
export const CRM_CAMPAIGN_CHANNEL_LABELS: Record<CrmCampaignChannelType, string> = {
  1: 'Email', 2: 'WhatsApp', 3: 'SMS',
};

export const ExperimentStatus = { Draft: 1, Running: 2, Paused: 3, Completed: 4 } as const;
export type ExperimentStatus = (typeof ExperimentStatus)[keyof typeof ExperimentStatus];
export const EXPERIMENT_STATUS_LABELS: Record<ExperimentStatus, string> = {
  1: 'Draft', 2: 'Running', 3: 'Paused', 4: 'Completed',
};
export const EXPERIMENT_STATUS_COLORS: Record<ExperimentStatus, string> = {
  1: 'text-text-secondary bg-bg-elevated border-border-subtle',
  2: 'text-success bg-success-soft border-[rgba(34,197,94,0.2)]',
  3: 'text-[#F59E0B] bg-[rgba(245,158,11,0.1)] border-[rgba(245,158,11,0.2)]',
  4: 'text-text-muted bg-bg-card border-border-subtle',
};

export const ExperimentVariantKind = { Control: 1, Challenger: 2 } as const;
export type ExperimentVariantKind = (typeof ExperimentVariantKind)[keyof typeof ExperimentVariantKind];

// ─── Contact DTOs ─────────────────────────────────────────────────────────────

export interface CrmContactSummaryDto {
  id: string;
  tenantId: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  jobTitle: string | null;
  sourceKind: CrmContactSourceKind;
  ownedByUserId: string | null;
  tagsJson: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface CrmContactDetailDto extends CrmContactSummaryDto {
  linkedIn: string | null;
  avatarUrl: string | null;
  sourceLeadId: string | null;
  notes: string | null;
  preferredLanguage: string | null;
}

export interface CrmContactCreateRequest {
  fullName: string;
  email?: string;
  phone?: string;
  jobTitle?: string;
  linkedIn?: string;
  ownedByUserId?: string;
  tagsJson?: string;
  notes?: string;
  sourceLeadId?: string;
  /** Resend with true to override the duplicate guard ("create anyway"). */
  allowDuplicate?: boolean;
}

/** A possible duplicate (contact or lead) surfaced at create time. */
export interface CrmDuplicateMatchDto {
  id: string;
  kind: 'contact' | 'lead';
  name?: string;
  email?: string;
  phone?: string;
  matchField: 'email' | 'phone';
}

// ── Renewals ──────────────────────────────────────────────────────────────────
export enum RenewalSegment { LowRiskRoutine = 1, ExpansionCandidate = 2, AtRisk = 3, LostCause = 4 }
export enum RenewalStatus {
  Upcoming = 1, OutreachInProgress = 2, Stalled = 3, Renewed = 4,
  Expanded = 5, Churned = 6, Lapsed = 7, InGracePeriod = 8,
}
export enum RenewalOutcome { AutoRenewed = 1, ManualRenewed = 2, Expanded = 3, Downgraded = 4, Churned = 5, Lapsed = 6 }

export const RENEWAL_SEGMENT_LABELS: Record<RenewalSegment, string> = {
  [RenewalSegment.LowRiskRoutine]: 'Low risk', [RenewalSegment.ExpansionCandidate]: 'Expansion',
  [RenewalSegment.AtRisk]: 'At risk', [RenewalSegment.LostCause]: 'Lost cause',
};
export const RENEWAL_STATUS_LABELS: Record<RenewalStatus, string> = {
  [RenewalStatus.Upcoming]: 'Upcoming', [RenewalStatus.OutreachInProgress]: 'Outreach in progress',
  [RenewalStatus.Stalled]: 'Stalled', [RenewalStatus.Renewed]: 'Renewed', [RenewalStatus.Expanded]: 'Expanded',
  [RenewalStatus.Churned]: 'Churned', [RenewalStatus.Lapsed]: 'Lapsed', [RenewalStatus.InGracePeriod]: 'Grace period',
};
export const RENEWAL_OUTCOME_LABELS: Record<RenewalOutcome, string> = {
  [RenewalOutcome.AutoRenewed]: 'Auto-renewed', [RenewalOutcome.ManualRenewed]: 'Manually renewed',
  [RenewalOutcome.Expanded]: 'Expanded', [RenewalOutcome.Downgraded]: 'Downgraded',
  [RenewalOutcome.Churned]: 'Churned', [RenewalOutcome.Lapsed]: 'Lapsed',
};

export interface CrmRenewalListItemDto {
  id: string; dealId: string; contactId: string; renewalDate: string;
  daysUntilRenewal: number; segment: RenewalSegment; status: RenewalStatus;
  contractValue: number; createdAt: string;
}
export interface CrmRenewalFilter {
  segment?: RenewalSegment; status?: RenewalStatus; dueBefore?: string; page?: number; pageSize?: number;
}
export interface CrmRenewalOutcomeRequest { outcome: RenewalOutcome; newDealId?: string }

// ── CPQ: Price Books ──────────────────────────────────────────────────────────
export interface CrmPriceBookDto {
  id: string; name: string; description?: string; currency: string;
  isActive: boolean; isDefault: boolean; entryCount: number; createdAt: string;
}
export interface CrmPriceBookEntryDto {
  id: string; priceBookId: string; productId?: string; productName: string;
  sku?: string; unitPrice: number; minQuantity?: number;
}
export interface CrmPriceBookDetailDto {
  id: string; name: string; description?: string; currency: string;
  isActive: boolean; isDefault: boolean; entries: CrmPriceBookEntryDto[]; createdAt: string;
}
export interface CrmPriceBookCreateRequest { name: string; description?: string; currency?: string; isDefault?: boolean }
export interface CrmPriceBookEntryRequest {
  productId?: string; productName: string; sku?: string; unitPrice: number; minQuantity?: number;
}

// ── Catalog Items (for Price Book product picker) ──────────────────────────
export interface CatalogItemSummaryDto {
  id: string;
  name: string;
  description?: string;
  price?: number;
  currency: string;
  unit: string;
  isAvailable: boolean;
  imageUrl?: string;
  categoryName?: string;
}

export interface CrmProductBundleDto {
  id: string; name: string; description?: string; currency: string;
  isActive: boolean; itemCount: number; total: number; createdAt: string;
}
export interface CrmProductBundleItemDto {
  id: string; bundleId: string; productId?: string; productName: string;
  sku?: string; quantity: number; unitPrice: number;
}
export interface CrmProductBundleDetailDto {
  id: string; name: string; description?: string; currency: string;
  isActive: boolean; items: CrmProductBundleItemDto[]; createdAt: string;
}
export interface CrmProductBundleCreateRequest { name: string; description?: string; currency?: string }
export interface CrmProductBundleItemRequest {
  productId?: string; productName: string; sku?: string; quantity: number; unitPrice: number;
}

// ── Contracts (CLM) ───────────────────────────────────────────────────────────
export enum CrmContractStatus {
  Draft = 1, PendingSignature = 2, Active = 3, Expired = 4, Terminated = 5, Renewed = 6,
}
export const CRM_CONTRACT_STATUS_LABELS: Record<CrmContractStatus, string> = {
  [CrmContractStatus.Draft]: 'Draft', [CrmContractStatus.PendingSignature]: 'Pending signature',
  [CrmContractStatus.Active]: 'Active', [CrmContractStatus.Expired]: 'Expired',
  [CrmContractStatus.Terminated]: 'Terminated', [CrmContractStatus.Renewed]: 'Renewed',
};
export interface CrmContractDto {
  id: string; contractNumber: string; title: string; status: CrmContractStatus;
  accountId?: string; contactId?: string; dealId?: string; subscriptionId?: string;
  value: number; currency: string; startDate?: string; endDate?: string;
  renewalTermMonths?: number; autoRenew: boolean; signedAt?: string;
  documentUrl?: string; notes?: string; signedCount: number; signatoryCount: number; createdAt: string;
}
export interface CrmContractCreateRequest {
  title: string; accountId?: string; contactId?: string; dealId?: string; subscriptionId?: string;
  value?: number; currency?: string; startDate?: string; endDate?: string;
  renewalTermMonths?: number; autoRenew?: boolean; documentUrl?: string; notes?: string;
  templateId?: string;
}
export interface CrmContractDetailDto extends CrmContractDto {
  templateId?: string;
  signatories: CrmContractSignatoryDto[];
}
export interface CrmContractSignatoryDto {
  id: string; name: string; email?: string; signOrder: number;
  signedAt?: string; signedByName?: string;
}
export interface CrmContractSignatoryRequest { name: string; email?: string; signOrder: number }
export interface CrmRecordSignatureRequest { signedByName: string; signedAt?: string }

export const ContractTemplateCategory = { General: 0, MSA: 1, NDA: 2, SaaS: 3, ServiceAgreement: 4, SalesAgreement: 5, Renewal: 6, Amendment: 7 } as const;
export type ContractTemplateCategoryValue = (typeof ContractTemplateCategory)[keyof typeof ContractTemplateCategory];
export const CONTRACT_TEMPLATE_CATEGORY_LABELS: Record<ContractTemplateCategoryValue, string> = {
  [ContractTemplateCategory.General]: 'General', [ContractTemplateCategory.MSA]: 'MSA',
  [ContractTemplateCategory.NDA]: 'NDA', [ContractTemplateCategory.SaaS]: 'SaaS Agreement',
  [ContractTemplateCategory.ServiceAgreement]: 'Service Agreement', [ContractTemplateCategory.SalesAgreement]: 'Sales Agreement',
  [ContractTemplateCategory.Renewal]: 'Renewal', [ContractTemplateCategory.Amendment]: 'Amendment',
};
export interface CrmContractTemplateDto {
  id: string; name: string; description?: string; category: ContractTemplateCategoryValue;
  subject?: string; bodyHtml: string; isActive: boolean; createdAt: string;
}
export interface CrmContractTemplateCreateRequest {
  name: string; description?: string; category: ContractTemplateCategoryValue;
  subject?: string; bodyHtml: string;
}

// ── Public pay (payment links) ────────────────────────────────────────────────
export interface CrmCompetitorDto { id: string; name: string; website?: string; notes?: string; }
export interface CrmCompetitorCreateRequest { name: string; website?: string; notes?: string; }
export interface CrmDealCompetitorDto { id: string; competitorId: string; competitorName: string; ourStrengths?: string; theirStrengths?: string; outcome: number; }
export interface CrmCompetitorAnalyticsDto { name: string; totalDeals: number; won: number; lost: number; winRatePct: number; revenueWon: number; revenueLost: number; }
export interface CrmCompetitorTrendPoint { period: string; total: number; won: number; lost: number; winRatePct: number; }
export interface CrmCompetitorDetailDto { name: string; website?: string; notes?: string; trends: CrmCompetitorTrendPoint[]; }
export const DealCompetitorOutcome = { Pending: 0, WonAgainst: 1, LostTo: 2, NoDecision: 3 } as const;
export type DealCompetitorOutcomeValue = (typeof DealCompetitorOutcome)[keyof typeof DealCompetitorOutcome];
export const DEAL_COMPETITOR_OUTCOME_LABELS: Record<number, string> = { 0: 'Pending', 1: 'Won Against', 2: 'Lost To', 3: 'No Decision' };

export interface CrmInvoicePublicDto {
  invoiceNumber: string; totalAmount: number; currencyCode: string;
  status: string; dueDate: string; isPaid: boolean;
}

export interface CrmContactUpdateRequest {
  fullName?: string;
  email?: string;
  phone?: string;
  jobTitle?: string;
  linkedIn?: string;
  ownedByUserId?: string;
  tagsJson?: string;
  notes?: string;
}

export interface CrmContactFilter {
  search?: string;
  ownedByUserId?: string;
  organizationId?: string;
  sourceKind?: CrmContactSourceKind;
  page?: number;
  pageSize?: number;
}

// ─── Organization DTOs ────────────────────────────────────────────────────────

export interface CrmOrganizationSummaryDto {
  id: string;
  tenantId: string;
  name: string;
  domain: string | null;
  industry: string | null;
  employeeCount: number | null;
  country: string | null;
  ownedByUserId: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface CrmOrganizationDetailDto extends CrmOrganizationSummaryDto {
  website: string | null;
  city: string | null;
  description: string | null;
  tagsJson: string | null;
}

export interface CrmOrganizationCreateRequest {
  name: string;
  domain?: string;
  industry?: string;
  employeeCount?: number;
  website?: string;
  city?: string;
  country?: string;
  description?: string;
  tagsJson?: string;
  ownedByUserId?: string;
}

export interface CrmOrganizationUpdateRequest {
  name?: string;
  domain?: string;
  industry?: string;
  employeeCount?: number;
  website?: string;
  city?: string;
  country?: string;
  description?: string;
  tagsJson?: string;
  ownedByUserId?: string;
}

export interface CrmOrganizationFilter {
  search?: string;
  industry?: string;
  country?: string;
  ownedByUserId?: string;
  page?: number;
  pageSize?: number;
}

// ─── Account DTOs ─────────────────────────────────────────────────────────────

export interface CrmAccountSummaryDto {
  id: string;
  tenantId: string;
  name: string;
  organizationId: string | null;
  organizationName: string | null;
  status: CrmAccountStatus;
  tier: CrmAccountTier | null;
  ownedByUserId: string | null;
  contractValue: number | null;
  creditLimit?: number;
  currency: string;
  renewalDate: string | null;
  paymentTermId?: string;
  paymentTermName?: string;
  parentAccountId?: string;
  parentAccountName?: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface CrmAccountDetailDto extends CrmAccountSummaryDto {
  notes: string | null;
  tagsJson: string | null;
  creditLimit?: number;
}

export interface CrmAccountCreateRequest {
  name: string;
  organizationId?: string;
  status?: CrmAccountStatus;
  tier?: CrmAccountTier;
  ownedByUserId?: string;
  renewalDate?: string;
  contractValue?: number;
  creditLimit?: number;
  currency?: string;
  notes?: string;
  tagsJson?: string;
  parentAccountId?: string;
}

export interface CrmAccountUpdateRequest {
  name?: string;
  organizationId?: string;
  status?: CrmAccountStatus;
  tier?: CrmAccountTier;
  ownedByUserId?: string;
  renewalDate?: string;
  contractValue?: number;
  creditLimit?: number;
  currency?: string;
  notes?: string;
  tagsJson?: string;
  parentAccountId?: string;
}

export interface CrmAccountFilter {
  search?: string;
  status?: CrmAccountStatus;
  tier?: CrmAccountTier;
  ownedByUserId?: string;
  organizationId?: string;
  page?: number;
  pageSize?: number;
}

export interface CrmAccountContactDto {
  id: string;
  contactId: string;
  contactName: string;
  contactEmail: string | null;
  contactJobTitle: string | null;
  role: CrmAccountContactRole;
  isPrimary: boolean;
}

export interface AddAccountContactRequest {
  contactId: string;
  role?: CrmAccountContactRole;
  isPrimary?: boolean;
}

// ─── Pipeline DTOs ────────────────────────────────────────────────────────────

export interface CrmPipelineSummaryDto {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  isActive: boolean;
  color: string | null;
  order: number;
  dealType: CrmDealType | null;
  stageCount: number;
  createdAt: string;
}

export interface CrmPipelineDetailDto extends CrmPipelineSummaryDto {
  stages: CrmDealStageSummaryDto[];
}

export interface CrmPipelineCreateRequest {
  name: string;
  description?: string;
  color?: string;
  dealType?: CrmDealType;
  isDefault?: boolean;
}

export interface CrmPipelineUpdateRequest {
  name?: string;
  description?: string;
  color?: string;
  isDefault?: boolean;
  isActive?: boolean;
  order?: number;
}

// ─── Deal Stage DTOs ──────────────────────────────────────────────────────────

export interface CrmDealStageSummaryDto {
  id: string;
  tenantId: string;
  name: string;
  order: number;
  isClosed: boolean;
  isWon: boolean;
  defaultProbability: number;
  color: string | null;
  dealType?: CrmDealType | null;
  pipelineId?: string | null;
  pipelineName?: string | null;
}

export interface CrmDealStageCreateRequest {
  name: string;
  order: number;
  isClosed?: boolean;
  isWon?: boolean;
  defaultProbability?: number;
  color?: string;
  pipelineId?: string;
}

export interface CrmDealStageUpdateRequest {
  name?: string;
  order?: number;
  isClosed?: boolean;
  isWon?: boolean;
  defaultProbability?: number;
  color?: string;
}

// ─── Deal DTOs ────────────────────────────────────────────────────────────────

export interface CrmDealSummaryDto {
  id: string;
  tenantId: string;
  name: string;
  accountId: string | null;
  accountName: string | null;
  stageId: string;
  stageName: string | null;
  amount: number | null;
  currency: string;
  closeDate: string | null;
  status: CrmDealStatus;
  dealType: CrmDealType;
  ownedByUserId: string | null;
  ownedByUserName: string | null;
  source: string | null;
  pipelineId: string | null;
  pipelineName: string | null;
  createdAt: string;
  updatedAt: string | null;
  closedAt: string | null;
}

export interface CrmDealDetailDto extends CrmDealSummaryDto {
  winProbabilityOverride: number | null;
  lostReason: string | null;
  winReason: string | null;
  notes: string | null;
  tagsJson: string | null;
  aiSummaryJson: string | null;
  aiSummaryRefreshedAt: string | null;
}

export interface CrmDealAiSummaryDto {
  dealId: string;
  headline: string;
  stage: string;
  riskLevel: string;
  keyInsights: string[];
  nextActions: string[];
  winProbabilityEstimate: number;
  confidence: number;
  usedFallback: boolean;
  generatedAt: string;
}

export interface CrmDealCreateRequest {
  name: string;
  accountId?: string;
  contactId?: string;
  stageId: string;
  dealType?: CrmDealType;
  pipelineId?: string;
  amount?: number;
  currency?: string;
  closeDate?: string;
  ownedByUserId?: string;
  source?: string;
  notes?: string;
  tagsJson?: string;
}

export interface CrmDealUpdateRequest {
  name?: string;
  accountId?: string;
  stageId?: string;
  amount?: number;
  currency?: string;
  closeDate?: string;
  winProbabilityOverride?: number;
  ownedByUserId?: string;
  source?: string;
  notes?: string;
  tagsJson?: string;
}

export interface CrmDealFilter {
  search?: string;
  status?: CrmDealStatus;
  stageId?: string;
  accountId?: string;
  contactId?: string;
  ownedByUserId?: string;
  pipelineId?: string;
  dealType?: CrmDealType;
  closeDateFrom?: string;
  closeDateTo?: string;
  inactiveSinceDays?: number;
  page?: number;
  pageSize?: number;
}

export interface MoveDealStageRequest { stageId: string; }
export interface CloseDealRequest { isWon: boolean; lostReason?: string; winReason?: string; }
export interface CreateManualLeadRequest {
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  stage?: LeadStage;
  tags?: string;
  assignedToUserId?: string;
  adSource?: string;
  notes?: string;
  score?: number;
  companyName?: string;
  companyDomain?: string;
  companyIndustry?: string;
  companyEmployeeCount?: number;
  companyCity?: string;
  companyCountry?: string;
  companyWebsite?: string;
}

export interface ConvertLeadRequest {
  contactName?: string;
  stageId?: string;
  dealName?: string;
  dealAmount?: number;
  dealCurrency?: string;
  closeDate?: string;
  ownedByUserId?: string;
  notes?: string;
  companyName?: string;
}
export interface ConvertLeadResponse { contactId: string; dealId: string; organizationId?: string; accountId?: string; }

// ─── Signal DTOs ──────────────────────────────────────────────────────────────

export interface CrmSignalDto {
  id: string;
  tenantId: string;
  kind: CrmSignalKind;
  subjectKind: CrmSignalSubjectKind;
  subjectId: string;
  occurredAt: string;
  source: CrmSignalSource;
  sentiment: CrmSignalSentiment;
  summary: string | null;
  payloadJson: string | null;
  intentSignalsJson: string | null;
  actorUserId: string | null;
  createdAt: string;
}

export interface CrmManualSignalCreateRequest {
  kind: CrmSignalKind;
  subjectKind: CrmSignalSubjectKind;
  subjectId: string;
  occurredAt?: string;
  sentiment?: CrmSignalSentiment;
  summary: string;
  payloadJson?: string;
}

export interface CrmSignalFilter {
  subjectKind?: CrmSignalSubjectKind;
  subjectId?: string;
  kind?: CrmSignalKind;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

// ─── CRM Campaign DTOs ────────────────────────────────────────────────────────

// ─── Campaign enums ───────────────────────────────────────────────────────────

export const CampaignGoalType = {
  Awareness:      1,
  LeadGeneration: 2,
  Revenue:        3,
  Engagement:     4,
  Retention:      5,
} as const;
export type CampaignGoalType = (typeof CampaignGoalType)[keyof typeof CampaignGoalType];

export const CAMPAIGN_GOAL_LABELS: Record<CampaignGoalType, string> = {
  1: 'Awareness',
  2: 'Lead Generation',
  3: 'Revenue',
  4: 'Engagement',
  5: 'Retention',
};

export const CampaignAttributionModel = {
  FirstTouch: 1,
  LastTouch:  2,
  Linear:     3,
  TimeDecay:  4,
} as const;
export type CampaignAttributionModel = (typeof CampaignAttributionModel)[keyof typeof CampaignAttributionModel];

export const ATTRIBUTION_MODEL_LABELS: Record<CampaignAttributionModel, string> = {
  1: 'First Touch',
  2: 'Last Touch',
  3: 'Linear',
  4: 'Time Decay',
};

export const CampaignAttributedEntityType = {
  Lead:    1,
  Contact: 2,
  Deal:    3,
  Order:   4,
} as const;
export type CampaignAttributedEntityType = (typeof CampaignAttributedEntityType)[keyof typeof CampaignAttributedEntityType];

export const ATTRIBUTED_ENTITY_LABELS: Record<CampaignAttributedEntityType, string> = {
  1: 'Lead',
  2: 'Contact',
  3: 'Deal',
  4: 'Order',
};

// ─── Campaign DTOs ────────────────────────────────────────────────────────────

export interface CrmCampaignSummaryDto {
  id: string;
  name: string;
  description: string | null;
  channelType: CrmCampaignChannelType;
  status: CampaignStatus;

  // Delivery
  totalRecipients: number;
  sentCount: number;
  openedCount: number;
  repliedCount: number;
  failedCount: number;
  clickCount: number;
  convertedCount: number;

  // Budget
  budgetAmount: number | null;
  budgetCurrency: string;
  costPerSend: number | null;
  actualSpend: number;

  // Goals
  goalType: CampaignGoalType | null;
  goalTarget: number | null;

  // Attribution aggregates
  attributedLeadsCount: number;
  attributedRevenue: number;

  // Dates
  scheduledAt: string | null;
  launchedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface CrmCampaignDetailDto extends CrmCampaignSummaryDto {
  subject: string | null;
  bodyTemplate: string;
  targetFilterJson: string;
  createdByUserId: string;
  defaultAttributionModel: CampaignAttributionModel;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
}

export interface CrmCampaignCreateRequest {
  name: string;
  description?: string;
  channelType: CrmCampaignChannelType;
  subject?: string;
  bodyTemplate: string;
  targetFilterJson?: string;
  scheduledAt?: string;
  // Budget
  budgetAmount?: number;
  budgetCurrency?: string;
  costPerSend?: number;
  // Goal
  goalType?: CampaignGoalType;
  goalTarget?: number;
  // Attribution
  defaultAttributionModel?: CampaignAttributionModel;
  // UTM
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
}

export interface CrmCampaignUpdateRequest {
  name?: string;
  description?: string;
  subject?: string;
  bodyTemplate?: string;
  targetFilterJson?: string;
  scheduledAt?: string;
  budgetAmount?: number;
  budgetCurrency?: string;
  costPerSend?: number;
  goalType?: CampaignGoalType;
  goalTarget?: number;
  defaultAttributionModel?: CampaignAttributionModel;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
}

export interface CrmCampaignBudgetUpdateRequest {
  budgetAmount?: number;
  budgetCurrency: string;
  costPerSend?: number;
}

export interface CrmCampaignPreviewDto {
  estimatedRecipients: number;
  contacts: Array<{ contactId: string; fullName: string; email: string | null; phone: string | null }>;
}

export interface CrmCampaignStatsDto {
  campaignId: string;
  campaignName: string;
  status: CampaignStatus;

  // Delivery
  totalRecipients: number;
  sentCount: number;
  openedCount: number;
  repliedCount: number;
  failedCount: number;
  clickCount: number;
  convertedCount: number;

  // Rates (%)
  openRate: number;
  replyRate: number;
  clickRate: number;
  conversionRate: number;
  deliveryRate: number;

  // Budget & ROI
  budgetAmount: number | null;
  actualSpend: number;
  budgetUtilizationPct: number | null;
  costPerSent: number | null;
  costPerLead: number | null;
  costPerConversion: number | null;
  attributedRevenue: number;
  roi: number | null;

  // Attribution
  attributedLeadsCount: number;

  // Dates
  launchedAt: string | null;
  completedAt: string | null;
}

export interface CrmCampaignPerformanceDashboardDto {
  campaignId: string;
  campaignName: string;
  status: CampaignStatus;
  goalType: CampaignGoalType | null;
  goalTarget: number | null;
  goalAchievementPct: number | null;

  // Delivery funnel
  totalRecipients: number;
  sentCount: number;
  openedCount: number;
  clickCount: number;
  repliedCount: number;
  convertedCount: number;
  failedCount: number;

  // Rates (%)
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  replyRate: number;
  conversionRate: number;

  // Budget
  budgetAmount: number | null;
  budgetCurrency: string;
  actualSpend: number;
  budgetRemaining: number | null;
  budgetUtilizationPct: number | null;

  // Efficiency
  costPerSend: number | null;
  costPerOpen: number | null;
  costPerClick: number | null;
  costPerConversion: number | null;
  costPerLead: number | null;

  // Revenue & ROI
  attributedRevenue: number;
  attributedLeadsCount: number;
  roi: number | null;
  revenuePerSend: number | null;

  // Timing
  launchedAt: string | null;
  completedAt: string | null;
  durationMinutes: number | null;
}

export interface CrmCampaignAttributionDto {
  id: string;
  campaignId: string;
  entityType: CampaignAttributedEntityType;
  entityId: string;
  attributionModel: CampaignAttributionModel;
  attributedRevenue: number;
  convertedAt: string;
  notes: string | null;
  attributedBy: string;
  createdAt: string;
}

export interface CrmCampaignAttributionCreateRequest {
  entityType: CampaignAttributedEntityType;
  entityId: string;
  attributionModel?: CampaignAttributionModel;
  attributedRevenue: number;
  convertedAt?: string;
  notes?: string;
}

export interface CrmCampaignRecipientDto {
  id: string;
  contactId: string;
  contactName: string | null;
  toAddress: string | null;
  status: number;
  sentAt: string | null;
  openedAt: string | null;
  repliedAt: string | null;
  failureReason: string | null;
}

// ─── CRM Analytics DTOs ───────────────────────────────────────────────────────

export interface PipelineStageDto {
  stageId: string;
  stageName: string;
  stageOrder: number;
  isClosed: boolean;
  isWon: boolean;
  color: string | null;
  dealCount: number;
  totalValue: number;
}

export interface DealPipelineDto {
  stages: PipelineStageDto[];
  totalOpenCount: number;
  totalOpenValue: number;
  totalWonValueThisMonth: number;
}

export interface DealStatsDto {
  openCount: number;
  closedWonCount: number;
  closedLostCount: number;
  winRate: number;
  avgDealSize: number;
  totalPipelineValue: number;
  closingThisMonthCount: number;
  closingThisMonthValue: number;
}

export interface ContactStatsDto {
  total: number;
  createdThisMonth: number;
  createdLastMonth: number;
  bySource: Array<{ source: CrmContactSourceKind; count: number }>;
}

export interface CrmCampaignAggregateDto {
  // Status counts
  totalCampaigns: number;
  draftCount: number;
  scheduledCount: number;
  runningCount: number;
  completedCount: number;
  cancelledCount: number;

  // Delivery totals
  totalRecipients: number;
  totalSent: number;
  totalOpened: number;
  totalReplied: number;
  totalClicked: number;
  totalConverted: number;

  // Rates (%)
  overallOpenRate: number;
  overallReplyRate: number;
  overallClickRate: number;
  overallConversionRate: number;

  // Budget & Revenue
  totalBudget: number;
  totalActualSpend: number;
  totalAttributedRevenue: number;
  totalAttributedLeads: number;
  overallRoi: number | null;

  recentCampaigns: CrmCampaignSummaryDto[];
}

export interface RevenueTrendPointDto {
  year: number;
  month: number;
  monthLabel: string;
  wonAmount: number;
  wonCount: number;
}

export interface RevenueAnalyticsDto {
  weightedForecast: number;
  expectedThisWeek: number;
  expectedThisMonth: number;
  expectedThisQuarter: number;
  totalWonAllTime: number;
  totalLostPipelineValue: number;
  monthlyTrend: RevenueTrendPointDto[];
}

export interface ActivityAnalyticsDto {
  totalSignals30d: number;
  totalSignals7d: number;
  dailyTrend: Array<{ date: string; dateLabel: string; count: number }>;
  byKind: Array<{ kind: CrmSignalKind; count: number; percentage: number }>;
  bySource: Array<{ source: CrmSignalSource; count: number; percentage: number }>;
  topContacts: Array<{ contactId: string; fullName: string; email: string | null; signalCount: number }>;
}

export interface VelocityAnalyticsDto {
  avgDaysToClose: number;
  medianDaysToClose: number;
  avgOpenDealAge: number;
  slowestStage: string | null;
  fastestStage: string | null;
  byStage: Array<{ stageId: string; stageName: string; stageOrder: number; avgDaysInStage: number; dealCount: number }>;
  wonDealsAnalyzed: number;
  openDealsAnalyzed: number;
}

export interface LeadFunnelAnalyticsDto {
  totalLeads: number;
  overallConversionRate: number;
  avgLeadScore: number;
  funnel: Array<{ stage: LeadStage; stageName: string; count: number; pctOfTotal: number; conversionFromPrev: number | null }>;
  scoreDistribution: Array<{ label: string; min: number; max: number; count: number }>;
  byChannel: Array<{ channel: string; count: number; percentage: number }>;
}

// ─── Nurture Analytics DTOs ───────────────────────────────────────────────────

export interface NurtureSequenceStatsDto {
  sequenceId: string;
  sequenceName: string;
  enrollments: number;
  messagesSent: number;
  replies: number;
  responseRatePercent: number;
  conversions: number;
  conversionRatePercent: number;
}

export interface NurtureAnalyticsDto {
  totalEnrollments: number;
  activeEnrollments: number;
  completedEnrollments: number;
  cancelledEnrollments: number;
  messagesSent: number;
  customerReplies: number;
  responseRatePercent: number;
  convertedFromNurture: number;
  conversionRatePercent: number;
  exhaustedAsLost: number;
  bySequence: NurtureSequenceStatsDto[];
}

// ─── Flow A/B Experiment DTOs ─────────────────────────────────────────────────

export interface FlowExperimentVariantStatsDto {
  variant: ExperimentVariantKind;
  flowName: string;
  sessions: number;
  messages: number;
  conversions: number;
  conversionRate: number;
  avgMessagesPerSession: number;
}

export interface FlowExperimentSummaryDto {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  controlFlowId: string;
  controlFlowName: string | null;
  challengerFlowId: string;
  challengerFlowName: string | null;
  splitPercent: number;
  status: ExperimentStatus;
  startedAt: string | null;
  endedAt: string | null;
  winner: ExperimentVariantKind | null;
  createdAt: string;
}

export interface FlowExperimentDetailDto extends FlowExperimentSummaryDto {
  control: FlowExperimentVariantStatsDto;
  challenger: FlowExperimentVariantStatsDto;
}

export interface FlowExperimentCreateRequest {
  name: string;
  description?: string;
  controlFlowId: string;
  challengerFlowId: string;
  splitPercent?: number;
}

export interface FlowExperimentUpdateRequest {
  name?: string;
  description?: string;
  splitPercent?: number;
}

export interface FlowExperimentDeclareWinnerRequest {
  winner: ExperimentVariantKind;
}

// ─── CRM Nurture (Phase 3C — B2B contacts) ───────────────────────────────────

export interface CrmNurtureEnrollmentDto {
  id: string;
  crmContactId: string;
  contactName: string | null;
  sequenceId: string;
  sequenceName: string | null;
  currentStep: number;
  status: EnrollmentStatus;
  triggerKind: number;
  nextStepAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export const EnrollmentStatus = { Active: 1, Paused: 2, Completed: 3, Cancelled: 4 } as const;
export type EnrollmentStatus = (typeof EnrollmentStatus)[keyof typeof EnrollmentStatus];

// ─── Phase 4: Support Cases ───────────────────────────────────────────────────

export const CrmSupportCaseStatus = {
  New: 1, AiHandling: 2, AiResolved: 3, Escalated: 4, InProgress: 5, Resolved: 6, Closed: 7,
} as const;
export type CrmSupportCaseStatus = (typeof CrmSupportCaseStatus)[keyof typeof CrmSupportCaseStatus];
export const CRM_SUPPORT_STATUS_LABELS: Record<CrmSupportCaseStatus, string> = {
  1: 'Open', 2: 'Open', 3: 'Open', 4: 'Escalated', 5: 'In Progress', 6: 'Resolved', 7: 'Closed',
};
export const CRM_SUPPORT_STATUS_COLORS: Record<CrmSupportCaseStatus, string> = {
  1: 'text-[#F59E0B] bg-[rgba(245,158,11,0.1)] border-[rgba(245,158,11,0.2)]',
  2: 'text-[#F59E0B] bg-[rgba(245,158,11,0.1)] border-[rgba(245,158,11,0.2)]',
  3: 'text-[#F59E0B] bg-[rgba(245,158,11,0.1)] border-[rgba(245,158,11,0.2)]',
  4: 'text-danger bg-danger-soft border-[rgba(244,63,94,0.2)]',
  5: 'text-brand bg-brand-soft border-border-glow',
  6: 'text-success bg-success-soft border-[rgba(34,197,94,0.2)]',
  7: 'text-text-muted bg-bg-card border-border-subtle',
};

export const CrmSupportCasePriority = { Low: 1, Medium: 2, High: 3, Critical: 4 } as const;
export type CrmSupportCasePriority = (typeof CrmSupportCasePriority)[keyof typeof CrmSupportCasePriority];
export const CRM_SUPPORT_PRIORITY_LABELS: Record<CrmSupportCasePriority, string> = {
  1: 'Low', 2: 'Medium', 3: 'High', 4: 'Critical',
};
export const CRM_SUPPORT_PRIORITY_COLORS: Record<CrmSupportCasePriority, string> = {
  1: 'text-text-secondary bg-bg-elevated border-border-subtle',
  2: 'text-[#F59E0B] bg-[rgba(245,158,11,0.1)] border-[rgba(245,158,11,0.2)]',
  3: 'text-danger bg-danger-soft border-[rgba(244,63,94,0.2)]',
  4: 'text-danger bg-[rgba(244,63,94,0.2)] border-[rgba(244,63,94,0.4)]',
};

export interface CrmSupportMessageDto {
  id: string;
  authorName: string;
  body: string;
  isFromCustomer: boolean;
  createdAt: string;
}
export interface CrmSupportCaseSummaryDto {
  id: string;
  caseNumber: string;
  subject: string;
  contactId: string | null;
  contactName: string | null;
  priority: CrmSupportCasePriority;
  status: CrmSupportCaseStatus;
  assignedToUserId: string | null;
  assignedToUserName: string | null;
  slaBreachedAt: string | null;
  slaResolutionDeadline: string | null;
  createdAt: string;
}
export interface CrmSupportCaseDetailDto extends CrmSupportCaseSummaryDto {
  description: string | null;
  messages: CrmSupportMessageDto[];
  slaPolicyName: string | null;
}
export interface CrmSupportCaseCreateRequest {
  subject: string;
  contactId?: string;
  priority?: CrmSupportCasePriority;
  slaPolicyId?: string;
  description?: string;
}
export interface CrmSupportCaseFilter {
  search?: string;
  status?: CrmSupportCaseStatus;
  priority?: CrmSupportCasePriority;
  page?: number;
  pageSize?: number;
}
export interface CrmSlaPolicySummaryDto { id: string; name: string; firstResponseMinutes: number; resolutionMinutes: number; applicablePriority?: number; }
export interface CrmSlaPolicyCreateRequest { name: string; initialResponseSlaHours: number; resolutionSlaHours: number; isDefault?: boolean; applicablePriority?: number; }

// ─── Tasks ────────────────────────────────────────────────────────────────────

export const CrmTaskStatus = { Todo: 1, InProgress: 2, Done: 3, Cancelled: 4 } as const;
export type CrmTaskStatus = (typeof CrmTaskStatus)[keyof typeof CrmTaskStatus];
export const CRM_TASK_STATUS_LABELS: Record<CrmTaskStatus, string> = {
  1: 'To Do', 2: 'In Progress', 3: 'Done', 4: 'Cancelled',
};
export const CRM_TASK_STATUS_COLORS: Record<CrmTaskStatus, string> = {
  1: 'text-text-secondary bg-bg-elevated border-border-subtle',
  2: 'text-brand bg-brand-soft border-border-glow',
  3: 'text-success bg-success-soft border-[rgba(34,197,94,0.2)]',
  4: 'text-text-muted bg-bg-card border-border-subtle',
};
export const CrmTaskPriority = { Low: 1, Medium: 2, High: 3 } as const;
export type CrmTaskPriority = (typeof CrmTaskPriority)[keyof typeof CrmTaskPriority];
export const CRM_TASK_PRIORITY_LABELS: Record<CrmTaskPriority, string> = { 1: 'Low', 2: 'Medium', 3: 'High' };
export const CRM_TASK_PRIORITY_COLORS: Record<CrmTaskPriority, string> = {
  1: 'text-text-secondary bg-bg-elevated border-border-subtle',
  2: 'text-[#F59E0B] bg-[rgba(245,158,11,0.1)] border-[rgba(245,158,11,0.2)]',
  3: 'text-danger bg-danger-soft border-[rgba(244,63,94,0.2)]',
};
export interface CrmTaskSummaryDto {
  id: string; title: string; description: string | null;
  status: CrmTaskStatus; priority: CrmTaskPriority;
  dueDate: string | null; assignedToUserId: string | null; assignedToUserName: string | null;
  dealId: string | null; dealTitle: string | null;
  reminderMinutesBefore: number | null; completedAt: string | null; completionNotes: string | null;
  createdAt: string;
}
export interface CrmTaskDetailDto extends CrmTaskSummaryDto {}
export interface CrmTaskCreateRequest {
  title: string; description?: string; priority?: CrmTaskPriority;
  dueDate?: string; assignedToUserId?: string; dealId?: string; reminderMinutesBefore?: number;
}
export interface CrmTaskUpdateRequest {
  title?: string; description?: string; priority?: CrmTaskPriority;
  dueDate?: string; assignedToUserId?: string; reminderMinutesBefore?: number; completionNotes?: string;
}
export interface CrmTaskFilter { search?: string; status?: CrmTaskStatus; priority?: CrmTaskPriority; page?: number; pageSize?: number; }

// ─── Quotes ───────────────────────────────────────────────────────────────────

export const CrmQuoteStatus = { Draft: 1, Sent: 2, Accepted: 3, Rejected: 4, Expired: 5 } as const;
export type CrmQuoteStatus = (typeof CrmQuoteStatus)[keyof typeof CrmQuoteStatus];
export const CRM_QUOTE_STATUS_LABELS: Record<CrmQuoteStatus, string> = {
  1: 'Draft', 2: 'Sent', 3: 'Accepted', 4: 'Rejected', 5: 'Expired',
};
export const CRM_QUOTE_STATUS_COLORS: Record<CrmQuoteStatus, string> = {
  1: 'text-text-secondary bg-bg-elevated border-border-subtle',
  2: 'text-brand bg-brand-soft border-border-glow',
  3: 'text-success bg-success-soft border-[rgba(34,197,94,0.2)]',
  4: 'text-danger bg-danger-soft border-[rgba(244,63,94,0.2)]',
  5: 'text-text-muted bg-bg-card border-border-subtle',
};
export interface CrmQuoteLineItemDto { id: string; description: string; quantity: number; unitPrice: number; lineTotal: number; }
export interface CrmQuoteLineItemRequest { description: string; quantity: number; unitPrice: number; productId?: string; }
export interface CrmQuoteSummaryDto {
  id: string; quoteNumber: string; dealId: string | null; dealName: string | null;
  contactId: string | null; contactName: string | null;
  totalAmount: number; currency: string; status: CrmQuoteStatus;
  validUntil: string | null; sentAt: string | null; createdAt: string;
}
export interface CrmQuoteDetailDto extends CrmQuoteSummaryDto { lineItems: CrmQuoteLineItemDto[]; notes: string | null; }
export interface CrmQuoteCreateRequest {
  dealId?: string; contactId?: string; lineItems: CrmQuoteLineItemRequest[];
  currency?: string; validityDays?: number; notes?: string; priceBookId?: string; taxPercent?: number;
}
export interface CrmQuoteUpdateRequest {
  lineItems?: CrmQuoteLineItemRequest[];
  taxPercent?: number; notes?: string; validUntil?: string; currency?: string;
}
export interface CrmQuoteFilter { search?: string; status?: CrmQuoteStatus; page?: number; pageSize?: number; }

// ─── Proposals ────────────────────────────────────────────────────────────────

export const CrmProposalStatus = {
  Draft: 1, PendingRepReview: 2, ReadyToSend: 3, Sent: 4, Accepted: 5, Rejected: 6, Archived: 7,
} as const;
export type CrmProposalStatus = (typeof CrmProposalStatus)[keyof typeof CrmProposalStatus];
export const CRM_PROPOSAL_STATUS_LABELS: Record<CrmProposalStatus, string> = {
  1: 'Draft', 2: 'Pending Review', 3: 'Ready to Send', 4: 'Sent', 5: 'Accepted', 6: 'Rejected', 7: 'Archived',
};
export const CRM_PROPOSAL_STATUS_COLORS: Record<CrmProposalStatus, string> = {
  1: 'text-text-secondary bg-bg-elevated border-border-subtle',
  2: 'text-[#F59E0B] bg-[rgba(245,158,11,0.1)] border-[rgba(245,158,11,0.2)]',
  3: 'text-brand bg-brand-soft border-border-glow',
  4: 'text-brand bg-brand-soft border-border-glow',
  5: 'text-success bg-success-soft border-[rgba(34,197,94,0.2)]',
  6: 'text-danger bg-danger-soft border-[rgba(244,63,94,0.2)]',
  7: 'text-text-muted bg-bg-card border-border-subtle',
};
export interface CrmProposalSectionDto {
  id: string;
  sectionKind: number;
  ordinal: number;
  title: string;
  content: string;
  gapFlags: string[];
  gapsDismissed: boolean;
  generationCount: number;
  hasPreviousVersion: boolean;
  createdAt: string;
  updatedAt: string | null;
}
export interface CrmProposalSummaryDto {
  id: string; title: string; dealId: string | null; dealName: string | null;
  contactId: string | null; contactName: string | null;
  status: CrmProposalStatus; sectionsCount: number; openGapsCount: number; sentAt: string | null; createdAt: string;
}
export interface CrmProposalDetailDto {
  id: string;
  dealId: string;
  contactId: string | null;
  templateId: string | null;
  quoteId: string | null;
  title: string;
  status: CrmProposalStatus;
  sentAt: string | null;
  acceptedAt: string | null;
  sections: CrmProposalSectionDto[];
  openGapsCount: number;
  createdAt: string;
  updatedAt: string | null;
}
export interface CrmProposalGenerateRequest { dealId: string; contactId?: string; templateId?: string; }
export interface CrmProposalSectionInput { title: string; content: string; kind: number; }
export interface CrmProposalCreateRequest {
  dealId: string; title: string; sections: CrmProposalSectionInput[]; contactId?: string; quoteId?: string;
}
export interface CrmProposalFromLeadRequest {
  leadId: string; title: string; sections: CrmProposalSectionInput[];
}
export const PROPOSAL_SECTION_KINDS: Record<number, string> = {
  1: 'Executive Summary', 2: 'Understanding Needs', 3: 'Proposed Solution', 4: 'Scope & Deliverables',
  5: 'Implementation Timeline', 6: 'Pricing', 7: 'Why Us', 8: 'Terms & Next Steps', 9: 'About Us',
};
export interface CrmProposalTemplateSummaryDto { id: string; name: string; description: string | null; }
export interface CrmProposalFilter { search?: string; status?: CrmProposalStatus; page?: number; pageSize?: number; }

// ─── Invoices ─────────────────────────────────────────────────────────────────

export const CrmInvoiceStatus = {
  Draft: 1, Sent: 2, Paid: 3, Overdue: 4, Disputed: 5, Void: 6, PartiallyPaid: 7,
} as const;
export type CrmInvoiceStatus = (typeof CrmInvoiceStatus)[keyof typeof CrmInvoiceStatus];
export const CRM_INVOICE_STATUS_LABELS: Record<CrmInvoiceStatus, string> = {
  1: 'Draft', 2: 'Sent', 3: 'Paid', 4: 'Overdue', 5: 'Disputed', 6: 'Void', 7: 'Partially Paid',
};
export const CRM_INVOICE_STATUS_COLORS: Record<CrmInvoiceStatus, string> = {
  1: 'text-text-secondary bg-bg-elevated border-border-subtle',
  2: 'text-brand bg-brand-soft border-border-glow',
  3: 'text-success bg-success-soft border-[rgba(34,197,94,0.2)]',
  4: 'text-danger bg-danger-soft border-[rgba(244,63,94,0.2)]',
  5: 'text-[#F59E0B] bg-[rgba(245,158,11,0.1)] border-[rgba(245,158,11,0.2)]',
  6: 'text-text-muted bg-bg-card border-border-subtle',
  7: 'text-[#A78BFA] bg-[rgba(167,139,250,0.1)] border-[rgba(167,139,250,0.2)]',
};
export const CrmPaymentMethod = { BankTransfer: 1, CreditCard: 2, Cash: 3, Check: 4, Other: 5 } as const;
export type CrmPaymentMethod = (typeof CrmPaymentMethod)[keyof typeof CrmPaymentMethod];
export const CRM_PAYMENT_METHOD_LABELS: Record<CrmPaymentMethod, string> = {
  1: 'Bank Transfer', 2: 'Credit Card', 3: 'Cash', 4: 'Check', 5: 'Other',
};
export const DunningStage = {
  Day0_Delivery: 1, DayMinus3_PreReminder: 2, DayPlus3_First: 3, DayPlus10_Second: 4,
  DayPlus20_Third: 5, DayPlus30_Formal: 6, DayPlus45_Final: 7, DayPlus60_Escalation: 8,
} as const;
export type DunningStage = (typeof DunningStage)[keyof typeof DunningStage];
export const DUNNING_STAGE_LABELS: Record<DunningStage, string> = {
  1: 'Delivery', 2: 'Pre-Reminder', 3: 'First Reminder', 4: 'Second Reminder',
  5: 'Third Reminder', 6: 'Formal Notice', 7: 'Final Notice', 8: 'Escalation',
};
export const DunningEventKind = {
  ReminderSent: 1, PaymentReceived: 2, DisputeRaised: 3, EscalatedToHuman: 4,
  Paused: 5, Resumed: 6, Voided: 7,
} as const;
export type DunningEventKind = (typeof DunningEventKind)[keyof typeof DunningEventKind];
export const DUNNING_EVENT_KIND_LABELS: Record<DunningEventKind, string> = {
  1: 'Reminder Sent', 2: 'Payment Received', 3: 'Dispute Raised', 4: 'Escalated',
  5: 'Paused', 6: 'Resumed', 7: 'Voided',
};
export const DunningPauseReason = {
  CustomerExplainedDelay: 1, DisputeRaised: 2, FinancialDifficulty: 3, ManualHold: 4,
} as const;
export type DunningPauseReason = (typeof DunningPauseReason)[keyof typeof DunningPauseReason];
export const DUNNING_PAUSE_REASON_LABELS: Record<DunningPauseReason, string> = {
  1: 'Customer Explained Delay', 2: 'Dispute Raised', 3: 'Financial Difficulty', 4: 'Manual Hold',
};
export interface CrmDunningEventDto {
  id: string; stage: DunningStage; kind: DunningEventKind; channel?: string;
  sentAt?: string; pauseReason?: DunningPauseReason; pausedUntil?: string; createdAt: string;
}
export interface CrmDunningPauseRequest { reason: DunningPauseReason; until?: string; }
export interface CrmInvoiceSummaryDto {
  id: string; invoiceNumber: string; dealId: string | null; dealName: string | null;
  accountId: string | null; accountName: string | null;
  totalAmount: number; amountPaid?: number; creditAppliedAmount?: number; currency: string; status: CrmInvoiceStatus;
  dueDate: string | null; paidAt: string | null; createdAt: string;
  customerPONumber?: string;
}
export interface CrmInvoiceDetailDto extends CrmInvoiceSummaryDto { lineItems: CrmQuoteLineItemDto[]; dunningHistory: CrmDunningEventDto[]; }
export interface CrmRecordPaymentRequest { amount: number; paymentMethod?: CrmPaymentMethod; paidAt?: string; notes?: string; }
export interface CrmInvoiceFilter { search?: string; status?: CrmInvoiceStatus; page?: number; pageSize?: number; }

// ── Credit Notes ─────────────────────────────────────────────────────────────────
export const CreditNoteApplyMethod = { AccountBalance: 1, NextInvoice: 2, CashRefund: 3 } as const;
export type CreditNoteApplyMethod = (typeof CreditNoteApplyMethod)[keyof typeof CreditNoteApplyMethod];
export const CREDIT_NOTE_APPLY_METHOD_LABELS: Record<CreditNoteApplyMethod, string> = {
  1: 'Account Balance', 2: 'Next Invoice', 3: 'Cash Refund',
};
export const CreditNoteStatus = { Issued: 1, Applied: 2, Refunded: 3, Voided: 4 } as const;
export type CreditNoteStatus = (typeof CreditNoteStatus)[keyof typeof CreditNoteStatus];
export const CREDIT_NOTE_STATUS_LABELS: Record<CreditNoteStatus, string> = {
  1: 'Issued', 2: 'Applied', 3: 'Refunded', 4: 'Voided',
};
export const CREDIT_NOTE_STATUS_COLORS: Record<CreditNoteStatus, string> = {
  1: 'bg-brand-soft text-brand border-brand/30',
  2: 'bg-success-soft text-success border-success/30',
  3: 'bg-success-soft text-success border-success/30',
  4: 'bg-glass-2 text-text-muted border-border-medium',
};
export interface CrmCreditNoteDto {
  id: string; creditNoteNumber: string; accountId: string; accountName?: string;
  originalInvoiceId: string; originalInvoiceNumber?: string;
  amount: number; reason: string; applyMethod: CreditNoteApplyMethod; status: CreditNoteStatus;
  issuedAt: string; appliedToInvoiceId?: string; appliedToInvoiceNumber?: string; appliedAt?: string;
  refundedAt?: string; refundReference?: string; createdFromReturnId?: string;
}
export interface CrmCreditNoteFilter { accountId?: string; originalInvoiceId?: string; status?: CreditNoteStatus; page?: number; pageSize?: number; }
export interface CrmCreditNoteIssueRequest { originalInvoiceId: string; amount: number; reason: string; applyMethod: CreditNoteApplyMethod; }
export interface CrmCreditNoteApplyRequest { targetInvoiceId: string; }
export interface CrmCreditNoteRefundRequest { refundReference?: string; }

// ─── Subscriptions ────────────────────────────────────────────────────────────

export const CrmSubscriptionStatus = {
  Active: 1, PastDue: 2, Paused: 3, Cancelled: 4, Expired: 5,
} as const;
export type CrmSubscriptionStatus = (typeof CrmSubscriptionStatus)[keyof typeof CrmSubscriptionStatus];
export const CRM_SUBSCRIPTION_STATUS_LABELS: Record<CrmSubscriptionStatus, string> = {
  1: 'Active', 2: 'Past Due', 3: 'Paused', 4: 'Cancelled', 5: 'Expired',
};
export const CRM_SUBSCRIPTION_STATUS_COLORS: Record<CrmSubscriptionStatus, string> = {
  1: 'text-success bg-success-soft border-[rgba(34,197,94,0.2)]',
  2: 'text-danger bg-danger-soft border-[rgba(244,63,94,0.2)]',
  3: 'text-[#F59E0B] bg-[rgba(245,158,11,0.1)] border-[rgba(245,158,11,0.2)]',
  4: 'text-text-muted bg-bg-card border-border-subtle',
  5: 'text-text-secondary bg-bg-elevated border-border-subtle',
};
export const CrmSubscriptionPlanTier = { Starter: 1, Pro: 2, Business: 3, Enterprise: 4 } as const;
export type CrmSubscriptionPlanTier = (typeof CrmSubscriptionPlanTier)[keyof typeof CrmSubscriptionPlanTier];
export const CRM_SUBSCRIPTION_TIER_LABELS: Record<CrmSubscriptionPlanTier, string> = {
  1: 'Starter', 2: 'Pro', 3: 'Business', 4: 'Enterprise',
};
export const CrmSubscriptionBillingCadence = { Monthly: 1, Quarterly: 2, Annual: 3 } as const;
export type CrmSubscriptionBillingCadence = (typeof CrmSubscriptionBillingCadence)[keyof typeof CrmSubscriptionBillingCadence];
export const CRM_BILLING_CADENCE_LABELS: Record<CrmSubscriptionBillingCadence, string> = {
  1: 'Monthly', 2: 'Quarterly', 3: 'Annual',
};
export interface CrmSubscriptionSummaryDto {
  id: string; contactId: string; contactName: string | null;
  accountId: string | null; accountName: string | null;
  planName: string; planTier: CrmSubscriptionPlanTier;
  billingCadence: CrmSubscriptionBillingCadence; status: CrmSubscriptionStatus;
  amount: number; currency: string; startDate: string;
  nextBillingDate: string | null; seats: number | null; createdAt: string;
}
export interface CrmSubscriptionDetailDto extends CrmSubscriptionSummaryDto {
  dealId: string | null; cancelledAt: string | null; pausedAt: string | null;
}
export interface CrmSubscriptionCreateRequest {
  contactId: string; accountId?: string; dealId?: string;
  planName: string; planTier?: CrmSubscriptionPlanTier; billingCadence?: CrmSubscriptionBillingCadence;
  amount: number; currency?: string; startDate?: string; seats?: number;
}
export interface CrmSubscriptionUpdateRequest {
  planName?: string; planTier?: CrmSubscriptionPlanTier;
  billingCadence?: CrmSubscriptionBillingCadence; amount?: number; seats?: number;
}
export interface CrmSubscriptionFilter { search?: string; status?: CrmSubscriptionStatus; planTier?: CrmSubscriptionPlanTier; page?: number; pageSize?: number; }

// ─── Orders ───────────────────────────────────────────────────────────────────

export const CrmOrderStatus = {
  Draft: 1, Confirmed: 2, Fulfilling: 3, Fulfilled: 4, Cancelled: 5, Refunded: 6,
} as const;
export type CrmOrderStatus = (typeof CrmOrderStatus)[keyof typeof CrmOrderStatus];
export const CRM_ORDER_STATUS_LABELS: Record<CrmOrderStatus, string> = {
  1: 'Draft', 2: 'Confirmed', 3: 'Fulfilling', 4: 'Fulfilled', 5: 'Cancelled', 6: 'Refunded',
};
export const CRM_ORDER_STATUS_COLORS: Record<CrmOrderStatus, string> = {
  1: 'text-text-secondary bg-bg-elevated border-border-subtle',
  2: 'text-brand bg-brand-soft border-border-glow',
  3: 'text-[#F59E0B] bg-[rgba(245,158,11,0.1)] border-[rgba(245,158,11,0.2)]',
  4: 'text-success bg-success-soft border-[rgba(34,197,94,0.2)]',
  5: 'text-text-muted bg-bg-card border-border-subtle',
  6: 'text-[#A78BFA] bg-[rgba(167,139,250,0.1)] border-[rgba(167,139,250,0.2)]',
};

export const CrmOrderFulfillmentStatus = {
  Pending: 1, InProgress: 2, Picking: 3, ReadyToShip: 4, Shipped: 5, OutForDelivery: 6, Delivered: 7, DeliveryFailed: 8, NotApplicable: 9,
} as const;
export type CrmOrderFulfillmentStatus = (typeof CrmOrderFulfillmentStatus)[keyof typeof CrmOrderFulfillmentStatus];
export const CRM_ORDER_FULFILLMENT_LABELS: Record<number, string> = {
  1: 'Pending', 2: 'In Progress', 3: 'Picking', 4: 'Ready to Ship', 5: 'Shipped', 6: 'Out for Delivery', 7: 'Delivered', 8: 'Delivery Failed', 9: 'N/A',
};

export const CrmOrderPaymentStatus = {
  Unpaid: 1, PartiallyPaid: 2, Paid: 3, Refunded: 4,
} as const;
export type CrmOrderPaymentStatus = (typeof CrmOrderPaymentStatus)[keyof typeof CrmOrderPaymentStatus];
export const CRM_ORDER_PAYMENT_LABELS: Record<CrmOrderPaymentStatus, string> = {
  1: 'Unpaid', 2: 'Partially Paid', 3: 'Paid', 4: 'Refunded',
};
export const CRM_ORDER_PAYMENT_COLORS: Record<CrmOrderPaymentStatus, string> = {
  1: 'text-text-secondary bg-bg-elevated border-border-subtle',
  2: 'text-[#F59E0B] bg-[rgba(245,158,11,0.1)] border-[rgba(245,158,11,0.2)]',
  3: 'text-success bg-success-soft border-[rgba(34,197,94,0.2)]',
  4: 'text-[#A78BFA] bg-[rgba(167,139,250,0.1)] border-[rgba(167,139,250,0.2)]',
};

export interface CrmOrderLineItemDto {
  id: string; productId: string | null; productName: string; sku: string | null;
  quantity: number; unitPrice: number; totalPrice: number; notes: string | null;
}
export interface CrmOrderLineItemRequest {
  productId?: string; productName: string; sku?: string; quantity: number; unitPrice: number; notes?: string;
}

export interface CrmOrderSummaryDto {
  id: string; orderNumber: string; contactId: string; contactName: string | null;
  totalAmount: number; currency: string; status: CrmOrderStatus;
  fulfillmentStatus: CrmOrderFulfillmentStatus; paymentStatus: CrmOrderPaymentStatus;
  orderedAt: string; createdAt: string;
}

export interface CrmOrderDetailDto {
  id: string; orderNumber: string; contactId: string; contactName: string | null;
  accountId?: string; dealId?: string;
  status: CrmOrderStatus; fulfillmentStatus: CrmOrderFulfillmentStatus; paymentStatus: CrmOrderPaymentStatus;
  orderDate: string; subtotal: number; taxAmount: number; discountAmount: number;
  totalAmount: number; currency: string;
  shippingAddressLine1: string | null; shippingAddressLine2: string | null;
  shippingCity: string | null; shippingState: string | null;
  shippingPostalCode: string | null; shippingCountry: string | null;
  billingSameAsShipping: boolean;
  billingAddressLine1: string | null; billingAddressLine2: string | null;
  billingCity: string | null; billingState: string | null;
  billingPostalCode: string | null; billingCountry: string | null;
  paymentMethod: string | null; paidAt: string | null; paymentReference: string | null;
  shippingMethod: string | null; carrier: string | null; trackingNumber: string | null;
  requestedDeliveryDate: string | null; actualDeliveryDate: string | null; shippedAt: string | null;
  erpOrderId: string | null; customerPONumber?: string; cancellationReason: string | null;
  notes: string | null; lineItems: CrmOrderLineItemDto[]; createdAt: string;
  acknowledgmentSentAt?: string;
}

export interface CrmOrderCreateRequest {
  contactId: string; accountId?: string; dealId?: string; quoteId?: string;
  currency: string; customerPONumber?: string;
  shippingAddressLine1?: string; shippingAddressLine2?: string;
  shippingCity?: string; shippingState?: string; shippingPostalCode?: string; shippingCountry?: string;
  billingSameAsShipping?: boolean;
  billingAddressLine1?: string; billingAddressLine2?: string;
  billingCity?: string; billingState?: string; billingPostalCode?: string; billingCountry?: string;
  shippingMethod?: string; carrier?: string; requestedDeliveryDate?: string; erpOrderId?: string;
  notes?: string; lineItems: CrmOrderLineItemRequest[];
}

export interface CrmOrderUpdateRequest {
  notes?: string; lineItems?: CrmOrderLineItemRequest[];
  shippingAddressLine1?: string; shippingAddressLine2?: string;
  shippingCity?: string; shippingState?: string; shippingPostalCode?: string; shippingCountry?: string;
  carrier?: string; trackingNumber?: string; shippingMethod?: string;
  customerPONumber?: string;
}

export interface PickListItemDto {
  id: string;
  productId: string;
  productName: string;
  warehouseLocation?: string;
  quantityToPick: number;
  quantityPicked: number;
  serialNumbers?: string;
}

export interface PickListDto {
  id: string;
  orderId: string;
  status: number; // 1=Pending, 2=InProgress, 3=Picked, 4=Packed
  boxCount?: number;
  totalWeightKg?: number;
  notes?: string;
  items: PickListItemDto[];
  createdAt: string;
}

export interface UpdatePickListItemRequest {
  quantityPicked: number;
  serialNumbers?: string;
}

export interface MarkPackedRequest {
  boxCount?: number;
  totalWeightKg?: number;
  notes?: string;
}

export const PICK_LIST_STATUS_LABELS: Record<number, string> = {
  1: 'Pending',
  2: 'In Progress',
  3: 'Picked',
  4: 'Packed',
};

export interface CrmOrderFilter {
  search?: string; status?: CrmOrderStatus; fulfillmentStatus?: CrmOrderFulfillmentStatus;
  paymentStatus?: CrmOrderPaymentStatus; contactId?: string; accountId?: string;
  page?: number; pageSize?: number;
}



// ── Process Workflow ──────────────────────────────────────────────────────────
export interface ProcessStepDto {
  id: string;
  stepOrder: number;
  name: string;
  description?: string;
  assignedTeamLabel?: string;
  assignedToUserId?: string;
  slaHours: number;
}
export interface ProcessDefinitionDto {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  steps: ProcessStepDto[];
  createdAt: string;
}
export interface CreateProcessStepRequest {
  stepOrder: number;
  name: string;
  description?: string;
  assignedTeamLabel?: string;
  assignedToUserId?: string;
  slaHours?: number;
}
export interface CreateProcessDefinitionRequest {
  name: string;
  description?: string;
  steps: CreateProcessStepRequest[];
}
export interface ProcessInstanceDto {
  id: string;
  processDefinitionId: string;
  definitionName: string;
  status: number;
  triggerKind: number;
  triggerRefId?: string;
  triggerRefKind?: string;
  currentStepOrder: number;
  totalSteps: number;
  startedAt: string;
}
export interface ProcessTaskDto {
  id: string;
  processInstanceId: string;
  processStepId: string;
  stepOrder: number;
  stepName: string;
  definitionName: string;
  assignedTeamLabel?: string;
  assignedToUserId?: string;
  status: number;
  assignedAt: string;
}
export interface StartProcessRequest {
  processDefinitionId: string;
  triggerKind?: number;
  triggerRefId?: string;
  triggerRefKind?: string;
}
export interface CompleteProcessTaskRequest {
  notes?: string;
}
export const PROCESS_TASK_STATUS_LABELS: Record<number, string> = {
  1: 'Pending', 2: 'In Progress', 3: 'Completed', 4: 'Skipped',
};

// ─── Meetings ─────────────────────────────────────────────────────────────────

// Matches backend MeetingStatus enum
export const CrmMeetingStatus = {
  ProposalDrafted: 1, ProposalSent: 2, CustomerAccepted: 3, CustomerDeclined: 4,
  Rescheduling: 5, Booked: 6, Cancelled: 7, Completed: 8, Escalated: 9,
} as const;
export type CrmMeetingStatus = (typeof CrmMeetingStatus)[keyof typeof CrmMeetingStatus];
export const CRM_MEETING_STATUS_LABELS: Record<CrmMeetingStatus, string> = {
  1: 'Proposal Drafted', 2: 'Proposal Sent', 3: 'Customer Accepted', 4: 'Customer Declined',
  5: 'Rescheduling', 6: 'Booked', 7: 'Cancelled', 8: 'Completed', 9: 'Escalated',
};
export const CRM_MEETING_STATUS_COLORS: Record<CrmMeetingStatus, string> = {
  1: 'text-[#F59E0B] bg-[rgba(245,158,11,0.1)] border-[rgba(245,158,11,0.2)]',
  2: 'text-[#8B5CF6] bg-[rgba(139,92,246,0.1)] border-[rgba(139,92,246,0.2)]',
  3: 'text-success bg-success-soft border-[rgba(34,197,94,0.2)]',
  4: 'text-danger bg-danger-soft border-[rgba(244,63,94,0.2)]',
  5: 'text-[#F59E0B] bg-[rgba(245,158,11,0.1)] border-[rgba(245,158,11,0.2)]',
  6: 'text-brand bg-brand-soft border-border-glow',
  7: 'text-text-muted bg-bg-card border-border-subtle',
  8: 'text-success bg-success-soft border-[rgba(34,197,94,0.2)]',
  9: 'text-danger bg-danger-soft border-[rgba(244,63,94,0.2)]',
};
export const CrmCallSummaryStatus = { Pending: 1, Generating: 2, Ready: 3, Failed: 4 } as const;
export type CrmCallSummaryStatus = (typeof CrmCallSummaryStatus)[keyof typeof CrmCallSummaryStatus];
export const CRM_CALL_SUMMARY_STATUS_LABELS: Record<CrmCallSummaryStatus, string> = {
  1: 'Pending', 2: 'Generating', 3: 'Ready', 4: 'Failed',
};
export interface CrmMeetingSummaryDto {
  id: string;
  contactId: string;
  dealId: string | null;
  title: string;
  status: CrmMeetingStatus;
  acceptedSlot: string | null;
  durationMinutes: number;
  createdAt: string;
  joinUrl: string | null;
  contactName: string | null;
  dealName: string | null;
}
export interface CrmMeetingSlotDto { start: string; end: string; timezone: string; }
export interface CrmMeetingAttendeeDto { name: string; email: string; role: string; }
export interface CrmMeetingDetailDto {
  id: string;
  contactId: string;
  dealId: string | null;
  ownedByUserId: string;
  title: string;
  agendaText: string | null;
  status: CrmMeetingStatus;
  trigger: number;
  proposedSlots: CrmMeetingSlotDto[];
  acceptedSlot: string | null;
  customerTimezone: string | null;
  durationMinutes: number;
  calendarEventId: string | null;
  calendarProvider: string | null;
  attendees: CrmMeetingAttendeeDto[];
  joinUrl: string | null;
  notes: string | null;
  cancellationReason: string | null;
  createdAt: string;
  updatedAt: string | null;
  schedulingToken: string | null;
  schedulingTokenExpiresAt: string | null;
}
export interface CrmMeetingInitiateRequest {
  contactId: string;
  dealId?: string;
  title: string;
  agendaText?: string;
  joinUrl?: string;
  attendees?: CrmMeetingAttendeeDto[];
  generateSlots?: boolean;
  durationMinutes?: number;
  scheduledAt?: string;
}
export interface CrmMeetingFilter { search?: string; status?: CrmMeetingStatus; page?: number; pageSize?: number; }

// ── Public scheduling (no-auth, contact-facing) ───────────────────────────────
export interface PublicScheduleDto {
  meetingTitle: string;
  agendaText: string | null;
  durationMinutes: number;
  organizerName: string;
  availableSlots: CrmMeetingSlotDto[];
}
export interface PublicScheduleConfirmRequest {
  selectedSlot: string;
  contactName: string;
  contactEmail: string;
  timezone?: string;
}
export interface PublicScheduleConfirmedDto {
  meetingTitle: string;
  confirmedSlot: string;
  durationMinutes: number;
  joinUrl: string | null;
  message: string;
}
export interface CrmCallSummarySummaryDto {
  id: string; contactId: string | null; contactName: string | null;
  dealId: string | null; dealName: string | null; signalId: string | null;
  status: CrmCallSummaryStatus; summaryText: string | null;
  sentiment: CrmSignalSentiment | null; createdAt: string;
}
export interface CrmCallSummaryDetailDto extends CrmCallSummarySummaryDto { actionItems: string[]; }
export interface CrmCallSummaryRequestDto { contactId: string; signalId?: string; meetingId?: string; trigger: number; }
export interface CrmCallSummaryFilter { page?: number; pageSize?: number; }

// ─── NPS Surveys ─────────────────────────────────────────────────────────────

export const CrmNpsSurveyTrigger = { PostSupport: 1, PostPurchase: 2, Periodic: 3, Manual: 4 } as const;
export type CrmNpsSurveyTrigger = (typeof CrmNpsSurveyTrigger)[keyof typeof CrmNpsSurveyTrigger];
export const CRM_NPS_TRIGGER_LABELS: Record<CrmNpsSurveyTrigger, string> = {
  1: 'Post Support', 2: 'Post Purchase', 3: 'Periodic', 4: 'Manual',
};
export const CrmNpsClassification = { Detractor: 1, Passive: 2, Promoter: 3 } as const;
export type CrmNpsClassification = (typeof CrmNpsClassification)[keyof typeof CrmNpsClassification];
export const CRM_NPS_CLASSIFICATION_LABELS: Record<CrmNpsClassification, string> = {
  1: 'Detractor', 2: 'Passive', 3: 'Promoter',
};
export const CRM_NPS_CLASSIFICATION_COLORS: Record<CrmNpsClassification, string> = {
  1: 'text-danger bg-danger-soft border-[rgba(244,63,94,0.2)]',
  2: 'text-[#F59E0B] bg-[rgba(245,158,11,0.1)] border-[rgba(245,158,11,0.2)]',
  3: 'text-success bg-success-soft border-[rgba(34,197,94,0.2)]',
};
export interface CrmNpsSurveySummaryDto {
  id: string; contactId: string; contactName: string | null;
  dealId: string | null; supportCaseId: string | null;
  score: number | null; classification: CrmNpsClassification | null;
  comment: string | null; trigger: CrmNpsSurveyTrigger;
  sentAt: string | null; respondedAt: string | null; createdAt: string;
}
export interface CrmNpsTenantSummaryDto {
  npsScore: number; promoterCount: number; passiveCount: number; detractorCount: number;
  promoterPct: number; passivePct: number; detractorPct: number; totalResponses: number;
}
export interface CrmNpsSendRequest { contactId: string; dealId?: string; supportCaseId?: string; trigger?: CrmNpsSurveyTrigger; customMessage?: string; }
export interface CrmNpsFilter { search?: string; classification?: CrmNpsClassification; page?: number; pageSize?: number; }

// ─── Time Tracking ────────────────────────────────────────────────────────────

export const CrmTimeEntityKind = { Task: 1, Deal: 2, SupportCase: 3, Contact: 4 } as const;
export type CrmTimeEntityKind = (typeof CrmTimeEntityKind)[keyof typeof CrmTimeEntityKind];
export const CRM_TIME_ENTITY_LABELS: Record<CrmTimeEntityKind, string> = {
  1: 'Task', 2: 'Deal', 3: 'Support Case', 4: 'Contact',
};
export interface CrmTimeEntrySummaryDto {
  id: string; entityKind: CrmTimeEntityKind; entityId: string; entityLabel: string | null;
  minutesLogged: number; isBillable: boolean; description: string | null;
  loggedByUserId: string; loggedByUserName: string | null; loggedAt: string;
}
export interface CrmTimeSummaryDto {
  totalBillableMinutes: number; totalNonBillableMinutes: number;
  totalBillableHours: number; totalNonBillableHours: number;
}
export interface CrmLogTimeRequest { entityKind: CrmTimeEntityKind; entityId: string; minutesLogged: number; isBillable?: boolean; description?: string; }
export interface CrmTimeEntryFilter { entityKind?: CrmTimeEntityKind; entityId?: string; page?: number; pageSize?: number; }

// ─── Comments ─────────────────────────────────────────────────────────────────

export const CrmCommentableKind = { Contact: 1, Deal: 2, SupportCase: 3, Lead: 4, Account: 5 } as const;
export type CrmCommentableKind = (typeof CrmCommentableKind)[keyof typeof CrmCommentableKind];
export interface CrmCommentDto {
  id: string; parentCommentId: string | null; authorId: string; authorName: string;
  body: string; mentionedUserIdsJson: string | null;
  createdAt: string; updatedAt: string | null; replies?: CrmCommentDto[];
}
export interface CrmCommentCreateRequest { body: string; parentCommentId?: string; mentionedUserIds?: string[]; }
export interface CrmCommentEditRequest { body: string; }

// ─── Workflow Engine ──────────────────────────────────────────────────────────

// Trigger types as strings (matching backend)
export const CRM_WORKFLOW_TRIGGER_LABELS: Record<string, string> = {
  'funnel.stage_changed': 'Funnel Stage Changed',
  'deal.stage_changed': 'Deal Stage Changed',
  'support_case.created': 'Support Case Created',
  'support_case.escalated': 'Support Case Escalated',
  'lead.score_threshold': 'Lead Score Threshold',
  'task.due_soon': 'Task Due Soon',
  'manual': 'Manual',
  'agent.handoff_requested': 'Agent Handoff Requested',
  'lead.re_engaged': 'Lead Re-engaged',
  'meeting.booked': 'Meeting Booked',
  'meeting.completed': 'Meeting Completed',
  'proposal.sent': 'Proposal Sent',
  'quote.sent': 'Quote Sent',
  'quote.accepted': 'Quote Accepted',
  'signal.created': 'Signal Created',
  'deal.closed_won': 'Deal Closed Won',
  'deal.closed_lost': 'Deal Closed Lost',
  'campaign.matched': 'Campaign Matched',
  'lead.created': 'Lead Created',
  'contact.created': 'Contact Created',
  'deal.created': 'Deal Created',
  // Website events — fired from the tracking snippet (POST /events/ingest)
  'page.viewed': 'Website: Page Viewed',
  'product.viewed': 'Website: Product Viewed',
  'user.signed_up': 'Website: User Signed Up',
  'user.logged_in': 'Website: User Logged In',
  'newsletter.subscribed': 'Website: Newsletter Subscribed',
  'cart.item_added': 'Website: Added to Cart',
  'checkout.started': 'Website: Checkout Started',
  'purchase.completed': 'Website: Purchase Completed',
  'payment.failed': 'Website: Payment Failed',
  'order.delivered': 'Website: Order Delivered',
  'review.submitted': 'Website: Review Submitted',
  'return.requested': 'Website: Return Requested',
  'subscription.renewed': 'Website: Subscription Renewed',
  'subscription.cancelled': 'Website: Subscription Cancelled',
};

// Action types as strings (matching backend)
export const CRM_WORKFLOW_ACTION_LABELS: Record<string, string> = {
  'create_task': 'Create Task',
  'send_notification': 'Send Notification',
  'update_funnel_stage': 'Update Funnel Stage',
  'assign_to_user': 'Assign to User',
  'create_nurture_entry': 'Enroll in Nurture',
  'send_email': 'Send Email',
  'adjust_lead_score': 'Adjust Lead Score',
  'create_deal': 'Create Deal',
  'advance_stage': 'Advance Stage',
  'log_signal': 'Log Signal',
  'update_field': 'Update Field',
  'start_process': 'Start Process Workflow',
};

export const CrmWorkflowTriggerType = {
  FunnelStageChanged: 1, DealStageChanged: 2, SupportCaseCreated: 3,
  SupportCaseEscalated: 4, LeadScoreThreshold: 5, TaskDueSoon: 6,
  Manual: 7, AgentHandoffRequested: 8, LeadReEngaged: 9,
} as const;
export type CrmWorkflowTriggerType = (typeof CrmWorkflowTriggerType)[keyof typeof CrmWorkflowTriggerType];

export const CrmWorkflowActionType = {
  CreateTask: 1, SendNotification: 2, UpdateFunnelStage: 3,
  AssignToUser: 4, CreateNurtureEntry: 5, SendEmail: 6, AdjustLeadScore: 7, CreateDeal: 8,
} as const;
export type CrmWorkflowActionType = (typeof CrmWorkflowActionType)[keyof typeof CrmWorkflowActionType];

export const CrmWorkflowExecutionStatus = {
  Pending: 1, Running: 2, Completed: 3, Failed: 4, Cancelled: 5,
} as const;
export type CrmWorkflowExecutionStatus = (typeof CrmWorkflowExecutionStatus)[keyof typeof CrmWorkflowExecutionStatus];
export const CRM_WORKFLOW_EXECUTION_STATUS_LABELS: Record<CrmWorkflowExecutionStatus, string> = {
  1: 'Pending', 2: 'Running', 3: 'Completed', 4: 'Failed', 5: 'Cancelled',
};
export interface CrmWorkflowStepDto { id: string; stepOrder: number; actionType: string; actionConfigJson: string | null; delayMinutes: number; }
export interface CrmWorkflowSummaryDto {
  id: string; name: string; description: string | null; triggerType: string;
  triggerConditionsJson: string | null; timerType: string | null; timerConfigJson: string | null;
  steps: CrmWorkflowStepDto[]; isActive: boolean;
  executionCount: number; lastTriggeredAt: string | null; lastTimerEvaluatedAt: string | null; createdAt: string;
}
export interface CrmWorkflowDetailDto extends CrmWorkflowSummaryDto {}
export interface CrmWorkflowStepRequest { stepOrder: number; actionType: string; actionConfigJson?: string; delayMinutes?: number; }
export interface CrmWorkflowCreateRequest { name: string; description?: string; triggerType: string; triggerConditionsJson?: string; timerType?: string; timerConfigJson?: string; steps: CrmWorkflowStepRequest[]; }
export interface CrmWorkflowUpdateRequest { name?: string; description?: string; triggerType?: string; triggerConditionsJson?: string; timerType?: string; timerConfigJson?: string; isActive?: boolean; steps?: CrmWorkflowStepRequest[]; }
export interface CrmWorkflowExecutionDto {
  id: string; workflowId: string; status: CrmWorkflowExecutionStatus;
  startedAt: string; completedAt: string | null; errorMessage: string | null;
}
export interface CrmWorkflowFilter { triggerType?: string; isActive?: boolean; page?: number; pageSize?: number; }
export interface CrmWorkflowTriggerRequest { triggerType: string; entityKind: number; entityId: string; contextJson?: string; }

// ─── Workflow Campaign ────────────────────────────────────────────────────────
export interface CrmWorkflowCampaignDto {
  id: string; name: string; description: string | null;
  targetEntityType: string; segmentConditionsJson: string;
  workflowId: string; triggerType: string;
  scheduleType: string | null; isActive: boolean;
  lastRunAt: string | null; totalMatched: number; createdAt: string;
}
export interface CrmWorkflowCampaignCreateRequest {
  name: string; description?: string; targetEntityType: string;
  segmentConditionsJson: string; workflowId: string;
  triggerType?: string; scheduleType?: string;
}
export interface CrmWorkflowCampaignUpdateRequest {
  name?: string; description?: string; segmentConditionsJson?: string;
  scheduleType?: string; isActive?: boolean;
}

// ─── AI Actions ───────────────────────────────────────────────────────────────

export const CrmAiActionStatus = {
  Pending: 1, Approved: 2, Rejected: 3, Executing: 4, Executed: 5, Undone: 6,
} as const;
export type CrmAiActionStatus = (typeof CrmAiActionStatus)[keyof typeof CrmAiActionStatus];
export const CRM_AI_ACTION_STATUS_LABELS: Record<CrmAiActionStatus, string> = {
  1: 'Pending', 2: 'Approved', 3: 'Rejected', 4: 'Executing', 5: 'Executed', 6: 'Undone',
};
export const CRM_AI_ACTION_STATUS_COLORS: Record<CrmAiActionStatus, string> = {
  1: 'text-[#F59E0B] bg-[rgba(245,158,11,0.1)] border-[rgba(245,158,11,0.2)]',
  2: 'text-brand bg-brand-soft border-border-glow',
  3: 'text-danger bg-danger-soft border-[rgba(244,63,94,0.2)]',
  4: 'text-[#A78BFA] bg-[rgba(167,139,250,0.1)] border-[rgba(167,139,250,0.2)]',
  5: 'text-success bg-success-soft border-[rgba(34,197,94,0.2)]',
  6: 'text-text-muted bg-bg-card border-border-subtle',
};
export interface CrmAiActionDto {
  id: string; actionType: string; entityKind: string;
  entityId: string | null; entityLabel: string | null;
  description: string; status: CrmAiActionStatus;
  approvedByUserId: string | null; executedAt: string | null; createdAt: string;
}

// ─── Facebook / Instagram Ads ─────────────────────────────────────────────────

export interface FbAdAccountDto {
  id: string;
  adAccountId: string;
  businessName: string | null;
  currency: string | null;
  isActive: boolean;
  hasToken: boolean;
  lastSyncedAt: string | null;
  totalCampaignsSynced: number;
}

export interface FbAdCampaignDto {
  id: string;
  fbCampaignId: string;
  name: string;
  objective: string | null;
  fbStatus: string;
  dailyBudget: number | null;
  lifetimeBudget: number | null;
  budgetCurrency: string | null;
  startTime: string | null;
  stopTime: string | null;
  impressions: number;
  clicks: number;
  spend: number;
  reach: number;
  ctr: number | null;
  cpc: number | null;
  frequency: number | null;
  leadsCount: number;
  attributedRevenue: number;
  crmLeadsCount: number;
  insightsSyncedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FbAdSyncResultDto {
  campaignsSynced: number;
  campaignsCreated: number;
  campaignsUpdated: number;
  errors: string[];
  syncedAt: string;
}

export interface FbAdAggregateDto {
  totalCampaigns: number;
  activeCampaigns: number;
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  totalReach: number;
  totalLeads: number;
  totalRevenue: number;
  totalCrmLeads: number;
  overallCtr: number | null;
  overallCpc: number | null;
  overallRoas: number | null;
}

export interface FbAdAccountConnectRequest {
  adAccountId: string;
  accessToken: string;
  businessName?: string;
  currency?: string;
}

// ─── TikTok Ads ──────────────────────────────────────────────────────────────

export interface TikTokAdAccountDto {
  id: string;
  advertiserId: string;
  businessName?: string;
  isActive: boolean;
  hasToken: boolean;
  lastSyncedAt?: string;
  totalCampaignsSynced: number;
}

export interface TikTokAdCampaignDto {
  id: string;
  tikTokCampaignId: string;
  name: string;
  objective?: string;
  status: string;
  dailyBudget?: number;
  lifetimeBudget?: number;
  budgetCurrency?: string;
  startTime?: string;
  stopTime?: string;
  impressions: number;
  clicks: number;
  spend: number;
  reach: number;
  ctr?: number;
  cpc?: number;
  conversions: number;
  costPerConversion?: number;
  videoViews: number;
  likes: number;
  shares: number;
  comments: number;
  insightsSyncedAt?: string;
  createdFromOmniFlow: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TikTokAdSyncResultDto {
  campaignsSynced: number;
  campaignsCreated: number;
  campaignsUpdated: number;
  syncedAt: string;
  errors: string[];
}

export interface TikTokAdAccountConnectRequest {
  advertiserId: string;
  accessToken: string;
  businessName?: string;
}

export interface TikTokAdAggregateDto {
  totalCampaigns: number;
  activeCampaigns: number;
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  totalReach: number;
  totalConversions: number;
  totalVideoViews: number;
  totalLikes: number;
  totalShares: number;
  totalComments: number;
  overallCtr?: number;
  overallCpc?: number;
}

// ─── Announcements ────────────────────────────────────────────────────────────

export const AnnouncementType = { General: 1, Maintenance: 2, Feature: 3, Alert: 4, Urgent: 5 } as const;
export type AnnouncementType = (typeof AnnouncementType)[keyof typeof AnnouncementType];

export const AnnouncementStatus = { Draft: 1, Scheduled: 2, Published: 3, Archived: 4 } as const;
export type AnnouncementStatus = (typeof AnnouncementStatus)[keyof typeof AnnouncementStatus];

export const ANNOUNCEMENT_TYPE_LABELS: Record<AnnouncementType, string> = {
  1: 'General', 2: 'Maintenance', 3: 'Feature', 4: 'Alert', 5: 'Urgent',
};
export const ANNOUNCEMENT_STATUS_LABELS: Record<AnnouncementStatus, string> = {
  1: 'Draft', 2: 'Scheduled', 3: 'Published', 4: 'Archived',
};
export const ANNOUNCEMENT_STATUS_COLORS: Record<AnnouncementStatus, string> = {
  1: 'text-text-muted border-border-subtle bg-bg-elevated',
  2: 'text-amber-400 border-amber-400/30 bg-amber-400/10',
  3: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10',
  4: 'text-text-muted border-border-subtle bg-bg-elevated',
};

export interface AnnouncementSummaryDto {
  id: string;
  title: string;
  type: AnnouncementType;
  status: AnnouncementStatus;
  scheduledAt?: string;
  publishedAt?: string;
  createdAt: string;
}

export interface AnnouncementDetailDto extends AnnouncementSummaryDto {
  content: string;
  archivedAt?: string;
  createdByUserId: string;
  updatedAt?: string;
}

export interface AnnouncementCreateRequest {
  title: string;
  content: string;
  type: AnnouncementType;
  scheduledAt?: string;
}

export interface AnnouncementUpdateRequest {
  title?: string;
  content?: string;
  type?: AnnouncementType;
  scheduledAt?: string;
}

// ─── Web Events ────────────────────────────────────────────────────────────────

export interface WebEventSummaryDto {
  id: string;
  eventType: string;
  contactEmail?: string;
  contactId?: string;
  workflowsTriggered: number;
  receivedAt: string;
  propertiesJson?: string;
}

// ── Custom Fields ─────────────────────────────────────────────────────────────

export const CrmEntityType = {
  Contact: 1, Lead: 2, Deal: 3, Case: 4, Organization: 5, Account: 6,
} as const;
export type CrmEntityType = (typeof CrmEntityType)[keyof typeof CrmEntityType];

export const CRM_ENTITY_TYPE_LABELS: Record<CrmEntityType, string> = {
  1: 'Contact', 2: 'Lead', 3: 'Deal', 4: 'Case', 5: 'Organization', 6: 'Account',
};

export const CustomFieldType = {
  Text: 1, Number: 2, Date: 3, Dropdown: 4, Boolean: 5, Url: 6, Email: 7,
} as const;
export type CustomFieldType = (typeof CustomFieldType)[keyof typeof CustomFieldType];

export const CUSTOM_FIELD_TYPE_LABELS: Record<CustomFieldType, string> = {
  1: 'Text', 2: 'Number', 3: 'Date', 4: 'Dropdown', 5: 'Yes/No', 6: 'URL', 7: 'Email',
};

export interface CustomFieldDefinitionDto {
  id: string;
  entityType: CrmEntityType;
  name: string;
  description?: string;
  fieldType: CustomFieldType;
  options?: string[];
  isRequired: boolean;
  isActive: boolean;
  order: number;
  createdAt: string;
}

export interface CreateCustomFieldDefinitionRequest {
  name: string;
  description?: string;
  entityType: CrmEntityType;
  fieldType: CustomFieldType;
  options?: string[];
  isRequired: boolean;
  order?: number;
}

export interface UpdateCustomFieldDefinitionRequest {
  name?: string;
  description?: string;
  fieldType?: CustomFieldType;
  options?: string[];
  isRequired?: boolean;
  isActive?: boolean;
  order?: number;
}

export interface CustomFieldValueDto {
  definitionId: string;
  name: string;
  description?: string;
  fieldType: CustomFieldType;
  options?: string[];
  isRequired: boolean;
  value?: string;
}

export interface SetCustomFieldValuesRequest {
  values: Array<{ definitionId: string; value?: string }>;
}

// ── CSV Import/Export ─────────────────────────────────────────────────────────

export interface CsvImportResultDto {
  total: number;
  succeeded: number;
  failed: number;
  errors: Array<{ row: number; error: string }>;
}

// ─── Deduplication ────────────────────────────────────────────────────────────

export const CrmDedupStatus = { Pending: 1, Approved: 2, Rejected: 3 } as const;
export type CrmDedupStatus = (typeof CrmDedupStatus)[keyof typeof CrmDedupStatus];

export interface CrmDedupContactInfo {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  jobTitle?: string;
  sourceKind: CrmContactSourceKind;
  createdAt: string;
}

export interface CrmDedupCandidateDto {
  id: string;
  contactAId: string;
  contactAName: string;
  contactBId: string;
  contactBName: string;
  similarityScore: number;
  matchReasons: string[];
  status: CrmDedupStatus;
  createdAt: string;
  contactADetail?: CrmDedupContactInfo;
  contactBDetail?: CrmDedupContactInfo;
}

export interface CrmDedupResolutionRequest {
  winnerId: string;
}



export interface ActivityEventDto {
  id: string;
  entityKind: number;
  entityId: string;
  eventKind: number;
  actorUserId?: string;
  summary: string;
  metaJson?: string;
  occurredAt: string;
}
export interface ActivityLogRequest {
  entityKind: number;
  eventKind: number;
  entityId: string;
  summary: string;
  occurredAt?: string;
}

// ─── Notification Preferences ──────────────────────────────────────────────────
export const NotificationDeliveryChannel = {
  InApp: 1, Email: 2, Both: 3,
} as const;
export type NotificationDeliveryChannel = (typeof NotificationDeliveryChannel)[keyof typeof NotificationDeliveryChannel];
export const NOTIFICATION_CHANNEL_LABELS: Record<number, string> = {
  1: 'In-app', 2: 'Email', 3: 'In-app & email',
};
export const NotificationDigestMode = {
  Instant: 1, Hourly: 2, Daily: 3, Weekly: 4,
} as const;
export type NotificationDigestMode = (typeof NotificationDigestMode)[keyof typeof NotificationDigestMode];
export const NOTIFICATION_DIGEST_LABELS: Record<number, string> = {
  1: 'Instant', 2: 'Hourly', 3: 'Daily', 4: 'Weekly',
};
export interface CrmNotifPreferenceDto {
  notificationType: number;
  enabled: boolean;
  deliveryChannel: number;
  digestMode: number;
}
export const CONFIGURABLE_NOTIFICATION_TYPES: { value: number; label: string; description: string }[] = [
  { value: 1, label: 'New lead assigned', description: 'A lead is assigned to you or your team' },
  { value: 2, label: 'Deal stage change', description: 'A deal you own moves to a new stage' },
  { value: 3, label: 'Signal received', description: 'An intent signal is detected for a contact' },
  { value: 4, label: 'Mention in comment', description: 'Someone @mentions you in a comment' },
  { value: 5, label: 'Task overdue', description: 'A task assigned to you passes its due date' },
  { value: 6, label: 'Approval request', description: 'Someone requests your approval' },
  { value: 7, label: 'Daily digest', description: 'End-of-day summary of changes' },
];

export interface CrmActivityFeedFilter {
  from?: string;
  to?: string;
  eventKinds?: number[];
  entityKind?: number;
  actorUserId?: string;
  page?: number;
  pageSize?: number;
}

/** Mirrors backend CrmAuditOperation. */
export const CrmAuditOperation = {
  Created: 1, Updated: 2, Deleted: 3,
} as const;
export type CrmAuditOperation = (typeof CrmAuditOperation)[keyof typeof CrmAuditOperation];

/** Mirrors backend CrmActivityEventKind. */
export const CrmActivityEventKind = {
  CommentAdded: 1, StageChanged: 2, DealCreated: 3, AssignmentChanged: 4,
  TaskCompleted: 5, SignalReceived: 6, FieldEdited: 7,
} as const;
export type CrmActivityEventKind = (typeof CrmActivityEventKind)[keyof typeof CrmActivityEventKind];

/** Mirrors backend CrmActivityEntityKind. */
export const CrmActivityEntityKind = {
  Contact: 1, Deal: 2, SupportCase: 3, Lead: 4, Account: 5, Organization: 6, Task: 7,
} as const;
export type CrmActivityEntityKind = (typeof CrmActivityEntityKind)[keyof typeof CrmActivityEntityKind];

export interface CrmAuditLogDto {
  id: string;
  operation: number;
  entityKind: number;
  fieldName?: string;
  oldValue?: string;
  newValue?: string;
  changedByUserId?: string;
  changedAt: string;
}

export interface CrmAuditFilter {
  pageSize?: number;
  entityKind?: number;
}

/** Mirrors backend CrmActivityEntityKind. */
export const CRM_ACTIVITY_ENTITY_LABELS: Record<number, string> = {
  1: 'Contact',
  2: 'Deal',
  3: 'Support Case',
  4: 'Lead',
  5: 'Account',
  6: 'Organization',
  7: 'Task',
};

/** Mirrors backend CrmActivityEventKind. */
export const CRM_ACTIVITY_EVENT_LABELS: Record<number, string> = {
  1: 'Comment added',
  2: 'Stage changed',
  3: 'Deal created',
  4: 'Assignment changed',
  5: 'Task completed',
  6: 'Signal received',
  7: 'Field edited',
  8: 'Quote drafted',
  9: 'Quote sent',
  10: 'Quote accepted',
  11: 'Quote rejected',
  12: 'Proposal drafted',
  13: 'Proposal sent',
  14: 'Proposal accepted',
  15: 'Proposal rejected',
  16: 'Task created',
  17: 'Call',
  18: 'Meeting',
  19: 'Note',
  20: 'Record created',
  21: 'Record updated',
  22: 'Record deleted',
  46: 'Approval submitted',
  47: 'Approval approved',
  48: 'Approval rejected',
};
export interface DealStrategyDto {
  champion?: string;
  competition?: string;
  winPlan?: string;
  nextSteps?: string;
}
export interface DealTimelineDto {
  dealId: string;
  events: ActivityEventDto[];
}

// ─── Shared Inbox ──────────────────────────────────────────────────────────────
export const CrmInboxItemKind = {
  Lead: 1, SupportCase: 2, Task: 3,
} as const;
export type CrmInboxItemKind = (typeof CrmInboxItemKind)[keyof typeof CrmInboxItemKind];

export const CRM_INBOX_KIND_LABELS: Record<number, string> = {
  1: 'Lead', 2: 'Support Case', 3: 'Task',
};

export interface CrmInboxItemDto {
  id: string;
  kind: number;
  title?: string;
  status?: string;
  priority?: string;
  score?: number;
  createdAt: string;
}

export interface CrmInboxSummaryDto {
  total: number;
  leads: number;
  supportCases: number;
  tasks: number;
}

// ─── Delivery / Shipments ─────────────────────────────────────────────────────

export const CrmDeliveryStatus = {
  LabelCreated: 1, PickedUp: 2, InTransit: 3, OutForDelivery: 4, Delivered: 5, Failed: 6, Returned: 7,
} as const;
export type CrmDeliveryStatus = (typeof CrmDeliveryStatus)[keyof typeof CrmDeliveryStatus];
export const CRM_DELIVERY_STATUS_LABELS: Record<CrmDeliveryStatus, string> = {
  1: 'Label Created', 2: 'Picked Up', 3: 'In Transit', 4: 'Out for Delivery',
  5: 'Delivered', 6: 'Failed', 7: 'Returned',
};
export const CRM_DELIVERY_STATUS_COLORS: Record<CrmDeliveryStatus, string> = {
  1: 'text-text-secondary bg-bg-elevated border-border-subtle',
  2: 'text-[#F59E0B] bg-[rgba(245,158,11,0.1)] border-[rgba(245,158,11,0.2)]',
  3: 'text-brand bg-brand-soft border-border-glow',
  4: 'text-[#A78BFA] bg-[rgba(167,139,250,0.1)] border-[rgba(167,139,250,0.2)]',
  5: 'text-success bg-success-soft border-[rgba(34,197,94,0.2)]',
  6: 'text-danger bg-danger-soft border-[rgba(244,63,94,0.2)]',
  7: 'text-text-muted bg-bg-card border-border-subtle',
};

export interface CrmDeliveryDto {
  id: string; orderId: string; shipmentNumber: string; status: CrmDeliveryStatus;
  carrier: string | null; trackingNumber: string | null;
  estimatedDeliveryDate: string | null; shippedAt: string | null;
  outForDeliveryAt: string | null; deliveredAt: string | null;
  recipientName: string | null; proofPhotoUrl: string | null;
  signatureUrl: string | null; podSignedByName: string | null;
  podSignedAt: string | null; podConfirmedAt: string | null;
  failureReason: string | null; notes: string | null; createdAt: string;
}

export interface CrmCreateDeliveryRequest {
  carrier?: string; trackingNumber?: string; estimatedDeliveryDate?: string;
  recipientName?: string; notes?: string;
}

export interface CrmUpdateDeliveryStatusRequest {
  status: CrmDeliveryStatus; carrier?: string; trackingNumber?: string;
  recipientName?: string; proofPhotoUrl?: string; signatureUrl?: string; failureReason?: string;
}

export interface CrmDeliveryFilter {
  status?: CrmDeliveryStatus; orderId?: string; search?: string; page?: number; pageSize?: number;
}

// ─── Equipment / Asset ────────────────────────────────────────────────────────

export const CrmEquipmentStatus = {
  Active: 1, UnderRepair: 2, Decommissioned: 3, Returned: 4, Standby: 5,
} as const;
export type CrmEquipmentStatus = (typeof CrmEquipmentStatus)[keyof typeof CrmEquipmentStatus];
export const CRM_EQUIPMENT_STATUS_LABELS: Record<CrmEquipmentStatus, string> = {
  1: 'Active', 2: 'Under Repair', 3: 'Decommissioned', 4: 'Returned', 5: 'Standby',
};
export const CRM_EQUIPMENT_STATUS_COLORS: Record<CrmEquipmentStatus, string> = {
  1: 'text-success bg-success-soft border-[rgba(34,197,94,0.2)]',
  2: 'text-[#F59E0B] bg-[rgba(245,158,11,0.1)] border-[rgba(245,158,11,0.2)]',
  3: 'text-text-muted bg-bg-card border-border-subtle',
  4: 'text-text-secondary bg-bg-elevated border-border-subtle',
  5: 'text-brand bg-brand-soft border-border-glow',
};

export const CrmEquipmentCondition = {
  New: 1, Good: 2, Fair: 3, Poor: 4, Damaged: 5,
} as const;
export type CrmEquipmentCondition = (typeof CrmEquipmentCondition)[keyof typeof CrmEquipmentCondition];
export const CRM_EQUIPMENT_CONDITION_LABELS: Record<CrmEquipmentCondition, string> = {
  1: 'New', 2: 'Good', 3: 'Fair', 4: 'Poor', 5: 'Damaged',
};

export const CrmEquipmentNoteKind = {
  General: 1, ServiceNote: 2, WarrantyNote: 3, InspectionNote: 4, InstallNote: 5,
} as const;
export type CrmEquipmentNoteKind = (typeof CrmEquipmentNoteKind)[keyof typeof CrmEquipmentNoteKind];
export const CRM_EQUIPMENT_NOTE_KIND_LABELS: Record<CrmEquipmentNoteKind, string> = {
  1: 'General', 2: 'Service Note', 3: 'Warranty Note', 4: 'Inspection Note', 5: 'Install Note',
};

export interface CrmEquipmentNoteDto {
  id: string; equipmentId: string; authoredByUserId: string | null;
  kind: CrmEquipmentNoteKind; note: string; createdAt: string;
}

export interface CrmEquipmentSummaryDto {
  id: string; serialNumber: string; model: string; brand: string | null; category: string | null;
  contactId: string; contactName: string | null; accountId: string | null; accountName: string | null;
  orderId: string | null; siteLabel: string | null;
  status: CrmEquipmentStatus; condition: CrmEquipmentCondition | null;
  warrantyEndDate: string | null; nextServiceDue: string | null; createdAt: string;
}

export interface CrmEquipmentDetailDto extends CrmEquipmentSummaryDto {
  description: string | null; siteAddress: string | null;
  purchasedAt: string | null; installedAt: string | null; decommissionedAt: string | null;
  warrantyStartDate: string | null; warrantyTerms: string | null;
  serviceIntervalDays: number | null; lastServicedAt: string | null;
  purchasePrice: number | null; currency: string;
  dealId: string | null;
  notes: CrmEquipmentNoteDto[]; updatedAt: string | null;
}

export interface CrmEquipmentFilter {
  search?: string; status?: CrmEquipmentStatus; contactId?: string;
  accountId?: string; orderId?: string; category?: string; page?: number; pageSize?: number;
}

export interface CrmEquipmentCreateRequest {
  serialNumber: string; model: string; brand?: string; category?: string; description?: string;
  contactId: string; accountId?: string; orderId?: string; dealId?: string;
  siteLabel?: string; siteAddress?: string;
  purchasedAt?: string; installedAt?: string; warrantyStartDate?: string;
  warrantyEndDate?: string; warrantyTerms?: string; nextServiceDue?: string;
  serviceIntervalDays?: number; purchasePrice?: number; currency?: string;
  condition?: CrmEquipmentCondition;
}

export interface CrmEquipmentUpdateRequest {
  model?: string; brand?: string; category?: string; description?: string;
  siteLabel?: string; siteAddress?: string; installedAt?: string;
  warrantyStartDate?: string; warrantyEndDate?: string; warrantyTerms?: string;
  nextServiceDue?: string; serviceIntervalDays?: number; lastServicedAt?: string;
  purchasePrice?: number; currency?: string; condition?: CrmEquipmentCondition;
}

export interface CrmEquipmentStatusRequest { status: CrmEquipmentStatus; reason?: string; }
export interface AddEquipmentNoteRequest { kind: CrmEquipmentNoteKind; note: string; }

// ─── Returns / RMA ────────────────────────────────────────────────────────────

export const CrmReturnStatus = {
  PendingApproval: 1, Approved: 2, Rejected: 3, AwaitingReceive: 4,
  Received: 5, Inspecting: 6, Resolved: 7, Cancelled: 8,
} as const;
export type CrmReturnStatus = (typeof CrmReturnStatus)[keyof typeof CrmReturnStatus];
export const CRM_RETURN_STATUS_LABELS: Record<CrmReturnStatus, string> = {
  1: 'Pending Approval', 2: 'Approved', 3: 'Rejected', 4: 'Awaiting Receive',
  5: 'Received', 6: 'Inspecting', 7: 'Resolved', 8: 'Cancelled',
};
export const CRM_RETURN_STATUS_COLORS: Record<CrmReturnStatus, string> = {
  1: 'text-[#F59E0B] bg-[rgba(245,158,11,0.1)] border-[rgba(245,158,11,0.2)]',
  2: 'text-brand bg-brand-soft border-border-glow',
  3: 'text-danger bg-danger-soft border-[rgba(244,63,94,0.2)]',
  4: 'text-[#A78BFA] bg-[rgba(167,139,250,0.1)] border-[rgba(167,139,250,0.2)]',
  5: 'text-[#60A5FA] bg-[rgba(96,165,250,0.1)] border-[rgba(96,165,250,0.2)]',
  6: 'text-[#F59E0B] bg-[rgba(245,158,11,0.1)] border-[rgba(245,158,11,0.2)]',
  7: 'text-success bg-success-soft border-[rgba(34,197,94,0.2)]',
  8: 'text-text-muted bg-bg-card border-border-subtle',
};

export const CrmReturnReason = {
  Defective: 1, NotAsDescribed: 2, WrongItem: 3, DamagedInTransit: 4,
  NoLongerNeeded: 5, Exchange: 6, Other: 7,
} as const;
export type CrmReturnReason = (typeof CrmReturnReason)[keyof typeof CrmReturnReason];
export const CRM_RETURN_REASON_LABELS: Record<CrmReturnReason, string> = {
  1: 'Defective', 2: 'Not As Described', 3: 'Wrong Item', 4: 'Damaged in Transit',
  5: 'No Longer Needed', 6: 'Exchange', 7: 'Other',
};

export const CrmReturnResolution = {
  Replace: 1, Refund: 2, Credit: 3, Repair: 4, Restock: 5, Scrap: 6,
} as const;
export type CrmReturnResolution = (typeof CrmReturnResolution)[keyof typeof CrmReturnResolution];
export const CRM_RETURN_RESOLUTION_LABELS: Record<CrmReturnResolution, string> = {
  1: 'Replace', 2: 'Refund', 3: 'Credit', 4: 'Repair', 5: 'Restock', 6: 'Scrap',
};

export const CrmReturnInspectionResult = { Passed: 1, Failed: 2, PartialPass: 3 } as const;
export type CrmReturnInspectionResult = (typeof CrmReturnInspectionResult)[keyof typeof CrmReturnInspectionResult];
export const CRM_RETURN_INSPECTION_LABELS: Record<CrmReturnInspectionResult, string> = {
  1: 'Passed', 2: 'Failed', 3: 'Partial Pass',
};

export interface CrmReturnLineItemDto {
  id: string; productId: string | null; productName: string; sku: string | null;
  quantityOrdered: number; quantityReturned: number; unitPrice: number; totalPrice: number; notes: string | null;
}

export interface CrmReturnInspectionDto {
  id: string; returnRequestId: string; result: CrmReturnInspectionResult;
  findings: string | null; photoUrls: string | null; disposition: string | null;
  inspectedByUserId: string | null; inspectedAt: string | null;
}

export interface CrmReturnRequestDto {
  id: string; orderId: string; contactId: string; accountId: string | null;
  dealId: string | null; equipmentId: string | null;
  rmaNumber: string; status: CrmReturnStatus; returnReason: CrmReturnReason;
  resolution: CrmReturnResolution | null; customerNotes: string | null; staffNotes: string | null;
  rejectionReason: string | null; approvedAt: string | null; approvedBy: string | null;
  receivedAt: string | null; receivedBy: string | null;
  refundAmount: number | null; creditAmount: number | null; currency: string;
  replacementOrderId: string | null; returnCarrier: string | null; returnTrackingNumber: string | null;
  returnShippedAt: string | null; resolvedAt: string | null; createdAt: string;
  lineItems: CrmReturnLineItemDto[]; inspections: CrmReturnInspectionDto[];
}

export interface CrmReturnFilter {
  status?: CrmReturnStatus; contactId?: string; accountId?: string;
  orderId?: string; search?: string; page?: number; pageSize?: number;
}

export interface CrmReturnLineItemRequest {
  productId?: string; productName: string; sku?: string;
  quantityOrdered: number; quantityReturned: number; unitPrice: number;
}

export interface CrmCreateReturnRequest {
  orderId: string; contactId: string; accountId?: string; dealId?: string; equipmentId?: string;
  returnReason: CrmReturnReason; customerNotes?: string;
  returnCarrier?: string; returnTrackingNumber?: string;
  lineItems: CrmReturnLineItemRequest[];
}

export interface CrmUpdateReturnRequest {
  staffNotes?: string; resolution?: CrmReturnResolution;
  refundAmount?: number; creditAmount?: number;
  replacementOrderId?: string; returnCarrier?: string; returnTrackingNumber?: string;
}

export interface CrmRecordInspectionRequest {
  result: CrmReturnInspectionResult; findings?: string; photoUrls?: string; disposition?: string;
}

// ─── Field Service Work Orders ────────────────────────────────────────────────

export const CrmWorkOrderStatus = {
  Draft: 1, Scheduled: 2, EnRoute: 3, InProgress: 4, Completed: 5, Cancelled: 6,
} as const;
export type CrmWorkOrderStatus = (typeof CrmWorkOrderStatus)[keyof typeof CrmWorkOrderStatus];
export const CRM_WORK_ORDER_STATUS_LABELS: Record<CrmWorkOrderStatus, string> = {
  1: 'Draft', 2: 'Scheduled', 3: 'En Route', 4: 'In Progress', 5: 'Completed', 6: 'Cancelled',
};
export const CRM_WORK_ORDER_STATUS_COLORS: Record<CrmWorkOrderStatus, string> = {
  1: 'text-text-secondary bg-bg-elevated border-border-subtle',
  2: 'text-brand bg-brand-soft border-border-glow',
  3: 'text-[#A78BFA] bg-[rgba(167,139,250,0.1)] border-[rgba(167,139,250,0.2)]',
  4: 'text-[#F59E0B] bg-[rgba(245,158,11,0.1)] border-[rgba(245,158,11,0.2)]',
  5: 'text-success bg-success-soft border-[rgba(34,197,94,0.2)]',
  6: 'text-text-muted bg-bg-card border-border-subtle',
};

export const CrmWorkOrderType = {
  Repair: 1, Maintenance: 2, Installation: 3, Inspection: 4, Removal: 5,
} as const;
export type CrmWorkOrderType = (typeof CrmWorkOrderType)[keyof typeof CrmWorkOrderType];
export const CRM_WORK_ORDER_TYPE_LABELS: Record<CrmWorkOrderType, string> = {
  1: 'Repair', 2: 'Maintenance', 3: 'Installation', 4: 'Inspection', 5: 'Removal',
};

export const CrmWorkOrderPriority = { Low: 1, Normal: 2, High: 3, Urgent: 4 } as const;
export type CrmWorkOrderPriority = (typeof CrmWorkOrderPriority)[keyof typeof CrmWorkOrderPriority];
export const CRM_WORK_ORDER_PRIORITY_LABELS: Record<CrmWorkOrderPriority, string> = {
  1: 'Low', 2: 'Normal', 3: 'High', 4: 'Urgent',
};
export const CRM_WORK_ORDER_PRIORITY_COLORS: Record<CrmWorkOrderPriority, string> = {
  1: 'text-text-secondary bg-bg-elevated border-border-subtle',
  2: 'text-brand bg-brand-soft border-border-glow',
  3: 'text-[#F59E0B] bg-[rgba(245,158,11,0.1)] border-[rgba(245,158,11,0.2)]',
  4: 'text-danger bg-danger-soft border-[rgba(244,63,94,0.2)]',
};

export const CrmWorkOrderNoteKind = {
  General: 1, ProgressUpdate: 2, PartUsed: 3, CustomerFeedback: 4,
} as const;
export type CrmWorkOrderNoteKind = (typeof CrmWorkOrderNoteKind)[keyof typeof CrmWorkOrderNoteKind];
export const CRM_WORK_ORDER_NOTE_KIND_LABELS: Record<CrmWorkOrderNoteKind, string> = {
  1: 'General', 2: 'Progress Update', 3: 'Part Used', 4: 'Customer Feedback',
};

export interface CrmWorkOrderNoteDto {
  id: string; workOrderId: string; authoredByUserId: string | null;
  kind: CrmWorkOrderNoteKind; note: string; createdAt: string;
}

export interface CrmWorkOrderSummaryDto {
  id: string; workOrderNumber: string; title: string;
  type: CrmWorkOrderType; status: CrmWorkOrderStatus; priority: CrmWorkOrderPriority;
  contactId: string; contactName: string | null;
  accountId: string | null; equipmentId: string | null;
  equipmentModel: string | null; equipmentSerial: string | null;
  assignedToUserId: string | null; scheduledAt: string | null;
  completedAt: string | null; siteLabel: string | null; createdAt: string;
}

export interface CrmWorkOrderDetailDto extends CrmWorkOrderSummaryDto {
  description: string | null; supportCaseId: string | null; returnRequestId: string | null;
  startedAt: string | null; siteAddress: string | null;
  estimatedMinutes: number | null; actualMinutes: number | null;
  resolutionNotes: string | null; partsUsed: string | null;
  notes: CrmWorkOrderNoteDto[]; updatedAt: string | null;
}

export interface CrmWorkOrderFilter {
  search?: string; status?: CrmWorkOrderStatus; type?: CrmWorkOrderType;
  priority?: CrmWorkOrderPriority; equipmentId?: string; contactId?: string;
  assignedToUserId?: string; scheduledFrom?: string; scheduledTo?: string;
  page?: number; pageSize?: number;
}

export interface CrmCreateWorkOrderRequest {
  title: string; description?: string; type: CrmWorkOrderType; priority: CrmWorkOrderPriority;
  contactId: string; accountId?: string; equipmentId?: string;
  supportCaseId?: string; returnRequestId?: string;
  assignedToUserId?: string; scheduledAt?: string;
  siteLabel?: string; siteAddress?: string; estimatedMinutes?: number;
}

export interface CrmUpdateWorkOrderRequest {
  title?: string; description?: string; type?: CrmWorkOrderType; priority?: CrmWorkOrderPriority;
  assignedToUserId?: string; scheduledAt?: string;
  siteLabel?: string; siteAddress?: string; estimatedMinutes?: number; partsUsed?: string;
}

export interface CrmWorkOrderStatusRequest {
  status: CrmWorkOrderStatus; notes?: string; resolutionNotes?: string; actualMinutes?: number;
}

export interface CrmAddWorkOrderNoteRequest { kind: CrmWorkOrderNoteKind; note: string; }

// ─── Customer Onboarding ──────────────────────────────────────────────────────

export const CrmOnboardingStatus = {
  NotStarted: 1, InProgress: 2, Completed: 3, Blocked: 4,
} as const;
export type CrmOnboardingStatus = (typeof CrmOnboardingStatus)[keyof typeof CrmOnboardingStatus];
export const CRM_ONBOARDING_STATUS_LABELS: Record<CrmOnboardingStatus, string> = {
  1: 'Not Started', 2: 'In Progress', 3: 'Completed', 4: 'Blocked',
};
export const CRM_ONBOARDING_STATUS_COLORS: Record<CrmOnboardingStatus, string> = {
  1: 'text-text-secondary bg-bg-elevated border-border-subtle',
  2: 'text-brand bg-brand-soft border-border-glow',
  3: 'text-success bg-success-soft border-[rgba(34,197,94,0.2)]',
  4: 'text-danger bg-danger-soft border-[rgba(244,63,94,0.2)]',
};

export const CrmOnboardingMilestoneKind = {
  Kickoff: 1, EquipmentDelivered: 2, Installation: 3, StaffTraining: 4,
  FirstOrder: 5, GoLive: 6, Custom: 7,
} as const;
export type CrmOnboardingMilestoneKind = (typeof CrmOnboardingMilestoneKind)[keyof typeof CrmOnboardingMilestoneKind];
export const CRM_MILESTONE_KIND_LABELS: Record<CrmOnboardingMilestoneKind, string> = {
  1: 'Kickoff', 2: 'Equipment Delivered', 3: 'Installation', 4: 'Staff Training',
  5: 'First Order', 6: 'Go Live', 7: 'Custom',
};

export interface CrmOnboardingMilestoneDto {
  id: string; onboardingId: string; kind: CrmOnboardingMilestoneKind;
  status: CrmOnboardingStatus; title: string; description: string | null;
  sortOrder: number; dueDate: string | null; completedAt: string | null;
  assignedToUserId: string | null; blockerReason: string | null;
}

export interface CrmCustomerOnboardingDto {
  id: string; dealId: string; contactId: string; accountId: string | null;
  title: string; status: CrmOnboardingStatus;
  startedAt: string; completedAt: string | null; progressPercent: number;
  notes: string | null; blockerReason: string | null; createdAt: string;
  milestones: CrmOnboardingMilestoneDto[];
}

export interface CrmOnboardingFilter {
  status?: CrmOnboardingStatus; contactId?: string; accountId?: string;
  dealId?: string; page?: number; pageSize?: number;
}

export interface CrmCreateMilestoneRequest {
  kind: CrmOnboardingMilestoneKind; title: string; description?: string;
  sortOrder: number; dueDate?: string; assignedToUserId?: string;
}

export interface CrmStartOnboardingRequest {
  dealId: string; contactId: string; accountId?: string;
  title: string; milestones: CrmCreateMilestoneRequest[];
}

export interface CrmUpdateMilestoneRequest {
  status: CrmOnboardingStatus; blockerReason?: string;
  completedAt?: string; assignedToUserId?: string;
}

export interface CrmUpdateOnboardingRequest { title?: string; notes?: string; blockerReason?: string; }

// ─── Ops Dashboard ──────────────────────────────────────────────────────────────
export interface OpsDashboardDto {
  totalReturns: number;
  returnsByStatus: Record<number, number>;
  returnsAwaitingAction: number;
  totalWorkOrders: number;
  workOrdersByStatus: Record<number, number>;
  workOrdersScheduledToday: number;
  workOrdersOverdue: number;
  totalOnboardings: number;
  onboardingsByStatus: Record<number, number>;
  onboardingsBlocked: number;
}

// ─── Dispatch Calendar ──────────────────────────────────────────────────────────
export interface DispatchCalendarDto {
  from: string;
  to: string;
  days: DispatchDayDto[];
}
export interface DispatchDayDto {
  date: string;
  slots: DispatchSlotDto[];
}
export interface DispatchSlotDto {
  workOrderId: string;
  workOrderNumber: string;
  title: string;
  status: number;
  priority: number;
  assignedToUserId?: string;
  assignedToUserName?: string;
  scheduledAt?: string;
  siteLabel?: string;
  siteAddress?: string;
  estimatedMinutes?: number;
  contactId?: string;
  contactName?: string;
}

// ─── Time Periods ────────────────────────────────────────────────────────────────
export const CrmTimePeriodStatus = { Draft: 1, Submitted: 2, Approved: 3, Rejected: 4 } as const;
export type CrmTimePeriodStatus = (typeof CrmTimePeriodStatus)[keyof typeof CrmTimePeriodStatus];
export const CRM_TIME_PERIOD_STATUS_LABELS: Record<CrmTimePeriodStatus, string> = {
  1: 'Draft', 2: 'Submitted', 3: 'Approved', 4: 'Rejected',
};
export interface CrmTimePeriodDto {
  id: string;
  userId: string;
  periodStart: string;
  periodEnd: string;
  totalMinutes: number;
  billableMinutes: number;
  entryCount: number;
  status: CrmTimePeriodStatus;
  notes?: string;
  submittedAt?: string;
  approvedAt?: string;
  rejectionReason?: string;
  createdAt: string;
}
export interface CrmCreateTimePeriodRequest {
  periodStart: string;
  periodEnd: string;
  notes?: string;
}
export interface CrmSubmitTimePeriodRequest { notes?: string; }
export interface CrmReviewTimePeriodRequest { comment?: string; rejectionReason?: string; }
export interface CrmTimePeriodFilter {
  userId?: string; status?: CrmTimePeriodStatus; from?: string; to?: string;
  page?: number; pageSize?: number;
}

// ─── Multi-Level Approval Chains ────────────────────────────────────────────────
export interface CrmApprovalChainDefinitionDto {
  id: string;
  name: string;
  description?: string;
  entityType: number;
  isActive: boolean;
  stepCount: number;
  createdAt: string;
  steps: CrmApprovalChainStepDto[];
}
export interface CrmApprovalChainStepDto {
  id: string;
  stepOrder: number;
  stepName: string;
  approverUserId?: string;
  approverRoleName?: string;
  requiredApprovals: number;
}
export interface CrmCreateApprovalChainRequest {
  name: string;
  description?: string;
  entityType: number;
  steps: CrmCreateApprovalChainStepRequest[];
}
export interface CrmCreateApprovalChainStepRequest {
  stepOrder: number;
  stepName: string;
  approverUserId?: string;
  approverRoleName?: string;
  requiredApprovals: number;
}
export interface CrmSubmitForChainRequest {
  entityType: number;
  entityId: string;
  entityName: string;
  chainDefinitionId: string;
}

// ─── Round-Robin Assignment Rotation ────────────────────────────────────────────
export interface CrmRoundRobinStateDto {
  id: string;
  entityType: string;
  userId: string;
  lastAssignedAt?: string;
  assignmentCount: number;
  isActive: boolean;
}

// ─── Procurement — Enums ─────────────────────────────────────────────────────
export enum PurchaseOrderStatus {
  Draft = 1, PendingApproval = 2, Approved = 3, SentToVendor = 4,
  PartiallyReceived = 5, FullyReceived = 6, Cancelled = 7, Closed = 8,
}
export enum GoodsReceiptStatus { Draft = 1, Confirmed = 2, Voided = 3 }
export enum SupplierInvoiceStatus {
  Draft = 1, Received = 2, Approved = 3, PartiallyPaid = 4, Paid = 5, Overdue = 6, Disputed = 7, Void = 8,
}
export enum GoodsCondition { Good = 1, Damaged = 2, Rejected = 3 }

export const PO_STATUS_LABELS: Record<number, string> = {
  1: 'Draft', 2: 'Pending Approval', 3: 'Approved', 4: 'Sent to Vendor',
  5: 'Partially Received', 6: 'Fully Received', 7: 'Cancelled', 8: 'Closed',
};
export const PO_STATUS_COLORS: Record<number, string> = {
  1: 'text-text-secondary bg-bg-elevated border-border-subtle',
  2: 'text-[#F59E0B] bg-[rgba(245,158,11,0.1)] border-[rgba(245,158,11,0.2)]',
  3: 'text-success bg-success-soft border-[rgba(34,197,94,0.2)]',
  4: 'text-brand bg-brand-soft border-border-glow',
  5: 'text-[#A78BFA] bg-[rgba(167,139,250,0.1)] border-[rgba(167,139,250,0.2)]',
  6: 'text-success bg-success-soft border-[rgba(34,197,94,0.2)]',
  7: 'text-danger bg-danger-soft border-[rgba(244,63,94,0.2)]',
  8: 'text-text-muted bg-bg-card border-border-subtle',
};
export const GR_STATUS_LABELS: Record<number, string> = { 1: 'Draft', 2: 'Confirmed', 3: 'Voided' };
export const GR_STATUS_COLORS: Record<number, string> = {
  1: 'text-text-secondary bg-bg-elevated border-border-subtle',
  2: 'text-success bg-success-soft border-[rgba(34,197,94,0.2)]',
  3: 'text-danger bg-danger-soft border-[rgba(244,63,94,0.2)]',
};
export const SI_STATUS_LABELS: Record<number, string> = {
  1: 'Draft', 2: 'Received', 3: 'Approved', 4: 'Partially Paid',
  5: 'Paid', 6: 'Overdue', 7: 'Disputed', 8: 'Void',
};
export const SI_STATUS_COLORS: Record<number, string> = {
  1: 'text-text-secondary bg-bg-elevated border-border-subtle',
  2: 'text-[#F59E0B] bg-[rgba(245,158,11,0.1)] border-[rgba(245,158,11,0.2)]',
  3: 'text-success bg-success-soft border-[rgba(34,197,94,0.2)]',
  4: 'text-[#A78BFA] bg-[rgba(167,139,250,0.1)] border-[rgba(167,139,250,0.2)]',
  5: 'text-success bg-success-soft border-[rgba(34,197,94,0.2)]',
  6: 'text-danger bg-danger-soft border-[rgba(244,63,94,0.2)]',
  7: 'text-[#F59E0B] bg-[rgba(245,158,11,0.1)] border-[rgba(245,158,11,0.2)]',
  8: 'text-text-muted bg-bg-card border-border-subtle',
};
export const GOODS_CONDITION_LABELS: Record<number, string> = { 1: 'Good', 2: 'Damaged', 3: 'Rejected' };

// ─── Procurement — Vendor ────────────────────────────────────────────────────
export interface VendorDto {
  id: string; name: string; contactPerson?: string; email?: string; phone?: string;
  website?: string; paymentTermsDays?: number; currency?: string; address?: string;
  taxNumber?: string; isActive: boolean; notes?: string; createdAt: string;
}
export interface VendorCreateRequest {
  name: string; contactPerson?: string; email?: string; phone?: string;
  website?: string; paymentTermsDays?: number; currency?: string; address?: string;
  taxNumber?: string; notes?: string;
}
export interface VendorUpdateRequest extends VendorCreateRequest { isActive?: boolean; }
export interface VendorFilter { page?: number; pageSize?: number; search?: string; isActive?: boolean; }

// ─── Procurement — Purchase Orders ──────────────────────────────────────────
export interface PurchaseOrderLineItemDto {
  id: string; purchaseOrderId: string; productId?: string; productName: string;
  sku?: string; quantityOrdered: number; quantityReceived: number; unitCost: number; totalCost: number; notes?: string;
}
export interface PurchaseOrderDto {
  id: string; vendorId: string; vendorName?: string; poNumber: string; status: PurchaseOrderStatus;
  expectedDeliveryDate?: string; shippingAddress?: string; subTotal: number; taxAmount: number;
  totalAmount: number; currency: string; approvedAt?: string; approvedByName?: string;
  sentToVendorAt?: string; cancellationReason?: string; notes?: string;
  lineItems: PurchaseOrderLineItemDto[]; createdAt: string;
}
export interface PurchaseOrderLineItemRequest {
  productId?: string; productName: string; sku?: string; quantityOrdered: number; unitCost: number; notes?: string;
}
export interface PurchaseOrderCreateRequest {
  vendorId: string; expectedDeliveryDate?: string; shippingAddress?: string;
  currency?: string; notes?: string; lineItems: PurchaseOrderLineItemRequest[];
}
export interface PurchaseOrderUpdateRequest {
  expectedDeliveryDate?: string; shippingAddress?: string; notes?: string; lineItems?: PurchaseOrderLineItemRequest[];
}
export interface PoRejectRequest { reason: string; }
export interface PurchaseOrderFilter { page?: number; pageSize?: number; vendorId?: string; status?: PurchaseOrderStatus; search?: string; }

// ─── Procurement — Goods Receipts ────────────────────────────────────────────
export interface GoodsReceiptLineItemDto {
  id: string; goodsReceiptId: string; poLineItemId?: string; quantityReceived: number;
  condition: GoodsCondition; rejectedQty?: number; rejectionReason?: string;
}
export interface GoodsReceiptDto {
  id: string; purchaseOrderId: string; poNumber?: string; vendorName?: string;
  receiptNumber: string; status: GoodsReceiptStatus; receivedAt: string;
  warehouseLocation?: string; notes?: string; lineItems: GoodsReceiptLineItemDto[]; createdAt: string;
}
export interface GoodsReceiptLineItemRequest {
  poLineItemId?: string; quantityReceived: number; condition: GoodsCondition; rejectedQty?: number; rejectionReason?: string;
}
export interface GoodsReceiptCreateRequest {
  purchaseOrderId: string; warehouseLocation?: string; notes?: string; lineItems: GoodsReceiptLineItemRequest[];
}
export interface GoodsReceiptFilter { page?: number; pageSize?: number; purchaseOrderId?: string; status?: GoodsReceiptStatus; }

// ─── Procurement — Supplier Invoices ─────────────────────────────────────────
export interface SupplierInvoiceDto {
  id: string; purchaseOrderId?: string; poNumber?: string; vendorId: string; vendorName?: string;
  invoiceNumber: string; status: SupplierInvoiceStatus; issuedDate: string; dueDate: string;
  subTotal: number; taxAmount: number; totalAmount: number; currency: string;
  paidAt?: string; paymentReference?: string; notes?: string; createdAt: string;
}
export interface SupplierInvoiceCreateRequest {
  vendorId: string; purchaseOrderId?: string; invoiceNumber: string; issuedDate: string; dueDate: string;
  subTotal: number; taxAmount: number; totalAmount: number; currency?: string; notes?: string;
}
export interface SupplierInvoiceUpdateRequest {
  dueDate?: string; notes?: string;
}
export interface SupplierInvoiceRecordPaymentRequest { paymentReference?: string; paidAt?: string; }
export interface SupplierInvoiceDisputeRequest { reason: string; }
export interface SupplierInvoiceFilter { page?: number; pageSize?: number; vendorId?: string; status?: SupplierInvoiceStatus; }

// ─── Tax Rules ────────────────────────────────────────────────────────────────
export const CrmTaxType = { VAT: 1, SalesTax: 2, GST: 3, Custom: 4 } as const;
export type CrmTaxTypeValue = (typeof CrmTaxType)[keyof typeof CrmTaxType];
export const CRM_TAX_TYPE_LABEL: Record<CrmTaxTypeValue, string> = {
  [CrmTaxType.VAT]: 'VAT', [CrmTaxType.SalesTax]: 'Sales Tax', [CrmTaxType.GST]: 'GST', [CrmTaxType.Custom]: 'Custom',
};
export interface CrmTaxRuleDto { id: string; name: string; jurisdiction: string; taxType: CrmTaxTypeValue; rate: number; appliesToAllProducts: boolean; productCategoryJson?: string; isActive: boolean; }
export interface CrmTaxRuleCreateRequest { name: string; jurisdiction: string; taxType: CrmTaxTypeValue; rate: number; appliesToAllProducts?: boolean; productCategoryJson?: string; }
export interface CrmTaxRuleUpdateRequest { name?: string; jurisdiction?: string; taxType?: CrmTaxTypeValue; rate?: number; appliesToAllProducts?: boolean; productCategoryJson?: string; isActive?: boolean; }

// ── Inventory ──────────────────────────────────────────────────────────────────
export interface InventoryItemDto {
  id: string; productId: string; productName?: string; sku?: string;
  quantityOnHand: number; quantityReserved: number; quantityAvailable: number;
  reorderPoint: number; belowReorderPoint: boolean; warehouseLocation?: string;
}
export interface StockCheckItem { productId: string; quantity: number; }
export interface StockCheckLineResult {
  productId: string; productName?: string; quantityRequested: number;
  quantityOnHand: number; quantityReserved: number; quantityAvailable: number; isAvailable: boolean;
}
export interface StockCheckResult { allAvailable: boolean; lines: StockCheckLineResult[]; }
export interface InventoryAdjustRequest { quantity: number; notes?: string; warehouseLocation?: string; }

// ── AI Email Drafting (Quotes/Orders/Invoices send preview) ─────────────────────
export interface CrmEmailIntroDraftDto { introDraft?: string | null; }

// ── Credit Check ───────────────────────────────────────────────────────────────
export interface CreditCheckResult {
  overdueBalance: number;
  overdueInvoiceCount: number;
  creditLimit?: number;
  utilizedCredit: number;
  availableCredit: number;
  riskLevel: 1 | 2 | 3;
}
export const CREDIT_RISK_LABELS: Record<number, string> = { 1: 'Green', 2: 'Amber', 3: 'Red' };

// ── Three-Way Match ──────────────────────────────────────────────────────────────
export interface ThreeWayMatchLineResult {
  poLineItemId: string; productName: string; quantityOrdered: number; quantityReceived: number;
  unitCost: number; expectedLineTotal: number;
}
export interface ThreeWayMatchResult {
  supplierInvoiceId: string; purchaseOrderId?: string;
  invoicedAmount: number; expectedAmount: number; varianceAmount: number; variancePercent: number;
  lines: ThreeWayMatchLineResult[];
  riskLevel: 0 | 1 | 2 | 3;
}
export const THREE_WAY_MATCH_RISK_LABELS: Record<number, string> = {
  0: 'No PO Linked', 1: 'Matched', 2: 'Minor Variance', 3: 'Major Variance',
};

export interface DealHandoverDto {
  id: string; dealId: string; customerExpectations?: string; stakeholderSummary?: string;
  specialCommitments?: string; redFlags?: string; handedOverToUserId?: string;
  handedOverToUserName?: string; previousOwnerUserId?: string; previousOwnerUserName?: string;
  handedOverAt?: string; status: number; writtenByUserName?: string;
}
export interface DealHandoverSubmitRequest {
  customerExpectations?: string; stakeholderSummary?: string; specialCommitments?: string;
  redFlags?: string; handedOverToUserId?: string;
}

// ── Commissions ────────────────────────────────────────────────────────────────
export const CrmCommissionRunStatus = { Draft: 1, Finalized: 2, Paid: 3 } as const;
export type CrmCommissionRunStatus = (typeof CrmCommissionRunStatus)[keyof typeof CrmCommissionRunStatus];

export const CRM_COMMISSION_STATUS_LABELS: Record<number, string> = { 1: 'Pending', 2: 'Approved', 3: 'Paid' };
export const CRM_COMMISSION_STATUS_COLORS: Record<number, string> = {
  1: 'text-warning border-warning/30 bg-warning/10',
  2: 'text-success border-success/30 bg-success/10',
  3: 'text-text-muted border-border-subtle bg-bg-elevated',
};

export interface CrmCommissionEntryDto {
  id: string;
  commissionPlanId?: string;
  dealId?: string;
  orderId?: string;
  repUserId?: string;
  currency: string;
  dealAmount: number;
  commissionAmount: number;
  description?: string;
  runCode?: string;
  paidAt?: string;
  createdAt: string;
}

export interface CrmCommissionPayoutDto {
  id: string;
  userId: string;
  periodCode: string;
  label?: string;
  totalCommissionAmount: number;
  deductions?: number;
  netPayAmount: number;
  currency: string;
  status: CrmCommissionRunStatus;
  paidAt?: string;
  notes?: string;
  createdAt: string;
}

export interface CrmCommissionFilter {
  repUserId?: string;
  periodCode?: string;
  page?: number;
  pageSize?: number;
}

export interface CrmFinalizePayoutRequest { deductions?: number; notes?: string; }


