import { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X, Loader2, AlertTriangle, Clock, ChevronLeft, ChevronRight,
  Play, CheckCircle2, TriangleAlert, Circle, Users, User, Search, ListChecks,
} from 'lucide-react';
import { format, isPast, parseISO } from 'date-fns';
import {
  useMyProcessTasks, useTeamProcessTasks, useStartProcessTask, useOpenProcessTask, useCompleteProcessTask,
} from '../api/process-workflow.queries';
import type { ProcessTaskDto, ProcessTaskFilter } from '../types/process-workflow.types';
import {
  ProcessTaskStatus,
  PROCESS_TASK_STATUS_LABELS,
  PROCESS_TASK_STATUS_COLORS,
} from '../types/process-workflow.types';

const PAGE_SIZE = 20;

const inputCls = 'w-full px-3 py-2 rounded-xl bg-bg-elevated border border-border-subtle text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-medium';

type Tab = 'mine' | 'team';

function Badge({ label, colorCls }: { label: string; colorCls: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${colorCls}`}>
      {label}
    </span>
  );
}

function SlideOver({
  title, onClose, children,
}: { title: string; onClose: () => void; children: React.ReactNode }) {
  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="drawer-slide-in relative w-[480px] h-full flex flex-col bg-bg-shell border-l border-thin border-border-subtle" style={{ boxShadow: '-8px 0 40px rgba(0,0,0,0.5)' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle shrink-0">
          <h3 className="font-bold text-text-primary">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>,
    document.body
  );
}

function CompleteModal({
  task, onClose,
}: { task: ProcessTaskDto; onClose: () => void }) {
  const [notes, setNotes] = useState('');
  const complete = useCompleteProcessTask();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await complete.mutateAsync({ id: task.id, data: { notes: notes || undefined } });
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-bg shadow-2xl rounded-2xl border border-border-subtle">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
          <h3 className="font-bold text-text-primary">Complete Task</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <p className="text-sm text-text-secondary mb-3">
              Complete <span className="font-semibold text-text-primary">"{task.stepName}"</span>?
            </p>
            <label className="block text-xs font-semibold text-text-muted mb-1.5">
              Completion Notes (optional)
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any notes about the outcome..."
              className={`${inputCls} resize-none`}
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-xl border border-border-subtle text-sm text-text-secondary hover:bg-bg-elevated transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={complete.isPending}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-brand text-bg text-sm font-semibold hover:bg-brand-light transition-all disabled:opacity-50"
            >
              {complete.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Complete
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

function SlaChip({ deadline, breached }: { deadline: string | null; breached: boolean }) {
  if (!deadline) return null;
  const dt = parseISO(deadline);
  const overdue = breached || isPast(dt);
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${overdue ? 'text-danger-DEFAULT' : 'text-text-muted'}`}>
      {overdue ? <AlertTriangle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
      {overdue && breached ? 'SLA breached' : format(dt, 'MMM d, HH:mm')}
    </span>
  );
}

function TaskStatusIcon({ status }: { status: ProcessTaskStatus }) {
  if (status === ProcessTaskStatus.Completed) return <CheckCircle2 className="w-4 h-4 text-success-DEFAULT" />;
  if (status === ProcessTaskStatus.Escalated) return <TriangleAlert className="w-4 h-4 text-danger-DEFAULT" />;
  if (status === ProcessTaskStatus.InProgress) return <Play className="w-4 h-4 text-info-DEFAULT" />;
  return <Circle className="w-4 h-4 text-text-muted" />;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold text-text-muted mb-0.5">{label}</dt>
      <dd className="text-sm text-text-primary">{children}</dd>
    </div>
  );
}

function TaskDetail({ task, onClose }: { task: ProcessTaskDto; onClose: () => void }) {
  const [showComplete, setShowComplete] = useState(false);
  const startTask = useStartProcessTask();
  const openTask = useOpenProcessTask();

  const canStart = task.status === ProcessTaskStatus.Pending || task.status === ProcessTaskStatus.Escalated;
  const canComplete = task.status === ProcessTaskStatus.InProgress;

  const handleStart = async () => {
    try {
      if (task.status === ProcessTaskStatus.Pending) {
        await openTask.mutateAsync(task.id);
      }
      await startTask.mutateAsync(task.id);
      onClose();
    } catch {
      // onError in each mutation already shows a toast
    }
  };

  return (
    <SlideOver title="Task Details" onClose={onClose}>
      <div className="space-y-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <TaskStatusIcon status={task.status} />
            <h2 className="text-base font-bold text-text-primary">{task.stepName}</h2>
          </div>
          <p className="text-sm text-text-muted">{task.definitionName}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge label={PROCESS_TASK_STATUS_LABELS[task.status]} colorCls={PROCESS_TASK_STATUS_COLORS[task.status]} />
            {task.slaBreached && (
              <Badge label="SLA Breached" colorCls="text-danger-DEFAULT border-danger-DEFAULT/30 bg-danger-DEFAULT/10" />
            )}
            {task.escalationLevel > 0 && (
              <Badge label={`Escalation L${task.escalationLevel}`} colorCls="text-warning-DEFAULT border-warning-DEFAULT/30 bg-warning-DEFAULT/10" />
            )}
          </div>
        </div>

        <hr className="border-border-subtle" />

        <dl className="grid grid-cols-2 gap-4">
          <Field label="Step #">{task.stepOrder}</Field>
          {task.assignedTeamLabel && <Field label="Team">{task.assignedTeamLabel}</Field>}
          <Field label="Assigned">
            {task.assignedAt ? format(parseISO(task.assignedAt), 'MMM d, yyyy') : '-'}
          </Field>
          {task.startedAt && (
            <Field label="Started">{format(parseISO(task.startedAt), 'MMM d, HH:mm')}</Field>
          )}
          {task.completedAt && (
            <Field label="Completed">{format(parseISO(task.completedAt), 'MMM d, HH:mm')}</Field>
          )}
          {task.slaDeadline && (
            <Field label="SLA Deadline">
              <SlaChip deadline={task.slaDeadline} breached={task.slaBreached} />
            </Field>
          )}
          {task.triggerRefKind && (
            <Field label="Triggered by">{task.triggerRefKind}</Field>
          )}
        </dl>

        {task.notes && (
          <div>
            <p className="text-xs font-semibold text-text-muted mb-1">Notes</p>
            <p className="text-sm text-text-primary bg-bg-elevated rounded-xl px-3 py-2 border border-border-subtle">{task.notes}</p>
          </div>
        )}

        {(canStart || canComplete) && (
          <div className="pt-2 space-y-2">
            {canStart && (
              <button
                onClick={handleStart}
                disabled={startTask.isPending || openTask.isPending}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-info-DEFAULT/10 border border-info-DEFAULT/30 text-info-DEFAULT text-sm font-semibold hover:bg-info-DEFAULT/20 transition-all disabled:opacity-50"
              >
                {startTask.isPending || openTask.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Start Task
              </button>
            )}
            {canComplete && (
              <button
                onClick={() => setShowComplete(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand text-bg text-sm font-semibold hover:bg-brand-light transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                Complete Task
              </button>
            )}
          </div>
        )}
      </div>
      {showComplete && <CompleteModal task={task} onClose={() => { setShowComplete(false); onClose(); }} />}
    </SlideOver>
  );
}

type FilterPill = { label: string; value: ProcessTaskStatus | undefined; slaBreached?: boolean };

const STATUS_PILLS: FilterPill[] = [
  { label: 'All', value: undefined },
  { label: 'Pending', value: ProcessTaskStatus.Pending },
  { label: 'In Progress', value: ProcessTaskStatus.InProgress },
  { label: 'Escalated', value: ProcessTaskStatus.Escalated },
  { label: 'SLA Breached', value: undefined, slaBreached: true },
];

function TaskListView({
  tasks, totalCount, page, totalPages, statusFilter, slaBreachedOnly,
  onPageChange, onPillClick, onSelectTask, isLoading, emptyMessage,
}: {
  tasks: ProcessTaskDto[];
  totalCount: number;
  page: number;
  totalPages: number;
  statusFilter: ProcessTaskStatus | undefined;
  slaBreachedOnly: boolean;
  onPageChange: (p: number) => void;
  onPillClick: (pill: FilterPill) => void;
  onSelectTask: (task: ProcessTaskDto) => void;
  isLoading: boolean;
  emptyMessage: string;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        {STATUS_PILLS.map(pill => {
          const isActive = pill.slaBreached ? slaBreachedOnly : (!slaBreachedOnly && pill.value === statusFilter);
          return (
            <button
              key={pill.label}
              onClick={() => onPillClick(pill)}
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

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-brand" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="p-4 rounded-2xl bg-bg-elevated border border-border-subtle mb-4">
            <ListChecks className="w-8 h-8 text-text-muted" />
          </div>
          <p className="text-text-primary font-semibold mb-1">No tasks found</p>
          <p className="text-sm text-text-muted">{emptyMessage}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task: ProcessTaskDto) => (
            <button
              key={task.id}
              onClick={() => onSelectTask(task)}
              className="w-full text-left glass-surface glass-surface-hover rounded-2xl px-4 py-3.5 transition-all group"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">
                  <TaskStatusIcon status={task.status} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-text-primary truncate">{task.stepName}</span>
                    {task.slaBreached && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold border text-danger-DEFAULT border-danger-DEFAULT/30 bg-danger-DEFAULT/10">
                        <AlertTriangle className="w-2.5 h-2.5" /> SLA
                      </span>
                    )}
                    {task.escalationLevel > 0 && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold border text-warning-DEFAULT border-warning-DEFAULT/30 bg-warning-DEFAULT/10">
                        L{task.escalationLevel}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-muted mt-0.5">{task.definitionName}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <SlaChip deadline={task.slaDeadline} breached={task.slaBreached} />
                  <Badge label={PROCESS_TASK_STATUS_LABELS[task.status]} colorCls={PROCESS_TASK_STATUS_COLORS[task.status]} />
                </div>
              </div>
              {task.assignedTeamLabel && (
                <p className="text-xs text-text-muted mt-1.5 ml-7">Team: {task.assignedTeamLabel}</p>
              )}
            </button>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-text-muted">Page {page} of {totalPages} · {totalCount} tasks</p>
          <div className="flex gap-2">
            <button onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page === 1} className="p-2 rounded-xl border border-border-subtle text-text-secondary hover:bg-bg-elevated disabled:opacity-40 transition-all">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => onPageChange(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="p-2 rounded-xl border border-border-subtle text-text-secondary hover:bg-bg-elevated disabled:opacity-40 transition-all">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MyTasksTab({ onSelectTask }: { onSelectTask: (task: ProcessTaskDto) => void }) {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<ProcessTaskStatus | undefined>(undefined);
  const [slaBreachedOnly, setSlaBreachedOnly] = useState(false);

  const filter: ProcessTaskFilter = {
    Status: statusFilter,
    SlaBreachedOnly: slaBreachedOnly,
    Page: page,
    PageSize: PAGE_SIZE,
  };

  const { data, isLoading } = useMyProcessTasks(filter);
  const paged = data as unknown as { items: ProcessTaskDto[]; totalCount: number } | undefined;
  const tasks = paged?.items ?? [];
  const totalCount = paged?.totalCount ?? 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const handlePillClick = (pill: FilterPill) => {
    setPage(1);
    if (pill.slaBreached) {
      setSlaBreachedOnly(true);
      setStatusFilter(undefined);
    } else {
      setSlaBreachedOnly(false);
      setStatusFilter(pill.value);
    }
  };

  return (
    <TaskListView
      tasks={tasks}
      totalCount={totalCount}
      page={page}
      totalPages={totalPages}
      statusFilter={statusFilter}
      slaBreachedOnly={slaBreachedOnly}
      onPageChange={setPage}
      onPillClick={handlePillClick}
      onSelectTask={onSelectTask}
      isLoading={isLoading}
      emptyMessage={
        slaBreachedOnly
          ? 'No SLA-breached tasks — great work!'
          : statusFilter !== undefined
          ? `No ${PROCESS_TASK_STATUS_LABELS[statusFilter].toLowerCase()} tasks right now.`
          : 'You have no process tasks assigned to you.'
      }
    />
  );
}

function TeamTasksTab({ onSelectTask }: { onSelectTask: (task: ProcessTaskDto) => void }) {
  const [teamLabel, setTeamLabel] = useState('');
  const [searchedLabel, setSearchedLabel] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<ProcessTaskStatus | undefined>(undefined);
  const [slaBreachedOnly, setSlaBreachedOnly] = useState(false);

  const filter: ProcessTaskFilter = {
    Status: statusFilter,
    SlaBreachedOnly: slaBreachedOnly,
    Page: page,
    PageSize: PAGE_SIZE,
  };

  const { data, isLoading } = useTeamProcessTasks(searchedLabel, filter);
  const paged = data as unknown as { items: ProcessTaskDto[]; totalCount: number } | undefined;
  const tasks = paged?.items ?? [];
  const totalCount = paged?.totalCount ?? 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const handleSearch = () => {
    if (!teamLabel.trim()) return;
    setSearchedLabel(teamLabel.trim());
    setPage(1);
  };

  const handlePillClick = (pill: FilterPill) => {
    setPage(1);
    if (pill.slaBreached) {
      setSlaBreachedOnly(true);
      setStatusFilter(undefined);
    } else {
      setSlaBreachedOnly(false);
      setStatusFilter(pill.value);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            value={teamLabel}
            onChange={e => setTeamLabel(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
            placeholder="Search team label (e.g. Sales, Support)"
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-bg-elevated border border-border-subtle text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand/40"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={!teamLabel.trim() || isLoading}
          className="px-4 py-2 rounded-xl text-xs font-bold text-bg bg-brand hover:bg-brand-light disabled:opacity-50 transition-all"
        >
          {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Search'}
        </button>
      </div>

      {!searchedLabel ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="p-4 rounded-2xl bg-bg-elevated border border-border-subtle mb-4">
            <Users className="w-8 h-8 text-text-muted" />
          </div>
          <p className="text-text-primary font-semibold mb-1">Look up team tasks</p>
          <p className="text-sm text-text-muted">Enter a team label above to see their process tasks.</p>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-sm text-text-muted mb-2">
          <Users className="w-4 h-4" />
          Showing tasks for team: <span className="font-semibold text-text-primary">{searchedLabel}</span>
        </div>
      )}

      {searchedLabel && (
        <TaskListView
          tasks={tasks}
          totalCount={totalCount}
          page={page}
          totalPages={totalPages}
          statusFilter={statusFilter}
          slaBreachedOnly={slaBreachedOnly}
          onPageChange={setPage}
          onPillClick={handlePillClick}
          onSelectTask={onSelectTask}
          isLoading={isLoading}
          emptyMessage={
            slaBreachedOnly
              ? 'No SLA-breached tasks for this team.'
              : statusFilter !== undefined
              ? `No ${PROCESS_TASK_STATUS_LABELS[statusFilter].toLowerCase()} tasks for this team.`
              : `No tasks found for team "${searchedLabel}".`
          }
        />
      )}
    </div>
  );
}

export default function ProcessTasksTab() {
  const [innerTab, setInnerTab] = useState<Tab>('mine');
  const [selectedTask, setSelectedTask] = useState<ProcessTaskDto | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1 p-1 rounded-xl bg-bg-elevated border border-border-subtle w-fit">
        <button
          onClick={() => setInnerTab('mine')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
            innerTab === 'mine'
              ? 'bg-bg text-text-primary shadow-sm border border-border-subtle'
              : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          <User className="w-3.5 h-3.5" /> My Tasks
        </button>
        <button
          onClick={() => setInnerTab('team')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
            innerTab === 'team'
              ? 'bg-bg text-text-primary shadow-sm border border-border-subtle'
              : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          <Users className="w-3.5 h-3.5" /> Team Tasks
        </button>
      </div>

      {innerTab === 'mine' ? (
        <MyTasksTab onSelectTask={setSelectedTask} />
      ) : (
        <TeamTasksTab onSelectTask={setSelectedTask} />
      )}

      {selectedTask && <TaskDetail task={selectedTask} onClose={() => setSelectedTask(null)} />}
    </div>
  );
}
