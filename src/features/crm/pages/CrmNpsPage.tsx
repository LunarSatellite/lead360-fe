import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, X, Loader2, Star, TrendingUp } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { useNpsSurveys, useNpsTenantSummary, useSendNpsSurvey } from '../api/crm.queries';
import type {
  CrmNpsSurveySummaryDto, CrmNpsSendRequest, CrmNpsFilter,
} from '../types/crm.types';
import {
  CrmNpsClassification, CrmNpsSurveyTrigger,
  CRM_NPS_CLASSIFICATION_LABELS, CRM_NPS_CLASSIFICATION_COLORS, CRM_NPS_TRIGGER_LABELS,
} from '../types/crm.types';

const inputCls =
  'w-full px-3 py-2 rounded-xl bg-bg-elevated border border-border-subtle text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-medium';
const selectCls =
  'w-full px-3 py-2 rounded-xl bg-bg-elevated border border-border-subtle text-sm text-text-primary focus:outline-none focus:border-border-medium';

function Badge({ value, labels, colors }: {
  value: number;
  labels: Record<number, string>;
  colors: Record<number, string>;
}) {
  return (
    <span className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${colors[value] ?? 'bg-bg-elevated text-text-secondary border-border-subtle'}`}>
      {labels[value] ?? value}
    </span>
  );
}

function SlideOver({ open, onClose, title, children }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode;
}) {
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="drawer-slide-in relative w-[520px] h-full flex flex-col bg-bg-shell border-l border-thin border-border-subtle" style={{ boxShadow: '-8px 0 40px rgba(0,0,0,0.5)' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle shrink-0">
          <h3 className="font-bold text-text-primary">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>,
    document.body
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-semibold text-text-muted">{label}</span>
      <div className="text-sm text-text-primary">{children}</div>
    </div>
  );
}

function SummaryCard() {
  const { data: raw, isLoading } = useNpsTenantSummary();
  const summary = raw as any;

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border-subtle bg-bg-card p-5 animate-pulse">
        <div className="h-10 w-24 bg-bg-elevated rounded-xl mb-3" />
        <div className="flex gap-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-7 w-24 bg-bg-elevated rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!summary || summary.totalResponses === 0) {
    return (
      <div className="rounded-2xl border border-border-subtle bg-bg-card p-5 flex items-center gap-3 text-text-muted">
        <TrendingUp className="w-5 h-5 opacity-40" strokeWidth={1.5} />
        <span className="text-sm">No responses yet.</span>
      </div>
    );
  }

  const score: number = summary.npsScore ?? 0;
  const scoreColor = score > 0 ? 'text-success' : 'text-danger';

  return (
    <div className="rounded-2xl border border-border-subtle bg-bg-card p-5 space-y-3">
      <div className="flex items-center gap-3">
        <Star className="w-5 h-5 text-brand" strokeWidth={1.5} />
        <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">NPS Score</span>
        <span className={`text-3xl font-extrabold ${scoreColor}`}>{score}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <span className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-success-soft text-success border border-[rgba(34,197,94,0.2)]">
          Promoters {summary.promoterPct?.toFixed(0) ?? 0}%
        </span>
        <span className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-bg-elevated text-text-secondary border border-border-subtle">
          Passives {summary.passivePct?.toFixed(0) ?? 0}%
        </span>
        <span className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-danger-soft text-danger border border-[rgba(244,63,94,0.2)]">
          Detractors {summary.detractorPct?.toFixed(0) ?? 0}%
        </span>
      </div>
    </div>
  );
}

function SendSurveyForm({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState<CrmNpsSendRequest>({
    contactId: '', dealId: '', supportCaseId: '',
    trigger: CrmNpsSurveyTrigger.Manual, customMessage: '',
  });
  const send = useSendNpsSurvey();

  const set = (k: keyof CrmNpsSendRequest) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.contactId.trim()) { toast.error('Contact ID is required.'); return; }
    send.mutate(
      { ...form, dealId: form.dealId || undefined, supportCaseId: form.supportCaseId || undefined, customMessage: form.customMessage || undefined },
      { onSuccess: onClose },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-text-muted mb-1.5">Contact ID *</label>
        <input required value={form.contactId} onChange={set('contactId')} placeholder="UUID" className={inputCls} />
      </div>
      <div>
        <label className="block text-xs font-semibold text-text-muted mb-1.5">Deal ID (optional)</label>
        <input value={form.dealId ?? ''} onChange={set('dealId')} placeholder="UUID" className={inputCls} />
      </div>
      <div>
        <label className="block text-xs font-semibold text-text-muted mb-1.5">Support Case ID (optional)</label>
        <input value={form.supportCaseId ?? ''} onChange={set('supportCaseId')} placeholder="UUID" className={inputCls} />
      </div>
      <div>
        <label className="block text-xs font-semibold text-text-muted mb-1.5">Trigger</label>
        <select value={form.trigger} onChange={set('trigger')} className={selectCls}>
          {(Object.entries(CRM_NPS_TRIGGER_LABELS) as [string, string][]).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold text-text-muted mb-1.5">Custom Message (optional)</label>
        <textarea rows={3} value={form.customMessage ?? ''} onChange={set('customMessage')} placeholder="How was your experience?" className={`${inputCls} resize-none`} />
      </div>
      <div className="flex gap-3 pt-1">
        <button type="submit" disabled={send.isPending || !form.contactId.trim()}
          className="flex items-center gap-1.5 flex-1 justify-center py-2 rounded-xl bg-brand text-bg text-sm font-bold hover:bg-brand-light disabled:opacity-50 transition-all">
          {send.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-3.5 h-3.5" /> Send Survey</>}
        </button>
        <button type="button" onClick={onClose}
          className="px-4 py-2 rounded-xl border border-border-subtle text-sm text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-all">
          Cancel
        </button>
      </div>
    </form>
  );
}

export function Component() {
  const [filter, setFilter] = useState<CrmNpsFilter>({});
  const [showSend, setShowSend] = useState(false);
  const [detail, setDetail] = useState<CrmNpsSurveySummaryDto | null>(null);

  const { data: raw, isLoading } = useNpsSurveys(filter);
  const items: CrmNpsSurveySummaryDto[] = (raw as any)?.items ?? [];

  const scoreChipColor = (score: number | null) => {
    if (score === null) return 'bg-bg-elevated text-text-muted border-border-subtle';
    if (score >= 9) return 'bg-success-soft text-success border-[rgba(34,197,94,0.2)]';
    if (score >= 7) return 'bg-bg-elevated text-text-secondary border-border-subtle';
    return 'bg-danger-soft text-danger border-[rgba(244,63,94,0.2)]';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-text-primary tracking-tight">NPS Surveys</h2>
          <p className="text-xs text-text-muted mt-0.5">Net Promoter Score feedback from contacts</p>
        </div>
        <button onClick={() => setShowSend(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-bg bg-brand hover:bg-brand-light transition-all">
          <Plus className="w-3.5 h-3.5" strokeWidth={2.5} /> Send Survey
        </button>
      </div>

      <SummaryCard />

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          value={filter.search ?? ''}
          onChange={(e) => setFilter((f) => ({ ...f, search: e.target.value || undefined }))}
          placeholder="Search contacts…"
          className="px-3 py-2 rounded-xl bg-bg-elevated border border-border-subtle text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-medium w-56"
        />
        <select
          value={filter.classification ?? ''}
          onChange={(e) => setFilter((f) => ({ ...f, classification: e.target.value ? Number(e.target.value) as CrmNpsClassification : undefined }))}
          className="px-3 py-2 rounded-xl bg-bg-elevated border border-border-subtle text-sm text-text-primary focus:outline-none"
        >
          <option value="">All Classifications</option>
          {(Object.entries(CRM_NPS_CLASSIFICATION_LABELS) as [string, string][]).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border-subtle bg-bg-card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-40 text-text-muted"><Loader2 className="w-5 h-5 animate-spin" /></div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2 text-text-muted">
            <Star className="w-7 h-7 opacity-25" strokeWidth={1.2} />
            <p className="text-sm">No surveys found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle bg-bg-subtle">
                  {['Contact', 'Score', 'Classification', 'Trigger', 'Comment', 'Sent At', 'Responded At'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-text-muted">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id} onClick={() => setDetail(row)}
                    className="border-b border-border-subtle last:border-0 hover:bg-bg-elevated cursor-pointer transition-colors">
                    <td className="px-4 py-3 text-text-primary font-medium truncate max-w-[140px]">{row.contactId}</td>
                    <td className="px-4 py-3">
                      {row.score !== null ? (
                        <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-bold border ${scoreChipColor(row.score)}`}>{row.score}</span>
                      ) : <span className="text-text-muted">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {row.classification != null ? (
                        <Badge value={row.classification} labels={CRM_NPS_CLASSIFICATION_LABELS} colors={CRM_NPS_CLASSIFICATION_COLORS} />
                      ) : <span className="text-text-muted">—</span>}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{CRM_NPS_TRIGGER_LABELS[row.trigger]}</td>
                    <td className="px-4 py-3 text-text-secondary max-w-[180px] truncate">{row.comment ?? '—'}</td>
                    <td className="px-4 py-3 text-text-muted whitespace-nowrap">{row.sentAt ? format(parseISO(row.sentAt), 'MMM d, HH:mm') : '—'}</td>
                    <td className="px-4 py-3 text-text-muted whitespace-nowrap">{row.respondedAt ? format(parseISO(row.respondedAt), 'MMM d, HH:mm') : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Send Survey SlideOver */}
      <SlideOver open={showSend} onClose={() => setShowSend(false)} title="Send NPS Survey">
        <SendSurveyForm onClose={() => setShowSend(false)} />
      </SlideOver>

      {/* Detail SlideOver */}
      <SlideOver open={!!detail} onClose={() => setDetail(null)} title="Survey Detail">
        {detail && (
          <div className="space-y-4">
            <Field label="Contact ID">{detail.contactId}</Field>
            <Field label="Score">
              {detail.score !== null ? (
                <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-bold border ${scoreChipColor(detail.score)}`}>{detail.score}</span>
              ) : '—'}
            </Field>
            <Field label="Classification">
              {detail.classification != null ? (
                <Badge value={detail.classification} labels={CRM_NPS_CLASSIFICATION_LABELS} colors={CRM_NPS_CLASSIFICATION_COLORS} />
              ) : '—'}
            </Field>
            <Field label="Trigger">{CRM_NPS_TRIGGER_LABELS[detail.trigger]}</Field>
            <Field label="Comment">{detail.comment || '—'}</Field>
            <Field label="Sent At">{detail.sentAt ? format(parseISO(detail.sentAt), 'PPpp') : '—'}</Field>
            <Field label="Responded At">{detail.respondedAt ? format(parseISO(detail.respondedAt), 'PPpp') : '—'}</Field>
          </div>
        )}
      </SlideOver>
    </div>
  );
}
