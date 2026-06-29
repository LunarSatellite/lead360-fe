import { useState } from 'react';
import { Plus, X, Loader2, Trash2, Pencil } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { crmApi } from '../api/crm.api';
import { ContractTemplateCategory, CONTRACT_TEMPLATE_CATEGORY_LABELS, type ContractTemplateCategoryValue } from '../types/crm.types';
import { toast } from 'sonner';
import { ApiError } from '@/shared/lib/api-client';

const inputCls = 'w-full px-3 py-2 rounded-xl bg-bg-input border-thin border-border-subtle text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-glow';

const TEMPLATE_KEY = ['crm', 'contract-templates'] as const;

const VARIABLE_HINTS = [
  '{{AccountName}}', '{{ContactFirstName}}', '{{ContactFullName}}', '{{ContactEmail}}',
  '{{ContractTitle}}', '{{ContractValue}}', '{{ContractCurrency}}',
  '{{StartDate}}', '{{EndDate}}', '{{AutoRenew}}', '{{CurrentDate}}',
];

export function Component() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: TEMPLATE_KEY, queryFn: () => crmApi.getContractTemplates() });
  const templates: any[] = data ?? [];
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '', category: ContractTemplateCategory.General as ContractTemplateCategoryValue, subject: '', bodyHtml: '' });

  const createMut = useMutation({
    mutationFn: (d: any) => crmApi.createContractTemplate(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: TEMPLATE_KEY }); setShowForm(false); resetForm(); toast.success('Template created.'); },
    onError: (e: any) => toast.error(e?.message || 'Error'),
  });
  const updateMut = useMutation({
    mutationFn: (d: any) => crmApi.updateContractTemplate(d.id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: TEMPLATE_KEY }); setEditingId(null); setShowForm(false); resetForm(); toast.success('Template updated.'); },
    onError: (e: any) => toast.error(e?.message || 'Error'),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => crmApi.deleteContractTemplate(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: TEMPLATE_KEY }); setSelectedId(null); toast.success('Deleted.'); },
    onError: (e: any) => toast.error(e?.message || 'Error'),
  });

  const selected = templates.find((t: any) => t.id === selectedId);

  function resetForm() { setForm({ name: '', description: '', category: ContractTemplateCategory.General, subject: '', bodyHtml: '' }); }

  function openEdit(t: any) {
    setEditingId(t.id); setForm({ name: t.name, description: t.description || '', category: t.category, subject: t.subject || '', bodyHtml: t.bodyHtml });
    setShowForm(true);
  }

  function insertVar(v: string) { setForm(f => ({ ...f, bodyHtml: f.bodyHtml + v })); }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...form, description: form.description || undefined, subject: form.subject || undefined };
    if (editingId) updateMut.mutate({ id: editingId, ...data });
    else createMut.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-extrabold text-text-primary tracking-tight">Contract Templates</h1>
          <p className="text-sm text-text-secondary mt-1">Reusable agreement templates with {{variable}} placeholders. Create a contract from a template to auto-fill deal and customer details.</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); setEditingId(null); }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-bg bg-brand hover:bg-brand-light transition-all">
          <Plus className="w-3.5 h-3.5" /> New template
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5">
        <div className="flex flex-col gap-2">
          {isLoading ? <div className="p-8 text-center text-sm text-text-muted">Loading...</div>
          : templates.length === 0 ? (
            <div className="rounded-card border-thin border-border-subtle bg-glass-1 p-8 text-center">
              <p className="text-sm text-text-secondary font-semibold">No templates yet</p>
              <button onClick={() => { resetForm(); setShowForm(true); }} className="mt-3 text-xs font-bold text-brand hover:underline">Create your first</button>
            </div>
          ) : templates.map((t: any) => (
            <button key={t.id} onClick={() => { setSelectedId(t.id); setShowForm(false); }}
              className={`text-left rounded-card border-thin p-3.5 transition-all ${selectedId === t.id ? 'bg-brand-soft border-border-glow' : 'bg-glass-1 border-border-subtle hover:bg-glass-2'}`}>
              <span className="text-sm font-bold text-text-primary">{t.name}</span>
              <div className="text-[11px] text-text-muted mt-1">{CONTRACT_TEMPLATE_CATEGORY_LABELS[t.category] ?? 'General'}{t.isActive === false ? ' · inactive' : ''}</div>
            </button>
          ))}
        </div>

        <div className="rounded-card border-thin border-border-subtle bg-glass-1 p-4 min-h-[200px]">
          {showForm ? (
            <form onSubmit={submit} className="space-y-4">
              <div className="flex items-center justify-between"><h2 className="text-sm font-bold text-text-primary">{editingId ? 'Edit' : 'New'} Template</h2>
                <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="text-text-muted hover:text-text-primary"><X className="w-4 h-4" /></button></div>
              <input className={inputCls} placeholder="Template name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              <div className="grid grid-cols-2 gap-3">
                <select className={inputCls} value={form.category} onChange={e => setForm(f => ({ ...f, category: Number(e.target.value) as ContractTemplateCategoryValue }))}>
                  {Object.entries(ContractTemplateCategory).filter(([k]) => isNaN(Number(k))).map(([k, v]) => (<option key={v} value={v}>{k}</option>))}
                </select>
                <input className={inputCls} placeholder="Subject line (optional)" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
              </div>
              <input className={inputCls} placeholder="Description (optional)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-text-muted">Body (HTML)</label>
                  <div className="flex gap-1 flex-wrap">
                    {VARIABLE_HINTS.map(v => <button key={v} type="button" onClick={() => insertVar(v)} className="px-1.5 py-0.5 rounded text-[10px] bg-glass-2 border border-border-subtle text-text-muted hover:text-brand hover:border-brand/40 transition-all">{v}</button>)}
                  </div>
                </div>
                <textarea className={`${inputCls} min-h-[180px] font-mono text-xs`} value={form.bodyHtml} onChange={e => setForm(f => ({ ...f, bodyHtml: e.target.value }))} placeholder="<p>Hi {{ContactFirstName}},</p><p>Your {{ContractTitle}} is ready...</p>" />
              </div>
              <button type="submit" disabled={createMut.isPending || updateMut.isPending || !form.name.trim()}
                className="w-full py-2 rounded-xl bg-brand text-bg text-sm font-bold hover:bg-brand-light disabled:opacity-50">
                {editingId ? 'Update' : 'Create'} Template
              </button>
            </form>
          ) : selected ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div><h2 className="text-base font-bold text-text-primary">{selected.name}</h2>
                  <p className="text-xs text-text-muted">{CONTRACT_TEMPLATE_CATEGORY_LABELS[selected.category] ?? 'General'}</p></div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(selected)} className="p-1.5 rounded-lg text-text-muted hover:text-brand"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => deleteMut.mutate(selected.id)} className="p-1.5 rounded-lg text-text-muted hover:text-danger"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              {selected.subject && <div className="text-xs"><span className="text-text-muted">Subject: </span><span className="text-text-primary">{selected.subject}</span></div>}
              <div className="rounded-card border-thin border-border-subtle bg-glass-2 p-3">
                <pre className="text-xs text-text-primary whitespace-pre-wrap font-mono">{selected.bodyHtml}</pre>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-text-muted py-16">Select a template or create a new one.</div>
          )}
        </div>
      </div>
    </div>
  );
}
