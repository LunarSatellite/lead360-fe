import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, FileSignature, Loader2, X, Trash2, Check, Eye, Pencil, DollarSign, Calendar, FileText } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { crmApi } from '../api/crm.api';
import { CrmContractStatus, ContractTemplateCategory, CONTRACT_TEMPLATE_CATEGORY_LABELS, type ContractTemplateCategoryValue } from '../types/crm.types';
import { toast } from 'sonner';
import { confirmDialog } from '@/shared/ui/confirm';

const inputCls = 'w-full px-3 py-2 rounded-xl bg-bg-input border-thin border-border-subtle text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-glow';

const STATUS_LABEL: Record<number, string> = {
  [CrmContractStatus.Draft]: 'Draft',
  [CrmContractStatus.PendingSignature]: 'Sent',
  [CrmContractStatus.Active]: 'Fully Signed',
  [CrmContractStatus.Expired]: 'Expired',
  [CrmContractStatus.Terminated]: 'Terminated',
  [CrmContractStatus.Renewed]: 'Renewed',
};
const STATUS_STYLE: Record<number, string> = {
  [CrmContractStatus.Draft]: 'text-text-muted border-border-medium bg-glass-2',
  [CrmContractStatus.PendingSignature]: 'text-warning border-warning/30 bg-warning/10',
  [CrmContractStatus.Active]: 'text-success border-success/30 bg-success/10',
  [CrmContractStatus.Expired]: 'text-text-muted border-border-medium bg-glass-2',
  [CrmContractStatus.Terminated]: 'text-danger border-danger/30 bg-danger/10',
  [CrmContractStatus.Renewed]: 'text-brand border-border-glow bg-brand-soft',
};

const VARIABLE_HINTS = [
  '{{AccountName}}', '{{ContactFirstName}}', '{{ContactFullName}}', '{{ContactEmail}}',
  '{{ContractTitle}}', '{{ContractValue}}', '{{ContractCurrency}}',
  '{{StartDate}}', '{{EndDate}}', '{{AutoRenew}}', '{{CurrentDate}}',
];

function fmt(n: number, ccy: string) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: ccy || 'USD', maximumFractionDigits: 0 }).format(n || 0);
}

type Tab = 'contracts' | 'templates';

export function Component() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('contracts');
  const [statusFilter, setStatusFilter] = useState<number | undefined>(undefined);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [form, setForm] = useState({ title: '', value: '', currency: 'USD', startDate: '', endDate: '', autoRenew: false, templateId: '' });
  const [sigForm, setSigForm] = useState({ name: '', email: '' });

  // Template state
  const [templateForm, setTemplateForm] = useState({ name: '', description: '', category: 0, subject: '', bodyHtml: '' });
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [editTemplateId, setEditTemplateId] = useState<string | null>(null);

  // ── Data ──
  const { data: contractsRaw } = useQuery({
    queryKey: ['crm', 'contracts', statusFilter],
    queryFn: () => crmApi.getContracts(statusFilter ? { status: statusFilter } : undefined),
  });
  const contracts: any[] = (contractsRaw as unknown as any[]) ?? [];

  const { data: templatesRaw } = useQuery({ queryKey: ['crm', 'contract-templates'], queryFn: () => crmApi.getContractTemplates() });
  const templates: any[] = (templatesRaw as unknown as any[]) ?? [];

  const { data: detail } = useQuery({
    queryKey: ['crm', 'contract', selectedId],
    queryFn: () => crmApi.getContractById(selectedId!),
    enabled: !!selectedId,
  });
  const detailData = detail as unknown as any;

  // ── Mutations ──
  const createMut = useMutation({
    mutationFn: (d: any) => crmApi.createContract(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['crm', 'contracts'] }); setShowForm(false); setForm({ title: '', value: '', currency: 'USD', startDate: '', endDate: '', autoRenew: false, templateId: '' }); toast.success('Contract created.'); },
    onError: (e: any) => toast.error(e?.message || 'Error'),
  });
  const updateStatusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: number }) => crmApi.updateContractStatus(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['crm', 'contracts'] }); qc.invalidateQueries({ queryKey: ['crm', 'contract', selectedId] }); },
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => crmApi.deleteContract(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['crm', 'contracts'] }); setSelectedId(null); toast.success('Deleted.'); },
  });

  // Signatory
  const addSigMut = useMutation({
    mutationFn: (d: any) => crmApi.addContractSignatory(selectedId!, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['crm', 'contract', selectedId] }); setSigForm({ name: '', email: '' }); },
  });
  const recordSigMut = useMutation({
    mutationFn: (sigId: string) => crmApi.recordContractSignature(sigId, { signedByName: 'Signed', signedAt: new Date().toISOString() }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['crm', 'contract', selectedId] }); qc.invalidateQueries({ queryKey: ['crm', 'contracts'] }); toast.success('Signature recorded.'); },
  });
  const removeSigMut = useMutation({
    mutationFn: (sigId: string) => crmApi.removeContractSignatory(sigId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['crm', 'contract', selectedId] }); },
  });

  // Templates
  const createTemplateMut = useMutation({
    mutationFn: (d: any) => editTemplateId ? crmApi.updateContractTemplate(editTemplateId, d) : crmApi.createContractTemplate(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['crm', 'contract-templates'] }); setShowTemplateForm(false); setEditTemplateId(null); setTemplateForm({ name: '', description: '', category: 0, subject: '', bodyHtml: '' }); toast.success(editTemplateId ? 'Updated.' : 'Created.'); },
    onError: (e: any) => toast.error(e?.message || 'Error'),
  });
  const deleteTemplateMut = useMutation({
    mutationFn: (id: string) => crmApi.deleteContractTemplate(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['crm', 'contract-templates'] }); toast.success('Template deleted.'); },
  });

  // ── Preview ──
  const previewMut = useMutation({
    mutationFn: () => crmApi.previewContractTemplate(form.templateId, form as any),
    onSuccess: (html: any) => { setPreviewHtml(html); setShowPreview(true); },
    onError: (e: any) => toast.error(e?.message || 'Preview failed'),
  });

  function toIso(d: string) { return d ? `${d}T00:00:00.000Z` : undefined; }

  const submit = (e: React.SubmitEvent) => {
    e.preventDefault();
    const data: any = { title: form.title.trim(), value: form.value ? Number(form.value) : 0, currency: form.currency || 'USD', startDate: toIso(form.startDate), endDate: toIso(form.endDate), autoRenew: form.autoRenew, templateId: form.templateId || undefined };
    if (form.templateId) { previewMut.mutate(); return; }
    createMut.mutate(data);
  };

  const confirmCreate = () => {
    const data: any = { title: form.title.trim(), value: form.value ? Number(form.value) : 0, currency: form.currency || 'USD', startDate: toIso(form.startDate), endDate: toIso(form.endDate), autoRenew: form.autoRenew, templateId: form.templateId || undefined };
    createMut.mutate(data);
    setShowPreview(false);
  };

  const sigs = detailData?.signatories ?? [];
  const signedCount = sigs.filter((s: any) => s.signedAt).length;
  const allSigned = sigs.length > 0 && signedCount === sigs.length;


  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          <button onClick={() => setTab('contracts')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${tab === 'contracts' ? 'bg-brand text-white' : 'bg-glass-1 text-text-secondary hover:text-text-primary'}`}>Contracts</button>
          <button onClick={() => setTab('templates')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${tab === 'templates' ? 'bg-brand text-white' : 'bg-glass-1 text-text-secondary hover:text-text-primary'}`}>Templates</button>
        </div>
        {tab === 'contracts' && (
          <button onClick={() => { setForm({ title: '', value: '', currency: 'USD', startDate: '', endDate: '', autoRenew: false, templateId: '' }); setShowForm(true); }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-bg bg-brand hover:bg-brand-light">
            <Plus className="w-3.5 h-3.5" /> New contract
          </button>
        )}
        {tab === 'templates' && (
          <button onClick={() => { setEditTemplateId(null); setTemplateForm({ name: '', description: '', category: 0, subject: '', bodyHtml: '' }); setShowTemplateForm(true); }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-bg bg-brand hover:bg-brand-light">
            <Plus className="w-3.5 h-3.5" /> New template
          </button>
        )}
      </div>

      {tab === 'contracts' && (
        <div className="flex gap-5 items-start">
          <div className="flex-1 min-w-0 space-y-4">
            <div className="flex gap-1.5 flex-wrap">
              <button onClick={() => setStatusFilter(undefined)} className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-all ${!statusFilter ? 'bg-brand-soft text-brand border-border-glow' : 'bg-glass-1 text-text-secondary border-border-subtle hover:border-border-medium'}`}>All</button>
              {Object.entries(STATUS_LABEL).map(([k, v]) => (
                <button key={k} onClick={() => setStatusFilter(Number(k))} className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-all ${statusFilter === Number(k) ? 'bg-brand-soft text-brand border-border-glow' : 'bg-glass-1 text-text-secondary border-border-subtle hover:border-border-medium'}`}>{v}</button>
              ))}
            </div>

            <div className="overflow-x-auto rounded-card border-thin border-border-subtle">
              <table className="w-full min-w-[800px] border-collapse">
                <thead><tr className="bg-glass-2 text-left">
                  {['Contract #', 'Title', 'Value', 'Status', 'Signed', 'Start', 'End', ''].map(h => (
                    <th key={h} className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-text-muted">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {contracts.length === 0 ? (
                    <tr><td colSpan={8} className="px-4 py-12 text-center text-sm text-text-muted"><FileSignature className="w-8 h-8 mx-auto mb-2 opacity-30" /><p>No contracts yet</p></td></tr>
                  ) : contracts.map((c: any) => (
                    <tr key={c.id} className={`border-t border-border-subtle hover:bg-glass-1 cursor-pointer ${selectedId === c.id ? 'bg-brand-soft/30' : ''}`} onClick={() => setSelectedId(selectedId === c.id ? null : c.id)}>
                      <td className="px-4 py-3 text-xs font-semibold text-brand">{c.contractNumber}</td>
                      <td className="px-4 py-3 text-sm text-text-primary">{c.title}{c.autoRenew ? <span className="ml-1.5 text-[10px] text-text-muted">· auto-renew</span> : ''}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-text-primary tabular-nums">{fmt(c.value, c.currency)}</td>
                      <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_STYLE[c.status]}`}>{STATUS_LABEL[c.status]}</span></td>
                      <td className="px-4 py-3 text-xs text-text-muted">{c.signedCount != null ? `${c.signedCount}/${c.signatoryCount}` : '—'}</td>
                      <td className="px-4 py-3 text-xs text-text-muted tabular-nums">{c.startDate ? new Date(c.startDate).toLocaleDateString() : '—'}</td>
                      <td className="px-4 py-3 text-xs text-text-muted tabular-nums">{c.endDate ? new Date(c.endDate).toLocaleDateString() : '—'}</td>
                      <td className="px-4 py-3"><button onClick={(e) => { e.stopPropagation(); confirmDialog({ message: 'Delete?', confirmText: 'Delete', danger: true }).then(ok => { if (ok) deleteMut.mutate(c.id); }); }} className="text-text-muted hover:text-danger"><Trash2 className="w-3.5 h-3.5" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {selectedId && detail && (
            <div className="w-80 shrink-0 bg-glass-1 rounded-card border-thin border-border-subtle p-4 space-y-4 sticky top-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-text-primary">{detailData?.title}</h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_STYLE[detailData?.status]}`}>{STATUS_LABEL[detailData?.status]}</span>
              </div>
              <div className="text-xs space-y-1">
                <div className="flex justify-between"><span className="text-text-muted">Value</span><span className="text-text-primary">{fmt(detailData?.value, detailData?.currency)}</span></div>
                {detailData?.startDate && <div className="flex justify-between"><span className="text-text-muted">Start</span><span className="text-text-primary">{new Date(detailData?.startDate).toLocaleDateString()}</span></div>}
                {detailData?.endDate && <div className="flex justify-between"><span className="text-text-muted">End</span><span className="text-text-primary">{new Date(detailData?.endDate).toLocaleDateString()}</span></div>}
              </div>

              <div className="border-t border-border-subtle pt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Signatories {sigs.length > 0 && <span className="text-text-muted font-normal">({signedCount} of {sigs.length} signed)</span>}</span>
                  {detailData?.status === CrmContractStatus.Draft && (
                    <button onClick={() => addSigMut.mutate(sigForm)} disabled={!sigForm.name.trim()} className="text-xs text-brand hover:underline">+ Add</button>
                  )}
                </div>
                {detailData?.status === CrmContractStatus.Draft && (
                  <div className="flex gap-1 mb-2">
                    <input className="flex-1 px-2 py-1 rounded bg-bg-input border border-border-subtle text-xs" placeholder="Name" value={sigForm.name} onChange={e => setSigForm(f => ({ ...f, name: e.target.value }))} />
                    <input className="w-24 px-2 py-1 rounded bg-bg-input border border-border-subtle text-xs" placeholder="Email" value={sigForm.email} onChange={e => setSigForm(f => ({ ...f, email: e.target.value }))} />
                  </div>
                )}
                {sigs.length === 0 ? (
                  <p className="text-xs text-text-muted italic">No signatories yet.</p>
                ) : sigs.map((s: any) => (
                  <div key={s.id} className="flex items-center justify-between gap-2 py-1.5 border-b border-border-subtle last:border-0">
                    <div className="flex-1 min-w-0"><span className="text-xs text-text-primary">{s.name}</span>{s.email && <span className="text-[10px] text-text-muted ml-1">({s.email})</span>}</div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {s.signedAt ? (
                        <span className="flex items-center gap-1 text-[10px] text-success"><Check className="w-3 h-3" /> Signed</span>
                      ) : detailData?.status === CrmContractStatus.PendingSignature ? (
                        <button onClick={() => recordSigMut.mutate(s.id)} className="text-[10px] font-semibold text-brand hover:underline">Record signature</button>
                      ) : detailData?.status === CrmContractStatus.Draft ? (
                        <button onClick={() => removeSigMut.mutate(s.id)} className="text-[10px] text-danger hover:underline">Remove</button>
                      ) : null}
                    </div>
                  </div>
                ))}
                {allSigned && <p className="text-xs text-success mt-1 font-semibold">✓ All {sigs.length} signatories have signed.</p>}
              </div>

              <div className="flex gap-2 pt-1">
                {detailData?.status === CrmContractStatus.Draft && (
                  <button onClick={() => updateStatusMut.mutate({ id: detailData?.id, status: CrmContractStatus.PendingSignature })}
                    className="flex-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-brand text-white hover:brightness-110">Send for signature</button>
                )}
                {detailData?.status === CrmContractStatus.PendingSignature && allSigned && (
                  <button onClick={() => updateStatusMut.mutate({ id: detailData?.id, status: CrmContractStatus.Active })}
                    className="flex-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-success text-white hover:brightness-110">Mark fully signed</button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'templates' && (
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5">
          <div className="flex flex-col gap-2">
            {templates.length === 0 ? (
              <div className="rounded-card border-thin border-border-subtle bg-glass-1 p-8 text-center">
                <p className="text-sm text-text-secondary font-semibold">No templates yet</p>
                <button onClick={() => { setEditTemplateId(null); setTemplateForm({ name: '', description: '', category: 0, subject: '', bodyHtml: '' }); setShowTemplateForm(true); }} className="mt-3 text-xs font-bold text-brand hover:underline">Create your first</button>
              </div>
            ) : templates.map((t: any) => (
              <div key={t.id} className="bg-glass-1 rounded-card border-thin border-border-subtle p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-text-primary">{t.name}</span>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditTemplateId(t.id); setTemplateForm({ name: t.name, description: t.description || '', category: t.category, subject: t.subject || '', bodyHtml: t.bodyHtml }); setShowTemplateForm(true); }} className="p-1 text-text-muted hover:text-brand"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => deleteTemplateMut.mutate(t.id)} className="p-1 text-text-muted hover:text-danger"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <div className="text-[11px] text-text-muted">{CONTRACT_TEMPLATE_CATEGORY_LABELS[t.category as ContractTemplateCategoryValue] ?? 'General'}{t.subject ? ` · ${t.subject}` : ''}</div>
                <div className="text-[11px] text-text-muted line-clamp-2 font-mono bg-glass-2 p-2 rounded">{t.bodyHtml}</div>
              </div>
            ))}
          </div>
          <div className="rounded-card border-thin border-border-subtle bg-glass-1 p-5">
            <p className="text-sm text-text-muted text-center py-16">Select or create a template to manage contract templates.<br/>Use {'{{VariableName}}'} placeholders — they auto-fill when generating a contract.</p>
          </div>
        </div>
      )}

      {showTemplateForm && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <form onSubmit={(e) => { e.preventDefault(); createTemplateMut.mutate({ ...templateForm, description: templateForm.description || undefined, subject: templateForm.subject || undefined }); }} className="w-full max-w-lg bg-bg border-thin border-border-subtle rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between"><h2 className="text-sm font-bold text-text-primary">{editTemplateId ? 'Edit' : 'New'} Template</h2>
              <button type="button" onClick={() => { setShowTemplateForm(false); setEditTemplateId(null); }} className="text-text-muted hover:text-text-primary"><X className="w-4 h-4" /></button></div>
            <input className={inputCls} placeholder="Template name" value={templateForm.name} onChange={e => setTemplateForm(f => ({ ...f, name: e.target.value }))} required />
            <div className="grid grid-cols-2 gap-3">
              <select className={inputCls} value={templateForm.category} onChange={e => setTemplateForm(f => ({ ...f, category: Number(e.target.value) }))}>
                {Object.entries(ContractTemplateCategory).filter(([k]) => isNaN(Number(k))).map(([k, v]) => (<option key={v} value={v}>{k}</option>))}
              </select>
              <input className={inputCls} placeholder="Subject" value={templateForm.subject} onChange={e => setTemplateForm(f => ({ ...f, subject: e.target.value }))} />
            </div>
            <input className={inputCls} placeholder="Description" value={templateForm.description} onChange={e => setTemplateForm(f => ({ ...f, description: e.target.value }))} />
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-text-muted">Body</span>
                <div className="flex gap-1 flex-wrap">
                  {VARIABLE_HINTS.map(v => <button key={v} type="button" onClick={() => setTemplateForm(f => ({ ...f, bodyHtml: f.bodyHtml + v }))} className="px-1.5 py-0.5 rounded text-[10px] bg-glass-2 border border-border-subtle text-text-muted hover:text-brand">{v}</button>)}
                </div>
              </div>
              <textarea className={`${inputCls} min-h-[160px] font-mono text-xs`} value={templateForm.bodyHtml} onChange={e => setTemplateForm(f => ({ ...f, bodyHtml: e.target.value }))} placeholder="<p>Hi {{ContactFirstName}},</p>" />
            </div>
            <button type="submit" disabled={createTemplateMut.isPending || !templateForm.name.trim()} className="w-full py-2 rounded-xl bg-brand text-bg text-sm font-bold hover:bg-brand-light disabled:opacity-50">{editTemplateId ? 'Update' : 'Create'} Template</button>
          </form>
        </div>,
        document.body
      )}

      {showForm && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-end pr-4">
          <div className="fixed inset-0 min-h-screen bg-black/40 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div
            className="drawer-slide-in relative w-[520px] flex flex-col overflow-hidden"
            style={{
              borderRadius: 18,
              background: 'var(--bg-card)',
              border: '1px solid rgba(0,217,138,0.2)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.7), 0 0 24px rgba(0,217,138,0.25), inset 0 1px 0 rgba(0,255,163,0.05)',
              maxHeight: 'calc(100vh - 32px)',
            }}
          >
            {/* Accent bar */}
            <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, #00D98A 35%, #00FFA3 65%, transparent)', flexShrink: 0 }} />
            <div className="flex items-start justify-between px-6 py-4 border-b border-border-subtle shrink-0">
              <div>
                <h2
                  className="text-base font-extrabold leading-tight"
                  style={{
                    background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--primary) 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >New Contract</h2>
                <p className="text-xs text-text-muted mt-0.5">Create a new contract</p>
              </div>
              <button onClick={() => setShowForm(false)} className="text-text-muted hover:text-text-primary mt-0.5">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={submit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Title <span className="text-danger">*</span></label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
                  <input
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)]"
                    style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }}
                    placeholder="Contract title…"
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    required
                  />
                </div>
              </div>

              {/* Template */}
              {templates.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Template</label>
                  <div className="relative">
                    <FileSignature className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
                    <select
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary focus:outline-none focus:border-[rgba(0,217,138,0.50)]"
                      style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }}
                      value={form.templateId}
                      onChange={e => setForm(f => ({ ...f, templateId: e.target.value }))}
                    >
                      <option value="">No template</option>
                      {templates.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {/* Value + Currency */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Value</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
                    <input
                      type="number"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)]"
                      style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }}
                      placeholder="0"
                      value={form.value}
                      onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Currency</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
                    <input
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)]"
                      style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }}
                      placeholder="USD"
                      value={form.currency}
                      onChange={e => setForm(f => ({ ...f, currency: e.target.value.toUpperCase() }))}
                    />
                  </div>
                </div>
              </div>

              {/* Start + End Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Start Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none z-10" strokeWidth={1.6} />
                    <input
                      type="date"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary focus:outline-none focus:border-[rgba(0,217,138,0.50)]"
                      style={{
                        backgroundColor: '#1A2F27',
                        colorScheme: 'dark',
                        backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)',
                      }}
                      value={form.startDate}
                      onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">End Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none z-10" strokeWidth={1.6} />
                    <input
                      type="date"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary focus:outline-none focus:border-[rgba(0,217,138,0.50)]"
                      style={{
                        backgroundColor: '#1A2F27',
                        colorScheme: 'dark',
                        backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)',
                      }}
                      value={form.endDate}
                      onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              {/* Auto-renew */}
              <label className="flex items-center gap-2 text-xs font-semibold text-text-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.autoRenew}
                  onChange={e => setForm(f => ({ ...f, autoRenew: e.target.checked }))}
                  className="accent-brand w-4 h-4"
                />
                Auto-renew
              </label>
            </form>

            {/* Footer */}
            <div className="shrink-0 px-6 py-4 border-t border-border-subtle flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-text-secondary border border-border-subtle hover:border-border-medium transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMut.isPending || !form.title.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-bg bg-brand hover:bg-brand-light disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {createMut.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Create Contract
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {showPreview && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-2xl bg-bg border-thin border-border-subtle rounded-2xl p-6 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between shrink-0"><h2 className="text-sm font-bold text-text-primary flex items-center gap-2"><Eye className="w-4 h-4" /> Preview</h2>
              <button onClick={() => setShowPreview(false)} className="text-text-muted hover:text-text-primary"><X className="w-4 h-4" /></button></div>
            <div className="flex-1 overflow-y-auto rounded-card border-thin border-border-subtle bg-glass-1 p-4 text-sm text-text-primary" dangerouslySetInnerHTML={{ __html: previewHtml }} />
            <div className="flex gap-3 shrink-0">
              <button onClick={confirmCreate} className="flex-1 py-2 rounded-xl bg-brand text-bg text-sm font-bold hover:bg-brand-light">Confirm & Create</button>
              <button onClick={() => setShowPreview(false)} className="px-4 py-2 rounded-xl border border-border-subtle text-sm text-text-secondary">Back</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
