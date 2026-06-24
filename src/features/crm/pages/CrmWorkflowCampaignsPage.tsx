import { useState } from 'react';
import { Plus, X, Loader2, Play, Target, Settings } from 'lucide-react';
import { useWorkflowCampaigns, useCreateWorkflowCampaign, useExecuteWorkflowCampaign, useWorkflows } from '../api/crm.queries';
import type { CrmWorkflowCampaignDto, CrmWorkflowCampaignCreateRequest, CrmWorkflowSummaryDto } from '../types/crm.types';
import { CRM_WORKFLOW_TRIGGER_LABELS } from '../types/crm.types';

const inputCls = 'w-full px-3 py-2 rounded-xl bg-bg-elevated border border-border-subtle text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-glow';
const selectCls = 'w-full px-3 py-2 rounded-xl bg-bg-elevated border border-border-subtle text-sm text-text-primary focus:outline-none focus:border-border-glow';

function SlideOver({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-bg-elevated shadow-2xl flex flex-col border-thin border-border-subtle rounded-card max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle shrink-0">
          <h3 className="text-base font-bold text-text-primary">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-bg-card text-text-muted hover:text-text-primary transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}

export function Component() {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<{ name: string; description: string; targetEntityType: string; segmentConditionsJson: string; workflowId: string; scheduleType: string }>({
    name: '', description: '', targetEntityType: 'deal', segmentConditionsJson: '{}', workflowId: '', scheduleType: '',
  });

  const { data: campaigns, isLoading } = useWorkflowCampaigns();
  const items: CrmWorkflowCampaignDto[] = (campaigns as any) ?? [];

  const { data: workflowsRaw } = useWorkflows();
  const workflowsList: CrmWorkflowSummaryDto[] = (workflowsRaw as any)?.items ?? [];

  const createCampaign = useCreateWorkflowCampaign();
  const executeCampaign = useExecuteWorkflowCampaign();

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const req: CrmWorkflowCampaignCreateRequest = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      targetEntityType: form.targetEntityType,
      segmentConditionsJson: form.segmentConditionsJson,
      workflowId: form.workflowId,
      scheduleType: form.scheduleType || undefined,
    };
    createCampaign.mutate(req, { onSuccess: () => { setShowCreate(false); setForm({ name: '', description: '', targetEntityType: 'deal', segmentConditionsJson: '{}', workflowId: '', scheduleType: '' }); } });
  };

  const setF = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-xl font-extrabold text-text-primary tracking-tight">Workflow Campaigns</h2>
          <p className="text-xs text-text-muted mt-0.5">{items.length} campaigns</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-bg bg-brand hover:bg-brand-light transition-all shrink-0">
          <Plus className="w-3.5 h-3.5" strokeWidth={2.5} /> New Campaign
        </button>
      </div>

      <div className="rounded-2xl border border-border-subtle bg-bg-card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-40 text-text-muted"><Loader2 className="w-5 h-5 animate-spin" /></div>
        ) : !items.length ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3 text-text-muted">
            <Target className="w-8 h-8 opacity-30" strokeWidth={1.2} />
            <p className="text-sm">No workflow campaigns found.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle">
                {['Name', 'Entity', 'Workflow', 'Schedule', 'Matched', 'Last Run', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((c: CrmWorkflowCampaignDto) => (
                <tr key={c.id} className="border-b border-border-subtle last:border-0 hover:bg-bg-elevated transition-colors">
                  <td className="px-4 py-3 font-medium text-text-primary">{c.name}</td>
                  <td className="px-4 py-3 text-text-secondary">{c.targetEntityType}</td>
                  <td className="px-4 py-3 text-text-secondary text-xs">{CRM_WORKFLOW_TRIGGER_LABELS[c.triggerType] ?? c.triggerType}</td>
                  <td className="px-4 py-3 text-text-muted text-xs">{c.scheduleType ?? 'manual'}</td>
                  <td className="px-4 py-3 text-text-muted">{c.totalMatched}</td>
                  <td className="px-4 py-3 text-text-muted text-xs">{c.lastRunAt ? new Date(c.lastRunAt).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => executeCampaign.mutate(c.id)} disabled={executeCampaign.isPending} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-brand-soft text-brand text-xs font-semibold hover:bg-brand hover:text-bg transition-all disabled:opacity-60">
                      {executeCampaign.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" strokeWidth={1.5} />} Run
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create SlideOver */}
      <SlideOver open={showCreate} onClose={() => setShowCreate(false)} title="New Workflow Campaign">
        <form onSubmit={handleCreate} className="space-y-4">
          <Field label="Name *"><input required value={form.name} onChange={setF('name')} placeholder="Q2 Discount Campaign" className={inputCls} /></Field>
          <Field label="Description"><textarea value={form.description} onChange={setF('description')} placeholder="Campaign description..." className={inputCls + ' min-h-[60px]'} /></Field>
          <Field label="Target Entity">
            <select value={form.targetEntityType} onChange={setF('targetEntityType')} className={selectCls}>
              <option value="deal">Deal</option>
              <option value="lead">Lead</option>
              <option value="contact">Contact</option>
            </select>
          </Field>
          <Field label="Linked Workflow">
            <select value={form.workflowId} onChange={setF('workflowId')} className={selectCls}>
              <option value="">Select a workflow</option>
              {workflowsList.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </Field>
          <Field label="Segment Conditions (JSON)">
            <textarea value={form.segmentConditionsJson} onChange={setF('segmentConditionsJson')} rows={5} className={inputCls + ' font-mono text-xs'} placeholder='{"filters":[{"field":"Status","op":"eq","value":"Open"}]}' />
          </Field>
          <Field label="Schedule">
            <select value={form.scheduleType} onChange={setF('scheduleType')} className={selectCls}>
              <option value="">Manual only</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </Field>
          <button type="submit" disabled={createCampaign.isPending} className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-brand text-bg text-sm font-bold hover:bg-brand-light disabled:opacity-60 transition-all">
            {createCampaign.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4" strokeWidth={1.5} />} Create Campaign
          </button>
        </form>
      </SlideOver>
    </div>
  );
}
