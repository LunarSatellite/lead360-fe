import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { useUrlFilters } from '@/shared/hooks/useUrlFilters';
import {
  AgreementKind,
  AgreementState,
  CREDIT_LIST_LIMIT,
  Guarantor,
  stylemintCreditApi,
  type AgreementKindValue,
  type AgreementStateValue,
  type CreditAgreement,
  type GuarantorValue,
} from '../../api/stylemint-credit.api';
import { GUARANTOR_LABEL, KIND_LABEL, STATE_LABEL, npr, shortId } from '../../lib/credit-console';
import { CreditAgreementDetail, ErrorLine } from './CreditAgreementDetail';
import { KindBadge, StateBadge } from './CreditBadges';

/**
 * Agreements, newest first, filtered by state, kind and guarantor — all held in the URL, so a
 * link from a summary card or a colleague arrives already filtered. The selected agreement is in
 * the URL too.
 */
export function CreditAgreementsTab() {
  const client = useQueryClient();
  const [filters, setFilters] = useUrlFilters({ state: 0, kind: 0, guarantor: 0, agreement: '' });

  const list = useQuery({
    queryKey: ['stylemint-credit', 'agreements', filters.state, filters.kind, filters.guarantor],
    queryFn: () =>
      stylemintCreditApi.agreements({
        state: (filters.state || undefined) as AgreementStateValue | undefined,
        kind: (filters.kind || undefined) as AgreementKindValue | undefined,
        guarantor: (filters.guarantor || undefined) as GuarantorValue | undefined,
      }),
  });

  const rows = list.data ?? [];
  const capped = rows.length >= CREDIT_LIST_LIMIT;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 rounded-frame border-thin border-border-subtle bg-bg-card p-3">
        <Select
          label="State"
          value={filters.state}
          onChange={(state) => setFilters({ state, agreement: '' })}
          options={Object.entries(STATE_LABEL).map(([value, label]) => ({ value: Number(value), label }))}
        />
        <Select
          label="Kind"
          value={filters.kind}
          onChange={(kind) => setFilters({ kind, agreement: '' })}
          options={Object.values(AgreementKind).map((value) => ({ value, label: KIND_LABEL[value] }))}
        />
        <Select
          label="Guaranteed by"
          value={filters.guarantor}
          onChange={(guarantor) => setFilters({ guarantor, agreement: '' })}
          options={Object.values(Guarantor).map((value) => ({ value, label: GUARANTOR_LABEL[value] }))}
        />
        <span className="ml-auto text-xs font-bold text-text-muted">
          {list.data
            ? capped
              ? `Newest ${rows.length} — narrow the filters to see older`
              : `${rows.length} agreement${rows.length === 1 ? '' : 's'}`
            : 'Loading…'}
        </span>
      </div>

      {list.isError && <ErrorLine message={(list.error as Error).message} />}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_440px]">
        <div className="overflow-hidden rounded-frame border-thin border-border-subtle bg-bg-card">
          {list.isPending && (
            <p className="flex items-center gap-2 p-6 text-sm text-text-muted">
              <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.6} /> Loading agreements…
            </p>
          )}
          {rows.map((a) => (
            <Row
              key={a.id}
              agreement={a}
              active={filters.agreement === a.id}
              onClick={() => setFilters({ agreement: a.id })}
            />
          ))}
          {list.isSuccess && rows.length === 0 && (
            <div className="p-10 text-center">
              <CheckCircle2 className="mx-auto h-8 w-8 text-success" strokeWidth={1.6} />
              <p className="mt-3 text-sm font-bold text-text-primary">No agreements here</p>
              <p className="mt-1 text-xs text-text-muted">Nothing matches these filters.</p>
            </div>
          )}
        </div>

        {filters.agreement ? (
          <CreditAgreementDetail
            key={filters.agreement}
            agreementId={filters.agreement}
            onDecided={() => client.invalidateQueries({ queryKey: ['stylemint-credit'] })}
          />
        ) : (
          <aside className="h-fit rounded-frame border-thin border-border-subtle bg-bg-card p-6 text-center text-xs text-text-muted">
            Choose an agreement to see its schedule and the risk decision behind it.
          </aside>
        )}
      </div>
    </div>
  );
}

function Row({
  agreement: a,
  active,
  onClick,
}: {
  agreement: CreditAgreement;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'true' : undefined}
      className={`flex w-full items-center gap-3 border-b border-border-subtle px-4 py-3 text-left last:border-b-0 hover:bg-bg-elevated ${
        active ? 'bg-brand-soft' : ''
      }`}
    >
      <KindBadge kind={a.kind} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-text-primary">
          {npr(a.price)} · {a.tenureMonths} months · {GUARANTOR_LABEL[a.guarantor]}
        </p>
        <p className="mt-0.5 text-[11px] text-text-muted">
          <span className="font-mono">{shortId(a.buyerAccountId)}</span>
          {' · applied '}
          {new Date(a.appliedUtc).toLocaleDateString()}
          {a.state === AgreementState.Active && a.daysPastDue > 0 && (
            <span className="font-bold text-danger"> · {a.daysPastDue} days late</span>
          )}
        </p>
      </div>
      <StateBadge state={a.state} />
    </button>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  options: { value: number; label: string }[];
}) {
  return (
    <label className="flex items-center gap-2 text-xs font-bold text-text-secondary">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="rounded-card border-thin border-border-subtle bg-bg-elevated px-2 py-1.5 text-xs text-text-primary outline-none focus:border-border-glow"
      >
        <option value={0}>Any</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
