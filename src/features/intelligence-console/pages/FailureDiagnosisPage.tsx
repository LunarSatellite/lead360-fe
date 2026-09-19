import { useState } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCcw, Stethoscope } from 'lucide-react';
import { ROUTES } from '@/app/router/route-paths';
import { GovernanceRefusalNotice } from '@/features/agent-governance/components/GovernanceRefusalNotice';
import { useDiagnosis, useDiagnosisThreshold } from '../hooks/intelligence.queries';
import type { FailureDiagnosisDto, RecurrenceThresholdDto } from '../types/intelligence.types';
import {
  Absent,
  Field,
  Limitations,
  MethodNote,
  Panel,
  ShareFigure,
  SurfaceHeader,
  WindowNote,
  formatUtc,
} from '../components/ReportPrimitives';
import { ConsistentWithList } from '../components/ConsistentWith';

/**
 * Failure diagnosis.
 *
 * This surface never says what caused anything. It says what the recorded
 * observations are *consistent with*, names the rival explanation the same
 * observations also fit, and names the check that would separate the two. When
 * the evidence is thin it ships `consistentWith: []` and offers nothing at all.
 *
 * The page keeps that shape intact. The recurrence bar is shown before any
 * fingerprint is, so the reader knows what "recurring" was made to mean before
 * they read which fingerprints cleared it; the ones that did not clear it are
 * shown too, with the criteria they failed, rather than being dropped.
 */
function FailureDiagnosisPage() {
  const [days, setDays] = useState(30);
  const diagnosis = useDiagnosis(days);
  const threshold = useDiagnosisThreshold();

  return (
    <div className="flex flex-col gap-4 p-4">
      <SurfaceHeader
        icon={<Stethoscope size={20} strokeWidth={1.6} className="text-brand" />}
        title="Failure diagnosis"
        blurb="Recurring commerce failures, what the observations are consistent with, and what else they are equally consistent with. Nothing here is a cause."
        actions={
          <>
            <label className="inline-flex items-center gap-1.5">
              <span className="sr-only">Lookback window</span>
              <select
                value={days}
                onChange={(event) => setDays(Number(event.target.value))}
                className="rounded-sm border-thin border-border-medium bg-bg-input px-2 py-2 text-xs font-bold text-text-secondary"
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
              </select>
            </label>
            <button
              type="button"
              onClick={() => void diagnosis.refetch()}
              className="inline-flex items-center gap-1.5 rounded-sm border-thin border-border-medium px-3 py-2 text-xs font-bold text-text-secondary hover:bg-glass-2 hover:text-text-primary"
            >
              <RefreshCcw size={13} strokeWidth={1.6} />
              Refresh
            </button>
          </>
        }
      />

      {diagnosis.isError && (
        <GovernanceRefusalNotice
          error={diagnosis.error}
          onRefresh={() => void diagnosis.refetch()}
        />
      )}
      {diagnosis.isPending && (
        <p className="text-xs font-medium text-text-muted">Reading the observations…</p>
      )}

      {threshold.data && <ThresholdPanel threshold={threshold.data} />}

      {diagnosis.data && (
        <>
          <Panel
            testId="observations-panel"
            title="Observations read"
            subtitle={<WindowNote period={diagnosis.data.window} />}
          >
            <MethodNote method={diagnosis.data.method} caveat={diagnosis.data.causationCaveat} />
            <ShareFigure share={diagnosis.data.observationsRead} testId="observations-read" />
            <Field label="Source modules observed">
              {diagnosis.data.sourceModulesObserved.length === 0 ? (
                <Absent state="NoSourceModulesObserved" />
              ) : (
                <span className="font-mono">
                  {diagnosis.data.sourceModulesObserved.join(', ')}
                </span>
              )}
            </Field>
          </Panel>

          <Panel
            testId="recurring-panel"
            title="Fingerprints that cleared the recurrence bar"
            subtitle={<WindowNote period={diagnosis.data.window} />}
          >
            {diagnosis.data.recurring.length === 0 ? (
              <Absent
                state="NoFingerprintClearedTheBar"
                meaning="Nothing observed in this window met all three recurrence criteria. That is not the same as nothing having gone wrong."
              />
            ) : (
              <ul className="flex flex-col gap-3">
                {diagnosis.data.recurring.map((item) => (
                  <DiagnosisCard key={item.fingerprint} diagnosis={item} />
                ))}
              </ul>
            )}
          </Panel>

          <Panel
            testId="below-threshold-panel"
            title="Fingerprints below the bar"
            subtitle={
              <p className="text-xs font-medium leading-relaxed text-text-secondary">
                Shown because a fingerprint that has not yet recurred enough to be called recurring
                is still something that happened. Each one lists the criteria it did not meet.
              </p>
            }
          >
            {diagnosis.data.belowThreshold.length === 0 ? (
              <Absent state="NoFingerprintsBelowTheBar" />
            ) : (
              <ul className="flex flex-col gap-3">
                {diagnosis.data.belowThreshold.map((item) => (
                  <DiagnosisCard key={item.fingerprint} diagnosis={item} />
                ))}
              </ul>
            )}
          </Panel>

          <Limitations items={diagnosis.data.limitations} testId="diagnosis-limitations" />
        </>
      )}
    </div>
  );
}

function ThresholdPanel({ threshold }: { threshold: RecurrenceThresholdDto }) {
  return (
    <Panel
      testId="threshold-panel"
      title="The recurrence bar currently in force"
      subtitle={
        <p className="text-xs font-medium leading-relaxed text-text-secondary">
          {threshold.justification}
        </p>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Minimum occurrences">
          <span className="font-mono text-lg font-black tabular-nums">
            {threshold.minimumOccurrences}
          </span>
        </Field>
        <Field label="Minimum distinct records">
          <span className="font-mono text-lg font-black tabular-nums">
            {threshold.minimumDistinctRecords}
          </span>
        </Field>
        <Field label="Minimum distinct days">
          <span className="font-mono text-lg font-black tabular-nums">
            {threshold.minimumDistinctDays}
          </span>
        </Field>
        <Field label="Lookback days">
          <span className="font-mono text-lg font-black tabular-nums">
            {threshold.lookbackDays}
          </span>
        </Field>
      </div>
      <span className="font-mono text-2xs font-medium text-text-muted">
        Configured at {threshold.configurationSection}
      </span>
    </Panel>
  );
}

export function DiagnosisCard({ diagnosis }: { diagnosis: FailureDiagnosisDto }) {
  return (
    <li
      data-testid={`diagnosis-${diagnosis.fingerprint}`}
      data-meets-threshold={diagnosis.recurrence.meetsThreshold}
      className="flex flex-col gap-3 rounded-card border-thin border-border-subtle bg-glass-1 p-3.5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          to={ROUTES.dashboard.intelDiagnosisFingerprint(diagnosis.fingerprint)}
          className="font-mono text-sm font-extrabold text-text-primary underline decoration-border-medium underline-offset-4 hover:text-brand"
        >
          {diagnosis.fingerprint}
        </Link>
        <span
          className={`rounded-xs border-thin px-1.5 py-0.5 font-mono text-2xs font-bold ${
            diagnosis.recurrence.meetsThreshold
              ? 'border-warning/40 bg-warning-soft text-warning'
              : 'border-border-medium bg-glass-2 text-text-secondary'
          }`}
        >
          {diagnosis.recurrence.meetsThreshold ? 'MeetsRecurrenceBar' : 'BelowRecurrenceBar'}
        </span>
      </div>

      <p className="text-xs font-medium leading-relaxed text-text-secondary">
        {diagnosis.recurrence.verdict}
      </p>

      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Occurrences">
          <span className="font-mono tabular-nums">
            {diagnosis.recurrence.occurrences} of {diagnosis.recurrence.requiredOccurrences}{' '}
            required
          </span>
        </Field>
        <Field label="Distinct records">
          <span className="font-mono tabular-nums">
            {diagnosis.recurrence.distinctRecords} of{' '}
            {diagnosis.recurrence.requiredDistinctRecords} required
          </span>
        </Field>
        <Field label="Distinct days">
          <span className="font-mono tabular-nums">
            {diagnosis.recurrence.distinctDays} of {diagnosis.recurrence.requiredDistinctDays}{' '}
            required
          </span>
        </Field>
        <Field label="Observed between">
          {formatUtc(diagnosis.firstObservedUtc)} → {formatUtc(diagnosis.lastObservedUtc)}
        </Field>
      </div>

      {diagnosis.recurrence.unmetCriteria.length > 0 && (
        <Field label="Criteria not met" testId="unmet-criteria">
          <span className="font-mono">{diagnosis.recurrence.unmetCriteria.join(' · ')}</span>
        </Field>
      )}

      <ShareFigure share={diagnosis.shareOfObservationsInWindow} />

      <div className="flex flex-col gap-2">
        <h3 className="text-2xs font-bold uppercase tracking-wide text-text-muted">
          What the observations are consistent with
        </h3>
        <ConsistentWithList
          items={diagnosis.consistentWith}
          emptyReason="The evidence here is too thin for this surface to offer a hypothesis, so it offers none. An empty list is the answer, not a gap."
          testId={`consistent-with-${diagnosis.fingerprint}`}
        />
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2">
        <Field label="Failure kinds">
          <span className="font-mono">
            {diagnosis.byKind.map((k) => `${k.kind}: ${k.observations}`).join(' · ')}
          </span>
        </Field>
        <Field label="Source modules">
          <span className="font-mono">
            {diagnosis.bySourceModule.map((s) => `${s.sourceModule}: ${s.observations}`).join(' · ')}
          </span>
        </Field>
      </div>

      <div className="flex flex-col gap-1.5 rounded-sm border-thin border-border-subtle bg-bg-card p-2.5">
        <span className="text-2xs font-bold uppercase tracking-wide text-text-muted">
          Affected records
        </span>
        <span className="text-xs font-medium text-text-primary">
          <span className="font-mono tabular-nums">
            {diagnosis.affectedRecords.distinctRecordsObserved}
          </span>{' '}
          distinct records observed ·{' '}
          <span className="font-mono tabular-nums">{diagnosis.affectedRecords.namedHere}</span>{' '}
          named here
          {diagnosis.affectedRecords.truncated ? ' (list truncated by the server)' : ''}
        </span>
        <span className="text-2xs font-medium leading-relaxed text-text-secondary">
          {diagnosis.affectedRecords.attributionNote}
        </span>
        <ul className="flex flex-wrap gap-1.5">
          {diagnosis.affectedRecords.records.map((record) => (
            <li
              key={`${record.targetKind}/${record.targetId}`}
              data-resolution={record.resolution}
              className={`rounded-xs border-thin px-1.5 py-0.5 font-mono text-2xs font-bold ${
                record.resolution === 'ResolvableByMoneyOwningModule'
                  ? 'border-border-medium bg-glass-2 text-text-secondary'
                  : 'border-warning/40 border-dashed bg-warning-soft text-warning'
              }`}
            >
              {record.targetKind}/{record.targetId} · {record.observations}×
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-2xs font-bold uppercase tracking-wide text-text-muted">
          Repair pathway
        </span>
        <span className="font-mono text-xs font-bold text-text-primary">
          {diagnosis.repairPathway.actionKey} → {diagnosis.repairPathway.governedTargetKind}
        </span>
        <span className="text-2xs font-medium leading-relaxed text-text-secondary">
          {diagnosis.repairPathway.note}
        </span>
        {!diagnosis.repairPathway.repairAlreadyProposed && (
          <Absent
            state="NoRepairProposedYet"
            meaning="No governed repair has been proposed for this fingerprint."
          />
        )}
      </div>
    </li>
  );
}

export { FailureDiagnosisPage as Component };
export default FailureDiagnosisPage;
