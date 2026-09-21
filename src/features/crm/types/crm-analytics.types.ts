// DTOs for the CRM analytics reports added per the analytics roadmap.
// Wire format is camelCase (confirmed against the live API).

// ─── AI Effectiveness ──────────────────────────────────────────────────────────
export interface AiActionTierBreakdown {
  tier: number;
  count: number;
  percentage: number;
}
export interface AiActionStatusBreakdown {
  status: number;
  count: number;
}
export interface AiActionKindStat {
  kind: number;
  total: number;
  executed: number;
  undone: number;
  approved: number;
  rejected: number;
  escalated: number;
  pendingApproval: number;
  rejectionRate: number;
  undoRate: number;
}
export interface AiActionWeeklyPoint {
  weekStart: string;
  weekLabel: string;
  count: number;
}
export interface AiTokenOperationBreakdown {
  operationType: string;
  calls: number;
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
}
export interface AiEffectivenessAnalyticsDto {
  totalActions: number;
  approvalDecisions: number;
  approvedCount: number;
  rejectedCount: number;
  approvalRate: number;
  rejectionRate: number;
  executedCount: number;
  undoneCount: number;
  undoRate: number;
  escalatedCount: number;
  pendingApprovalCount: number;
  byTier: AiActionTierBreakdown[];
  byStatus: AiActionStatusBreakdown[];
  actionsLast7d: number;
  actionsLast30d: number;
  weeklyTrend: AiActionWeeklyPoint[];
  byKind: AiActionKindStat[];
  totalTokensAllTime: number;
  totalTokensThisMonth: number;
  totalLlmCalls: number;
  llmSuccessRate: number;
  avgLatencyMs: number;
  tokensByOperation: AiTokenOperationBreakdown[];
}

// ─── NPS ────────────────────────────────────────────────────────────────────────
export interface NpsMonthlyPoint {
  year: number;
  month: number;
  monthLabel: string;
  responded: number;
  promoters: number;
  passives: number;
  detractors: number;
  npsScore: number;
}
export interface NpsAnalyticsDto {
  totalSent: number;
  totalResponded: number;
  responseRate: number;
  promoters: number;
  passives: number;
  detractors: number;
  promoterPct: number;
  passivePct: number;
  detractorPct: number;
  npsScore: number;
  monthlyTrend: NpsMonthlyPoint[];
}

// ─── Churn risk portfolio ────────────────────────────────────────────────────────
export interface ChurnWindowStats {
  contactsScored: number;
  coverage: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
  highRiskPct: number;
  mediumRiskPct: number;
  lowRiskPct: number;
  avgChurnProbabilityPct: number;
  lastComputedAt: string | null;
}
export interface ChurnRiskContact {
  contactId: string;
  fullName: string;
  email: string | null;
  churnProbabilityPct: number;
  computedAt: string;
}
export interface ChurnRiskAnalyticsDto {
  totalContacts: number;
  churn30: ChurnWindowStats;
  churn60: ChurnWindowStats;
  topAtRisk: ChurnRiskContact[];
}

// ─── Lead score distribution + trend ─────────────────────────────────────────────
export interface LeadScoreBucket {
  label: string;
  min: number;
  max: number;
  count: number;
}
export interface LeadScoreMonthlyPoint {
  year: number;
  month: number;
  monthLabel: string;
  scoreChanges: number;
  avgScore: number;
  avgChange: number;
  increases: number;
  decreases: number;
}
export interface LeadScoreAnalyticsDto {
  totalLeads: number;
  currentAvgScore: number;
  distribution: LeadScoreBucket[];
  totalScoreChanges: number;
  monthlyTrend: LeadScoreMonthlyPoint[];
}

// ─── Team / agent performance ────────────────────────────────────────────────────
export interface TeamMemberPerformance {
  userId: string;
  fullName: string;
  email: string | null;
  openDeals: number;
  wonDeals: number;
  lostDeals: number;
  wonValue: number;
  winRate: number;
  assignedLeads: number;
  convertedLeads: number;
  leadConversionRate: number;
  assignedCases: number;
  resolvedCases: number;
  timeEntries: number;
  hoursLogged: number;
  billableHoursLogged: number;
}
export interface TeamPerformanceAnalyticsDto {
  teamMembers: number;
  members: TeamMemberPerformance[];
  unassignedDeals: number;
  unassignedLeads: number;
  unassignedCases: number;
}

// ─── Recurring revenue & renewals ────────────────────────────────────────────────
export interface SubscriptionTierBreakdown {
  planTier: number;
  activeCount: number;
  mrr: number;
}
export interface RecurringRevenueAnalyticsDto {
  activeSubscriptions: number;
  pausedSubscriptions: number;
  cancelledSubscriptions: number;
  mrr: number;
  arr: number;
  avgRevenuePerAccount: number;
  byPlanTier: SubscriptionTierBreakdown[];
  upcomingRenewals: number;
  renewedCount: number;
  churnedCount: number;
  renewalRate: number;
  contractValueAtRisk: number;
  paidInvoices: number;
  overdueInvoices: number;
  totalOutstanding: number;
  overdueAmount: number;
  collectedAllTime: number;
}
