import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, Plus } from 'lucide-react';
import { ROUTES } from '@/app/router/route-paths';
import { GovernanceRefusalNotice } from '@/features/agent-governance/components/GovernanceRefusalNotice';
import {
  useDeclareImplementationWindow,
  useDecisionLedgerEntry,
  useRecordOption,
  useRecordOutcomeMeasurement,
} from '../hooks/intelligence.queries';
import {
  Absent,
  Field,
  Limitations,
  Panel,
  SurfaceHeader,
  formatUtc,
} from '../components/ReportPrimitives';
import {
  ImplementationWindowBlock,
  OptionsBlock,
  OutcomeBlock,
  SimulationsConsultedBlock,
} from '../components/LedgerStates';

/**
 * One decision's memory, and the three things an operator may add to it.
 *
 * The writes here are the ones the ledger was built for: the options that were
 * weighed, the window the work was meant to run in, and a measured result. All
 * three are appends — nothing on this page edits or removes a ledger entry,
 * and there is no control anywhere that changes the decision itself. Who
 * recorded a fact is taken from the authenticated caller by the server and is
 * never sent from here.
 *
 * Recording a measurement does not make `OutcomeNotMeasured` go away by
 * itself — the server decides the state and the page re-reads it afterwards.
 */
function DecisionLedgerEntryPage() {
  const { decisionId = '' } = useParams<{ decisionId: string }>();
  const entry = useDecisionLedgerEntry(decisionId);

  return (
    <div className="flex flex-col gap-4 p-4">
      <SurfaceHeader
        icon={<BookOpen size={20} strokeWidth={1.6} className="text-brand" />}
        title="Decision memory"
        blurb="Everything the platform knows about one decision, and the parts only a person can supply."
        actions={
          <Link
            to={ROUTES.dashboard.intelLedger}
            className="inline-flex items-center gap-1.5 rounded-sm border-thin border-border-medium px-3 py-2 text-xs font-bold text-text-secondary hover:bg-glass-2 hover:text-text-primary"
          >
            <ArrowLeft size={13} strokeWidth={1.6} />
            Back to ledger
          </Link>
        }
      />

      {entry.isError && (
        <GovernanceRefusalNotice error={entry.error} onRefresh={() => void entry.refetch()} />
      )}
      {entry.isPending && <p className="text-xs font-medium text-text-muted">Reading the entry…</p>}

      {entry.data && (
        <>
          <Panel testId="choice-made" title="The choice made">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Action key">
                <span className="font-mono font-extrabold">{entry.data.choiceMade.actionKey}</span>
              </Field>
              <Field label="Target">
                <span className="font-mono">
                  {entry.data.choiceMade.targetKind}/{entry.data.choiceMade.targetId}
                </span>
              </Field>
              <Field label="Status">
                <span className="font-mono">{entry.data.choiceMade.status}</span>
              </Field>
              <Field label="Requested">{formatUtc(entry.data.choiceMade.requestedUtc)}</Field>
              <Field label="Decided" testId="entry-decided">
                {entry.data.choiceMade.decidedUtc ? (
                  formatUtc(entry.data.choiceMade.decidedUtc)
                ) : (
                  <Absent state="NotDecided" />
                )}
              </Field>
              <Field label="Requesting agent">{entry.data.owner.requestingAgent}</Field>
              <Field label="Requested by">
                <span className="font-mono">{entry.data.owner.requestedByAccountId}</span>
              </Field>
              <Field label="Approved by" testId="entry-approver">
                {entry.data.owner.approvedByAccountId ? (
                  <span className="font-mono">{entry.data.owner.approvedByAccountId}</span>
                ) : (
                  <Absent
                    state="NoApproverRecorded"
                    meaning="No account is recorded as having approved this decision."
                  />
                )}
              </Field>
            </div>
            <span className="text-2xs font-medium text-text-muted">
              Source: {entry.data.choiceMade.source}
            </span>
          </Panel>

          <Panel title="Options considered">
            <OptionsBlock options={entry.data.optionsConsidered} />
            <RecordOptionForm decisionId={decisionId} />
          </Panel>

          <Panel title="Implementation window">
            <ImplementationWindowBlock window={entry.data.implementationWindow} />
            <DeclareWindowForm decisionId={decisionId} />
          </Panel>

          <Panel title="Measured result">
            <OutcomeBlock outcome={entry.data.measuredResult} />
            {entry.data.measuredResult.state === 'DecisionNotExecuted' ? (
              <p className="text-xs font-medium leading-relaxed text-text-secondary">
                Nothing is owed here. A measurement form is not offered for a decision that never
                ran, because there is no period over which anything could have been observed.
              </p>
            ) : (
              <RecordMeasurementForm decisionId={decisionId} />
            )}
          </Panel>

          <Panel title="Simulations consulted">
            <SimulationsConsultedBlock consulted={entry.data.simulationsConsulted} />
          </Panel>

          <Limitations items={entry.data.limitations} testId="entry-limitations" />
        </>
      )}
    </div>
  );
}

// ── The three appends ───────────────────────────────────────────────────────

const inputClass =
  'rounded-sm border-thin border-border-subtle bg-bg-input px-2.5 py-2 text-xs text-text-primary placeholder:text-text-muted focus:border-border-glow focus:bg-glass-1';
const labelClass = 'flex flex-1 flex-col gap-1 text-2xs font-bold text-text-secondary';
const submitClass =
  'inline-flex w-fit items-center gap-1.5 rounded-sm border-thin border-border-medium px-3 py-2 text-xs font-bold text-text-secondary hover:bg-glass-2 hover:text-text-primary disabled:opacity-50';

function Disclosure({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={submitClass}>
        <Plus size={13} strokeWidth={1.8} />
        {label}
      </button>
    );
  }
  return (
    <div className="flex flex-col gap-2 rounded-card border-thin border-border-medium bg-glass-1 p-3">
      <div className="flex items-center justify-between">
        <span className="text-2xs font-bold uppercase tracking-wide text-text-secondary">
          {label}
        </span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-2xs font-bold text-text-muted hover:text-text-primary"
        >
          Cancel
        </button>
      </div>
      {children}
    </div>
  );
}

function RecordOptionForm({ decisionId }: { decisionId: string }) {
  const record = useRecordOption(decisionId);
  const [optionKey, setOptionKey] = useState('');
  const [description, setDescription] = useState('');
  const [wasChosen, setWasChosen] = useState(false);
  const [note, setNote] = useState('');

  return (
    <Disclosure label="Record an option that was considered">
      <form
        className="flex flex-col gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          record.mutate(
            { optionKey, description, wasChosen, note: note.trim() || null },
            {
              onSuccess: () => {
                setOptionKey('');
                setDescription('');
                setNote('');
                setWasChosen(false);
              },
            },
          );
        }}
      >
        <div className="flex flex-wrap gap-2">
          <label className={labelClass}>
            Option key
            <input
              required
              value={optionKey}
              onChange={(e) => setOptionKey(e.target.value)}
              className={inputClass}
              placeholder="hold-price"
            />
          </label>
          <label className={labelClass}>
            Description
            <input
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={inputClass}
              placeholder="What this option would have done"
            />
          </label>
        </div>
        <label className="flex items-center gap-2 text-2xs font-bold text-text-secondary">
          <input
            type="checkbox"
            checked={wasChosen}
            onChange={(e) => setWasChosen(e.target.checked)}
          />
          This is the option that was chosen
        </label>
        <label className={labelClass}>
          Note (optional)
          <input value={note} onChange={(e) => setNote(e.target.value)} className={inputClass} />
        </label>
        {record.isError && <GovernanceRefusalNotice error={record.error} />}
        <button type="submit" disabled={record.isPending} className={submitClass}>
          {record.isPending ? 'Recording…' : 'Record option'}
        </button>
      </form>
    </Disclosure>
  );
}

function DeclareWindowForm({ decisionId }: { decisionId: string }) {
  const declare = useDeclareImplementationWindow(decisionId);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [note, setNote] = useState('');

  return (
    <Disclosure label="Declare the implementation window">
      <form
        className="flex flex-col gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          declare.mutate({
            plannedStartUtc: new Date(start).toISOString(),
            plannedEndUtc: new Date(end).toISOString(),
            note: note.trim() || null,
          });
        }}
      >
        <div className="flex flex-wrap gap-2">
          <label className={labelClass}>
            Planned start (UTC)
            <input
              required
              type="datetime-local"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            Planned end (UTC)
            <input
              required
              type="datetime-local"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className={inputClass}
            />
          </label>
        </div>
        <label className={labelClass}>
          Note (optional)
          <input value={note} onChange={(e) => setNote(e.target.value)} className={inputClass} />
        </label>
        {declare.isError && <GovernanceRefusalNotice error={declare.error} />}
        <button type="submit" disabled={declare.isPending} className={submitClass}>
          {declare.isPending ? 'Declaring…' : 'Declare window'}
        </button>
      </form>
    </Disclosure>
  );
}

function RecordMeasurementForm({ decisionId }: { decisionId: string }) {
  const record = useRecordOutcomeMeasurement(decisionId);
  const [measureKey, setMeasureKey] = useState('');
  const [measureUnit, setMeasureUnit] = useState('');
  const [measuredValue, setMeasuredValue] = useState('');
  const [measurementSource, setMeasurementSource] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [note, setNote] = useState('');

  return (
    <Disclosure label="Record a measured result">
      <form
        className="flex flex-col gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          record.mutate({
            measureKey,
            measureUnit,
            measuredValue: Number(measuredValue),
            measurementSource,
            observedFromUtc: new Date(from).toISOString(),
            observedToUtc: new Date(to).toISOString(),
            note: note.trim() || null,
          });
        }}
      >
        <div className="flex flex-wrap gap-2">
          <label className={labelClass}>
            Measure key
            <input
              required
              value={measureKey}
              onChange={(e) => setMeasureKey(e.target.value)}
              className={inputClass}
              placeholder="failed-checkouts"
            />
          </label>
          <label className={labelClass}>
            Unit
            <input
              required
              value={measureUnit}
              onChange={(e) => setMeasureUnit(e.target.value)}
              className={inputClass}
              placeholder="count"
            />
          </label>
          <label className={labelClass}>
            Measured value
            <input
              required
              type="number"
              step="any"
              value={measuredValue}
              onChange={(e) => setMeasuredValue(e.target.value)}
              className={inputClass}
            />
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          <label className={labelClass}>
            Observed from (UTC)
            <input
              required
              type="datetime-local"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            Observed to (UTC)
            <input
              required
              type="datetime-local"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            Measurement source
            <input
              required
              value={measurementSource}
              onChange={(e) => setMeasurementSource(e.target.value)}
              className={inputClass}
              placeholder="Which module observed it"
            />
          </label>
        </div>
        <label className={labelClass}>
          Note (optional)
          <input value={note} onChange={(e) => setNote(e.target.value)} className={inputClass} />
        </label>
        {record.isError && <GovernanceRefusalNotice error={record.error} />}
        <button type="submit" disabled={record.isPending} className={submitClass}>
          {record.isPending ? 'Recording…' : 'Record measurement'}
        </button>
      </form>
    </Disclosure>
  );
}

export { DecisionLedgerEntryPage as Component };
export default DecisionLedgerEntryPage;
