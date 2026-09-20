import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderIsolated } from '../lib/__fixtures__/render';
import {
  Absent,
  CountedFigure,
  MoneyBuckets,
  ShareFigure,
  ValueOrAbsent,
} from './ReportPrimitives';
import { period } from '../lib/__fixtures__/intelligence';

/**
 * The rule these surfaces live or die by: an absent value is not a zero, and
 * it is not a dash that reads like a result. Each one renders as the specific
 * thing the server said it was.
 */
describe('absent is not zero', () => {
  it('renders the server’s own word for the absence, never a number', () => {
    renderIsolated(<Absent state="OutcomeNotMeasured" testId="x" />);

    const absent = screen.getByTestId('x');
    expect(absent).toHaveAttribute('data-absent', 'OutcomeNotMeasured');
    expect(absent).toHaveTextContent('OutcomeNotMeasured');
    expect(absent.textContent).not.toMatch(/\b0\b/);
    expect(absent.textContent?.trim()).not.toBe('—');
    expect(absent.textContent?.trim()).not.toBe('-');
  });

  it('carries the server’s explanation of the absence when there is one', () => {
    renderIsolated(
      <Absent
        state="TargetKindNotMoneyBearing"
        meaning="No money module owns this target kind."
      />,
    );

    expect(screen.getByText('No money module owns this target kind.')).toBeInTheDocument();
  });

  it('turns a null into a named absence rather than rendering the child', () => {
    renderIsolated(
      <ValueOrAbsent value={null} state="NotRecorded" testId="maybe">
        <span>0</span>
      </ValueOrAbsent>,
    );

    expect(screen.getByTestId('maybe')).toHaveAttribute('data-absent', 'NotRecorded');
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('renders a genuine zero as a zero — an observed none is a result', () => {
    renderIsolated(
      <CountedFigure
        testId="zero-count"
        figure={{
          key: 'settled',
          label: 'Decisions traced to settled money',
          source: 'IExecutiveSettledMoneySource',
          period: period(),
          count: 0,
        }}
      />,
    );

    const figure = screen.getByTestId('zero-count');
    expect(figure).toHaveAttribute('data-count', '0');
    expect(figure).toHaveTextContent('0');
    expect(figure).not.toHaveAttribute('data-absent');
  });

  it('never invents a percentage the server declined to compute', () => {
    renderIsolated(
      <ShareFigure
        testId="share"
        share={{
          observed: 2,
          denominator: 0,
          denominatorMeaning: 'All commerce failures recorded in the window.',
          percentOfDenominator: null,
        }}
      />,
    );

    expect(screen.getByText('PercentNotComputable')).toBeInTheDocument();
    expect(screen.getByTestId('share')).not.toHaveTextContent('0%');
    expect(screen.getByTestId('share')).not.toHaveTextContent('Infinity');
    expect(screen.getByTestId('share')).not.toHaveTextContent('NaN');
  });

  it('shows the server’s percentage as the server’s, not as its own', () => {
    renderIsolated(
      <ShareFigure
        share={{
          observed: 61,
          denominator: 1284,
          denominatorMeaning: 'All commerce failures recorded in the window.',
          percentOfDenominator: 4.75,
        }}
      />,
    );

    expect(screen.getByText(/4\.75% of denominator \(computed by the server\)/)).toBeInTheDocument();
  });

  it('says no money was traced rather than showing a zero total', () => {
    renderIsolated(
      <MoneyBuckets
        testId="traced"
        buckets={[]}
        emptyState="NoSettledMoneyTracedToAnyDecision"
      />,
    );

    expect(screen.getByTestId('traced')).toHaveAttribute(
      'data-absent',
      'NoSettledMoneyTracedToAnyDecision',
    );
  });
});

describe('every figure states its window and denominator', () => {
  it('prints the period label and range under the count', () => {
    renderIsolated(
      <CountedFigure
        testId="figure"
        figure={{
          key: 'requested',
          label: 'Decisions requested',
          source: 'GovernedAgentActions',
          period: period(),
          count: 412,
        }}
      />,
    );

    const figure = screen.getByTestId('figure');
    expect(figure).toHaveTextContent('Last 30 days');
    expect(figure).toHaveTextContent('2026-08-20 00:00Z');
    expect(figure).toHaveTextContent('2026-09-19 00:00Z');
    expect(figure).toHaveTextContent('source: GovernedAgentActions');
  });

  it('prints the denominator and what it means', () => {
    renderIsolated(
      <ShareFigure
        testId="share"
        share={{
          observed: 61,
          denominator: 1284,
          denominatorMeaning: 'All commerce failures recorded in the window, across every module.',
          percentOfDenominator: 4.75,
        }}
      />,
    );

    const share = screen.getByTestId('share');
    expect(share).toHaveTextContent('of 1,284');
    expect(share).toHaveTextContent(
      'Denominator: All commerce failures recorded in the window, across every module.',
    );
  });

  it('states that amounts are never totalled across currencies', () => {
    renderIsolated(
      <MoneyBuckets
        testId="money"
        buckets={[
          { currency: 'CDF', amount: 18_400_000, count: 902 },
          { currency: 'USD', amount: 4_100, count: 12 },
        ]}
        emptyState="NoAmountsRecorded"
      />,
    );

    const money = screen.getByTestId('money');
    expect(money).toHaveTextContent('18,400,000.00');
    expect(money).toHaveTextContent('4,100.00');
    expect(money).toHaveTextContent('Not converted, not totalled across currencies.');
    // The sum of the two would be 18,404,100 — it must appear nowhere.
    expect(money).not.toHaveTextContent('18,404,100');
  });
});
