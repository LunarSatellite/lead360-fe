import { useState } from 'react';
import { confirmDialog } from '@/shared/ui/confirm';
import { createPortal } from 'react-dom';
import {
  ListChecks, Plus, Trash2, Loader2, X, ChevronDown, ChevronUp, Pencil,
  GripVertical, Play,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import {
  useProcessDefinitions, useCreateProcessDefinition, useUpdateProcessDefinition,
  useDeleteProcessDefinition, useStartProcess,
} from '../api/process-workflow.queries';
import type {
  ProcessDefinitionDto,
  CreateProcessDefinitionRequest, CreateProcessStepRequest, UpdateProcessDefinitionRequest,
} from '../types/process-workflow.types';

// ─── Step Row ────────────────────────────────────────────────────────────────

interface StepEditorProps {
  index: number;
  step: CreateProcessStepRequest;
  onChange: (index: number, step: CreateProcessStepRequest) => void;
  onRemove: (index: number) => void;
}

function StepEditor({ index, step, onChange, onRemove }: StepEditorProps) {
  return (
    <div className="rounded-xl border border-border-subtle bg-bg-elevated p-3 space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GripVertical className="w-3.5 h-3.5 text-text-muted" strokeWidth={1.5} />
          <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Step {index + 1}</span>
        </div>
        <button
          onClick={() => onRemove(index)}
          className="p-1 rounded text-text-muted hover:text-danger transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <input
        value={step.name}
        onChange={e => onChange(index, { ...step, name: e.target.value })}
        placeholder="Step name"
        className="w-full px-3 py-2 rounded-xl text-sm border border-border-subtle bg-bg text-text-primary focus:outline-none focus:ring-1 focus:ring-brand"
      />

      <input
        value={step.description ?? ''}
        onChange={e => onChange(index, { ...step, description: e.target.value || undefined })}
        placeholder="Description (optional)"
        className="w-full px-3 py-2 rounded-xl text-sm border border-border-subtle bg-bg text-text-primary focus:outline-none focus:ring-1 focus:ring-brand"
      />

      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-[10px] text-text-muted font-semibold uppercase tracking-wide block mb-1">Team Label</label>
          <input
            value={step.assignedTeamLabel ?? ''}
            onChange={e => onChange(index, { ...step, assignedTeamLabel: e.target.value || undefined })}
            placeholder="e.g. Sales, Support"
            className="w-full px-2 py-1.5 rounded-lg text-xs border border-border-subtle bg-bg text-text-primary focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>
        <div className="w-28">
          <label className="text-[10px] text-text-muted font-semibold uppercase tracking-wide block mb-1">SLA (hrs)</label>
          <input
            type="number"
            min={1}
            value={step.slaHours ?? 24}
            onChange={e => onChange(index, { ...step, slaHours: parseInt(e.target.value) || 24 })}
            className="w-full px-2 py-1.5 rounded-lg text-xs border border-border-subtle bg-bg text-text-primary focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>
      </div>
    </div>
  );
}

// ─── Definition Form (create/edit) ───────────────────────────────────────────

interface DefinitionFormProps {
  initial?: ProcessDefinitionDto;
  onDone: () => void;
  onCancel: () => void;
}

function DefinitionForm({ initial, onDone, onCancel }: DefinitionFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [steps, setSteps] = useState<CreateProcessStepRequest[]>(
    (initial?.steps ?? []).map(s => ({
      stepOrder: s.stepOrder,
      name: s.name,
      description: s.description ?? undefined,
      assignedTeamLabel: s.assignedTeamLabel ?? undefined,
      assignedToUserId: s.assignedToUserId ?? undefined,
      slaHours: s.slaHours,
    })).length > 0
      ? (initial?.steps ?? []).map(s => ({
          stepOrder: s.stepOrder,
          name: s.name,
          description: s.description ?? undefined,
          assignedTeamLabel: s.assignedTeamLabel ?? undefined,
          assignedToUserId: s.assignedToUserId ?? undefined,
          slaHours: s.slaHours,
        }))
      : [{ stepOrder: 1, name: '', slaHours: 24 }]
  );

  const create = useCreateProcessDefinition();
  const update = useUpdateProcessDefinition();
  const isPending = create.isPending || update.isPending;
  const isEdit = !!initial;

  const handleStepChange = (index: number, step: CreateProcessStepRequest) => {
    const next = [...steps];
    next[index] = { ...step, stepOrder: index + 1 };
    setSteps(next);
  };

  const addStep = () => {
    setSteps([...steps, { stepOrder: steps.length + 1, name: '', slaHours: 24 }]);
  };

  const removeStep = (index: number) => {
    if (steps.length <= 1) return;
    setSteps(steps.filter((_, i) => i !== index).map((s, i) => ({ ...s, stepOrder: i + 1 })));
  };

  const handleSubmit = () => {
    if (!name.trim() || steps.some(s => !s.name.trim())) return;

    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
      steps: steps.map((s, i) => ({
        stepOrder: i + 1,
        name: s.name.trim(),
        description: s.description,
        assignedTeamLabel: s.assignedTeamLabel || undefined,
        assignedToUserId: s.assignedToUserId,
        slaHours: s.slaHours ?? 24,
      })),
    };

    if (isEdit && initial) {
      update.mutate(
        { id: initial.id, data: { ...payload, isActive } as UpdateProcessDefinitionRequest },
        { onSuccess: onDone }
      );
    } else {
      create.mutate(payload as CreateProcessDefinitionRequest, { onSuccess: onDone });
    }
  };

  return (
    <div className="rounded-2xl border border-brand/40 bg-brand/5 p-4 space-y-4">
      <p className="text-sm font-bold text-text-primary">
        {isEdit ? 'Edit Definition' : 'New Definition'}
      </p>

      <input
        autoFocus
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Definition name"
        className="w-full px-3 py-2 rounded-xl text-sm border border-border-subtle bg-bg-elevated text-text-primary focus:outline-none focus:ring-1 focus:ring-brand"
      />

      <input
        value={description}
        onChange={e => setDescription(e.target.value)}
        placeholder="Description (optional)"
        className="w-full px-3 py-2 rounded-xl text-sm border border-border-subtle bg-bg-elevated text-text-primary focus:outline-none focus:ring-1 focus:ring-brand"
      />

      {isEdit && (
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isActive}
            onChange={e => setIsActive(e.target.checked)}
            className="accent-brand w-3.5 h-3.5"
          />
          <span className="text-xs text-text-secondary font-medium">Active</span>
        </label>
      )}

      {/* Steps */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Steps</p>
          <button
            onClick={addStep}
            className="flex items-center gap-1 text-xs text-brand hover:text-brand-light font-semibold"
          >
            <Plus className="w-3 h-3" strokeWidth={2.5} /> Add Step
          </button>
        </div>
        {steps.map((step, i) => (
          <StepEditor
            key={i}
            index={i}
            step={step}
            onChange={handleStepChange}
            onRemove={removeStep}
          />
        ))}
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-lg text-xs font-semibold text-text-secondary border border-border-subtle hover:bg-bg-elevated transition-all"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!name.trim() || steps.some(s => !s.name.trim()) || isPending}
          className="px-4 py-2 rounded-lg text-xs font-bold text-bg bg-brand hover:bg-brand-light disabled:opacity-50 transition-all"
        >
          {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : isEdit ? 'Save' : 'Create'}
        </button>
      </div>
    </div>
  );
}

// ─── Definition Card ─────────────────────────────────────────────────────────

function DefinitionCard({
  definition,
  onEdit,
  onDelete,
  onStart,
}: {
  definition: ProcessDefinitionDto;
  onEdit: () => void;
  onDelete: () => void;
  onStart: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const steps = definition.steps ?? [];

  return (
    <div className="rounded-2xl border border-border-subtle bg-bg-elevated overflow-hidden transition-all">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-text-primary">{definition.name}</h3>
              {!definition.isActive && (
                <span className="text-[10px] font-bold text-danger uppercase tracking-wide border border-danger/30 bg-danger/10 px-1.5 py-0.5 rounded">
                  Inactive
                </span>
              )}
            </div>
            {definition.description && (
              <p className="text-xs text-text-muted mt-0.5">{definition.description}</p>
            )}
            <div className="flex items-center gap-3 mt-2 text-xs text-text-muted">
              <span>{steps.length} step{steps.length !== 1 ? 's' : ''}</span>
              {definition.createdAt && (
                <span>Created {format(parseISO(definition.createdAt), 'MMM d, yyyy')}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={onStart}
              className="p-1.5 rounded-lg text-text-muted hover:text-success hover:bg-success/10 transition-colors"
              title="Start instance"
            >
              <Play className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onEdit}
              className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-card transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1.5 rounded-lg text-text-muted hover:text-brand hover:bg-brand/10 transition-colors"
            >
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {expanded && steps.length > 0 && (
        <div className="border-t border-border-subtle px-4 py-3 space-y-2">
          {[...steps]
            .sort((a, b) => a.stepOrder - b.stepOrder)
            .map((step) => (
              <div key={step.id} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-bg">
                <span className="w-5 h-5 rounded-full bg-brand/10 text-brand text-[10px] font-bold flex items-center justify-center shrink-0">
                  {step.stepOrder}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-text-primary">{step.name}</p>
                  {step.description && (
                    <p className="text-[11px] text-text-muted">{step.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-text-muted shrink-0">
                  {step.assignedTeamLabel && (
                    <span className="px-1.5 py-0.5 rounded bg-bg-elevated border border-border-subtle font-medium">
                      {step.assignedTeamLabel}
                    </span>
                  )}
                  <span className="font-medium">{step.slaHours}h SLA</span>
                </div>
              </div>
            ))}
        </div>
      )}

      {expanded && steps.length === 0 && (
        <div className="border-t border-border-subtle px-4 py-6 text-center text-sm text-text-muted">
          No steps defined for this process.
        </div>
      )}
    </div>
  );
}

// ─── Start Instance Modal ────────────────────────────────────────────────────

function StartInstanceModal({
  definition, onClose,
}: {
  definition: ProcessDefinitionDto;
  onClose: () => void;
}) {
  const [triggerRefKind, setTriggerRefKind] = useState('');
  const start = useStartProcess();

  const handleStart = () => {
    start.mutate(
      {
        processDefinitionId: definition.id,
        triggerKind: 1,
        triggerRefKind: triggerRefKind || undefined,
      },
      { onSuccess: onClose }
    );
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-bg shadow-2xl rounded-2xl border border-border-subtle">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
          <h3 className="font-bold text-text-primary">Start Instance</h3>
          <button onClick={onClose} className="p-1 rounded-lg text-text-muted hover:text-text-primary">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-text-secondary">
            Start a new process instance for <span className="font-semibold text-text-primary">"{definition.name}"</span>?
          </p>
          <p className="text-xs text-text-muted">This will create the first task immediately.</p>

          <input
            value={triggerRefKind}
            onChange={e => setTriggerRefKind(e.target.value)}
            placeholder="Reference kind (e.g. deal, case)"
            className="w-full px-3 py-2 rounded-xl text-sm border border-border-subtle bg-bg-elevated text-text-primary focus:outline-none focus:ring-1 focus:ring-brand"
          />

          <div className="flex gap-2 justify-end pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-text-secondary border border-border-subtle hover:bg-bg-elevated"
            >
              Cancel
            </button>
            <button
              onClick={handleStart}
              disabled={start.isPending}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-bg bg-brand hover:bg-brand-light disabled:opacity-50"
            >
              {start.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              Start
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function Component() { return <ProcessWorkflowDefinitionsPage />; }

function ProcessWorkflowDefinitionsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [startingId, setStartingId] = useState<string | null>(null);
  const { data: rawDefs, isLoading } = useProcessDefinitions();
  const definitions = (rawDefs as unknown as ProcessDefinitionDto[] | undefined) ?? [];
  const deleteDef = useDeleteProcessDefinition();

  const editingDef = editingId ? definitions.find(d => d.id === editingId) ?? null : null;
  const startingDef = startingId ? definitions.find(d => d.id === startingId) ?? null : null;

  const handleDelete = async (id: string, name: string) => {
    if (!(await confirmDialog({ message: `Delete definition "${name}"? This cannot be undone.`, confirmText: 'Delete', danger: true }))) return;
    deleteDef.mutate(id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-violet-DEFAULT/10 border border-violet-DEFAULT/20">
            <ListChecks className="w-5 h-5 text-violet-DEFAULT" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Process Definitions</h1>
            <p className="text-sm text-text-muted">Manage process workflow templates</p>
          </div>
        </div>
        <button
          onClick={() => { setShowCreate(true); setEditingId(null); }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-bg bg-brand hover:bg-brand-light transition-all"
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={2.5} /> New Definition
        </button>
      </div>

      {/* Create form inline */}
      {showCreate && !editingId && (
        <DefinitionForm
          onDone={() => setShowCreate(false)}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {/* Edit form inline */}
      {editingDef && (
        <DefinitionForm
          initial={editingDef}
          onDone={() => setEditingId(null)}
          onCancel={() => setEditingId(null)}
        />
      )}

      {/* Loading */}
      {isLoading ? (
        <div className="flex items-center justify-center h-40 text-text-muted">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {definitions.map(def => (
            <DefinitionCard
              key={def.id}
              definition={def}
              onEdit={() => { setEditingId(def.id); setShowCreate(false); }}
              onDelete={() => handleDelete(def.id, def.name)}
              onStart={() => setStartingId(def.id)}
            />
          ))}

          {definitions.length === 0 && !showCreate && (
            <div className="text-center py-20 text-text-muted">
              <ListChecks className="w-10 h-10 mx-auto mb-3 opacity-30" strokeWidth={1} />
              <p className="text-sm font-semibold">No definitions yet</p>
              <p className="text-xs mt-1">Create your first process workflow definition.</p>
            </div>
          )}
        </div>
      )}

      {/* Start instance modal */}
      {startingDef && (
        <StartInstanceModal
          definition={startingDef}
          onClose={() => setStartingId(null)}
        />
      )}
    </div>
  );
}
