import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, X, Loader2, Star, TrendingUp, ChevronDown, User, Hash, Send, FileText } from 'lucide-react';
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

const inputStyle = { backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' } as const;

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

function SlideOver({ open, onClose, title, subtitle, children, footer }: {
  open: boolean; onClose: () => void; title: string; subtitle?: string; children: React.ReactNode; footer?: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end pr-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className="drawer-slide-in relative flex flex-col overflow-hidden"
        style={{
          width: '520px',
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
            {subtitle && <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary mt-0.5">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="shrink-0 px-6 py-4 border-t border-border-subtle">{footer}</div>}
      </div>
    </div>
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

function TriggerDropdown({ value, onChange }: { value: CrmNpsSurveyTrigger | undefined; onChange: (v: CrmNpsSurveyTrigger) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-text-primary text-left"
        style={{ backgroundColor: '#1A332C', border: `1px solid ${open ? 'rgba(0,217,138,0.50)' : 'rgba(0,217,138,0.20)'}`, boxShadow: open ? '0 0 0 1px rgba(0,217,138,0.50), 0 0 10px rgba(0,217,138,0.20), 0 0 20px rgba(0,217,138,0.08)' : 'none', outline: 'none', transition: 'box-shadow 0.2s ease' }}
      >
        <span className="flex-1 font-medium text-text-primary">{value != null ? (CRM_NPS_TRIGGER_LABELS[value] ?? 'Select trigger') : 'Select trigger'}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-text-muted transition-transform ${open ? 'rotate-180' : ''}`} strokeWidth={1.6} />
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-20 overflow-hidden" style={{ borderRadius: 12, background: 'var(--bg-card)', border: '1px solid rgba(0,217,138,0.20)', boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 12px rgba(0,217,138,0.08)' }}>
          {(Object.entries(CRM_NPS_TRIGGER_LABELS) as [string, string][]).map(([v, l]) => (
            <button key={v} type="button" onClick={() => { onChange(Number(v) as CrmNpsSurveyTrigger); setOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium transition-colors hover:bg-[rgba(0,217,138,0.08)] ${value === Number(v) ? 'bg-[rgba(0,217,138,0.08)]' : ''} text-text-secondary`}>
              {l}
              {value === Number(v) && <span className="ml-auto text-[10px] font-bold text-text-muted">selected</span>}
            </button>
          ))}
        </div>
      )}
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
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
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
    <form id="nps-form" onSubmit={handleSubmit} className="space-y-4">
      {/* ── Survey ── */}
      <div className="grid grid-cols-[auto_1fr] items-center gap-2">
        <span className="text-[10px] font-bold text-brand uppercase tracking-widest">Survey</span>
        <div className="h-px bg-brand/20" />
      </div>

      <div>
        <label className="block text-xs font-semibold text-text-secondary mb-1">Contact ID *</label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
          <input required value={form.contactId} onChange={set('contactId')} placeholder="contact-uuid"
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)]"
            style={inputStyle} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-1">Deal ID</label>
          <div className="relative">
            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
            <input value={form.dealId ?? ''} onChange={set('dealId')} placeholder="deal-uuid"
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)]"
              style={inputStyle} />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-1">Support Case ID</label>
          <div className="relative">
            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
            <input value={form.supportCaseId ?? ''} onChange={set('supportCaseId')} placeholder="case-uuid"
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)]"
              style={inputStyle} />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-text-secondary mb-1">Trigger</label>
        <TriggerDropdown value={form.trigger} onChange={v => setForm(f => ({ ...f, trigger: v }))} />
      </div>

      <div>
        <label className="block text-xs font-semibold text-text-secondary mb-1">Custom Message</label>
        <div className="relative">
          <FileText className="absolute left-3 top-3 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
          <textarea rows={3} value={form.customMessage ?? ''} onChange={set('customMessage')} placeholder="How was your experience?"
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)] resize-none"
            style={inputStyle} />
        </div>
      </div>
    </form>
  );
}

export function Component() {
  // Drill-down from the NPS widget lands here pre-filtered: ?classification= opens the list filtered to that band.
  const [searchParams] = useSearchParams();
  const initialClassification = searchParams.get('classification');
  const [filter, setFilter] = useState<CrmNpsFilter>({
    classification: initialClassification ? (Number(initialClassification) as CrmNpsFilter['classification']) : undefined,
  });
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
      <SlideOver
        open={showSend}
        onClose={() => setShowSend(false)}
        title="Send NPS Survey"
        subtitle="Send a Net Promoter Score survey to a contact"
        footer={
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setShowSend(false)} className="px-4 py-2 rounded-xl text-xs font-semibold text-text-secondary border border-border-subtle hover:border-border-medium transition-all">Cancel</button>
            <button type="submit" form="nps-form"
              className="flex-none px-6 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-brand text-bg text-sm font-bold hover:bg-brand-light disabled:opacity-50 disabled:cursor-not-allowed transition-all">
              <Send className="w-4 h-4" /> Send Survey
            </button>
          </div>
        }
      >
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
