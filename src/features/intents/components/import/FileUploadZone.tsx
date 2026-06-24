import { useRef, useState, useCallback } from 'react';
import { Upload, FileJson, FileSpreadsheet, FileCode } from 'lucide-react';

interface Props {
  onFileContent: (content: string, format: string, fileName: string) => void;
  disabled?: boolean;
}

export function FileUploadZone({ onFileContent, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const process = useCallback(
    (file: File) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const fmt = ext === 'json' ? 'json' : ext === 'xml' ? 'xml' : 'csv';
      const reader = new FileReader();
      reader.onload = (e) => onFileContent(e.target?.result as string, fmt, file.name);
      reader.readAsText(file);
    },
    [onFileContent],
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const f = e.dataTransfer.files[0];
        if (f) process(f);
      }}
      onClick={() => !disabled && inputRef.current?.click()}
      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${dragOver ? 'border-brand bg-brand-soft/30' : 'border-border-subtle hover:border-brand/50 hover:bg-glass-1'} ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.json,.xml"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) process(f);
        }}
      />
      <Upload className="w-8 h-8 text-brand mx-auto mb-3 opacity-60" />
      <div className="text-sm font-semibold text-text-primary mb-1">Drag & drop CSV, JSON, or XML file</div>
      <div className="text-xs text-text-muted">or click to browse</div>
      <div className="flex items-center justify-center gap-3 mt-3">
        <div className="flex items-center gap-1 text-2xs text-text-muted">
          <FileSpreadsheet className="w-4 h-4" />
          .csv
        </div>
        <div className="flex items-center gap-1 text-2xs text-text-muted">
          <FileJson className="w-4 h-4" />
          .json
        </div>
        <div className="flex items-center gap-1 text-2xs text-text-muted">
          <FileCode className="w-4 h-4" />
          .xml
        </div>
      </div>
    </div>
  );
}
