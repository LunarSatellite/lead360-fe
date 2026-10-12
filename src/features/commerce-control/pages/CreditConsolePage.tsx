import { useQuery, useQueryClient } from '@tanstack/react-query';
import { HandCoins, Loader2, RefreshCw } from 'lucide-react';
import { useUrlFilters } from '@/shared/hooks/useUrlFilters';
import { AgreementState, stylemintCreditApi } from '../api/stylemint-credit.api';
import { CreditAgreementsTab } from '../components/credit/CreditAgreementsTab';
import { ErrorLine } from '../components/credit/CreditAgreementDetail';
import { CreditBookTab } from '../components/credit/CreditBookTab';
import { CreditHeldPaymentsTab } from '../components/credit/CreditHeldPaymentsTab';
import { CreditReserveTab } from '../components/credit/CreditReserveTab';
import { bookTotals, npr, percent } from '../lib/credit-console';

const TABS = [
  { id: 'agreements', label: 'Agreements' },
  { id: 'book', label: 'Book & delinquency' },
  { id: 'reserve', label: 'Guarantee reserve' },
  { id: 'held', label: 'Held payments' },
] as const;
type TabId = (typeof TABS)[number]['id'];

/**
 * Credit and risk for Stylemint's payment plans — EMI, pay later and pay-now-buy-later.
 *
 * The headline figures are the database's sums over the whole book, not totals over a page of
 * rows, so they stay right however large the book grows. Every action here is the backend's to
 * permit: reads need SuperAdmin, PayoutsOps or Readonly; decisions need SuperAdmin or PayoutsOps;
 * reserve capital and aging need SuperAdmin.
 */
export function CreditConsolePage() {
  const client = useQueryClient();
  // `state` is the agreements tab's filter too: the banner below opens that tab pre-filtered.
  const [filters, setFilters] = useUrlFilters({ tab: 'agreements' as string, state: 0 });
  const tab: TabId = TABS.some((t) => t.id === filters.tab) ? (filters.tab as TabId) : 'agreements';

  const portfolio = useQuery({
    queryKey: ['stylemint-credit', 'portfolio'],
    queryFn: stylemintCreditApi.portfolio,
  });
  const reserve = useQuery({
    queryKey: ['stylemint-credit', 'reserve'],
    queryFn: stylemintCreditApi.reserve,
  });

  const totals = portfolio.data ? bookTotals(portfolio.data) : null;
  const fetching = portfolio.isFetching || reserve.isFetching;

  return (
    <div className="mx-auto max-w-[1500px] space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-brand">
            Stylemint payment plans
          </p>
          <h1 className="mt-2 flex items-center gap-2 text-2xl font-black tracking-tight text-text-primary">
            <HandCoins className="h-5 w-5 text-brand" strokeWidth={1.6} />
            Credit & risk
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            What buyers owe, how late it is, what stands behind StyleMint's guarantee, and the
            decisions behind every plan.
          </p>
        </div>
        <button
          type="button"
          onClick={() => client.invalidateQueries({ queryKey: ['stylemint-credit'] })}
          className="flex items-center gap-2 rounded-card border-thin border-border-subtle px-3 py-2 text-xs font-bold text-text-secondary hover:text-brand"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${fetching ? 'animate-spin' : ''}`} strokeWidth={1.6} />
          Refresh
        </button>
      </div>

      {portfolio.isError && <ErrorLine message={(portfolio.error as Error).message} />}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card
          label="Owed by buyers"
          value={totals ? npr(totals.owed) : undefined}
          note={totals ? `${totals.runningCount} running plan${totals.runningCount === 1 ? '' : 's'}` : undefined}
        />
        <Card
          label="Past due"
          value={totals ? npr(totals.late) : undefined}
          note={
            totals
              ? `${totals.lateCount} plan${totals.lateCount === 1 ? '' : 's'}` +
                (percent(totals.late, totals.owed) ? ` · ${percent(totals.late, totals.owed)} of owed` : '')
              : undefined
          }
          tone={totals && totals.late > 0 ? 'text-danger' : undefined}
          onClick={() => setFilters({ tab: 'book' })}
        />
        <Card
          label="Guarantee reserve"
          value={reserve.data ? npr(reserve.data.reserveBalance) : undefined}
          note={
            reserve.data
              ? reserve.data.coverageRatio === null
                ? 'Nothing guaranteed yet'
                : `${(reserve.data.coverageRatio * 100).toFixed(1)}% coverage · minimum ${(reserve.data.minimumCoverageRatio * 100).toFixed(0)}%`
              : reserve.isError
                ? (reserve.error as Error).message
                : undefined
          }
          tone={
            reserve.data?.coverageRatio != null &&
            reserve.data.coverageRatio < reserve.data.minimumCoverageRatio
              ? 'text-danger'
              : undefined
          }
          onClick={() => setFilters({ tab: 'reserve' })}
        />
        <Card
          label="Held payments"
          value={portfolio.data ? npr(portfolio.data.unappliedPaymentAmount) : undefined}
          note={
            portfolio.data
              ? `${portfolio.data.unappliedPaymentCount} to return to buyers`
              : undefined
          }
          tone={portfolio.data && portfolio.data.unappliedPaymentCount > 0 ? 'text-warning' : undefined}
          onClick={() => setFilters({ tab: 'held' })}
        />
      </div>

      {totals && totals.awaitingDecision > 0 && (
        <button
          type="button"
          onClick={() => setFilters({ tab: 'agreements', state: AgreementState.PendingApproval })}
          className="w-full rounded-frame border-thin border-warning/25 bg-warning-soft px-4 py-2.5 text-left text-xs font-bold text-text-primary hover:border-warning/40"
        >
          {totals.awaitingDecision} plan{totals.awaitingDecision === 1 ? ' is' : 's are'} waiting
          for a decision — most are the seller's to make.
        </button>
      )}

      <nav className="flex flex-wrap gap-1.5" aria-label="Credit console sections">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setFilters({ tab: t.id })}
            aria-current={tab === t.id ? 'page' : undefined}
            className={`rounded-sm border-thin px-3 py-1.5 text-xs font-bold ${
              tab === t.id
                ? 'border-border-glow bg-brand-soft text-brand'
                : 'border-border-subtle text-text-secondary hover:bg-glass-2 hover:text-text-primary'
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === 'agreements' && <CreditAgreementsTab />}
      {tab === 'book' && (portfolio.data ? <CreditBookTab portfolio={portfolio.data} /> : <Loading />)}
      {tab === 'reserve' &&
        (reserve.data ? (
          <CreditReserveTab reserve={reserve.data} />
        ) : reserve.isError ? (
          <ErrorLine message={(reserve.error as Error).message} />
        ) : (
          <Loading />
        ))}
      {tab === 'held' && <CreditHeldPaymentsTab />}
    </div>
  );
}

function Card({
  label,
  value,
  note,
  tone,
  onClick,
}: {
  label: string;
  /** Undefined while loading: a figure that has not arrived is not shown as zero. */
  value?: string;
  note?: string;
  tone?: string;
  onClick?: () => void;
}) {
  const body = (
    <>
      <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-text-muted">{label}</p>
      <p className={`mt-1.5 text-xl font-black ${tone ?? 'text-text-primary'}`}>{value ?? '…'}</p>
      {note && <p className="mt-0.5 text-xs text-text-muted">{note}</p>}
    </>
  );
  const className =
    'rounded-card border-thin border-border-subtle bg-glass-1 p-3.5 text-left';
  return onClick ? (
    <button type="button" onClick={onClick} className={`${className} hover:border-border-medium hover:bg-glass-2`}>
      {body}
    </button>
  ) : (
    <div className={className}>{body}</div>
  );
}

function Loading() {
  return (
    <p className="flex items-center gap-2 rounded-frame border-thin border-border-subtle bg-bg-card p-6 text-sm text-text-muted">
      <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.6} /> Loading…
    </p>
  );
}

export { CreditConsolePage as Component };
