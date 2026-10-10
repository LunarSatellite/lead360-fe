import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, Gauge, Loader2, XCircle } from 'lucide-react';
import {
  AgreementState,
  Guarantor,
  InstalmentState,
  stylemintCreditApi,
  type CreditAgreement,
} from '../../api/stylemint-credit.api';
import {
  DECLINE_REASONS,
  GUARANTOR_LABEL,
  KIND_LABEL,
  OUTCOME_LABEL,
  RISK_BAND_LABEL,
  calendarDate,
  factorLabel,
  npr,
  parseFactors,
  parseSignals,
  reasonLabel,
} from '../../lib/credit-console';
import { StateBadge } from './CreditBadges';
import { CreditPlanRefunds } from './CreditPlanRefunds';

/**
 * One agreement, and the decision behind it.
 *
 * The assessment is the record the risk engine wrote when it decided: the score, the factors
 * that moved it, the signals it read and the policy version. It is shown as recorded — the
 * buyer's standing today may differ, and that is the point of keeping it.
 */
export function CreditAgreementDetail({
  agreementId,
  onDecided,
}: {
  agreementId: string;
  onDecided: () => void;
}) {
  const agreement = useQuery({
    queryKey: ['stylemint-credit', 'agreement', agreementId],
    queryFn: () => stylemintCreditApi.agreement(agreementId),
  });
  const assessment = useQuery({
    queryKey: ['stylemint-credit', 'assessment', agreementId],
    queryFn: () => stylemintCreditApi.assessment(agreementId),
  });

  if (agreement.isPending) {
    return (
      <Panel>
        <p className="flex items-center gap-2 text-sm text-text-muted">
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.6} /> Loading agreement…
        </p>
      </Panel>
    );
  }
  if (agreement.isError) {
    return (
      <Panel>
        <ErrorLine message={(agreement.error as Error).message} />
      </Panel>
    );
  }

  const a = agreement.data;
  return (
    <Panel>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black text-text-primary">
            {KIND_LABEL[a.kind]} · {npr(a.price)} over {a.tenureMonths} months
          </p>
          <p className="mt-0.5 font-mono text-[11px] text-text-muted">{a.id}</p>
        </div>
        <StateBadge state={a.state} />
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
        <Fact label="Guaranteed by" value={GUARANTOR_LABEL[a.guarantor]} />
        <Fact label="Down payment" value={npr(a.downPayment)} />
        <Fact label="Financed" value={npr(a.financed)} />
        <Fact label="Interest" value={a.totalInterest ? npr(a.totalInterest) : 'None'} />
        {a.state === AgreementState.Active && (
          <>
            <Fact label="Principal still owed" value={npr(a.outstandingPrincipal)} />
            <Fact
              label="Days past due"
              value={a.daysPastDue ? String(a.daysPastDue) : 'On time'}
              tone={a.daysPastDue ? 'text-danger' : undefined}
            />
          </>
        )}
        <Fact label="Buyer" value={a.buyerAccountId} mono />
        <Fact label="Seller" value={a.vendorAccountId} mono />
        {a.orderId ? (
          <Fact label="Order" value={a.orderId} mono />
        ) : (
          a.state === AgreementState.Approved && (
            <Fact label="Order" value="Not checked out yet" tone="text-text-secondary" />
          )
        )}
        <Fact label="Applied" value={new Date(a.appliedUtc).toLocaleString()} />
        {a.activatedUtc && <Fact label="Started" value={new Date(a.activatedUtc).toLocaleString()} />}
        {a.reversedUtc && <Fact label="Reversed" value={new Date(a.reversedUtc).toLocaleString()} />}
        {a.priceReduced > 0 && <Fact label="Refunded off the price" value={npr(a.priceReduced)} />}
      </dl>

      {a.stateReasons.length > 0 && (
        <div className="mt-4">
          <SectionTitle>Why it is in this state</SectionTitle>
          <ul className="mt-1.5 space-y-1">
            {a.stateReasons.map((code) => (
              <li key={code} className="text-xs text-text-secondary">
                {reasonLabel(code)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {a.state === AgreementState.PendingApproval && (
        <ReviewActions agreement={a} onDecided={onDecided} />
      )}

      <CreditPlanRefunds agreementId={a.id} />

      <div className="mt-5">
        <SectionTitle>Schedule</SectionTitle>
        <div className="mt-1.5 divide-y divide-border-subtle rounded-card border-thin border-border-subtle">
          {a.instalments.map((i) => (
            <div key={i.number} className="flex items-center justify-between px-3 py-1.5 text-xs">
              <span className="text-text-secondary">
                Payment {i.number}
                {i.dueDate ? ` · ${calendarDate(i.dueDate)}` : ' · starts with the plan'}
              </span>
              <span
                className={
                  i.state === InstalmentState.Overdue
                    ? 'font-bold text-danger'
                    : i.state === InstalmentState.Paid
                      ? 'text-success'
                      : 'text-text-primary'
                }
              >
                {i.state === InstalmentState.Paid ? 'Paid' : npr(i.outstanding)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <SectionTitle>
          <Gauge className="h-3.5 w-3.5" strokeWidth={1.6} /> Risk decision
        </SectionTitle>
        {assessment.isPending && <p className="mt-1.5 text-xs text-text-muted">Loading…</p>}
        {assessment.isError && <ErrorLine message={(assessment.error as Error).message} />}
        {assessment.data && (
          <div className="mt-1.5 space-y-3">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
              <Fact
                label="Outcome"
                value={OUTCOME_LABEL[assessment.data.outcome] ?? String(assessment.data.outcome)}
              />
              <Fact
                label="Score"
                value={`${assessment.data.score} · band ${RISK_BAND_LABEL[assessment.data.band] ?? '?'}`}
              />
              <Fact label="Limit at the time" value={npr(assessment.data.creditLimit)} />
              <Fact label="Available at the time" value={npr(assessment.data.availableCredit)} />
              <Fact label="Policy" value={assessment.data.policyVersion} mono />
              <Fact label="Decided" value={new Date(assessment.data.assessedUtc).toLocaleString()} />
            </dl>
            <div className="rounded-card border-thin border-border-subtle">
              {parseFactors(assessment.data.factors).map((f) => (
                <div
                  key={f.code}
                  className="flex justify-between border-b border-border-subtle px-3 py-1 text-xs last:border-b-0"
                >
                  <span className="text-text-secondary">{factorLabel(f.code)}</span>
                  <span className={f.points < 0 ? 'font-bold text-danger' : 'font-bold text-text-primary'}>
                    {f.points > 0 ? `+${f.points}` : f.points}
                  </span>
                </div>
              ))}
            </div>
            <details className="text-xs">
              <summary className="cursor-pointer font-bold text-text-secondary">
                Signals the decision read
              </summary>
              <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
                {parseSignals(assessment.data.signals).map((s) => (
                  <Fact key={s.label} label={s.label} value={s.value} />
                ))}
              </dl>
            </details>
          </div>
        )}
      </div>
    </Panel>
  );
}

function ReviewActions({
  agreement,
  onDecided,
}: {
  agreement: CreditAgreement;
  onDecided: () => void;
}) {
  const [reasons, setReasons] = useState<string[]>([]);
  // One key per decision on this agreement: retrying after a timeout is the same decision.
  const [key] = useState(() => crypto.randomUUID());

  const decide = useMutation({
    mutationFn: (approve: boolean) =>
      stylemintCreditApi.review(agreement.id, { approve, reasons: approve ? [] : reasons }, key),
    onSuccess: onDecided,
  });

  const sellerCarriesRisk = agreement.guarantor === Guarantor.Vendor;

  return (
    <div className="mt-5 rounded-card border-thin border-warning/25 bg-warning-soft p-3">
      <p className="text-xs font-bold text-text-primary">This agreement is waiting for a decision.</p>
      {sellerCarriesRisk && (
        <p className="mt-1 text-xs text-text-secondary">
          The seller carries this risk and normally decides. Approving here commits the seller's
          money on their behalf — do it only when they have asked you to.
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        {DECLINE_REASONS.map((r) => (
          <label key={r.code} className="flex items-center gap-1.5 text-xs text-text-secondary">
            <input
              type="checkbox"
              className="accent-brand"
              checked={reasons.includes(r.code)}
              onChange={(event) =>
                setReasons((current) =>
                  event.target.checked ? [...current, r.code] : current.filter((c) => c !== r.code),
                )
              }
            />
            {r.label}
          </label>
        ))}
      </div>
      {decide.isError && <ErrorLine message={(decide.error as Error).message} />}
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          disabled={decide.isPending}
          onClick={() => decide.mutate(true)}
          className="flex items-center gap-1.5 rounded-sm bg-brand px-3 py-1.5 text-xs font-bold text-bg hover:bg-brand-light disabled:opacity-50"
        >
          <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.6} /> Approve
        </button>
        <button
          type="button"
          disabled={decide.isPending || reasons.length === 0}
          title={reasons.length === 0 ? 'Choose a reason to decline' : undefined}
          onClick={() => decide.mutate(false)}
          className="flex items-center gap-1.5 rounded-sm border-thin border-danger/40 px-3 py-1.5 text-xs font-bold text-danger hover:bg-danger-soft disabled:opacity-50"
        >
          <XCircle className="h-3.5 w-3.5" strokeWidth={1.6} /> Decline
        </button>
      </div>
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <aside className="h-fit rounded-frame border-thin border-border-subtle bg-bg-card p-4">
      {children}
    </aside>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-text-muted">
      {children}
    </p>
  );
}

function Fact({
  label,
  value,
  mono,
  tone,
}: {
  label: string;
  value: string;
  mono?: boolean;
  tone?: string;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-text-muted">{label}</dt>
      <dd className={`truncate font-bold ${tone ?? 'text-text-primary'} ${mono ? 'font-mono text-[11px]' : ''}`}>
        {value}
      </dd>
    </div>
  );
}

export function ErrorLine({ message }: { message: string }) {
  return (
    <p className="mt-2 flex items-start gap-2 text-xs text-danger">
      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={1.6} />
      {message}
    </p>
  );
}
