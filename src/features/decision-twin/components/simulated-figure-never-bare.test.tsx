import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HorizonValue, StatedValue } from './TwinPrimitives';
import { figure, stated, studyWithNoHorizonPremise } from '../lib/__fixtures__/decision-twin';
import { SimulatedValue } from '@/features/intelligence-console/components/FigureValue';

/**
 * The guard this slice exists behind.
 *
 * Mobile has `simulated_figure.dart`, which refuses a bare number and
 * deliberately carries no `?? 0` fallback. This is the web equivalent of that
 * refusal, asserted rather than documented: the whole point of a decision twin
 * is that its output is indistinguishable, digit for digit, from a measurement,
 * so the only thing standing between a simulated 1,840 and an operator who
 * reports it as revenue is that it never appears on screen without its label.
 *
 * Fourteen fabricated figures have been found and removed from this codebase.
 * These tests are why a fifteenth cannot be introduced here by formatting a
 * number inline.
 */

const simulatedNumberNodes = (container: HTMLElement, rendered: string) =>
  Array.from(container.querySelectorAll('*')).filter(
    (element) =>
      element.children.length === 0 && (element.textContent ?? '').trim().includes(rendered),
  );

describe('a simulated figure cannot render unlabelled', () => {
  it('every node showing the number sits inside a Simulated-tagged ancestor', () => {
    const { container } = render(<SimulatedValue figure={figure({ simulatedValue: 1840 })} />);

    const nodes = simulatedNumberNodes(container, '1,840');
    expect(nodes.length).toBeGreaterThan(0);
    for (const node of nodes) {
      expect(node.closest('[data-provenance="Simulated"]')).not.toBeNull();
    }
  });

  it('shows the word Simulated, the run it came from and what it was derived from', () => {
    render(<SimulatedValue figure={figure({ simulatedValue: 1840 })} />);

    expect(screen.getByText(/simulated/i)).toBeInTheDocument();
    expect(screen.getByText(/not observed/i)).toBeInTheDocument();
    expect(screen.getByText(/7d3a1f92/)).toBeInTheDocument();
  });

  it('never tags a simulated figure as Measured', () => {
    const { container } = render(<SimulatedValue figure={figure()} />);

    expect(container.querySelector('[data-provenance="Measured"]')).toBeNull();
  });
});

describe('a stated premise is not a measurement and not a simulation', () => {
  it('carries its own provenance tag, distinct from both', () => {
    const { container } = render(
      <StatedValue quantity={stated({ statedValue: 30, unit: 'days' })} />,
    );

    expect(container.querySelector('[data-provenance="Stated"]')).not.toBeNull();
    expect(container.querySelector('[data-provenance="Simulated"]')).toBeNull();
    expect(container.querySelector('[data-provenance="Measured"]')).toBeNull();
  });

  it('names the basis and the source beside the number, never the number alone', () => {
    const { container } = render(
      <StatedValue quantity={stated({ statedValue: 30, unit: 'days' })} />,
    );

    for (const node of simulatedNumberNodes(container, '30')) {
      expect(node.closest('[data-provenance="Stated"]')).not.toBeNull();
    }
    expect(screen.getByText(/not measured here/i)).toBeInTheDocument();
  });

  it('shows an observed window when the basis cites one, and nothing when it does not', () => {
    const { rerender } = render(<StatedValue quantity={stated()} />);
    expect(screen.queryByText(/observed /i)).toBeNull();

    rerender(
      <StatedValue
        quantity={stated({
          basis: 'DerivedFromObservedWindow',
          observedFromUtc: '2026-08-01T00:00:00+00:00',
          observedToUtc: '2026-08-31T00:00:00+00:00',
        })}
      />,
    );
    expect(screen.getByText(/observed 2026-08-01/i)).toBeInTheDocument();
  });
});

describe("the server's zero-horizon sentinel is refused", () => {
  it('renders the absence instead of 0 days', () => {
    const { container } = render(
      <HorizonValue horizon={studyWithNoHorizonPremise().scope.horizon} />,
    );

    expect(container.querySelector('[data-absent="NoHorizonPremiseRecorded"]')).not.toBeNull();
    expect(screen.queryByText('0')).toBeNull();
    expect(container.querySelector('[data-provenance="Stated"]')).toBeNull();
  });

  it('still renders a real horizon as the stated premise it is', () => {
    const { container } = render(
      <HorizonValue horizon={stated({ statedValue: 30, unit: 'days', basisSource: 'proposal' })} />,
    );

    expect(container.querySelector('[data-provenance="Stated"]')).not.toBeNull();
    expect(container.querySelector('[data-absent]')).toBeNull();
  });
});
