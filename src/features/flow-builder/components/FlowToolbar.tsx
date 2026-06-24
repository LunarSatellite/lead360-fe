import { Save, Rocket, Trash2, Copy, Undo2, Redo2, Loader2, FolderOpen } from 'lucide-react';

interface FlowToolbarProps {
  flowId: string | null;
  flowName: string;
  isDirty: boolean;
  isSaving: boolean;
  canUndo: boolean;
  canRedo: boolean;
  isActive: boolean;
  onSave: () => void;
  onDeploy: () => void;
  onClear: () => void;
  onDuplicate: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onOpenList: () => void;
  isDeploying?: boolean;
}

export function FlowToolbar({
  flowId,
  flowName,
  isDirty,
  isSaving,
  canUndo,
  canRedo,
  isActive,
  onSave,
  onDeploy,
  onClear,
  onDuplicate,
  onUndo,
  onRedo,
  onOpenList,
  isDeploying,
}: FlowToolbarProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 border-t border-border-subtle bg-white">
      {/* Flow name */}
      <div className="flex items-center gap-2 mr-auto min-w-0">
        <button
          onClick={onOpenList}
          className="p-1.5 rounded-md hover:bg-glass-1 transition-colors text-text-muted"
          title="Open flow list"
        >
          <FolderOpen className="w-4 h-4" />
        </button>
        <span className="text-xs font-semibold text-text-primary truncate max-w-[160px]">
          {flowName || 'Untitled Flow'}
        </span>
        {isDirty && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" title="Unsaved changes" />}
        {isActive && (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white bg-brand flex-shrink-0">LIVE</span>
        )}
      </div>

      {/* Undo/Redo */}
      <button onClick={onUndo} disabled={!canUndo} className="toolbar-btn" title="Undo">
        <Undo2 className="w-3.5 h-3.5" />
      </button>
      <button onClick={onRedo} disabled={!canRedo} className="toolbar-btn" title="Redo">
        <Redo2 className="w-3.5 h-3.5" />
      </button>

      <div className="w-px h-5 bg-border-subtle" />

      {/* Save */}
      <button onClick={onSave} disabled={!flowId || isSaving} className="toolbar-btn" title="Save">
        {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
        <span className="text-2xs">Save</span>
      </button>

      {/* Duplicate */}
      <button onClick={onDuplicate} disabled={!flowId} className="toolbar-btn" title="Duplicate">
        <Copy className="w-3.5 h-3.5" />
      </button>

      {/* Clear */}
      <button onClick={onClear} className="toolbar-btn text-danger" title="Clear canvas">
        <Trash2 className="w-3.5 h-3.5" />
      </button>

      <div className="w-px h-5 bg-border-subtle" />

      {/* Deploy */}
      <button
        onClick={onDeploy}
        disabled={!flowId || isDeploying}
        className="px-3 py-1.5 rounded-lg text-2xs font-bold text-white border-none cursor-pointer disabled:opacity-40 flex items-center gap-1.5 hover:-translate-y-px transition-all"
        style={{ background: 'linear-gradient(135deg,#059669,#10B981)' }}
      >
        {isDeploying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Rocket className="w-3.5 h-3.5" />}
        Deploy
      </button>
    </div>
  );
}
