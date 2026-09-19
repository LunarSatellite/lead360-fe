import { AlarmClock, CircleSlash, Hourglass, TimerReset } from 'lucide-react';
import {
  approvalClock,
  clockUrgency,
  formatTimeRemaining,
  type ApprovalClock as Clock,
} from '../lib/approval-window';
import type { GovernedAgentActionView } from '../types/governance.types';

/**
 * Time remaining, legible at a glance.
 *
 * The screen is shaped by the five-minute Critical window: the number is
 * monospaced so the digits do not shuffle as they tick, sized large enough to
 * read across a desk, and its colour is driven by the fraction of the window
 * left rather than an absolute threshold — one minute of sixty is calm, one
 * minute of five is not. At zero the row stops offering the action instead of
 * carrying on counting into negative numbers.
 */
const TONE: Record<ReturnType<typeof clockUrgency>, string> = {
  calm: 'text-text-primary',
  closing: 'text-warning',
  'last-minute': 'text-danger animate-pulse',
  gone: 'text-danger',
};

export function ApprovalClockReadout({
  action,
  now,
}: {
  action: GovernedAgentActionView;
  now: Date;
}) {
  const clock = approvalClock(action, now);
  return <ClockReadout clock={clock} />;
}

export function ClockReadout({ clock }: { clock: Clock }) {
  const urgency = clockUrgency(clock);

  if (clock.kind === 'live') {
    return (
      <div className="flex flex-col gap-0.5" data-testid="approval-clock" data-clock="live">
        <span
          className={`font-mono text-xl font-black tabular-nums leading-none ${TONE[urgency]}`}
          aria-label={`${formatTimeRemaining(clock.msRemaining)} left before this approval expires`}
        >
          {formatTimeRemaining(clock.msRemaining)}
        </span>
        <span className="text-[11px] font-semibold text-text-muted">
          left of the {clock.windowMinutes} min window
        </span>
      </div>
    );
  }

  if (clock.kind === 'expired') {
    return (
      <div
        className="flex items-center gap-1.5 text-danger"
        data-testid="approval-clock"
        data-clock="expired"
      >
        <AlarmClock size={15} strokeWidth={1.6} />
        <span className="text-xs font-bold">Window closed</span>
      </div>
    );
  }

  if (clock.kind === 'consumed') {
    return (
      <div
        className="flex items-center gap-1.5 text-text-muted"
        data-testid="approval-clock"
        data-clock="consumed"
      >
        <CircleSlash size={15} strokeWidth={1.6} />
        <span className="text-xs font-bold">Approval used</span>
      </div>
    );
  }

  if (clock.kind === 'not-started') {
    return (
      <div
        className="flex flex-col gap-0.5"
        data-testid="approval-clock"
        data-clock="not-started"
      >
        <span className="flex items-center gap-1.5 text-xs font-bold text-text-secondary">
          <Hourglass size={14} strokeWidth={1.6} />
          Not started
        </span>
        <span className="text-[11px] font-semibold text-text-muted">
          approving opens a {clock.windowMinutes} min window
        </span>
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-1.5 text-text-muted"
      data-testid="approval-clock"
      data-clock="none"
    >
      <TimerReset size={15} strokeWidth={1.6} />
      <span className="text-xs font-bold">No window</span>
    </div>
  );
}
