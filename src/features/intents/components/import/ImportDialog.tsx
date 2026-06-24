import { useState, useCallback } from 'react';
import { X, Sparkles, Loader2, Download, Check } from 'lucide-react';
import { FileUploadZone } from './FileUploadZone';
import { ImportPreviewTable } from './ImportPreviewTable';
import { useImportParse, useImportEnrich, useImportConfirm } from '@/features/flow-builder/api/flow.queries';
import { ImportRowStatus, type ImportRow } from '@/features/flow-builder/types/flow.types';

interface Props { open: boolean; onClose: () => void; }

export function ImportDialog({ open, onClose }: Props) {
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [editRow, setEditRow] = useState<ImportRow | null>(null);
  const parseMut = useImportParse();
  const enrichMut = useImportEnrich();
  const confirmMut = useImportConfirm();

  const needsAi = rows.filter(r => r.status === ImportRowStatus.NeedsEnrichment).length;
  const approved = rows.filter(r => r.status === ImportRowStatus.Approved).length;

  const handleFile = useCallback((content: string, format: string, name: string) => {
    setFileName(name);
    parseMut.mutate({ Content: content, Format: format, FileName: name }, { onSuccess: res => setRows(res.rows) });
  }, [parseMut]);

  const handleEnrich = useCallback(() => {
    enrichMut.mutate(rows.filter(r => r.status === ImportRowStatus.NeedsEnrichment), {
      onSuccess: res => setRows(p => p.map(r => { const e = res.rows.find(x => x.rowNumber === r.rowNumber); return e || r; })),
    });
  }, [rows, enrichMut]);

  const handleToggle = useCallback((n: number) => {
    setRows(p => p.map(r => r.rowNumber !== n ? r : { ...r, status: r.status === ImportRowStatus.Approved ? ImportRowStatus.Rejected : ImportRowStatus.Approved }));
  }, []);

  const handleApproveAll = useCallback(() => {
    setRows(p => p.map(r => [ImportRowStatus.Duplicate, ImportRowStatus.Invalid].includes(r.status) ? r : { ...r, status: ImportRowStatus.Approved }));
  }, []);

  const handleConfirm = useCallback(() => {
    const app = rows.filter(r => r.status === ImportRowStatus.Approved);
    if (!app.length) return;
    confirmMut.mutate(app, { onSuccess: () => { setRows([]); setFileName(''); onClose(); } });
  }, [rows, confirmMut, onClose]);

  const handleEditSave = useCallback((u: ImportRow) => { setRows(p => p.map(r => r.rowNumber === u.rowNumber ? u : r)); setEditRow(null); }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30">
      <div className="bg-bg-card rounded-2xl w-[720px] max-h-[80vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
          <div><h3 className="text-sm font-bold text-text-primary">📥 Import Intents</h3>{fileName && <p className="text-2xs text-text-muted mt-0.5">{fileName}</p>}</div>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-glass-1"><X className="w-4 h-4 text-text-muted" /></button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {rows.length === 0 ? <>
            <FileUploadZone onFileContent={handleFile} disabled={parseMut.isPending} />
            {parseMut.isPending && <div className="flex items-center justify-center gap-2 mt-4"><Loader2 className="w-4 h-4 animate-spin text-brand" /><span className="text-xs text-text-muted">Parsing...</span></div>}
            {parseMut.isError && <div className="mt-3 p-3 rounded-lg bg-danger-soft text-danger text-xs">Failed to parse. Check format.</div>}
          </> : <>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs text-text-secondary">{rows.length} total</span>
              {needsAi > 0 && <span className="text-xs text-warning font-medium">{needsAi} needs AI</span>}
              {approved > 0 && <span className="text-xs text-brand font-bold">{approved} approved</span>}
              <div className="ml-auto flex items-center gap-2">
                {needsAi > 0 && <button onClick={handleEnrich} disabled={enrichMut.isPending} className="px-3 py-1.5 rounded-lg text-2xs font-semibold text-purple-600 bg-purple-50 border border-purple-200 hover:bg-purple-100 flex items-center gap-1.5 disabled:opacity-50">{enrichMut.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}Auto-fill with AI</button>}
                <button onClick={handleApproveAll} className="px-3 py-1.5 rounded-lg text-2xs font-semibold text-brand bg-brand-soft border border-brand/20 hover:bg-emerald-100 flex items-center gap-1.5"><Check className="w-3 h-3" />Approve All</button>
              </div>
            </div>
            <ImportPreviewTable rows={rows} onToggle={handleToggle} onEdit={setEditRow} />
          </>}
        </div>

        {rows.length > 0 && <div className="flex items-center justify-between px-6 py-4 border-t border-border-subtle">
          <button onClick={() => { setRows([]); setFileName(''); }} className="px-3 py-2 rounded-lg text-xs text-text-muted hover:bg-glass-1">Upload Different File</button>
          <button onClick={handleConfirm} disabled={!approved || confirmMut.isPending} className="px-4 py-2 rounded-lg text-xs font-bold text-white disabled:opacity-40 flex items-center gap-1.5" style={{ background: 'linear-gradient(135deg,#059669,#10B981)' }}>
            {confirmMut.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}Import {approved} Selected
          </button>
        </div>}
      </div>

      {editRow && <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/20">
        <EditRowForm row={editRow} onSave={handleEditSave} onClose={() => setEditRow(null)} />
      </div>}
    </div>
  );
}

function EditRowForm({ row, onSave, onClose }: { row: ImportRow; onSave: (r: ImportRow) => void; onClose: () => void }) {
  const [name, setName] = useState(row.name);
  const [kw, setKw] = useState(row.keywords || '');
  const [desc, setDesc] = useState(row.description || '');
  const [op, setOp] = useState(row.operationType || '');
  return (
    <div className="bg-bg-card rounded-xl w-[400px] shadow-2xl p-5">
      <h4 className="text-sm font-bold text-text-primary mb-4">Edit Row #{row.rowNumber}</h4>
      <div className="space-y-3">
        <div><label className="block text-2xs font-semibold text-text-muted mb-1">Name</label><input value={name} onChange={e => setName(e.target.value)} className="form-input text-sm" /></div>
        <div><label className="block text-2xs font-semibold text-text-muted mb-1">Keywords</label><input value={kw} onChange={e => setKw(e.target.value)} className="form-input text-sm" /></div>
        <div><label className="block text-2xs font-semibold text-text-muted mb-1">Description</label><textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2} className="form-input text-sm resize-none" /></div>
        <div><label className="block text-2xs font-semibold text-text-muted mb-1">Operation Type</label><select value={op} onChange={e => setOp(e.target.value)} className="form-input text-sm"><option value="">—</option><option value="ApiCall">ApiCall</option><option value="MenuNavigation">MenuNavigation</option><option value="Browse">Browse</option><option value="Search">Search</option><option value="StaticResponse">StaticResponse</option></select></div>
      </div>
      <div className="flex items-center justify-end gap-2 mt-5">
        <button onClick={onClose} className="px-3 py-2 rounded-lg text-xs text-text-muted hover:bg-glass-1">Cancel</button>
        <button onClick={() => onSave({ ...row, name, keywords: kw || null, description: desc, operationType: op || null, status: ImportRowStatus.Approved })} className="px-4 py-2 rounded-lg text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg,#059669,#10B981)' }}>Save</button>
      </div>
    </div>
  );
}
