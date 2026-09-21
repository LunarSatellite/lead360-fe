// ── Field catalog ────────────────────────────────────────────────────────────

export interface CrmReportFieldDto {
  key: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'bool' | 'enum' | 'guid';
  operators: string[];
  enumValues?: string[] | null;
}

export interface CrmReportObjectDto {
  objectType: string;
  label: string;
  fields: CrmReportFieldDto[];
}

// ── Report definitions ───────────────────────────────────────────────────────

export interface CrmReportFilterDto {
  field: string;
  operator: string;
  value?: string | null;
  values?: string[] | null;
}

export interface CrmReportDto {
  id: string;
  name: string;
  description?: string | null;
  reportType: string;
  objectType?: string | null;
  columnsJson?: string | null;
  filtersJson?: string | null;
  groupBy?: string | null;
  sortBy?: string | null;
  chartConfigJson?: string | null;
  isPublic: boolean;
  folderId?: string | null;
  createdAt: string;
}

export interface CreateReportRequest {
  name: string;
  description?: string | null;
  reportType?: string;
  objectType?: string | null;
  columnsJson?: string | null;
  filtersJson?: string | null;
  groupBy?: string | null;
  sortBy?: string | null;
  chartConfigJson?: string | null;
  isPublic?: boolean;
  folderId?: string | null;
}

export interface CrmReportScheduleDto {
  id: string;
  reportId: string;
  frequency: string;
  cronExpression?: string | null;
  recipientEmails?: string | null;
  exportFormat?: string | null;
  isActive: boolean;
  lastRunAt?: string | null;
  nextRunAt?: string | null;
  createdAt: string;
}

export interface CreateReportScheduleRequest {
  reportId: string;
  frequency?: string;
  recipientEmails?: string | null;
  exportFormat?: string | null;
}

// ── Run / preview ────────────────────────────────────────────────────────────

export interface CrmReportRunRequest {
  objectType: string;
  columnsJson?: string | null;
  filtersJson?: string | null;
  groupBy?: string | null;
  sortBy?: string | null;
  page?: number;
  pageSize?: number;
  aggregateField?: string | null;
  aggregateFunction?: string | null;
}

export interface CrmReportChartPointDto {
  label: string;
  value: number;
}

export interface CrmReportChartConfigDto {
  aggregateField?: string | null;
  aggregateFunction?: string | null;
}

export const AGGREGATE_FUNCTIONS = ['count', 'sum', 'avg', 'min', 'max'] as const;

export interface CrmReportRunResultDto {
  columns: string[];
  rows: Record<string, unknown>[];
  totalCount: number;
  page: number;
  pageSize: number;
  chartData?: CrmReportChartPointDto[] | null;
}

// ── Dashboards ────────────────────────────────────────────────────────────────

export interface CrmDashboardDto {
  id: string;
  name: string;
  description?: string | null;
  isDefault: boolean;
  isPublic: boolean;
  layoutConfigJson?: string | null;
  createdAt: string;
}

export interface CrmDashboardWidgetDto {
  id: string;
  dashboardId: string;
  title: string;
  widgetType: string;
  configJson?: string | null;
  reportId?: string | null;
  metricKey?: string | null;
  column: number;
  row: number;
  width: number;
  height: number;
  createdAt: string;
}

export interface CrmDashboardMetricDto {
  key: string;
  label: string;
}

export interface CrmDashboardDetailDto extends CrmDashboardDto {
  widgets: CrmDashboardWidgetDto[];
}

export interface CreateDashboardRequest {
  name: string;
  description?: string | null;
  isDefault?: boolean;
  isPublic?: boolean;
}

export interface CreateDashboardWidgetRequest {
  dashboardId: string;
  title: string;
  widgetType: string;
  configJson?: string | null;
  reportId?: string | null;
  metricKey?: string | null;
  column?: number;
  row?: number;
  width?: number;
  height?: number;
}

export interface CrmDashboardWidgetDataDto {
  widgetId: string;
  title: string;
  widgetType: string;
  report?: CrmReportRunResultDto | null;
  message?: string | null;
}

export const WIDGET_TYPES = ['Metric', 'Chart', 'Table', 'List', 'Gauge', 'Funnel', 'Pipeline', 'Heatmap'] as const;
export const REPORT_SCHEDULE_FREQUENCIES = ['Daily', 'Weekly', 'Monthly', 'Quarterly'] as const;
