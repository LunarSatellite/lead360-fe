// ═══════════════════════════════════════════════════════════════
// ComplianceNoProfile — Empty State
// Shown when tenant has no compliance profile assigned.
// Prompts user to select one.
// ═══════════════════════════════════════════════════════════════

import { ShieldAlert, ArrowRight } from 'lucide-react';

interface ComplianceNoProfileProps {
  onSelectProfile: () => void;
}

export function ComplianceNoProfile({ onSelectProfile }: ComplianceNoProfileProps) {
  return (
    <div className="rounded-card bg-glass-1 border border-border-subtle px-6 py-8 flex flex-col items-center text-center">
      <div className="w-12 h-12 rounded-card flex items-center justify-center bg-warning-soft border border-warning/10 mb-4">
        <ShieldAlert size={22} strokeWidth={1.6} className="text-warning" />
      </div>

      <h3 className="text-[13px] font-extrabold text-text-primary tracking-tight">
        No Compliance Profile Selected
      </h3>

      <p className="text-[10px] font-medium text-text-secondary mt-1.5 max-w-xs leading-relaxed">
        Your chatbot doesn't have industry-specific compliance rules configured.
        Select a profile to enable prohibited topics, disclaimers, and data handling rules.
      </p>

      <button
        onClick={onSelectProfile}
        className="mt-4 flex items-center gap-2 px-4 py-2 rounded-sm text-[10px] font-bold text-text-primary
                   bg-gradient-to-r from-brand to-brand/80
                   hover:from-brand/90 hover:to-brand/70
                   transition-all duration-150"
      >
        Select a Profile
        <ArrowRight size={12} strokeWidth={1.6} />
      </button>
    </div>
  );
}
