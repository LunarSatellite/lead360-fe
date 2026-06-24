import { useState, useRef } from 'react';
import { X, Upload, FileJson, Loader2, AlertTriangle } from 'lucide-react';
import { useBulkImportIntents } from '../api/intents.queries';
import type { IntentCreateRequest } from '../types/intents.types';

interface IntentBulkImportModalProps {
  open: boolean;
  onClose: () => void;
  tenantId: string;
}

export function IntentBulkImportModal({ open, onClose, tenantId }: IntentBulkImportModalProps) {
  const [jsonData, setJsonData] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [previewCount, setPreviewCount] = useState<number>(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const bulkImport = useBulkImportIntents();

  const validateAndPreview = (text: string) => {
    setJsonData(text);
    setParseError(null);
    setPreviewCount(0);

    if (!text.trim()) return;

    try {
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) {
        setParseError('JSON must be an array of intent objects.');
        return;
      }
      if (parsed.length === 0) {
        setParseError('Array is empty.');
        return;
      }
      // Basic validation: each item needs name and operationType
      const invalid = parsed.filter(
        (item: Record<string, unknown>) => !item.name || !item.operationType,
      );
      if (invalid.length > 0) {
        setParseError(`${invalid.length} item(s) missing required fields (name, operationType).`);
        return;
      }
      setPreviewCount(parsed.length);
    } catch {
      setParseError('Invalid JSON. Check your syntax.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;

      if (file.name.endsWith('.csv')) {
        // Simple CSV → JSON conversion
        try {
          const lines = text.trim().split('\n');
          if (lines.length < 2) {
            setParseError('CSV must have a header row and at least one data row.');
            return;
          }
          const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
          const rows = lines.slice(1).map((line) => {
            const values = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
            const obj: Record<string, string> = {};
            headers.forEach((h, i) => {
              obj[h] = values[i] || '';
            });
            return obj;
          });
          const jsonStr = JSON.stringify(rows, null, 2);
          validateAndPreview(jsonStr);
        } catch {
          setParseError('Failed to parse CSV file.');
        }
      } else {
        validateAndPreview(text);
      }
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    try {
      const parsed = JSON.parse(jsonData) as IntentCreateRequest[];
      // Inject tenantId into each
      const withTenant = parsed.map((item) => ({ ...item, tenantId }));
      bulkImport.mutate(
        { tenantId, intents: withTenant },
        {
          onSuccess: () => {
            setJsonData('');
            setPreviewCount(0);
            onClose();
          },
        },
      );
    } catch {
      setParseError('Failed to parse JSON for import.');
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl mx-4 bg-bg-card border border-border-medium rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-b-border-subtle">
          <div className="flex items-center gap-2.5">
            <FileJson className="w-5 h-5 text-brand" strokeWidth={1.6} />
            <h2 className="text-lg font-extrabold text-text-primary tracking-tight">Bulk import intents</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-glass-2 flex items-center justify-center text-text-muted hover:text-text-primary transition-all"
          >
            <X className="w-4 h-4" strokeWidth={1.8} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-text-secondary">
            Paste a JSON array of intents or upload a CSV/JSON file. Each intent needs at minimum{' '}
            <code className="text-brand font-mono text-2xs bg-glass-2 px-1.5 py-0.5 rounded">name</code> and{' '}
            <code className="text-brand font-mono text-2xs bg-glass-2 px-1.5 py-0.5 rounded">
              operationType
            </code>
            .
          </p>

          {/* File upload */}
          <div>
            <input
              ref={fileRef}
              type="file"
              accept=".json,.csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-glass-2 border border-border-medium text-sm font-semibold text-text-secondary hover:text-text-primary hover:bg-glass-3 transition-all"
            >
              <Upload className="w-4 h-4" strokeWidth={1.8} />
              Upload JSON or CSV file
            </button>
          </div>

          {/* Textarea */}
          <div>
            <label className="text-2xs font-bold uppercase tracking-[2px] text-text-muted block mb-2">
              Or paste JSON array
            </label>
            <textarea
              value={jsonData}
              onChange={(e) => validateAndPreview(e.target.value)}
              placeholder={
                '[\n  {\n    "name": "Track Order",\n    "operationType": 1,\n    "keywords": "track,order,delivery"\n  }\n]'
              }
              rows={8}
              className="w-full px-4 py-3 rounded-lg bg-glass-2 border border-border-subtle text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand transition-all resize-none font-mono text-2xs"
            />
          </div>

          {/* Preview / Error */}
          {parseError && (
            <div className="flex items-start gap-2 px-4 py-3 rounded-lg bg-danger-soft border border-[rgba(244,63,94,0.15)]">
              <AlertTriangle className="w-4 h-4 text-danger flex-shrink-0 mt-0.5" strokeWidth={1.8} />
              <span className="text-sm text-danger">{parseError}</span>
            </div>
          )}

          {previewCount > 0 && !parseError && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-success-soft border border-[rgba(6,214,160,0.15)]">
              <span className="text-sm text-success font-semibold">
                Ready to import {previewCount} intent{previewCount > 1 ? 's' : ''}
              </span>
            </div>
          )}

          {/* Error from API */}
          {bulkImport.isError && (
            <div className="px-4 py-3 rounded-lg bg-danger-soft border border-[rgba(244,63,94,0.15)] text-sm text-danger">
              {bulkImport.error?.message || 'Import failed.'}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg bg-glass-2 border border-border-medium text-sm font-semibold text-text-secondary hover:text-text-primary transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={previewCount === 0 || !!parseError || bulkImport.isPending}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-br from-brand to-brand-dark text-sm font-bold text-white hover:brightness-110 disabled:opacity-50 transition-all"
            >
              {bulkImport.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" strokeWidth={2} />
              )}
              {bulkImport.isPending
                ? 'Importing...'
                : `Import ${previewCount} intent${previewCount > 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
