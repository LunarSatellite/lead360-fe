import { useMemo, useState } from 'react';
import { ChevronRight, Search, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button, cn } from '@/shared/ui/primitives';
import { vendorSectionGroups, type VendorSection } from '../vendor-sections';

/**
 * The vendor console's own navigation, beside its content instead of above it.
 *
 * It replaces a grid of 31 cards that pushed the actual content below the
 * fold on every visit, and held the selection in component state so a section
 * could not be linked to, bookmarked, or reached with the Back button.
 *
 * Deliberately a second, narrower rail rather than more entries in the main
 * one: these are sections *of* vendor operations, and promoting them to the
 * product-level rail would put 31 more items in a list whose whole problem
 * was length. The main rail answers "which part of the product"; this answers
 * "which part of this part".
 */

export interface VendorSideMenuProps {
  /** The section currently open, so the menu can mark and reveal it. */
  current: VendorSection;
  /** Builds the link for a section key. */
  hrefFor: (key: string) => string;
  /** Rows already loaded, by section key — drawn as a count beside the name. */
  counts?: Record<string, number | null | undefined>;
}

export function VendorSideMenu({ current, hrefFor, counts }: VendorSideMenuProps) {
  const [filter, setFilter] = useState('');
  const needle = filter.trim().toLowerCase();

  const openGroupId = useMemo(
    () => vendorSectionGroups.find((g) => g.sections.some((s) => s.key === current.key))?.id,
    [current.key],
  );
  const [openedByHand, setOpenedByHand] = useState<string | null>(null);

  const shown = useMemo(() => {
    if (!needle) return vendorSectionGroups;
    return vendorSectionGroups
      .map((g) => ({
        ...g,
        sections: g.sections.filter(
          (s) =>
            s.label.toLowerCase().includes(needle) ||
            s.description.toLowerCase().includes(needle),
        ),
      }))
      .filter((g) => g.sections.length > 0);
  }, [needle]);

  // While filtering every surviving group is open; otherwise one at a time,
  // starting with the one holding the section you are on.
  const isOpen = (id: string) => (needle ? true : id === (openedByHand ?? openGroupId));

  return (
    <nav
      aria-label="Vendor sections"
      className="flex w-full shrink-0 flex-col gap-1 lg:w-60"
    >
      <div className="relative mb-1">
        <Search
          className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted"
          strokeWidth={1.8}
        />
        <input
          type="search"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Find a section"
          aria-label="Filter vendor sections"
          className="w-full rounded-xl border border-border-subtle bg-bg-input py-1.5 pl-8 pr-7 text-xs text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
        />
        {filter && (
          <button
            type="button"
            onClick={() => setFilter('')}
            aria-label="Clear section filter"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
          >
            <X className="h-3 w-3" strokeWidth={2} />
          </button>
        )}
      </div>

      {shown.length === 0 && (
        <p className="px-2 py-3 text-xs text-text-muted">No section matches “{filter.trim()}”.</p>
      )}

      {shown.map((group) => {
        const open = isOpen(group.id);
        return (
          <div key={group.id}>
            <Button
              type="button"
              onClick={() => setOpenedByHand(open ? '' : group.id)}
              aria-expanded={open}
              aria-controls={`vendor-group-${group.id}`}
              variant="ghost" size="sm" block
            >
              <span className="flex-1 text-left text-[9px] font-bold uppercase tracking-[1.5px]">
                {group.label}
              </span>
              <ChevronRight
                className={cn(
                  'h-3 w-3 shrink-0 text-text-muted transition-transform duration-200',
                  open && 'rotate-90',
                )}
                strokeWidth={2}
              />
            </Button>

            {open && (
              <div id={`vendor-group-${group.id}`} className="mb-1 mt-0.5 flex flex-col gap-0.5">
                {group.sections.map((section) => {
                  const active = section.key === current.key;
                  const count = counts?.[section.key];
                  return (
                    // Link, not NavLink: NavLink derives `aria-current` from
                    // the URL and overrides the prop, so on the bare
                    // /stylemint/vendor path — where the default section is
                    // open but its own href is not in the URL — nothing was
                    // marked current. The page already knows which section
                    // is open, so it is the one that should say.
                    <Link
                      key={section.key}
                      to={hrefFor(section.key)}
                      title={section.description}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'relative flex items-center gap-2.5 rounded-xl py-2 pl-5 pr-2.5 transition-colors',
                        active
                          ? 'bg-gradient-to-r from-brand/[0.18] via-brand/[0.06] to-transparent font-semibold text-text-primary'
                          : 'text-text-muted hover:bg-glass-1 hover:text-text-secondary',
                      )}
                    >
                      {active && (
                        <span className="absolute bottom-1 left-0 top-1 w-[2.5px] rounded-r-full bg-gradient-to-b from-brand-light to-brand" />
                      )}
                      <section.icon
                        className={cn('h-[15px] w-[15px] shrink-0', active && 'text-brand')}
                        strokeWidth={1.6}
                      />
                      <span className="flex-1 truncate text-xs">{section.label}</span>
                      {/* Only sections already fetched have a count. Showing one
                          for all 31 is what made this page fetch 31 endpoints
                          before an operator had chosen anything. */}
                      {typeof count === 'number' && (
                        <span className="shrink-0 text-[10px] font-bold text-text-muted">
                          {count}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
