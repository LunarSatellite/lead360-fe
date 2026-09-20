import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AlertTriangle, Check, Loader2, PauseCircle, Search, ShieldCheck, Target } from 'lucide-react';
import {
  AgentActionRiskTier,
  RISK_TIER_LABEL,
  stylemintAutonomyApi,
  type AgentActionRiskTierValue,
} from '../api/stylemint-autonomy.api';
import { ReportPanel } from './ReportPanel';

/**
 * The governance surfaces around autonomous operation: what the platform did by itself, the rules
 * it was allowed to do it under, the twin studies that check whether it was right, and whether
 * cart offers caused the sales they are credited with.
 *
 * These live as tabs on Decision intelligence rather than four pages of their own, because they
 * answer the same question from different angles and an operator reading one wants the next.
 *
 * Opening a decision-twin study is absent on purpose: it takes nested assumption and arm lists,
 * a long structured form that belongs with the study it defines. The operations console generates
 * that form from the live schema.
 */

/* ------------------------------------------------------------------ autonomous operations */

export function AutonomyTab() {
  const monitor = useQuery({
    queryKey: ['stylemint-autonomy-monitor'],
    queryFn: () => stylemintAutonomyApi.monitor(),
    retry: false,
  });

  const windows = useQuery({
    queryKey: ['stylemint-autonomy-windows'],
    queryFn: () => stylemintAutonomyApi.maintenanceWindows(),
    retry: false,
  });

  return (
    <div className="space-y-3">
      <ReportPanel
        title="What ran on its own"
        query={monitor}
        emptyNote="Nothing has run autonomously yet."
      />
      <ReportPanel
        title="Maintenance windows"
        query={windows}
        emptyNote="No action is paused."
      />
      <DeclareWindowForm onDone={() => windows.refetch()} />
      <DeclareExpectationForm onDone={() => monitor.refetch()} />
    </div>
  );
}

/** Pausing one action for a stated reason and a stated span — never open-ended. */
function DeclareWindowForm({ onDone }: { onDone: () => void }) {
  const [actionKey, setActionKey] = useState('');
  const [startsUtc, setStartsUtc] = useState('');
  const [endsUtc, setEndsUtc] = useState('');
  const [reason, setReason] = useState('');

  const declare = useMutation({
    mutationFn: () =>
      stylemintAutonomyApi.declareMaintenanceWindow({
        actionKey: actionKey.trim(),
        startsUtc: toIso(startsUtc),
        endsUtc: toIso(endsUtc),
        reason: reason.trim(),
      }),
    onSuccess: () => {
      setActionKey('');
      setStartsUtc('');
      setEndsUtc('');
      setReason('');
      onDone();
    },
  });

  const ready =
    !!actionKey.trim() && !!startsUtc && !!endsUtc && !!reason.trim() && endsUtc > startsUtc;

  return (
    <FormPanel
      icon={PauseCircle}
      title="Pause an action"
      note="The action stops running autonomously for this window. The reason is recorded with it."
      mutation={declare}
      onSubmit={() => declare.mutate()}
      ready={ready}
      submitLabel="Declare window"
      successNote="The window is in place."
    >
      <Field label="Action key">
        <input
          value={actionKey}
          onChange={(e) => setActionKey(e.target.value)}
          placeholder="e.g. pricing.reprice"
          className={`${field} font-mono`}
        />
      </Field>
      <Field label="Starts">
        <input
          type="datetime-local"
          value={startsUtc}
          onChange={(e) => setStartsUtc(e.target.value)}
          className={field}
        />
      </Field>
      <Field label="Ends">
        <input
          type="datetime-local"
          value={endsUtc}
          onChange={(e) => setEndsUtc(e.target.value)}
          className={field}
        />
      </Field>
      <Field label="Reason" span>
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Why this action is paused"
          className={field}
        />
      </Field>
    </FormPanel>
  );
}

/**
 * Declaring, up front, what a decision was supposed to achieve — so that when the window closes
 * the outcome can be judged against something stated beforehand rather than rationalised after.
 */
function DeclareExpectationForm({ onDone }: { onDone: () => void }) {
  const [decisionId, setDecisionId] = useState('');
  const [measureKey, setMeasureKey] = useState('');
  const [measureUnit, setMeasureUnit] = useState('');
  const [expectedValue, setExpectedValue] = useState('');
  const [source, setSource] = useState('');
  const [observeFromUtc, setObserveFromUtc] = useState('');
  const [observeToUtc, setObserveToUtc] = useState('');
  const [note, setNote] = useState('');

  const declare = useMutation({
    mutationFn: () =>
      stylemintAutonomyApi.declareExpectation(decisionId.trim(), {
        measureKey: measureKey.trim(),
        measureUnit: measureUnit.trim(),
        expectedValue: Number(expectedValue),
        expectedMeasurementSource: source.trim(),
        observeFromUtc: toIso(observeFromUtc),
        observeToUtc: toIso(observeToUtc),
        note: note.trim() || null,
      }),
    onSuccess: () => {
      setMeasureKey('');
      setMeasureUnit('');
      setExpectedValue('');
      setSource('');
      setNote('');
      onDone();
    },
  });

  const ready =
    !!decisionId.trim() &&
    !!measureKey.trim() &&
    !!measureUnit.trim() &&
    expectedValue !== '' &&
    Number.isFinite(Number(expectedValue)) &&
    !!source.trim() &&
    !!observeFromUtc &&
    !!observeToUtc &&
    observeToUtc > observeFromUtc;

  return (
    <FormPanel
      icon={Target}
      title="Declare what a decision should achieve"
      note="Stated before the window opens, so the outcome is judged against it rather than around it."
      mutation={declare}
      onSubmit={() => declare.mutate()}
      ready={ready}
      submitLabel="Declare expectation"
      successNote="The expectation is on the record."
    >
      <Field label="Decision id" span>
        <input
          value={decisionId}
          onChange={(e) => setDecisionId(e.target.value)}
          placeholder="Decision id from the monitor above"
          className={`${field} font-mono`}
        />
      </Field>
      <Field label="Measure key">
        <input
          value={measureKey}
          onChange={(e) => setMeasureKey(e.target.value)}
          placeholder="e.g. gross_margin"
          className={`${field} font-mono`}
        />
      </Field>
      <Field label="Unit">
        <input
          value={measureUnit}
          onChange={(e) => setMeasureUnit(e.target.value)}
          placeholder="e.g. percent"
          className={field}
        />
      </Field>
      <Field label="Expected value">
        <input
          type="number"
          step="any"
          value={expectedValue}
          onChange={(e) => setExpectedValue(e.target.value)}
          className={field}
        />
      </Field>
      <Field label="Measured from">
        <input
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder="Which report will settle this"
          className={field}
        />
      </Field>
      <Field label="Observe from">
        <input
          type="datetime-local"
          value={observeFromUtc}
          onChange={(e) => setObserveFromUtc(e.target.value)}
          className={field}
        />
      </Field>
      <Field label="Observe to">
        <input
          type="datetime-local"
          value={observeToUtc}
          onChange={(e) => setObserveToUtc(e.target.value)}
          className={field}
        />
      </Field>
      <Field label="Note" span>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Optional"
          className={field}
        />
      </Field>
    </FormPanel>
  );
}

/* ------------------------------------------------------------------- commerce constitution */

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

/* -------------------------------------------------------------------- retail decision twin */

export function DecisionTwinTab() {
  const [studyId, setStudyId] = useState('');
  const [lookup, setLookup] = useState('');

  const studies = useQuery({
    queryKey: ['stylemint-twin-studies'],
    queryFn: () => stylemintAutonomyApi.twinStudies(),
    retry: false,
  });

  const study = useQuery({
    queryKey: ['stylemint-twin-study', lookup],
    queryFn: () => stylemintAutonomyApi.twinStudy(lookup),
    enabled: !!lookup,
    retry: false,
  });

  return (
    <div className="space-y-3">
      <ReportPanel
        title="Studies"
        query={studies}
        emptyNote="No study has been opened."
      />

      <div className="rounded-frame border-thin border-border-subtle bg-bg-card p-4">
        <p className="text-[11px] font-bold uppercase tracking-wide text-text-secondary">
          Open one study
        </p>
        <div className="mt-2 flex gap-2">
          <input
            value={studyId}
            onChange={(e) => setStudyId(e.target.value)}
            placeholder="Study id from the list above"
            className="flex-1 rounded-sm border-thin border-border-subtle bg-bg-input px-3 py-2 font-mono text-xs text-text-primary placeholder:text-text-muted focus:border-border-glow focus:outline-none"
          />
          <button
            disabled={!studyId.trim()}
            onClick={() => setLookup(studyId.trim())}
            className="flex items-center gap-1.5 rounded-sm bg-brand px-3 py-2 text-xs font-bold text-bg hover:bg-brand-light disabled:opacity-40"
          >
            <Search className="h-3.5 w-3.5" strokeWidth={1.6} /> Open
          </button>
        </div>
        <p className="mt-2 text-[11px] text-text-muted">
          Opening a study takes nested assumptions and arms — that form belongs with the study it
          defines, and the operations console generates it from the live schema.
        </p>
      </div>

      {lookup && (
        <ReportPanel title={`Study ${lookup}`} query={study} emptyNote="No study with that id." />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------------------ cart offers */

const WINDOWS = [7, 30, 90];

export function CartOffersTab() {
  const [days, setDays] = useState(30);

  const incrementality = useQuery({
    queryKey: ['stylemint-cart-offer-incrementality', days],
    queryFn: () => stylemintAutonomyApi.cartOfferIncrementality(days),
    retry: false,
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1">
        {WINDOWS.map((w) => (
          <button
            key={w}
            onClick={() => setDays(w)}
            className={`rounded-sm border-thin px-2.5 py-1 text-[11px] font-bold ${
              days === w
                ? 'border-border-glow bg-brand-soft text-brand'
                : 'border-border-subtle text-text-secondary hover:bg-glass-2'
            }`}
          >
            {w}d
          </button>
        ))}
      </div>

      <ReportPanel
        title={`Did the offer cause the sale — last ${days} days`}
        query={incrementality}
        emptyNote="Not enough offers have been shown to separate cause from coincidence."
      />
    </div>
  );
}

/* ----------------------------------------------------------------------------------- shared */

/** A write form with its own submit state, so each one reports its own outcome. */
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

/**
 * `datetime-local` gives a wall-clock string with no zone. The operator is picking a moment in
 * their own day, so it is read as local time and sent as the instant that produces.
 */
function toIso(local: string): string {
  return local ? new Date(local).toISOString() : '';
}

const field =
  'w-full rounded-sm border-thin border-border-subtle bg-bg-input px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:border-border-glow focus:outline-none';
