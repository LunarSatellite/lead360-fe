import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { crmApi } from '../api/crm.api';
import { useTeamMembers } from '@/features/team/api/team.queries';
import type { UserDto } from '@/features/auth/types/auth.types';

export function Component() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [entityType, setEntityType] = useState(1);
  const [steps, setSteps] = useState<{ stepOrder: number; stepName: string; approverUserId?: string }[]>([{ stepOrder: 1, stepName: '' }]);

  const { data: rawChains, isLoading } = useQuery({
    queryKey: ['crm', 'approval-chains'],
    queryFn: () => crmApi.getApprovalChains(),
  });
  const chains: any[] = (rawChains as unknown as any[] | undefined) ?? [];

  // Team members for the approver dropdown
  const { data: teamRaw } = useTeamMembers();
  const teamMembers: UserDto[] = (teamRaw as unknown as UserDto[] | undefined) ?? [];

  const saveMutation = useMutation({
    mutationFn: (d: any) => editingId ? crmApi.updateApprovalChain(editingId, d) : crmApi.createApprovalChain(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm', 'approval-chains'] });
      resetForm();
      toast.success(editingId ? 'Chain updated.' : 'Chain created.');
    },
    onError: (err: any) => toast.error(err?.message || 'Error saving chain.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => crmApi.deleteApprovalChain(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['crm', 'approval-chains'] }); toast.success('Deleted.'); },
    onError: (err: any) => toast.error(err?.message || 'Error deleting.'),
  });

  function resetForm() {
    setShowForm(false); setEditingId(null); setName(''); setDesc('');
    setEntityType(1); setSteps([{ stepOrder: 1, stepName: '' }]);
  }

  function handleEdit(chain: any) {
    setEditingId(chain.id); setName(chain.name); setDesc(chain.description ?? '');
    setEntityType(chain.entityType);
    setSteps((chain.steps ?? []).map((s: any) => ({
      stepOrder: s.stepOrder, stepName: s.stepName, approverUserId: s.approverUserId ?? '',
    })));
    setShowForm(true);
  }

  function addStep() {
    setSteps(prev => [...prev, { stepOrder: prev.length + 1, stepName: '', approverUserId: '' }]);
  }

  function removeStep(i: number) {
    setSteps(prev => prev.filter((_, j) => j !== i).map((s, j) => ({ ...s, stepOrder: j + 1 })));
  }

  function updateStep(i: number, field: 'stepName' | 'approverUserId', value: string) {
    setSteps(prev => { const n = [...prev]; n[i] = { ...n[i], [field]: value }; return n; });
  }

  function userName(u: UserDto) {
    return u.fullName?.trim() || [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email || u.id;
  }

  const entityTypeLabels: Record<number, string> = {
    1: 'Quote', 2: 'Proposal', 3: 'Deal', 4: 'Time Period', 5: 'Return', 6: 'Work Order', 7: 'Onboarding', 8: 'Purchase Order',
  };

  const canSave = name.trim() && steps.every(s => s.stepName.trim());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Approval Chains</h1>
          <p className="text-xs text-text-muted mt-0.5">
            Define multi-step approval templates. When a Quote, Deal, or other entity is submitted for approval, the matching chain determines who reviews it and in what order.
          </p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand text-white text-sm font-medium">
          <Plus className="w-4 h-4" /> New Chain
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-border-subtle bg-glass-1 p-5 space-y-4">
          <h3 className="text-sm font-semibold">{editingId ? 'Edit' : 'New'} Approval Chain</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-text-muted block mb-1">Name *</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Quote Approval" className="w-full px-3 py-1.5 rounded-lg border border-border-subtle bg-bg-input text-sm" />
            </div>
            <div>
              <label className="text-xs text-text-muted block mb-1">Applies To</label>
              <select value={entityType} onChange={e => setEntityType(Number(e.target.value))} className="w-full px-3 py-1.5 rounded-lg border border-border-subtle bg-bg-input text-sm">
                {Object.entries(entityTypeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-text-muted block mb-1">Description</label>
            <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Optional description" className="w-full px-3 py-1.5 rounded-lg border border-border-subtle bg-bg-input text-sm" />
          </div>

          {/* Steps */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wide">Approval Steps</span>
              <button onClick={addStep} className="text-xs text-brand hover:underline">+ Add Step</button>
            </div>
            {steps.map((s, i) => (
              <div key={i} className="flex gap-2 items-center p-2 rounded-lg bg-glass-2">
                <span className="text-xs font-bold text-text-muted w-6 shrink-0">#{s.stepOrder}</span>
                <input
                  value={s.stepName}
                  onChange={e => updateStep(i, 'stepName', e.target.value)}
                  placeholder="Step name (e.g. Sales Manager Review)"
                  className="flex-1 px-3 py-1.5 rounded-lg border border-border-subtle bg-bg-input text-sm"
                />
                <select
                  value={s.approverUserId ?? ''}
                  onChange={e => updateStep(i, 'approverUserId', e.target.value)}
                  className="w-56 px-3 py-1.5 rounded-lg border border-border-subtle bg-bg-input text-sm"
                >
                  <option value="">— Any team member —</option>
                  {teamMembers.map(u => (
                    <option key={u.id} value={u.id}>{userName(u)}</option>
                  ))}
                </select>
                {steps.length > 1 && (
                  <button onClick={() => removeStep(i)} className="p-1 text-danger hover:bg-danger/10 rounded shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            <p className="text-[11px] text-text-muted">
              Steps run in order. Leave approver blank to allow any team member to approve that step.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => saveMutation.mutate({ name, description: desc || undefined, entityType, steps: steps.map(s => ({ ...s, approverUserId: s.approverUserId || undefined, requiredApprovals: 1 })) })}
              disabled={!canSave || saveMutation.isPending}
              className="px-4 py-1.5 rounded-lg bg-brand text-white text-sm font-medium disabled:opacity-50"
            >
              {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? 'Update Chain' : 'Create Chain'}
            </button>
            <button onClick={resetForm} className="px-3 py-1.5 rounded-lg border border-border-subtle text-sm text-text-secondary">Cancel</button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-text-muted" /></div>
      ) : (
        <div className="space-y-3">
          {chains.length === 0 && (
            <div className="text-center py-16 text-text-muted">
              <p className="text-sm font-semibold">No approval chains defined</p>
              <p className="text-xs mt-1">Create a chain to enable structured multi-step approvals on Quotes, Deals, and more.</p>
            </div>
          )}
          {chains.map((chain: any) => {
            const steps: any[] = chain.steps ?? [];
            return (
              <div key={chain.id} className="rounded-xl border border-border-subtle bg-glass-1 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-text-primary">{chain.name}</p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand/10 text-brand font-semibold">
                        {entityTypeLabels[chain.entityType] ?? 'Unknown'}
                      </span>
                    </div>
                    {chain.description && <p className="text-xs text-text-muted mt-0.5">{chain.description}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => handleEdit(chain)} className="p-1.5 rounded-lg hover:bg-bg-subtle text-text-muted hover:text-text-primary">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => { if (confirm('Delete this chain?')) deleteMutation.mutate(chain.id); }} className="p-1.5 rounded-lg hover:bg-danger/10 text-text-muted hover:text-danger">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Step pills */}
                <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                  {steps.map((s: any, idx: number) => {
                    const approver = teamMembers.find(u => u.id === s.approverUserId);
                    const approverName = approver ? (approver.fullName || `${approver.firstName ?? ''} ${approver.lastName ?? ''}`.trim() || approver.email) : null;
                    return (
                      <div key={s.id ?? idx} className="flex items-center gap-1">
                        <span className="text-[10px] px-2.5 py-1 rounded-full bg-bg-subtle border border-border-subtle text-text-secondary font-medium">
                          {s.stepOrder}. {s.stepName}
                          {approverName && <span className="text-text-muted"> → {approverName}</span>}
                        </span>
                        {idx < steps.length - 1 && <span className="text-[10px] text-text-muted">›</span>}
                      </div>
                    );
                  })}
                  {steps.length === 0 && <span className="text-xs text-text-muted italic">{chain.stepCount} step{chain.stepCount !== 1 ? 's' : ''}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
