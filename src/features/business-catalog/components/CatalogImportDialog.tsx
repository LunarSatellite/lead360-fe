import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Download, FileSpreadsheet, Loader2, Upload, X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { catalogImportApi } from '../api/business-catalog.api';
import { businessCatalogKeys } from '../api/business-catalog.queries';
import type { CatalogImportMode, CatalogImportPreviewResult } from '../types/business-catalog.types';

interface Props {
  onClose: () => void;
}

export function CatalogImportDialog({ onClose }: Props) {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<CatalogImportMode>('CreateOnly');
  const [preview, setPreview] = useState<CatalogImportPreviewResult | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const handleFile = (selected: File | null) => {
    setPreview(null);
    if (!selected) return setFile(null);
    if (!selected.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please select a CSV file');
      return setFile(null);
    }
    if (selected.size > 5 * 1024 * 1024) {
      toast.error('CSV file must be 5 MB or smaller');
      return setFile(null);
    }
    setFile(selected);
  };

  const handlePreview = async () => {
    if (!file) return;
    setIsPreviewing(true);
    try {
      setPreview(await catalogImportApi.preview(file, mode));
    } catch (error: any) {
      toast.error(error?.message ?? 'Could not preview CSV');
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleImport = async () => {
    if (!file || !preview || preview.invalidRows > 0) return;
    setIsImporting(true);
    try {
      const result = await catalogImportApi.import(file, mode);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: businessCatalogKeys.categories() }),
        queryClient.invalidateQueries({ queryKey: businessCatalogKeys.items() }),
      ]);
      toast.success(`Imported ${result.itemsCreated} new and updated ${result.itemsUpdated} catalog items`);
      onClose();
    } catch (error: any) {
      toast.error(error?.message ?? 'Catalog import failed');
    } finally {
      setIsImporting(false);
    }
  };

  const downloadTemplate = async () => {
    setIsDownloading(true);
    try {
      const blob = await catalogImportApi.downloadTemplate();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'catalog-import-template.csv';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast.error(error?.message ?? 'Could not download template');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl bg-surface border border-border-subtle shadow-2xl flex flex-col">
        <div className="flex items-start justify-between px-5 py-4 border-b border-border-subtle">
          <div>
            <h2 className="text-sm font-extrabold text-text-primary flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-brand" /> Bulk import catalog
            </h2>
            <p className="text-[11px] text-text-muted mt-1">Upload categories and items together from one CSV file.</p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-text-muted hover:bg-glass-2 hover:text-text-primary">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-glass-1 border border-border-subtle p-3">
            <div>
              <div className="text-xs font-bold text-text-primary">Start with the supported format</div>
              <div className="text-[11px] text-text-muted">Download the template, fill it, then upload it below.</div>
            </div>
            <button type="button" onClick={downloadTemplate} disabled={isDownloading} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-subtle text-xs font-bold text-text-secondary hover:bg-glass-2 disabled:opacity-50">
              {isDownloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              Download template
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-[1fr_220px]">
            <label className="rounded-xl border-2 border-dashed border-border-subtle hover:border-brand/50 bg-glass-1 px-5 py-6 text-center cursor-pointer transition-colors">
              <Upload className="w-6 h-6 text-brand mx-auto mb-2" />
              <div className="text-xs font-bold text-text-primary">{file ? file.name : 'Choose catalog CSV'}</div>
              <div className="text-[11px] text-text-muted mt-1">CSV only, maximum 5 MB</div>
              <input type="file" accept=".csv,text/csv" className="hidden" onChange={(event) => handleFile(event.target.files?.[0] ?? null)} />
            </label>

            <div className="rounded-xl bg-glass-1 border border-border-subtle p-3">
              <label className="text-[11px] font-bold text-text-secondary">Import behavior</label>
              <select value={mode} onChange={(event) => { setMode(event.target.value as CatalogImportMode); setPreview(null); }} className="mt-2 w-full rounded-lg border border-border-subtle bg-surface px-3 py-2 text-xs text-text-primary outline-none focus:border-brand">
                <option value="CreateOnly">Create only</option>
                <option value="Upsert">Create and update</option>
              </select>
              <p className="text-[10px] text-text-muted mt-2">
                {mode === 'CreateOnly' ? 'Existing items are reported as errors.' : 'Existing items are matched by category and item name, then updated.'}
              </p>
            </div>
          </div>

          <button type="button" onClick={handlePreview} disabled={!file || isPreviewing || isImporting} className="flex items-center justify-center gap-1.5 w-full px-4 py-2 rounded-lg bg-brand text-white text-xs font-bold hover:bg-brand/90 disabled:opacity-50">
            {isPreviewing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileSpreadsheet className="w-3.5 h-3.5" />}
            Preview import
          </button>

          {preview && <ImportPreview preview={preview} />}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border-subtle">
          <button type="button" onClick={onClose} disabled={isImporting} className="px-4 py-2 rounded-lg text-xs font-bold text-text-secondary hover:bg-glass-2">Cancel</button>
          <button type="button" onClick={handleImport} disabled={!preview || preview.invalidRows > 0 || isImporting} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand text-white text-xs font-bold hover:bg-brand/90 disabled:opacity-50">
            {isImporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            Import catalog
          </button>
        </div>
      </div>
    </div>
  );
}

function ImportPreview({ preview }: { preview: CatalogImportPreviewResult }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        <Metric label="Rows" value={preview.totalRows} />
        <Metric label="New categories" value={preview.categoriesToCreate} />
        <Metric label="New items" value={preview.itemsToCreate} />
        <Metric label="Updates" value={preview.itemsToUpdate} />
        <Metric label="Invalid" value={preview.invalidRows} danger={preview.invalidRows > 0} />
      </div>

      <div className={`rounded-xl border px-3 py-2 flex items-start gap-2 ${preview.invalidRows > 0 ? 'bg-danger-soft border-danger/30' : 'bg-success-soft border-success/30'}`}>
        {preview.invalidRows > 0 ? <AlertCircle className="w-4 h-4 text-danger mt-0.5" /> : <CheckCircle2 className="w-4 h-4 text-success mt-0.5" />}
        <div className="text-[11px] text-text-secondary">
          {preview.invalidRows > 0 ? 'Correct invalid rows and preview the file again before importing.' : 'Preview passed. The file is ready to import.'}
        </div>
      </div>

      <div className="rounded-xl border border-border-subtle overflow-x-auto">
        <table className="w-full min-w-[680px] text-left">
          <thead className="bg-glass-2 text-[10px] uppercase tracking-wide text-text-muted">
            <tr><th className="px-3 py-2">Row</th><th className="px-3 py-2">Category</th><th className="px-3 py-2">Item</th><th className="px-3 py-2">Action</th><th className="px-3 py-2">Result</th></tr>
          </thead>
          <tbody>
            {preview.rows.map((row) => (
              <tr key={row.row} className="border-t border-border-subtle text-[11px]">
                <td className="px-3 py-2 text-text-muted">{row.row}</td>
                <td className="px-3 py-2 text-text-primary font-semibold">{row.categoryName || '—'}</td>
                <td className="px-3 py-2 text-text-primary">{row.itemName || '—'}</td>
                <td className="px-3 py-2 text-text-secondary">{row.action === 'CreateItem' ? 'Create' : row.action === 'UpdateItem' ? 'Update' : 'Invalid'}</td>
                <td className={`px-3 py-2 ${row.errors.length ? 'text-danger' : 'text-success'}`}>{row.errors.length ? row.errors.join(' ') : 'Valid'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Metric({ label, value, danger = false }: { label: string; value: number; danger?: boolean }) {
  return <div className="rounded-lg bg-glass-1 border border-border-subtle px-3 py-2"><div className="text-[10px] text-text-muted">{label}</div><div className={`text-sm font-extrabold ${danger ? 'text-danger' : 'text-text-primary'}`}>{value}</div></div>;
}
