import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight, Search, X } from 'lucide-react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { cn, FOCUS_RING } from '@/shared/ui/primitives';
import { navAliases, navGroups, navSections, type NavGroup, type NavItem } from './nav-model';

/**
 * The sidebar rail, grouped.
 *
 * Replaces four flat arrays rendered one after another with twelve groups, one
 * open at a time. The one containing the current page opens by itself, so the
 * rail answers "where am I" without being asked.
 *
 * A filter sits above them because twelve groups are still twelve groups: an
 * operator who knows the page they want should not have to know which group we
 * decided it belongs to. It matches the names the old rails used as well as the
 * current one, so someone who learned "Organizations" still finds Stores.
 */

/** The old name for a page, by the name it goes under now. */
const aliasesByLabel = navAliases.reduce<Record<string, string[]>>((acc, a) => {
  (acc[a.label] ??= []).push(a.alsoKnownAs);
  return acc;
}, {});

const matches = (item: NavItem, needle: string) =>
  item.label.toLowerCase().includes(needle) ||
  (aliasesByLabel[item.label] ?? []).some((a) => a.toLowerCase().includes(needle));

function isItemActive(item: NavItem, pathname: string) {
  return item.end ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + '/');
}

/**
 * Longest href wins. Without it `/dashboard` — which is a nav entry — claims
 * every page in the admin, and the rail would report the wrong group as the
 * one you are in.
 */
function groupHolding(pathname: string): NavGroup | undefined {
  let best: NavGroup | undefined;
  let bestLength = -1;
  for (const group of navGroups) {
    for (const item of group.items) {
      if (isItemActive(item, pathname) && item.href.length > bestLength) {
        best = group;
        bestLength = item.href.length;
      }
    }
  }
  return best;
}

export interface SidebarNavProps {
  expanded: boolean;
  /**
   * Raised while the rail must not collapse. The sidebar expands on hover, so
   * without this, typing in the filter and then moving the mouse towards the
   * results closes the rail and throws the search away.
   */
  onHoldOpen?: (hold: boolean) => void;
}

export function SidebarNav({ expanded, onHoldOpen }: SidebarNavProps) {
  const { pathname } = useLocation();
  const [filter, setFilter] = useState('');
  const [filterFocused, setFilterFocused] = useState(false);
  const [openedByHand, setOpenedByHand] = useState<string | null>(null);
  const [closedByHand, setClosedByHand] = useState<string | null>(null);
  const filterRef = useRef<HTMLInputElement>(null);

  const activeGroupId = groupHolding(pathname)?.id;
  const needle = filter.trim().toLowerCase();

  const hold = filterFocused || needle.length > 0;
  useEffect(() => onHoldOpen?.(hold), [hold, onHoldOpen]);

  const shown = useMemo(() => {
    if (!needle) return navGroups;
    return navGroups
      .map((g) => ({ ...g, items: g.items.filter((i) => matches(i, needle)) }))
      .filter((g) => g.items.length > 0);
  }, [needle]);

  /**
   * What is open when nothing has been clicked: the group holding the current
   * page, or else the first commerce group. Landing on an empty rail would
   * make an operator open something to find out what this admin is for, and
   * the answer to that is commerce, not whichever section sorts first.
   */
  const defaultGroupId = activeGroupId ?? navGroups.find((g) => g.section === 'commerce')?.id;

  // While filtering, every surviving group is open — hiding a match behind a
  // collapsed header would make the filter look broken.
  const isOpen = (groupId: string) => {
    if (needle) return true;
    if (openedByHand) return groupId === openedByHand;
    if (closedByHand === groupId) return false;
    return groupId === defaultGroupId;
  };

  const toggle = (groupId: string) => {
    if (isOpen(groupId)) {
      setOpenedByHand(null);
      setClosedByHand(groupId);
    } else {
      setOpenedByHand(groupId);
      setClosedByHand(null);
    }
  };

  /**
   * Collapsed, there is room for one column of icons and nothing else. One
   * icon per group beats 130 undifferentiated ones, and the active group is
   * marked so the rail still says where you are.
   *
   * Links, not divs. The first version drew these as `<div>`s, which made
   * the rail a scrollable region containing nothing focusable: a keyboard
   * user could neither reach it nor scroll it, and axe reported
   * `scrollable-region-focusable` on all 131 pages of the admin — one cause,
   * every page, because it is in the shell. It was also simply wrong as a
   * product: clicking a group icon should go to that group.
   */
  if (!expanded) {
    return (
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-1.5 py-2" aria-label="Sections">
        {navSections.map((section, index) => (
          <div key={section.id} className="flex flex-col gap-0.5">
            {index > 0 && <div className="mx-auto my-2 h-px w-6 bg-border-subtle" />}
            {navGroups
              .filter((g) => g.section === section.id)
              .map((group) => (
                <Link
                  key={group.id}
                  to={group.items[0].href}
                  title={`${section.label} — ${group.label}`}
                  aria-label={`${section.label} — ${group.label}`}
                  aria-current={group.id === activeGroupId ? 'true' : undefined}
                  className={cn(
                    'relative flex items-center justify-center rounded-xl py-2 transition-colors',
                    FOCUS_RING,
                    group.id === activeGroupId
                      ? 'bg-brand-soft text-brand'
                      : 'text-text-muted hover:bg-glass-1 hover:text-text-secondary',
                  )}
                >
                  {group.id === activeGroupId && (
                    <span className="absolute bottom-1 left-0 top-1 w-[2.5px] rounded-r-full bg-gradient-to-b from-brand-light to-brand" />
                  )}
                  <group.icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.5} />
                </Link>
              ))}
          </div>
        ))}
      </nav>
    );
  }

  return (
    <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-2" aria-label="Sections">
      <div className="relative mb-2">
        <Search
          className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted"
          strokeWidth={1.8}
        />
        <input
          ref={filterRef}
          type="search"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          onFocus={() => setFilterFocused(true)}
          onBlur={() => setFilterFocused(false)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setFilter('');
              filterRef.current?.blur();
            }
          }}
          placeholder="Find a page"
          aria-label="Filter navigation"
          className="w-full rounded-xl border-thin border-border-subtle bg-glass-1 py-1.5 pl-8 pr-7 text-xs text-text-primary placeholder:text-text-muted focus:border-border-medium focus:outline-none"
        />
        {filter && (
          <button
            type="button"
            onClick={() => setFilter('')}
            aria-label="Clear filter"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
          >
            <X className="h-3 w-3" strokeWidth={2} />
          </button>
        )}
      </div>

      {shown.length === 0 && (
        <p className="px-3 py-4 text-xs text-text-muted">No page matches “{filter.trim()}”.</p>
      )}

      {navSections.map((section) => {
        const groups = shown.filter((g) => g.section === section.id);
        if (groups.length === 0) return null;

        // Commerce is what this admin is for, so it carries the brand mark on
        // its group icons and the others do not. Weight, not visibility: the
        // CRM's 68 pages are all still one click away.
        const leading = section.id === 'commerce';

        return (
          <div key={section.id} className="mb-1">
            <div className="flex items-center gap-2 px-2.5 pb-1 pt-3 first:pt-0">
              <span
                className={`text-[8px] font-bold uppercase tracking-[2px] ${
                  leading ? 'text-text-secondary' : 'text-text-muted'
                }`}
              >
                {section.label}
              </span>
              <div className="h-px flex-1 bg-border-subtle" />
            </div>
            <div className="flex flex-col gap-0.5">
              {groups.map((group) => {
                const open = isOpen(group.id);
                return (
                  <div key={group.id}>
                    <button
                      type="button"
                      onClick={() => toggle(group.id)}
                      aria-expanded={open}
                      aria-controls={`nav-group-${group.id}`}
                      className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 transition-colors hover:bg-glass-1 ${
                        group.id === activeGroupId
                          ? 'text-text-primary'
                          : leading
                            ? 'text-text-secondary'
                            : 'text-text-muted'
                      }`}
                    >
                      <div
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-lg ${
                          leading ? 'bg-brand-soft' : 'bg-glass-1'
                        }`}
                      >
                        <group.icon
                          className={`h-[11px] w-[11px] ${leading ? 'text-brand' : 'text-text-muted'}`}
                          strokeWidth={2}
                        />
                      </div>
                      <span className="flex-1 text-left text-[9px] font-bold uppercase tracking-[1.5px]">
                        {group.label}
                      </span>
                      <ChevronRight
                        className={`h-3 w-3 shrink-0 text-text-muted transition-transform duration-200 ${
                          open ? 'rotate-90' : ''
                        }`}
                        strokeWidth={2}
                      />
                    </button>

                    {open && (
                      <div id={`nav-group-${group.id}`} className="mb-1 mt-0.5 flex flex-col gap-0.5">
                        {group.items.map((item) => {
                          const active = isItemActive(item, pathname);
                          return (
                            <NavLink
                              key={item.href}
                              to={item.href}
                              title={item.label}
                              className={`sidebar-nav-item group relative flex items-center gap-3 rounded-xl py-2 pl-5 pr-3 transition-all duration-200 ${
                                active
                                  ? 'bg-gradient-to-r from-brand/[0.18] via-brand/[0.06] to-transparent font-semibold text-text-primary'
                                  : 'text-text-muted hover:bg-glass-1 hover:text-text-secondary'
                              }`}
                            >
                              {active && (
                                <div className="absolute left-0 bottom-1 top-1 w-[2.5px] rounded-r-full bg-gradient-to-b from-brand-light to-brand" />
                              )}
                              <item.icon
                                className={`h-[18px] w-[18px] shrink-0 transition-colors ${active ? 'text-brand' : ''}`}
                                strokeWidth={1.5}
                              />
                              <span className="overflow-hidden whitespace-nowrap text-xs">{item.label}</span>
                              {item.badge && (
                                <span className="ml-auto rounded-md bg-violet-soft px-1.5 py-0.5 text-[9px] font-bold text-violet-light">
                                  {item.badge}
                                </span>
                              )}
                            </NavLink>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );
}
