import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Landmark } from 'lucide-react';
import { confirmDialog } from '@/shared/ui/confirm';
import { stylemintCreditApi, type ReserveSummary } from '../../api/stylemint-credit.api';
import { npr } from '../../lib/credit-console';
import { ErrorLine } from './CreditAgreementDetail';
import { Section } from './CreditBookTab';

/**
 * The guarantee reserve: what stands behind every pay-later plan StyleMint guarantees.
 *
 * A new plan is approved only while the reserve covers at least the minimum share of everything
 * guaranteed, so headroom is the most new principal that could be approved right now.
 */
export function CreditReserveTab({ reserve }: { reserve: ReserveSummary }) {
  const coverageShort =
    reserve.coverageRatio !== null && reserve.coverageRatio < reserve.minimumCoverageRatio;

  return (
    <div className="space-y-4">
      {!reserve.platformGuaranteeEnabled && (
        <p className="rounded-frame border-thin border-info/25 bg-info-soft p-3 text-xs text-text-secondary">
          StyleMint's guarantee is switched off (<span className="font-mono">Credit:Risk:PlatformGuaranteeEnabled</span>),
          so no new pay-later plan is approved whatever the reserve holds.
        </p>
      )}

      <Section title="Guarantee reserve">
        <dl className="grid gap-x-6 gap-y-3 p-4 text-xs sm:grid-cols-3">
          <Figure label="In the reserve" value={npr(reserve.reserveBalance)} />
          <Figure label="Guaranteed and still owed" value={npr(reserve.guaranteedOutstanding)} />
          <Figure
            label="Coverage"
            value={
              reserve.coverageRatio === null
                ? 'Nothing guaranteed'
                : `${(reserve.coverageRatio * 100).toFixed(1)}%`
            }
            note={`Minimum ${(reserve.minimumCoverageRatio * 100).toFixed(0)}%`}
            tone={coverageShort ? 'text-danger' : undefined}
          />
          <Figure label="Room for new guarantees" value={npr(reserve.guaranteeHeadroom)} />
          <Figure label="Written off to date" value={npr(reserve.writtenOffToDate)} />
          <Figure label="Risk fee charged to sellers" value={`${reserve.riskFeePercent}%`} />
        </dl>
      </Section>

      <AddCapital />
    </div>
  );
}

/**
 * Records capital paid into the reserve. The movement id is made once per entry and reused on
 * retry, so a resubmission after a timeout records the movement once; the same id with a
 * different amount is refused by the server rather than taken as done.
 */
function AddCapital() {
  const client = useQueryClient();
  const [amount, setAmount] = useState('');
  const [movementId, setMovementId] = useState(() => crypto.randomUUID());

  const add = useMutation({
    mutationFn: (value: number) => stylemintCreditApi.addCapital(value, movementId),
    onSuccess: () => {
      setAmount('');
      setMovementId(crypto.randomUUID());
      client.invalidateQueries({ queryKey: ['stylemint-credit'] });
    },
  });

  const value = Number(amount);
  const valid = amount.trim() !== '' && Number.isFinite(value) && value > 0 && Math.round(value * 100) === value * 100;

  const submit = async () => {
    const ok = await confirmDialog({
      title: 'Record reserve capital?',
      message:
        `Record ${npr(value)} paid into the guarantee reserve. Record it only once the money has ` +
        'actually arrived in the reserve account — this entry is permanent in the ledger.',
      confirmText: 'Record capital',
    });
    if (ok) add.mutate(value);
  };

  return (
    <Section
      title="Record capital"
      note="Super-administrators only. Each entry is a ledger movement with its own id."
    >
      <div className="flex flex-wrap items-end gap-3 p-4">
        <label className="flex flex-col gap-1 text-xs font-bold text-text-secondary">
          Amount (NPR)
          <input
            inputMode="decimal"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="100000"
            className="w-48 rounded-sm border-thin border-border-subtle bg-bg-input px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-border-glow focus:bg-glass-1 focus:outline-none"
          />
        </label>
        <button
          type="button"
          onClick={submit}
          disabled={!valid || add.isPending}
          className="flex items-center gap-1.5 rounded-sm bg-brand px-3 py-2 text-xs font-bold text-bg hover:bg-brand-light disabled:opacity-50"
        >
          <Landmark className="h-3.5 w-3.5" strokeWidth={1.6} />
          {add.isPending ? 'Recording…' : 'Record capital'}
        </button>
        <p className="w-full font-mono text-[10px] text-text-muted">Movement {movementId}</p>
        {add.isSuccess && (
          <p className="w-full text-xs text-success" role="status">
            Recorded. The reserve now holds {npr(add.data.reserveBalance)}.
          </p>
        )}
        {add.isError && <ErrorLine message={(add.error as Error).message} />}
      </div>
    </Section>
  );
}

function Figure({
  label,
  value,
  note,
  tone,
}: {
  label: string;
  value: string;
  note?: string;
  tone?: string;
}) {
  return (
    <div>
      <dt className="text-text-muted">{label}</dt>
      <dd className={`mt-0.5 text-lg font-black ${tone ?? 'text-text-primary'}`}>{value}</dd>
      {note && <dd className="text-[11px] text-text-muted">{note}</dd>}
    </div>
  );
}
