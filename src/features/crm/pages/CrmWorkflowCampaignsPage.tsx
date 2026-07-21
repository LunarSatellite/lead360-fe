import { useState } from 'react';
import { Plus, X, Loader2, Play, Target, ChevronDown } from 'lucide-react';
import { useWorkflowCampaigns, useCreateWorkflowCampaign, useExecuteWorkflowCampaign, useWorkflows } from '../api/crm.queries';
import type { CrmWorkflowCampaignDto, CrmWorkflowCampaignCreateRequest, CrmWorkflowSummaryDto } from '../types/crm.types';
import { CRM_WORKFLOW_TRIGGER_LABELS } from '../types/crm.types';

function SlideOver({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; footer?: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end pr-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className="drawer-slide-in relative w-[640px] flex flex-col overflow-hidden"
        style={{
          borderRadius: 18,
          background: 'var(--bg-card)',
          border: '1px solid rgba(0,217,138,0.2)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.7), 0 0 24px rgba(0,217,138,0.25), inset 0 1px 0 rgba(0,255,163,0.05)',
          maxHeight: 'calc(100vh - 32px)',
        }}
      >
        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, #00D98A 35%, #00FFA3 65%, transparent)', flexShrink: 0 }} />
        <div className="flex items-start justify-between px-6 py-4 border-b border-border-subtle shrink-0">
          <div>
            <h2 className="text-base font-extrabold leading-tight" style={{ background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--primary) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{title}</h2>
            <p className="text-xs text-text-muted mt-0.5">Create a new workflow campaign</p>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary mt-0.5">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">{children}</div>
        {footer && (
          <div className="shrink-0 px-6 py-4 border-t border-border-subtle">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function Component() {
  const [showCreate, setShowCreate] = useState(false);
  const [entityOpen, setEntityOpen] = useState(false);
  const [workflowOpen, setWorkflowOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [form, setForm] = useState<{ name: string; description: string; targetEntityType: string; segmentConditionsJson: string; workflowId: string; scheduleType: string }>({
    name: '', description: '', targetEntityType: 'deal', segmentConditionsJson: '{}', workflowId: '', scheduleType: '',
  });

  const { data: campaigns, isLoading } = useWorkflowCampaigns();
  const items: CrmWorkflowCampaignDto[] = (campaigns as any) ?? [];

  const { data: workflowsRaw } = useWorkflows();
  const workflowsList: CrmWorkflowSummaryDto[] = (workflowsRaw as any)?.items ?? [];

  const createCampaign = useCreateWorkflowCampaign();
  const executeCampaign = useExecuteWorkflowCampaign();

  const handleCreate = (e: React.SubmitEvent) => {
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
      <SlideOver
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="New Workflow Campaign"
        footer={
          <div className="flex items-center justify-end gap-3">
            <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-xl text-xs font-semibold text-text-secondary border border-border-subtle hover:border-border-medium transition-all">Cancel</button>
            <button type="submit" form="create-campaign-form" disabled={createCampaign.isPending}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-bg bg-brand hover:bg-brand-light disabled:opacity-50 disabled:cursor-not-allowed transition-all">
              {createCampaign.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Target className="w-3.5 h-3.5" />} Create Campaign
            </button>
          </div>
        }
      >
        <form id="create-campaign-form" onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-[auto_1fr] items-center gap-2">
            <span className="text-[10px] font-bold text-brand uppercase tracking-widest">Basic Info</span>
            <div className="h-px bg-brand/20" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Name <span className="text-danger">*</span></label>
            <div className="relative">
              <Target className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
              <input required value={form.name} onChange={setF('name')} placeholder="Q2 Discount Campaign"
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)]"
                style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Description</label>
            <textarea value={form.description} rows={3} onChange={setF('description')} placeholder="Campaign description…"
              className="w-full pl-3 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)] resize-none"
              style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }} />
          </div>
          <div className="grid grid-cols-[auto_1fr] items-center gap-2 pt-1">
            <span className="text-[10px] font-bold text-brand uppercase tracking-widest">Target & Workflow</span>
            <div className="h-px bg-brand/20" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Target Entity</label>
            <div className="relative">
              <button type="button" onClick={() => setEntityOpen(o => !o)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-text-primary"
                style={{
                  backgroundColor: '#1A2F27',
                  border: `1px solid ${entityOpen ? 'rgba(0,217,138,0.50)' : 'rgba(0,217,138,0.20)'}`,
                  boxShadow: entityOpen ? '0 0 0 1px rgba(0,217,138,0.50), 0 0 10px rgba(0,217,138,0.20), 0 0 20px rgba(0,217,138,0.08)' : 'none',
                  outline: 'none',
                  transition: 'box-shadow 0.2s ease',
                }}>
                <span className="flex-1 text-left font-medium text-text-secondary capitalize">{form.targetEntityType}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-text-muted transition-transform duration-200 ${entityOpen ? 'rotate-180' : ''}`} strokeWidth={1.6} />
              </button>
              {entityOpen && (
                <div className="absolute top-full left-0 right-0 mt-1.5 z-10 overflow-hidden"
                  style={{ borderRadius: 12, background: 'var(--bg-card)', border: '1px solid rgba(0,217,138,0.20)', boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 12px rgba(0,217,138,0.08)' }}>
                  {['deal', 'lead', 'contact'].map(opt => (
                    <button key={opt} type="button"
                      onClick={() => { setForm(f => ({ ...f, targetEntityType: opt })); setEntityOpen(false); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium transition-colors hover:bg-glass-1 text-text-secondary capitalize ${form.targetEntityType === opt ? 'bg-[rgba(0,217,138,0.08)]' : ''}`}>
                      {opt}
                      {form.targetEntityType === opt && <span className="ml-auto text-[10px] font-bold text-text-muted">selected</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Linked Workflow</label>
            <div className="relative">
              <button type="button" onClick={() => setWorkflowOpen(o => !o)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-text-primary"
                style={{
                  backgroundColor: '#1A2F27',
                  border: `1px solid ${workflowOpen ? 'rgba(0,217,138,0.50)' : 'rgba(0,217,138,0.20)'}`,
                  boxShadow: workflowOpen ? '0 0 0 1px rgba(0,217,138,0.50), 0 0 10px rgba(0,217,138,0.20), 0 0 20px rgba(0,217,138,0.08)' : 'none',
                  outline: 'none',
                  transition: 'box-shadow 0.2s ease',
                }}>
                <span className="flex-1 text-left font-medium text-text-secondary">{form.workflowId ? workflowsList.find(w => w.id === form.workflowId)?.name ?? 'Select workflow' : 'Select a workflow'}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-text-muted transition-transform duration-200 ${workflowOpen ? 'rotate-180' : ''}`} strokeWidth={1.6} />
              </button>
              {workflowOpen && (
                <div className="absolute top-full left-0 right-0 mt-1.5 z-10 overflow-hidden max-h-48 overflow-y-auto"
                  style={{ borderRadius: 12, background: 'var(--bg-card)', border: '1px solid rgba(0,217,138,0.20)', boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 12px rgba(0,217,138,0.08)' }}>
                  {workflowsList.length === 0 ? (
                    <div className="px-3 py-2.5 text-xs text-text-muted">No workflows available</div>
                  ) : workflowsList.map(w => (
                    <button key={w.id} type="button"
                      onClick={() => { setForm(f => ({ ...f, workflowId: w.id })); setWorkflowOpen(false); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium transition-colors hover:bg-glass-1 text-text-secondary ${form.workflowId === w.id ? 'bg-[rgba(0,217,138,0.08)]' : ''}`}>
                      {w.name}
                      {form.workflowId === w.id && <span className="ml-auto text-[10px] font-bold text-text-muted">selected</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-[auto_1fr] items-center gap-2 pt-1">
            <span className="text-[10px] font-bold text-brand uppercase tracking-widest">Scheduling</span>
            <div className="h-px bg-brand/20" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Segment Conditions <span className="text-text-muted font-normal">(JSON)</span></label>
            <textarea value={form.segmentConditionsJson} rows={4} onChange={setF('segmentConditionsJson')}
              className="w-full pl-3 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary font-mono placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)] resize-none"
              style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }}
              placeholder='{"filters":[{"field":"Status","op":"eq","value":"Open"}]}' />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Schedule</label>
            <div className="relative">
              <button type="button" onClick={() => setScheduleOpen(o => !o)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-text-primary"
                style={{
                  backgroundColor: '#1A2F27',
                  border: `1px solid ${scheduleOpen ? 'rgba(0,217,138,0.50)' : 'rgba(0,217,138,0.20)'}`,
                  boxShadow: scheduleOpen ? '0 0 0 1px rgba(0,217,138,0.50), 0 0 10px rgba(0,217,138,0.20), 0 0 20px rgba(0,217,138,0.08)' : 'none',
                  outline: 'none',
                  transition: 'box-shadow 0.2s ease',
                }}>
                <span className="flex-1 text-left font-medium text-text-secondary">{form.scheduleType ? (form.scheduleType.charAt(0).toUpperCase() + form.scheduleType.slice(1)) : 'Manual only'}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-text-muted transition-transform duration-200 ${scheduleOpen ? 'rotate-180' : ''}`} strokeWidth={1.6} />
              </button>
              {scheduleOpen && (
                <div className="absolute top-full left-0 right-0 mt-1.5 z-10 overflow-hidden"
                  style={{ borderRadius: 12, background: 'var(--bg-card)', border: '1px solid rgba(0,217,138,0.20)', boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 12px rgba(0,217,138,0.08)' }}>
                  {[{ value: '', label: 'Manual only' }, { value: 'daily', label: 'Daily' }, { value: 'weekly', label: 'Weekly' }].map(opt => (
                    <button key={opt.value} type="button"
                      onClick={() => { setForm(f => ({ ...f, scheduleType: opt.value })); setScheduleOpen(false); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium transition-colors hover:bg-glass-1 text-text-secondary ${form.scheduleType === opt.value ? 'bg-[rgba(0,217,138,0.08)]' : ''}`}>
                      {opt.label}
                      {form.scheduleType === opt.value && <span className="ml-auto text-[10px] font-bold text-text-muted">selected</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </form>
      </SlideOver>
    </div>
  );
}
