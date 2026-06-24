// ═══════════════════════════════════════════════════════════════
// ComplianceProfileSelector — Dark Theme
// Shows all available profiles with radio selection,
// description preview, and apply action.
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react';
import { Lock, AlertTriangle, X, Loader2 } from 'lucide-react';
import type { ComplianceProfileSummary } from '../types/compliance.types';

interface ComplianceProfileSelectorProps {
  profiles: ComplianceProfileSummary[];
  currentProfileId: string | undefined;
  isAssigning: boolean;
  onSelect: (profileId: string) => void;
  onClose: () => void;
}

export function ComplianceProfileSelector({
  profiles,
  currentProfileId,
  isAssigning,
  onSelect,
  onClose,
}: ComplianceProfileSelectorProps) {
  const [selectedId, setSelectedId] = useState<string | null>(currentProfileId ?? null);

  const selectedProfile = profiles.find((p) => p.id === selectedId);
  const isChanged = selectedId !== currentProfileId;

  return (
    /* Backdrop */
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div
        className="relative w-full max-w-md mx-4 rounded-frame bg-bg-shell border border-border-subtle
                    overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,0.5)]
                    animate-[fadeIn_0.2s_ease]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
          <div>
            <h2 className="text-sm font-bold text-text-primary tracking-tight">Select Compliance Profile</h2>
            <p className="text-[10px] text-text-muted mt-0.5">Choose the compliance rules for your chatbot</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-sm flex items-center justify-center
                       bg-bg-elevated border border-border-subtle
                       hover:bg-glass-2 hover:border-border-medium
                       transition-all duration-150"
          >
            <X size={13} strokeWidth={1.8} className="text-text-muted" />
          </button>
        </div>

        {/* Profile list */}
        <div className="px-3.5 py-3 flex flex-col gap-1.5 max-h-[360px] overflow-y-auto">
          {profiles.map((profile) => {
            const isActive = profile.id === selectedId;
            const isCurrent = profile.id === currentProfileId;

            return (
              <button
                key={profile.id}
                onClick={() => setSelectedId(profile.id)}
                className={`
                  w-full flex items-center gap-3 px-3.5 py-3 rounded-card border text-left
                  transition-all duration-150
                  ${
                    isActive
                      ? 'bg-[rgba(0,217,126,0.03)] border-[rgba(0,217,126,0.1)]'
                      : 'bg-bg-card border-border-subtle hover:border-glass-3 hover:bg-bg-elevated'
                  }
                `}
              >
                {/* Radio indicator */}
                <div
                  className={`
                    w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center
                    transition-all duration-150
                    ${isActive ? 'border-brand bg-brand' : 'border-glass-3 bg-transparent'}
                  `}
                >
                  {isActive && <div className="w-1.5 h-1.5 rounded-full bg-bg" />}
                </div>

                {/* Profile info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-semibold ${
                        isActive ? 'text-text-primary' : 'text-text-secondary'
                      }`}
                    >
                      {profile.name}
                    </span>
                    {isCurrent && (
                      <span
                        className="text-[7px] font-bold uppercase tracking-widest
                                   text-brand bg-brand-soft
                                   px-1.5 py-0.5 rounded-xs"
                      >
                        Current
                      </span>
                    )}
                  </div>
                  {profile.description && (
                    <p className="text-[10px] text-text-muted mt-0.5 truncate">{profile.description}</p>
                  )}
                </div>

                {/* Badges */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[9px] font-semibold text-text-muted">{profile.ruleCount} rules</span>
                  {profile.isSystem && <Lock size={10} strokeWidth={1.6} className="text-text-muted" />}
                  {profile.requiresAgeVerification && (
                    <AlertTriangle size={10} strokeWidth={1.6} className="text-warning" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected preview */}
        {selectedProfile?.description && isChanged && (
          <div className="mx-4 mb-3 px-3.5 py-2.5 rounded-sm bg-bg-elevated border border-border-subtle">
            <p className="text-[10px] text-text-secondary leading-relaxed">{selectedProfile.description}</p>
          </div>
        )}

        {/* Legend + Actions */}
        <div className="px-5 py-3.5 border-t border-border-subtle">
          <div className="flex items-center gap-4 mb-3">
            <div className="flex items-center gap-1.5">
              <Lock size={9} strokeWidth={1.6} className="text-text-muted" />
              <span className="text-[8px] font-medium text-text-muted">System profile (read-only)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <AlertTriangle size={9} strokeWidth={1.6} className="text-warning" />
              <span className="text-[8px] font-medium text-text-muted">Requires age verification</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-[10px] bg-bg-elevated border border-border-subtle
                         text-2xs font-semibold text-text-secondary
                         hover:bg-glass-2 hover:border-border-medium
                         transition-all duration-150"
            >
              Cancel
            </button>
            <button
              onClick={() => selectedId && onSelect(selectedId)}
              disabled={!selectedId || !isChanged || isAssigning}
              className="px-4 py-2 rounded-[10px] text-2xs font-semibold text-bg
                         bg-brand hover:bg-brand-light
                         disabled:opacity-40 disabled:cursor-not-allowed
                         transition-all duration-150
                         flex items-center gap-1.5"
            >
              {isAssigning && <Loader2 size={12} strokeWidth={2} className="animate-spin" />}
              Apply Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
