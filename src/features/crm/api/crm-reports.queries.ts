import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { crmReportsApi } from './crm-reports.api';
import { getApiError } from '@/shared/lib/get-api-error';
import type {
  CreateReportRequest,
  CreateReportScheduleRequest,
  CrmReportRunRequest,
  CreateDashboardRequest,
  CreateDashboardWidgetRequest,
} from '../types/crm-reports.types';

const KEYS = {
  catalog: () => ['crm', 'report-catalog'] as const,
  metrics: () => ['crm', 'dashboard-metrics'] as const,
  reports: () => ['crm', 'reports'] as const,
  dashboards: () => ['crm', 'dashboards'] as const,
  dashboardById: (id: string) => ['crm', 'dashboards', id] as const,
  widgetData: (id: string) => ['crm', 'dashboard-widget-data', id] as const,
};

// ── Catalog ───────────────────────────────────────────────────────────────

export function useReportCatalog() {
  return useQuery({ queryKey: KEYS.catalog(), queryFn: () => crmReportsApi.getCatalog(), staleTime: 5 * 60 * 1000 });
}

export function useDashboardMetrics() {
  return useQuery({ queryKey: KEYS.metrics(), queryFn: () => crmReportsApi.getMetrics(), staleTime: 5 * 60 * 1000 });
}

// ── Reports ───────────────────────────────────────────────────────────────

export function useReports() {
  return useQuery({ queryKey: KEYS.reports(), queryFn: () => crmReportsApi.getReports() });
}

export function useCreateReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateReportRequest) => crmReportsApi.createReport(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEYS.reports() }); toast.success('Report saved'); },
    onError: (e) => toast.error(getApiError(e).message),
  });
}

export function useUpdateReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateReportRequest }) => crmReportsApi.updateReport(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEYS.reports() }); toast.success('Report updated'); },
    onError: (e) => toast.error(getApiError(e).message),
  });
}

export function useDeleteReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmReportsApi.deleteReport(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEYS.reports() }); toast.success('Report deleted'); },
    onError: (e) => toast.error(getApiError(e).message),
  });
}

export function usePreviewReport() {
  return useMutation({
    mutationFn: (data: CrmReportRunRequest) => crmReportsApi.previewReport(data),
    onError: (e) => toast.error(getApiError(e).message),
  });
}

export function useRunReport() {
  return useMutation({
    mutationFn: ({ id, page, pageSize }: { id: string; page?: number; pageSize?: number }) =>
      crmReportsApi.runReport(id, page, pageSize),
    onError: (e) => toast.error(getApiError(e).message),
  });
}

export function useScheduleReport() {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateReportScheduleRequest }) =>
      crmReportsApi.scheduleReport(id, data),
    onSuccess: () => toast.success('Report scheduled'),
    onError: (e) => toast.error(getApiError(e).message),
  });
}

export function useUnscheduleReport() {
  return useMutation({
    mutationFn: (scheduleId: string) => crmReportsApi.unscheduleReport(scheduleId),
    onSuccess: () => toast.success('Schedule removed'),
    onError: (e) => toast.error(getApiError(e).message),
  });
}

// ── Dashboards ────────────────────────────────────────────────────────────

export function useDashboards() {
  return useQuery({ queryKey: KEYS.dashboards(), queryFn: () => crmReportsApi.getDashboards() });
}

export function useDashboardById(id: string | undefined) {
  return useQuery({
    queryKey: KEYS.dashboardById(id ?? ''),
    queryFn: () => crmReportsApi.getDashboard(id!),
    enabled: !!id,
  });
}

export function useCreateDashboard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateDashboardRequest) => crmReportsApi.createDashboard(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEYS.dashboards() }); toast.success('Dashboard created'); },
    onError: (e) => toast.error(getApiError(e).message),
  });
}

export function useDeleteDashboard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmReportsApi.deleteDashboard(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEYS.dashboards() }); toast.success('Dashboard deleted'); },
    onError: (e) => toast.error(getApiError(e).message),
  });
}

export function useAddWidget(dashboardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateDashboardWidgetRequest) => crmReportsApi.addWidget(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.dashboardById(dashboardId) }),
    onError: (e) => toast.error(getApiError(e).message),
  });
}

export function useUpdateWidgetLayout(dashboardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, column, row, width, height }: { id: string; column: number; row: number; width: number; height: number }) =>
      crmReportsApi.updateWidgetLayout(id, column, row, width, height),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.dashboardById(dashboardId) }),
    onError: (e) => toast.error(getApiError(e).message),
  });
}

export function useRemoveWidget(dashboardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmReportsApi.removeWidget(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.dashboardById(dashboardId) }),
    onError: (e) => toast.error(getApiError(e).message),
  });
}

export function useWidgetData(id: string | undefined) {
  return useQuery({
    queryKey: KEYS.widgetData(id ?? ''),
    queryFn: () => crmReportsApi.getWidgetData(id!),
    enabled: !!id,
  });
}
