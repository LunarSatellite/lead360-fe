import { Check, X, AlertTriangle, Sparkles, RefreshCw, Ban } from 'lucide-react';
import { ImportRowStatus, type ImportRow, type ImportRowStatusValue } from '@/features/flow-builder/types/flow.types';

const SC: Record<ImportRowStatusValue, { icon: React.ReactNode; label: string; cls: string }> = {
  [ImportRowStatus.Ready]:            { icon: <Check className="w-3 h-3" />,          label: 'Ready',    cls: 'text-brand bg-brand-soft' },
  [ImportRowStatus.NeedsEnrichment]:  { icon: <AlertTriangle className="w-3 h-3" />,  label: 'Needs AI', cls: 'text-warning bg-warning-soft' },
  [ImportRowStatus.Duplicate]:        { icon: <RefreshCw className="w-3 h-3" />,      label: 'Duplicate', cls: 'text-info bg-info-soft' },
  [ImportRowStatus.Invalid]:          { icon: <Ban className="w-3 h-3" />,            label: 'Invalid',  cls: 'text-danger bg-danger-soft' },
  [ImportRowStatus.Enriched]:         { icon: <Sparkles className="w-3 h-3" />,       label: 'Enriched', cls: 'text-purple-600 bg-purple-50' },
  [ImportRowStatus.Approved]:         { icon: <Check className="w-3 h-3" />,          label: 'Approved', cls: 'text-brand bg-brand-soft' },
  [ImportRowStatus.Rejected]:         { icon: <X className="w-3 h-3" />,              label: 'Rejected', cls: 'text-danger bg-danger-soft' },
};

interface Props { rows: ImportRow[]; onToggle: (n: number) => void; onEdit: (r: ImportRow) => void; }

export function ImportPreviewTable({ rows, onToggle, onEdit }: Props) {
  return (
    <div className="overflow-auto border border-border-subtle rounded-xl">
      <table className="w-full text-left">
        <thead><tr className="bg-glass-1 border-b border-border-subtle">
          {['#', 'Name', 'Keywords', 'Type', 'Status', ''].map(h => <th key={h} className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-text-muted">{h}</th>)}
        </tr></thead>
        <tbody>{rows.map(r => {
          const s = SC[r.status] || SC[ImportRowStatus.Ready];
          const rej = r.status === ImportRowStatus.Rejected;
          const app = r.status === ImportRowStatus.Approved;
          return (
            <tr key={r.rowNumber} className={`border-b border-border-subtle transition-colors ${rej ? 'opacity-40' : 'hover:bg-glass-1'}`}>
              <td className="px-3 py-2 text-2xs text-text-muted">{r.rowNumber}</td>
              <td className="px-3 py-2"><span className="text-xs font-medium text-text-primary">{r.name}</span>{r.llmFilledFields.length > 0 && <span className="ml-1 text-[10px] text-purple-500">✨</span>}</td>
              <td className="px-3 py-2">{r.keywords ? <div className="flex flex-wrap gap-0.5">{r.keywords.split(',').slice(0, 3).map((k, i) => <span key={i} className={`px-1.5 py-0.5 rounded text-[10px] ${r.llmFilledFields.includes('keywords') ? 'bg-purple-50 text-purple-600' : 'bg-glass-1 text-text-secondary'}`}>{k.trim()}</span>)}</div> : <span className="text-2xs text-text-muted">—</span>}</td>
              <td className="px-3 py-2 text-2xs text-text-secondary">{r.operationType || '—'}</td>
              <td className="px-3 py-2"><span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${s.cls}`}>{s.icon} {s.label}</span></td>
              <td className="px-3 py-2"><div className="flex items-center gap-1">
                <button onClick={() => onToggle(r.rowNumber)} className={`p-1 rounded-md ${app ? 'bg-danger-soft text-danger' : 'bg-brand-soft text-brand'}`}>{app ? <X className="w-3 h-3" /> : <Check className="w-3 h-3" />}</button>
                <button onClick={() => onEdit(r)} className="p-1 rounded-md bg-glass-1 text-text-muted hover:bg-glass-2 text-[10px] font-medium">Edit</button>
              </div></td>
            </tr>
          );
        })}</tbody>
      </table>
    </div>
  );
}
