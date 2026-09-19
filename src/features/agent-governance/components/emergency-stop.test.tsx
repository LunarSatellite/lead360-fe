import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { EngageHaltDialog, HaltRow } from './EmergencyStop';
import { haltFixture } from '../lib/__fixtures__/governed-actions';
import { HaltScope } from '../types/governance.types';

function openDialog(onConfirm = vi.fn()) {
  render(
    <EngageHaltDialog
      pending={false}
      error={null}
      onCancel={() => undefined}
      onConfirm={onConfirm}
    />,
  );
  return onConfirm;
}

describe('engaging the stop is deliberate', () => {
  it('preselects no scope at all, and never the global one', () => {
    openDialog();
    for (const scope of [HaltScope.Capability, HaltScope.Agent, HaltScope.Global]) {
      expect(screen.getByTestId(`halt-scope-${scope}`)).not.toBeChecked();
    }
    expect(screen.getByTestId('halt-confirm')).toBeDisabled();
  });

  it('starts with the acknowledgement unticked', () => {
    openDialog();
    expect(screen.getByTestId('halt-acknowledge')).not.toBeChecked();
  });

  it('offers the narrowest scope first', () => {
    openDialog();
    const radios = screen.getAllByRole('radio');
    expect(radios[0]).toHaveAttribute('data-testid', `halt-scope-${HaltScope.Capability}`);
    expect(radios[radios.length - 1]).toHaveAttribute('data-testid', `halt-scope-${HaltScope.Global}`);
  });

  it('states the blast radius before anyone can confirm', () => {
    openDialog();
    expect(screen.queryByTestId('blast-radius')).toBeNull();

    fireEvent.click(screen.getByTestId(`halt-scope-${HaltScope.Global}`));

    const radius = screen.getByTestId('blast-radius');
    expect(radius).toHaveAttribute('data-scope', String(HaltScope.Global));
    expect(radius).toHaveTextContent(/platform-wide/i);
    expect(radius).toHaveTextContent(/voided/i);
    expect(radius).toHaveTextContent(/What keeps working/i);
    expect(screen.getByTestId('halt-confirm')).toBeDisabled();
  });

  it('cannot be engaged without a scope, a reason and a hand-ticked acknowledgement', () => {
    const onConfirm = openDialog();

    fireEvent.click(screen.getByTestId(`halt-scope-${HaltScope.Agent}`));
    expect(screen.getByTestId('halt-confirm')).toBeDisabled();

    fireEvent.change(screen.getByTestId('halt-scope-key'), {
      target: { value: 'Pricing-Agent' },
    });
    expect(screen.getByTestId('halt-confirm')).toBeDisabled();

    fireEvent.change(screen.getByTestId('halt-reason'), {
      target: { value: 'Repricing loop suspected on the whole catalogue.' },
    });
    expect(screen.getByTestId('halt-confirm')).toBeDisabled();

    fireEvent.click(screen.getByTestId('halt-acknowledge'));
    expect(screen.getByTestId('halt-confirm')).toBeEnabled();

    fireEvent.click(screen.getByTestId('halt-confirm'));
    expect(onConfirm).toHaveBeenCalledWith({
      scope: HaltScope.Agent,
      scopeKey: 'pricing-agent',
      reason: 'Repricing loop suspected on the whole catalogue.',
    });
  });

  it('un-ticks the acknowledgement again if the scope is changed after it was ticked', () => {
    openDialog();
    fireEvent.click(screen.getByTestId(`halt-scope-${HaltScope.Global}`));
    fireEvent.change(screen.getByTestId('halt-reason'), { target: { value: 'Kill switch drill.' } });
    fireEvent.click(screen.getByTestId('halt-acknowledge'));
    expect(screen.getByTestId('halt-confirm')).toBeEnabled();

    fireEvent.click(screen.getByTestId(`halt-scope-${HaltScope.Capability}`));
    expect(screen.getByTestId('halt-acknowledge')).not.toBeChecked();
    expect(screen.getByTestId('halt-confirm')).toBeDisabled();
  });

  it('sends no scope key for a global stop, which the server stores as "*"', () => {
    const onConfirm = openDialog();
    fireEvent.click(screen.getByTestId(`halt-scope-${HaltScope.Global}`));
    expect(screen.queryByTestId('halt-scope-key')).toBeNull();
    fireEvent.change(screen.getByTestId('halt-reason'), { target: { value: 'Kill switch drill.' } });
    fireEvent.click(screen.getByTestId('halt-acknowledge'));
    fireEvent.click(screen.getByTestId('halt-confirm'));
    expect(onConfirm).toHaveBeenCalledWith({
      scope: HaltScope.Global,
      scopeKey: null,
      reason: 'Kill switch drill.',
    });
  });
});

describe('clearing is offered only to the role that may clear', () => {
  it('shows the clear control when the operator is proven SuperAdmin', () => {
    render(<HaltRow halt={haltFixture()} canClear onClear={() => undefined} />);
    expect(screen.getByTestId('halt-clear')).toBeInTheDocument();
  });

  it('hides it from everyone else, including roles that may engage', () => {
    render(<HaltRow halt={haltFixture()} canClear={false} onClear={() => undefined} />);
    expect(screen.queryByTestId('halt-clear')).toBeNull();
  });

  it('never offers to clear a halt that is already cleared', () => {
    render(
      <HaltRow
        halt={haltFixture({ isEngaged: false, clearedByAccountId: 'acc-1', clearedUtc: '2026-09-19T11:00:00+00:00' })}
        canClear
        onClear={() => undefined}
      />,
    );
    expect(screen.queryByTestId('halt-clear')).toBeNull();
  });

  it('shows who engaged it, when, and how many approvals it voided', () => {
    render(<HaltRow halt={haltFixture()} canClear={false} onClear={() => undefined} />);
    expect(screen.getByText('acc-9999')).toBeInTheDocument();
    expect(screen.getByText('Repricing loop suspected.')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});
