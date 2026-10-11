import { useState } from 'react';
import { Building2, Check, Download, Package, Plus, RefreshCw, Trash2, Upload } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  IconButton,
  EmptyState,
  Field,
  Input,
  PageHeader,
  SearchInput,
  type ButtonVariant,
  type ControlSize,
} from '@/shared/ui/primitives';
import { navGroups, navSections } from '@/app/navigation/nav-model';

/**
 * Every primitive, in every state, on one page.
 *
 * The admin had no way to look at its own components. The only way to see
 * whether two buttons matched was to open two pages and remember — which is
 * how it ended up with 219 spellings of one button. This page makes a
 * mismatch visible in one glance, and it is also the place to look before
 * adding a primitive, to find the one that already does the job.
 *
 * It renders no data and calls no API on purpose: it has to be openable when
 * the backend is down, which is exactly when someone is most likely to be
 * looking at the UI rather than at the data.
 */

const VARIANTS: ButtonVariant[] = ['primary', 'soft', 'secondary', 'ghost', 'danger'];
const SIZES: ControlSize[] = ['sm', 'md', 'lg'];

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-bold text-text-primary">{title}</h2>
        {note && <p className="mt-0.5 text-xs text-text-muted">{note}</p>}
      </div>
      <Card className="p-5">{children}</Card>
    </section>
  );
}

export function Component() {
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);

  const pages = navGroups.reduce((n, g) => n + g.items.length, 0);

  return (
    <div className="space-y-8 p-6">
      <PageHeader
        eyebrow="Reference"
        title="Design system"
        description={`The primitives every page is built from. ${pages} pages across ${navGroups.length} groups and ${navSections.length} sections use them.`}
        actions={
          <>
            <Button variant="secondary" icon={Download}>
              Export tokens
            </Button>
            <Button variant="primary" icon={Plus}>
              New component
            </Button>
          </>
        }
      />

      <Section
        title="Button"
        note="Five variants, three sizes. Previously 219 distinct spellings of the first one."
      >
        <div className="space-y-4">
          {VARIANTS.map((variant) => (
            <div key={variant} className="flex flex-wrap items-center gap-3">
              <span className="w-20 shrink-0 text-[10px] font-bold uppercase tracking-widest text-text-muted">
                {variant}
              </span>
              {SIZES.map((size) => (
                <Button key={size} variant={variant} size={size} icon={Package}>
                  {size}
                </Button>
              ))}
              <Button variant={variant} icon={Check}>
                With icon
              </Button>
              <Button variant={variant} loading>
                Loading
              </Button>
              <Button variant={variant} disabled>
                Disabled
              </Button>
            </div>
          ))}

          <div className="flex flex-wrap items-center gap-3 border-t border-border-subtle pt-4">
            <span className="w-20 shrink-0 text-[10px] font-bold uppercase tracking-widest text-text-muted">
              block
            </span>
            <div className="min-w-[240px] flex-1">
              <Button
                variant="primary"
                block
                icon={RefreshCw}
                loading={busy}
                onClick={() => {
                  setBusy(true);
                  window.setTimeout(() => setBusy(false), 1200);
                }}
              >
                {busy ? 'Working' : 'Click to see the loading state'}
              </Button>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Field and Input" note="Label, hint, error and the invalid state, all wired up.">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Vendor name" required hint="As it appears on the invoice.">
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                aria-describedby={describedBy}
                invalid={invalid}
                icon={Building2}
                placeholder="Acme Supplies Ltd."
              />
            )}
          </Field>

          <Field label="Custom domain" error="That domain is already in use.">
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                aria-describedby={describedBy}
                invalid={invalid}
                defaultValue="book.example.com"
              />
            )}
          </Field>

          <Field label="Search" hint="type=search, so Escape clears it">
            {({ id }) => (
              <SearchInput
                id={id}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Find a vendor"
              />
            )}
          </Field>

          <Field label="Disabled">{({ id }) => <Input id={id} disabled defaultValue="Not editable" />}</Field>
        </div>
      </Section>

      <Section
        title="IconButton"
        note="The row actions in every table. `label` is required, so one cannot ship unnamed."
      >
        <div className="flex flex-wrap items-center gap-3">
          {SIZES.map((size) => (
            <div key={size} className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">{size}</span>
              <IconButton icon={Plus} label={`Add (${size})`} variant="primary" size={size} />
              <IconButton icon={RefreshCw} label={`Refresh (${size})`} size={size} />
              <IconButton icon={Trash2} label={`Delete (${size})`} variant="ghost" size={size} />
            </div>
          ))}
        </div>
      </Section>

      <Section title="Badge" note="Five tones, each resolving through the product's own palette.">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>Neutral</Badge>
          <Badge tone="brand">Brand</Badge>
          <Badge tone="success">Paid</Badge>
          <Badge tone="warning">Pending</Badge>
          <Badge tone="danger">Failed</Badge>
        </div>
      </Section>

      <Section title="EmptyState" note="What a list shows when it has nothing — instead of blank space.">
        <EmptyState
          icon={Upload}
          title="No vendors yet"
          description="Invite a vendor, or import a list to get started."
          action={
            <div className="flex gap-2">
              <Button variant="secondary" icon={Upload}>
                Import
              </Button>
              <Button variant="primary" icon={Plus}>
                Invite vendor
              </Button>
            </div>
          }
        />
      </Section>

      <Section title="In combination" note="A toolbar, the shape most list pages open with.">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="min-w-[200px] flex-1">
              <SearchInput aria-label="Search orders" placeholder="Order number or customer" />
            </div>
            <Button variant="secondary" size="sm" icon={RefreshCw}>
              Refresh
            </Button>
            <Button variant="soft" size="sm" icon={Download}>
              Export
            </Button>
            <Button variant="danger" size="sm" icon={Trash2}>
              Delete
            </Button>
            <Button variant="primary" size="sm" icon={Plus}>
              New order
            </Button>
          </div>
          <p className="text-xs text-text-muted">
            Every control on this row is the same height and radius. That is the whole claim.
          </p>
        </div>
      </Section>
    </div>
  );
}

export default Component;
