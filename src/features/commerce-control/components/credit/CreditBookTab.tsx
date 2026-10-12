import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Play } from 'lucide-react';
import { confirmDialog } from '@/shared/ui/confirm';
import {
  AgreementState,
  DelinquencyBucket,
  Guarantor,
  stylemintCreditApi,
  type CreditPortfolio,
  type GuarantorValue,
} from '../../api/stylemint-credit.api';
import {
  BUCKET_LABEL,
  GUARANTOR_LABEL,
  KIND_LABEL,
  STATE_LABEL,
  npr,
} from '../../lib/credit-console';
import { ErrorLine } from './CreditAgreementDetail';

/** What principal on a slice means depends on its state; say which. */
const PRINCIPAL_MEANING: Partial<Record<number, string>> = {
  [AgreementState.PendingApproval]: 'would be lent',
  [AgreementState.Approved]: 'would be lent',
  [AgreementState.Active]: 'owed',
  [AgreementState.Defaulted]: 'written off',
};

/**
 * The book by state and kind, and the running part by how late it is. Both are the database's
 * sums over every agreement — the console adds nothing up itself beyond these slices.
 */
export function CreditBookTab({ portfolio }: { portfolio: CreditPortfolio }) {
  const guarantors = [Guarantor.Vendor, Guarantor.Platform, Guarantor.Partner, Guarantor.None].filter(
    (g) => portfolio.delinquency.some((d) => d.guarantor === g),
  );
  const buckets = Object.values(DelinquencyBucket);
  const cell = (bucket: number, guarantor: GuarantorValue) =>
    portfolio.delinquency.find((d) => d.bucket === bucket && d.guarantor === guarantor);

  return (
    <div className="space-y-4">
      <Section
        title="Delinquency — running agreements by days past due"
        note="An agreement more than 90 days past due defaults at the next aging run and is written off against its guarantor."
      >
        {guarantors.length === 0 ? (
          <p className="p-4 text-xs text-text-muted">No agreements are running.</p>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-text-muted">
                <th className="px-3 py-2 font-bold">How late</th>
                {guarantors.map((g) => (
                  <th key={g} className="px-3 py-2 text-right font-bold">
                    {GUARANTOR_LABEL[g]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {buckets.map((bucket) => (
                <tr key={bucket} className="border-t border-border-subtle">
                  <td
                    className={`px-3 py-2 font-bold ${
                      bucket === DelinquencyBucket.Current ? 'text-text-secondary' : 'text-danger'
                    }`}
                  >
                    {BUCKET_LABEL[bucket]}
                  </td>
                  {guarantors.map((g) => {
                    const c = cell(bucket, g);
                    return (
                      <td key={g} className="px-3 py-2 text-right text-text-primary">
                        {c ? `${c.count} · ${npr(c.outstandingPrincipal)}` : '—'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      <Section title="The book — every agreement by state and kind" note={`As of ${portfolio.asOf}.`}>
        {portfolio.slices.length === 0 ? (
          <p className="p-4 text-xs text-text-muted">No agreements yet.</p>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-text-muted">
                <th className="px-3 py-2 font-bold">State</th>
                <th className="px-3 py-2 font-bold">Kind</th>
                <th className="px-3 py-2 font-bold">Guaranteed by</th>
                <th className="px-3 py-2 text-right font-bold">Agreements</th>
                <th className="px-3 py-2 text-right font-bold">Principal</th>
              </tr>
            </thead>
            <tbody>
              {portfolio.slices.map((s) => (
                <tr key={`${s.state}-${s.kind}-${s.guarantor}`} className="border-t border-border-subtle">
                  <td className="px-3 py-2 text-text-primary">{STATE_LABEL[s.state]}</td>
                  <td className="px-3 py-2 text-text-secondary">{KIND_LABEL[s.kind]}</td>
                  <td className="px-3 py-2 text-text-secondary">{GUARANTOR_LABEL[s.guarantor]}</td>
                  <td className="px-3 py-2 text-right text-text-primary">{s.count}</td>
                  <td className="px-3 py-2 text-right text-text-primary">
                    {PRINCIPAL_MEANING[s.state] ? (
                      <>
                        {npr(s.outstandingPrincipal)}{' '}
                        <span className="text-text-muted">{PRINCIPAL_MEANING[s.state]}</span>
                      </>
                    ) : (
                      <span className="text-text-muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      <AgingRun />
    </div>
  );
}

/**
 * The daily aging pass, on demand. Safe to repeat — a reminder already sent for an instalment
 * that day is not sent again — but it does default agreements, so it is confirmed first.
 */
function AgingRun() {
  const client = useQueryClient();
  const run = useMutation({
    mutationFn: stylemintCreditApi.runAging,
    onSuccess: () => client.invalidateQueries({ queryKey: ['stylemint-credit'] }),
  });

  const start = async () => {
    const ok = await confirmDialog({
      title: 'Run aging now?',
      message:
        'This marks late instalments overdue, sends due reminders, expires approvals nobody took ' +
        'up and defaults agreements more than 90 days late — exactly what the daily job does at 03:15 UTC. ' +
        'Reminders already sent today are not sent again.',
      confirmText: 'Run aging',
    });
    if (ok) run.mutate();
  };

  return (
    <Section title="Aging" note="Runs by itself every day at 03:15 UTC (09:00 in Kathmandu). Running it here does the same pass now.">
      <div className="flex flex-wrap items-center gap-3 p-3">
        <button
          type="button"
          onClick={start}
          disabled={run.isPending}
          className="flex items-center gap-1.5 rounded-sm border-thin border-border-medium px-3 py-1.5 text-xs font-bold text-text-secondary hover:bg-glass-2 hover:text-text-primary disabled:opacity-50"
        >
          <Play className="h-3.5 w-3.5" strokeWidth={1.6} />
          {run.isPending ? 'Running…' : 'Run aging now'}
        </button>
        {run.data && (
          <p className="text-xs text-text-secondary" role="status">
            {run.data.aged} aged · {run.data.newlyOverdue} newly overdue · {run.data.defaulted} defaulted ·{' '}
            {run.data.expired} approvals expired · {run.data.reminders} reminders
            {run.data.skipped > 0 && (
              <span className="font-bold text-warning"> · {run.data.skipped} skipped, retried tomorrow</span>
            )}
          </p>
        )}
        {run.isError && <ErrorLine message={(run.error as Error).message} />}
      </div>
    </Section>
  );
}

export function Section({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-frame border-thin border-border-subtle bg-bg-card">
      <div className="border-b border-border-subtle px-4 py-3">
        <h2 className="text-sm font-black text-text-primary">{title}</h2>
        {note && <p className="mt-0.5 text-xs text-text-muted">{note}</p>}
      </div>
      {children}
    </section>
  );
}
