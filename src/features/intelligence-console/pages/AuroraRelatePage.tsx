import { useState } from 'react';
import { Link } from 'react-router-dom';
import { EyeOff, Link2, RefreshCcw } from 'lucide-react';
import { ROUTES } from '@/app/router/route-paths';
import { GovernanceRefusalNotice } from '@/features/agent-governance/components/GovernanceRefusalNotice';
import { useDecisionOwners, useRelatedSignals } from '../hooks/intelligence.queries';
import type {
  AuroraAlternativeDto,
  AuroraCrossDomainLinkDto,
  AuroraDomainSideDto,
} from '../types/intelligence.types';
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
import { DecisionOwnerBadge, RoutingBlock } from '../components/DecisionOwner';

/**
 * Aurora relate: modules that fail on the same concrete records.
 *
 * Two things on this screen are as important as the links themselves.
 *
 * **`dimensionsNotAvailable`.** Channel, release, store and journey stage are
 * never recorded anywhere in the platform. Aurora ships that list so a reader
 * cannot mistake "no link by channel" for "no relationship by channel" — one
 * is a finding, the other is an absence of data. It is rendered at the top,
 * before any link, not tucked into a footnote.
 *
 * **`decisionOwners` is deliberately empty.** Nobody has yet decided who owns
 * `payments` or who owns `delivery`, so every link routes to `OwnerNotAssigned`.
 * That is a pending organisational decision and it is shown as one.
 *
 * Links that fall below the evidence bar are shown separately rather than
 * hidden, with the bar itself stated first.
 */
function AuroraRelatePage() {
  const [days, setDays] = useState(30);
  const signals = useRelatedSignals(days);
  const owners = useDecisionOwners(days);

  return (
    <div className="flex flex-col gap-4 p-4">
      <SurfaceHeader
        icon={<Link2 size={20} strokeWidth={1.6} className="text-brand" />}
        title="Related signals"
        blurb="Pairs of modules observed failing on the same records, who would own each side, and the alternatives a person has. Co-occurrence, not causation."
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
              onClick={() => {
                void signals.refetch();
                void owners.refetch();
              }}
              className="inline-flex items-center gap-1.5 rounded-sm border-thin border-border-medium px-3 py-2 text-xs font-bold text-text-secondary hover:bg-glass-2 hover:text-text-primary"
            >
              <RefreshCcw size={13} strokeWidth={1.6} />
              Refresh
            </button>
          </>
        }
      />

      {signals.isError && (
        <GovernanceRefusalNotice error={signals.error} onRefresh={() => void signals.refetch()} />
      )}
      {signals.isPending && (
        <p className="text-xs font-medium text-text-muted">Reading the observations…</p>
      )}

      {signals.data && (
        <>
          {/* ── What is not recorded at all ── */}
          <section
            data-testid="dimensions-not-available"
            className="flex flex-col gap-2 rounded-card border-thin border-warning/40 bg-warning-soft p-3.5"
          >
            <h2 className="flex items-center gap-1.5 text-sm font-extrabold text-warning">
              <EyeOff size={15} strokeWidth={1.8} />
              Dimensions this platform never records
            </h2>
            <p className="max-w-3xl text-xs font-medium leading-relaxed text-text-secondary">
              Nothing below can be broken down by these. Their absence from the links is an absence
              of data, not evidence that they are unrelated.
            </p>
            <ul className="flex flex-wrap gap-1.5">
              {signals.data.dimensionsNotAvailable.map((dimension) => (
                <li
                  key={dimension}
                  className="rounded-xs border-thin border-dashed border-warning/50 bg-warning/10 px-2 py-1 font-mono text-2xs font-black uppercase tracking-wide text-warning"
                >
                  {dimension}
                </li>
              ))}
            </ul>
          </section>

          <Panel
            testId="aurora-method"
            title="How these links were made"
            subtitle={<WindowNote period={signals.data.window} />}
          >
            <MethodNote method={signals.data.method} caveat={signals.data.causationCaveat} />
            <ShareFigure share={signals.data.observationsRead} testId="aurora-observations-read" />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Minimum shared records">
                <span className="font-mono text-lg font-black tabular-nums">
                  {signals.data.evidenceBar.minimumSharedRecords}
                </span>
              </Field>
              <Field label="Minimum distinct days">
                <span className="font-mono text-lg font-black tabular-nums">
                  {signals.data.evidenceBar.minimumDistinctDays}
                </span>
              </Field>
              <Field label="Lookback days">
                <span className="font-mono text-lg font-black tabular-nums">
                  {signals.data.evidenceBar.lookbackDays}
                </span>
              </Field>
              <Field label="Domains observed">
                {signals.data.domainsObserved.length === 0 ? (
                  <Absent state="NoDomainsObserved" />
                ) : (
                  <span className="font-mono">{signals.data.domainsObserved.join(', ')}</span>
                )}
              </Field>
            </div>
            <p className="text-2xs font-medium leading-relaxed text-text-secondary">
              {signals.data.evidenceBar.justification} · configured at{' '}
              <span className="font-mono">{signals.data.evidenceBar.configurationSection}</span>
            </p>
          </Panel>

          {/* ── Owners ── */}
          <Panel
            testId="decision-owners-panel"
            title="Who owns decisions in which domain"
            subtitle={
              owners.data ? (
                <p className="text-xs font-medium leading-relaxed text-text-secondary">
                  {owners.data.routingNote} Configured at{' '}
                  <span className="font-mono">{owners.data.configurationSection}</span>.
                </p>
              ) : undefined
            }
          >
            {owners.isError && (
              <GovernanceRefusalNotice
                error={owners.error}
                onRefresh={() => void owners.refetch()}
              />
            )}
            {owners.data && owners.data.configured.length === 0 && (
              <Absent
                testId="no-owners-configured"
                state="NoDecisionOwnersConfigured"
                meaning="The owner table is empty. Nobody has decided who owns these domains, so every link below routes to nobody. This is a decision waiting to be made, not a data gap."
              />
            )}
            {owners.data && owners.data.configured.length > 0 && (
              <ul className="flex flex-col gap-2">
                {owners.data.configured.map((owner) => (
                  <li key={owner.domain}>
                    <DecisionOwnerBadge owner={owner} />
                  </li>
                ))}
              </ul>
            )}
            {owners.data && owners.data.domainsObservedWithoutOwner.length > 0 && (
              <Field label="Domains observed with no owner" testId="domains-without-owner">
                <span className="font-mono">
                  {owners.data.domainsObservedWithoutOwner.join(', ')}
                </span>
              </Field>
            )}
            {owners.data && <Limitations items={owners.data.limitations} testId="owner-limitations" />}
          </Panel>

          {/* ── Links ── */}
          <Panel
            testId="links-panel"
            title="Cross-domain links that cleared the evidence bar"
            subtitle={<WindowNote period={signals.data.window} />}
          >
            {signals.data.crossDomainLinks.length === 0 ? (
              <Absent
                state="NoLinkClearedTheEvidenceBar"
                meaning="No pair of modules was observed failing on enough shared records across enough days to clear the bar."
              />
            ) : (
              <ul className="flex flex-col gap-3">
                {signals.data.crossDomainLinks.map((link) => (
                  <LinkCard key={link.linkKey} link={link} />
                ))}
              </ul>
            )}
          </Panel>

          <Panel
            testId="below-bar-panel"
            title="Links below the evidence bar"
            subtitle={
              <p className="text-xs font-medium leading-relaxed text-text-secondary">
                Shown rather than hidden. Below the bar means not enough evidence to call it a
                pattern — it does not mean the pair is unrelated.
              </p>
            }
          >
            {signals.data.belowEvidenceBar.length === 0 ? (
              <Absent state="NoLinksBelowTheEvidenceBar" />
            ) : (
              <ul className="flex flex-col gap-3">
                {signals.data.belowEvidenceBar.map((link) => (
                  <LinkCard key={link.linkKey} link={link} />
                ))}
              </ul>
            )}
          </Panel>

          <Limitations items={signals.data.limitations} testId="aurora-limitations" />
          <p className="text-2xs font-medium text-text-muted">
            Generated {formatUtc(signals.data.generatedUtc)}
          </p>
        </>
      )}
    </div>
  );
}

function DomainSide({ side, label }: { side: AuroraDomainSideDto; label: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-sm border-thin border-border-subtle bg-bg-card p-2.5">
      <span className="text-2xs font-bold uppercase tracking-wide text-text-muted">
        {label} · <span className="font-mono text-text-secondary">{side.domain}</span>
      </span>
      <Field label="Observations on shared records">
        <span className="font-mono text-base font-black tabular-nums">
          {side.observationsOnSharedRecords.toLocaleString('en-US')}
        </span>
      </Field>
      <ShareFigure share={side.recordsTouchedInWindow} />
      <Field label="Failure kinds">
        <span className="font-mono">
          {side.byKind.map((k) => `${k.kind}: ${k.observations}`).join(' · ')}
        </span>
      </Field>
      <DecisionOwnerBadge owner={side.owner} testId={`owner-${side.domain}`} />
    </div>
  );
}

function AlternativeCard({ alternative }: { alternative: AuroraAlternativeDto }) {
  return (
    <li
      data-availability={alternative.availability}
      className={`flex flex-col gap-1.5 rounded-sm border-thin p-2.5 ${
        alternative.availability === 'GovernedActionAvailable'
          ? 'border-border-medium bg-glass-2'
          : 'border-dashed border-border-medium bg-glass-1'
      }`}
    >
      <span className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-xs font-extrabold text-text-primary">
          {alternative.alternative}
        </span>
        <span className="rounded-xs border-thin border-border-medium px-1.5 py-0.5 font-mono text-2xs font-bold text-text-secondary">
          {alternative.availability}
        </span>
      </span>
      <p className="text-xs font-medium leading-relaxed text-text-secondary">
        {alternative.statement}
      </p>
      <Field label="Governed action">
        {alternative.governedActionKey ? (
          <span className="font-mono">{alternative.governedActionKey}</span>
        ) : (
          <Absent
            state="NoGovernedActionRegistered"
            meaning="There is no automated action for this. It has to be done by a person."
          />
        )}
      </Field>
      <Field label="Proposal pathway">{alternative.proposalPathway}</Field>
      <Field label="Approval requirement">{alternative.approvalRequirement}</Field>
      {alternative.dependencies.length > 0 && (
        <Field label="Depends on">
          <span className="font-mono">{alternative.dependencies.join(' · ')}</span>
        </Field>
      )}
      <Field label="Impact">{alternative.impactStatement}</Field>
    </li>
  );
}

export function LinkCard({ link }: { link: AuroraCrossDomainLinkDto }) {
  return (
    <li
      data-testid={`link-${link.linkKey}`}
      data-meets-evidence-bar={link.meetsEvidenceBar}
      className="flex flex-col gap-3 rounded-card border-thin border-border-subtle bg-glass-1 p-3.5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-mono text-sm font-extrabold text-text-primary">{link.linkKey}</span>
        <span
          className={`rounded-xs border-thin px-1.5 py-0.5 font-mono text-2xs font-bold ${
            link.meetsEvidenceBar
              ? 'border-warning/40 bg-warning-soft text-warning'
              : 'border-border-medium bg-glass-2 text-text-secondary'
          }`}
        >
          {link.meetsEvidenceBar ? 'MeetsEvidenceBar' : 'BelowEvidenceBar'}
        </span>
      </div>

      <div className="grid gap-2 lg:grid-cols-2">
        <DomainSide side={link.left} label="Left" />
        <DomainSide side={link.right} label="Right" />
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Records with both domains">
          <span className="font-mono text-lg font-black tabular-nums">
            {link.recordsWithBothDomains.toLocaleString('en-US')}
          </span>
        </Field>
        <Field label="Records with left only side">
          <span className="font-mono tabular-nums">
            {link.recordsWithLeftDomain.toLocaleString('en-US')}
          </span>
        </Field>
        <Field label="Records with right side">
          <span className="font-mono tabular-nums">
            {link.recordsWithRightDomain.toLocaleString('en-US')}
          </span>
        </Field>
        <Field label="Distinct days observed">
          <span className="font-mono tabular-nums">{link.distinctDaysObserved}</span>
        </Field>
      </div>
      <p className="text-2xs font-medium leading-relaxed text-text-secondary">
        Denominator: {link.denominatorMeaning} · observed {formatUtc(link.firstObservedUtc)} →{' '}
        {formatUtc(link.lastObservedUtc)}
      </p>

      <RoutingBlock routing={link.routing} testId={`routing-${link.linkKey}`} />

      <div className="flex flex-col gap-2">
        <h3 className="text-2xs font-bold uppercase tracking-wide text-text-muted">
          What the co-occurrence is consistent with
        </h3>
        <ConsistentWithList
          items={link.consistentWith}
          emptyReason="Too few shared records here for this surface to offer a hypothesis, so it offers none."
          testId={`consistent-with-${link.linkKey}`}
        />
      </div>

      {link.namedRecords.length > 0 && (
        <Field label="Records named by the server">
          <ul className="flex flex-wrap gap-1.5">
            {link.namedRecords.map((record) => (
              <li key={`${record.targetKind}/${record.targetId}`}>
                <Link
                  to={ROUTES.dashboard.intelRecordSignals(record.targetKind, record.targetId)}
                  className="rounded-xs border-thin border-border-medium bg-glass-2 px-1.5 py-0.5 font-mono text-2xs font-bold text-text-secondary hover:text-brand"
                >
                  {record.targetKind}/{record.targetId} · {record.observationsInWindow}×
                </Link>
              </li>
            ))}
          </ul>
        </Field>
      )}

      {link.alternatives.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-2xs font-bold uppercase tracking-wide text-text-muted">
            What a person can do about it
          </h3>
          <ul className="flex flex-col gap-2">
            {link.alternatives.map((alternative) => (
              <AlternativeCard key={alternative.alternative} alternative={alternative} />
            ))}
          </ul>
        </div>
      )}
    </li>
  );
}

export { AuroraRelatePage as Component };
export default AuroraRelatePage;
