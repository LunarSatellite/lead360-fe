import { useRef } from 'react';
import { Download, Upload, FileUp, Loader2 } from 'lucide-react';

interface Props {
  exportUrl: string;
  templateUrl: string;
  entityLabel: string;
  onImport: (file: File) => Promise<void>;
  isImporting?: boolean;
}

const BASE = 'http://localhost:50363/api';

async function downloadWithAuth(url: string, filename: string) {
  const token = localStorage.getItem('omniflow_token');
  const res = await fetch(`${BASE}${url}?api-version=1.0`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) return;
  const blob = await res.blob();
  const href = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(href);
}

export function CsvToolbar({ exportUrl, templateUrl, entityLabel, onImport, isImporting }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await onImport(file);
    if (fileRef.current) fileRef.current.value = '';
  };

  const btnClass =
    'flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-bg-elevated border border-border-subtle text-xs text-text-secondary hover:text-text-primary hover:bg-bg-card transition-all disabled:opacity-50';

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => downloadWithAuth(templateUrl, `${entityLabel}-template.csv`)}
        className={btnClass}
        title="Download CSV template"
      >
        <FileUp className="w-3.5 h-3.5" /> Template
      </button>

      <button
        onClick={() => downloadWithAuth(exportUrl, `${entityLabel}.csv`)}
        className={btnClass}
        title={`Export ${entityLabel} as CSV`}
      >
        <Download className="w-3.5 h-3.5" /> Export
      </button>

      <button
        onClick={() => fileRef.current?.click()}
        disabled={isImporting}
        className={btnClass}
        title={`Import ${entityLabel} from CSV`}
      >
        {isImporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
        Import
      </button>

      <input
        ref={fileRef}
        type="file"
        accept=".csv,text/csv"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
