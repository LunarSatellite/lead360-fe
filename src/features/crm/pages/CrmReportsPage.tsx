import { useState } from 'react';
import { confirmDialog } from '@/shared/ui/confirm';
import { toast } from 'sonner';
import { Plus, Play, Calendar, Trash2, ChevronUp, FileBarChart, X, Download } from 'lucide-react';
import { env } from '@/shared/config/env';
import {
  useReportCatalog, useReports, useCreateReport, useDeleteReport,
  usePreviewReport, useRunReport, useScheduleReport,
} from '../api/crm-reports.queries';
import type {
  CrmReportFilterDto, CrmReportDto, CrmReportRunResultDto, CrmReportObjectDto,
} from '../types/crm-reports.types';
import { REPORT_SCHEDULE_FREQUENCIES, AGGREGATE_FUNCTIONS } from '../types/crm-reports.types';

async function downloadReportCsv(reportId: string, fallbackFileName: string) {
  const token = localStorage.getItem('omniflow_token');
  const res = await fetch(`${env.apiBaseUrl}/v1/crm/reports/${reportId}/export`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    toast.error('Failed to export report');
    return;
  }
  const blob = await res.blob();
  const disposition = res.headers.get('content-disposition') ?? '';
  const match = /filename="?([^";]+)"?/i.exec(disposition);
  const filename = match?.[1] ?? fallbackFileName;
  const href = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(href);
}

const inputCls = 'w-full px-3 py-2 rounded-lg bg-bg border border-border-subtle text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand transition-all';
const selectCls = inputCls;

export function Component() {
  const { data: catalog } = useReportCatalog();
  const { data: reports = [], isLoading } = useReports();
  const [showBuilder, setShowBuilder] = useState(false);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">Reports</h1>
          <p className="text-base text-text-secondary mt-1">Build a custom view over any CRM object — filter, group, chart, and schedule delivery</p>
        </div>
        <button
          onClick={() => setShowBuilder(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold bg-gradient-to-br from-brand to-brand-dark text-white hover:brightness-110 transition-all"
        >
          <Plus className="w-4 h-4" /> New report
        </button>
      </div>

      {showBuilder && catalog && (
        <ReportBuilder catalog={catalog} onDone={() => setShowBuilder(false)} onCancel={() => setShowBuilder(false)} />
      )}

      {isLoading ? (
        <div className="p-8 text-center text-sm text-text-muted">Loading reports...</div>
      ) : reports.length === 0 && !showBuilder ? (
        <div className="bg-glass-1 border border-border-subtle rounded-2xl p-12 text-center">
          <FileBarChart className="w-10 h-10 text-text-muted mx-auto mb-3" />
          <div className="text-base font-bold text-text-primary mb-1">No reports yet</div>
          <div className="text-sm text-text-muted">Build a report to get a live view over your Deals, Leads, Invoices, and more.</div>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => <ReportRow key={r.id} report={r} />)}
        </div>
      )}
    </div>
  );
}

// ── Builder ─────────────────────────────────────────────────────────────────
function ReportBuilder({ catalog, onDone, onCancel }: {
  catalog: CrmReportObjectDto[]; onDone: () => void; onCancel: () => void;
}) {
  const create = useCreateReport();
  const preview = usePreviewReport();

  const [name, setName] = useState('');
  const [objectType, setObjectType] = useState(catalog[0]?.objectType ?? '');
  const object = catalog.find((o) => o.objectType === objectType);
  const [columns, setColumns] = useState<string[]>(() => object?.fields.slice(0, 6).map((f) => f.key) ?? []);
  const [filters, setFilters] = useState<CrmReportFilterDto[]>([]);
  const [groupBy, setGroupBy] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [aggregateFunction, setAggregateFunction] = useState<string>('count');
  const [aggregateField, setAggregateField] = useState('');
  const [result, setResult] = useState<CrmReportRunResultDto | null>(null);

  const numericFields = object?.fields.filter((f) => f.type === 'number') ?? [];

  const changeObject = (ot: string) => {
    setObjectType(ot);
    const obj = catalog.find((o) => o.objectType === ot);
    setColumns(obj?.fields.slice(0, 6).map((f) => f.key) ?? []);
    setFilters([]);
    setGroupBy('');
    setSortBy('');
    setAggregateFunction('count');
    setAggregateField('');
    setResult(null);
  };

  const toggleColumn = (key: string) =>
    setColumns((prev) => (prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]));

  const addFilter = () => {
    const first = object?.fields[0];
    if (!first) return;
    setFilters((prev) => [...prev, { field: first.key, operator: first.operators[0], value: '' }]);
  };
  const updateFilter = (i: number, patch: Partial<CrmReportFilterDto>) =>
    setFilters((prev) => prev.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));
  const removeFilter = (i: number) => setFilters((prev) => prev.filter((_, idx) => idx !== i));

  const activeFilters = () => filters.filter((f) => (f.value && f.value.trim()) || f.operator === 'exists');

  const chartConfigJson = () =>
    aggregateFunction !== 'count' && aggregateField
      ? JSON.stringify({ aggregateField, aggregateFunction })
      : undefined;

  const runPreview = () => {
    if (!object) return;
    preview.mutate(
      {
        objectType,
        columnsJson: JSON.stringify(columns),
        filtersJson: JSON.stringify(activeFilters()),
        groupBy: groupBy || undefined,
        sortBy: sortBy || undefined,
        pageSize: 20,
        aggregateField: aggregateFunction !== 'count' ? aggregateField || undefined : undefined,
        aggregateFunction: aggregateFunction !== 'count' ? aggregateFunction : undefined,
      },
      { onSuccess: (data) => setResult(data) },
    );
  };

  const handleSave = () => {
    if (!name.trim() || !object) return;
    create.mutate(
      {
        name: name.trim(),
        reportType: groupBy ? 'Chart' : 'Tabular',
        objectType,
        columnsJson: JSON.stringify(columns),
        filtersJson: JSON.stringify(activeFilters()),
        groupBy: groupBy || undefined,
        sortBy: sortBy || undefined,
        chartConfigJson: chartConfigJson(),
      },
      { onSuccess: () => onDone() },
    );
  };

  if (!object) return null;

  return (
    <div className="bg-glass-1 border border-brand rounded-2xl p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="text-base font-bold text-text-primary">New report</div>
        <button onClick={onCancel} className="text-text-muted hover:text-text-primary"><X className="w-5 h-5" /></button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold uppercase tracking-[2px] text-text-muted block mb-2">Report name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Open deals by owner" className={inputCls} />
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-[2px] text-text-muted block mb-2">Object</label>
          <select value={objectType} onChange={(e) => changeObject(e.target.value)} className={selectCls}>
            {catalog.map((o) => <option key={o.objectType} value={o.objectType} className="bg-bg">{o.label}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs font-bold uppercase tracking-[2px] text-text-muted block mb-2">Columns</label>
        <div className="flex flex-wrap gap-2">
          {object.fields.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => toggleColumn(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                columns.includes(f.key)
                  ? 'bg-brand text-white border-brand'
                  : 'bg-glass-2 border-border-medium text-text-secondary hover:text-text-primary'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold uppercase tracking-[2px] text-text-muted">Filters</label>
          <button onClick={addFilter} className="flex items-center gap-1 text-xs font-semibold text-brand hover:text-brand-dark">
            <Plus className="w-3.5 h-3.5" /> Add filter
          </button>
        </div>
        {filters.length === 0 ? (
          <div className="text-xs text-text-muted">No filters — report includes every record.</div>
        ) : (
          <div className="space-y-2">
            {filters.map((f, i) => {
              const field = object.fields.find((of) => of.key === f.field) ?? object.fields[0];
              return (
                <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2">
                  <select
                    value={f.field}
                    onChange={(e) => {
                      const nf = object.fields.find((of) => of.key === e.target.value);
                      updateFilter(i, { field: e.target.value, operator: nf?.operators[0] ?? 'eq', value: '' });
                    }}
                    className={selectCls}
                  >
                    {object.fields.map((of) => <option key={of.key} value={of.key} className="bg-bg">{of.label}</option>)}
                  </select>
                  <select value={f.operator} onChange={(e) => updateFilter(i, { operator: e.target.value })} className={selectCls}>
                    {field.operators.map((op) => <option key={op} value={op} className="bg-bg">{op}</option>)}
                  </select>
                  {field.type === 'enum' && field.enumValues ? (
                    <select value={f.value ?? ''} onChange={(e) => updateFilter(i, { value: e.target.value })} className={selectCls}>
                      <option value="" className="bg-bg">Select...</option>
                      {field.enumValues.map((v) => <option key={v} value={v} className="bg-bg">{v}</option>)}
                    </select>
                  ) : (
                    <input
                      value={f.value ?? ''}
                      onChange={(e) => updateFilter(i, { value: e.target.value })}
                      disabled={f.operator === 'exists'}
                      placeholder="Value..."
                      className={`${inputCls} disabled:opacity-40`}
                    />
                  )}
                  <button onClick={() => removeFilter(i)} className="p-2 rounded-lg text-text-muted hover:text-danger hover:bg-danger-soft transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold uppercase tracking-[2px] text-text-muted block mb-2">Group by <span className="opacity-40">(for chart)</span></label>
          <select value={groupBy} onChange={(e) => setGroupBy(e.target.value)} className={selectCls}>
            <option value="" className="bg-bg">None</option>
            {object.fields.map((f) => <option key={f.key} value={f.key} className="bg-bg">{f.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-[2px] text-text-muted block mb-2">Sort by</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={selectCls}>
            <option value="" className="bg-bg">Default</option>
            {object.fields.map((f) => <option key={f.key} value={`${f.key} desc`} className="bg-bg">{f.label} (desc)</option>)}
          </select>
        </div>
      </div>

      {groupBy && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-[2px] text-text-muted block mb-2">Chart value</label>
            <select value={aggregateFunction} onChange={(e) => setAggregateFunction(e.target.value)} className={selectCls}>
              {AGGREGATE_FUNCTIONS.map((f) => <option key={f} value={f} className="bg-bg">{f === 'count' ? 'Count of records' : f.toUpperCase()}</option>)}
            </select>
          </div>
          {aggregateFunction !== 'count' && (
            <div>
              <label className="text-xs font-bold uppercase tracking-[2px] text-text-muted block mb-2">Of field</label>
              <select value={aggregateField} onChange={(e) => setAggregateField(e.target.value)} className={selectCls}>
                <option value="" className="bg-bg">Select numeric field...</option>
                {numericFields.map((f) => <option key={f.key} value={f.key} className="bg-bg">{f.label}</option>)}
              </select>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={runPreview}
          disabled={preview.isPending || columns.length === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-glass-2 border border-border-medium text-text-primary hover:bg-glass-3 disabled:opacity-50"
        >
          {preview.isPending
            ? <span className="w-4 h-4 border-2 border-text-muted/30 border-t-text-muted rounded-full animate-spin" />
            : <Play className="w-4 h-4" />}
          Preview
        </button>
        <span className="text-xs text-text-muted">{columns.length} column(s) selected</span>
      </div>

      {result && <ReportResultView result={result} />}

      <div className="flex justify-end gap-3 pt-2 border-t border-border-subtle">
        <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm font-semibold bg-glass-2 border border-border-medium text-text-secondary hover:text-text-primary">Cancel</button>
        <button
          onClick={handleSave}
          disabled={!name.trim() || create.isPending}
          className="px-5 py-2 rounded-lg text-sm font-bold bg-gradient-to-br from-brand to-brand-dark text-white hover:brightness-110 disabled:opacity-50"
        >
          Save report
        </button>
      </div>
    </div>
  );
}

// ── Result view (shared by builder preview, saved-report run, and dashboard widgets) ──
export function ReportResultView({ result, variant = 'table' }: { result: CrmReportRunResultDto; variant?: 'table' | 'metric' }) {
  const chart = result.chartData ?? [];
  const max = Math.max(...chart.map((p) => p.value), 1);

  if (variant === 'metric') {
    const single = singleMetricValue(result);
    if (single) return <MetricTile label={single.label} value={single.value} />;
  }

  return (
    <div className="border border-border-subtle rounded-xl overflow-hidden">
      {chart.length > 0 && (
        <div className="p-4 border-b border-border-subtle space-y-1.5">
          {chart.slice(0, 10).map((p) => (
            <div key={p.label} className="flex items-center gap-2 text-xs">
              <span className="w-32 truncate text-text-secondary">{p.label}</span>
              <div className="flex-1 h-4 rounded bg-glass-2 overflow-hidden">
                <div className="h-full bg-brand" style={{ width: `${(p.value / max) * 100}%` }} />
              </div>
              <span className="w-16 text-right font-semibold text-text-primary">{formatAggregateValue(p.value)}</span>
            </div>
          ))}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-glass-2">
              {result.columns.map((c) => (
                <th key={c} className="px-3 py-2 text-left font-bold text-text-muted uppercase tracking-wider">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.rows.map((row, i) => (
              <tr key={i} className="border-t border-border-subtle">
                {result.columns.map((c) => (
                  <td key={c} className="px-3 py-2 text-text-primary">{formatCell(row[c])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {result.rows.length === 0 && <div className="p-6 text-center text-xs text-text-muted">No matching records.</div>}
      </div>
      <div className="px-3 py-2 text-xs text-text-muted border-t border-border-subtle">{result.totalCount} total record(s)</div>
    </div>
  );
}

function singleMetricValue(result: CrmReportRunResultDto): { label: string; value: string } | null {
  const chart = result.chartData ?? [];
  if (chart.length === 1) return { label: chart[0].label, value: formatAggregateValue(chart[0].value) };
  if (result.rows.length === 1 && result.columns.length === 1) {
    const col = result.columns[0];
    return { label: col, value: formatCell(result.rows[0][col]) };
  }
  return null;
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="text-4xl font-extrabold text-text-primary">{value}</div>
      <div className="text-xs font-semibold uppercase tracking-wider text-text-muted mt-2">{label}</div>
    </div>
  );
}

function formatAggregateValue(v: number): string {
  return Number.isInteger(v) ? v.toLocaleString() : v.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function formatCell(v: unknown): string {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  return String(v);
}

// ── Saved report row ─────────────────────────────────────────────────────────
function ReportRow({ report }: { report: CrmReportDto }) {
  const del = useDeleteReport();
  const runReport = useRunReport();
  const [expanded, setExpanded] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [result, setResult] = useState<CrmReportRunResultDto | null>(null);

  const handleRun = () => {
    setExpanded(true);
    runReport.mutate({ id: report.id }, { onSuccess: (data) => setResult(data) });
  };

  return (
    <div className="bg-glass-1 border border-border-subtle rounded-2xl overflow-hidden">
      <div className="flex items-center gap-4 px-5 py-4">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-text-primary">{report.name}</div>
          <div className="text-xs text-text-muted mt-0.5">{report.objectType} · {report.reportType}</div>
        </div>
        <button onClick={handleRun} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-glass-2 border border-border-medium text-text-primary hover:bg-glass-3">
          <Play className="w-3.5 h-3.5" /> Run
        </button>
        <button
          onClick={() => downloadReportCsv(report.id, `${report.name}.csv`)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-glass-2 border border-border-medium text-text-primary hover:bg-glass-3"
        >
          <Download className="w-3.5 h-3.5" /> Download
        </button>
        <button onClick={() => setShowSchedule((s) => !s)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-glass-2 border border-border-medium text-text-primary hover:bg-glass-3">
          <Calendar className="w-3.5 h-3.5" /> Schedule
        </button>
        <button
          onClick={() => confirmDialog({ message: `Delete report "${report.name}"?`, confirmText: 'Delete', danger: true })
            .then((ok) => { if (ok) del.mutate(report.id); })}
          className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger-soft transition-all"
        >
          <Trash2 className="w-4 h-4" />
        </button>
        {expanded && (
          <button onClick={() => setExpanded(false)} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-glass-2">
            <ChevronUp className="w-4 h-4" />
          </button>
        )}
      </div>
      {showSchedule && <ScheduleForm reportId={report.id} onDone={() => setShowSchedule(false)} />}
      {expanded && (
        <div className="border-t border-border-subtle p-4">
          {runReport.isPending ? (
            <div className="text-xs text-text-muted text-center py-4">Running...</div>
          ) : result ? (
            <ReportResultView result={result} />
          ) : null}
        </div>
      )}
    </div>
  );
}

// ── Schedule form ─────────────────────────────────────────────────────────────
function ScheduleForm({ reportId, onDone }: { reportId: string; onDone: () => void }) {
  const schedule = useScheduleReport();
  const [frequency, setFrequency] = useState<string>('Daily');
  const [emails, setEmails] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emails.trim()) return;
    schedule.mutate(
      { id: reportId, data: { reportId, frequency, recipientEmails: emails.trim(), exportFormat: 'Csv' } },
      { onSuccess: () => onDone() },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="border-t border-border-subtle p-4 flex items-center gap-3">
      <select value={frequency} onChange={(e) => setFrequency(e.target.value)} className={`${selectCls} w-32`}>
        {REPORT_SCHEDULE_FREQUENCIES.map((f) => <option key={f} value={f} className="bg-bg">{f}</option>)}
      </select>
      <input
        value={emails}
        onChange={(e) => setEmails(e.target.value)}
        placeholder="recipient@company.com, another@company.com"
        className={`${inputCls} flex-1`}
      />
      <button
        type="submit"
        disabled={schedule.isPending || !emails.trim()}
        className="px-4 py-2 rounded-lg text-sm font-bold bg-brand text-white hover:brightness-110 disabled:opacity-50"
      >
        Save
      </button>
    </form>
  );
}
