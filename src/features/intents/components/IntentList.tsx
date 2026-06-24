import { useState } from 'react';
import {
  Power, PowerOff, Pencil, Trash2, Loader2,
  ArrowUpDown, ArrowUp, ArrowDown,
} from 'lucide-react';
import { IntentOperationBadge } from './IntentOperationBadge';
import { IntentKeywordTags } from './IntentKeywordTags';
import { StatusBadge } from '@/shared/components';
import { useToggleIntentActive, useDeleteIntent } from '../api/intents.queries';
import {
  INTENT_TRACK_LABEL, INTENT_TRACK_COLOR,
} from '../types/intents.types';
import type { IntentDto } from '../types/intents.types';
import { formatDistanceToNow } from 'date-fns';

type SortField = 'name' | 'operationType' | 'level' | 'createdAt' | 'sortOrder';
type SortDir = 'asc' | 'desc';

interface IntentListProps {
  intents: IntentDto[];
  onEdit: (intent: IntentDto) => void;
  filter: string;
  operationFilter: number | null;
}

export function IntentList({ intents, onEdit, filter, operationFilter }: IntentListProps) {
  const [sortField, setSortField] = useState<SortField>('sortOrder');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  // Filter
  const lowerFilter = filter.toLowerCase();
  let filtered = intents.filter((i) => {
    const matchesText =
      !filter ||
      i.name.toLowerCase().includes(lowerFilter) ||
      i.keywords?.toLowerCase().includes(lowerFilter) ||
      i.description?.toLowerCase().includes(lowerFilter);
    const matchesOp = operationFilter === null || i.operationType === operationFilter;
    return matchesText && matchesOp;
  });

  // Sort
  filtered = [...filtered].sort((a, b) => {
    let cmp = 0;
    switch (sortField) {
      case 'name':
        cmp = a.name.localeCompare(b.name);
        break;
      case 'operationType':
        cmp = a.operationType - b.operationType;
        break;
      case 'level':
        cmp = a.level - b.level;
        break;
      case 'createdAt':
        cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      case 'sortOrder':
      default:
        cmp = a.sortOrder - b.sortOrder;
        break;
    }
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field)
      return <ArrowUpDown className="w-3 h-3 opacity-30" strokeWidth={1.6} />;
    return sortDir === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-brand" strokeWidth={1.8} />
    ) : (
      <ArrowDown className="w-3 h-3 text-brand" strokeWidth={1.8} />
    );
  };

  return (
    <div className="bg-glass-1 border border-border-subtle rounded-2xl overflow-hidden">
      {/* Table header */}
      <div className="grid grid-cols-[1fr_140px_140px_80px_100px_120px] gap-3 px-5 py-3 border-b border-b-border-subtle text-2xs font-bold uppercase tracking-[2px] text-text-muted">
        <button onClick={() => handleSort('name')} className="flex items-center gap-1.5 hover:text-text-secondary transition-colors text-left">
          Name <SortIcon field="name" />
        </button>
        <button onClick={() => handleSort('operationType')} className="flex items-center gap-1.5 hover:text-text-secondary transition-colors text-left">
          Operation <SortIcon field="operationType" />
        </button>
        <span>Keywords</span>
        <button onClick={() => handleSort('level')} className="flex items-center gap-1.5 hover:text-text-secondary transition-colors text-left">
          Level <SortIcon field="level" />
        </button>
        <button onClick={() => handleSort('createdAt')} className="flex items-center gap-1.5 hover:text-text-secondary transition-colors text-left">
          Created <SortIcon field="createdAt" />
        </button>
        <span className="text-right">Actions</span>
      </div>

      {/* Rows */}
      {filtered.length === 0 ? (
        <div className="flex items-center justify-center py-12 text-sm text-text-muted">
          No intents match your filter
        </div>
      ) : (
        filtered.map((intent) => (
          <IntentRow key={intent.id} intent={intent} onEdit={onEdit} />
        ))
      )}
    </div>
  );
}

// ─── Row ───

function IntentRow({ intent, onEdit }: { intent: IntentDto; onEdit: (intent: IntentDto) => void }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const toggleActive = useToggleIntentActive();
  const remove = useDeleteIntent();

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    remove.mutate(intent.id);
  };

  return (
    <div
      className={`group grid grid-cols-[1fr_140px_140px_80px_100px_120px] gap-3 px-5 py-3 border-b border-b-border-subtle hover:bg-glass-2 transition-all duration-100 ${
        !intent.isActive ? 'opacity-50' : ''
      }`}
    >
      {/* Name */}
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-text-primary truncate">{intent.name}</span>
          <StatusBadge variant={INTENT_TRACK_COLOR[intent.track]}>
            {INTENT_TRACK_LABEL[intent.track]}
          </StatusBadge>
          {!intent.isActive && <StatusBadge variant="muted">Off</StatusBadge>}
        </div>
        {intent.description && (
          <p className="text-2xs text-text-muted mt-0.5 truncate">{intent.description}</p>
        )}
        {intent.parentIntentName && (
          <span className="text-2xs text-text-muted">↳ {intent.parentIntentName}</span>
        )}
      </div>

      {/* Operation */}
      <div className="flex items-start pt-0.5">
        <IntentOperationBadge operationType={intent.operationType} />
      </div>

      {/* Keywords */}
      <div className="flex items-start pt-0.5">
        <IntentKeywordTags keywords={intent.keywords} max={3} />
      </div>

      {/* Level */}
      <div className="flex items-center">
        <span className="text-xs font-semibold text-text-secondary">{intent.level}</span>
      </div>

      {/* Created */}
      <div className="flex items-center">
        <span className="text-2xs text-text-muted">
          {formatDistanceToNow(new Date(intent.createdAt), { addSuffix: true })}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-1.5">
        <button
          onClick={() => toggleActive.mutate({ id: intent.id, isActive: !intent.isActive })}
          disabled={toggleActive.isPending}
          className={`p-1.5 rounded-lg border transition-all ${
            intent.isActive
              ? 'border-border-subtle text-warning hover:bg-warning-soft'
              : 'border-[rgba(6,214,160,0.15)] text-success hover:bg-success-soft'
          } disabled:opacity-40`}
          title={intent.isActive ? 'Deactivate' : 'Activate'}
        >
          {toggleActive.isPending ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : intent.isActive ? (
            <PowerOff className="w-3 h-3" strokeWidth={1.8} />
          ) : (
            <Power className="w-3 h-3" strokeWidth={1.8} />
          )}
        </button>
        <button
          onClick={() => onEdit(intent)}
          className="p-1.5 rounded-lg border border-border-subtle text-text-muted hover:text-brand hover:bg-brand-soft hover:border-brand transition-all"
          title="Edit"
        >
          <Pencil className="w-3 h-3" strokeWidth={1.8} />
        </button>
        <button
          onClick={handleDelete}
          disabled={remove.isPending}
          className={`p-1.5 rounded-lg border transition-all ${
            confirmDelete
              ? 'bg-danger-soft border-[rgba(244,63,94,0.2)] text-danger'
              : 'border-border-subtle text-text-muted hover:text-danger hover:bg-danger-soft'
          } disabled:opacity-40`}
          title={confirmDelete ? 'Confirm?' : 'Delete'}
        >
          {remove.isPending ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Trash2 className="w-3 h-3" strokeWidth={1.8} />
          )}
        </button>
      </div>
    </div>
  );
}
