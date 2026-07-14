import { useState } from 'react';
import { createPortal } from 'react-dom';
import { GitBranch, Plus, Trash2, Star, Loader2, Check, X, Pencil, ChevronRight, Shield, Lock } from 'lucide-react';
import {
  usePipelines, useCreatePipeline, useUpdatePipeline, useDeletePipeline, useSetPipelineDefault,
  usePipelineStages, useStageGates, useCreateStageGate, useDeleteStageGate,
  useCustomFieldDefinitions,
} from '../api/crm.queries';
import type {
  CrmPipelineSummaryDto, CrmDealStageSummaryDto, CrmStageGateSummaryDto, CustomFieldDefinitionDto,
} from '../types/crm.types';
import { StageGateType, STAGE_GATE_TYPE_LABELS, GATE_REQUIRED_FIELDS, CrmEntityType } from '../types/crm.types';

const DEAL_TYPE_LABELS: Record<number, string> = { 1: 'Sales', 2: 'Service', 3: 'Support', 4: 'Renewal' };
const DEAL_TYPE_COLORS: Record<number, string> = { 1: '#3B82F6', 2: '#8B5CF6', 3: '#EF4444', 4: '#10B981' };
const PRESET_COLORS = ['#3B82F6', '#8B5CF6', '#EF4444', '#10B981', '#F59E0B', '#06B6D4', '#EC4899', '#6B7280'];

// ─── Add Gate Form ─────────────────────────────────────────────────────────────

interface AddGateFormProps {
  stageId: string;
  onDone: () => void;
}

function AddGateForm({ stageId, onDone }: AddGateFormProps) {
  const [gateType, setGateType] = useState<StageGateType>(StageGateType.ManualCheck);
  const [label, setLabel] = useState('');
  const [isRequired, setIsRequired] = useState(true);
  const create = useCreateStageGate();

  // Load custom fields defined for Deals so they appear alongside native fields
  const { data: cfRaw } = useCustomFieldDefinitions(CrmEntityType.Deal);
  const customFields: CustomFieldDefinitionDto[] = (cfRaw as unknown as CustomFieldDefinitionDto[] | undefined) ?? [];
  const allRequiredFields: { value: string; label: string }[] = [
    ...(GATE_REQUIRED_FIELDS as readonly { value: string; label: string }[]),
    ...customFields.filter(f => f.isActive).map(f => ({ value: f.name, label: `${f.name} must be set` })),
  ];

  const [fieldName, setFieldName] = useState<string>(GATE_REQUIRED_FIELDS[0]?.value ?? '');

  const handleSubmit = () => {
    if (!label.trim()) return;
    create.mutate({
      stageId,
      data: {
        gateType,
        label: label.trim(),
        requiredFieldName: gateType === StageGateType.RequiredField ? fieldName : undefined,
        order: 0,
        isRequired,
      },
    }, { onSuccess: onDone });
  };

  return (
    <div className="rounded-xl border border-brand/30 bg-brand/5 p-3 space-y-2.5 mt-1.5">
      <p className="text-xs font-bold text-text-primary">Add Exit Gate</p>

      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-[10px] text-text-muted font-semibold uppercase tracking-wide block mb-1">Type</label>
          <select
            value={gateType}
            onChange={(e) => setGateType(Number(e.target.value) as StageGateType)}
            className="w-full px-2 py-1.5 rounded-lg text-xs border border-border-subtle bg-bg-elevated text-text-primary focus:outline-none focus:ring-1 focus:ring-brand"
          >
            <option value={StageGateType.ManualCheck}>{STAGE_GATE_TYPE_LABELS[StageGateType.ManualCheck]}</option>
            <option value={StageGateType.RequiredField}>{STAGE_GATE_TYPE_LABELS[StageGateType.RequiredField]}</option>
          </select>
        </div>
        <label className="flex items-center gap-1.5 mt-5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isRequired}
            onChange={(e) => setIsRequired(e.target.checked)}
            className="accent-brand w-3.5 h-3.5"
          />
          <span className="text-xs text-text-secondary">Required</span>
        </label>
      </div>

      {gateType === StageGateType.RequiredField ? (
        <div>
          <label className="text-[10px] text-text-muted font-semibold uppercase tracking-wide block mb-1">Field</label>
          <select
            value={fieldName}
            onChange={(e) => setFieldName(e.target.value)}
            className="w-full px-2 py-1.5 rounded-lg text-xs border border-border-subtle bg-bg-elevated text-text-primary focus:outline-none focus:ring-1 focus:ring-brand"
          >
            {allRequiredFields.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>
      ) : (
        <div>
          <label className="text-[10px] text-text-muted font-semibold uppercase tracking-wide block mb-1">Label</label>
          <input
            autoFocus
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Contract signed"
            className="w-full px-2 py-1.5 rounded-lg text-xs border border-border-subtle bg-bg-elevated text-text-primary focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>
      )}

      {gateType === StageGateType.RequiredField && (
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder={`Label (e.g. "${allRequiredFields.find(f => f.value === fieldName)?.label ?? fieldName}")`}
          className="w-full px-2 py-1.5 rounded-lg text-xs border border-border-subtle bg-bg-elevated text-text-primary focus:outline-none focus:ring-1 focus:ring-brand"
        />
      )}

      <div className="flex gap-2 justify-end">
        <button
          onClick={onDone}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-text-secondary border border-border-subtle hover:bg-bg-elevated"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!label.trim() || create.isPending}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-bg bg-brand hover:bg-brand-light disabled:opacity-50"
        >
          {create.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Plus className="w-3 h-3" /> Add</>}
        </button>
      </div>
    </div>
  );
}

// ─── Stage Gate List ───────────────────────────────────────────────────────────

function StageGateList({ stageId }: { stageId: string }) {
  const { data: rawGates, isLoading } = useStageGates(stageId);
  const gates = (rawGates as unknown as CrmStageGateSummaryDto[] | undefined) ?? [];
  const deleteGate = useDeleteStageGate();
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div className="ml-5 mt-1 space-y-1 pb-2">
      {isLoading && (
        <div className="flex items-center gap-1.5 py-2 text-text-muted">
          <Loader2 className="w-3 h-3 animate-spin" />
          <span className="text-xs">Loading gates…</span>
        </div>
      )}

      {!isLoading && gates.length === 0 && !showAdd && (
        <p className="text-xs text-text-muted py-1.5 italic">No exit gates — stage can always be advanced.</p>
      )}

      {gates.map((gate: CrmStageGateSummaryDto) => (
        <div key={gate.id} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-bg-elevated group">
          <Lock className="w-3 h-3 text-text-muted shrink-0" strokeWidth={1.5} />
          <span className="text-xs text-text-primary flex-1 leading-snug">{gate.label}</span>
          <span className="text-[10px] text-text-muted font-medium shrink-0">
            {STAGE_GATE_TYPE_LABELS[gate.gateType as keyof typeof STAGE_GATE_TYPE_LABELS]}
          </span>
          {gate.isRequired ? (
            <span className="text-[10px] text-danger font-bold shrink-0">required</span>
          ) : (
            <span className="text-[10px] text-text-muted shrink-0">optional</span>
          )}
          <button
            onClick={() => deleteGate.mutate({ gateId: gate.id, stageId })}
            disabled={deleteGate.isPending}
            className="p-1 rounded text-text-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      ))}

      {showAdd ? (
        <AddGateForm stageId={stageId} onDone={() => setShowAdd(false)} />
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1 text-xs text-brand hover:text-brand-light transition-colors mt-1"
        >
          <Plus className="w-3 h-3" strokeWidth={2.5} /> Add gate
        </button>
      )}
    </div>
  );
}

// ─── Stage Gate Config Panel ───────────────────────────────────────────────────

function StageGateConfigPanel({ pipelineId }: { pipelineId: string }) {
  const { data: rawStages, isLoading } = usePipelineStages(pipelineId);
  const stages = (rawStages as unknown as CrmDealStageSummaryDto[] | undefined) ?? [];
  const [expandedStageId, setExpandedStageId] = useState<string | null>(null);

  const toggle = (id: string) => setExpandedStageId((prev) => (prev === id ? null : id));

  if (isLoading) {
    return (
      <div className="mt-3 pt-3 border-t border-border-subtle flex items-center gap-2 text-text-muted">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        <span className="text-xs">Loading stages…</span>
      </div>
    );
  }

  if (stages.length === 0) {
    return (
      <div className="mt-3 pt-3 border-t border-border-subtle">
        <p className="text-xs text-text-muted italic">No stages linked to this pipeline yet.</p>
      </div>
    );
  }

  return (
    <div className="mt-3 pt-3 border-t border-border-subtle">
      <div className="flex items-center gap-2 mb-2">
        <Shield className="w-3.5 h-3.5 text-brand" strokeWidth={1.5} />
        <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Stage Exit Gates</p>
      </div>
      <div className="space-y-0.5">
        {stages.map((stage: CrmDealStageSummaryDto) => (
          <div key={stage.id}>
            <button
              onClick={() => toggle(stage.id)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-bg-elevated transition-colors text-left group"
            >
              <ChevronRight
                className={`w-3.5 h-3.5 text-text-muted transition-transform shrink-0 ${expandedStageId === stage.id ? 'rotate-90' : ''}`}
                strokeWidth={2}
              />
              <span className="text-sm font-medium text-text-primary flex-1">{stage.name}</span>
              {stage.order != null && (
                <span className="text-[10px] text-text-muted">#{stage.order + 1}</span>
              )}
            </button>
            {expandedStageId === stage.id && <StageGateList stageId={stage.id} />}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Edit Pipeline Modal ───────────────────────────────────────────────────────

interface EditPipelineModalProps {
  pipeline: CrmPipelineSummaryDto;
  onClose: () => void;
}

function EditPipelineModal({ pipeline, onClose }: EditPipelineModalProps) {
  const [editName, setEditName] = useState(pipeline.name);
  const [editDescription, setEditDescription] = useState(pipeline.description ?? '');
  const [editColor, setEditColor] = useState(pipeline.color ?? '#3B82F6');
  const update = useUpdatePipeline();

  const handleSave = () => {
    if (!editName.trim()) return;
    update.mutate(
      { id: pipeline.id, data: { name: editName.trim(), color: editColor, description: editDescription.trim() || undefined } },
      { onSuccess: onClose },
    );
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-bg rounded-2xl border border-border-subtle shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <Pencil className="w-4 h-4 text-brand" strokeWidth={1.5} />
            <h3 className="text-sm font-bold text-text-primary">Edit Pipeline</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="text-[10px] font-semibold text-text-muted uppercase tracking-wide block mb-1.5">Pipeline name</label>
            <input
              autoFocus
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              className="w-full px-3 py-2.5 rounded-xl text-sm border border-border-subtle bg-bg-elevated text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-glow focus:bg-glass-1 transition-colors"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-text-muted uppercase tracking-wide block mb-1.5">Description <span className="normal-case font-normal">(optional)</span></label>
            <input
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Short description…"
              className="w-full px-3 py-2.5 rounded-xl text-sm border border-border-subtle bg-bg-elevated text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-glow focus:bg-glass-1 transition-colors"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-text-muted uppercase tracking-wide block mb-2">Color</label>
            <div className="flex items-center gap-3">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setEditColor(c)}
                  className={`w-6 h-6 rounded-full transition-transform ${editColor === c ? 'scale-125 ring-2 ring-offset-2 ring-offset-bg ring-brand' : 'hover:scale-110'}`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border-subtle">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-text-secondary border border-border-subtle hover:bg-bg-elevated transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!editName.trim() || update.isPending}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-bg bg-brand hover:bg-brand-light disabled:opacity-50 transition-all"
          >
            {update.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Check className="w-3.5 h-3.5" /> Save</>}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ─── Pipeline Row ──────────────────────────────────────────────────────────────

interface PipelineRowProps {
  pipeline: CrmPipelineSummaryDto;
  expanded: boolean;
  onToggle: () => void;
}

function PipelineRow({ pipeline, expanded, onToggle }: PipelineRowProps) {
  const [showEdit, setShowEdit] = useState(false);
  const deletePipeline = useDeletePipeline();
  const setDefault = useSetPipelineDefault();

  const handleDelete = () => {
    if (!confirm(`Delete pipeline "${pipeline.name}"? Stages will be unlinked but not deleted.`)) return;
    deletePipeline.mutate(pipeline.id);
  };

  return (
    <>
      {showEdit && (
        <EditPipelineModal pipeline={pipeline} onClose={() => setShowEdit(false)} />
      )}
      <div className={`rounded-2xl border transition-all ${pipeline.isDefault ? 'border-brand/40 bg-brand/5' : 'border-border-subtle bg-bg-elevated'} ${expanded ? 'shadow-sm' : ''}`}>
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <button
              onClick={onToggle}
              className="flex items-center gap-3 min-w-0 flex-1 text-left"
            >
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ background: pipeline.color ?? '#6B7280' }}
              />
              <span className="text-sm font-bold text-text-primary">{pipeline.name}</span>
              {pipeline.isDefault && (
                <span className="flex items-center gap-0.5 text-[10px] font-bold text-brand uppercase tracking-wide shrink-0">
                  <Star className="w-3 h-3" /> default
                </span>
              )}
              {pipeline.dealType != null && (
                <span
                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full text-white shrink-0"
                  style={{ background: DEAL_TYPE_COLORS[pipeline.dealType] ?? '#6B7280' }}
                >
                  {DEAL_TYPE_LABELS[pipeline.dealType] ?? 'Custom'}
                </span>
              )}
            </button>

            <div className="flex items-center gap-1.5 shrink-0">
              {!pipeline.isDefault && (
                <button
                  onClick={() => setDefault.mutate(pipeline.id)}
                  disabled={setDefault.isPending}
                  className="p-1.5 rounded-lg text-text-muted hover:text-brand hover:bg-brand/10 transition-colors"
                  title="Set as default"
                >
                  <Star className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => setShowEdit(true)}
                className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-card transition-colors"
                title="Edit pipeline"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              {!pipeline.isDefault && (
                <button
                  onClick={handleDelete}
                  className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={onToggle}
                className="p-1.5 rounded-lg text-text-muted hover:text-brand hover:bg-brand/10 transition-colors"
                title={expanded ? 'Hide stage gates' : 'Configure stage gates'}
              >
                <ChevronRight className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-90' : ''}`} />
              </button>
            </div>
          </div>

          {pipeline.description && (
            <p className="text-xs text-text-muted mt-1.5 ml-6">{pipeline.description}</p>
          )}

          <div className="flex items-center gap-4 mt-2 ml-6 text-xs text-text-muted">
            <span>{pipeline.stageCount} stage{pipeline.stageCount !== 1 ? 's' : ''}</span>
            {!pipeline.isActive && <span className="text-danger font-semibold">Inactive</span>}
          </div>

          {expanded && <StageGateConfigPanel pipelineId={pipeline.id} />}
        </div>
      </div>
    </>
  );
}

// ─── Create Pipeline Modal ─────────────────────────────────────────────────────

interface CreateFormProps {
  onCreated: () => void;
  onCancel: () => void;
}

function CreatePipelineModal({ onCreated, onCancel }: CreateFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#3B82F6');
  const create = useCreatePipeline();

  const handleSubmit = () => {
    if (!name.trim()) return;
    create.mutate({ name: name.trim(), description: description.trim() || undefined, color }, {
      onSuccess: onCreated,
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-md bg-bg rounded-2xl border border-border-subtle shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-brand" strokeWidth={1.5} />
            <h3 className="text-sm font-bold text-text-primary">New Pipeline</h3>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="text-[10px] font-semibold text-text-muted uppercase tracking-wide block mb-1.5">Pipeline name</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="e.g. Sales Pipeline"
              className="w-full px-3 py-2.5 rounded-xl text-sm border border-border-subtle bg-bg-elevated text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-glow focus:bg-glass-1 transition-colors"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-text-muted uppercase tracking-wide block mb-1.5">Description <span className="normal-case font-normal">(optional)</span></label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description…"
              className="w-full px-3 py-2.5 rounded-xl text-sm border border-border-subtle bg-bg-elevated text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-glow focus:bg-glass-1 transition-colors"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-text-muted uppercase tracking-wide block mb-2">Color</label>
            <div className="flex items-center gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full transition-transform ${color === c ? 'scale-125 ring-2 ring-offset-2 ring-offset-bg ring-brand' : 'hover:scale-110'}`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border-subtle">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-text-secondary border border-border-subtle hover:bg-bg-elevated transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || create.isPending}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-bg bg-brand hover:bg-brand-light disabled:opacity-50 transition-all"
          >
            {create.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Plus className="w-3.5 h-3.5" strokeWidth={2.5} /> Create</>}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function Component() {
  const [showCreate, setShowCreate] = useState(false);
  const [expandedPipelineId, setExpandedPipelineId] = useState<string | null>(null);
  const { data: rawPipelines, isLoading } = usePipelines();
  const pipelines = (rawPipelines as unknown as CrmPipelineSummaryDto[] | undefined) ?? [];

  const grouped = pipelines.reduce<Record<string, CrmPipelineSummaryDto[]>>((acc, p) => {
    const key = p.dealType != null ? (DEAL_TYPE_LABELS[p.dealType] ?? 'Custom') : 'Custom';
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  const togglePipeline = (id: string) =>
    setExpandedPipelineId((prev) => (prev === id ? null : id));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-text-primary tracking-tight flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-brand" strokeWidth={1.5} />
            Pipelines
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            Manage pipelines and configure stage exit gates.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-bg bg-brand hover:bg-brand-light transition-all"
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={2.5} /> New Pipeline
        </button>
      </div>

      {showCreate && (
        <CreatePipelineModal
          onCreated={() => setShowCreate(false)}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-40 text-text-muted">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6">
          {Object.entries(grouped).map(([group, items]) => (
            <div key={group}>
              <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3">{group}</p>
              <div className="space-y-3">
                {items.map((p) => (
                  <PipelineRow
                    key={p.id}
                    pipeline={p}
                    expanded={expandedPipelineId === p.id}
                    onToggle={() => togglePipeline(p.id)}
                  />
                ))}
              </div>
            </div>
          ))}
          {pipelines.length === 0 && !showCreate && (
            <div className="text-center py-16 text-text-muted">
              <GitBranch className="w-10 h-10 mx-auto mb-3 opacity-30" strokeWidth={1} />
              <p className="text-sm font-semibold">No pipelines yet</p>
              <p className="text-xs mt-1">Create your first pipeline to organize deals.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
