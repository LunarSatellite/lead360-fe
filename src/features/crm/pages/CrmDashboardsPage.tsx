import { useState } from 'react';
import { confirmDialog } from '@/shared/ui/confirm';
import { GridLayout, useContainerWidth, noCompactor, type Layout, type LayoutItem } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { Plus, Trash2, X, LayoutPanelTop, ArrowLeft, RotateCw, GripVertical } from 'lucide-react';
import {
  useDashboards, useCreateDashboard, useDeleteDashboard,
  useDashboardById, useAddWidget, useUpdateWidgetLayout, useRemoveWidget,
  useReports, useWidgetData, useDashboardMetrics,
} from '../api/crm-reports.queries';
import { ReportResultView } from './CrmReportsPage';
import type { CrmDashboardDto, CrmDashboardWidgetDto, CrmDashboardMetricDto } from '../types/crm-reports.types';
import { WIDGET_TYPES } from '../types/crm-reports.types';

const inputCls = 'w-full px-3 py-2 rounded-lg bg-bg border border-border-subtle text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand transition-all';
const selectCls = inputCls;

export function Component() {
  const { data, isLoading } = useDashboards();
  const raw = data as unknown as any;
  const dashboards: CrmDashboardDto[] = Array.isArray(raw?.items)
    ? raw.items
    : Array.isArray(raw)
    ? raw
    : [];
  const [showCreate, setShowCreate] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  if (openId) return <DashboardDetail dashboardId={openId} onBack={() => setOpenId(null)} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">Dashboards</h1>
          <p className="text-base text-text-secondary mt-1">Arrange your saved reports into a live dashboard</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold bg-gradient-to-br from-brand to-brand-dark text-white hover:brightness-110 transition-all"
        >
          <Plus className="w-4 h-4" /> New dashboard
        </button>
      </div>

      {showCreate && <CreateDashboardForm onDone={() => setShowCreate(false)} onCancel={() => setShowCreate(false)} />}

      {isLoading ? (
        <div className="p-8 text-center text-sm text-text-muted">Loading dashboards...</div>
      ) : dashboards.length === 0 && !showCreate ? (
        <div className="bg-glass-1 border border-border-subtle rounded-2xl p-12 text-center">
          <LayoutPanelTop className="w-10 h-10 text-text-muted mx-auto mb-3" />
          <div className="text-base font-bold text-text-primary mb-1">No dashboards yet</div>
          <div className="text-sm text-text-muted">Create a dashboard, then add saved reports as widgets.</div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {dashboards.map((d) => <DashboardCard key={d.id} dashboard={d} onOpen={() => setOpenId(d.id)} />)}
        </div>
      )}
    </div>
  );
}

function CreateDashboardForm({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const create = useCreateDashboard();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    create.mutate({ name: name.trim(), description: description.trim() || undefined }, { onSuccess: () => onDone() });
  };

  return (
    <div className="bg-glass-1 border border-brand rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-base font-bold text-text-primary">New dashboard</div>
        <button onClick={onCancel} className="text-text-muted hover:text-text-primary"><X className="w-5 h-5" /></button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-bold uppercase tracking-[2px] text-text-muted block mb-2">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sales Overview" className={inputCls} />
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-[2px] text-text-muted block mb-2">Description <span className="opacity-40">(optional)</span></label>
          <input value={description} onChange={(e) => setDescription(e.target.value)} className={inputCls} />
        </div>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg text-sm font-semibold bg-glass-2 border border-border-medium text-text-secondary hover:text-text-primary">Cancel</button>
          <button type="submit" disabled={create.isPending || !name.trim()} className="px-5 py-2 rounded-lg text-sm font-bold bg-gradient-to-br from-brand to-brand-dark text-white hover:brightness-110 disabled:opacity-50">
            Create dashboard
          </button>
        </div>
      </form>
    </div>
  );
}

function DashboardCard({ dashboard, onOpen }: { dashboard: CrmDashboardDto; onOpen: () => void }) {
  const del = useDeleteDashboard();
  return (
    <div className="bg-glass-1 border border-border-subtle rounded-2xl p-5 flex items-center gap-4 cursor-pointer hover:border-brand transition-all" onClick={onOpen}>
      <div className="w-10 h-10 rounded-xl bg-glass-2 border border-border-medium flex items-center justify-center flex-shrink-0">
        <LayoutPanelTop className="w-5 h-5 text-brand" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold text-text-primary flex items-center gap-2">
          {dashboard.name}
          {dashboard.isDefault && <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-brand/10 text-brand">Default</span>}
        </div>
        {dashboard.description && <div className="text-xs text-text-muted mt-0.5">{dashboard.description}</div>}
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          confirmDialog({ message: `Delete dashboard "${dashboard.name}"?`, confirmText: 'Delete', danger: true })
            .then((ok) => { if (ok) del.mutate(dashboard.id); });
        }}
        className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger-soft transition-all flex-shrink-0"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

// ── Dashboard detail (widget grid) ───────────────────────────────────────────
function DashboardDetail({ dashboardId, onBack }: { dashboardId: string; onBack: () => void }) {
  const { data: dashboard, isLoading } = useDashboardById(dashboardId);
  const [showAddWidget, setShowAddWidget] = useState(false);
  const updateLayout = useUpdateWidgetLayout(dashboardId);
  const { width, containerRef } = useContainerWidth();

  const layout: Layout = (dashboard?.widgets ?? []).map((w) => ({
    i: w.id, x: w.column, y: w.row, w: w.width, h: w.height,
  }));

  const persistItem = (item: LayoutItem | null) => {
    if (!item) return;
    updateLayout.mutate({ id: item.i, column: item.x, row: item.y, width: item.w, height: item.h });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-glass-2 transition-all">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-extrabold text-text-primary tracking-tight">{dashboard?.name ?? 'Dashboard'}</h1>
          {dashboard?.description && <p className="text-sm text-text-secondary mt-0.5">{dashboard.description}</p>}
        </div>
        <button
          onClick={() => setShowAddWidget(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-gradient-to-br from-brand to-brand-dark text-white hover:brightness-110 transition-all"
        >
          <Plus className="w-4 h-4" /> Add widget
        </button>
      </div>

      {showAddWidget && (
        <AddWidgetForm
          dashboardId={dashboardId}
          existingWidgets={dashboard?.widgets ?? []}
          onDone={() => setShowAddWidget(false)}
          onCancel={() => setShowAddWidget(false)}
        />
      )}

      {isLoading ? (
        <div className="p-8 text-center text-sm text-text-muted">Loading...</div>
      ) : !dashboard || dashboard.widgets.length === 0 ? (
        <div className="bg-glass-1 border border-border-subtle rounded-2xl p-12 text-center">
          <div className="text-sm text-text-muted">No widgets yet — add one bound to a saved report.</div>
        </div>
      ) : (
        <div ref={containerRef}>
          <GridLayout
            layout={layout}
            width={width}
            gridConfig={{ cols: 12, rowHeight: 60, margin: [16, 16] as [number, number] }}
            dragConfig={{ enabled: true, handle: '.widget-drag-handle' }}
            resizeConfig={{ enabled: true }}
            compactor={noCompactor}
            onLayoutChange={() => {}}
            onDragStop={(_layout, _oldItem, newItem) => persistItem(newItem)}
            onResizeStop={(_layout, _oldItem, newItem) => persistItem(newItem)}
          >
            {dashboard.widgets.map((w) => (
              <div key={w.id}>
                <WidgetCard widget={w} dashboardId={dashboardId} />
              </div>
            ))}
          </GridLayout>
        </div>
      )}
    </div>
  );
}

function AddWidgetForm({ dashboardId, existingWidgets, onDone, onCancel }: {
  dashboardId: string; existingWidgets: CrmDashboardWidgetDto[]; onDone: () => void; onCancel: () => void;
}) {
  const addWidget = useAddWidget(dashboardId);
  const { data: reportsData } = useReports();
  const { data: metricsRaw } = useDashboardMetrics();
  const metrics: CrmDashboardMetricDto[] = (Array.isArray(metricsRaw)
    ? metricsRaw
    : (metricsRaw as { items: CrmDashboardMetricDto[] } | undefined)?.items) ?? [];

  const reports: any[] = Array.isArray(reportsData) ? reportsData : [];

  const [source, setSource] = useState<'report' | 'metric'>('report');
  const [title, setTitle] = useState('');
  const [widgetType, setWidgetType] = useState<string>('Table');
  const [reportId, setReportId] = useState('');
  const [metricKey, setMetricKey] = useState('');

  const isValid = title.trim() && (source === 'report' ? !!reportId : !!metricKey);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    const nextRow = existingWidgets.reduce((max, w) => Math.max(max, w.row + w.height), 0);
    addWidget.mutate(
      {
        dashboardId, title: title.trim(), widgetType,
        reportId: source === 'report' ? reportId : undefined,
        metricKey: source === 'metric' ? metricKey : undefined,
        column: 0, row: nextRow, width: 6, height: 4,
      },
      { onSuccess: () => onDone() },
    );
  };

  return (
    <div className="bg-glass-1 border border-brand rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-base font-bold text-text-primary">Add widget</div>
        <button onClick={onCancel} className="text-text-muted hover:text-text-primary"><X className="w-5 h-5" /></button>
      </div>
      {reports.length === 0 && metrics.length === 0 ? (
        <div className="text-sm text-text-muted">You need at least one saved report first — build one on the Reports page.</div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSource('report')}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold border transition-all ${source === 'report' ? 'bg-brand text-white border-brand' : 'bg-glass-2 border-border-medium text-text-secondary'}`}
            >
              Saved report
            </button>
            <button
              type="button"
              onClick={() => setSource('metric')}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold border transition-all ${source === 'metric' ? 'bg-brand text-white border-brand' : 'bg-glass-2 border-border-medium text-text-secondary'}`}
            >
              Built-in metric
            </button>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="text-xs font-bold uppercase tracking-[2px] text-text-muted block mb-2">Title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Open deals" className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-[2px] text-text-muted block mb-2">Widget type</label>
              <select value={widgetType} onChange={(e) => setWidgetType(e.target.value)} className={selectCls}>
                {WIDGET_TYPES.map((t) => <option key={t} value={t} className="bg-bg">{t}</option>)}
              </select>
            </div>
          </div>
          {source === 'report' ? (
            <div>
              <label className="text-xs font-bold uppercase tracking-[2px] text-text-muted block mb-2">Report</label>
              <select value={reportId} onChange={(e) => setReportId(e.target.value)} className={selectCls}>
                <option value="" className="bg-bg">Select a saved report...</option>
                {reports.map((r) => <option key={r.id} value={r.id} className="bg-bg">{r.name}</option>)}
              </select>
            </div>
          ) : (
            <div>
              <label className="text-xs font-bold uppercase tracking-[2px] text-text-muted block mb-2">Metric</label>
              <select value={metricKey} onChange={(e) => setMetricKey(e.target.value)} className={selectCls}>
                <option value="" className="bg-bg">Select a built-in metric...</option>
                {metrics.map((m) => <option key={m.key} value={m.key} className="bg-bg">{m.label}</option>)}
              </select>
            </div>
          )}
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg text-sm font-semibold bg-glass-2 border border-border-medium text-text-secondary hover:text-text-primary">Cancel</button>
            <button type="submit" disabled={addWidget.isPending || !isValid} className="px-5 py-2 rounded-lg text-sm font-bold bg-gradient-to-br from-brand to-brand-dark text-white hover:brightness-110 disabled:opacity-50">
              Add widget
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function WidgetCard({ widget, dashboardId }: { widget: CrmDashboardWidgetDto; dashboardId: string }) {
  const { data, isLoading, refetch, isFetching } = useWidgetData(widget.id);
  const removeWidget = useRemoveWidget(dashboardId);

  return (
    <div className="h-full flex flex-col bg-glass-1 border border-border-subtle rounded-2xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border-subtle">
        <span className="widget-drag-handle cursor-move p-1 -ml-1 rounded hover:bg-glass-2 text-text-muted flex-shrink-0" title="Drag to move">
          <GripVertical className="w-4 h-4" />
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-text-primary truncate">{widget.title}</div>
          <div className="text-xs text-text-muted">{widget.widgetType}</div>
        </div>
        <button onClick={() => refetch()} disabled={isFetching} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-glass-2 transition-all">
          <RotateCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
        </button>
        <button
          onClick={() => confirmDialog({ message: `Remove widget "${widget.title}"?`, confirmText: 'Remove', danger: true })
            .then((ok) => { if (ok) removeWidget.mutate(widget.id); })}
          className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger-soft transition-all"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 flex-1 overflow-auto">
        {isLoading ? (
          <div className="text-xs text-text-muted text-center py-6">Loading...</div>
        ) : !data?.report ? (
          <div className="text-xs text-text-muted text-center py-6">{data?.message ?? 'No data.'}</div>
        ) : (
          <ReportResultView result={data.report} variant={widget.widgetType === 'Metric' ? 'metric' : 'table'} />
        )}
      </div>
    </div>
  );
}
