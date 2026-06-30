import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Plus, X, Loader2, CheckSquare, Bell, Trash2, ChevronLeft, ChevronRight, Search, Calendar, ChevronDown } from 'lucide-react';
import {
  useTasks, useCreateTask, useUpdateTask, useDeleteTask, useCompleteTask,
} from '../api/crm.queries';
import type {
  CrmTaskSummaryDto, CrmTaskCreateRequest, CrmTaskFilter, PagedResult,
} from '../types/crm.types';
import {
  CrmTaskStatus, CrmTaskPriority,
  CRM_TASK_STATUS_LABELS, CRM_TASK_STATUS_COLORS,
  CRM_TASK_PRIORITY_LABELS, CRM_TASK_PRIORITY_COLORS,
} from '../types/crm.types';
import { format, isPast, parseISO } from 'date-fns';

const PAGE_SIZE = 20;

const STATUS_PILLS: { label: string; value: CrmTaskStatus | undefined }[] = [
  { label: 'All', value: undefined },
  { label: 'To Do', value: CrmTaskStatus.Todo },
  { label: 'In Progress', value: CrmTaskStatus.InProgress },
  { label: 'Done', value: CrmTaskStatus.Done },
  { label: 'Cancelled', value: CrmTaskStatus.Cancelled },
];

const inputCls = 'w-full px-3 py-2 rounded-xl bg-bg-elevated border border-border-subtle text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-medium';
const selectCls = 'px-3 py-2 rounded-xl bg-bg-elevated border border-border-subtle text-sm text-text-secondary focus:outline-none focus:border-border-medium';

const formInputCls = 'w-full px-3 py-2.5 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-[rgba(0,217,138,0.50)] transition-colors';
const formInputStyle = { backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' } as const;
const dropTriggerStyle = (open: boolean) => ({
  backgroundColor: '#1A2F27',
  backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)',
  border: `1px solid ${open ? 'rgba(0,217,138,0.50)' : 'rgba(0,217,138,0.20)'}`,
  boxShadow: open ? '0 0 0 1px rgba(0,217,138,0.50), 0 0 10px rgba(0,217,138,0.20), 0 0 20px rgba(0,217,138,0.08)' : 'none',
  outline: 'none',
  transition: 'box-shadow 0.2s ease',
});
const dropPanelStyle: React.CSSProperties = { borderRadius: 12, background: 'var(--bg-card)', border: '1px solid rgba(0,217,138,0.20)', boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 12px rgba(0,217,138,0.08)' };

const TASK_PRIORITY_OPTS = [
  { value: '1', label: 'Low',      dot: '#B8E6D5', text: 'text-text-secondary',  hover: 'hover:bg-[rgba(184,230,213,0.08)]' },
  { value: '2', label: 'Medium',   dot: '#F59E0B', text: 'text-[#F59E0B]',       hover: 'hover:bg-[rgba(245,158,11,0.08)]'  },
  { value: '3', label: 'High',     dot: '#F43F5E', text: 'text-danger',           hover: 'hover:bg-[rgba(244,63,94,0.08)]'   },
  { value: '4', label: 'Critical', dot: '#F43F5E', text: 'text-danger font-bold', hover: 'hover:bg-[rgba(244,63,94,0.12)]'   },
] as const;

function Badge({ label, colorCls }: { label: string; colorCls: string }) {
  return <span className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${colorCls}`}>{label}</span>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold text-text-muted mb-0.5">{label}</dt>
      <dd className="text-sm text-text-primary">{children}</dd>
    </div>
  );
}


function SlideOver({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="drawer-slide-in relative w-[480px] h-full flex flex-col bg-bg-shell border-l border-thin border-border-subtle" style={{ boxShadow: '-8px 0 40px rgba(0,0,0,0.5)' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle shrink-0">
          <h3 className="font-bold text-text-primary">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}


function CreateForm({ onSave, onCancel, isSaving }: { onSave: (d: CrmTaskCreateRequest) => void; onCancel: () => void; isSaving: boolean }) {
  const [form, setForm] = useState({ title: '', description: '', priority: '', dueDate: '', dealId: '', assignedToUserId: '', reminderMinutesBefore: '' });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [k]: e.target.value }));
  const [priorityOpen, setPriorityOpen] = useState(false);
  const priorityRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (priorityRef.current && !priorityRef.current.contains(e.target as Node)) setPriorityOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectedPriority = TASK_PRIORITY_OPTS.find(o => o.value === form.priority);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title: form.title,
      description: form.description || undefined,
      priority: form.priority ? Number(form.priority) as CrmTaskPriority : undefined,
      dueDate: form.dueDate || undefined,
      dealId: form.dealId || undefined,
      assignedToUserId: form.assignedToUserId || undefined,
      reminderMinutesBefore: form.reminderMinutesBefore ? Number(form.reminderMinutesBefore) : undefined,
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-end pr-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="drawer-slide-in relative w-[540px] flex flex-col overflow-hidden"
        style={{ borderRadius: 18, background: 'var(--bg-card)', border: '1px solid rgba(0,217,138,0.2)', boxShadow: '0 20px 60px rgba(0,0,0,0.7), 0 0 24px rgba(0,217,138,0.25), inset 0 1px 0 rgba(0,255,163,0.05)', maxHeight: 'calc(100vh - 32px)' }}>
        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, #00D98A 35%, #00FFA3 65%, transparent)', flexShrink: 0 }} />
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle shrink-0">
          <h3 className="font-bold leading-tight" style={{ background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--primary) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>New Task</h3>
          <button onClick={onCancel} className="text-text-muted hover:text-text-primary transition-all"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="overflow-y-auto flex-1 min-h-0 px-6 py-5 space-y-4">
            <div><label className="block text-xs font-semibold text-text-muted mb-1.5">Title *</label><input required value={form.title} onChange={set('title')} placeholder="Task title..." className={formInputCls} style={formInputStyle} /></div>
            <div><label className="block text-xs font-semibold text-text-muted mb-1.5">Description</label><textarea rows={3} value={form.description} onChange={set('description')} placeholder="Optional details..." className={`${formInputCls} resize-none`} style={formInputStyle} /></div>

            {/* Priority custom dropdown */}
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1.5">Priority</label>
              <div className="relative" ref={priorityRef}>
                <button type="button" onClick={() => setPriorityOpen(o => !o)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm"
                  style={dropTriggerStyle(priorityOpen)}>
                  {selectedPriority ? (
                    <>
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: selectedPriority.dot, boxShadow: `0 0 6px ${selectedPriority.dot}` }} />
                      <span className={`flex-1 text-left font-medium ${selectedPriority.text}`}>{selectedPriority.label}</span>
                    </>
                  ) : (
                    <span className="flex-1 text-left text-text-muted">Select priority</span>
                  )}
                  <ChevronDown className={`w-3.5 h-3.5 text-text-muted transition-transform duration-200 ${priorityOpen ? 'rotate-180' : ''}`} strokeWidth={1.6} />
                </button>
                {priorityOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 z-10 overflow-hidden" style={dropPanelStyle}>
                    {TASK_PRIORITY_OPTS.map(opt => (
                      <button key={opt.value} type="button"
                        onClick={() => { setForm(f => ({ ...f, priority: opt.value })); setPriorityOpen(false); }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium transition-colors ${opt.hover} ${opt.text} ${form.priority === opt.value ? 'bg-[rgba(0,217,138,0.08)]' : ''}`}>
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: opt.dot, boxShadow: `0 0 6px ${opt.dot}` }} />
                        {opt.label}
                        {form.priority === opt.value && <span className="ml-auto text-[10px] font-bold text-text-muted">selected</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div><label className="block text-xs font-semibold text-text-muted mb-1.5">Due Date</label><input type="datetime-local" value={form.dueDate} onChange={set('dueDate')} className={formInputCls} style={formInputStyle} /></div>
            <div><label className="block text-xs font-semibold text-text-muted mb-1.5">Deal ID (optional)</label><input value={form.dealId} onChange={set('dealId')} placeholder="UUID" className={formInputCls} style={formInputStyle} /></div>
            <div><label className="block text-xs font-semibold text-text-muted mb-1.5">Assign To (User ID)</label><input value={form.assignedToUserId} onChange={set('assignedToUserId')} placeholder="UUID" className={formInputCls} style={formInputStyle} /></div>
            <div><label className="block text-xs font-semibold text-text-muted mb-1.5">Reminder (minutes before)</label><input type="number" min={0} value={form.reminderMinutesBefore} onChange={set('reminderMinutesBefore')} placeholder="e.g. 30" className={formInputCls} style={formInputStyle} /></div>
          </div>
          <div className="shrink-0 flex items-center justify-end gap-3 px-6 py-4 border-t border-border-subtle">
            <button type="button" onClick={onCancel} className="px-4 py-2 rounded-xl text-xs font-semibold text-text-secondary border border-border-subtle hover:border-border-medium transition-colors">Cancel</button>
            <button type="submit" disabled={isSaving || !form.title.trim()} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-bg bg-brand hover:bg-brand-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

function DetailPanel({ task, onClose }: { task: CrmTaskSummaryDto; onClose: () => void }) {
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: task.title, description: task.description ?? '', priority: String(task.priority), dueDate: task.dueDate ?? '', completionNotes: task.completionNotes ?? '' });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const complete = useCompleteTask();
  const del = useDeleteTask();
  const update = useUpdateTask();
  const isDone = task.status === CrmTaskStatus.Done;
  const setEdit = (k: keyof typeof editForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setEditForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <SlideOver title={task.title} onClose={onClose}>
      <div className="space-y-5">
        <div className="flex flex-wrap gap-2 items-center">
          <Badge label={CRM_TASK_STATUS_LABELS[task.status]} colorCls={CRM_TASK_STATUS_COLORS[task.status]} />
          <Badge label={CRM_TASK_PRIORITY_LABELS[task.priority]} colorCls={CRM_TASK_PRIORITY_COLORS[task.priority]} />
          {task.reminderMinutesBefore != null && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-bg-elevated border border-border-subtle text-text-secondary">
              <Bell className="w-3 h-3" /> {task.reminderMinutesBefore}m
            </span>
          )}
        </div>

        <dl className="space-y-3">
          {task.description && <Field label="Description">{task.description}</Field>}
          {task.dueDate && (
            <Field label="Due Date">
              <span className={isPast(parseISO(task.dueDate)) && !isDone ? 'text-danger' : ''}>
                {format(parseISO(task.dueDate), 'MMM d, yyyy HH:mm')}
              </span>
            </Field>
          )}
          {task.assignedToUserName && <Field label="Assigned To">{task.assignedToUserName}</Field>}
          {task.dealTitle && <Field label="Deal">{task.dealTitle}</Field>}
          {task.completedAt && <Field label="Completed">{format(parseISO(task.completedAt), 'MMM d, yyyy HH:mm')}</Field>}
          {task.completionNotes && <Field label="Completion Notes">{task.completionNotes}</Field>}
          <Field label="Created">{format(parseISO(task.createdAt), 'MMM d, yyyy')}</Field>
        </dl>

        <div className="flex gap-2 pt-1">
          {!isDone && (
            <button onClick={() => complete.mutate(task.id)} disabled={complete.isPending} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-success-soft text-success text-xs font-semibold border border-[rgba(34,197,94,0.2)] hover:bg-success hover:text-bg transition-all disabled:opacity-50">
              {complete.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckSquare className="w-3.5 h-3.5" />} Mark Complete
            </button>
          )}
          <button onClick={() => setEditing(v => !v)} className="px-3 py-1.5 rounded-lg bg-bg-elevated text-text-secondary text-xs font-semibold border border-border-subtle hover:text-text-primary transition-all">
            {editing ? 'Cancel Edit' : 'Edit'}
          </button>
          {confirmDelete ? (
            <div className="flex gap-1.5 ml-auto">
              <button onClick={() => del.mutate(task.id, { onSuccess: onClose })} disabled={del.isPending} className="px-2 py-1 rounded-lg bg-danger-soft text-danger text-xs font-semibold border border-[rgba(244,63,94,0.2)] hover:bg-danger hover:text-bg transition-all">
                {del.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Confirm'}
              </button>
              <button onClick={() => setConfirmDelete(false)} className="text-xs text-text-muted hover:text-text-primary px-1">×</button>
            </div>
          ) : (
            <button onClick={() => setConfirmDelete(true)} className="ml-auto p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger-soft transition-all" title="Delete task">
              <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
            </button>
          )}
        </div>

        {editing && (
          <form onSubmit={e => {
            e.preventDefault();
            update.mutate({ id: task.id, data: { title: editForm.title || undefined, description: editForm.description || undefined, priority: editForm.priority ? Number(editForm.priority) as CrmTaskPriority : undefined, dueDate: editForm.dueDate || undefined, completionNotes: editForm.completionNotes || undefined } }, { onSuccess: () => setEditing(false) });
          }} className="space-y-3 pt-3 border-t border-border-subtle">
            <div><label className="block text-xs font-semibold text-text-muted mb-1">Title</label><input value={editForm.title} onChange={setEdit('title')} className={inputCls} /></div>
            <div><label className="block text-xs font-semibold text-text-muted mb-1">Description</label><textarea rows={2} value={editForm.description} onChange={setEdit('description')} className={`${inputCls} resize-none`} /></div>
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">Priority</label>
              <select value={editForm.priority} onChange={setEdit('priority')} className={`${selectCls} w-full`}>
                {Object.entries(CRM_TASK_PRIORITY_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
            </div>
            <div><label className="block text-xs font-semibold text-text-muted mb-1">Due Date</label><input type="datetime-local" value={editForm.dueDate} onChange={setEdit('dueDate')} className={inputCls} /></div>
            <div><label className="block text-xs font-semibold text-text-muted mb-1">Completion Notes</label><textarea rows={2} value={editForm.completionNotes} onChange={setEdit('completionNotes')} className={`${inputCls} resize-none`} /></div>
            <button type="submit" disabled={update.isPending} className="w-full py-2 rounded-xl bg-brand text-bg text-sm font-bold hover:bg-brand-light disabled:opacity-50 transition-all">
              {update.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Save Changes'}
            </button>
          </form>
        )}
      </div>
    </SlideOver>
  );
}

// ─── TaskCard ─────────────────────────────────────────────────────────────────

interface TaskCardProps {
  task: CrmTaskSummaryDto;
  onClick: () => void;
  onComplete: (id: string) => void;
  isCompleting: boolean;
}

function TaskCard({ task, onClick, onComplete, isCompleting }: TaskCardProps) {
  const isDone = task.status === CrmTaskStatus.Done;
  const isOverdue = task.dueDate ? isPast(parseISO(task.dueDate)) && !isDone : false;

  return (
    <div
      onClick={onClick}
      className="bg-glass-1 border-thin border-border-subtle rounded-card p-3.5 flex flex-col gap-3 cursor-pointer hover:bg-glass-2 hover:border-border-medium transition-all"
    >
      {/* Priority + status badges */}
      <div className="flex items-start justify-between gap-1">
        <span className={`px-1.5 py-0.5 rounded-xs text-[10px] font-semibold border-thin ${CRM_TASK_PRIORITY_COLORS[task.priority]}`}>
          {CRM_TASK_PRIORITY_LABELS[task.priority]}
        </span>
        <span className={`px-1.5 py-0.5 rounded-xs text-[10px] font-semibold border-thin ${CRM_TASK_STATUS_COLORS[task.status]}`}>
          {CRM_TASK_STATUS_LABELS[task.status]}
        </span>
      </div>

      {/* Title + deal */}
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-bold text-text-primary line-clamp-2 leading-snug">{task.title}</span>
        {task.dealTitle && (
          <span className="text-[10px] text-text-muted italic truncate">Deal: {task.dealTitle}</span>
        )}
      </div>

      {/* Due date */}
      <div className="flex items-center gap-1.5 text-[10px]">
        <Calendar className="w-3 h-3 text-text-muted shrink-0" strokeWidth={1.5} />
        {task.dueDate ? (
          <span className={isOverdue ? 'text-danger font-semibold' : 'text-text-secondary'}>
            {format(parseISO(task.dueDate), 'MMM d, yyyy')}{isOverdue ? ' · Overdue' : ''}
          </span>
        ) : (
          <span className="text-text-muted">No due date</span>
        )}
        {task.reminderMinutesBefore != null && (
          <Bell className="w-3 h-3 text-text-muted ml-auto shrink-0" strokeWidth={1.5} />
        )}
      </div>

      {/* Footer: assigned + action */}
      <div className="flex items-center justify-between pt-0.5 border-t border-thin border-border-subtle">
        <span className="text-[10px] text-text-muted truncate">
          {task.assignedToUserName ?? 'Unassigned'}
        </span>
        {isDone ? (
          <CheckSquare className="w-3.5 h-3.5 text-success shrink-0" strokeWidth={1.5} />
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); onComplete(task.id); }}
            disabled={isCompleting}
            className="flex items-center gap-1 px-2 py-0.5 rounded-xs bg-success-soft text-success text-[10px] font-semibold border-thin border-[rgba(34,197,94,0.2)] hover:bg-success hover:text-bg transition-all disabled:opacity-50"
          >
            <CheckSquare className="w-2.5 h-2.5" /> Done
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function Component() {
  const [page, setPage] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState<CrmTaskStatus | undefined>(undefined);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<CrmTaskPriority | undefined>(undefined);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTask, setSelectedTask] = useState<CrmTaskSummaryDto | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [selectedStatus, search, priorityFilter]);

  const filter: CrmTaskFilter = {
    status: selectedStatus,
    search: search || undefined,
    priority: priorityFilter,
    page,
    pageSize: PAGE_SIZE,
  };

  const { data: raw, isLoading } = useTasks(filter);
  const data = raw as unknown as PagedResult<CrmTaskSummaryDto> | undefined;
  const items: CrmTaskSummaryDto[] = (raw as any)?.items ?? [];

  const createTask = useCreateTask();
  const complete = useCompleteTask();

  const totalCount = data?.totalCount ?? 0;
  const fromItem = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const toItem = Math.min(page * PAGE_SIZE, totalCount);
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-text-primary tracking-tight">CRM — Tasks</h1>
            <p className="text-sm text-text-secondary mt-1">Manage and track your team's tasks</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-bg bg-brand hover:bg-brand-light transition-all"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2.5} /> New Task
          </button>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" strokeWidth={1.5} />
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Search tasks..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-bg-elevated border border-border-subtle rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-glow transition-colors"
            />
          </div>

          <div className="flex gap-1.5 flex-wrap">
            {STATUS_PILLS.map((pill) => {
              const isActive = pill.value === selectedStatus;
              return (
                <button
                  key={pill.label}
                  onClick={() => setSelectedStatus(pill.value)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-all ${
                    isActive
                      ? 'bg-brand-soft text-brand border-border-glow'
                      : 'bg-bg-elevated text-text-secondary border-border-subtle hover:border-border-medium'
                  }`}
                >
                  {pill.label}
                </button>
              );
            })}
          </div>

          <select
            value={priorityFilter ?? ''}
            onChange={e => setPriorityFilter(e.target.value ? Number(e.target.value) as CrmTaskPriority : undefined)}
            className="text-xs bg-bg-elevated border border-border-subtle rounded-xl px-3 py-2 text-text-secondary focus:outline-none focus:border-border-glow transition-colors cursor-pointer"
          >
            <option value="">All Priorities</option>
            {Object.entries(CRM_TASK_PRIORITY_LABELS).map(([k, l]) => (
              <option key={k} value={k}>{l}</option>
            ))}
          </select>
        </div>

        {/* Task grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-brand animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <CheckSquare className="w-10 h-10 text-text-muted mb-3" strokeWidth={1.2} />
            <p className="text-text-secondary font-semibold">No tasks found</p>
            <p className="text-sm text-text-muted mt-1">
              Create a task to start tracking your team's work
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {items.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onClick={() => setSelectedTask(task)}
                onComplete={(id) => complete.mutate(id)}
                isCompleting={complete.isPending}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalCount > 0 && (
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-text-muted">
              Showing {fromItem}–{toItem} of {totalCount} tasks
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl border border-border-subtle bg-bg-elevated text-text-secondary disabled:opacity-40 hover:border-border-medium transition-all"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Prev
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl border border-border-subtle bg-bg-elevated text-text-secondary disabled:opacity-40 hover:border-border-medium transition-all"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {showCreate && (
        <CreateForm
          onSave={req => createTask.mutate(req, { onSuccess: () => setShowCreate(false) })}
          onCancel={() => setShowCreate(false)}
          isSaving={createTask.isPending}
        />
      )}

      {selectedTask && <DetailPanel task={selectedTask} onClose={() => setSelectedTask(null)} />}
    </>
  );
}
