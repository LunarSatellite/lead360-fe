import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Link2 } from 'lucide-react';
import { ROUTES } from '@/app/router/route-paths';
import { GovernanceRefusalNotice } from '@/features/agent-governance/components/GovernanceRefusalNotice';
import { useRecordSignals } from '../hooks/intelligence.queries';
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
 * Everything every module recorded against one concrete record.
 *
 * This is the cross-boundary view no per-module screen can give: the order
 * that payments failed on and delivery also failed on, side by side. Each
 * domain carries its own owner, and today each of those reads
 * `OwnerNotAssigned`.
 */
function AuroraRecordPage() {
  const { targetKind = '', targetId = '' } = useParams<{
    targetKind: string;
    targetId: string;
  }>();
  const record = useRecordSignals(targetKind, targetId);

  return (
    <div className="flex flex-col gap-4 p-4">
      <SurfaceHeader
        icon={<Link2 size={20} strokeWidth={1.6} className="text-brand" />}
        title={`${targetKind}/${targetId}`}
        blurb="Every module that recorded a failure against this one record, in the window."
        actions={
          <Link
            to={ROUTES.dashboard.intelRelatedSignals}
            className="inline-flex items-center gap-1.5 rounded-sm border-thin border-border-medium px-3 py-2 text-xs font-bold text-text-secondary hover:bg-glass-2 hover:text-text-primary"
          >
            <ArrowLeft size={13} strokeWidth={1.6} />
            Back to related signals
          </Link>
        }
      />

      {record.isError && (
        <GovernanceRefusalNotice error={record.error} onRefresh={() => void record.refetch()} />
      )}
      {record.isPending && <p className="text-xs font-medium text-text-muted">Reading…</p>}

      {record.data && (
        <>
          <Panel
            testId="record-method"
            title="Observations on this record"
            subtitle={<WindowNote period={record.data.window} />}
          >
            <MethodNote method={record.data.method} caveat={record.data.causationCaveat} />
            <ShareFigure share={record.data.observationsOnRecord} testId="record-observations" />
          </Panel>

          <Panel testId="record-domains" title="Domains that recorded something here">
            {record.data.domains.length === 0 ? (
              <Absent
                state="NoDomainRecordedAgainstThisRecord"
                meaning="No module recorded a failure against this record in the window."
              />
            ) : (
              <ul className="flex flex-col gap-2">
                {record.data.domains.map((domain) => (
                  <li
                    key={domain.domain}
                    data-testid={`domain-${domain.domain}`}
                    className="flex flex-col gap-2 rounded-card border-thin border-border-subtle bg-glass-1 p-3"
                  >
                    <span className="font-mono text-sm font-extrabold text-text-primary">
                      {domain.domain}
                    </span>
                    <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                      <Field label="Observations">
                        <span className="font-mono text-lg font-black tabular-nums">
                          {domain.observations.toLocaleString('en-US')}
                        </span>
                      </Field>
                      <Field label="Failure kinds">
                        <span className="font-mono">
                          {domain.byKind.map((k) => `${k.kind}: ${k.observations}`).join(' · ')}
                        </span>
                      </Field>
                      <Field label="Observed between">
                        {formatUtc(domain.firstObservedUtc)} → {formatUtc(domain.lastObservedUtc)}
                      </Field>
                    </div>
                    {domain.fingerprints.length > 0 && (
                      <Field label="Fingerprints">
                        <ul className="flex flex-wrap gap-1.5">
                          {domain.fingerprints.map((fingerprint) => (
                            <li key={fingerprint}>
                              <Link
                                to={ROUTES.dashboard.intelDiagnosisFingerprint(fingerprint)}
                                className="rounded-xs border-thin border-border-medium bg-glass-2 px-1.5 py-0.5 font-mono text-2xs font-bold text-text-secondary hover:text-brand"
                              >
                                {fingerprint}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </Field>
                    )}
                    <DecisionOwnerBadge owner={domain.owner} testId={`owner-${domain.domain}`} />
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel testId="record-routing" title="Where this routes">
            <RoutingBlock routing={record.data.routing} />
          </Panel>

          <Panel testId="record-hypotheses" title="What these observations are consistent with">
            <ConsistentWithList
              items={record.data.consistentWith}
              emptyReason="Too little was recorded against this record for the surface to offer a hypothesis, so it offers none."
            />
          </Panel>

          <Limitations items={record.data.limitations} testId="record-limitations" />
          <p className="text-2xs font-medium text-text-muted">
            Generated {formatUtc(record.data.generatedUtc)}
          </p>
        </>
      )}
    </div>
  );
}

export { AuroraRecordPage as Component };
export default AuroraRecordPage;
