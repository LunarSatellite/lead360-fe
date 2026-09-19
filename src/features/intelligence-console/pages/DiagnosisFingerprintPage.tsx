import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Stethoscope } from 'lucide-react';
import { ROUTES } from '@/app/router/route-paths';
import { GovernanceRefusalNotice } from '@/features/agent-governance/components/GovernanceRefusalNotice';
import { useDiagnosisFingerprint } from '../hooks/intelligence.queries';
import { Panel, SurfaceHeader } from '../components/ReportPrimitives';
import { DiagnosisCard } from './FailureDiagnosisPage';

/**
 * One fingerprint, whether or not it cleared the recurrence bar.
 *
 * The same card the list uses, so a fingerprint reads identically in both
 * places — including its rival explanation and its distinguishing check. This
 * route exists because the server exposes the single-fingerprint read for
 * fingerprints that are *below* the bar and therefore never appear in the
 * recurring list.
 */
function DiagnosisFingerprintPage() {
  const { fingerprint = '' } = useParams<{ fingerprint: string }>();
  const diagnosis = useDiagnosisFingerprint(fingerprint);

  return (
    <div className="flex flex-col gap-4 p-4">
      <SurfaceHeader
        icon={<Stethoscope size={20} strokeWidth={1.6} className="text-brand" />}
        title="Fingerprint diagnosis"
        blurb="One failure fingerprint, the observations behind it, and what they are — and are not — evidence for."
        actions={
          <Link
            to={ROUTES.dashboard.intelDiagnosis}
            className="inline-flex items-center gap-1.5 rounded-sm border-thin border-border-medium px-3 py-2 text-xs font-bold text-text-secondary hover:bg-glass-2 hover:text-text-primary"
          >
            <ArrowLeft size={13} strokeWidth={1.6} />
            Back to diagnosis
          </Link>
        }
      />

      {diagnosis.isError && (
        <GovernanceRefusalNotice
          error={diagnosis.error}
          onRefresh={() => void diagnosis.refetch()}
        />
      )}
      {diagnosis.isPending && (
        <p className="text-xs font-medium text-text-muted">Reading the fingerprint…</p>
      )}

      {diagnosis.data && (
        <Panel title={fingerprint}>
          <ul className="flex flex-col gap-3">
            <DiagnosisCard diagnosis={diagnosis.data} />
          </ul>
        </Panel>
      )}
    </div>
  );
}

export { DiagnosisFingerprintPage as Component };
export default DiagnosisFingerprintPage;
