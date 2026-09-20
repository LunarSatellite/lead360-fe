import { GitCompareArrows, HelpCircle, Microscope } from 'lucide-react';
import type { ConsistentWithDto } from '../types/intelligence.types';

/**
 * A hypothesis, rendered as a hypothesis.
 *
 * The server words every one of these as "Consistent with…" and ships three
 * companions with it: the observation it rests on, the rival explanation the
 * same observation also fits, and the check that would tell the two apart.
 *
 * Rendering `statement` alone would silently promote a hypothesis to a
 * finding — the reader would see a cause where the server offered a
 * candidate. So this component requires all four fields and gives the rival
 * explanation the same visual weight as the headline. There is no "confidence",
 * no ranking and no "most likely" here, because the server ships none.
 */
export function ConsistentWithCard({
  hypothesis,
  testId,
}: {
  hypothesis: ConsistentWithDto;
  testId?: string;
}) {
  return (
    <li
      data-testid={testId ?? 'consistent-with'}
      className="flex flex-col gap-2.5 rounded-card border-thin border-border-medium bg-glass-1 p-3.5"
    >
      <p className="flex items-start gap-2 text-sm font-bold leading-relaxed text-text-primary">
        <Microscope size={15} strokeWidth={1.8} className="mt-0.5 shrink-0 text-brand" />
        {hypothesis.statement}
      </p>

      <div className="flex flex-col gap-0.5 border-l-2 border-border-medium pl-2.5">
        <span className="text-2xs font-bold uppercase tracking-wide text-text-muted">
          Observed basis
        </span>
        <p className="text-xs font-medium leading-relaxed text-text-secondary">
          {hypothesis.observedBasis}
        </p>
      </div>

      <div
        data-testid="also-consistent-with"
        className="flex flex-col gap-0.5 rounded-sm border-thin border-warning/40 bg-warning-soft px-2.5 py-2"
      >
        <span className="flex items-center gap-1.5 text-2xs font-bold uppercase tracking-wide text-warning">
          <GitCompareArrows size={11} strokeWidth={2} />
          The same observation is also consistent with
        </span>
        <p className="text-xs font-medium leading-relaxed text-text-secondary">
          {hypothesis.alsoConsistentWith}
        </p>
      </div>

      <div
        data-testid="what-would-distinguish"
        className="flex flex-col gap-0.5 rounded-sm border-thin border-info/40 bg-info-soft px-2.5 py-2"
      >
        <span className="flex items-center gap-1.5 text-2xs font-bold uppercase tracking-wide text-info">
          <HelpCircle size={11} strokeWidth={2} />
          What would distinguish them
        </span>
        <p className="text-xs font-medium leading-relaxed text-text-secondary">
          {hypothesis.whatWouldDistinguish}
        </p>
      </div>
    </li>
  );
}

/**
 * The list, including the case where the server sent none.
 *
 * `consistentWith: []` on thin evidence is the server declining to speculate.
 * That is a result and it is printed as one — not as an empty area that reads
 * like a component failed to load.
 */
export function ConsistentWithList({
  items,
  emptyReason,
  testId,
}: {
  items: ConsistentWithDto[];
  emptyReason: string;
  testId?: string;
}) {
  if (items.length === 0) {
    return (
      <p
        data-testid={testId ?? 'consistent-with-empty'}
        data-absent="NoHypothesisOffered"
        className="rounded-card border-thin border-dashed border-border-medium bg-glass-1 p-3.5 text-xs font-medium leading-relaxed text-text-secondary"
      >
        <span className="font-mono text-2xs font-black uppercase tracking-wide text-text-muted">
          NoHypothesisOffered
        </span>
        <br />
        {emptyReason}
      </p>
    );
  }
  return (
    <ul data-testid={testId} className="flex flex-col gap-2.5">
      {items.map((hypothesis) => (
        <ConsistentWithCard key={hypothesis.statement} hypothesis={hypothesis} />
      ))}
    </ul>
  );
}
