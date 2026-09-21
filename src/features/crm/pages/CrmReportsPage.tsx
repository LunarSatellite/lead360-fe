import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { confirmDialog } from '@/shared/ui/confirm';
import { toast } from 'sonner';
import { Plus, Play, Calendar, Trash2, ChevronUp, ChevronDown, FileBarChart, X, Download, LayoutGrid } from 'lucide-react';
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

export function Component() {
  const { data: catalogRaw } = useReportCatalog();
  const catalog: CrmReportObjectDto[] = (Array.isArray(catalogRaw)
    ? catalogRaw
    : (catalogRaw as { items: CrmReportObjectDto[] } | undefined)?.items) ?? [];
  const { data: reportsRaw, isLoading } = useReports();
  const reports: CrmReportDto[] = (Array.isArray(reportsRaw)
    ? reportsRaw
    : (reportsRaw as { items: CrmReportDto[] } | undefined)?.items) ?? [];
  const [showBuilder, setShowBuilder] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">Reports</h1>
          <p className="text-base text-text-secondary mt-1">Build a custom view over any CRM object — filter, group, chart, and schedule delivery</p>
        </div>
        <button
          onClick={() => setShowBuilder(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-bg bg-brand hover:bg-brand-light transition-all"
        >
          <Plus className="w-3.5 h-3.5" /> New report
        </button>
      </div>

      {showBuilder && catalog && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-end pr-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowBuilder(false)} />
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
            {/* Accent bar */}
            <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, #00D98A 35%, #00FFA3 65%, transparent)', flexShrink: 0 }} />
            <ReportBuilder catalog={catalog} onDone={() => setShowBuilder(false)} onCancel={() => setShowBuilder(false)} />
          </div>
        </div>,
        document.body,
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
  const [objectOpen, setObjectOpen] = useState(false);
  const objectDropRef = useRef<HTMLDivElement>(null);
  const [groupByOpen, setGroupByOpen] = useState(false);
  const groupByDropRef = useRef<HTMLDivElement>(null);
  const [sortByOpen, setSortByOpen] = useState(false);
  const sortByDropRef = useRef<HTMLDivElement>(null);

  const numericFields = object?.fields.filter((f) => f.type === 'number') ?? [];

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (objectDropRef.current && !objectDropRef.current.contains(e.target as Node)) setObjectOpen(false);
      if (groupByDropRef.current && !groupByDropRef.current.contains(e.target as Node)) setGroupByOpen(false);
      if (sortByDropRef.current && !sortByDropRef.current.contains(e.target as Node)) setSortByOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const changeObject = (ot: string) => {
    setObjectType(ot);
    setObjectOpen(false);
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
    <div className="flex flex-col" style={{ height: 'calc(100vh - 32px)' }}>
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 px-6 pt-4 pb-3 bg-bg-card border-b border-border-subtle">
        <div className="flex items-start justify-between">
          <div>
            <h2
              className="text-base font-extrabold leading-tight"
              style={{
                background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--primary) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >New report</h2>
            <p className="text-xs text-text-muted mt-0.5">Build a custom view over any CRM object</p>
          </div>
          <button onClick={onCancel} className="text-text-muted hover:text-text-primary mt-0.5">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
        {/* Report Name + Object */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="grid grid-cols-[auto_1fr] items-center gap-2 mb-1.5">
              <span className="text-[10px] font-bold text-brand uppercase tracking-widest">Report Name</span>
              <div className="h-px bg-brand/20" />
            </div>
            <div className="relative">
              <FileBarChart className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Open deals by owner"
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)] transition-colors"
                style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }}
              />
            </div>
          </div>
          <div>
            <div className="grid grid-cols-[auto_1fr] items-center gap-2 mb-1.5">
              <span className="text-[10px] font-bold text-brand uppercase tracking-widest">Object</span>
              <div className="h-px bg-brand/20" />
            </div>
            {/* Custom dropdown */}
            <div className="relative" ref={objectDropRef}>
              <button
                type="button"
                onClick={() => setObjectOpen(o => !o)}
                className="w-full flex items-center gap-2 pl-3 pr-3 py-2 rounded-xl text-sm text-text-primary"
                style={{
                  backgroundColor: '#1A2F27',
                  backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)',
                  border: `1px solid ${objectOpen ? 'rgba(0,217,138,0.50)' : 'rgba(0,217,138,0.20)'}`,
                  boxShadow: objectOpen ? '0 0 0 1px rgba(0,217,138,0.50), 0 0 10px rgba(0,217,138,0.20), 0 0 20px rgba(0,217,138,0.08)' : 'none',
                  outline: 'none',
                  transition: 'box-shadow 0.2s ease',
                }}
              >
                <LayoutGrid className="w-3.5 h-3.5 text-text-muted shrink-0" strokeWidth={1.6} />
                <span className="flex-1 text-left font-medium text-text-secondary">
                  {catalog.find(o => o.objectType === objectType)?.label ?? objectType}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-text-muted transition-transform duration-200 ${objectOpen ? 'rotate-180' : ''}`} strokeWidth={1.6} />
              </button>
              {objectOpen && (
                <div
                  className="absolute top-full left-0 right-0 mt-1.5 z-20 overflow-hidden max-h-[240px] overflow-y-auto"
                  style={{
                    borderRadius: 12,
                    background: 'var(--bg-card)',
                    border: '1px solid rgba(0,217,138,0.20)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 12px rgba(0,217,138,0.08)',
                  }}
                >
                  {catalog.map((o) => (
                    <button
                      key={o.objectType}
                      type="button"
                      onClick={() => changeObject(o.objectType)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium transition-colors hover:bg-glass-1 ${
                        objectType === o.objectType ? 'bg-[rgba(0,217,138,0.08)] text-brand' : 'text-text-secondary'
                      }`}
                    >
                      {objectType === o.objectType && (
                        <span className="w-2 h-2 rounded-full bg-brand shrink-0" style={{ boxShadow: '0 0 6px rgba(0,217,138,0.9)' }} />
                      )}
                      {o.label}
                      {objectType === o.objectType && <span className="ml-auto text-[10px] font-bold text-text-muted">selected</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Columns */}
        <div>
          <div className="grid grid-cols-[auto_1fr] items-center gap-2 mb-1.5">
            <span className="text-[10px] font-bold text-brand uppercase tracking-widest">Columns</span>
            <div className="h-px bg-brand/20" />
          </div>
          <div className="flex flex-wrap gap-2">
            {object.fields.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => toggleColumn(f.key)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
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

        {/* Filters */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="grid grid-cols-[auto_1fr] items-center gap-2">
              <span className="text-[10px] font-bold text-brand uppercase tracking-widest">Filters</span>
              <div className="h-px bg-brand/20" />
            </div>
            <button onClick={addFilter} className="flex items-center gap-1 text-[10px] font-semibold text-brand hover:text-brand-dark">
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
                      className="w-full px-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary focus:outline-none focus:border-[rgba(0,217,138,0.50)] transition-colors cursor-pointer"
                      style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }}
                    >
                      {object.fields.map((of) => <option key={of.key} value={of.key} className="bg-bg">{of.label}</option>)}
                    </select>
                    <select
                      value={f.operator}
                      onChange={(e) => updateFilter(i, { operator: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary focus:outline-none focus:border-[rgba(0,217,138,0.50)] transition-colors cursor-pointer"
                      style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }}
                    >
                      {field.operators.map((op) => <option key={op} value={op} className="bg-bg">{op}</option>)}
                    </select>
                    {field.type === 'enum' && field.enumValues ? (
                      <select
                        value={f.value ?? ''}
                        onChange={(e) => updateFilter(i, { value: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary focus:outline-none focus:border-[rgba(0,217,138,0.50)] transition-colors cursor-pointer"
                        style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }}
                      >
                        <option value="" className="bg-bg">Select...</option>
                        {field.enumValues.map((v) => <option key={v} value={v} className="bg-bg">{v}</option>)}
                      </select>
                    ) : (
                      <input
                        value={f.value ?? ''}
                        onChange={(e) => updateFilter(i, { value: e.target.value })}
                        disabled={f.operator === 'exists'}
                        placeholder="Value..."
                        className="w-full pl-3 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)] transition-colors disabled:opacity-40"
                        style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }}
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

        {/* Group by + Sort by */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="grid grid-cols-[auto_1fr] items-center gap-2 mb-1.5">
              <span className="text-[10px] font-bold text-brand uppercase tracking-widest">Group by <span className="opacity-60 normal-case font-normal tracking-normal ml-1">(for chart)</span></span>
              <div className="h-px bg-brand/20" />
            </div>
            {/* Custom dropdown */}
            <div className="relative" ref={groupByDropRef}>
              <button
                type="button"
                onClick={() => setGroupByOpen(o => !o)}
                className="w-full flex items-center gap-2 pl-3 pr-3 py-2 rounded-xl text-sm text-text-primary"
                style={{
                  backgroundColor: '#1A2F27',
                  backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)',
                  border: `1px solid ${groupByOpen ? 'rgba(0,217,138,0.50)' : 'rgba(0,217,138,0.20)'}`,
                  boxShadow: groupByOpen ? '0 0 0 1px rgba(0,217,138,0.50), 0 0 10px rgba(0,217,138,0.20), 0 0 20px rgba(0,217,138,0.08)' : 'none',
                  outline: 'none',
                  transition: 'box-shadow 0.2s ease',
                }}
              >
                <span className="flex-1 text-left font-medium text-text-secondary">
                  {groupBy ? (object.fields.find(f => f.key === groupBy)?.label ?? groupBy) : 'None'}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-text-muted transition-transform duration-200 ${groupByOpen ? 'rotate-180' : ''}`} strokeWidth={1.6} />
              </button>
              {groupByOpen && (
                <div
                  className="absolute top-full left-0 right-0 mt-1.5 z-20 overflow-hidden max-h-[240px] overflow-y-auto"
                  style={{
                    borderRadius: 12,
                    background: 'var(--bg-card)',
                    border: '1px solid rgba(0,217,138,0.20)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 12px rgba(0,217,138,0.08)',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => { setGroupBy(''); setGroupByOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium transition-colors hover:bg-glass-1 ${!groupBy ? 'bg-[rgba(0,217,138,0.08)] text-brand' : 'text-text-secondary'}`}
                  >
                    {groupBy === '' && <span className="w-2 h-2 rounded-full bg-brand shrink-0" style={{ boxShadow: '0 0 6px rgba(0,217,138,0.9)' }} />}
                    None
                    {!groupBy && <span className="ml-auto text-[10px] font-bold text-text-muted">selected</span>}
                  </button>
                  {object.fields.map((f) => (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => { setGroupBy(f.key); setGroupByOpen(false); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium transition-colors hover:bg-glass-1 ${groupBy === f.key ? 'bg-[rgba(0,217,138,0.08)] text-brand' : 'text-text-secondary'}`}
                    >
                      {groupBy === f.key && <span className="w-2 h-2 rounded-full bg-brand shrink-0" style={{ boxShadow: '0 0 6px rgba(0,217,138,0.9)' }} />}
                      {f.label}
                      {groupBy === f.key && <span className="ml-auto text-[10px] font-bold text-text-muted">selected</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div>
            <div className="grid grid-cols-[auto_1fr] items-center gap-2 mb-1.5">
              <span className="text-[10px] font-bold text-brand uppercase tracking-widest">Sort by</span>
              <div className="h-px bg-brand/20" />
            </div>
            {/* Custom dropdown */}
            <div className="relative" ref={sortByDropRef}>
              <button
                type="button"
                onClick={() => setSortByOpen(o => !o)}
                className="w-full flex items-center gap-2 pl-3 pr-3 py-2 rounded-xl text-sm text-text-primary"
                style={{
                  backgroundColor: '#1A2F27',
                  backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)',
                  border: `1px solid ${sortByOpen ? 'rgba(0,217,138,0.50)' : 'rgba(0,217,138,0.20)'}`,
                  boxShadow: sortByOpen ? '0 0 0 1px rgba(0,217,138,0.50), 0 0 10px rgba(0,217,138,0.20), 0 0 20px rgba(0,217,138,0.08)' : 'none',
                  outline: 'none',
                  transition: 'box-shadow 0.2s ease',
                }}
              >
                <span className="flex-1 text-left font-medium text-text-secondary">
                  {sortBy ? (object.fields.find(f => `${f.key} desc` === sortBy)?.label ?? sortBy) + ' (desc)' : 'Default'}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-text-muted transition-transform duration-200 ${sortByOpen ? 'rotate-180' : ''}`} strokeWidth={1.6} />
              </button>
              {sortByOpen && (
                <div
                  className="absolute top-full left-0 right-0 mt-1.5 z-20 overflow-hidden max-h-[240px] overflow-y-auto"
                  style={{
                    borderRadius: 12,
                    background: 'var(--bg-card)',
                    border: '1px solid rgba(0,217,138,0.20)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 12px rgba(0,217,138,0.08)',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => { setSortBy(''); setSortByOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium transition-colors hover:bg-glass-1 ${!sortBy ? 'bg-[rgba(0,217,138,0.08)] text-brand' : 'text-text-secondary'}`}
                  >
                    {sortBy === '' && <span className="w-2 h-2 rounded-full bg-brand shrink-0" style={{ boxShadow: '0 0 6px rgba(0,217,138,0.9)' }} />}
                    Default
                    {!sortBy && <span className="ml-auto text-[10px] font-bold text-text-muted">selected</span>}
                  </button>
                  {object.fields.map((f) => (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => { setSortBy(`${f.key} desc`); setSortByOpen(false); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium transition-colors hover:bg-glass-1 ${sortBy === `${f.key} desc` ? 'bg-[rgba(0,217,138,0.08)] text-brand' : 'text-text-secondary'}`}
                    >
                      {sortBy === `${f.key} desc` && <span className="w-2 h-2 rounded-full bg-brand shrink-0" style={{ boxShadow: '0 0 6px rgba(0,217,138,0.9)' }} />}
                      {f.label} (desc)
                      {sortBy === `${f.key} desc` && <span className="ml-auto text-[10px] font-bold text-text-muted">selected</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chart value + Of field */}
        {groupBy && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="grid grid-cols-[auto_1fr] items-center gap-2 mb-1.5">
                <span className="text-[10px] font-bold text-brand uppercase tracking-widest">Chart value</span>
                <div className="h-px bg-brand/20" />
              </div>
              <select
                value={aggregateFunction}
                onChange={(e) => setAggregateFunction(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary focus:outline-none focus:border-[rgba(0,217,138,0.50)] transition-colors cursor-pointer"
                style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }}
              >
                {AGGREGATE_FUNCTIONS.map((f) => <option key={f} value={f} className="bg-bg">{f === 'count' ? 'Count of records' : f.toUpperCase()}</option>)}
              </select>
            </div>
            {aggregateFunction !== 'count' && (
              <div>
                <div className="grid grid-cols-[auto_1fr] items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-bold text-brand uppercase tracking-widest">Of field</span>
                  <div className="h-px bg-brand/20" />
                </div>
                <select
                  value={aggregateField}
                  onChange={(e) => setAggregateField(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary focus:outline-none focus:border-[rgba(0,217,138,0.50)] transition-colors cursor-pointer"
                  style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }}
                >
                  <option value="" className="bg-bg">Select numeric field...</option>
                  {numericFields.map((f) => <option key={f.key} value={f.key} className="bg-bg">{f.label}</option>)}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Preview */}
        <div className="flex items-center gap-3">
          <button
            onClick={runPreview}
            disabled={preview.isPending || columns.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-glass-2 border border-border-medium text-text-primary hover:bg-glass-3 disabled:opacity-50 transition-all"
          >
            {preview.isPending
              ? <span className="w-4 h-4 border-2 border-text-muted/30 border-t-text-muted rounded-full animate-spin" />
              : <Play className="w-4 h-4" />}
            Preview
          </button>
          <span className="text-xs text-text-muted">{columns.length} column(s) selected</span>
        </div>

        {result && <ReportResultView result={result} />}
      </div>

      {/* Sticky Footer */}
      <div className="sticky bottom-0 z-10 flex items-center justify-end gap-3 px-6 py-4 border-t border-border-subtle bg-bg-card">
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-xl text-xs font-semibold text-text-secondary border border-border-subtle hover:border-border-medium hover:text-text-primary transition-all"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!name.trim() || create.isPending}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-bg bg-brand hover:bg-brand-light disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {create.isPending ? <span className="w-3.5 h-3.5 border-2 border-bg/30 border-t-bg rounded-full animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
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

  const handleSubmit = (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!emails.trim()) return;
    schedule.mutate(
      { id: reportId, data: { reportId, frequency, recipientEmails: emails.trim(), exportFormat: 'Csv' } },
      { onSuccess: () => onDone() },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="border-t border-border-subtle p-4 flex items-center gap-3">
      <select
        value={frequency}
        onChange={(e) => setFrequency(e.target.value)}
        className="w-32 px-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary focus:outline-none focus:border-[rgba(0,217,138,0.50)] transition-colors cursor-pointer"
        style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }}
      >
        {REPORT_SCHEDULE_FREQUENCIES.map((f) => <option key={f} value={f} className="bg-bg">{f}</option>)}
      </select>
      <input
        value={emails}
        onChange={(e) => setEmails(e.target.value)}
        placeholder="recipient@company.com, another@company.com"
        className="flex-1 pl-3 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)] transition-colors"
        style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }}
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
