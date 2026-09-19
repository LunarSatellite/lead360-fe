import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Network, Plus, Trash2 } from 'lucide-react';
import { ROUTES } from '@/app/router/route-paths';
import { GovernanceRefusalNotice } from '@/features/agent-governance/components/GovernanceRefusalNotice';
import { Panel, SurfaceHeader } from '@/features/intelligence-console/components/ReportPrimitives';
import { useOpenDecisionTwinStudy, useSimulationScenarios } from '../hooks/decision-twin.queries';
import { EmptySection, SimulationBanner } from '../components/TwinPrimitives';
import type {
  DecisionTwinArmBody,
  DecisionTwinConstraintBody,
  OpenDecisionTwinStudyBody,
  StateSimulationAssumptionBody,
} from '../types/decision-twin.types';

/**
 * Define + Simulate — open a decision twin study.
 *
 * Two things about this form are deliberate and should survive editing.
 *
 * **Nothing is prefilled.** Not a seed, not a scope key, not a premise, not a
 * magnitude. The server has no `PlatformDefault` basis and refuses an omitted
 * field *by name*; a client that helpfully filled one in would turn a
 * reproducible study into a figure nobody can check. When the server refuses,
 * its refusal is shown verbatim rather than translated into a guess.
 *
 * **The premise keys are not listed here.** The engine's required assumption
 * keys (`SimulationAssumptions.RequiredWithUnit`) are server-side only and are
 * not on any response this client can read — `GET
 * v1/admin/retail-simulation/scenarios` returns scenario keys, classes,
 * descriptions and pressures, and no assumption schema. Transcribing that
 * dictionary into the web client would create exactly the field-name drift it
 * is meant to prevent, and the copy would rot silently. So premises are entered
 * as free rows and the server names the one you missed. That gap is recorded in
 * the report for this capability.
 *
 * There is no control here that executes an arm. §5.9: a twin simulates.
 */

const FIELD =
  'rounded-sm border-thin border-border-medium bg-bg-input px-2 py-2 text-xs font-medium text-text-primary';
const LABEL = 'text-2xs font-bold uppercase tracking-wide text-text-muted';
const GHOST =
  'inline-flex w-fit items-center gap-1.5 rounded-sm border-thin border-border-medium px-3 py-2 text-xs font-bold text-text-secondary hover:bg-glass-2 hover:text-text-primary disabled:opacity-50';

/** A row the operator has typed into but not completed is still their row, so raw strings are kept. */
interface AssumptionRow {
  assumptionKey: string;
  statedValue: string;
  unit: string;
  basis: StateSimulationAssumptionBody['basis'];
  basisSource: string;
  observedFromUtc: string;
  observedToUtc: string;
  note: string;
}

interface ArmRow {
  armKey: string;
  armLabel: string;
  kind: DecisionTwinArmBody['kind'];
  changeKey: string;
  description: string;
  magnitudePercent: string;
}

interface ConstraintRow {
  constraintKey: string;
  measureKey: string;
  unit: string;
  direction: DecisionTwinConstraintBody['direction'];
  limitValue: string;
  basisSource: string;
}

const emptyAssumptionRow = (): AssumptionRow => ({
  assumptionKey: '',
  statedValue: '',
  unit: '',
  basis: 'OperatorStated',
  basisSource: '',
  observedFromUtc: '',
  observedToUtc: '',
  note: '',
});

const emptyArmRow = (): ArmRow => ({
  armKey: '',
  armLabel: '',
  kind: 'Pricing',
  changeKey: '',
  description: '',
  magnitudePercent: '',
});

const emptyConstraintRow = (): ConstraintRow => ({
  constraintKey: '',
  measureKey: '',
  unit: '',
  direction: 'MustNotExceed',
  limitValue: '',
  basisSource: '',
});

/**
 * `datetime-local` yields `2026-09-01T00:00` with no offset, and the server
 * binds a `DateTimeOffset`. Left as-is, a window the operator entered would be
 * bound against whatever offset the server assumed, silently naming a
 * different period than the one observed. The field says UTC, so it is sent as
 * UTC rather than trusting a default.
 */
const toUtcIso = (local: string) => {
  if (local === '') return '';
  const withSeconds = local.length === 16 ? `${local}:00` : local;
  return `${withSeconds}Z`;
};

const splitList = (value: string) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item !== '');

function DecisionTwinPage() {
  const navigate = useNavigate();
  const scenarios = useSimulationScenarios();
  const open = useOpenDecisionTwinStudy();

  const [lookupId, setLookupId] = useState('');
  const [name, setName] = useState('');
  const [scopeDescription, setScopeDescription] = useState('');
  const [scopeKeys, setScopeKeys] = useState('');
  const [scenarioKey, setScenarioKey] = useState('');
  const [replicateSeeds, setReplicateSeeds] = useState('');
  const [sensitivityKeys, setSensitivityKeys] = useState('');
  const [variationPercent, setVariationPercent] = useState('');
  const [assumptions, setAssumptions] = useState<AssumptionRow[]>([emptyAssumptionRow()]);
  const [arms, setArms] = useState<ArmRow[]>([emptyArmRow()]);
  const [constraints, setConstraints] = useState<ConstraintRow[]>([]);

  const submit = () => {
    const body: OpenDecisionTwinStudyBody = {
      name,
      scopeDescription,
      scopeKeys: splitList(scopeKeys),
      scenarioKey,
      replicateSeeds: splitList(replicateSeeds).map(Number),
      assumptions: assumptions.map((row) => ({
        assumptionKey: row.assumptionKey,
        statedValue: Number(row.statedValue),
        unit: row.unit,
        basis: row.basis,
        basisSource: row.basisSource,
        observedFromUtc: row.observedFromUtc === '' ? null : toUtcIso(row.observedFromUtc),
        observedToUtc: row.observedToUtc === '' ? null : toUtcIso(row.observedToUtc),
        note: row.note === '' ? null : row.note,
      })),
      arms: arms.map((row) => ({
        armKey: row.armKey,
        armLabel: row.armLabel,
        kind: row.kind,
        changeKey: row.changeKey,
        description: row.description,
        magnitudePercent: Number(row.magnitudePercent),
      })),
      constraints: constraints.map((row) => ({
        constraintKey: row.constraintKey,
        measureKey: row.measureKey,
        unit: row.unit,
        direction: row.direction,
        limitValue: Number(row.limitValue),
        basisSource: row.basisSource,
      })),
      sensitivityAssumptionKeys: splitList(sensitivityKeys),
      sensitivityVariationPercent: Number(variationPercent),
    };
    open.mutate(body, {
      onSuccess: (study) => navigate(ROUTES.dashboard.decisionTwinStudy(study.studyId)),
    });
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <SurfaceHeader
        icon={<Network size={20} strokeWidth={1.6} className="text-brand" />}
        title="Retail decision twin"
        blurb="Define an alternative, simulate it over declared seeds, compare it against a no-change baseline, and record what reality said afterwards. It is a composition over the retail simulation, not a second engine."
      />

      <SimulationBanner />

      <Panel
        testId="lookup-panel"
        title="Open an existing study"
        subtitle={
          <p className="text-xs font-medium leading-relaxed text-text-secondary">
            The twin has no list route: <span className="font-mono">GET studies/&#123;id&#125;</span>{' '}
            is the only read, so a study is reached by its id. No list is fabricated here in its
            place.
          </p>
        }
      >
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (lookupId.trim() !== '') {
              navigate(ROUTES.dashboard.decisionTwinStudy(lookupId.trim()));
            }
          }}
        >
          <label className="flex flex-col gap-1">
            <span className={LABEL}>Study id</span>
            <input
              value={lookupId}
              onChange={(event) => setLookupId(event.target.value)}
              placeholder="00000000-0000-0000-0000-000000000000"
              className={`${FIELD} w-80 font-mono`}
            />
          </label>
          <button type="submit" className={GHOST}>
            Open study
          </button>
        </form>
      </Panel>

      <Panel
        testId="define-form"
        title="Define — open a new study"
        subtitle={
          <p className="text-xs font-medium leading-relaxed text-text-secondary">
            Nothing below is filled in for you. The server refuses an omitted scope key, seed,
            premise or alternative by name, and that refusal is shown here rather than guessed at.
            The platform adds the no-change baseline arm itself, so do not add one.
          </p>
        }
      >
        {open.isError && <GovernanceRefusalNotice error={open.error} />}

        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className={LABEL}>Study name</span>
              <input
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                className={FIELD}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className={LABEL}>Scenario</span>
              {scenarios.isError ? (
                <EmptySection
                  state="ScenarioLibraryUnavailable"
                  meaning="The scenario library could not be read, so no scenario keys are offered. None are invented in their place."
                  testId="scenarios-unavailable"
                />
              ) : (
                <select
                  required
                  value={scenarioKey}
                  onChange={(event) => setScenarioKey(event.target.value)}
                  className={FIELD}
                >
                  <option value="">
                    {scenarios.isPending ? 'Reading the scenario library…' : 'Choose a scenario…'}
                  </option>
                  {(scenarios.data?.scenarios ?? []).map((scenario) => (
                    <option key={scenario.scenarioKey} value={scenario.scenarioKey}>
                      {scenario.scenarioKey} · {scenario.scenarioClass}
                    </option>
                  ))}
                </select>
              )}
            </label>
            <label className="flex flex-col gap-1 sm:col-span-2">
              <span className={LABEL}>What the proposed change applies to</span>
              <input
                required
                value={scopeDescription}
                onChange={(event) => setScopeDescription(event.target.value)}
                className={FIELD}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className={LABEL}>Scope keys (comma separated)</span>
              <input
                required
                value={scopeKeys}
                onChange={(event) => setScopeKeys(event.target.value)}
                className={`${FIELD} font-mono`}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className={LABEL}>Replicate seeds (comma separated)</span>
              <input
                required
                value={replicateSeeds}
                onChange={(event) => setReplicateSeeds(event.target.value)}
                placeholder="each seed is one replicate"
                className={`${FIELD} font-mono`}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className={LABEL}>Premises to vary for sensitivity (comma separated)</span>
              <input
                value={sensitivityKeys}
                onChange={(event) => setSensitivityKeys(event.target.value)}
                className={`${FIELD} font-mono`}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className={LABEL}>Sensitivity variation (percent)</span>
              <input
                required
                type="number"
                step="any"
                value={variationPercent}
                onChange={(event) => setVariationPercent(event.target.value)}
                className={FIELD}
              />
            </label>
          </div>

          <RowSection
            title="Premises"
            hint="Every number the model is given, with the basis you are stating it on. The engine's required keys are not listed in any response this client can read, so they are not listed here; the server names the one you missed."
            onAdd={() => setAssumptions((rows) => [...rows, emptyAssumptionRow()])}
          >
            {assumptions.map((row, index) => (
              <RowCard
                key={index}
                onRemove={
                  assumptions.length > 1
                    ? () => setAssumptions((rows) => rows.filter((_, i) => i !== index))
                    : undefined
                }
              >
                <RowInput
                  label="Premise key"
                  value={row.assumptionKey}
                  mono
                  onChange={(value) =>
                    setAssumptions((rows) =>
                      rows.map((r, i) => (i === index ? { ...r, assumptionKey: value } : r)),
                    )
                  }
                />
                <RowInput
                  label="Stated value"
                  type="number"
                  value={row.statedValue}
                  onChange={(value) =>
                    setAssumptions((rows) =>
                      rows.map((r, i) => (i === index ? { ...r, statedValue: value } : r)),
                    )
                  }
                />
                <RowInput
                  label="Unit"
                  value={row.unit}
                  onChange={(value) =>
                    setAssumptions((rows) =>
                      rows.map((r, i) => (i === index ? { ...r, unit: value } : r)),
                    )
                  }
                />
                <label className="flex flex-col gap-1">
                  <span className={LABEL}>Basis</span>
                  <select
                    value={row.basis}
                    onChange={(event) =>
                      setAssumptions((rows) =>
                        rows.map((r, i) =>
                          i === index
                            ? { ...r, basis: event.target.value as AssumptionRow['basis'] }
                            : r,
                        ),
                      )
                    }
                    className={FIELD}
                  >
                    <option value="OperatorStated">OperatorStated</option>
                    <option value="DerivedFromObservedWindow">DerivedFromObservedWindow</option>
                  </select>
                </label>
                <RowInput
                  label="Basis source"
                  value={row.basisSource}
                  onChange={(value) =>
                    setAssumptions((rows) =>
                      rows.map((r, i) => (i === index ? { ...r, basisSource: value } : r)),
                    )
                  }
                />
                <RowInput
                  label="Note"
                  value={row.note}
                  onChange={(value) =>
                    setAssumptions((rows) =>
                      rows.map((r, i) => (i === index ? { ...r, note: value } : r)),
                    )
                  }
                />
                {row.basis === 'DerivedFromObservedWindow' && (
                  <>
                    <RowInput
                      label="Observed from (UTC)"
                      type="datetime-local"
                      value={row.observedFromUtc}
                      onChange={(value) =>
                        setAssumptions((rows) =>
                          rows.map((r, i) => (i === index ? { ...r, observedFromUtc: value } : r)),
                        )
                      }
                    />
                    <RowInput
                      label="Observed to (UTC)"
                      type="datetime-local"
                      value={row.observedToUtc}
                      onChange={(value) =>
                        setAssumptions((rows) =>
                          rows.map((r, i) => (i === index ? { ...r, observedToUtc: value } : r)),
                        )
                      }
                    />
                  </>
                )}
              </RowCard>
            ))}
          </RowSection>

          <RowSection
            title="Alternatives"
            hint="Each one is put through the model over every declared seed. The no-change baseline is created by the platform, not by you."
            onAdd={() => setArms((rows) => [...rows, emptyArmRow()])}
          >
            {arms.map((row, index) => (
              <RowCard
                key={index}
                onRemove={
                  arms.length > 1
                    ? () => setArms((rows) => rows.filter((_, i) => i !== index))
                    : undefined
                }
              >
                <RowInput
                  label="Arm key"
                  value={row.armKey}
                  mono
                  onChange={(value) =>
                    setArms((rows) => rows.map((r, i) => (i === index ? { ...r, armKey: value } : r)))
                  }
                />
                <RowInput
                  label="Arm label"
                  value={row.armLabel}
                  onChange={(value) =>
                    setArms((rows) =>
                      rows.map((r, i) => (i === index ? { ...r, armLabel: value } : r)),
                    )
                  }
                />
                <label className="flex flex-col gap-1">
                  <span className={LABEL}>Kind</span>
                  <select
                    value={row.kind}
                    onChange={(event) =>
                      setArms((rows) =>
                        rows.map((r, i) =>
                          i === index ? { ...r, kind: event.target.value as ArmRow['kind'] } : r,
                        ),
                      )
                    }
                    className={FIELD}
                  >
                    {(['Search', 'Pricing', 'Promotion', 'Fulfilment', 'Policy'] as const).map(
                      (kind) => (
                        <option key={kind} value={kind}>
                          {kind}
                        </option>
                      ),
                    )}
                  </select>
                </label>
                <RowInput
                  label="Change key"
                  value={row.changeKey}
                  mono
                  onChange={(value) =>
                    setArms((rows) =>
                      rows.map((r, i) => (i === index ? { ...r, changeKey: value } : r)),
                    )
                  }
                />
                <RowInput
                  label="Magnitude (percent)"
                  type="number"
                  value={row.magnitudePercent}
                  onChange={(value) =>
                    setArms((rows) =>
                      rows.map((r, i) => (i === index ? { ...r, magnitudePercent: value } : r)),
                    )
                  }
                />
                <RowInput
                  label="Description"
                  value={row.description}
                  onChange={(value) =>
                    setArms((rows) =>
                      rows.map((r, i) => (i === index ? { ...r, description: value } : r)),
                    )
                  }
                />
              </RowCard>
            ))}
          </RowSection>

          <RowSection
            title="Declared limits (optional)"
            hint="Declared before anything runs. The study reports in how many replicates each was crossed, over the stated denominator, and nothing further."
            onAdd={() => setConstraints((rows) => [...rows, emptyConstraintRow()])}
          >
            {constraints.length === 0 ? (
              <EmptySection
                state="NoLimitsDeclared"
                meaning="No limits declared. The study will say so rather than implying every limit was respected."
                testId="constraints-none"
              />
            ) : (
              constraints.map((row, index) => (
                <RowCard
                  key={index}
                  onRemove={() => setConstraints((rows) => rows.filter((_, i) => i !== index))}
                >
                  <RowInput
                    label="Limit key"
                    value={row.constraintKey}
                    mono
                    onChange={(value) =>
                      setConstraints((rows) =>
                        rows.map((r, i) => (i === index ? { ...r, constraintKey: value } : r)),
                      )
                    }
                  />
                  <RowInput
                    label="Measure key"
                    value={row.measureKey}
                    mono
                    onChange={(value) =>
                      setConstraints((rows) =>
                        rows.map((r, i) => (i === index ? { ...r, measureKey: value } : r)),
                      )
                    }
                  />
                  <RowInput
                    label="Unit"
                    value={row.unit}
                    onChange={(value) =>
                      setConstraints((rows) =>
                        rows.map((r, i) => (i === index ? { ...r, unit: value } : r)),
                      )
                    }
                  />
                  <label className="flex flex-col gap-1">
                    <span className={LABEL}>Direction</span>
                    <select
                      value={row.direction}
                      onChange={(event) =>
                        setConstraints((rows) =>
                          rows.map((r, i) =>
                            i === index
                              ? { ...r, direction: event.target.value as ConstraintRow['direction'] }
                              : r,
                          ),
                        )
                      }
                      className={FIELD}
                    >
                      <option value="MustNotExceed">MustNotExceed</option>
                      <option value="MustNotFallBelow">MustNotFallBelow</option>
                    </select>
                  </label>
                  <RowInput
                    label="Limit value"
                    type="number"
                    value={row.limitValue}
                    onChange={(value) =>
                      setConstraints((rows) =>
                        rows.map((r, i) => (i === index ? { ...r, limitValue: value } : r)),
                      )
                    }
                  />
                  <RowInput
                    label="Where the limit came from"
                    value={row.basisSource}
                    onChange={(value) =>
                      setConstraints((rows) =>
                        rows.map((r, i) => (i === index ? { ...r, basisSource: value } : r)),
                      )
                    }
                  />
                </RowCard>
              ))
            )}
          </RowSection>

          <button type="submit" disabled={open.isPending} className={GHOST}>
            {open.isPending ? 'Running every arm over every seed…' : 'Open study and simulate'}
          </button>
        </form>
      </Panel>
    </div>
  );
}

function RowSection({
  title,
  hint,
  onAdd,
  children,
}: {
  title: string;
  hint: string;
  onAdd: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex flex-col gap-1">
        <h3 className="text-xs font-extrabold tracking-tight text-text-primary">{title}</h3>
        <p className="max-w-3xl text-xs font-medium leading-relaxed text-text-secondary">{hint}</p>
      </div>
      {children}
      <button type="button" onClick={onAdd} className={GHOST}>
        <Plus size={13} strokeWidth={1.8} />
        Add row
      </button>
    </section>
  );
}

function RowCard({ children, onRemove }: { children: React.ReactNode; onRemove?: () => void }) {
  return (
    <div className="flex flex-col gap-2 rounded-sm border-thin border-border-subtle bg-glass-1 p-3">
      <div className="grid gap-2 sm:grid-cols-3">{children}</div>
      {onRemove ? (
        <button type="button" onClick={onRemove} className={GHOST}>
          <Trash2 size={13} strokeWidth={1.8} />
          Remove
        </button>
      ) : null}
    </div>
  );
}

function RowInput({
  label,
  value,
  onChange,
  type,
  mono,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  mono?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className={LABEL}>{label}</span>
      <input
        type={type ?? 'text'}
        step={type === 'number' ? 'any' : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={mono ? `${FIELD} font-mono` : FIELD}
      />
    </label>
  );
}

export { DecisionTwinPage as Component };
export default DecisionTwinPage;
