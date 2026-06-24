import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, RefreshCw, Loader2, Wifi } from 'lucide-react';
import { format } from 'date-fns';
import { StatusBadge } from '@/shared/components';
import { useUpdateSyncConfig, useTriggerSync, useSyncLogs } from '../api/catalog.queries';
import { useApiHealth } from '@/features/api-connection/api/api-connection.queries';
import {
  syncConfigSchema,
  type SyncConfigFormData,
  type SyncConfigDto,
  type SyncLogDto,
} from '../types/catalog.types';

interface SyncConfigFormProps {
  config: SyncConfigDto | undefined;
  isLoading: boolean;
}

export function SyncConfigForm({ config, isLoading }: SyncConfigFormProps) {
  const updateConfig = useUpdateSyncConfig();
  const triggerSync = useTriggerSync();
  const { data: rawHealth } = useApiHealth();
  const health = rawHealth as any;

  const form = useForm<SyncConfigFormData>({
    resolver: zodResolver(syncConfigSchema),
    values: config
      ? {
          productEndpointPath: config.productEndpointPath || '',
          paginationType: (config.paginationType as any) || 'page',
          pageSize: config.pageSize || 50,
          dataArrayPath: config.dataArrayPath || 'data',
          fieldMappingsJson: config.fieldMappingsJson || '',
          syncIntervalMinutes: config.syncIntervalMinutes || 360,
          isEnabled: config.isEnabled ?? true,
        }
      : undefined,
  });

  const onSubmit = (data: SyncConfigFormData) => {
    updateConfig.mutate(data as unknown as SyncConfigDto);
  };

  if (isLoading) return <div className="h-48 bg-glass-1 rounded-2xl animate-pulse" />;

  return (
    <div className="space-y-5">
      <div className="bg-bg-card border border-border-subtle rounded-2xl p-6 ">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[15px] font-bold text-text-primary">Sync Configuration</h3>
          {health && (
            <div className="flex items-center gap-2">
              <Wifi
                className={`w-3.5 h-3.5 ${health.status === 'healthy' ? 'text-success' : 'text-danger'}`}
                strokeWidth={1.8}
              />
              <span
                className={`text-[11px] font-bold ${health.status === 'healthy' ? 'text-success' : 'text-danger'}`}
              >
                {health.status}
              </span>
              {health.responseTimeMs != null && (
                <span className="text-[11px] text-text-muted">{health.responseTimeMs}ms</span>
              )}
            </div>
          )}
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">
              Product Endpoint Path <span className="text-danger">*</span>
            </label>
            <input
              {...form.register('productEndpointPath')}
              placeholder="/api/products"
              className="form-input"
            />
            {form.formState.errors.productEndpointPath && (
              <p className="text-xs text-danger mt-1">{form.formState.errors.productEndpointPath.message}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">Pagination Type</label>
            <select
              {...form.register('paginationType')}
              className="form-input appearance-none cursor-pointer"
            >
              <option value="page">Page</option>
              <option value="offset">Offset</option>
              <option value="cursor">Cursor</option>
              <option value="none">None</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">Page Size</label>
            <input
              {...form.register('pageSize', { valueAsNumber: true })}
              type="number"
              className="form-input"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">Data Array Path</label>
            <input {...form.register('dataArrayPath')} placeholder="data" className="form-input" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">
              Field Mappings (JSON)
            </label>
            <textarea
              {...form.register('fieldMappingsJson')}
              rows={3}
              placeholder='{"name": "product_name", "price": "unit_price"}'
              className="form-input resize-none font-mono text-[11px]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">Sync Interval</label>
            <select
              {...form.register('syncIntervalMinutes', { valueAsNumber: true })}
              className="form-input appearance-none cursor-pointer"
            >
              <option value={60}>Every 1 hour</option>
              <option value={180}>Every 3 hours</option>
              <option value={360}>Every 6 hours</option>
              <option value={720}>Every 12 hours</option>
              <option value={1440}>Every 24 hours</option>
            </select>
          </div>
          <div className="flex items-center gap-3 pt-5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                {...form.register('isEnabled')}
                type="checkbox"
                className="w-4 h-4 rounded border-border-medium accent-brand"
              />
              <span className="text-xs font-semibold text-text-secondary">Enable sync</span>
            </label>
          </div>
          <div className="md:col-span-2 flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={updateConfig.isPending}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-br from-brand to-brand-dark text-sm font-bold text-white hover:brightness-110 transition-all disabled:opacity-50"
            >
              {updateConfig.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" strokeWidth={1.8} />
              )}
              Save Config
            </button>
            <button
              type="button"
              onClick={() => triggerSync.mutate()}
              disabled={triggerSync.isPending}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-glass-1 border border-border-subtle text-sm font-semibold text-text-secondary hover:bg-glass-2 transition-all disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 ${triggerSync.isPending ? 'animate-spin' : ''}`}
                strokeWidth={1.6}
              />
              Sync Now
            </button>
          </div>
        </form>
      </div>

      {/* Sync History */}
      <SyncHistoryTable />
    </div>
  );
}

function SyncHistoryTable() {
  const { data: rawLogs, isLoading } = useSyncLogs();
  const logs = (rawLogs as unknown as SyncLogDto[]) ?? [];

  if (isLoading) return <div className="h-24 bg-glass-1 rounded-2xl animate-pulse" />;
  if (logs.length === 0)
    return <p className="text-xs text-text-muted py-4 text-center">No sync history yet.</p>;

  return (
    <div className="bg-bg-card border border-border-subtle rounded-2xl overflow-hidden ">
      <div className="px-5 py-3 border-b border-border-subtle">
        <p className="text-xs font-bold text-text-primary">Sync History</p>
      </div>
      <div className="grid grid-cols-[140px_80px_80px_80px_80px_80px] gap-2 px-5 py-2 border-b border-border-subtle text-[11px] font-bold uppercase tracking-[1.2px] text-text-muted">
        <span>Date</span>
        <span>Duration</span>
        <span>New</span>
        <span>Updated</span>
        <span>Removed</span>
        <span>Status</span>
      </div>
      {logs.slice(0, 10).map((log) => (
        <div
          key={log.id}
          className="grid grid-cols-[140px_80px_80px_80px_80px_80px] gap-2 items-center px-5 py-2.5 border-b border-border-subtle last:border-b-0 text-xs"
        >
          <span className="text-text-secondary">{format(new Date(log.startedAt), 'MMM d, HH:mm')}</span>
          <span className="text-text-muted">{log.durationMs}ms</span>
          <span className="font-bold text-success">{log.newProducts > 0 ? `+${log.newProducts}` : '0'}</span>
          <span className="font-bold text-info">{log.updatedProducts > 0 ? log.updatedProducts : '0'}</span>
          <span className="font-bold text-danger">
            {log.removedProducts > 0 ? `-${log.removedProducts}` : '0'}
          </span>
          <StatusBadge
            variant={log.status === 'Success' ? 'success' : log.status === 'Failed' ? 'danger' : 'warning'}
          >
            {log.status}
          </StatusBadge>
        </div>
      ))}
    </div>
  );
}
