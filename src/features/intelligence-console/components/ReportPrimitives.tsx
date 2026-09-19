import type { ReactNode } from 'react';
import { CircleSlash, Info } from 'lucide-react';
import type {
  CountedFigureDto,
  MoneyBucketDto,
  MoneyFigureDto,
  ObservedShareDto,
  PeriodDto,
} from '../types/intelligence.types';

/**
 * The rendering primitives every intelligence surface is built from.
 *
 * These five surfaces exist to report honestly, including when the honest
 * answer is "we cannot tell you". Three rules are enforced *here* rather than
 * left to each page, because a rule restated five times is a rule broken once:
 *
 * - **Absent is not zero.** `Absent` is the only way to render a missing value,
 *   and it renders the server's own word for the absence — `OptionsNotRecorded`,
 *   `OutcomeNotMeasured`, `OwnerNotAssigned`. It never emits `0`, and it never
 *   emits a bare dash, because a dash in a column of numbers reads as a result.
 * - **Every figure states its window and denominator.** `CountedFigure` and
 *   `ShareFigure` take the period and the denominator meaning as required
 *   props. A count cannot be rendered through them without its period.
 * - **Nothing is computed.** There is no sum, no ratio and no score in this
 *   file. `ShareFigure` prints the server's `percentOfDenominator` and prints
 *   "not computable" when the server sent `null` — it does not divide
 *   `observed` by `denominator` to fill the gap.
 */

// ── Absence ─────────────────────────────────────────────────────────────────

/**
 * A value that is not there, rendered as the specific absence it is.
 *
 * `state` is the server's own token. It is shown verbatim, in the monospace
 * face the rest of the console reserves for server vocabulary, so that an
 * operator reading `OutcomeNotMeasured` on screen can search the API for the
 * same string. `meaning` is the server's note when it sent one.
 */
export function Absent({
  state,
  meaning,
  testId,
}: {
  state: string;
  meaning?: string | null;
  testId?: string;
}) {
  return (
    <span
      data-testid={testId}
      data-absent={state}
      className="inline-flex max-w-full flex-col gap-0.5 align-top"
    >
      <span className="inline-flex items-center gap-1.5 rounded-xs border-thin border-dashed border-border-medium bg-glass-1 px-2 py-1 font-mono text-2xs font-bold uppercase tracking-wide text-text-muted">
        <CircleSlash size={11} strokeWidth={1.8} className="shrink-0" />
        {state}
      </span>
      {meaning ? (
        <span className="text-2xs font-medium leading-relaxed text-text-muted">{meaning}</span>
      ) : null}
    </span>
  );
}

/**
 * Renders `value` when the server sent one, and the named absence when it did
 * not. Every nullable field on these surfaces goes through this, so no page
 * can quietly turn a `null` into a `0` or an empty cell.
 */
export function ValueOrAbsent({
  value,
  state,
  meaning,
  testId,
  children,
}: {
  value: unknown;
  state: string;
  meaning?: string | null;
  testId?: string;
  children: ReactNode;
}) {
  if (value === null || value === undefined || value === '') {
    return <Absent state={state} meaning={meaning} testId={testId} />;
  }
  return <>{children}</>;
}

// ── Windows and denominators ────────────────────────────────────────────────

const utc = (iso: string) => {
  const parsed = Date.parse(iso);
  if (Number.isNaN(parsed)) return iso;
  return new Date(parsed).toISOString().replace('T', ' ').slice(0, 16) + 'Z';
};

/** The window a figure covers. Never optional — a count without a period is a claim without a scope. */
export function WindowNote({
  period,
  source,
  testId,
}: {
  period: PeriodDto | { fromUtc: string; toUtc: string; days?: number; label?: string };
  source?: string;
  testId?: string;
}) {
  const label = 'label' in period && period.label ? period.label : undefined;
  const days = 'days' in period ? period.days : undefined;
  return (
    <span
      data-testid={testId}
      className="block text-2xs font-medium leading-relaxed text-text-muted"
    >
      <span className="font-bold text-text-secondary">
        {label ?? (days !== undefined ? `Last ${days} days` : 'Window')}
      </span>{' '}
      · {utc(period.fromUtc)} → {utc(period.toUtc)}
      {source ? <> · source: {source}</> : null}
    </span>
  );
}

/**
 * One `CountedFigureDto`, with the window and source the server attached to it.
 *
 * The count is shown large; the period is shown beneath it and is not
 * optional. `emphasis` changes weight only — it never changes the number and
 * never implies good or bad.
 */
export function CountedFigure({
  figure,
  emphasis = 'normal',
  testId,
}: {
  figure: CountedFigureDto;
  emphasis?: 'normal' | 'finding';
  testId?: string;
}) {
  return (
    <div
      data-testid={testId}
      data-count={figure.count}
      className={`flex flex-col gap-1 rounded-card border-thin p-3 ${
        emphasis === 'finding'
          ? 'border-warning/40 bg-warning-soft'
          : 'border-border-subtle bg-bg-card'
      }`}
    >
      <span className="text-2xs font-bold uppercase tracking-wide text-text-muted">
        {figure.label}
      </span>
      <span
        className={`font-mono text-2xl font-black tabular-nums ${
          emphasis === 'finding' ? 'text-warning' : 'text-text-primary'
        }`}
      >
        {figure.count.toLocaleString('en-US')}
      </span>
      <WindowNote period={figure.period} source={figure.source} />
    </div>
  );
}

/**
 * A numerator over the denominator it was read against.
 *
 * `percentOfDenominator` comes from the server and may be `null` — that null
 * means the server declined to divide (a zero denominator, typically), and it
 * prints as `PercentNotComputable`. Dividing here to produce a friendlier
 * number would be inventing a statistic the platform does not hold.
 */
export function ShareFigure({ share, testId }: { share: ObservedShareDto; testId?: string }) {
  return (
    <div
      data-testid={testId}
      className="flex flex-col gap-1 rounded-card border-thin border-border-subtle bg-bg-card p-3"
    >
      <span className="font-mono text-lg font-black tabular-nums text-text-primary">
        {share.observed.toLocaleString('en-US')}{' '}
        <span className="text-sm font-bold text-text-muted">
          of {share.denominator.toLocaleString('en-US')}
        </span>
      </span>
      <span className="text-2xs font-medium leading-relaxed text-text-secondary">
        Denominator: {share.denominatorMeaning}
      </span>
      {share.percentOfDenominator === null ? (
        <Absent
          state="PercentNotComputable"
          meaning="The server did not divide these two numbers, and this console does not divide them for it."
        />
      ) : (
        <span className="font-mono text-2xs font-bold text-text-secondary">
          {share.percentOfDenominator}% of denominator (computed by the server)
        </span>
      )}
    </div>
  );
}

// ── Money ───────────────────────────────────────────────────────────────────

/**
 * Amounts per currency, exactly as the server bucketed them.
 *
 * They are never converted and never totalled across currencies — the server
 * says so in its own limitations, and a single "total" here would be a number
 * the platform has no rate to produce.
 */
export function MoneyBuckets({
  buckets,
  emptyState,
  testId,
}: {
  buckets: MoneyBucketDto[];
  emptyState: string;
  testId?: string;
}) {
  if (buckets.length === 0) {
    return <Absent state={emptyState} testId={testId} />;
  }
  return (
    <ul data-testid={testId} className="flex flex-wrap gap-2">
      {buckets.map((bucket) => (
        <li
          key={bucket.currency}
          className="flex flex-col gap-0.5 rounded-sm border-thin border-border-subtle bg-glass-1 px-2.5 py-1.5"
        >
          <span className="font-mono text-sm font-black tabular-nums text-text-primary">
            {bucket.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}{' '}
            <span className="text-2xs font-bold text-text-secondary">{bucket.currency}</span>
          </span>
          <span className="text-2xs font-medium text-text-muted">
            across {bucket.count.toLocaleString('en-US')} settlement
            {bucket.count === 1 ? '' : 's'}
          </span>
        </li>
      ))}
      <li className="self-center text-2xs font-medium italic text-text-muted">
        Not converted, not totalled across currencies.
      </li>
    </ul>
  );
}

export function MoneyFigureCard({ figure }: { figure: MoneyFigureDto }) {
  return (
    <div
      data-testid={`money-${figure.key}`}
      data-settlement={figure.settlement}
      className="flex flex-col gap-2 rounded-card border-thin border-border-subtle bg-bg-card p-3"
    >
      <span className="flex flex-wrap items-center gap-2">
        <span className="text-2xs font-bold uppercase tracking-wide text-text-muted">
          {figure.label}
        </span>
        <span
          className={`rounded-xs px-1.5 py-0.5 font-mono text-2xs font-black uppercase ${
            figure.settlement === 'Settled'
              ? 'bg-success-soft text-success'
              : 'bg-warning-soft text-warning'
          }`}
        >
          {figure.settlement}
        </span>
      </span>
      {figure.settlement === 'Pending' ? (
        <p className="text-2xs font-medium leading-relaxed text-warning">
          Recorded, owed or in flight. It has not moved and it may never move.
        </p>
      ) : null}
      <MoneyBuckets buckets={figure.byCurrency} emptyState="NoAmountsRecorded" />
      <WindowNote period={figure.period} source={figure.source} />
    </div>
  );
}

// ── Notes the server wrote ──────────────────────────────────────────────────

/**
 * The server's own limitations list, shown in full and never summarised.
 *
 * These strings are the surface telling you what it cannot tell you. Trimming
 * them to the first two would be editing the caveat out of the finding.
 */
export function Limitations({ items, testId }: { items: string[]; testId?: string }) {
  if (items.length === 0) return null;
  return (
    <section
      data-testid={testId ?? 'limitations'}
      className="flex flex-col gap-2 rounded-card border-thin border-border-medium bg-glass-1 p-3.5"
    >
      <h3 className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-text-secondary">
        <Info size={13} strokeWidth={1.8} />
        What this surface cannot tell you
      </h3>
      <ul className="flex list-disc flex-col gap-1.5 pl-4">
        {items.map((item) => (
          <li key={item} className="text-xs font-medium leading-relaxed text-text-secondary">
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

/** The method the server used to produce a link, quoted rather than paraphrased. */
export function MethodNote({ method, caveat }: { method: string; caveat?: string }) {
  return (
    <div
      data-testid="method-note"
      className="flex flex-col gap-1 rounded-sm border-thin border-border-subtle bg-glass-1 px-3 py-2"
    >
      <span className="text-2xs font-bold uppercase tracking-wide text-text-muted">Method</span>
      <span className="text-xs font-medium leading-relaxed text-text-secondary">{method}</span>
      {caveat ? (
        <span className="text-xs font-bold leading-relaxed text-warning">{caveat}</span>
      ) : null}
    </div>
  );
}

/** Page chrome shared by all five surfaces. */
export function SurfaceHeader({
  icon,
  title,
  blurb,
  actions,
}: {
  icon: ReactNode;
  title: string;
  blurb: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex flex-col gap-1">
        <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight text-text-primary">
          {icon}
          {title}
        </h1>
        <p className="max-w-3xl text-xs font-medium leading-relaxed text-text-secondary">{blurb}</p>
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </header>
  );
}

/** A labelled block. Used everywhere so the five surfaces read as one console. */
export function Panel({
  title,
  subtitle,
  children,
  testId,
}: {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  testId?: string;
}) {
  return (
    <section
      data-testid={testId}
      className="flex flex-col gap-3 rounded-card border-thin border-border-subtle bg-bg-card p-4"
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-extrabold tracking-tight text-text-primary">{title}</h2>
        {subtitle}
      </div>
      {children}
    </section>
  );
}

/** A key/value row. The value is a node so it can be a figure or an `Absent`. */
export function Field({
  label,
  children,
  testId,
}: {
  label: string;
  children: ReactNode;
  testId?: string;
}) {
  return (
    <div data-testid={testId} className="flex flex-col gap-1">
      <span className="text-2xs font-bold uppercase tracking-wide text-text-muted">{label}</span>
      <span className="text-xs font-medium leading-relaxed text-text-primary">{children}</span>
    </div>
  );
}

export { utc as formatUtc };
