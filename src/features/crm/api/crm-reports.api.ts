import { apiClient } from '@/shared/lib/api-client';
import type {
  CrmReportObjectDto,
  CrmReportDto,
  CreateReportRequest,
  CrmReportScheduleDto,
  CreateReportScheduleRequest,
  CrmReportRunRequest,
  CrmReportRunResultDto,
  CrmDashboardDto,
  CrmDashboardDetailDto,
  CreateDashboardRequest,
  CrmDashboardWidgetDto,
  CreateDashboardWidgetRequest,
  CrmDashboardWidgetDataDto,
  CrmDashboardMetricDto,
} from '../types/crm-reports.types';

const BASE = '/v1/crm';

// api-client's response interceptor unwraps the backend's ServiceResult<T> envelope down to
// `result.data` only. For paged list endpoints, BaseController.ToActionResult(Task<PagedServiceResult<T>>)
// puts totalCount/pageNumber/pageSize as SIBLINGS of `data`, not nested inside it — so `data` is
// just the bare item array, and the interceptor throws the pagination fields away. These two
// methods resolve to a plain array at runtime, not { items, totalCount, ... }.
export const crmReportsApi = {
  // ── Field catalog ──────────────────────────────────────────────────────
  getCatalog: (): Promise<CrmReportObjectDto[]> =>
    apiClient.get(`${BASE}/reports/catalog`) as unknown as Promise<CrmReportObjectDto[]>,

  // ── Reports ─────────────────────────────────────────────────────────────
  getReports: (page = 1, pageSize = 50): Promise<CrmReportDto[]> =>
    apiClient.get(`${BASE}/reports`, { params: { page, pageSize } }) as unknown as Promise<CrmReportDto[]>,

  createReport: (data: CreateReportRequest): Promise<CrmReportDto> =>
    apiClient.post(`${BASE}/reports`, data) as unknown as Promise<CrmReportDto>,

  updateReport: (id: string, data: CreateReportRequest): Promise<CrmReportDto> =>
    apiClient.put(`${BASE}/reports/${id}`, data) as unknown as Promise<CrmReportDto>,

  deleteReport: (id: string): Promise<void> =>
    apiClient.delete(`${BASE}/reports/${id}`) as unknown as Promise<void>,

  previewReport: (data: CrmReportRunRequest): Promise<CrmReportRunResultDto> =>
    apiClient.post(`${BASE}/reports/preview`, data) as unknown as Promise<CrmReportRunResultDto>,

  runReport: (id: string, page = 1, pageSize = 50): Promise<CrmReportRunResultDto> =>
    apiClient.get(`${BASE}/reports/${id}/run`, { params: { page, pageSize } }) as unknown as Promise<CrmReportRunResultDto>,

  scheduleReport: (id: string, data: CreateReportScheduleRequest): Promise<CrmReportScheduleDto> =>
    apiClient.post(`${BASE}/reports/${id}/schedule`, data) as unknown as Promise<CrmReportScheduleDto>,

  unscheduleReport: (scheduleId: string): Promise<void> =>
    apiClient.delete(`${BASE}/reports/schedules/${scheduleId}`) as unknown as Promise<void>,

  createFolder: (name: string, parentFolderId?: string): Promise<void> =>
    apiClient.post(`${BASE}/reports/folders`, { name, parentFolderId }) as unknown as Promise<void>,

  // ── Dashboards ──────────────────────────────────────────────────────────
  getDashboards: (page = 1, pageSize = 50): Promise<CrmDashboardDto[]> =>
    apiClient.get(`${BASE}/dashboards`, { params: { page, pageSize } }) as unknown as Promise<CrmDashboardDto[]>,

  getDashboard: (id: string): Promise<CrmDashboardDetailDto> =>
    apiClient.get(`${BASE}/dashboards/${id}`) as unknown as Promise<CrmDashboardDetailDto>,

  createDashboard: (data: CreateDashboardRequest): Promise<CrmDashboardDto> =>
    apiClient.post(`${BASE}/dashboards`, data) as unknown as Promise<CrmDashboardDto>,

  deleteDashboard: (id: string): Promise<void> =>
    apiClient.delete(`${BASE}/dashboards/${id}`) as unknown as Promise<void>,

  addWidget: (data: CreateDashboardWidgetRequest): Promise<CrmDashboardWidgetDto> =>
    apiClient.post(`${BASE}/dashboards/widgets`, data) as unknown as Promise<CrmDashboardWidgetDto>,

  updateWidgetLayout: (id: string, column: number, row: number, width: number, height: number): Promise<void> =>
    apiClient.put(`${BASE}/dashboards/widgets/${id}/layout`, null, { params: { column, row, width, height } }) as unknown as Promise<void>,

  removeWidget: (id: string): Promise<void> =>
    apiClient.delete(`${BASE}/dashboards/widgets/${id}`) as unknown as Promise<void>,

  getWidgetData: (id: string): Promise<CrmDashboardWidgetDataDto> =>
    apiClient.get(`${BASE}/dashboards/widgets/${id}/data`) as unknown as Promise<CrmDashboardWidgetDataDto>,

  getMetrics: (): Promise<CrmDashboardMetricDto[]> =>
    apiClient.get(`${BASE}/dashboards/metrics`) as unknown as Promise<CrmDashboardMetricDto[]>,
};
