import { useState } from 'react';
import { X } from 'lucide-react';
import type { ImportRow } from '@/features/flow-builder/types/flow.types';

interface ImportEditDialogProps {
  row: ImportRow | null;
  onSave: (row: ImportRow) => void;
  onClose: () => void;
}

export function ImportEditDialog({ row, onSave, onClose }: ImportEditDialogProps) {
  const [name, setName] = useState(row?.name || '');
  const [keywords, setKeywords] = useState(row?.keywords || '');
  const [description, setDescription] = useState(row?.description || '');
  const [operationType, setOperationType] = useState(row?.operationType || '');

  if (!row) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/30">
      <div className="bg-bg-card rounded-2xl w-[420px] shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
          <h3 className="text-sm font-bold text-text-primary">Edit Row #{row.rowNumber}</h3>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-glass-1">
            <X className="w-4 h-4 text-text-muted" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <div>
            <label className="block text-2xs font-semibold text-text-secondary mb-1">Name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-input"
              placeholder="e.g., Track Order"
            />
          </div>
          <div>
            <label className="block text-2xs font-semibold text-text-secondary mb-1">Keywords</label>
            <input
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              className="form-input"
              placeholder="track,order,status (comma-separated)"
            />
          </div>
          <div>
            <label className="block text-2xs font-semibold text-text-secondary mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="form-input"
              rows={2}
              placeholder="What does this intent do?"
            />
          </div>
          <div>
            <label className="block text-2xs font-semibold text-text-secondary mb-1">Operation Type</label>
            <select
              value={operationType}
              onChange={(e) => setOperationType(e.target.value)}
              className="form-input"
            >
              <option value="">Select...</option>
              <option value="ApiCall">API Call</option>
              <option value="MenuNavigation">Menu Navigation</option>
              <option value="StaticResponse">Static Response</option>
              <option value="Browsing">Browsing</option>
              <option value="Greeting">Greeting</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 border-t border-border-subtle">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-text-secondary hover:bg-glass-1 transition-colors">
            Cancel
          </button>
          <button
            onClick={() => {
              onSave({
                ...row,
                name,
                keywords: keywords || null,
                description,
                operationType,
              });
              onClose();
            }}
            disabled={!name.trim()}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg,#059669,#10B981)' }}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
