import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderPage } from '@/features/intelligence-console/lib/__fixtures__/render';
import { GovernanceError } from '@/features/agent-governance/api/agent-governance.api';
import {
  emptyStudy,
  fullStudy,
  studyWithNoHorizonPremise,
} from '../lib/__fixtures__/decision-twin';
import DecisionTwinStudyPage from './DecisionTwinStudyPage';

vi.mock('../api/decision-twin.api', () => ({
  decisionTwinApi: {
    scenarios: vi.fn(),
    openStudy: vi.fn(),
    study: vi.fn(),
    recordOutcome: vi.fn(),
  },
}));

const { decisionTwinApi } = await import('../api/decision-twin.api');
const study = vi.mocked(decisionTwinApi.study);

const renderStudy = () =>
  renderPage(<DecisionTwinStudyPage />, {
    path: '/decision-twin/studies/:studyId',
    route: '/decision-twin/studies/c0ffee00-2222-4d1b-8e77-bbbbbbbbbbbb',
  });

beforeEach(() => {
  study.mockReset();
});

describe('a populated study', () => {
  it('renders every arm and labels the no-change baseline where it falls', async () => {
    study.mockResolvedValue(fullStudy());
    renderStudy();

    expect(await screen.findByTestId('arm-baseline')).toBeInTheDocument();
    expect(screen.getByTestId('arm-free-delivery')).toBeInTheDocument();
    expect(screen.getAllByText(/no-change baseline/i).length).toBeGreaterThan(0);
  });

  it('shows no score, no ranking and no difference-from-baseline anywhere', async () => {
    study.mockResolvedValue(fullStudy());
    const { container } = renderStudy();
    await screen.findByTestId('arm-baseline');

    const text = container.textContent ?? '';
    expect(text).not.toMatch(/\bwinner\b|\brank\b|\bscore\b|\bbest arm\b|\buplift\b/i);
    expect(text).not.toMatch(/vs\.? baseline|difference from baseline|\+\d+% vs/i);
  });

  it('offers no control that would execute an arm', async () => {
    study.mockResolvedValue(fullStudy());
    const { container } = renderStudy();
    await screen.findByTestId('arm-baseline');

    for (const control of Array.from(container.querySelectorAll('button, a'))) {
      expect(control.textContent ?? '').not.toMatch(
        /\bapply\b|\bexecute\b|\bactivate\b|\broll ?out\b|\bset price\b|\breserve\b|\bgo live\b/i,
      );
    }
  });

  it('states in the banner that nothing was set, reserved or moved', async () => {
    study.mockResolvedValue(fullStudy());
    renderStudy();
    await screen.findByTestId('arm-baseline');

    expect(screen.getByTestId('simulation-banner').textContent).toMatch(
      /set no price, reserved no stock/i,
    );
  });

  it('shows every limitation the server sent, unabridged', async () => {
    const withLimits = fullStudy();
    study.mockResolvedValue(withLimits);
    renderStudy();

    const list = await screen.findByTestId('study-limitations');
    for (const limitation of withLimits.limitations) {
      expect(list.textContent).toContain(limitation);
    }
  });

  it('shows the declared denominator beside a spread rather than a bare count', async () => {
    study.mockResolvedValue(fullStudy());
    renderStudy();

    const denominator = await screen.findByTestId('baseline-denominator');
    expect(denominator.getAttribute('data-provenance')).toBe('Stated');
  });
});

describe('an empty study reads as empty, not as zero', () => {
  it('names each absent section instead of drawing a zero row', async () => {
    study.mockResolvedValue(emptyStudy());
    const { container } = renderStudy();

    await screen.findByTestId('comparison-empty');
    for (const testId of [
      'assumptions-empty',
      'arms-empty',
      'comparison-empty',
      'constraints-empty',
      'sensitivity-empty',
      'learning-empty',
    ]) {
      expect(screen.getByTestId(testId)).toBeInTheDocument();
    }
    expect(container.querySelector('[data-provenance="Simulated"]')).toBeNull();
  });

  it('says an unsupplied Learn section is uncalibrated, not that it matched', async () => {
    study.mockResolvedValue(emptyStudy());
    renderStudy();

    const empty = await screen.findByTestId('learning-empty');
    expect(empty.textContent).toMatch(/NoRecordedOutcomeSupplied/);
    expect(empty.textContent).toMatch(/not the same as the simulation having matched reality/i);
  });

  it('never prints a 0 in place of a section the server left empty', async () => {
    study.mockResolvedValue(emptyStudy());
    const { container } = renderStudy();
    await screen.findByTestId('comparison-empty');

    const zeroes = Array.from(container.querySelectorAll('*')).filter(
      (element) => element.children.length === 0 && (element.textContent ?? '').trim() === '0',
    );
    expect(zeroes).toHaveLength(0);
  });
});

describe('the zero-horizon sentinel never reaches the page', () => {
  it('renders the horizon as absent when no horizon premise was recorded', async () => {
    study.mockResolvedValue(studyWithNoHorizonPremise());
    renderStudy();

    const horizon = await screen.findByTestId('study-horizon');
    expect(horizon.getAttribute('data-absent')).toBe('NoHorizonPremiseRecorded');
    expect(horizon.textContent).not.toMatch(/\b0 days\b/);
  });
});

describe('failure', () => {
  it('shows the server refusal and no study', async () => {
    study.mockRejectedValue(
      new GovernanceError({ title: 'Not found', status: 404, errorCode: 'NOT_FOUND' }, 404),
    );
    renderStudy();

    expect(await screen.findByText(/not found/i)).toBeInTheDocument();
    expect(screen.queryByTestId('define-panel')).toBeNull();
    expect(screen.queryByTestId('comparison-panel')).toBeNull();
  });

  it('renders no figures at all when the read failed', async () => {
    study.mockRejectedValue(new GovernanceError(undefined, 500));
    const { container } = renderStudy();

    await screen.findByTestId('simulation-banner');
    expect(container.querySelector('[data-provenance="Simulated"]')).toBeNull();
    expect(container.querySelector('[data-provenance="Stated"]')).toBeNull();
  });
});
