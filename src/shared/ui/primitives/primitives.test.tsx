import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Search, Trash2 } from 'lucide-react';
import { Button, IconButton } from './Button';
import { Field, Input, SearchInput } from './Field';
import { Badge, Card, EmptyState, PageHeader } from './Surface';

/**
 * The behaviour the primitives exist to get right once.
 *
 * Each of these is something a hand-rolled copy in this admin got wrong at
 * least once, which is the argument for having the primitive at all. They are
 * asserted as behaviour rather than as class names: a test that checks for
 * `px-4` only says the component still contains the string `px-4`.
 */

describe('Button', () => {
  it('does not submit the form it happens to be inside', () => {
    // A bare <button> defaults to type="submit". Several filter and toggle
    // buttons in this admin sit inside a form and reloaded the page.
    const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <Button>Filter</Button>
      </form>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Filter' }));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('still submits when asked to', () => {
    const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <Button type="submit">Save</Button>
      </form>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('stops taking clicks while loading, and says so', () => {
    // The usual hand-rolled failure: the spinner appears, the button stays
    // live, and an impatient operator sends the request three times.
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Save
      </Button>,
    );

    const button = screen.getByRole('button', { name: 'Save' });
    fireEvent.click(button);

    expect(onClick).not.toHaveBeenCalled();
    expect(button).toBeDisabled();
    expect(button.getAttribute('aria-busy')).toBe('true');
  });

  it('keeps its label while loading, so the row does not reflow', () => {
    render(<Button loading>Run scenario</Button>);
    expect(screen.getByRole('button', { name: 'Run scenario' })).toBeInTheDocument();
  });

  it('lets a caller override geometry without fighting the variant', () => {
    render(<Button className="w-64">Wide</Button>);
    expect(screen.getByRole('button', { name: 'Wide' }).className).toContain('w-64');
  });

  it('reserves the same box on every variant, bordered or not', () => {
    /**
     * A bordered variant beside an unbordered one is 2px taller, and a
     * toolbar mixing them does not line up. Measured in a browser before the
     * fix: a `md` primary was 34px and a `md` secondary 35.33px.
     *
     * jsdom computes no layout, so this asserts the cause rather than the
     * height: every variant declares a border width, and only the colour
     * differs.
     */
    for (const variant of ['primary', 'soft', 'secondary', 'ghost', 'danger'] as const) {
      const { unmount } = render(<Button variant={variant}>{variant}</Button>);
      const classes = screen.getByRole('button', { name: variant }).className.split(/\s+/);

      expect(classes, `${variant} has no border to size the box`).toContain('border');
      expect(
        classes.filter((c) => /^border-\d/.test(c)),
        `${variant} sets a second border width`,
      ).toEqual([]);
      unmount();
    }
  });

  it('carries a visible focus ring on every variant', () => {
    // Most hand-rolled buttons set focus:outline-none and nothing else, which
    // leaves a keyboard user with no cursor.
    for (const variant of ['primary', 'secondary', 'ghost', 'danger'] as const) {
      const { unmount } = render(<Button variant={variant}>{variant}</Button>);
      expect(screen.getByRole('button', { name: variant }).className).toContain('focus-visible:ring-2');
      unmount();
    }
  });
});

describe('IconButton', () => {
  it('always has an accessible name', () => {
    // One list page carried twelve icon-only buttons, none of them named. A
    // screen reader announced "button" twelve times in a row.
    render(<IconButton icon={Trash2} label="Delete Acme Supplies" variant="ghost" />);
    expect(screen.getByRole('button', { name: 'Delete Acme Supplies' })).toBeInTheDocument();
  });

  it('is square, not a short pill', () => {
    /**
     * `p-2` passed through className would not have worked: Tailwind emits
     * `p-*` before `px-*`, so the longhand the size scale sets wins whatever
     * order the class string is written in. The component has to not emit
     * the padding it does not want.
     */
    render(<IconButton icon={Trash2} label="Delete" />);
    const classes = screen.getByRole('button', { name: 'Delete' }).className.split(/\s+/);

    expect(classes).toContain('h-9');
    expect(classes).toContain('w-9');
    expect(classes.filter((c) => /^px-/.test(c))).toEqual([]);
  });

  it('shows the same text on hover as it gives assistive tech', () => {
    render(<IconButton icon={Trash2} label="Delete Acme Supplies" />);
    expect(screen.getByRole('button', { name: 'Delete Acme Supplies' })).toHaveAttribute(
      'title',
      'Delete Acme Supplies',
    );
  });
});

describe('Field', () => {
  it('attaches the label to the control, so clicking it focuses the input', () => {
    // The 208 hand-written labels in this admin were <p> and <span> elements
    // above an input. A screen reader announces such an input as unnamed.
    render(
      <Field label="Customer email">
        {({ id, describedBy, invalid }) => <Input id={id} aria-describedby={describedBy} invalid={invalid} />}
      </Field>,
    );

    // getByLabelText only resolves through a real label association, so this
    // query failing is the regression. Asserted as htmlFor/id too, because
    // the browser behaviour it buys — clicking the label focuses the field —
    // is not implemented by jsdom and so cannot be checked here directly.
    const input = screen.getByLabelText('Customer email');
    const label = screen.getByText('Customer email');

    expect(label.tagName).toBe('LABEL');
    expect(label.getAttribute('for')).toBe(input.id);
  });

  it('ties a hint to the control rather than leaving it floating', () => {
    render(
      <Field label="Domain" hint="Without https://">
        {({ id, describedBy }) => <Input id={id} aria-describedby={describedBy} />}
      </Field>,
    );

    const input = screen.getByLabelText('Domain');
    const hint = screen.getByText('Without https://');
    expect(input.getAttribute('aria-describedby')).toBe(hint.id);
  });

  it('announces an error and marks the control invalid', () => {
    render(
      <Field label="Domain" error="That domain is already in use">
        {({ id, describedBy, invalid }) => <Input id={id} aria-describedby={describedBy} invalid={invalid} />}
      </Field>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('That domain is already in use');
    expect(screen.getByLabelText('Domain').getAttribute('aria-invalid')).toBe('true');
  });

  it('shows the error instead of the hint, not both', () => {
    render(
      <Field label="Domain" hint="Without https://" error="Already in use">
        {({ id }) => <Input id={id} />}
      </Field>,
    );

    expect(screen.queryByText('Without https://')).toBeNull();
    expect(screen.getByText('Already in use')).toBeInTheDocument();
  });

  it('gives each field its own id, so two on a page do not collide', () => {
    render(
      <>
        <Field label="First">{({ id }) => <Input id={id} />}</Field>
        <Field label="Second">{({ id }) => <Input id={id} />}</Field>
      </>,
    );

    expect(screen.getByLabelText('First').id).not.toBe(screen.getByLabelText('Second').id);
  });
});

describe('SearchInput', () => {
  it('is a search box, so assistive tech and the browser both know it', () => {
    render(<SearchInput aria-label="Find a vendor" />);
    expect(screen.getByRole('searchbox', { name: 'Find a vendor' })).toBeInTheDocument();
  });

  it('positions its own icon, which 116 pages were doing by hand', () => {
    render(<Input icon={Search} aria-label="Find" />);
    expect(screen.getByRole('textbox', { name: 'Find' }).className).toContain('pl-9');
  });
});

describe('Surfaces', () => {
  it('gives a page exactly one h1', () => {
    // Every page title in this admin was a styled div, so no page had a
    // heading to navigate by.
    render(<PageHeader eyebrow="Stylemint" title="Vendor operations" description="All of it." />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Vendor operations');
  });

  it('renders header actions beside the title', () => {
    render(<PageHeader title="Orders" actions={<Button>Export</Button>} />);
    expect(screen.getByRole('button', { name: 'Export' })).toBeInTheDocument();
  });

  it('says something when a list is empty rather than rendering blank space', () => {
    render(<EmptyState title="No vendors yet" description="Invite one to get started." />);
    expect(screen.getByText('No vendors yet')).toBeInTheDocument();
    expect(screen.getByText('Invite one to get started.')).toBeInTheDocument();
  });

  it('passes through the attributes a card is given', () => {
    render(
      <Card data-testid="panel" className="p-4">
        <Badge tone="success">Live</Badge>
      </Card>,
    );

    expect(screen.getByTestId('panel').className).toContain('p-4');
    expect(screen.getByText('Live')).toBeInTheDocument();
  });
});
