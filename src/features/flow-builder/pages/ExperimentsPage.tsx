import { useState } from 'react';
import {
  FlaskConical, Plus, Loader2, Play, Pause, Trophy, CheckCircle,
  RotateCcw, Trash2, X, Check, Pencil, ChevronDown, ChevronUp,
  TrendingUp, MessageSquare, Users, Zap,
} from 'lucide-react';
import {
  useExperiments, useExperimentById,
  useCreateExperiment, useUpdateExperiment, useDeleteExperiment,
  useStartExperiment, usePauseExperiment, useResumeExperiment,
  useCompleteExperiment, useDeclareExperimentWinner,
} from '@/features/crm/api/crm.queries';
import type {
  FlowExperimentSummaryDto, FlowExperimentDetailDto,
  FlowExperimentCreateRequest, FlowExperimentUpdateRequest,
  FlowExperimentVariantStatsDto,
} from '@/features/crm/types/crm.types';
import {
  ExperimentStatus, ExperimentVariantKind,
  EXPERIMENT_STATUS_LABELS, EXPERIMENT_STATUS_COLORS,
} from '@/features/crm/types/crm.types';
import { formatDistanceToNow, format } from 'date-fns';

const inputCls =
  'w-full px-3 py-2 rounded-xl bg-bg-elevated border border-border-subtle text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-medium';

// ─── Slide-over ───────────────────────────────────────────────────────────────

function SlideOver({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
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
    </div>
  );
}

// ─── Create form ──────────────────────────────────────────────────────────────

type CreateFormState = {
  name: string;
  description: string;
  controlFlowId: string;
  challengerFlowId: string;
  splitPercent: number;
};

const EMPTY_CREATE: CreateFormState = {
  name: '', description: '', controlFlowId: '', challengerFlowId: '', splitPercent: 50,
};

function CreateForm({ onSave, onCancel, isSaving }: {
  onSave: (req: FlowExperimentCreateRequest) => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState<CreateFormState>(EMPTY_CREATE);
  const set = (k: keyof CreateFormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name: form.name,
      description: form.description || undefined,
      controlFlowId: form.controlFlowId,
      challengerFlowId: form.challengerFlowId,
      splitPercent: form.splitPercent,
    });
  };

  const controlPct = 100 - form.splitPercent;
  const challengerPct = form.splitPercent;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-xs font-semibold text-text-muted mb-1.5">Experiment Name *</label>
        <input required value={form.name} onChange={set('name')} placeholder="Onboarding Flow Test" className={inputCls} />
      </div>
      <div>
        <label className="block text-xs font-semibold text-text-muted mb-1.5">Description</label>
        <textarea rows={2} value={form.description} onChange={set('description')} placeholder="What are you testing and why?" className={`${inputCls} resize-none`} />
      </div>

      <div className="rounded-xl border border-border-subtle bg-bg-elevated p-4 space-y-4">
        <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Flow Variants</p>
        <div>
          <label className="block text-xs font-semibold text-text-muted mb-1.5">Control Flow ID *</label>
          <input required value={form.controlFlowId} onChange={set('controlFlowId')} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" className={`${inputCls} font-mono text-xs`} />
          <p className="text-xs text-text-muted mt-1">The existing baseline flow</p>
        </div>
        <div>
          <label className="block text-xs font-semibold text-text-muted mb-1.5">Challenger Flow ID *</label>
          <input required value={form.challengerFlowId} onChange={set('challengerFlowId')} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" className={`${inputCls} font-mono text-xs`} />
          <p className="text-xs text-text-muted mt-1">The new variant to test</p>
        </div>
      </div>

      {/* Split slider */}
      <div>
        <label className="block text-xs font-semibold text-text-muted mb-2">Traffic Split</label>
        <div className="flex rounded-xl overflow-hidden h-6 text-xs font-bold mb-2">
          <div
            className="flex items-center justify-center bg-success-soft text-success transition-all"
            style={{ width: `${controlPct}%` }}
          >
            {controlPct >= 15 && `${controlPct}%`}
          </div>
          <div
            className="flex items-center justify-center bg-brand-soft text-brand transition-all"
            style={{ width: `${challengerPct}%` }}
          >
            {challengerPct >= 15 && `${challengerPct}%`}
          </div>
        </div>
        <input
          type="range"
          min={10}
          max={90}
          value={form.splitPercent}
          onChange={(e) => setForm((f) => ({ ...f, splitPercent: Number(e.target.value) }))}
          className="w-full accent-brand"
        />
        <div className="flex justify-between text-xs text-text-muted mt-1">
          <span className="text-success font-semibold">Control {controlPct}%</span>
          <span className="text-brand font-semibold">Challenger {challengerPct}%</span>
        </div>
      </div>

      <div className="flex gap-3 pt-1">
        <button
          type="submit"
          disabled={isSaving || !form.name.trim() || !form.controlFlowId.trim() || !form.challengerFlowId.trim()}
          className="flex items-center gap-1.5 flex-1 justify-center py-2 rounded-xl bg-brand text-bg text-sm font-bold hover:bg-brand-light disabled:opacity-50 transition-all"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><FlaskConical className="w-3.5 h-3.5" /> Create Experiment</>}
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-xl border border-border-subtle text-sm text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-all">
          Cancel
        </button>
      </div>
    </form>
  );
}

// ─── Edit form ────────────────────────────────────────────────────────────────

function EditForm({ exp, onSave, onCancel, isSaving }: {
  exp: FlowExperimentSummaryDto;
  onSave: (req: FlowExperimentUpdateRequest) => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const [name, setName] = useState(exp.name);
  const [description, setDescription] = useState(exp.description ?? '');
  const [splitPercent, setSplitPercent] = useState(exp.splitPercent);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name: name || undefined, description: description || undefined, splitPercent });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4 pt-4 border-t border-border-subtle">
      <div>
        <label className="block text-xs font-semibold text-text-muted mb-1.5">Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
      </div>
      <div>
        <label className="block text-xs font-semibold text-text-muted mb-1.5">Description</label>
        <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} className={`${inputCls} resize-none`} />
      </div>
      <div>
        <label className="block text-xs font-semibold text-text-muted mb-2">
          Traffic Split — Challenger {splitPercent}% / Control {100 - splitPercent}%
        </label>
        <input type="range" min={10} max={90} value={splitPercent} onChange={(e) => setSplitPercent(Number(e.target.value))} className="w-full accent-brand" />
      </div>
      <div className="flex gap-3">
        <button type="submit" disabled={isSaving} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand text-bg text-sm font-bold hover:bg-brand-light disabled:opacity-50 transition-all">
          {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Check className="w-3.5 h-3.5" /> Save</>}
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-xl border border-border-subtle text-sm text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-all">
          Cancel
        </button>
      </div>
    </form>
  );
}

// ─── Variant stats column ─────────────────────────────────────────────────────

function VariantStats({ stats, isWinner, label, color }: {
  stats: FlowExperimentVariantStatsDto;
  isWinner: boolean;
  label: string;
  color: 'control' | 'challenger';
}) {
  const bg = color === 'control' ? 'bg-success-soft border-[rgba(34,197,94,0.2)]' : 'bg-brand-soft border-border-glow';
  const text = color === 'control' ? 'text-success' : 'text-brand';

  return (
    <div className={`flex-1 rounded-xl border p-3 space-y-3 ${isWinner ? bg : 'border-border-subtle bg-bg-elevated'}`}>
      <div className="flex items-center justify-between gap-2">
        <span className={`text-xs font-bold uppercase tracking-wider ${isWinner ? text : 'text-text-muted'}`}>{label}</span>
        {isWinner && <Trophy className={`w-3.5 h-3.5 ${text}`} strokeWidth={1.5} />}
      </div>
      <div className="text-xs text-text-muted truncate">{stats.flowName}</div>

      <div className="space-y-2">
        {[
          { icon: Users, label: 'Sessions', value: stats.sessions.toLocaleString() },
          { icon: MessageSquare, label: 'Messages', value: stats.messages.toLocaleString() },
          { icon: Zap, label: 'Conversions', value: stats.conversions.toLocaleString() },
          { icon: TrendingUp, label: 'Conv. Rate', value: `${stats.conversionRate.toFixed(1)}%` },
        ].map(({ icon: Icon, label: l, value }) => (
          <div key={l} className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1 text-text-muted">
              <Icon className="w-3 h-3" strokeWidth={1.5} /> {l}
            </span>
            <span className={`font-semibold ${isWinner ? text : 'text-text-secondary'}`}>{value}</span>
          </div>
        ))}
      </div>

      {/* Conversion rate bar */}
      <div className="h-1.5 bg-bg-card rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color === 'control' ? 'bg-success' : 'bg-brand'}`}
          style={{ width: `${Math.min(stats.conversionRate, 100)}%` }}
        />
      </div>
    </div>
  );
}

// ─── Detail stats panel (loaded on demand) ───────────────────────────────────

function StatsPanel({ expId, winner }: { expId: string; winner: ExperimentVariantKind | null }) {
  const { data: raw, isLoading } = useExperimentById(expId);
  const detail = raw as unknown as FlowExperimentDetailDto | undefined;

  if (isLoading) return <div className="flex items-center justify-center h-16 text-text-muted"><Loader2 className="w-4 h-4 animate-spin" /></div>;
  if (!detail) return null;

  return (
    <div className="flex gap-3 pt-3 border-t border-border-subtle">
      <VariantStats
        stats={detail.control}
        isWinner={winner === ExperimentVariantKind.Control}
        label="Control"
        color="control"
      />
      <VariantStats
        stats={detail.challenger}
        isWinner={winner === ExperimentVariantKind.Challenger}
        label="Challenger"
        color="challenger"
      />
    </div>
  );
}

// ─── Experiment card ──────────────────────────────────────────────────────────

function ExperimentCard({ exp }: { exp: FlowExperimentSummaryDto }) {
  const [showStats, setShowStats] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [declareOpen, setDeclareOpen] = useState(false);

  const start = useStartExperiment();
  const pause = usePauseExperiment();
  const resume = useResumeExperiment();
  const complete = useCompleteExperiment();
  const declareWinner = useDeclareExperimentWinner();
  const updateExp = useUpdateExperiment();
  const deleteExp = useDeleteExperiment();

  const isDraft = exp.status === ExperimentStatus.Draft;
  const isRunning = exp.status === ExperimentStatus.Running;
  const isPaused = exp.status === ExperimentStatus.Paused;
  const isCompleted = exp.status === ExperimentStatus.Completed;

  const controlPct = 100 - exp.splitPercent;
  const challengerPct = exp.splitPercent;

  const handleUpdate = (req: FlowExperimentUpdateRequest) => {
    updateExp.mutate({ id: exp.id, data: req }, { onSuccess: () => setIsEditing(false) });
  };

  const handleDelete = () => {
    deleteExp.mutate(exp.id);
  };

  return (
    <div className="rounded-2xl border border-border-subtle bg-bg-card p-5 space-y-4">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-text-primary">{exp.name}</h3>
            <span className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${EXPERIMENT_STATUS_COLORS[exp.status]}`}>
              {EXPERIMENT_STATUS_LABELS[exp.status]}
            </span>
            {exp.winner === ExperimentVariantKind.Control && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-success-soft text-success border border-[rgba(34,197,94,0.2)]">
                <Trophy className="w-3 h-3" /> Control won
              </span>
            )}
            {exp.winner === ExperimentVariantKind.Challenger && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-brand-soft text-brand border border-border-glow">
                <Trophy className="w-3 h-3" /> Challenger won
              </span>
            )}
          </div>
          {exp.description && <p className="text-xs text-text-muted mt-1">{exp.description}</p>}
        </div>

        {/* Top-right controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {isDraft && (
            <button
              onClick={() => setIsEditing((v) => !v)}
              className="p-1.5 rounded-lg border border-border-subtle text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-all"
              title="Edit"
            >
              <Pencil className="w-3.5 h-3.5" strokeWidth={1.5} />
            </button>
          )}
          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <button
                onClick={handleDelete}
                disabled={deleteExp.isPending}
                className="px-2.5 py-1 rounded-lg bg-danger text-bg text-xs font-bold disabled:opacity-50"
              >
                {deleteExp.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Delete'}
              </button>
              <button onClick={() => setConfirmDelete(false)} className="text-xs text-text-muted hover:text-text-primary">×</button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="p-1.5 rounded-lg border border-border-subtle text-text-muted hover:text-danger hover:bg-danger-soft hover:border-[rgba(244,63,94,0.2)] transition-all"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
            </button>
          )}
        </div>
      </div>

      {/* Edit form (draft only) */}
      {isEditing && (
        <EditForm
          exp={exp}
          onSave={handleUpdate}
          onCancel={() => setIsEditing(false)}
          isSaving={updateExp.isPending}
        />
      )}

      {!isEditing && (
        <>
          {/* Flow variant meta */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-text-muted">Control</span>
              <div className="font-semibold text-text-secondary mt-0.5 truncate" title={exp.controlFlowId}>
                {exp.controlFlowName ?? exp.controlFlowId.slice(0, 8) + '…'}
              </div>
            </div>
            <div>
              <span className="text-text-muted">Challenger</span>
              <div className="font-semibold text-text-secondary mt-0.5 truncate" title={exp.challengerFlowId}>
                {exp.challengerFlowName ?? exp.challengerFlowId.slice(0, 8) + '…'}
              </div>
            </div>
            <div>
              <span className="text-text-muted">Created</span>
              <div className="font-semibold text-text-secondary mt-0.5">
                {formatDistanceToNow(new Date(exp.createdAt), { addSuffix: true })}
              </div>
            </div>
            {(exp.startedAt || exp.endedAt) && (
              <div>
                <span className="text-text-muted">{exp.endedAt ? 'Ended' : 'Started'}</span>
                <div className="font-semibold text-text-secondary mt-0.5">
                  {exp.endedAt
                    ? format(new Date(exp.endedAt), 'MMM d, yyyy')
                    : exp.startedAt
                    ? format(new Date(exp.startedAt), 'MMM d, yyyy')
                    : '—'}
                </div>
              </div>
            )}
          </div>

          {/* Traffic split bar */}
          <div>
            <div className="flex rounded-lg overflow-hidden h-4">
              <div
                className="flex items-center justify-center text-[10px] font-bold text-success bg-success-soft transition-all"
                style={{ width: `${controlPct}%` }}
              >
                {controlPct >= 20 && `${controlPct}%`}
              </div>
              <div
                className="flex items-center justify-center text-[10px] font-bold text-brand bg-brand-soft transition-all"
                style={{ width: `${challengerPct}%` }}
              >
                {challengerPct >= 20 && `${challengerPct}%`}
              </div>
            </div>
            <div className="flex justify-between text-[10px] text-text-muted mt-1">
              <span>Control {controlPct}%</span>
              <span>Challenger {challengerPct}%</span>
            </div>
          </div>

          {/* Action bar */}
          <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-border-subtle">
            {isDraft && (
              <button
                onClick={() => start.mutate(exp.id)}
                disabled={start.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-soft text-brand border border-border-glow text-xs font-semibold hover:bg-brand hover:text-bg transition-all disabled:opacity-50"
              >
                {start.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Play className="w-3.5 h-3.5" strokeWidth={2} /> Start</>}
              </button>
            )}
            {isRunning && (
              <>
                <button
                  onClick={() => pause.mutate(exp.id)}
                  disabled={pause.isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-subtle text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-all disabled:opacity-50"
                >
                  {pause.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Pause className="w-3.5 h-3.5" strokeWidth={1.5} /> Pause</>}
                </button>
                <button
                  onClick={() => complete.mutate(exp.id)}
                  disabled={complete.isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-subtle text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-all disabled:opacity-50"
                >
                  {complete.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><CheckCircle className="w-3.5 h-3.5" strokeWidth={1.5} /> Complete</>}
                </button>
              </>
            )}
            {isPaused && (
              <>
                <button
                  onClick={() => resume.mutate(exp.id)}
                  disabled={resume.isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-soft text-brand border border-border-glow text-xs font-semibold hover:bg-brand hover:text-bg transition-all disabled:opacity-50"
                >
                  {resume.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><RotateCcw className="w-3.5 h-3.5" strokeWidth={1.5} /> Resume</>}
                </button>
                <button
                  onClick={() => complete.mutate(exp.id)}
                  disabled={complete.isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-subtle text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-all disabled:opacity-50"
                >
                  {complete.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><CheckCircle className="w-3.5 h-3.5" strokeWidth={1.5} /> Complete</>}
                </button>
              </>
            )}
            {isCompleted && !exp.winner && (
              declareOpen ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-text-muted">Winner:</span>
                  <button
                    onClick={() => { declareWinner.mutate({ id: exp.id, winner: ExperimentVariantKind.Control }); setDeclareOpen(false); }}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-success-soft text-success border border-[rgba(34,197,94,0.2)] text-xs font-semibold hover:bg-success hover:text-bg transition-all"
                  >
                    <Trophy className="w-3 h-3" /> Control
                  </button>
                  <button
                    onClick={() => { declareWinner.mutate({ id: exp.id, winner: ExperimentVariantKind.Challenger }); setDeclareOpen(false); }}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-brand-soft text-brand border border-border-glow text-xs font-semibold hover:bg-brand hover:text-bg transition-all"
                  >
                    <Trophy className="w-3 h-3" /> Challenger
                  </button>
                  <button onClick={() => setDeclareOpen(false)} className="text-xs text-text-muted hover:text-text-primary">×</button>
                </div>
              ) : (
                <button
                  onClick={() => setDeclareOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-subtle text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-all"
                >
                  <Trophy className="w-3.5 h-3.5" strokeWidth={1.5} /> Declare Winner
                </button>
              )
            )}

            {/* Stats toggle — always available */}
            <button
              onClick={() => setShowStats((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-subtle text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-all ml-auto"
            >
              {showStats ? <><ChevronUp className="w-3.5 h-3.5" strokeWidth={1.5} /> Hide Stats</> : <><ChevronDown className="w-3.5 h-3.5" strokeWidth={1.5} /> View Stats</>}
            </button>
          </div>

          {/* Stats panel */}
          {showStats && <StatsPanel expId={exp.id} winner={exp.winner} />}
        </>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function Component() {
  const [showCreate, setShowCreate] = useState(false);
  const { data: raw, isLoading } = useExperiments();
  const experiments = raw as unknown as FlowExperimentSummaryDto[] | undefined;
  const createExp = useCreateExperiment();

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-text-primary tracking-tight">A/B Experiments</h2>
            <p className="text-xs text-text-muted mt-0.5">
              Split traffic between two flows and measure which drives more conversions.
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-bg bg-brand hover:bg-brand-light transition-all"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2.5} /> New Experiment
          </button>
        </div>

        {/* Summary chips */}
        {experiments && experiments.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {(
              [
                { status: ExperimentStatus.Running, label: 'Running', cls: 'text-success bg-success-soft border-[rgba(34,197,94,0.2)]' },
                { status: ExperimentStatus.Paused, label: 'Paused', cls: 'text-[#F59E0B] bg-[rgba(245,158,11,0.1)] border-[rgba(245,158,11,0.2)]' },
                { status: ExperimentStatus.Completed, label: 'Completed', cls: 'text-text-secondary bg-bg-elevated border-border-subtle' },
                { status: ExperimentStatus.Draft, label: 'Draft', cls: 'text-text-muted bg-bg-card border-border-subtle' },
              ] as const
            ).map(({ status, label, cls }) => {
              const count = experiments.filter((e) => e.status === status).length;
              if (count === 0) return null;
              return (
                <span key={status} className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${cls}`}>
                  {count} {label}
                </span>
              );
            })}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center h-64 text-text-muted">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : !experiments?.length ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-text-muted rounded-2xl border border-border-subtle bg-bg-card">
            <FlaskConical className="w-10 h-10 opacity-25" strokeWidth={1.2} />
            <p className="text-sm font-semibold">No experiments yet</p>
            <p className="text-xs text-center max-w-xs">
              Create an experiment to split traffic between two flows and measure which drives more conversions.
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 mt-1 px-4 py-2 rounded-xl text-xs font-bold text-bg bg-brand hover:bg-brand-light transition-all"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2.5} /> Create First Experiment
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {experiments.map((exp: FlowExperimentSummaryDto) => (
              <ExperimentCard key={exp.id} exp={exp} />
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <SlideOver title="New A/B Experiment" onClose={() => setShowCreate(false)}>
          <CreateForm
            onSave={(req) => createExp.mutate(req, { onSuccess: () => setShowCreate(false) })}
            onCancel={() => setShowCreate(false)}
            isSaving={createExp.isPending}
          />
        </SlideOver>
      )}
    </>
  );
}
