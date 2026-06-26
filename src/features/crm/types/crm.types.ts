// Lead stages matching backend LeadStage enum
export const LeadStage = {
  New: 1, Warm: 2, Hot: 3, Nurturing: 4, Converted: 5, Lost: 6,
} as const;
export type LeadStage = (typeof LeadStage)[keyof typeof LeadStage];

export const LEAD_STAGE_LABELS: Record<LeadStage, string> = {
  1: 'New', 2: 'Warm', 3: 'Hot', 4: 'Nurturing', 5: 'Converted', 6: 'Lost',
};

export const LEAD_STAGE_COLORS: Record<LeadStage, string> = {
  1: 'text-text-secondary bg-bg-elevated border-border-subtle',
  2: 'text-[#F59E0B] bg-[rgba(245,158,11,0.1)] border-[rgba(245,158,11,0.2)]',
  3: 'text-danger bg-danger-soft border-[rgba(244,63,94,0.2)]',
  4: 'text-brand bg-brand-soft border-border-glow',
  5: 'text-success bg-success-soft border-[rgba(34,197,94,0.2)]',
  6: 'text-text-muted bg-bg-card border-border-subtle',
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

/** Generic bulk-operation outcome shared by contact/deal bulk-delete endpoints. */
export interface CrmBulkResult {
  requested: number;
  succeeded: number;
  skipped: number;
  errors: string[];
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
  createdAt: string;
  reviewedAt: string | null;
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
  Champion: 1, EconomicBuyer: 2, User: 3, Blocker: 4, Influencer: 5,
} as const;
export type CrmAccountContactRole = (typeof CrmAccountContactRole)[keyof typeof CrmAccountContactRole];
export const CRM_ACCOUNT_CONTACT_ROLE_LABELS: Record<CrmAccountContactRole, string> = {
  1: 'Champion', 2: 'Economic Buyer', 3: 'User', 4: 'Blocker', 5: 'Influencer',
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
  documentUrl?: string; notes?: string; createdAt: string;
}
export interface CrmContractCreateRequest {
  title: string; accountId?: string; contactId?: string; dealId?: string; subscriptionId?: string;
  value?: number; currency?: string; startDate?: string; endDate?: string;
  renewalTermMonths?: number; autoRenew?: boolean; documentUrl?: string; notes?: string;
}

// ── Public pay (payment links) ────────────────────────────────────────────────
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
  currency: string;
  renewalDate: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface CrmAccountDetailDto extends CrmAccountSummaryDto {
  notes: string | null;
  tagsJson: string | null;
}

export interface CrmAccountCreateRequest {
  name: string;
  organizationId?: string;
  status?: CrmAccountStatus;
  tier?: CrmAccountTier;
  ownedByUserId?: string;
  renewalDate?: string;
  contractValue?: number;
  currency?: string;
  notes?: string;
  tagsJson?: string;
}

export interface CrmAccountUpdateRequest {
  name?: string;
  organizationId?: string;
  status?: CrmAccountStatus;
  tier?: CrmAccountTier;
  ownedByUserId?: string;
  renewalDate?: string;
  contractValue?: number;
  currency?: string;
  notes?: string;
  tagsJson?: string;
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
export interface CloseDealRequest { isWon: boolean; lostReason?: string; }
export interface CreateManualLeadRequest {
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  stage?: LeadStage;
  tags?: string;
  assignedToUserId?: string;
  adSource?: string;
  notes?: string;
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
}
export interface ConvertLeadResponse { contactId: string; dealId: string; }

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
export interface CrmSlaPolicySummaryDto { id: string; name: string; firstResponseMinutes: number; resolutionMinutes: number; }
export interface CrmSlaPolicyCreateRequest { name: string; initialResponseSlaHours: number; resolutionSlaHours: number; isDefault?: boolean; }

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
  currency?: string; validityDays?: number; notes?: string; priceBookId?: string;
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
export interface CrmDunningEventDto { id: string; eventType: string; occurredAt: string; }
export interface CrmInvoiceSummaryDto {
  id: string; invoiceNumber: string; dealId: string | null; dealName: string | null;
  accountId: string | null; accountName: string | null;
  totalAmount: number; currency: string; status: CrmInvoiceStatus;
  dueDate: string | null; paidAt: string | null; createdAt: string;
}
export interface CrmInvoiceDetailDto extends CrmInvoiceSummaryDto { lineItems: CrmQuoteLineItemDto[]; dunningHistory: CrmDunningEventDto[]; }
export interface CrmRecordPaymentRequest { amount: number; paymentMethod?: CrmPaymentMethod; paidAt?: string; notes?: string; }
export interface CrmInvoiceFilter { search?: string; status?: CrmInvoiceStatus; page?: number; pageSize?: number; }

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
  Pending: 1, Confirmed: 2, Processing: 3, Shipped: 4, Delivered: 5, Cancelled: 6,
} as const;
export type CrmOrderStatus = (typeof CrmOrderStatus)[keyof typeof CrmOrderStatus];
export const CRM_ORDER_STATUS_LABELS: Record<CrmOrderStatus, string> = {
  1: 'Pending', 2: 'Confirmed', 3: 'Processing', 4: 'Shipped', 5: 'Delivered', 6: 'Cancelled',
};
export const CRM_ORDER_STATUS_COLORS: Record<CrmOrderStatus, string> = {
  1: 'text-text-secondary bg-bg-elevated border-border-subtle',
  2: 'text-brand bg-brand-soft border-border-glow',
  3: 'text-[#F59E0B] bg-[rgba(245,158,11,0.1)] border-[rgba(245,158,11,0.2)]',
  4: 'text-[#A78BFA] bg-[rgba(167,139,250,0.1)] border-[rgba(167,139,250,0.2)]',
  5: 'text-success bg-success-soft border-[rgba(34,197,94,0.2)]',
  6: 'text-text-muted bg-bg-card border-border-subtle',
};
export const CrmOrderFulfillmentStatus = {
  Unfulfilled: 1, PartiallyFulfilled: 2, Fulfilled: 3, Returned: 4, Void: 5,
} as const;
export type CrmOrderFulfillmentStatus = (typeof CrmOrderFulfillmentStatus)[keyof typeof CrmOrderFulfillmentStatus];
export const CRM_ORDER_FULFILLMENT_LABELS: Record<CrmOrderFulfillmentStatus, string> = {
  1: 'Unfulfilled', 2: 'Partially Fulfilled', 3: 'Fulfilled', 4: 'Returned', 5: 'Void',
};
export interface CrmOrderLineItemDto { id: string; productName: string; quantity: number; unitPrice: number; totalPrice: number; }
export interface CrmOrderLineItemRequest { productName: string; quantity: number; unitPrice: number; }
export interface CrmOrderSummaryDto {
  id: string; orderNumber: string; contactId: string; contactName: string | null;
  totalAmount: number; currency: string; status: CrmOrderStatus;
  fulfillmentStatus: CrmOrderFulfillmentStatus; orderedAt: string; createdAt: string;
}
export interface CrmOrderDetailDto extends CrmOrderSummaryDto { lineItems: CrmOrderLineItemDto[]; notes: string | null; }
export interface CrmOrderCreateRequest { contactId: string; lineItems: CrmOrderLineItemRequest[]; currency?: string; notes?: string; }
export interface CrmOrderFilter { search?: string; status?: CrmOrderStatus; page?: number; pageSize?: number; }

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
export interface CrmCallSummaryRequestDto { signalId: string; contactId?: string; dealId?: string; }
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

// ─── Announcements ────────────────────────────────────────────────────────────

export const AnnouncementType = { General: 1, Maintenance: 2, Feature: 3, Alert: 4 } as const;
export type AnnouncementType = (typeof AnnouncementType)[keyof typeof AnnouncementType];

export const AnnouncementStatus = { Draft: 1, Scheduled: 2, Published: 3, Archived: 4 } as const;
export type AnnouncementStatus = (typeof AnnouncementStatus)[keyof typeof AnnouncementStatus];

export const ANNOUNCEMENT_TYPE_LABELS: Record<AnnouncementType, string> = {
  1: 'General', 2: 'Maintenance', 3: 'Feature', 4: 'Alert',
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

export interface CrmActivityFeedFilter {
  from?: string;
  to?: string;
  eventKinds?: number[];
  entityKind?: number;
  actorUserId?: string;
  page?: number;
  pageSize?: number;
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
