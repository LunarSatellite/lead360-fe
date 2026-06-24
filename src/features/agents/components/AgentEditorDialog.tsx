// ═══════════════════════════════════════════════════════════════
// AgentEditorDialog — create / edit an agent.
//
// Single big modal that owns three sub-forms folded into one:
//
//   Basics    name / description / enabled
//   Trigger   agentType + triggerKind + kind-aware payload
//   Target    targetKind + kind-aware reference
//   Config    advanced JSON textarea (collapsed by default)
//
// Why one giant useState block instead of react-hook-form:
//
// We tried RHF first. The problem is the "kind-aware" payload —
// the same form field (`triggerJson`) means "the threshold spec"
// when triggerKind=Threshold, "the intent name" when IntentMatched,
// and "raw JSON" otherwise. RHF wants flat fields; modelling
// these as a discriminated union inside RHF's resolver added more
// machinery than it saved. Plain useState plus serialise-on-submit
// is genuinely simpler here.
//
// On submit, we:
//   1. Validate the basics (name length, JSON parses, etc.)
//   2. Build `triggerJson` from whichever sub-form is visible
//   3. Build `targetRef` from whichever target sub-form is visible
//   4. POST or PUT to the API
//   5. On 409 (unique-name clash), show inline error on the name
//
// On open-with-existing-agent, we:
//   1. Hydrate basics directly from the AgentDto
//   2. Try to parse `triggerJson` as one of the known shapes —
//      if it matches threshold or intent, populate sub-form fields
//      and show that sub-form. Otherwise fall back to "advanced"
//      with the raw JSON in a textarea.
// ═══════════════════════════════════════════════════════════════

import { useEffect, useMemo, useState } from 'react';
import { X, Save, Plus, Loader2, ChevronDown, ChevronRight, Info } from 'lucide-react';
import { ApiError } from '@/shared/lib/api-client';
import { useIntents } from '@/features/intents/api/intents.queries';
import { useTeamMembers } from '@/features/team/api/team.queries';
import { UserRole, type UserDto } from '@/features/auth/types/auth.types';
import { useCreateAgent, useUpdateAgent } from '../api/agents.queries';
import {
  AgentType,
  AgentTriggerKind,
  AgentTargetKind,
  AGENT_TYPE_LABEL,
  AGENT_TYPE_AVAILABLE,
  AGENT_TRIGGER_KIND_LABEL,
  AGENT_TRIGGER_KIND_HINT,
  AGENT_TARGET_KIND_LABEL,
  AGENT_TARGET_KIND_AVAILABLE,
  type AgentDto,
  type AgentTypeValue,
  type AgentTriggerKindValue,
  type AgentTargetKindValue,
  type CreateAgentRequest,
  type UpdateAgentRequest,
} from '../types/agents.types';

interface Props {
  open: boolean;
  /** Pass an existing agent to enter edit mode. Pass null to create. */
  editAgent: AgentDto | null;
  onClose: () => void;
}

// ─── Threshold ops (the comparison operators) ──────────────────
const THRESHOLD_OPS = ['gt', 'gte', 'lt', 'lte', 'eq'] as const;
type ThresholdOp = (typeof THRESHOLD_OPS)[number];

const THRESHOLD_OP_LABEL: Record<ThresholdOp, string> = {
  gt: '>',
  gte: '≥',
  lt: '<',
  lte: '≤',
  eq: '=',
};

// ─── Form state shape ──────────────────────────────────────────

interface FormState {
  // Basics
  name: string;
  description: string;
  enabled: boolean;

  // Trigger top-level
  agentType: AgentTypeValue;
  triggerKind: AgentTriggerKindValue;

  // Trigger — Threshold sub-form
  thField: string;
  thOp: ThresholdOp;
  thValue: string; // text input → coerced to number on submit

  // Trigger — IntentMatched sub-form
  intentName: string;

  // Trigger — raw JSON fallback (Manual + others)
  triggerJsonRaw: string;

  // Target top-level
  targetKind: AgentTargetKindValue;

  // Target — User sub-form
  targetUserId: string;

  // Target — Role sub-form (stored as string of numeric value to
  // round-trip cleanly through <select>)
  targetRoleValue: string;

  // Target — Email sub-form
  targetEmail: string;

  // Config (raw JSON textarea — covers all types for v1)
  configJsonRaw: string;
}

const DEFAULT_FORM: FormState = {
  name: '',
  description: '',
  enabled: true,
  agentType: AgentType.Approval,
  triggerKind: AgentTriggerKind.Threshold,
  thField: 'amount',
  thOp: 'gt',
  thValue: '',
  intentName: '',
  triggerJsonRaw: '',
  targetKind: AgentTargetKind.User,
  targetUserId: '',
  targetRoleValue: String(UserRole.Admin),
  targetEmail: '',
  configJsonRaw: '',
};

// ─── Inline form-error helper type ─────────────────────────────

type FieldErrors = Partial<Record<keyof FormState | 'submit', string>>;

// ─── Component ─────────────────────────────────────────────────

export function AgentEditorDialog({ open, editAgent, onClose }: Props) {
  const isEdit = !!editAgent;
  const tenantId = localStorage.getItem('omniflow_tenant_id') ?? '';

  const createMutation = useCreateAgent();
  const updateMutation = useUpdateAgent();
  const isPending = createMutation.isPending || updateMutation.isPending;

  // Pull intents for the IntentMatched picker. Cheap query — already
  // cached in most flows because the intents list is the workspace's
  // central catalogue.
  const intentsQuery = useIntents(tenantId);
  const intents = (intentsQuery.data as unknown as Array<{ id: string; name: string }> | undefined) ?? [];

  // Pull team members for the User-target picker.
  const teamQuery = useTeamMembers();
  const teamMembers = (teamQuery.data as unknown as UserDto[] | undefined) ?? [];

  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [configOpen, setConfigOpen] = useState(false);

  // ─── Hydrate / reset form when modal opens ────────────────
  useEffect(() => {
    if (!open) return;
    if (editAgent) {
      setForm(hydrateFromAgent(editAgent));
      setConfigOpen(!!editAgent.configJson);
    } else {
      setForm(DEFAULT_FORM);
      setConfigOpen(false);
    }
    setErrors({});
  }, [open, editAgent]);

  const typeOptions = useMemo(
    () =>
      [
        AgentType.Approval,
        AgentType.Notification,
        AgentType.Escalation,
        AgentType.DataCollection,
        AgentType.Reminder,
        AgentType.Fulfillment,
      ].map((v) => ({
        value: v,
        label: AGENT_TYPE_LABEL[v],
        available: AGENT_TYPE_AVAILABLE[v],
      })),
    [],
  );

  const triggerOptions = useMemo(
    () =>
      [
        AgentTriggerKind.Manual,
        AgentTriggerKind.Threshold,
        AgentTriggerKind.IntentMatched,
        AgentTriggerKind.FlowNodeReached,
        AgentTriggerKind.CustomerReply,
        AgentTriggerKind.Scheduled,
      ].map((v) => ({
        value: v,
        label: AGENT_TRIGGER_KIND_LABEL[v],
        hint: AGENT_TRIGGER_KIND_HINT[v],
      })),
    [],
  );

  const targetOptions = useMemo(
    () =>
      [
        AgentTargetKind.User,
        AgentTargetKind.Role,
        AgentTargetKind.Email,
        AgentTargetKind.Webhook,
        AgentTargetKind.Channel,
      ].map((v) => ({
        value: v,
        label: AGENT_TARGET_KIND_LABEL[v],
        available: AGENT_TARGET_KIND_AVAILABLE[v],
      })),
    [],
  );

  if (!open) return null;
  
  // ─── Field updater (keeps errors in sync) ─────────────────
  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) {
      setErrors((e) => ({ ...e, [key]: undefined }));
    }
  };

  // ─── Submit ───────────────────────────────────────────────
  const handleSubmit = async () => {
    const validation = validateAndSerialise(form);
    if (!validation.ok) {
      setErrors(validation.errors);
      return;
    }
    const { triggerJson, targetRef, configJson } = validation;

    try {
      if (isEdit && editAgent) {
        const payload: UpdateAgentRequest = {
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          triggerKind: form.triggerKind,
          triggerJson,
          targetKind: form.targetKind,
          targetRef,
          configJson,
          enabled: form.enabled,
        };
        await updateMutation.mutateAsync({ id: editAgent.id, data: payload });
      } else {
        const payload: CreateAgentRequest = {
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          agentType: form.agentType,
          triggerKind: form.triggerKind,
          triggerJson,
          targetKind: form.targetKind,
          targetRef,
          configJson,
          enabled: form.enabled,
        };
        await createMutation.mutateAsync(payload);
      }
      onClose();
    } catch (e) {
      // 409 → unique-name clash. Surface inline on the name field
      // exactly as spec §5.3 prescribes.
      if (e instanceof ApiError && e.status === 409) {
        setErrors({
          name: `An agent named "${form.name.trim()}" already exists in this scope.`,
        });
        return;
      }
      // Other errors are toasted by the mutation onError handler.
      // Stash a generic submit error so the user sees something
      // banner-style, not just a vanishing toast.
      const message = e instanceof Error ? e.message : 'Something went wrong saving this agent.';
      setErrors({ submit: message });
    }
  };

  // ─── Style tokens (mirror IntentFormModal for consistency) ─
  const inputCls =
    'w-full px-4 py-2.5 rounded-lg bg-glass-2 border border-border-subtle text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand transition-all';
  const labelCls = 'text-2xs font-bold uppercase tracking-[2px] text-text-muted block mb-2';
  const errCls = 'text-2xs text-danger mt-1';
  const sectionCls = 'pt-5 border-t border-t-border-subtle first:pt-0 first:border-t-0';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={isPending ? undefined : onClose}
      />
      <div
        className="relative w-full max-w-2xl mx-4 overflow-hidden max-h-[90vh] flex flex-col"
        style={{
          background: '#0A0F0D',
          border: '1.5px solid #1E2E26',
          borderRadius: 20,
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-b-border-subtle flex-shrink-0">
          <h2 className="text-lg font-extrabold text-text-primary tracking-tight">
            {isEdit ? 'Edit agent' : 'New agent'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="w-8 h-8 rounded-lg bg-glass-2 flex items-center justify-center text-text-muted hover:text-text-primary transition-all disabled:opacity-40"
          >
            <X className="w-4 h-4" strokeWidth={1.8} />
          </button>
        </div>

        {/* Form body (scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* ═══ BASICS ═══ */}
          <section className={sectionCls}>
            <SectionTitle>Basics</SectionTitle>

            <div>
              <label htmlFor="agent-name" className={labelCls}>
                Name *
              </label>
              <input
                id="agent-name"
                type="text"
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
                placeholder="e.g. High-value approvals"
                maxLength={80}
                className={inputCls}
              />
              {errors.name && <p className={errCls}>{errors.name}</p>}
            </div>

            <div className="mt-4">
              <label htmlFor="agent-description" className={labelCls}>
                Description
              </label>
              <textarea
                id="agent-description"
                value={form.description}
                onChange={(e) => setField('description', e.target.value)}
                placeholder="What does this agent do?"
                rows={2}
                maxLength={500}
                className={`${inputCls} resize-none`}
              />
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-text-primary">Enabled</div>
                <div className="text-xs text-text-muted mt-0.5">
                  Disabled agents won't fire — keep them disabled while you tune them.
                </div>
              </div>
              <Toggle checked={form.enabled} onChange={(v) => setField('enabled', v)} />
            </div>
          </section>

          {/* ═══ TRIGGER ═══ */}
          <section className={sectionCls}>
            <SectionTitle>Trigger</SectionTitle>

            {/* Type — only Approval + Notification enabled in v1 */}
            <div>
              <label className={labelCls}>Type *</label>
              <div className="grid grid-cols-3 gap-2">
                {typeOptions.map((opt) => {
                  const isActive = form.agentType === opt.value;
                  const disabled = !opt.available || (isEdit && opt.value !== editAgent?.agentType);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      disabled={disabled}
                      onClick={() => !disabled && setField('agentType', opt.value)}
                      className={`relative text-center p-3 rounded-xl border transition-all ${
                        isActive
                          ? 'bg-brand-soft border-border-glow'
                          : 'bg-bg-card border-border-subtle hover:border-border-medium'
                      } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <div
                        className={`text-xs font-bold ${isActive ? 'text-brand' : 'text-text-secondary'}`}
                      >
                        {opt.label}
                      </div>
                      {!opt.available && (
                        <div className="text-[9px] uppercase tracking-wider text-text-muted mt-1">
                          Coming soon
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              {isEdit && (
                <p className="text-2xs text-text-muted mt-2">
                  Type can't be changed after the agent is created.
                </p>
              )}
            </div>

            {/* Trigger kind */}
            <div className="mt-4">
              <label htmlFor="agent-trigger-kind" className={labelCls}>
                When does it fire? *
              </label>
              <select
                id="agent-trigger-kind"
                value={form.triggerKind}
                onChange={(e) => setField('triggerKind', Number(e.target.value) as AgentTriggerKindValue)}
                className={inputCls}
              >
                {triggerOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label} — {opt.hint}
                  </option>
                ))}
              </select>
            </div>

            {/* Kind-aware payload */}
            <div className="mt-4">
              <TriggerPayload
                form={form}
                setField={setField}
                errors={errors}
                inputCls={inputCls}
                labelCls={labelCls}
                errCls={errCls}
                intents={intents}
                intentsLoading={intentsQuery.isLoading}
              />
            </div>
          </section>

          {/* ═══ TARGET ═══ */}
          <section className={sectionCls}>
            <SectionTitle>Target</SectionTitle>

            <div>
              <label htmlFor="agent-target-kind" className={labelCls}>
                Where does the output go? *
              </label>
              <select
                id="agent-target-kind"
                value={form.targetKind}
                onChange={(e) => setField('targetKind', Number(e.target.value) as AgentTargetKindValue)}
                className={inputCls}
              >
                {targetOptions.map((opt) => (
                  <option
                    key={opt.value}
                    value={opt.value}
                    disabled={!opt.available}
                  >
                    {opt.label}
                    {!opt.available ? ' (coming soon)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-4">
              <TargetPayload
                form={form}
                setField={setField}
                errors={errors}
                inputCls={inputCls}
                labelCls={labelCls}
                errCls={errCls}
                teamMembers={teamMembers}
                teamLoading={teamQuery.isLoading}
              />
            </div>
          </section>

          {/* ═══ CONFIG (collapsible) ═══ */}
          <section className={sectionCls}>
            <button
              type="button"
              onClick={() => setConfigOpen((v) => !v)}
              className="flex items-center gap-2 text-2xs font-bold uppercase tracking-[2px] text-text-muted hover:text-text-secondary transition-colors"
            >
              {configOpen ? (
                <ChevronDown className="w-3.5 h-3.5" strokeWidth={2.4} />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" strokeWidth={2.4} />
              )}
              Advanced config
            </button>

            {configOpen && (
              <div className="mt-3">
                <label htmlFor="agent-config-json" className={labelCls}>
                  Config JSON
                </label>
                <textarea
                  id="agent-config-json"
                  value={form.configJsonRaw}
                  onChange={(e) => setField('configJsonRaw', e.target.value)}
                  placeholder={
                    form.agentType === AgentType.Approval
                      ? '{"expiresInHours":48}'
                      : form.agentType === AgentType.Notification
                        ? '{"subject":"New lead","includePayload":true}'
                        : '{}'
                  }
                  rows={4}
                  spellCheck={false}
                  className={`${inputCls} font-mono text-xs resize-y`}
                />
                {errors.configJsonRaw && <p className={errCls}>{errors.configJsonRaw}</p>}
                <p className="text-2xs text-text-muted mt-1.5 leading-relaxed">
                  Optional. Settings specific to this agent type. Leave blank to use defaults.
                </p>
              </div>
            )}
          </section>

          {/* Submit error banner */}
          {errors.submit && (
            <div className="px-3.5 py-3 rounded-xl bg-danger-soft border border-[rgba(244,63,94,0.15)] flex gap-2.5 text-sm text-danger">
              <Info className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={2} />
              <span>{errors.submit}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2.5 px-6 py-4 border-t border-t-border-subtle bg-bg-shell flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2.5 rounded-xl border border-border-subtle bg-bg-card text-sm font-semibold text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand hover:bg-brand-light text-bg text-sm font-bold transition-all disabled:opacity-60"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.4} />
            ) : isEdit ? (
              <Save className="w-4 h-4" strokeWidth={2.4} />
            ) : (
              <Plus className="w-4 h-4" strokeWidth={2.4} />
            )}
            {isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Create agent'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────
   Sub-components
   ───────────────────────────────────────────────────────────── */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-extrabold uppercase tracking-[2px] text-text-muted mb-3">
      {children}
    </h3>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`w-11 h-6 rounded-full transition-all relative shrink-0 ${
        checked ? 'bg-brand' : 'bg-glass-3'
      }`}
    >
      <span
        className={`absolute top-0.5 w-5 h-5 rounded-full bg-bg transition-all ${
          checked ? 'left-[22px]' : 'left-0.5'
        }`}
      />
    </button>
  );
}

interface PayloadProps {
  form: FormState;
  setField: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  errors: FieldErrors;
  inputCls: string;
  labelCls: string;
  errCls: string;
}

function TriggerPayload({
  form,
  setField,
  errors,
  inputCls,
  labelCls,
  errCls,
  intents,
  intentsLoading,
}: PayloadProps & {
  intents: Array<{ id: string; name: string }>;
  intentsLoading: boolean;
}) {
  // Threshold sub-form
  if (form.triggerKind === AgentTriggerKind.Threshold) {
    return (
      <div>
        <label className={labelCls}>Threshold</label>
        <div className="grid grid-cols-[1fr_auto_1fr] gap-2">
          <input
            type="text"
            value={form.thField}
            onChange={(e) => setField('thField', e.target.value)}
            placeholder="amount"
            aria-label="Field name"
            className={inputCls}
          />
          <select
            value={form.thOp}
            onChange={(e) => setField('thOp', e.target.value as ThresholdOp)}
            aria-label="Comparison"
            className={inputCls}
            style={{ width: 'auto' }}
          >
            {THRESHOLD_OPS.map((op) => (
              <option key={op} value={op}>
                {THRESHOLD_OP_LABEL[op]}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={form.thValue}
            onChange={(e) => setField('thValue', e.target.value)}
            placeholder="500"
            aria-label="Threshold value"
            className={inputCls}
          />
        </div>
        {(errors.thField || errors.thValue) && (
          <p className={errCls}>{errors.thField || errors.thValue}</p>
        )}
        <p className="text-2xs text-text-muted mt-1.5">
          Fires when the named field crosses this value.
        </p>
      </div>
    );
  }

  // IntentMatched sub-form
  if (form.triggerKind === AgentTriggerKind.IntentMatched) {
    return (
      <div>
        <label htmlFor="trigger-intent" className={labelCls}>
          Intent
        </label>
        {intentsLoading ? (
          <div className={`${inputCls} text-text-muted text-xs`}>Loading intents…</div>
        ) : intents.length === 0 ? (
          <div className={`${inputCls} text-text-muted text-xs`}>
            No intents yet. Create one in the Intents tab first.
          </div>
        ) : (
          <select
            id="trigger-intent"
            value={form.intentName}
            onChange={(e) => setField('intentName', e.target.value)}
            className={inputCls}
          >
            <option value="">Select an intent…</option>
            {intents.map((i) => (
              <option key={i.id} value={i.name}>
                {i.name}
              </option>
            ))}
          </select>
        )}
        {errors.intentName && <p className={errCls}>{errors.intentName}</p>}
      </div>
    );
  }

  // Manual + others — advanced raw JSON
  return (
    <div>
      <label htmlFor="trigger-json" className={labelCls}>
        Trigger payload (JSON)
      </label>
      <textarea
        id="trigger-json"
        value={form.triggerJsonRaw}
        onChange={(e) => setField('triggerJsonRaw', e.target.value)}
        placeholder="{}"
        rows={3}
        spellCheck={false}
        className={`${inputCls} font-mono text-xs resize-y`}
      />
      {errors.triggerJsonRaw && <p className={errCls}>{errors.triggerJsonRaw}</p>}
      <p className="text-2xs text-text-muted mt-1.5 leading-relaxed">
        Optional advanced config for this trigger kind. Leave blank if you
        don't have specific requirements yet.
      </p>
    </div>
  );
}

function TargetPayload({
  form,
  setField,
  errors,
  inputCls,
  labelCls,
  errCls,
  teamMembers,
  teamLoading,
}: PayloadProps & {
  teamMembers: UserDto[];
  teamLoading: boolean;
}) {
  if (form.targetKind === AgentTargetKind.User) {
    return (
      <div>
        <label htmlFor="target-user" className={labelCls}>
          User
        </label>
        {teamLoading ? (
          <div className={`${inputCls} text-text-muted text-xs`}>Loading team…</div>
        ) : teamMembers.length === 0 ? (
          <div className={`${inputCls} text-text-muted text-xs`}>
            No team members. Invite someone from Settings → Team first.
          </div>
        ) : (
          <select
            id="target-user"
            value={form.targetUserId}
            onChange={(e) => setField('targetUserId', e.target.value)}
            className={inputCls}
          >
            <option value="">Select a team member…</option>
            {teamMembers.map((u) => (
              <option key={u.id} value={u.id}>
                {formatUserLabel(u)}
              </option>
            ))}
          </select>
        )}
        {errors.targetUserId && <p className={errCls}>{errors.targetUserId}</p>}
      </div>
    );
  }

  if (form.targetKind === AgentTargetKind.Role) {
    return (
      <div>
        <label htmlFor="target-role" className={labelCls}>
          Role
        </label>
        <select
          id="target-role"
          value={form.targetRoleValue}
          onChange={(e) => setField('targetRoleValue', e.target.value)}
          className={inputCls}
        >
          <option value={String(UserRole.Owner)}>Owner</option>
          <option value={String(UserRole.Admin)}>Admin</option>
          <option value={String(UserRole.Agent)}>Agent</option>
        </select>
        <p className="text-2xs text-text-muted mt-1.5">
          Anyone with this role in the workspace will receive notifications.
        </p>
      </div>
    );
  }

  if (form.targetKind === AgentTargetKind.Email) {
    return (
      <div>
        <label htmlFor="target-email" className={labelCls}>
          Email address
        </label>
        <input
          id="target-email"
          type="email"
          value={form.targetEmail}
          onChange={(e) => setField('targetEmail', e.target.value)}
          placeholder="manager@company.com"
          className={inputCls}
        />
        {errors.targetEmail && <p className={errCls}>{errors.targetEmail}</p>}
      </div>
    );
  }

  // Webhook / Channel — not wired in v1. The select disables these,
  // but if somehow they slip through (e.g. legacy data), fall back
  // to a notice.
  return (
    <div className={`${inputCls} text-text-muted text-xs`}>
      This target type isn't supported yet. Pick User, Role, or Email above.
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────
   Pure helpers
   ───────────────────────────────────────────────────────────── */

function formatUserLabel(u: UserDto): string {
  const fullName = [u.firstName, u.lastName].filter(Boolean).join(' ').trim();
  const email = u.email ?? '';
  if (fullName && email) return `${fullName} (${email})`;
  return fullName || email || u.id;
}

/**
 * Hydrate the form state from an existing agent. We try to recognise
 * the trigger and target shapes — if the JSON matches a known sub-form
 * shape, we populate that sub-form. Otherwise everything falls back
 * to the raw-JSON textarea so the data round-trips unmodified.
 */
function hydrateFromAgent(agent: AgentDto): FormState {
  const next: FormState = {
    ...DEFAULT_FORM,
    name: agent.name,
    description: agent.description ?? '',
    enabled: agent.enabled,
    agentType: agent.agentType,
    triggerKind: agent.triggerKind,
    targetKind: agent.targetKind,
  };

  // Trigger payload
  const tj = safeParseJson(agent.triggerJson);
  if (agent.triggerKind === AgentTriggerKind.Threshold && isThresholdShape(tj)) {
    next.thField = String(tj.field);
    next.thOp = tj.op as ThresholdOp;
    next.thValue = String(tj.value);
  } else if (agent.triggerKind === AgentTriggerKind.IntentMatched && isIntentShape(tj)) {
    next.intentName = String(tj.intentName);
  } else if (agent.triggerJson) {
    // Pretty-print so the textarea is readable
    next.triggerJsonRaw = prettyJson(agent.triggerJson);
  }

  // Target ref
  const ref = agent.targetRef ?? '';
  if (agent.targetKind === AgentTargetKind.User) {
    next.targetUserId = ref;
  } else if (agent.targetKind === AgentTargetKind.Role) {
    next.targetRoleValue = ref || String(UserRole.Admin);
  } else if (agent.targetKind === AgentTargetKind.Email) {
    next.targetEmail = ref;
  }

  // Config
  if (agent.configJson) {
    next.configJsonRaw = prettyJson(agent.configJson);
  }

  return next;
}

function safeParseJson(raw: string | null | undefined): unknown {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function prettyJson(raw: string): string {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

function isThresholdShape(v: unknown): v is { field: string; op: string; value: number } {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.field === 'string' &&
    typeof o.op === 'string' &&
    THRESHOLD_OPS.includes(o.op as ThresholdOp) &&
    typeof o.value === 'number'
  );
}

function isIntentShape(v: unknown): v is { intentName: string } {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  return typeof o.intentName === 'string';
}

/**
 * Validate the form and serialise sub-form state into the API
 * contract. Returns either an `ok: true` envelope with the
 * serialised payload, or an `ok: false` envelope with field
 * errors keyed by FormState property name.
 */
function validateAndSerialise(
  form: FormState,
):
  | { ok: true; triggerJson?: string; targetRef?: string; configJson?: string }
  | { ok: false; errors: FieldErrors } {
  const errors: FieldErrors = {};

  // Basics
  const trimmedName = form.name.trim();
  if (trimmedName.length < 2) {
    errors.name = 'Name must be at least 2 characters.';
  } else if (trimmedName.length > 80) {
    errors.name = 'Name must be 80 characters or fewer.';
  }

  // Trigger payload
  let triggerJson: string | undefined;
  if (form.triggerKind === AgentTriggerKind.Threshold) {
    if (!form.thField.trim()) {
      errors.thField = 'Pick a field to compare.';
    }
    const num = Number(form.thValue);
    if (form.thValue === '' || Number.isNaN(num)) {
      errors.thValue = 'Enter a numeric threshold value.';
    } else {
      triggerJson = JSON.stringify({
        field: form.thField.trim(),
        op: form.thOp,
        value: num,
      });
    }
  } else if (form.triggerKind === AgentTriggerKind.IntentMatched) {
    if (!form.intentName.trim()) {
      errors.intentName = 'Pick an intent.';
    } else {
      triggerJson = JSON.stringify({ intentName: form.intentName.trim() });
    }
  } else {
    // Raw JSON path
    const raw = form.triggerJsonRaw.trim();
    if (raw) {
      try {
        JSON.parse(raw);
        triggerJson = raw;
      } catch {
        errors.triggerJsonRaw = 'Trigger payload must be valid JSON.';
      }
    }
    // empty is fine — backend treats null as "no payload"
  }

  // Target ref
  let targetRef: string | undefined;
  if (form.targetKind === AgentTargetKind.User) {
    if (!form.targetUserId) {
      errors.targetUserId = 'Pick a user.';
    } else {
      targetRef = form.targetUserId;
    }
  } else if (form.targetKind === AgentTargetKind.Role) {
    targetRef = form.targetRoleValue;
  } else if (form.targetKind === AgentTargetKind.Email) {
    const email = form.targetEmail.trim();
    if (!email) {
      errors.targetEmail = 'Enter an email address.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.targetEmail = 'Enter a valid email address.';
    } else {
      targetRef = email;
    }
  }
  // Webhook/Channel can't be reached because select disables them.

  // Config JSON
  let configJson: string | undefined;
  const cfgRaw = form.configJsonRaw.trim();
  if (cfgRaw) {
    try {
      JSON.parse(cfgRaw);
      configJson = cfgRaw;
    } catch {
      errors.configJsonRaw = 'Config must be valid JSON.';
    }
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }
  return { ok: true, triggerJson, targetRef, configJson };
}
