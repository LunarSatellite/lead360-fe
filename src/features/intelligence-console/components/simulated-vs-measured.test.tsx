import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderIsolated } from '../lib/__fixtures__/render';
import { FigureValue, MeasuredValue, SimulatedValue } from './FigureValue';
import { measuredFigure, simulatedFigure } from '../lib/__fixtures__/intelligence';

/**
 * A model's output must never be readable as an observation.
 *
 * The two fixtures deliberately carry the *same* number and the same unit, so
 * these tests can only pass if the difference is carried by the rendering
 * rather than by the value happening to look different.
 */
describe('a simulated figure is not rendered like a measured one', () => {
  it('tags each with its own provenance', () => {
    renderIsolated(
      <>
        <MeasuredValue figure={measuredFigure()} testId="measured" />
        <SimulatedValue figure={simulatedFigure()} testId="simulated" />
      </>,
    );

    expect(screen.getByTestId('measured')).toHaveAttribute('data-provenance', 'Measured');
    expect(screen.getByTestId('simulated')).toHaveAttribute('data-provenance', 'Simulated');
  });

  it('says "Simulated" on the simulated one and says it nowhere on the measured one', () => {
    renderIsolated(
      <>
        <MeasuredValue figure={measuredFigure()} testId="measured" />
        <SimulatedValue figure={simulatedFigure()} testId="simulated" />
      </>,
    );

    expect(screen.getByTestId('simulated')).toHaveTextContent('Simulated');
    expect(screen.getByTestId('measured')).not.toHaveTextContent(/simulated/i);
  });

  it('gives them no visual language in common, though the value is identical', () => {
    renderIsolated(
      <>
        <MeasuredValue figure={measuredFigure()} testId="measured" />
        <SimulatedValue figure={simulatedFigure()} testId="simulated" />
      </>,
    );

    const measured = screen.getByTestId('measured');
    const simulated = screen.getByTestId('simulated');

    expect(measuredFigure().measuredValue).toBe(simulatedFigure().simulatedValue);

    // Solid border and the console's normal numeric treatment.
    expect(measured.className).toContain('border-thin');
    expect(measured.className).not.toContain('border-dashed');
    // Dashed amber frame, italic, never the measured treatment.
    expect(simulated.className).toContain('border-dashed');
    expect(simulated.className).toContain('warning');
    expect(simulated.innerHTML).toContain('italic');
    expect(measured.innerHTML).not.toContain('italic');
  });

  it('names the run and what the simulated figure was derived from', () => {
    renderIsolated(<SimulatedValue figure={simulatedFigure()} testId="simulated" />);

    const simulated = screen.getByTestId('simulated');
    expect(simulated).toHaveTextContent('scenario RepairApplied');
    expect(simulated).toHaveTextContent('run 7c1e8a10');
    expect(simulated).toHaveTextContent(/Not observed\. Derived from/);
  });

  it('names the source that observed a measured figure, and the period it observed over', () => {
    renderIsolated(<MeasuredValue figure={measuredFigure()} testId="measured" />);

    const measured = screen.getByTestId('measured');
    expect(measured).toHaveTextContent('measured by commerce-genome');
    expect(measured).toHaveTextContent('Observed 2026-09-11 00:00Z → 2026-09-18 00:00Z');
  });
});

describe('FigureValue branches on the server’s provenance, not the caller’s intent', () => {
  it('renders a simulated figure as simulated even where a measurement was expected', () => {
    renderIsolated(
      <FigureValue figure={simulatedFigure()} absentState="NotMeasured" testId="value" />,
    );

    expect(screen.getByTestId('value')).toHaveAttribute('data-provenance', 'Simulated');
  });

  it('renders a measured figure as measured', () => {
    renderIsolated(
      <FigureValue figure={measuredFigure()} absentState="NotMeasured" testId="value" />,
    );

    expect(screen.getByTestId('value')).toHaveAttribute('data-provenance', 'Measured');
  });

  it('renders a null as the named absence, not as zero', () => {
    renderIsolated(
      <FigureValue
        figure={null}
        absentState="MeasureNotProducedByThisStudy"
        testId="value"
      />,
    );

    const value = screen.getByTestId('value');
    expect(value).toHaveAttribute('data-absent', 'MeasureNotProducedByThisStudy');
    expect(value).not.toHaveAttribute('data-provenance');
    expect(value.textContent).not.toMatch(/\b0\b/);
  });
});
