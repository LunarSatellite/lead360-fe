// ═══════════════════════════════════════════════════════════════
// ComplianceProfileCard — Current Profile Display
// Shows the tenant's active compliance profile with rule count,
// system badge, and actions to view rules or change profile.
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  ChevronRight,
  AlertTriangle,
  ClipboardList,
  RefreshCw,
} from 'lucide-react';
import type { ComplianceProfile } from '../types/compliance.types';

interface ComplianceProfileCardProps {
  profile: ComplianceProfile;
  onViewRules: () => void;
  onChangeProfile: () => void;
}

export function ComplianceProfileCard({
  profile,
  onViewRules,
  onChangeProfile,
}: ComplianceProfileCardProps) {
  const totalRules =
    profile.prohibitedTopics.length +
    profile.requiredDisclaimers.length +
    profile.restrictedPhrases.length +
    profile.mandatoryReferences.length +
    (profile.dataHandling
      ? profile.dataHandling.prohibited.length +
        profile.dataHandling.allowedWithConsent.length +
        profile.dataHandling.freelyCollected.length
      : 0);

  return (
    <div className="rounded-card bg-glass-1 border border-border-subtle overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-sm flex items-center justify-center bg-success-soft">
            <ShieldCheck size={16} strokeWidth={1.6} className="text-success" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-extrabold text-text-primary tracking-tight">
                {profile.name}
              </span>
              {profile.isSystem && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs bg-glass-2 border border-border-subtle">
                  <Lock size={9} strokeWidth={1.6} className="text-text-muted" />
                  <span className="text-[8px] font-bold uppercase tracking-widest text-text-muted">
                    System
                  </span>
                </span>
              )}
              {profile.requiresAgeVerification && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs bg-warning-soft border border-warning/10">
                  <AlertTriangle size={9} strokeWidth={1.6} className="text-warning" />
                  <span className="text-[8px] font-bold uppercase tracking-widest text-warning">
                    Age Verify
                  </span>
                </span>
              )}
            </div>
            <p className="text-[9px] font-medium text-text-muted mt-0.5">
              Auto-selected based on your industry
            </p>
          </div>
        </div>

        <button
          onClick={onChangeProfile}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-glass-2 border border-border-subtle
                     text-[9px] font-bold uppercase tracking-wider text-text-secondary
                     hover:bg-glass-3 hover:border-border-medium hover:text-text-primary
                     transition-all duration-150"
        >
          <RefreshCw size={10} strokeWidth={1.6} />
          Change
        </button>
      </div>

      {/* Body */}
      <div className="px-4 py-3">
        {profile.description && (
          <p className="text-[11px] font-medium text-text-secondary leading-relaxed mb-3">
            {profile.description}
          </p>
        )}

        <div className="flex items-center gap-4">
          {/* Rule count */}
          <div className="flex items-center gap-2">
            <ClipboardList size={12} strokeWidth={1.6} className="text-text-muted" />
            <span className="text-[11px] font-bold text-text-primary">
              {totalRules} rules active
            </span>
          </div>

          {/* Max response length */}
          {profile.maxResponseLength && (
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-semibold text-text-muted uppercase tracking-wider">
                Max response:
              </span>
              <span className="text-[10px] font-bold text-text-secondary">
                {profile.maxResponseLength} chars
              </span>
            </div>
          )}
        </div>

        {/* View Rules button */}
        <button
          onClick={onViewRules}
          className="mt-3 flex items-center gap-1.5 text-[10px] font-bold text-brand
                     hover:text-brand transition-colors duration-150"
        >
          View Rules
          <ChevronRight size={12} strokeWidth={1.6} />
        </button>
      </div>
    </div>
  );
}
