// ═══════════════════════════════════════════════════════════════
// ComplianceIndustryHint — Registration Form Info Card
// Shows a non-interactive preview of the recommended compliance
// profile based on the selected industry during registration.
// ═══════════════════════════════════════════════════════════════

import { Info, ShieldCheck, Loader2, AlertCircle } from 'lucide-react';
import { useRecommendedProfile } from '../api/compliance.queries';

interface ComplianceIndustryHintProps {
  industry: string | undefined;
}

export function ComplianceIndustryHint({ industry }: ComplianceIndustryHintProps) {
  const { data: profile, isLoading, isError } = useRecommendedProfile(industry);

  // Don't render anything if no industry selected
  if (!industry) return null;

  // Loading state
  if (isLoading) {
    return (
      <div className="mt-2 flex items-center gap-2 px-3 py-2.5 rounded-sm bg-glass-1 border border-border-subtle">
        <Loader2 size={12} strokeWidth={1.6} className="text-text-muted animate-spin" />
        <span className="text-[9px] font-medium text-text-muted">
          Loading compliance profile...
        </span>
      </div>
    );
  }

  // Error or no profile found — silent fallback
  if (isError || !profile) {
    return null;
  }

  const totalRules =
    (profile as any).prohibitedTopics?.length +
    (profile as any).requiredDisclaimers?.length +
    (profile as any).restrictedPhrases?.length +
    (profile as any).mandatoryReferences?.length;

  return (
    <div className="mt-2 px-3 py-2.5 rounded-sm bg-info-soft border border-info/10">
      <div className="flex items-start gap-2">
        <Info size={12} strokeWidth={1.6} className="text-info shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={11} strokeWidth={1.6} className="text-success" />
            <span className="text-[10px] font-bold text-text-primary">
              Compliance Profile: {(profile as any).name}
            </span>
          </div>

          <p className="text-[9px] font-medium text-text-secondary mt-1 leading-relaxed">
            Your chatbot will follow {(profile as any).industry?.toLowerCase()} compliance rules
            {totalRules > 0 && (
              <> including {totalRules} rules covering</>
            )}{' '}
            prohibited topics, required disclaimers, and restricted phrases.
          </p>

          <p className="text-[8px] font-semibold text-text-muted mt-1.5 uppercase tracking-wider">
            You can customize this later in Settings
          </p>
        </div>
      </div>
    </div>
  );
}
