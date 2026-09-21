import { useMemo, useState, type ReactNode } from 'react';
import { ArrowDown, ArrowUp, ChevronsUpDown, Loader2, Inbox } from 'lucide-react';

export interface Column<T> {
  header: string;
  /** Key into the row, used for default value extraction and sorting. */
  accessor: keyof T;
  align?: 'left' | 'right';
  /** Format the raw cell value to a display string. */
  format?: (value: T[keyof T], row: T) => string;
  /** Full custom cell (badges, links). Takes precedence over `format`. */
  render?: (row: T) => ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
  /** When set, clicking a row drills into the records behind it. */
  onRowClick?: (row: T) => void;
}

type SortState<T> = { key: keyof T; dir: 'asc' | 'desc' } | null;

/**
 * Reusable table driven by declarative column defs — keeps a single component
 * usable across every report table. Numbers right-align + use mono/tabular nums.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  isLoading,
  isEmpty,
  emptyMessage = 'No rows yet.',
  onRowClick,
}: DataTableProps<T>) {
  const [sort, setSort] = useState<SortState<T>>(null);

  const sortedRows = useMemo(() => {
    if (!sort) return rows;
    const next = [...rows].sort((a, b) => {
      const av = a[sort.key];
      const bv = b[sort.key];
      if (typeof av === 'number' && typeof bv === 'number') return av - bv;
      return String(av ?? '').localeCompare(String(bv ?? ''));
    });
    return sort.dir === 'desc' ? next.reverse() : next;
  }, [rows, sort]);

  const toggleSort = (key: keyof T) =>
    setSort((prev) =>
      prev?.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' },
    );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10 text-text-muted">
        <Loader2 className="w-5 h-5 animate-spin" strokeWidth={1.6} />
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
        <Inbox className="w-5 h-5 text-text-muted" strokeWidth={1.6} />
        <p className="text-xs text-text-muted">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-thin border-border-subtle">
            {columns.map((col) => {
              const active = sort?.key === col.accessor;
              const right = col.align === 'right';
              return (
                <th
                  key={String(col.accessor)}
                  className={`px-3 py-2.5 text-2xs font-bold uppercase tracking-wider text-text-muted ${right ? 'text-right' : 'text-left'}`}
                >
                  {col.sortable ? (
                    <button
                      onClick={() => toggleSort(col.accessor)}
                      className={`inline-flex items-center gap-1 hover:text-text-secondary transition-colors ${right ? 'flex-row-reverse' : ''}`}
                    >
                      {col.header}
                      {active ? (
                        sort?.dir === 'asc' ? (
                          <ArrowUp className="w-3 h-3" strokeWidth={2} />
                        ) : (
                          <ArrowDown className="w-3 h-3" strokeWidth={2} />
                        )
                      ) : (
                        <ChevronsUpDown className="w-3 h-3 opacity-50" strokeWidth={2} />
                      )}
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row) => (
            <tr
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={`border-b border-thin border-border-subtle last:border-0 ${
                onRowClick ? 'cursor-pointer hover:bg-glass-2 transition-colors' : ''
              }`}
            >
              {columns.map((col) => {
                const right = col.align === 'right';
                return (
                  <td
                    key={String(col.accessor)}
                    className={`px-3 py-2.5 max-w-[220px] truncate ${
                      right ? 'text-right font-mono tabular-nums text-text-secondary' : 'text-text-primary'
                    }`}
                  >
                    {col.render
                      ? col.render(row)
                      : col.format
                        ? col.format(row[col.accessor], row)
                        : String(row[col.accessor] ?? '')}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
