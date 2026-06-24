// ═══════════════════════════════════════════════════════════════
// Compliance Feature — Type Definitions (matches Swagger spec)
// ═══════════════════════════════════════════════════════════════

// ─── Sub-types ───

export interface DisclaimerRule {
  trigger: string | null;
  text: string | null;
}

export interface MandatoryReferenceRule {
  trigger: string | null;
  message: string | null;
  handoff: boolean;
}

export interface DataHandlingRules {
  prohibited: string[] | null;
  allowedWithConsent: string[] | null;
  freelyCollected: string[] | null;
}

// ─── Summary DTO (GET /profiles list) ───

export interface ComplianceProfileSummary {
  id: string;
  name: string | null;
  description: string | null;
  industry: string | null;
  businessType: number | null;
  requiresAgeVerification: boolean;
  isSystem: boolean;
  ruleCount: number;
}

// ─── Full DTO (GET /profiles/{id}, tenant/current, etc.) ───

export interface ComplianceProfile {
  id: string;
  createdAt: string;
  updatedAt: string | null;
  name: string | null;
  description: string | null;
  industry: string | null;
  businessType: number | null;
  prohibitedTopics: string[] | null;
  requiredDisclaimers: DisclaimerRule[] | null;
  restrictedPhrases: string[] | null;
  mandatoryReferences: MandatoryReferenceRule[] | null;
  dataHandling: DataHandlingRules | null;
  requiresAgeVerification: boolean;
  minimumAge: number | null;
  maxResponseLength: number | null;
  isSystem: boolean;
  isActive: boolean;
  sortOrder: number;
}

// ─── Create Request (POST /profiles) ───

export interface ComplianceProfileCreateRequest {
  name: string;
  description?: string | null;
  industry: string;
  businessType?: number | null;
  prohibitedTopics?: string[] | null;
  requiredDisclaimers?: DisclaimerRule[] | null;
  restrictedPhrases?: string[] | null;
  mandatoryReferences?: MandatoryReferenceRule[] | null;
  dataHandling?: DataHandlingRules | null;
  requiresAgeVerification?: boolean;
  minimumAge?: number | null;
  maxResponseLength?: number | null;
}

// ─── Update Request (PUT /profiles/{id}) ───

export interface ComplianceProfileUpdateRequest {
  name?: string | null;
  description?: string | null;
  prohibitedTopics?: string[] | null;
  requiredDisclaimers?: DisclaimerRule[] | null;
  restrictedPhrases?: string[] | null;
  mandatoryReferences?: MandatoryReferenceRule[] | null;
  dataHandling?: DataHandlingRules | null;
  requiresAgeVerification?: boolean | null;
  minimumAge?: number | null;
  maxResponseLength?: number | null;
  isActive?: boolean | null;
}

// ─── Assign Request (POST /tenant/assign) ───

export interface AssignComplianceProfileRequest {
  profileId: string;
}

// ─── Label Maps ───

export const COMPLIANCE_INDUSTRY_LABEL: Record<string, string> = {
  Healthcare: 'Healthcare',
  Finance: 'Financial Services',
  Food: 'Food & Beverage',
  'E-Commerce': 'E-Commerce & Retail',
  Education: 'Education',
  General: 'General',
} as const;

// ─── Data Handling Category Config ───

export const DATA_HANDLING_CATEGORIES = {
  prohibited: { label: 'Never collect', color: 'danger' as const, icon: 'ShieldOff' as const },
  allowedWithConsent: { label: 'With consent only', color: 'warning' as const, icon: 'ShieldAlert' as const },
  freelyCollected: { label: 'Freely collected', color: 'success' as const, icon: 'ShieldCheck' as const },
} as const;

// ─── Rule Section Config (for collapsible viewer) ───

export interface RuleSectionConfig {
  key: string;
  label: string;
  icon: string;
  countFn: (profile: ComplianceProfile) => number;
}

export const RULE_SECTIONS: RuleSectionConfig[] = [
  {
    key: 'prohibitedTopics',
    label: 'Prohibited Topics',
    icon: 'Ban',
    countFn: (p) => p.prohibitedTopics?.length ?? 0,
  },
  {
    key: 'requiredDisclaimers',
    label: 'Required Disclaimers',
    icon: 'FileWarning',
    countFn: (p) => p.requiredDisclaimers?.length ?? 0,
  },
  {
    key: 'restrictedPhrases',
    label: 'Restricted Phrases',
    icon: 'MessageSquareOff',
    countFn: (p) => p.restrictedPhrases?.length ?? 0,
  },
  {
    key: 'mandatoryReferences',
    label: 'Mandatory References',
    icon: 'ArrowRightLeft',
    countFn: (p) => p.mandatoryReferences?.length ?? 0,
  },
  {
    key: 'dataHandling',
    label: 'Data Handling Rules',
    icon: 'Database',
    countFn: (p) => {
      if (!p.dataHandling) return 0;
      return (
        (p.dataHandling.prohibited?.length ?? 0) +
        (p.dataHandling.allowedWithConsent?.length ?? 0) +
        (p.dataHandling.freelyCollected?.length ?? 0)
      );
    },
  },
];
