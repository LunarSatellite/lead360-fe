import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Pencil, Trash2, X, Loader2 } from 'lucide-react';
import {
  useNurtureSequences,
  useCreateNurtureSequence,
  useUpdateNurtureSequence,
  useDeleteNurtureSequence,
} from '../api/crm.queries';
import type {
  NurtureSequenceDto,
  NurtureSequenceCreateRequest,
  NurtureStepCreateRequest,
} from '../types/crm.types';
import {
  NurtureStepAction,
  NURTURE_ACTION_LABELS,
  LeadStage,
  LEAD_STAGE_LABELS,
  NurtureSequenceType,
  NURTURE_SEQUENCE_TYPE_LABELS,
  NURTURE_SEQUENCE_TYPE_DESCRIPTIONS,
  NurtureTriggerType,
} from '../types/crm.types';

// Format a delay (minutes, with hours fallback for legacy data) into a compact badge with a separator.
const delayBadge = (mins: number, hoursFallback: number, sep: string) => {
  const m = mins || hoursFallback * 60;
  if (m <= 0) return '';
  const s = m % 1440 === 0 ? `${m / 1440}d` : m % 60 === 0 ? `${m / 60}h` : `${m}m`;
  return `${sep}${s}`;
};

// ─── Step form state (no id yet) ─────────────────────────────────────────────
interface StepFormState {
  stepOrder: number;
  delayMinutes: number;
  actionType: NurtureStepAction;
  messageTemplate: string;
  newStage: LeadStage | '';
  tagToAdd: string;
}

function emptyStep(order: number): StepFormState {
  return {
    stepOrder: order,
    delayMinutes: 60,
    actionType: NurtureStepAction.SendMessage,
    messageTemplate: '',
    newStage: '',
    tagToAdd: '',
  };
}

// ─── Sequence form state ──────────────────────────────────────────────────────
interface SequenceFormState {
  name: string;
  description: string;
  triggerType: NurtureTriggerType;
  triggerStage: LeadStage;
  triggerScoreThreshold: number | null;
  triggerDelayMinutes: number;
  isActive: boolean;
  useAiPersonalization: boolean;
  useAiTiming: boolean;
  sequenceType: NurtureSequenceType;
  steps: StepFormState[];
}

function emptyForm(): SequenceFormState {
  return {
    name: '',
    description: '',
    triggerType: NurtureTriggerType.StageEntered,
    triggerStage: LeadStage.New,
    triggerScoreThreshold: null,
    triggerDelayMinutes: 60,
    isActive: true,
    useAiPersonalization: false,
    useAiTiming: false,
    sequenceType: NurtureSequenceType.Generic,
    steps: [],
  };
}

function sequenceToForm(seq: NurtureSequenceDto): SequenceFormState {
  return {
    name: seq.name,
    description: seq.description ?? '',
    triggerType: seq.triggerType ?? NurtureTriggerType.StageEntered,
    triggerStage: seq.triggerStage,
    triggerScoreThreshold: seq.triggerScoreThreshold ?? null,
    triggerDelayMinutes: seq.triggerDelayMinutes || seq.triggerDelayHours * 60,
    isActive: seq.isActive,
    useAiPersonalization: seq.useAiPersonalization,
    useAiTiming: seq.useAiTiming,
    sequenceType: seq.sequenceType ?? NurtureSequenceType.Generic,
    steps: seq.steps.map((s) => ({
      stepOrder: s.stepOrder,
      delayMinutes: s.delayMinutes || s.delayHours * 60,
      actionType: s.actionType,
      messageTemplate: s.messageTemplate ?? '',
      newStage: s.newStage ?? '',
      tagToAdd: s.tagToAdd ?? '',
    })),
  };
}

function formToRequest(form: SequenceFormState): NurtureSequenceCreateRequest {
  return {
    name: form.name.trim(),
    description: form.description.trim() || undefined,
    triggerType: form.triggerType,
    triggerStage: form.triggerStage,
    triggerScoreThreshold: form.triggerScoreThreshold ?? undefined,
    triggerDelayHours: 0,
    triggerDelayMinutes: form.triggerDelayMinutes,
    useAiPersonalization: form.useAiPersonalization,
    useAiTiming: form.useAiTiming,
    sequenceType: form.sequenceType,
    steps: form.steps.map((s, i) => ({
      stepOrder: i + 1,
      delayHours: 0,
      delayMinutes: s.delayMinutes,
      actionType: s.actionType,
      messageTemplate: s.actionType === NurtureStepAction.SendMessage ? s.messageTemplate : undefined,
      newStage: s.actionType === NurtureStepAction.ChangeStage && s.newStage !== '' ? (s.newStage as LeadStage) : undefined,
      tagToAdd: s.actionType === NurtureStepAction.AddTag ? s.tagToAdd : undefined,
    } satisfies NurtureStepCreateRequest)),
  };
}

// ─── Step Card ────────────────────────────────────────────────────────────────
function StepCard({
  step,
  index,
  onChange,
  onRemove,
}: {
  step: StepFormState;
  index: number;
  onChange: (updated: StepFormState) => void;
  onRemove: () => void;
}) {
  const set = <K extends keyof StepFormState>(key: K, value: StepFormState[K]) =>
    onChange({ ...step, [key]: value });

  return (
    <div className="bg-bg-elevated border border-border-subtle rounded-xl p-4 space-y-3">
      {/* Step header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-text-primary">Step {index + 1}</span>
        <button
          type="button"
          onClick={onRemove}
          className="text-text-muted hover:text-danger transition-colors p-1 rounded-lg hover:bg-danger-soft"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Delay */}
      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1">
          Delay (minutes after previous step)
        </label>
        <input
          type="number"
          min={0}
          value={step.delayMinutes}
          onChange={(e) => set('delayMinutes', Number(e.target.value))}
          className="w-full bg-bg border border-border-subtle rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-border-glow"
        />
      </div>

      {/* Action type */}
      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1">Action</label>
        <select
          value={step.actionType}
          onChange={(e) => set('actionType', Number(e.target.value) as NurtureStepAction)}
          className="w-full bg-bg border border-border-subtle rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-border-glow"
        >
          {Object.entries(NURTURE_ACTION_LABELS).map(([val, label]) => (
            <option key={val} value={val}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Conditional extra fields */}
      {step.actionType === NurtureStepAction.SendMessage && (
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Message Template</label>
          <textarea
            rows={3}
            value={step.messageTemplate}
            onChange={(e) => set('messageTemplate', e.target.value)}
            placeholder="Hi {{CustomerName}}, just checking in…"
            className="w-full bg-bg border border-border-subtle rounded-xl px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-border-glow resize-none"
          />
          <p className="text-xs text-text-muted mt-1">
            Available tokens:{' '}
            <code className="text-brand">{'{{CustomerName}}'}</code>{' '}
            <code className="text-brand">{'{{LastTopic}}'}</code>{' '}
            <code className="text-brand">{'{{BusinessName}}'}</code>
          </p>
        </div>
      )}

      {step.actionType === NurtureStepAction.ChangeStage && (
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">New Stage</label>
          <select
            value={step.newStage}
            onChange={(e) => set('newStage', e.target.value === '' ? '' : (Number(e.target.value) as LeadStage))}
            className="w-full bg-bg border border-border-subtle rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-border-glow"
          >
            <option value="">Select stage…</option>
            {Object.entries(LEAD_STAGE_LABELS).map(([val, label]) => (
              <option key={val} value={val}>
                {label}
              </option>
            ))}
          </select>
        </div>
      )}

      {step.actionType === NurtureStepAction.AddTag && (
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Tag</label>
          <input
            type="text"
            value={step.tagToAdd}
            onChange={(e) => set('tagToAdd', e.target.value)}
            placeholder="e.g. follow-up-needed"
            className="w-full bg-bg border border-border-subtle rounded-xl px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-border-glow"
          />
        </div>
      )}
    </div>
  );
}

// ─── Create / Edit Modal ──────────────────────────────────────────────────────
function SequenceModal({
  editing,
  onClose,
}: {
  editing: NurtureSequenceDto | null;
  onClose: () => void;
}) {
  const [form, setForm] = useState<SequenceFormState>(
    editing ? sequenceToForm(editing) : emptyForm()
  );
  const createMutation = useCreateNurtureSequence();
  const updateMutation = useUpdateNurtureSequence();

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const setField = <K extends keyof SequenceFormState>(key: K, value: SequenceFormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const addStep = () =>
    setForm((prev) => ({
      ...prev,
      steps: [...prev.steps, emptyStep(prev.steps.length + 1)],
    }));

  const updateStep = (index: number, updated: StepFormState) =>
    setForm((prev) => {
      const steps = [...prev.steps];
      steps[index] = updated;
      return { ...prev, steps };
    });

  const removeStep = (index: number) =>
    setForm((prev) => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index),
    }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = formToRequest(form);
    if (editing) {
      updateMutation.mutate(
        { id: editing.id, data: payload },
        { onSuccess: onClose }
      );
    } else {
      createMutation.mutate(payload, { onSuccess: onClose });
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-bg-elevated shadow-2xl flex flex-col border-thin border-border-subtle rounded-card max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle shrink-0">
          <h3 className="font-bold text-text-primary">
            {editing ? 'Edit Sequence' : 'New Nurture Sequence'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Name <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              placeholder="e.g. Warm Lead Follow-up"
              className="w-full bg-bg border border-border-subtle rounded-xl px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-border-glow"
            />
          </div>

          {/* Sequence Type */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Sequence Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(NURTURE_SEQUENCE_TYPE_LABELS) as [string, string][]).map(([val, label]) => {
                const numVal = Number(val) as NurtureSequenceType;
                const isSelected = form.sequenceType === numVal;
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setField('sequenceType', numVal)}
                    className={`text-left p-2.5 rounded-xl border transition-all ${
                      isSelected
                        ? 'border-brand bg-brand/5 text-brand'
                        : 'border-border-subtle bg-bg text-text-secondary hover:border-border-medium'
                    }`}
                  >
                    <p className="text-xs font-semibold">{label}</p>
                    <p className="text-[10px] text-text-muted mt-0.5 leading-snug">
                      {NURTURE_SEQUENCE_TYPE_DESCRIPTIONS[numVal]}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Description <span className="text-text-muted">(optional)</span>
            </label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              placeholder="Briefly describe what this sequence does…"
              className="w-full bg-bg border border-border-subtle rounded-xl px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-border-glow resize-none"
            />
          </div>

          {/* Trigger Type */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Trigger</label>
            <div className="grid grid-cols-2 gap-2">
              {([
                [NurtureTriggerType.StageEntered, 'Stage Entered', 'Lead reaches a specific stage'],
                [NurtureTriggerType.ScoreDropped, 'Score Dropped', 'Score falls to or below threshold'],
                [NurtureTriggerType.ScoreRaised,  'Score Raised',  'Score rises to or above threshold'],
                [NurtureTriggerType.Manual,        'Manual Only',   'Sales rep enrolls manually'],
              ] as const).map(([val, label, desc]) => {
                const isSelected = form.triggerType === val;
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setField('triggerType', val)}
                    className={`text-left p-2.5 rounded-xl border transition-all ${
                      isSelected
                        ? 'border-brand bg-brand/5 text-brand'
                        : 'border-border-subtle bg-bg text-text-secondary hover:border-border-medium'
                    }`}
                  >
                    <p className="text-xs font-semibold">{label}</p>
                    <p className="text-[10px] text-text-muted mt-0.5 leading-snug">{desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stage picker + delay */}
          {form.triggerType === NurtureTriggerType.StageEntered && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Trigger Stage</label>
                <select
                  value={form.triggerStage}
                  onChange={(e) => setField('triggerStage', Number(e.target.value) as LeadStage)}
                  className="w-full bg-bg border border-border-subtle rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-border-glow"
                >
                  {Object.entries(LEAD_STAGE_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Delay (minutes)</label>
                <input
                  type="number"
                  min={0}
                  value={form.triggerDelayMinutes}
                  onChange={(e) => setField('triggerDelayMinutes', Number(e.target.value))}
                  className="w-full bg-bg border border-border-subtle rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-border-glow"
                />
              </div>
            </div>
          )}

          {/* Score threshold + delay */}
          {(form.triggerType === NurtureTriggerType.ScoreDropped || form.triggerType === NurtureTriggerType.ScoreRaised) && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  {form.triggerType === NurtureTriggerType.ScoreDropped ? 'Score drops to or below' : 'Score rises to or above'}
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={form.triggerScoreThreshold ?? ''}
                  onChange={(e) =>
                    setField('triggerScoreThreshold', e.target.value === '' ? null : Number(e.target.value))
                  }
                  placeholder="e.g. 30"
                  className="w-full bg-bg border border-border-subtle rounded-xl px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-border-glow"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Delay (minutes)</label>
                <input
                  type="number"
                  min={0}
                  value={form.triggerDelayMinutes}
                  onChange={(e) => setField('triggerDelayMinutes', Number(e.target.value))}
                  className="w-full bg-bg border border-border-subtle rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-border-glow"
                />
              </div>
            </div>
          )}

          {/* Manual — info only */}
          {form.triggerType === NurtureTriggerType.Manual && (
            <p className="text-sm text-text-muted bg-bg-elevated border border-border-subtle rounded-xl px-4 py-3">
              This sequence won't auto-enroll — a sales rep must enroll leads manually from the lead detail view.
            </p>
          )}

          {/* Is Active toggle */}
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setField('isActive', e.target.checked)}
              className="w-4 h-4 accent-brand rounded"
            />
            <span className="text-sm text-text-primary">Active (auto-enroll matching leads)</span>
          </label>

          {/* AI Settings */}
          <div className="rounded-xl border border-border-subtle bg-bg-elevated p-4 space-y-3">
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider">AI Settings</p>
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.useAiPersonalization}
                onChange={(e) => setField('useAiPersonalization', e.target.checked)}
                className="w-4 h-4 accent-brand rounded mt-0.5 shrink-0"
              />
              <div>
                <span className="text-sm text-text-primary font-medium">AI Personalizes Messages</span>
                <p className="text-xs text-text-muted mt-0.5">
                  AI rewrites each message template to fit the lead's history and tone.
                </p>
              </div>
            </label>
            <label className={`flex items-start gap-3 cursor-pointer select-none ${!form.useAiPersonalization ? 'opacity-40 pointer-events-none' : ''}`}>
              <input
                type="checkbox"
                checked={form.useAiTiming}
                disabled={!form.useAiPersonalization}
                onChange={(e) => setField('useAiTiming', e.target.checked)}
                className="w-4 h-4 accent-brand rounded mt-0.5 shrink-0"
              />
              <div>
                <span className="text-sm text-text-primary font-medium">AI Controls Timing</span>
                <p className="text-xs text-text-muted mt-0.5">
                  AI overrides your step delays based on lead score — Hot leads get shorter waits, Cold leads get longer ones.
                </p>
              </div>
            </label>
            {!form.useAiPersonalization && (
              <p className="text-xs text-text-muted italic">
                Enable AI Personalizes Messages first to unlock timing control.
              </p>
            )}
          </div>

          {/* Steps builder */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text-primary">Steps</h3>
              <button
                type="button"
                onClick={addStep}
                className="flex items-center gap-1.5 text-xs font-medium text-brand hover:text-brand/80 bg-brand-soft px-3 py-1.5 rounded-xl transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Step
              </button>
            </div>

            {form.steps.length === 0 && (
              <p className="text-sm text-text-muted text-center py-4 border border-dashed border-border-subtle rounded-xl">
                No steps yet. Click "Add Step" to define what happens.
              </p>
            )}

            {form.steps.map((step, i) => (
              <StepCard
                key={i}
                step={step}
                index={i}
                onChange={(updated) => updateStep(i, updated)}
                onRemove={() => removeStep(i)}
              />
            ))}
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-border-subtle">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary bg-bg-elevated border border-border-subtle rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand hover:bg-brand/90 rounded-xl transition-colors disabled:opacity-60"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {editing ? 'Save Changes' : 'Create Sequence'}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Sequence Card ────────────────────────────────────────────────────────────
function SequenceCard({
  sequence,
  onEdit,
}: {
  sequence: NurtureSequenceDto;
  onEdit: (seq: NurtureSequenceDto) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const deleteMutation = useDeleteNurtureSequence();

  const previewSteps = sequence.steps.slice(0, 2);

  return (
    <div className="bg-glass-1 border-thin border-border-subtle rounded-card p-3.5 flex flex-col gap-3 hover:bg-glass-2 hover:border-border-medium transition-all">
      {/* Name + active badge */}
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-bold text-text-primary truncate leading-snug">{sequence.name}</span>
        <span
          className={`shrink-0 px-1.5 py-0.5 rounded-xs text-[10px] font-semibold border-thin ${
            sequence.isActive
              ? 'text-success bg-success-soft border-[rgba(34,197,94,0.2)]'
              : 'text-text-muted bg-bg-elevated border-border-subtle'
          }`}
        >
          {sequence.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      {/* Trigger meta */}
      <div className="flex flex-col gap-0.5">
        <span className="text-[10px] text-text-muted italic truncate">
          {sequence.triggerType === NurtureTriggerType.Manual
            ? 'Manual enrollment only'
            : sequence.triggerType === NurtureTriggerType.ScoreDropped
            ? `Triggers: Score ≤ ${sequence.triggerScoreThreshold ?? '?'}`
            : sequence.triggerType === NurtureTriggerType.ScoreRaised
            ? `Triggers: Score ≥ ${sequence.triggerScoreThreshold ?? '?'}`
            : `Triggers: ${LEAD_STAGE_LABELS[sequence.triggerStage]}${delayBadge(sequence.triggerDelayMinutes, sequence.triggerDelayHours, ' +')}`}
        </span>
        <span className="text-[10px] text-text-secondary font-semibold">
          {sequence.steps.length} {sequence.steps.length === 1 ? 'step' : 'steps'}
        </span>
      </div>

      {/* Type + AI flags */}
      <div className="flex flex-wrap gap-1">
        {sequence.sequenceType !== undefined && sequence.sequenceType !== NurtureSequenceType.Generic && (
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-bg-elevated text-text-secondary border border-border-subtle">
            {NURTURE_SEQUENCE_TYPE_LABELS[sequence.sequenceType as NurtureSequenceType]}
          </span>
        )}
        {sequence.useAiPersonalization && (
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-brand/10 text-brand border border-brand/20">
            AI Messages
          </span>
        )}
        {sequence.useAiTiming && (
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-brand/10 text-brand border border-brand/20">
            AI Timing
          </span>
        )}
      </div>

      {/* Step preview */}
      {previewSteps.length > 0 && (
        <div className="flex flex-col gap-0.5">
          {previewSteps.map((step, i) => (
            <p key={i} className="text-[10px] text-text-muted truncate">
              {step.stepOrder}. {NURTURE_ACTION_LABELS[step.actionType]}
              {delayBadge(step.delayMinutes, step.delayHours, ' · ')}
            </p>
          ))}
          {sequence.steps.length > 2 && (
            <p className="text-[10px] text-text-muted">+{sequence.steps.length - 2} more</p>
          )}
        </div>
      )}

      {/* Actions */}
      {confirmDelete ? (
        <div className="flex items-center gap-2 pt-0.5 border-t border-thin border-border-subtle">
          <span className="text-[10px] text-danger flex-1">Delete?</span>
          <button
            type="button"
            onClick={() => setConfirmDelete(false)}
            className="text-[10px] font-medium text-text-secondary hover:text-text-primary px-2 py-1 rounded-xs bg-bg-elevated border-thin border-border-subtle transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={deleteMutation.isPending}
            onClick={() => deleteMutation.mutate(sequence.id)}
            className="flex items-center gap-1 text-[10px] font-medium text-white bg-danger hover:bg-danger/90 px-2 py-1 rounded-xs transition-colors disabled:opacity-60"
          >
            {deleteMutation.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
            Delete
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between pt-0.5 border-t border-thin border-border-subtle">
          <button
            type="button"
            onClick={() => onEdit(sequence)}
            className="flex items-center gap-1 text-[10px] font-medium text-text-muted hover:text-text-primary transition-colors"
          >
            <Pencil className="w-3 h-3" />
            Edit
          </button>
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="flex items-center gap-1 text-[10px] font-medium text-danger/70 hover:text-danger transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export function Component() {
  const { data, isLoading } = useNurtureSequences();
  const [showCreate, setShowCreate] = useState(false);
  const [editingSequence, setEditingSequence] = useState<NurtureSequenceDto | null>(null);

  const sequences = (data as any) ?? [];

  return (
    <div className="p-6 space-y-6 w-full">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Nurture Sequences</h1>
          <p className="text-sm text-text-secondary mt-1">
            Automatically follow up with leads who go silent
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand hover:bg-brand/90 rounded-xl transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          New Sequence
        </button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-brand animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && sequences.length === 0 && (
        <div className="bg-bg-card border border-border-subtle rounded-2xl p-10 text-center">
          <p className="text-text-muted text-sm">
            No sequences yet. Create one to start automatically nurturing leads.
          </p>
        </div>
      )}

      {/* Sequence grid */}
      {!isLoading && sequences.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {sequences.map((seq: any) => (
            <SequenceCard key={seq.id} sequence={seq} onEdit={setEditingSequence} />
          ))}
        </div>
      )}

      {/* Modals */}
      {showCreate && (
        <SequenceModal editing={null} onClose={() => setShowCreate(false)} />
      )}
      {editingSequence && (
        <SequenceModal editing={editingSequence} onClose={() => setEditingSequence(null)} />
      )}
    </div>
  );
}
