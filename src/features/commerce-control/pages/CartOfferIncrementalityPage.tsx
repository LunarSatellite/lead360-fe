import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, FlaskConical, Loader2, RefreshCw, Scale as ScaleIcon } from 'lucide-react';
import {
  CART_OFFER_ARM,
  formatCount,
  formatPercent,
  formatPoints,
  stylemintCartOffersApi,
  type CartOfferArm,
  type CartOfferIncrementalityReadout,
  type CartOfferUpliftInterval,
} from '../api/stylemint-cart-offers.api';

/**
 * Cart offer incrementality — what the holdout actually recorded.
 *
 * About one shopper in ten never sees a cart offer. This page exists so that decision can be
 * checked rather than assumed: it shows each arm's recorded observations and conversions, and the
 * difference between them only when the counts support stating one.
 *
 * Three rules shape every element here, because the page is a measurement claim:
 *
 *  1. A difference is never shown without the interval around it. The interval is the headline;
 *     the point estimate reads as one number inside the sentence, never as a figure on its own.
 *  2. An arm nothing was recorded for renders as "not recorded", not as zero. A measured zero is
 *     a finding; an absent count is not.
 *  3. When the readout declines to compare, the page says so as loudly as it would say anything
 *     else. Silence below the minimum is the correct answer, not a loading state.
 *
 * Read-only: nothing on this page can change an offer.
 */

const WINDOWS = [7, 30, 90] as const;

export function CartOfferIncrementalityPage() {
  const [days, setDays] = useState<number>(30);

  const readout = useQuery({
    queryKey: ['stylemint-cart-offer-incrementality', days],
    queryFn: () => stylemintCartOffersApi.incrementality(days),
  });

  return (
    <div className="mx-auto max-w-[1100px] space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-brand">
            Stylemint commerce platform
          </p>
          <h1 className="mt-2 flex items-center gap-2 text-2xl font-black tracking-tight text-text-primary">
            <FlaskConical className="h-5 w-5 text-brand" strokeWidth={1.6} />
            Cart offer incrementality
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            One shopper in ten never sees a cart offer. This is what the two groups recorded — and
            nothing more than the counts support.
          </p>
        </div>
        <button
          onClick={() => readout.refetch()}
          className="flex items-center gap-2 self-start rounded-card border-thin border-border-subtle px-3 py-2 text-xs font-bold text-text-secondary hover:text-brand"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${readout.isFetching ? 'animate-spin' : ''}`}
            strokeWidth={1.6}
          />
          Refresh
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {WINDOWS.map((value) => (
          <button
            key={value}
            onClick={() => setDays(value)}
            className={`rounded-sm border-thin px-3 py-1.5 text-xs font-bold ${
              days === value
                ? 'border-border-glow bg-brand-soft text-brand'
                : 'border-border-subtle text-text-secondary hover:bg-glass-2 hover:text-text-primary'
            }`}
          >
            Last {value} days
          </button>
        ))}
      </div>

      {readout.isError && (
        <div className="flex items-start gap-3 rounded-frame border-thin border-rose-400/25 bg-rose-400/5 p-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" strokeWidth={1.6} />
          <p className="text-sm text-text-secondary">{(readout.error as Error).message}</p>
        </div>
      )}

      {readout.isLoading ? (
        <div className="flex items-center gap-3 rounded-frame border-thin border-border-subtle bg-bg-card p-8 text-sm text-text-muted">
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.6} /> Reading the holdout…
        </div>
      ) : readout.data ? (
        <Readout data={readout.data} />
      ) : null}
    </div>
  );
}

function Readout({ data }: { data: CartOfferIncrementalityReadout }) {
  const control = data.arms.find((a) => a.armCode === CART_OFFER_ARM.control);
  const treatment = data.arms.find((a) => a.armCode === CART_OFFER_ARM.treatment);

  return (
    <div className="space-y-4">
      {/* The sentence the backend composed, verbatim. It is the finding; everything
          below it is the working. */}
      <div className="rounded-frame border-thin border-border-subtle bg-bg-card p-5">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-text-muted">
          What the recorded data supports
        </p>
        <p className="mt-2 text-sm leading-relaxed text-text-primary" data-testid="statement">
          {data.statement}
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {control && <ArmCard arm={control} minimum={data.minimumObservationsPerArm} />}
        {treatment && <ArmCard arm={treatment} minimum={data.minimumObservationsPerArm} />}
      </div>

      {data.uplift ? (
        <UpliftCard uplift={data.uplift} />
      ) : (
        <NoComparisonCard minimum={data.minimumObservationsPerArm} />
      )}

      <div className="rounded-frame border-thin border-border-subtle bg-glass-2 p-5">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-text-muted">
          What this is not
        </p>
        <ul className="mt-2 space-y-1.5">
          {data.caveats.map((caveat) => (
            <li key={caveat} className="flex gap-2 text-xs leading-relaxed text-text-secondary">
              <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-text-muted" />
              {caveat}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[11px] text-text-muted">
          Window {new Date(data.windowFromUtc).toLocaleDateString()} to{' '}
          {new Date(data.windowToUtc).toLocaleDateString()} · conversion horizon{' '}
          {data.conversionHorizonHours} h · minimum {data.minimumObservationsPerArm} observations
          per arm.
        </p>
      </div>
    </div>
  );
}

/**
 * One arm. An arm with nothing recorded says so in words — rendering 0 here would turn
 * "never observed" into "observed and converted nobody", which is a different claim.
 */
function ArmCard({ arm, minimum }: { arm: CartOfferArm; minimum: number }) {
  return (
    <div
      className="rounded-frame border-thin border-border-subtle bg-bg-card p-5"
      data-testid={`arm-${arm.armCode}`}
    >
      <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-text-muted">
        {arm.armLabel}
      </p>

      {arm.hasObservations ? (
        <>
          <p className="mt-3 text-2xl font-black tracking-tight text-text-primary">
            {formatPercent(arm.conversionPercent)}
          </p>
          <p className="mt-1 text-xs text-text-secondary">
            {formatCount(arm.conversions)} of {arm.observations.toLocaleString()} observations
            converted
          </p>
          {!arm.meetsMinimumObservations && (
            <p className="mt-3 rounded-sm border-thin border-amber-400/25 bg-amber-400/5 px-2.5 py-1.5 text-[11px] font-bold text-amber-300">
              Below the {minimum}-observation minimum — counted, not compared.
            </p>
          )}
        </>
      ) : (
        <>
          <p className="mt-3 text-2xl font-black tracking-tight text-text-muted">Not recorded</p>
          <p className="mt-1 text-xs text-text-secondary">
            No observations in this window, so there is no conversion count to show. This is an
            absence of measurement, not a zero.
          </p>
        </>
      )}
    </div>
  );
}

/**
 * The difference, and it never appears without its bounds. The interval is drawn first and read
 * first; the point estimate lives inside the sentence beneath it.
 */
function UpliftCard({ uplift }: { uplift: CartOfferUpliftInterval }) {
  const span = Math.max(
    Math.abs(uplift.lowerBoundPercentagePoints),
    Math.abs(uplift.upperBoundPercentagePoints),
    0.5,
  );
  const toPercent = (points: number) => ((points + span) / (2 * span)) * 100;
  const left = toPercent(uplift.lowerBoundPercentagePoints);
  const right = toPercent(uplift.upperBoundPercentagePoints);

  return (
    <div
      className="rounded-frame border-thin border-border-glow bg-brand-soft p-5"
      data-testid="uplift"
    >
      <p className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-brand">
        <ScaleIcon className="h-3.5 w-3.5" strokeWidth={1.8} />
        Difference between the arms, with its interval
      </p>

      <p className="mt-3 text-sm font-bold text-text-primary">
        {formatPoints(uplift.pointEstimatePercentagePoints)}, {uplift.intervalCoveragePercent}%
        interval {formatPoints(uplift.lowerBoundPercentagePoints)} to{' '}
        {formatPoints(uplift.upperBoundPercentagePoints)}
      </p>

      {/* The interval drawn against zero. Where it sits relative to the zero line is the
          whole reading — a bar that crosses it has not shown an effect. */}
      <div className="relative mt-4 h-8">
        <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border-subtle" />
        <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-text-muted" />
        <div
          className={`absolute top-1/2 h-2 -translate-y-1/2 rounded-full ${
            uplift.intervalSpansZero ? 'bg-amber-400/50' : 'bg-brand'
          }`}
          style={{ left: `${left}%`, width: `${Math.max(right - left, 0.5)}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] font-bold text-text-muted">
        <span>{formatPoints(-span)}</span>
        <span>0</span>
        <span>{formatPoints(span)}</span>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-text-secondary">
        {uplift.intervalSpansZero
          ? 'The interval includes zero: these counts are consistent with the offers having made no difference at all.'
          : 'The interval does not include zero over this window.'}
      </p>
      <p className="mt-2 text-[11px] text-text-muted">
        {uplift.basis} {uplift.method}
      </p>
    </div>
  );
}

/**
 * Shown whenever the readout declines to compare. This is the normal state of a young
 * experiment, and it is presented as an answer rather than as a failure.
 */
function NoComparisonCard({ minimum }: { minimum: number }) {
  return (
    <div
      className="rounded-frame border-thin border-border-subtle bg-glass-2 p-5"
      data-testid="no-comparison"
    >
      <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-text-muted">
        No difference is stated
      </p>
      <p className="mt-2 text-sm leading-relaxed text-text-secondary">
        Either an arm has fewer than {minimum} recorded observations, or an arm has too few
        conversions for an interval around the difference to mean anything. The counts above are
        recorded facts and stand on their own; a difference drawn from them would not be.
      </p>
    </div>
  );
}

export { CartOfferIncrementalityPage as Component };
