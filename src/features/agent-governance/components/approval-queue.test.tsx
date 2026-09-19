import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ApprovalQueueRow } from './ApprovalQueue';
import {
  actionFixture,
  approvedFixture,
  haltFixture,
} from '../lib/__fixtures__/governed-actions';
import { RiskTier } from '../types/governance.types';

const noop = () => undefined;

function renderRow(action = actionFixture(), now = new Date('2026-09-19T10:01:00Z'), halts = []) {
  return render(
    <MemoryRouter>
      <ul>
        <ApprovalQueueRow
          action={action}
          now={now}
          halts={halts}
          onApprove={noop}
          onReject={noop}
          onExecute={noop}
        />
      </ul>
    </MemoryRouter>,
  );
}

describe('the queue row renders what the server returned', () => {
  it('shows the proposal, the agent that asked, the derived tier and the window', () => {
    renderRow();

    expect(screen.getByText('catalog.reprice')).toBeInTheDocument();
    expect(screen.getByText(/pricing-agent/)).toBeInTheDocument();
    expect(screen.getByText(/product\/sku-4471/)).toBeInTheDocument();
    expect(screen.getByTestId('risk-tier')).toHaveTextContent('Critical risk');
    expect(screen.getByTestId('approval-clock')).toHaveAttribute('data-clock', 'not-started');
    expect(screen.getByTestId('approval-clock')).toHaveTextContent('5 min window');
  });

  it('shows the live countdown for an approved action from the server expiry', () => {
    renderRow(
      approvedFixture('2026-09-19T10:06:00+00:00'),
      new Date('2026-09-19T10:04:31Z'),
    );
    const clock = screen.getByTestId('approval-clock');
    expect(clock).toHaveAttribute('data-clock', 'live');
    expect(clock).toHaveTextContent('1:29');
  });

  it('renders each tier as the server labelled it, with no control to change it', () => {
    for (const [tier, label] of [
      [RiskTier.Low, 'Low risk'],
      [RiskTier.Medium, 'Medium risk'],
      [RiskTier.High, 'High risk'],
      [RiskTier.Critical, 'Critical risk'],
    ] as const) {
      const { unmount } = renderRow(actionFixture({ riskTier: tier }));
      const badge = screen.getByTestId('risk-tier');
      expect(badge).toHaveTextContent(label);
      // The tier is text, never a field.
      expect(within(badge).queryByRole('textbox')).toBeNull();
      expect(within(badge).queryByRole('combobox')).toBeNull();
      unmount();
    }
  });
});

describe('an item that expires on screen stops being actionable', () => {
  const action = approvedFixture('2026-09-19T10:06:00+00:00');

  it('offers the run control while the window is open', () => {
    renderRow(action, new Date('2026-09-19T10:05:59Z'));
    expect(screen.getByTestId('queue-execute')).toBeEnabled();
  });

  it('disables it and says why the moment the window closes', () => {
    renderRow(action, new Date('2026-09-19T10:06:01Z'));

    const execute = screen.getByTestId('queue-execute');
    expect(execute).toBeDisabled();
    expect(execute).toHaveAttribute('title', expect.stringMatching(/window has closed/i));
    expect(screen.getByTestId('approval-clock')).toHaveTextContent('Window closed');
  });

  it('will not re-offer a run for an approval that was already used', () => {
    renderRow(
      approvedFixture('2026-09-19T10:06:00+00:00', {
        approvalConsumedUtc: '2026-09-19T10:02:00+00:00',
      }),
      new Date('2026-09-19T10:03:00Z'),
    );
    expect(screen.getByTestId('queue-execute')).toBeDisabled();
  });
});

describe('nothing decides itself', () => {
  it('offers approve and reject as deliberate controls, with no default action taken', () => {
    renderRow();
    const approve = screen.getByTestId('queue-approve');
    // "…" because approving opens the reasoning dialog — the row never decides.
    expect(approve).toHaveTextContent('Approve…');
    expect(screen.getByTestId('queue-reject')).toHaveTextContent('Reject…');
    expect(screen.queryByRole('checkbox')).toBeNull();
  });

  it('blocks approving under a halt and says so, while leaving reject alone', () => {
    renderRow(actionFixture(), new Date('2026-09-19T10:01:00Z'), [haltFixture()] as never);
    expect(screen.getByTestId('queue-approve')).toBeDisabled();
    expect(screen.getByTestId('queue-reject')).toBeEnabled();
    expect(screen.getByTestId('queue-row-halted')).toBeInTheDocument();
  });
});
