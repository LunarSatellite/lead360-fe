import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderIsolated } from '../lib/__fixtures__/render';
import { ImplementationWindowBlock, OptionsBlock, OutcomeBlock } from './LedgerStates';
import { ConsistentWithCard, ConsistentWithList } from './ConsistentWith';
import { DecisionOwnerBadge, RoutingBlock } from './DecisionOwner';
import {
  decisionNotExecuted,
  hypothesis,
  optionsNotRecorded,
  outcomeMeasured,
  outcomeNotMeasured,
  unassignedOwner,
  windowNotDeclared,
} from '../lib/__fixtures__/intelligence';

/**
 * Two absences that mean different things must not look like one absence.
 */
describe('OutcomeNotMeasured and DecisionNotExecuted stay distinct', () => {
  it('carries a different state token for each', () => {
    const { unmount } = renderIsolated(
      <OutcomeBlock outcome={outcomeNotMeasured()} testId="outcome" />,
    );
    expect(screen.getByTestId('outcome')).toHaveAttribute(
      'data-outcome-state',
      'OutcomeNotMeasured',
    );
    unmount();

    renderIsolated(<OutcomeBlock outcome={decisionNotExecuted()} testId="outcome" />);
    expect(screen.getByTestId('outcome')).toHaveAttribute(
      'data-outcome-state',
      'DecisionNotExecuted',
    );
  });

  it('says a measurement is owed for one and that nothing is owed for the other', () => {
    const { unmount } = renderIsolated(
      <OutcomeBlock outcome={outcomeNotMeasured()} testId="outcome" />,
    );
    expect(screen.getByTestId('outcome')).toHaveTextContent(
      'The decision was executed and nobody has measured what followed',
    );
    unmount();

    renderIsolated(<OutcomeBlock outcome={decisionNotExecuted()} testId="outcome" />);
    expect(screen.getByTestId('outcome')).toHaveTextContent(
      'The decision was never executed, so there is no result to measure',
    );
  });

  it('gives them different visual weight — one is a gap, the other is not', () => {
    const { unmount } = renderIsolated(
      <OutcomeBlock outcome={outcomeNotMeasured()} testId="outcome" />,
    );
    const notMeasured = screen.getByTestId('outcome').className;
    unmount();

    renderIsolated(<OutcomeBlock outcome={decisionNotExecuted()} testId="outcome" />);
    const notExecuted = screen.getByTestId('outcome').className;

    expect(notMeasured).toContain('warning');
    expect(notExecuted).not.toContain('warning');
    expect(notMeasured).not.toBe(notExecuted);
  });

  it('renders neither as zero and neither as a bare dash', () => {
    renderIsolated(
      <>
        <OutcomeBlock outcome={outcomeNotMeasured()} testId="a" />
        <OutcomeBlock outcome={decisionNotExecuted()} testId="b" />
      </>,
    );

    for (const id of ['a', 'b']) {
      const text = screen.getByTestId(id).textContent ?? '';
      expect(text).not.toMatch(/(^|\s)0(\s|$)/);
      expect(text).not.toMatch(/(^|\s)[—-](\s|$)/);
    }
  });

  it('shows the measurement itself once one exists', () => {
    renderIsolated(<OutcomeBlock outcome={outcomeMeasured()} testId="outcome" />);

    expect(screen.getByTestId('outcome')).toHaveAttribute('data-outcome-state', 'OutcomeMeasured');
    expect(screen.getByTestId('measurement-recurrences-after-repair')).toHaveAttribute(
      'data-provenance',
      'Measured',
    );
  });
});

describe('the ledger’s other unrecorded states read as themselves', () => {
  it('says nobody recorded the alternatives rather than showing an empty list', () => {
    renderIsolated(<OptionsBlock options={optionsNotRecorded()} testId="options" />);

    const options = screen.getByTestId('options');
    expect(options).toHaveAttribute('data-options-state', 'OptionsNotRecorded');
    expect(screen.getByText('NoAlternativesOnRecord')).toBeInTheDocument();
  });

  it('distinguishes an undeclared window from an action that never ran', () => {
    renderIsolated(<ImplementationWindowBlock window={windowNotDeclared()} testId="window" />);

    expect(screen.getByTestId('window')).toHaveAttribute('data-window-state', 'WindowNotDeclared');
    expect(screen.getByTestId('planned-start')).toHaveTextContent('WindowNotDeclared');
    // This one *did* execute, so the executed field is a timestamp, not an absence.
    expect(screen.getByTestId('window-executed')).toHaveTextContent('2026-09-10 08:06Z');
  });
});

describe('a hypothesis is rendered as a hypothesis', () => {
  it('shows the rival explanation and the distinguishing check alongside the headline', () => {
    renderIsolated(<ConsistentWithCard hypothesis={hypothesis()} testId="h" />);

    expect(screen.getByTestId('h')).toHaveTextContent(/^Consistent with/);
    expect(screen.getByTestId('also-consistent-with')).toHaveTextContent(
      'A rule defect in the attribute mapper',
    );
    expect(screen.getByTestId('what-would-distinguish')).toHaveTextContent(
      'Read the raw supplier payload',
    );
  });

  it('offers no confidence, ranking or likelihood', () => {
    renderIsolated(<ConsistentWithCard hypothesis={hypothesis()} testId="h" />);

    const text = screen.getByTestId('h').textContent ?? '';
    expect(text).not.toMatch(/confidence|most likely|probability|score|%/i);
  });

  it('prints an empty hypothesis list as a statement, not as blank space', () => {
    renderIsolated(
      <ConsistentWithList
        items={[]}
        emptyReason="The evidence here is too thin for this surface to offer a hypothesis."
        testId="empty"
      />,
    );

    const empty = screen.getByTestId('empty');
    expect(empty).toHaveAttribute('data-absent', 'NoHypothesisOffered');
    expect(empty).toHaveTextContent('too thin');
  });
});

describe('an unassigned decision owner reads as unassigned', () => {
  it('names the state and why nobody owns it', () => {
    renderIsolated(<DecisionOwnerBadge owner={unassignedOwner('payments')} testId="owner" />);

    const owner = screen.getByTestId('owner');
    expect(owner).toHaveAttribute('data-owner-state', 'OwnerNotAssigned');
    expect(owner).toHaveTextContent('OwnerNotAssigned');
    expect(owner).toHaveTextContent('payments');
    expect(owner).toHaveTextContent('organisational decision nobody has made yet');
  });

  it('never guesses a role or an admin surface for an unassigned domain', () => {
    renderIsolated(<DecisionOwnerBadge owner={unassignedOwner('delivery')} testId="owner" />);

    const text = screen.getByTestId('owner').textContent ?? '';
    expect(text).not.toMatch(/SuperAdmin|Owner:|Admin\b/);
  });

  it('says a link routes to nobody when neither side has an owner', () => {
    renderIsolated(
      <RoutingBlock
        testId="routing"
        routing={{
          ownership: 'OwnerNotAssigned',
          owners: [unassignedOwner('payments'), unassignedOwner('delivery')],
          routingNote: 'Nobody has been made owner of payments or delivery.',
        }}
      />,
    );

    const routing = screen.getByTestId('routing');
    expect(routing).toHaveAttribute('data-ownership', 'OwnerNotAssigned');
    expect(routing).toHaveTextContent('this link routes to nobody');
    expect(screen.getByTestId('routing-owner-payments')).toHaveAttribute(
      'data-owner-state',
      'OwnerNotAssigned',
    );
  });

  it('shows the role when one has actually been assigned', () => {
    renderIsolated(
      <DecisionOwnerBadge
        testId="owner"
        owner={{
          domain: 'payments',
          assigned: true,
          ownerRole: 'Head of Payments',
          adminSurface: '/dashboard/stylemint/payouts',
          basisOfOwnership: 'Configured at Intelligence:AuroraRelate:DecisionOwners.',
        }}
      />,
    );

    const owner = screen.getByTestId('owner');
    expect(owner).toHaveAttribute('data-owner-state', 'OwnerAssigned');
    expect(owner).toHaveTextContent('Head of Payments');
  });
});
