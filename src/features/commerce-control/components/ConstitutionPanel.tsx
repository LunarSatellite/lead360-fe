import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AlertTriangle, Check, Loader2, ShieldCheck } from 'lucide-react';
import {
  AgentActionRiskTier,
  RISK_TIER_LABEL,
  stylemintAutonomyApi,
  type AgentActionRiskTierValue,
} from '../api/stylemint-autonomy.api';
import { ReportPanel } from './ReportPanel';

/**
 * The commerce constitution: the rules an agent action is assessed against, and the dry run that
 * reports what they would allow.
 *
 * This file used to hold four tabs. The other three - autonomous operations, the decision twin
 * and the cart-offer readout - were built twice, and the dedicated pages in
 * `intelligence-console` and `decision-twin` are the ones that survived, because a decision or a
 * study there gets a real URL instead of an id pasted into a box. The constitution has no page
 * anywhere else, so it is what is left here.
 */

export function ConstitutionTab() {
  const constitution = useQuery({
    queryKey: ['stylemint-constitution'],
    queryFn: () => stylemintAutonomyApi.constitution(),
    retry: false,
  });

  const [actionKey, setActionKey] = useState('');
  const [riskTier, setRiskTier] = useState<AgentActionRiskTierValue>(AgentActionRiskTier.Low);
  const [rollback, setRollback] = useState(false);
  const [previewJson, setPreviewJson] = useState('{}');
  const [payloadJson, setPayloadJson] = useState('{}');

  const assess = useMutation({
    mutationFn: () =>
      stylemintAutonomyApi.assessConstitution({
        actionKey: actionKey.trim(),
        riskTier,
        previewJson,
        requestPayloadJson: payloadJson,
        executorSupportsRollback: rollback,
      }),
  });

  const jsonValid = isJson(previewJson) && isJson(payloadJson);

  return (
    <div className="space-y-3">
      <ReportPanel
        title="The rules in force"
        query={constitution}
        emptyNote="No constitution is published."
      />

      <FormPanel
        icon={ShieldCheck}
        title="Assess an action against the rules"
        note="A dry run: it reports what the constitution would allow, and changes nothing."
        mutation={assess}
        onSubmit={() => assess.mutate()}
        ready={!!actionKey.trim() && jsonValid}
        submitLabel="Assess"
      >
        <Field label="Action key" span>
          <input
            value={actionKey}
            onChange={(e) => setActionKey(e.target.value)}
            placeholder="e.g. pricing.reprice"
            className={`${field} font-mono`}
          />
        </Field>
        <Field label="Risk tier">
          <select
            value={riskTier}
            onChange={(e) => setRiskTier(Number(e.target.value) as AgentActionRiskTierValue)}
            className={field}
          >
            {Object.values(AgentActionRiskTier).map((tier) => (
              <option key={tier} value={tier}>
                {RISK_TIER_LABEL[tier]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Executor can roll back">
          <label className="flex items-center gap-2 py-2 text-xs text-text-secondary">
            <input
              type="checkbox"
              checked={rollback}
              onChange={(e) => setRollback(e.target.checked)}
              className="h-3.5 w-3.5 accent-brand"
            />
            Undoing this action is possible
          </label>
        </Field>
        <Field label="Preview" span>
          <JsonArea value={previewJson} onChange={setPreviewJson} />
        </Field>
        <Field label="Request payload" span>
          <JsonArea value={payloadJson} onChange={setPayloadJson} />
        </Field>
      </FormPanel>

      {assess.data !== undefined && (
        <div className="rounded-frame border-thin border-border-subtle bg-bg-card p-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-text-secondary">
            Assessment
          </p>
          <pre className="mt-2 max-h-[24rem] overflow-auto rounded-sm border-thin border-border-subtle bg-bg-input p-2.5 font-mono text-[11px] leading-relaxed text-text-secondary">
            {JSON.stringify(assess.data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

function FormPanel({
  icon: Icon,
  title,
  note,
  mutation,
  onSubmit,
  ready,
  submitLabel,
  successNote,
  children,
}: {
  icon: typeof ShieldCheck;
  title: string;
  note: string;
  mutation: { isPending: boolean; isSuccess: boolean; isError: boolean; error: unknown };
  onSubmit: () => void;
  ready: boolean;
  submitLabel: string;
  successNote?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-frame border-thin border-border-subtle bg-bg-card p-4">
      <p className="flex items-center gap-2 text-sm font-black text-text-primary">
        <Icon className="h-4 w-4 text-brand" strokeWidth={1.6} />
        {title}
      </p>
      <p className="mt-1 text-[11px] text-text-muted">{note}</p>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">{children}</div>

      <button
        disabled={!ready || mutation.isPending}
        onClick={onSubmit}
        className="mt-3 flex items-center gap-1.5 rounded-sm bg-brand px-3 py-1.5 text-xs font-bold text-bg hover:bg-brand-light disabled:opacity-40"
      >
        {mutation.isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.6} />
        ) : (
          <Check className="h-3.5 w-3.5" strokeWidth={1.6} />
        )}
        {submitLabel}
      </button>

      {mutation.isError && (
        <div className="mt-2 flex items-start gap-2 rounded-sm border-thin border-rose-400/25 bg-rose-400/5 p-2.5">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-300" strokeWidth={1.6} />
          <p className="text-xs text-text-secondary">{describe(mutation.error)}</p>
        </div>
      )}
      {mutation.isSuccess && successNote && (
        <p className="mt-2 rounded-sm border-thin border-border-glow bg-brand-soft p-2.5 text-xs text-text-secondary">
          {successNote}
        </p>
      )}
    </div>
  );
}

function Field({
  label,
  span,
  children,
}: {
  label: string;
  span?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={`block ${span ? 'sm:col-span-3' : ''}`}>
      <span className="text-[11px] font-bold uppercase tracking-wide text-text-secondary">
        {label}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function JsonArea({ value, onChange }: { value: string; onChange: (next: string) => void }) {
  const valid = isJson(value);
  return (
    <>
      <textarea
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${field} font-mono ${valid ? '' : 'border-rose-400/40'}`}
      />
      {!valid && <p className="mt-1 text-[11px] text-rose-300">That is not valid JSON.</p>}
    </>
  );
}

/**
 * The api client signals an absent endpoint and an absent record with codes rather than prose, so
 * that each caller says it in its own voice. A write against a build that lacks the controller is
 * not a validation failure and must not read as one.
 */
function describe(error: unknown): string {
  if (!(error instanceof Error)) return 'The call failed.';
  if (error.message === 'NOT_DEPLOYED') {
    return 'This Stylemint build does not serve that endpoint yet, so nothing was written.';
  }
  if (error.message === 'NOT_FOUND') return 'Nothing on the platform matches that identifier.';
  return error.message;
}

function isJson(text: string): boolean {
  try {
    JSON.parse(text);
    return true;
  } catch {
    return false;
  }
}

const field =
  'w-full rounded-sm border-thin border-border-subtle bg-bg-input px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:border-border-glow focus:outline-none';
