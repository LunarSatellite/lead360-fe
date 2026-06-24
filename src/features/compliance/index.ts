// ═══════════════════════════════════════════════════════════════
// Compliance Feature — Public API (Barrel Export)
// ═══════════════════════════════════════════════════════════════

export { ComplianceSettings } from './pages/ComplianceSettings';
export { ComplianceIndustryHint } from './components/ComplianceIndustryHint';
export { ComplianceProfileForm } from './components/Complianceprofileform';

export type {
  ComplianceProfile,
  ComplianceProfileSummary,
  ComplianceProfileCreateRequest,
  ComplianceProfileUpdateRequest,
  DisclaimerRule,
  MandatoryReferenceRule,
  DataHandlingRules,
} from './types/compliance.types';

export {
  complianceKeys,
  useRecommendedProfile,
  useComplianceProfiles,
  useCreateComplianceProfile,
  useUpdateComplianceProfile,
  useDeleteComplianceProfile,
} from './api/compliance.queries';
