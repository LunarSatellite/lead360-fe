import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { DecisionDialog } from './DecisionDialog';
import { GovernanceRefusalNotice } from './GovernanceRefusalNotice';
import { GovernanceError } from '../api/agent-governance.api';
import { actionFixture } from '../lib/__fixtures__/governed-actions';

const now = new Date('2026-09-19T10:01:00Z');

function renderDialog(decision: 'approve' | 'reject', onConfirm = vi.fn()) {
  render(
    <DecisionDialog
      action={actionFixture()}
      decision={decision}
      now={now}
      pending={false}
      error={null}
      onCancel={() => undefined}
      onConfirm={onConfirm}
    />,
  );
  return onConfirm;
}

describe('a decision carries the reviewer’s reasoning', () => {
  it('will not send an approval until the reviewer has written why', () => {
    const onConfirm = renderDialog('approve');
    expect(screen.getByTestId('decision-confirm')).toBeDisabled();

    fireEvent.change(screen.getByTestId('decision-reasoning'), {
      target: { value: 'Checked the price floor and the vendor agreement.' },
    });

    const confirm = screen.getByTestId('decision-confirm');
    expect(confirm).toBeEnabled();
    fireEvent.click(confirm);
    expect(onConfirm).toHaveBeenCalledWith('Checked the price floor and the vendor agreement.');
  });

  it('sends the rejection reasoning too', () => {
    const onConfirm = renderDialog('reject');
    fireEvent.change(screen.getByTestId('decision-reasoning'), {
      target: { value: 'The discount breaches the vendor floor price.' },
    });
    fireEvent.click(screen.getByTestId('decision-confirm'));
    expect(onConfirm).toHaveBeenCalledWith('The discount breaches the vendor floor price.');
  });

  it('starts empty every time — no remembered or prefilled reasoning', () => {
    renderDialog('approve');
    expect(screen.getByTestId('decision-reasoning')).toHaveValue('');
  });

  it('rejects a token keystroke as reasoning', () => {
    renderDialog('approve');
    fireEvent.change(screen.getByTestId('decision-reasoning'), { target: { value: 'ok' } });
    expect(screen.getByTestId('decision-confirm')).toBeDisabled();
  });

  it('says where the approval note goes, since the approve endpoint accepts no reason', () => {
    renderDialog('approve');
    expect(screen.getByText(/accepts no reason field/i)).toBeInTheDocument();
  });

  it('says the rejection reason is sent to the server', () => {
    renderDialog('reject');
    expect(screen.getByText(/sent as the rejection reason/i)).toBeInTheDocument();
  });

  it('tells the reviewer the window approving opens, and that approving does not run it', () => {
    renderDialog('approve');
    expect(screen.getByText(/5 minute/)).toBeInTheDocument();
    expect(screen.getByText(/Approving does not run the action/)).toBeInTheDocument();
  });

  it('shows the tier as a badge and offers no way to set one', () => {
    renderDialog('approve');
    expect(screen.getByTestId('risk-tier')).toHaveTextContent('Critical risk');
    // The only field in the dialog is the reasoning note.
    expect(screen.getAllByRole('textbox')).toHaveLength(1);
    expect(screen.queryByRole('combobox')).toBeNull();
    expect(screen.queryByRole('spinbutton')).toBeNull();
  });
});

describe('the three failures reach the reviewer in their own words', () => {
  const refusalFor = (code: string) => {
    const { unmount } = render(
      <GovernanceRefusalNotice error={new GovernanceError({ errorCode: code }, 400)} />,
    );
    const notice = screen.getByTestId('governance-refusal');
    const text = notice.textContent ?? '';
    unmount();
    return text;
  };

  it('never shows the same words for expired, already-used and scope-changed', () => {
    const texts = [
      refusalFor('governance.approval_expired'),
      refusalFor('governance.approval_already_used'),
      refusalFor('governance.approval_scope_changed'),
    ];
    expect(new Set(texts).size).toBe(3);
    expect(texts[0]).toMatch(/Propose the action again/i);
    expect(texts[1]).toMatch(/Refresh the record/i);
    expect(texts[2]).toMatch(/Re-read the proposal/i);
  });

  it('offers a refresh affordance only where refreshing is the right move', () => {
    const onRefresh = vi.fn();
    const { unmount } = render(
      <GovernanceRefusalNotice
        error={new GovernanceError({ errorCode: 'governance.approval_already_used' }, 400)}
        onRefresh={onRefresh}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /refresh the record/i }));
    expect(onRefresh).toHaveBeenCalled();
    unmount();

    render(
      <GovernanceRefusalNotice
        error={new GovernanceError({ errorCode: 'governance.approval_expired' }, 400)}
        onRefresh={onRefresh}
      />,
    );
    expect(screen.queryByRole('button', { name: /refresh the record/i })).toBeNull();
  });

  it('keeps the error code visible for escalation', () => {
    render(
      <GovernanceRefusalNotice
        error={new GovernanceError({ errorCode: 'governance.approval_scope_changed' }, 400)}
      />,
    );
    expect(screen.getByTestId('governance-refusal')).toHaveAttribute(
      'data-error-code',
      'governance.approval_scope_changed',
    );
  });
});
