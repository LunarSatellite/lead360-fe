import { useState, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Upload, FileJson, FileText, Loader2, AlertCircle } from 'lucide-react';
import { useUploadSpec } from '../api/api-connection.queries';
import { specUploadSchema, type SpecUploadFormData } from '../types/api-connection.types';

interface SpecUploadZoneProps {
  onSuccess?: (specId: string) => void;
}

export function SpecUploadZone({ onSuccess }: SpecUploadZoneProps) {
  const [mode, setMode] = useState<'drop' | 'paste'>('drop');
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const upload = useUploadSpec();

  const form = useForm<SpecUploadFormData>({
    resolver: zodResolver(specUploadSchema),
    defaultValues: { name: '', specContent: '', fileFormat: 'json' },
  });

  const readFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        form.setValue('specContent', content);
        const ext = file.name.toLowerCase();
        form.setValue('fileFormat', ext.endsWith('.yaml') || ext.endsWith('.yml') ? 'yaml' : 'json');
        if (!form.getValues('name')) {
          form.setValue('name', file.name.replace(/\.(json|ya?ml)$/i, ''));
        }
      };
      reader.readAsText(file);
      setSelectedFile(file);
    },
    [form],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files[0];
      if (file) readFile(file);
    },
    [readFile],
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) readFile(file);
  };

  const onSubmit = (data: SpecUploadFormData) => {
    upload.mutate(data, {
      onSuccess: (res) => {
        form.reset();
        setSelectedFile(null);
        const r = res as any;
        onSuccess?.(r?.id);
      },
    });
  };

  const errMsg = (upload.error as { message?: string })?.message;

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="flex items-center bg-glass-1 border border-border-subtle rounded-lg p-1 w-fit">
        {(['drop', 'paste'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              mode === m
                ? 'bg-brand-soft text-brand border border-brand'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            {m === 'drop' ? 'Upload File' : 'Paste Content'}
          </button>
        ))}
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-1.5">
            Name <span className="text-danger">*</span>
          </label>
          <input
            {...form.register('name')}
            placeholder="e.g. Petstore API v3"
            className="form-input"
            disabled={upload.isPending}
          />
          {form.formState.errors.name && (
            <p className="text-xs text-danger mt-1">{form.formState.errors.name.message}</p>
          )}
        </div>

        {/* Format */}
        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-1.5">Format</label>
          <select
            {...form.register('fileFormat')}
            className="form-input appearance-none cursor-pointer"
            disabled={upload.isPending}
          >
            <option value="json">JSON</option>
            <option value="yaml">YAML</option>
          </select>
        </div>

        {mode === 'drop' ? (
          /* Drop zone */
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => !upload.isPending && fileRef.current?.click()}
            className={`relative flex flex-col items-center justify-center py-12 px-4 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
              dragActive
                ? 'border-brand bg-brand-soft'
                : selectedFile
                  ? 'border-success bg-success-soft'
                  : 'border-border-medium bg-glass-1 hover:border-brand hover:bg-brand-soft'
            }`}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".json,.yaml,.yml"
              onChange={handleFileSelect}
              className="hidden"
            />
            {selectedFile ? (
              <>
                <FileText className="w-8 h-8 text-success mb-2" strokeWidth={1.6} />
                <p className="text-sm font-bold text-text-primary">{selectedFile.name}</p>
                <p className="text-xs text-text-muted mt-1">
                  {(selectedFile.size / 1024).toFixed(1)} KB — click to change
                </p>
              </>
            ) : (
              <>
                <Upload className="w-8 h-8 text-text-muted mb-2" strokeWidth={1.6} />
                <p className="text-sm font-semibold text-text-secondary">
                  Drop your spec file here or click to browse
                </p>
                <p className="text-xs text-text-muted mt-1">.json, .yaml, .yml — max 10 MB</p>
              </>
            )}
          </div>
        ) : (
          /* Paste area */
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">
              Spec Content <span className="text-danger">*</span>
            </label>
            <textarea
              {...form.register('specContent')}
              placeholder="Paste your OpenAPI / Swagger JSON or YAML here..."
              rows={12}
              className="form-input resize-none font-mono text-[11px] leading-relaxed"
              disabled={upload.isPending}
            />
            {form.formState.errors.specContent && (
              <p className="text-xs text-danger mt-1">{form.formState.errors.specContent.message}</p>
            )}
          </div>
        )}

        {errMsg && (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-danger-soft border border-[rgba(244,63,94,0.15)]">
            <AlertCircle className="w-4 h-4 text-danger flex-shrink-0 mt-0.5" strokeWidth={1.8} />
            <p className="text-xs text-danger font-medium">{errMsg}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={upload.isPending}
          className="flex items-center gap-2 px-5 py-3 rounded-lg bg-gradient-to-br from-brand to-brand-dark text-sm font-bold text-white hover:brightness-110 transition-all disabled:opacity-50"
        >
          {upload.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Parsing...
            </>
          ) : (
            <>
              <FileJson className="w-4 h-4" strokeWidth={1.8} /> Upload &amp; Parse
            </>
          )}
        </button>
      </form>
    </div>
  );
}
