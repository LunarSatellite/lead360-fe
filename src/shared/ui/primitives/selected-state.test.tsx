import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { Button } from './index';

/**
 * A button that looks chosen must say it is chosen.
 *
 * 78 buttons in this admin change their styling to show they are the
 * selected filter, tab or view, and none of them announces it. A screen
 * reader reads "All" whether the All filter is on or off, so the one
 * thing those controls exist to communicate is the one thing that never
 * arrives.
 *
 * The 131-page WCAG suite passes over every one of them, and is right
 * to: a `<button>` with no state attribute is valid markup. Nothing in
 * the DOM says it was meant to be a toggle — only the ternary in its
 * className does, and axe does not read className ternaries. This is
 * the gap between "no automated violations" and "works".
 */

const WCAG = { runOnly: { type: 'tag' as const, values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } };

describe('Button, when it is one of a set', () => {
  it('announces that it is the chosen one', () => {
    render(<Button selected>Active</Button>);
    expect(screen.getByRole('button', { pressed: true })).toBeTruthy();
  });

  it('announces that it is not', () => {
    render(<Button selected={false}>Inactive</Button>);
    expect(screen.getByRole('button', { pressed: false })).toBeTruthy();
  });

  it('says nothing about pressing when it is an ordinary button', () => {
    /**
     * `aria-pressed="false"` on a Save button announces an unpressed
     * toggle, which is a worse answer than no answer.
     */
    const { container } = render(<Button>Save</Button>);
    expect(container.querySelector('[aria-pressed]')).toBeNull();
  });

  it('looks different in the two states', () => {
    /** A state nobody can see is as useless as one nobody can hear. */
    const on = render(<Button selected>On</Button>).container.querySelector('button')!.className;
    const off = render(<Button selected={false}>Off</Button>).container.querySelector('button')!.className;
    expect(on).not.toBe(off);
  });

  it('meets WCAG 2.1 AA in both states, in a group', async () => {
    const { container } = render(
      <main>
        <div role="group" aria-label="Filter by status">
          <Button selected>All</Button>
          <Button selected={false}>Active</Button>
          <Button selected={false}>Paused</Button>
        </div>
      </main>,
    );
    const results = await axe.run(container, WCAG);
    expect(results.violations.map((v) => v.id)).toEqual([]);
  });

  it('is what a hand-rolled toggle is missing', async () => {
    /**
     * Proof of the claim this file opens with: the hand-written shape
     * passes axe cleanly while telling a screen reader nothing. If this
     * ever starts failing, axe has gained a rule and the guard below
     * can be reconsidered.
     */
    const { container } = render(
      <main>
        <button type="button" className="bg-brand text-bg">All</button>
        <button type="button" className="text-text-muted">Active</button>
      </main>,
    );
    const results = await axe.run(container, WCAG);
    expect(results.violations.map((v) => v.id)).toEqual([]);
    expect(container.querySelector('[aria-pressed]')).toBeNull();
  });
});
