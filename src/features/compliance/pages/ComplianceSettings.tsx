// ═══════════════════════════════════════════════════════════════
import { confirmDialog } from '@/shared/ui/confirm';
// ComplianceSettings — Full CRUD Management
// View current profile, view rules, switch profiles,
// create custom, edit custom, delete custom.
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react';
import { ShieldCheck, Loader2, AlertCircle, Plus, Pencil, Trash2 } from 'lucide-react';
import {
  useTenantComplianceProfile,
  useComplianceProfiles,
  useComplianceProfile,
  useAssignComplianceProfile,
  useCreateComplianceProfile,
  useUpdateComplianceProfile,
  useDeleteComplianceProfile,
} from '../api/compliance.queries';
import { ComplianceProfileCard } from '../components/ComplianceProfileCard';
import { ComplianceRulesViewer } from '../components/ComplianceRulesViewer';
import { ComplianceProfileSelector } from '../components/ComplianceProfileSelector';
import { ComplianceNoProfile } from '../components/ComplianceNoProfile';
import { ComplianceProfileForm } from '../components/Complianceprofileform';
import type {
  ComplianceProfile,
  ComplianceProfileCreateRequest,
  ComplianceProfileUpdateRequest,
} from '../types/compliance.types';

type View = 'card' | 'rules' | 'selector' | 'create' | 'edit';

export function ComplianceSettings() {
  const [view, setView] = useState<View>('card');

  // ─── Queries ───
  const {
    data: tenantProfile,
    isLoading: isLoadingTenant,
    isError: isTenantError,
    error: tenantError,
  } = useTenantComplianceProfile();
  const { data: allProfiles, isLoading: isLoadingProfiles } = useComplianceProfiles();
  const { data: fullProfile, isLoading: isLoadingFull } = useComplianceProfile(
    view === 'rules' && tenantProfile ? (tenantProfile as any).id : undefined,
  );

  // ─── Mutations ───
  const assignProfile = useAssignComplianceProfile();
  const createProfile = useCreateComplianceProfile();
  const updateProfile = useUpdateComplianceProfile();
  const deleteProfile = useDeleteComplianceProfile();

  const isNoProfile = isTenantError && (tenantError as any)?.status === 404;
  const displayProfile = (fullProfile ?? tenantProfile) as ComplianceProfile | undefined;
  const currentProfile = tenantProfile as ComplianceProfile | undefined;

  // ─── Handlers ───

  const handleAssign = (profileId: string) => {
    assignProfile.mutate(profileId, { onSuccess: () => setView('card') });
  };

  const handleCreate = (data: ComplianceProfileCreateRequest | ComplianceProfileUpdateRequest) => {
    createProfile.mutate(data as ComplianceProfileCreateRequest, {
      onSuccess: () => setView('card'),
    });
  };

  const handleUpdate = (data: ComplianceProfileCreateRequest | ComplianceProfileUpdateRequest) => {
    if (!currentProfile) return;
    updateProfile.mutate(
      { id: currentProfile.id, data: data as ComplianceProfileUpdateRequest },
      { onSuccess: () => setView('card') },
    );
  };

  const handleDelete = async () => {
    if (!currentProfile || currentProfile.isSystem) return;
    if (!(await confirmDialog({ message: `Delete custom profile "${currentProfile.name}"? This will revert to no profile assigned.`, confirmText: 'Delete', danger: true })))
      return;
    deleteProfile.mutate(currentProfile.id, { onSuccess: () => setView('card') });
  };

  return (
    <div className="space-y-5">
      {/* ─── Header with actions ─── */}
      {view === 'card' && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-brand-soft">
              <ShieldCheck className="w-4 h-4 text-brand" strokeWidth={1.6} />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-text-primary tracking-tight">Compliance Profile</h3>
              <p className="text-xs text-text-muted">Industry-specific rules for your chatbot</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Edit button — only for custom (non-system) profiles */}
            {currentProfile && !currentProfile.isSystem && (
              <>
                <button
                  onClick={() => setView('edit')}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-glass-2 border border-border-medium text-text-secondary hover:text-text-primary transition-all"
                >
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteProfile.isPending}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-danger-soft border border-[rgba(244,63,94,0.15)] text-danger hover:bg-[rgba(244,63,94,0.15)] disabled:opacity-40 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </>
            )}
            <button
              onClick={() => setView('create')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-br from-brand to-brand-dark text-white hover:brightness-110 transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Custom Profile
            </button>
          </div>
        </div>
      )}

      {/* ─── Loading ─── */}
      {isLoadingTenant && view === 'card' && (
        <div className="rounded-2xl bg-glass-1 border border-border-subtle px-6 py-8 flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 text-text-muted animate-spin" />
          <span className="text-sm text-text-muted">Loading compliance profile...</span>
        </div>
      )}

      {/* ─── Error (non-404) ─── */}
      {isTenantError && !isNoProfile && view === 'card' && (
        <div className="rounded-2xl bg-danger-soft border border-[rgba(244,63,94,0.15)] px-5 py-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-danger" />
          <span className="text-sm text-danger">Failed to load compliance profile.</span>
        </div>
      )}

      {/* ─── No profile ─── */}
      {isNoProfile && view === 'card' && <ComplianceNoProfile onSelectProfile={() => setView('selector')} />}

      {/* ─── Current profile card ─── */}
      {currentProfile && view === 'card' && (
        <ComplianceProfileCard
          profile={currentProfile}
          onViewRules={() => setView('rules')}
          onChangeProfile={() => setView('selector')}
        />
      )}

      {/* ─── Rules viewer ─── */}
      {view === 'rules' && displayProfile && (
        <div className="rounded-2xl bg-glass-1 border border-border-subtle p-5">
          {isLoadingFull ? (
            <div className="flex items-center justify-center gap-2 py-8">
              <Loader2 className="w-4 h-4 text-text-muted animate-spin" />
              <span className="text-sm text-text-muted">Loading rules...</span>
            </div>
          ) : (
            <ComplianceRulesViewer profile={displayProfile} onClose={() => setView('card')} />
          )}
        </div>
      )}

      {/* ─── Profile selector modal ─── */}
      {view === 'selector' && allProfiles && (
        <ComplianceProfileSelector
          profiles={allProfiles as any}
          currentProfileId={currentProfile?.id}
          isAssigning={assignProfile.isPending}
          onSelect={handleAssign}
          onClose={() => setView('card')}
        />
      )}
      {view === 'selector' && isLoadingProfiles && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative flex items-center gap-2">
            <Loader2 className="w-5 h-5 text-text-primary animate-spin" />
            <span className="text-sm text-text-primary">Loading profiles...</span>
          </div>
        </div>
      )}

      {/* ─── Create form ─── */}
      {view === 'create' && (
        <div>
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-success-soft">
              <Plus className="w-4 h-4 text-success" strokeWidth={1.6} />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-text-primary tracking-tight">Create Custom Profile</h3>
              <p className="text-xs text-text-muted">Define your own compliance rules from scratch</p>
            </div>
          </div>
          <ComplianceProfileForm
            isSubmitting={createProfile.isPending}
            onSubmit={handleCreate}
            onCancel={() => setView('card')}
          />
        </div>
      )}

      {/* ─── Edit form ─── */}
      {view === 'edit' && currentProfile && !currentProfile.isSystem && (
        <div>
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-brand-soft">
              <Pencil className="w-4 h-4 text-brand" strokeWidth={1.6} />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-text-primary tracking-tight">
                Edit: {currentProfile.name}
              </h3>
              <p className="text-xs text-text-muted">Modify your custom compliance rules</p>
            </div>
          </div>
          <ComplianceProfileForm
            existingProfile={currentProfile}
            isSubmitting={updateProfile.isPending}
            onSubmit={handleUpdate}
            onCancel={() => setView('card')}
          />
        </div>
      )}
    </div>
  );
}

export { ComplianceSettings as Component };
