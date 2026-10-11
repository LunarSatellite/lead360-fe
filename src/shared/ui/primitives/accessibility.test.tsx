import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import axe from 'axe-core';
import { Building2, Plus, RefreshCw, Trash2, Upload } from 'lucide-react';
import { Badge, Button, Card, EmptyState, Field, IconButton, Input, PageHeader, SearchInput } from './index';

/**
 * The primitives, measured against WCAG 2.1 AA by axe-core.
 *
 * Every other check in this folder is one I invented: count the hand-rolled
 * buttons, count the unnamed controls. They are useful, but they measure
 * what I thought to look for. axe is the industry's list, maintained by
 * people who do this full time, and it has already found something none of
 * mine did — the error text in `Field` was #F43F5E on a dark card, which is
 * 4.39:1 against a 4.5:1 floor. Close enough to look fine and still a
 * failure. `--color-danger-light` exists because of this rule.
 *
 * jsdom computes no layout, so the colour-contrast rule cannot run here;
 * that one is checked in a browser. What runs here is everything structural
 * — names, roles, labels, nesting, duplicate ids — on every primitive and
 * on compositions of them, on every pull request.
 */

const WCAG = { runOnly: { type: 'tag' as const, values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } };

async function violationsIn(ui: React.ReactElement) {
  const { container } = render(ui);
  const results = await axe.run(container, WCAG);
  return results.violations.map(
    (v) => `${v.id} (${v.impact}) on ${v.nodes.length}: ${v.nodes[0]?.html.slice(0, 80)}`,
  );
}

describe('the primitives meet WCAG 2.1 AA', () => {
  it('Button, in every variant and state', async () => {
    expect(
      await violationsIn(
        <main>
          {(['primary', 'soft', 'secondary', 'ghost', 'danger'] as const).map((variant) => (
            <div key={variant}>
              <Button variant={variant}>Save</Button>
              <Button variant={variant} icon={Plus}>
                Add
              </Button>
              <Button variant={variant} loading>
                Saving
              </Button>
              <Button variant={variant} disabled>
                Unavailable
              </Button>
            </div>
          ))}
        </main>,
      ),
    ).toEqual([]);
  });

  it('IconButton, which has no visible text at all', async () => {
    expect(
      await violationsIn(
        <main>
          <IconButton icon={Trash2} label="Delete vendor" variant="ghost" />
          <IconButton icon={RefreshCw} label="Refresh list" />
          <IconButton icon={Plus} label="Add row" variant="primary" size="sm" />
        </main>,
      ),
    ).toEqual([]);
  });

  it('Field, with a hint and with an error', async () => {
    expect(
      await violationsIn(
        <main>
          <Field label="Vendor name" required hint="As it appears on the invoice.">
            {({ id, describedBy, invalid }) => (
              <Input id={id} aria-describedby={describedBy} invalid={invalid} icon={Building2} />
            )}
          </Field>
          <Field label="Custom domain" error="That domain is already in use.">
            {({ id, describedBy, invalid }) => (
              <Input id={id} aria-describedby={describedBy} invalid={invalid} />
            )}
          </Field>
        </main>,
      ),
    ).toEqual([]);
  });

  it('two Fields together, which must not share an id', async () => {
    expect(
      await violationsIn(
        <main>
          <Field label="First">{({ id }) => <Input id={id} />}</Field>
          <Field label="Second">{({ id }) => <Input id={id} />}</Field>
        </main>,
      ),
    ).toEqual([]);
  });

  it('the surfaces: header, card, badges, empty state', async () => {
    expect(
      await violationsIn(
        <main>
          <PageHeader
            eyebrow="Stylemint"
            title="Vendor operations"
            description="Everything, in one place."
            actions={<Button variant="primary">Export</Button>}
          />
          <Card>
            <Badge>Neutral</Badge>
            <Badge tone="brand">Brand</Badge>
            <Badge tone="success">Paid</Badge>
            <Badge tone="warning">Pending</Badge>
            <Badge tone="danger">Failed</Badge>
          </Card>
          <EmptyState
            icon={Upload}
            title="No vendors yet"
            description="Invite one to get started."
            action={<Button variant="primary">Invite vendor</Button>}
          />
        </main>,
      ),
    ).toEqual([]);
  });

  it('a toolbar — the shape most list pages open with', async () => {
    expect(
      await violationsIn(
        <main>
          <SearchInput aria-label="Search orders" placeholder="Order number or customer" />
          <IconButton icon={RefreshCw} label="Refresh" size="sm" />
          <Button variant="soft" size="sm">
            Export
          </Button>
          <Button variant="primary" size="sm" icon={Plus}>
            New order
          </Button>
        </main>,
      ),
    ).toEqual([]);
  });

  it('catches a violation when one is introduced', async () => {
    /**
     * Proof the harness is wired up. An input with no name is the defect
     * this whole line of work has been about, and axe must see it — a suite
     * of green a11y tests that cannot go red is worse than none, because it
     * reads as evidence.
     */
    const found = await violationsIn(
      <main>
        <input type="text" />
      </main>,
    );
    expect(found.join(' ')).toMatch(/label/i);
  });
});
