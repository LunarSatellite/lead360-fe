import { useState } from 'react';
import { confirmDialog } from '@/shared/ui/confirm';
import { createPortal } from 'react-dom';
import {
  Activity, X, Loader2, ChevronLeft, ChevronRight, Circle, CheckCircle2,
  XCircle, AlertTriangle, Ban, Eye, Play, CheckSquare,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import {
  useProcessInstances, useProcessInstance, useCancelProcessInstance,
} from '../api/process-workflow.queries';
import type { ProcessInstanceDto, ProcessInstanceFilter, ProcessTaskDto } from '../types/process-workflow.types';
import {
  ProcessInstanceStatus, ProcessTaskStatus,
  PROCESS_TASK_STATUS_LABELS, PROCESS_TASK_STATUS_COLORS,
} from '../types/process-workflow.types';

const PAGE_SIZE = 20;

// ─── Instance status helpers ─────────────────────────────────────────────────

const INSTANCE_STATUS_CONFIG: Record<ProcessInstanceStatus, { label: string; color: string; icon: typeof Circle }> = {
  [ProcessInstanceStatus.Active]:    { label: 'Active',    color: 'text-info-DEFAULT',    icon: Play },
  [ProcessInstanceStatus.Completed]: { label: 'Completed', color: 'text-success-DEFAULT', icon: CheckCircle2 },
  [ProcessInstanceStatus.Cancelled]: { label: 'Cancelled', color: 'text-text-muted',     icon: XCircle },
  [ProcessInstanceStatus.Failed]:    { label: 'Failed',    color: 'text-danger-DEFAULT',  icon: AlertTriangle },
};

// ─── Instance Detail Slide-Over ─────────────────────────────────────────────

function TaskItem({ task }: { task: ProcessTaskDto }) {
  const statusIcon = () => {
    if (task.status === ProcessTaskStatus.Completed) return <CheckCircle2 className="w-3.5 h-3.5 text-success-DEFAULT" />;
    if (task.status === ProcessTaskStatus.InProgress) return <Play className="w-3.5 h-3.5 text-info-DEFAULT" />;
    if (task.status === ProcessTaskStatus.Escalated) return <AlertTriangle className="w-3.5 h-3.5 text-danger-DEFAULT" />;
    if (task.status === ProcessTaskStatus.Skipped) return <Ban className="w-3.5 h-3.5 text-text-muted" />;
    return <Circle className="w-3.5 h-3.5 text-text-muted" />;
  };

  return (
    <div className="flex items-start gap-3 px-3 py-2.5 rounded-xl bg-bg border border-border-subtle">
      <div className="mt-0.5 shrink-0">{statusIcon()}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-full bg-brand/10 text-brand text-[9px] font-bold flex items-center justify-center shrink-0">
            {task.stepOrder}
          </span>
          <span className="text-xs font-semibold text-text-primary">{task.stepName}</span>
          <span className={`text-[10px] font-medium ${PROCESS_TASK_STATUS_COLORS[task.status].split(' ')[0]} shrink-0`}>
            {PROCESS_TASK_STATUS_LABELS[task.status]}
          </span>
        </div>
        {task.assignedTeamLabel && (
          <p className="text-[11px] text-text-muted mt-0.5">Team: {task.assignedTeamLabel}</p>
        )}
        {task.completedAt && (
          <p className="text-[10px] text-text-muted mt-0.5">
            Completed {format(parseISO(task.completedAt), 'MMM d, HH:mm')}
          </p>
        )}
        {task.notes && (
          <p className="text-[11px] text-text-primary mt-1 bg-bg-elevated rounded-lg px-2 py-1">{task.notes}</p>
        )}
      </div>
    </div>
  );
}

function InstanceDetail({ instanceId, onClose }: { instanceId: string; onClose: () => void }) {
  const { data: raw, isLoading } = useProcessInstance(instanceId);
  const instance = raw as unknown as ProcessInstanceDto | undefined;
  const cancel = useCancelProcessInstance();
  const config = instance ? INSTANCE_STATUS_CONFIG[instance.status] : null;

  return (
    <SlideOver title="Instance Details" onClose={onClose}>
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-brand" />
        </div>
      ) : !instance ? (
        <p className="text-sm text-text-muted text-center py-10">Instance not found.</p>
      ) : (
        <div className="space-y-5">
          {/* Header */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              {config && <config.icon className={`w-4 h-4 ${config.color}`} />}
              <h2 className="text-base font-bold text-text-primary">{instance.definitionName}</h2>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-semibold ${config?.color}`}>{config?.label}</span>
              <span className="text-xs text-text-muted">
                Step {instance.currentStepOrder} of {instance.totalSteps}
              </span>
            </div>
          </div>

          <hr className="border-border-subtle" />

          {/* Fields */}
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-xs font-semibold text-text-muted mb-0.5">Started</dt>
              <dd className="text-text-primary">{format(parseISO(instance.startedAt), 'MMM d, yyyy HH:mm')}</dd>
            </div>
            {instance.completedAt && (
              <div>
                <dt className="text-xs font-semibold text-text-muted mb-0.5">Completed</dt>
                <dd className="text-text-primary">{format(parseISO(instance.completedAt), 'MMM d, HH:mm')}</dd>
              </div>
            )}
            {instance.triggerRefKind && (
              <div>
                <dt className="text-xs font-semibold text-text-muted mb-0.5">Trigger</dt>
                <dd className="text-text-primary capitalize">{instance.triggerRefKind}</dd>
              </div>
            )}
          </dl>

          {/* Cancel button */}
          {instance.status === ProcessInstanceStatus.Active && (
            <button
              onClick={() => confirmDialog({ message: 'Cancel this process instance? Pending tasks will be skipped.', confirmText: 'Cancel instance', danger: true }).then((ok) => { if (ok) cancel.mutate(instance.id, { onSuccess: onClose }); })}
              disabled={cancel.isPending}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-danger/30 text-danger text-sm font-semibold hover:bg-danger/10 transition-all disabled:opacity-50"
            >
              {cancel.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
              Cancel Instance
            </button>
          )}

          {/* Tasks */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CheckSquare className="w-3.5 h-3.5 text-text-muted" strokeWidth={1.5} />
              <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Tasks</p>
            </div>
            <div className="space-y-1.5">
              {(instance.tasks ?? [])
                .sort((a, b) => a.stepOrder - b.stepOrder)
                .map(task => (
                  <TaskItem key={task.id} task={task} />
                ))}
            </div>
          </div>
        </div>
      )}
    </SlideOver>
  );
}

// ─── SlideOver ───────────────────────────────────────────────────────────────

function SlideOver({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-bg shadow-2xl flex flex-col border-l border-border-subtle h-full">
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

// ─── Status filter pills ─────────────────────────────────────────────────────

const STATUS_PILLS: { label: string; value: ProcessInstanceStatus | undefined }[] = [
  { label: 'All', value: undefined },
  { label: 'Active', value: ProcessInstanceStatus.Active },
  { label: 'Completed', value: ProcessInstanceStatus.Completed },
  { label: 'Cancelled', value: ProcessInstanceStatus.Cancelled },
  { label: 'Failed', value: ProcessInstanceStatus.Failed },
];

// ─── Page ────────────────────────────────────────────────────────────────────

export function Component() { return <ProcessWorkflowInstancesPage />; }

function ProcessWorkflowInstancesPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<ProcessInstanceStatus | undefined>(undefined);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filter: ProcessInstanceFilter = {
    Status: statusFilter,
    Page: page,
    PageSize: PAGE_SIZE,
  };

  const { data, isLoading } = useProcessInstances(filter);
  const paged = data as unknown as { items: ProcessInstanceDto[]; totalCount: number } | undefined;
  const instances = paged?.items ?? [];
  const totalCount = paged?.totalCount ?? 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-violet-DEFAULT/10 border border-violet-DEFAULT/20">
            <Activity className="w-5 h-5 text-violet-DEFAULT" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Process Instances</h1>
            <p className="text-sm text-text-muted">Monitor running and completed process workflows</p>
          </div>
        </div>
        {totalCount > 0 && (
          <span className="px-2.5 py-1 rounded-full bg-bg-elevated border border-border-subtle text-sm font-semibold text-text-secondary">
            {totalCount} instance{totalCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Filter pills */}
      <div className="flex items-center gap-2 flex-wrap">
        {STATUS_PILLS.map(pill => {
          const isActive = pill.value === statusFilter;
          return (
            <button
              key={pill.label}
              onClick={() => { setStatusFilter(pill.value); setPage(1); }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                isActive
                  ? 'bg-brand/10 border-brand/30 text-brand'
                  : 'bg-bg-elevated border-border-subtle text-text-secondary hover:border-border-medium'
              }`}
            >
              {pill.label}
            </button>
          );
        })}
      </div>

      {/* Instance list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-brand" />
        </div>
      ) : instances.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="p-4 rounded-2xl bg-bg-elevated border border-border-subtle mb-4">
            <Activity className="w-8 h-8 text-text-muted" />
          </div>
          <p className="text-text-primary font-semibold mb-1">No instances found</p>
          <p className="text-sm text-text-muted">
            {statusFilter !== undefined
              ? `No ${INSTANCE_STATUS_CONFIG[statusFilter]?.label.toLowerCase() ?? ''} instances.`
              : 'No process instances yet. Start one from a definition.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {instances.map(instance => {
            const cfg = INSTANCE_STATUS_CONFIG[instance.status];
            const Icon = cfg.icon;
            return (
              <button
                key={instance.id}
                onClick={() => setSelectedId(instance.id)}
                className="w-full text-left glass-surface glass-surface-hover rounded-2xl px-4 py-3.5 transition-all group"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">
                    <Icon className={`w-4 h-4 ${cfg.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-text-primary truncate">
                        {instance.definitionName}
                      </span>
                      {instance.status === ProcessInstanceStatus.Active && (
                        <span className="text-[10px] font-bold text-info-DEFAULT border border-info-DEFAULT/30 bg-info-DEFAULT/10 px-1.5 py-0.5 rounded">
                          Step {instance.currentStepOrder}/{instance.totalSteps}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-text-muted">
                        {format(parseISO(instance.startedAt), 'MMM d, HH:mm')}
                      </span>
                      <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                    </div>
                  </div>
                  <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Eye className="w-4 h-4 text-text-muted" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-text-muted">
            Page {page} of {totalPages} · {totalCount} instances
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-xl border border-border-subtle text-text-secondary hover:bg-bg-elevated disabled:opacity-40 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-xl border border-border-subtle text-text-secondary hover:bg-bg-elevated disabled:opacity-40 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Detail slide-over */}
      {selectedId && (
        <InstanceDetail instanceId={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </div>
  );
}
