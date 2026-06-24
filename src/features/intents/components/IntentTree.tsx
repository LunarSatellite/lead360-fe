import { useState } from 'react';
import {
  ChevronRight, ChevronDown, Power, PowerOff,
  Pencil, Trash2, Loader2, GripVertical,
} from 'lucide-react';
import { IntentOperationBadge } from './IntentOperationBadge';
import { IntentKeywordTags } from './IntentKeywordTags';
import { StatusBadge } from '@/shared/components';
import { useToggleIntentActive, useDeleteIntent } from '../api/intents.queries';
import { INTENT_TRACK_LABEL, INTENT_TRACK_COLOR } from '../types/intents.types';
import type { IntentDto } from '../types/intents.types';

interface IntentTreeProps {
  intents: IntentDto[];
  onEdit: (intent: IntentDto) => void;
  filter: string;
  operationFilter: number | null;
}

export function IntentTree({ intents, onEdit, filter, operationFilter }: IntentTreeProps) {
  if (intents.length === 0) return null;

  const filtered = filterIntents(intents, filter, operationFilter);

  return (
    <div className="space-y-1">
      {filtered.map((intent) => (
        <IntentTreeNode key={intent.id} intent={intent} depth={0} onEdit={onEdit} />
      ))}
    </div>
  );
}

// ─── Recursive Tree Node ───

function IntentTreeNode({
  intent,
  depth,
  onEdit,
}: {
  intent: IntentDto;
  depth: number;
  onEdit: (intent: IntentDto) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const toggleActive = useToggleIntentActive();
  const remove = useDeleteIntent();

  const hasChildren = intent.children && intent.children.length > 0;
  const isToggling = toggleActive.isPending;
  const isDeleting = remove.isPending;

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    remove.mutate(intent.id);
  };

  return (
    <div>
      <div
        className={`group flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-150 hover:border-border-medium ${
          intent.isActive
            ? 'bg-glass-1 border-border-subtle'
            : 'bg-glass-1 border-border-subtle opacity-50'
        }`}
        style={{ marginLeft: depth * 28 }}
      >
        {/* Expand/collapse */}
        <button
          onClick={() => hasChildren && setExpanded(!expanded)}
          className={`w-5 h-5 flex items-center justify-center rounded flex-shrink-0 ${
            hasChildren ? 'text-text-muted hover:text-text-primary cursor-pointer' : 'invisible'
          }`}
        >
          {hasChildren &&
            (expanded ? (
              <ChevronDown className="w-4 h-4" strokeWidth={1.6} />
            ) : (
              <ChevronRight className="w-4 h-4" strokeWidth={1.6} />
            ))}
        </button>

        {/* Depth indicator line */}
        {depth > 0 && (
          <div className="flex items-center gap-1 flex-shrink-0">
            {Array.from({ length: depth }).map((_, i) => (
              <div key={i} className="w-px h-5 bg-border-medium" />
            ))}
          </div>
        )}

        {/* Sort grip */}
        <GripVertical className="w-3.5 h-3.5 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" strokeWidth={1.6} />

        {/* Intent info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-bold text-text-primary truncate">{intent.name}</span>
            <IntentOperationBadge operationType={intent.operationType} />
            <StatusBadge variant={INTENT_TRACK_COLOR[intent.track]}>
              {INTENT_TRACK_LABEL[intent.track]}
            </StatusBadge>
            {!intent.isActive && (
              <StatusBadge variant="muted">Inactive</StatusBadge>
            )}
          </div>
          {intent.description && (
            <p className="text-xs text-text-muted mt-0.5 truncate max-w-lg">
              {intent.description}
            </p>
          )}
          <div className="mt-1.5">
            <IntentKeywordTags keywords={intent.keywords} max={5} />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          {/* Toggle active */}
          <button
            onClick={() => toggleActive.mutate({ id: intent.id, isActive: !intent.isActive })}
            disabled={isToggling}
            className={`p-2 rounded-lg border text-xs transition-all ${
              intent.isActive
                ? 'bg-glass-1 border-border-subtle text-warning hover:bg-warning-soft'
                : 'bg-success-soft border-[rgba(6,214,160,0.15)] text-success hover:brightness-110'
            } disabled:opacity-40`}
            title={intent.isActive ? 'Deactivate' : 'Activate'}
          >
            {isToggling ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : intent.isActive ? (
              <PowerOff className="w-3.5 h-3.5" strokeWidth={1.8} />
            ) : (
              <Power className="w-3.5 h-3.5" strokeWidth={1.8} />
            )}
          </button>

          {/* Edit */}
          <button
            onClick={() => onEdit(intent)}
            className="p-2 rounded-lg border border-border-subtle bg-glass-1 text-text-muted hover:text-brand hover:bg-brand-soft hover:border-brand transition-all"
            title="Edit"
          >
            <Pencil className="w-3.5 h-3.5" strokeWidth={1.8} />
          </button>

          {/* Delete */}
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className={`p-2 rounded-lg border text-xs transition-all ${
              confirmDelete
                ? 'bg-danger-soft border-[rgba(244,63,94,0.2)] text-danger'
                : 'border-border-subtle bg-glass-1 text-text-muted hover:text-danger hover:bg-danger-soft hover:border-[rgba(244,63,94,0.15)]'
            } disabled:opacity-40`}
            title={confirmDelete ? 'Click again to confirm' : 'Delete'}
          >
            {isDeleting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" strokeWidth={1.8} />
            )}
          </button>
        </div>
      </div>

      {/* Children */}
      {hasChildren && expanded && (
        <div className="mt-1 space-y-1">
          {intent.children!.map((child) => (
            <IntentTreeNode key={child.id} intent={child} depth={depth + 1} onEdit={onEdit} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Filter helper ───

function filterIntents(
  intents: IntentDto[],
  filter: string,
  operationFilter: number | null,
): IntentDto[] {
  const lowerFilter = filter.toLowerCase();

  return intents
    .map((intent) => {
      const children = intent.children
        ? filterIntents(intent.children, filter, operationFilter)
        : [];

      const matchesFilter =
        !filter ||
        intent.name.toLowerCase().includes(lowerFilter) ||
        intent.keywords?.toLowerCase().includes(lowerFilter) ||
        intent.description?.toLowerCase().includes(lowerFilter);

      const matchesOp = operationFilter === null || intent.operationType === operationFilter;

      if ((matchesFilter && matchesOp) || children.length > 0) {
        return { ...intent, children: children.length > 0 ? children : intent.children };
      }
      return null;
    })
    .filter(Boolean) as IntentDto[];
}
