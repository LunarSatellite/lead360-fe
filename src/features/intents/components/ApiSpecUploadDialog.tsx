import { useState, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  X, Upload, FileJson, FileText, Loader2, AlertCircle,
} from 'lucide-react';
import { useUploadApiSpec, useUploadApiSpecFile } from '../api/api-specs.queries';
import {
  apiSpecUploadSchema,
  apiSpecFileUploadSchema,
  type ApiSpecUploadFormData,
  type ApiSpecFileUploadFormData,
} from '../types/api-specs.schemas';

type TabId = 'paste' | 'file';

interface ApiSpecUploadDialogProps {
  open: boolean;
  onClose: () => void;
}

export function ApiSpecUploadDialog({ open, onClose }: ApiSpecUploadDialogProps) {
  const [tab, setTab] = useState<TabId>('paste');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadPaste = useUploadApiSpec();
  const uploadFile = useUploadApiSpecFile();

  const isPending = uploadPaste.isPending || uploadFile.isPending;

  // ─── Paste form ───
  const pasteForm = useForm<ApiSpecUploadFormData>({
    resolver: zodResolver(apiSpecUploadSchema),
    defaultValues: { name: '', description: '', specContent: '', fileFormat: 'auto' },
  });

  // ─── File form ───
  const fileForm = useForm<ApiSpecFileUploadFormData>({
    resolver: zodResolver(apiSpecFileUploadSchema),
    defaultValues: { name: '', description: '' },
  });

  const handlePasteSubmit = (data: ApiSpecUploadFormData) => {
    const format = data.fileFormat === 'auto' ? detectFormat(data.specContent) : data.fileFormat;
    uploadPaste.mutate(
      {
        name: data.name,
        description: data.description || undefined,
        specContent: data.specContent,
        fileFormat: format,
      },
      {
        onSuccess: () => {
          pasteForm.reset();
          onClose();
        },
      },
    );
  };

  const handleFileSubmit = (data: ApiSpecFileUploadFormData) => {
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('name', data.name);
    if (data.description) formData.append('description', data.description);

    uploadFile.mutate(formData, {
      onSuccess: () => {
        fileForm.reset();
        setSelectedFile(null);
        onClose();
      },
    });
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file && isValidSpecFile(file)) {
      setSelectedFile(file);
      if (!fileForm.getValues('name')) {
        fileForm.setValue('name', file.name.replace(/\.(json|ya?ml)$/i, ''));
      }
    }
  }, [fileForm]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && isValidSpecFile(file)) {
      setSelectedFile(file);
      if (!fileForm.getValues('name')) {
        fileForm.setValue('name', file.name.replace(/\.(json|ya?ml)$/i, ''));
      }
    }
  };

  const handleClose = () => {
    if (isPending) return;
    pasteForm.reset();
    fileForm.reset();
    setSelectedFile(null);
    uploadPaste.reset();
    uploadFile.reset();
    onClose();
  };

  if (!open) return null;

  const pasteError = uploadPaste.error as { message?: string } | null;
  const fileError = uploadFile.error as { message?: string } | null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={handleClose} />

      {/* Dialog */}
      <div className="relative w-full max-w-2xl mx-4 bg-bg-card rounded-2xl border border-border-subtle shadow-lg overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-info-soft flex items-center justify-center">
              <FileJson className="w-4.5 h-4.5 text-info" strokeWidth={1.8} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-text-primary">Upload API Specification</h2>
              <p className="text-xs text-text-muted mt-0.5">Swagger / OpenAPI 2.0 or 3.x</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isPending}
            className="p-1.5 rounded-lg hover:bg-glass-1 text-text-muted hover:text-text-primary transition-all"
          >
            <X className="w-4 h-4" strokeWidth={1.8} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border-subtle px-6">
          {(['paste', 'file'] as const).map((t) => (
            <button
              key={t}
              onClick={() => !isPending && setTab(t)}
              className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
                tab === t
                  ? 'text-brand border-brand'
                  : 'text-text-muted border-transparent hover:text-text-secondary'
              }`}
            >
              {t === 'paste' ? 'Paste Content' : 'Upload File'}
            </button>
          ))}
        </div>

        {/* Content — scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {tab === 'paste' ? (
            <form id="paste-form" onSubmit={pasteForm.handleSubmit(handlePasteSubmit)} className="space-y-4">
              <Field label="Name" error={pasteForm.formState.errors.name?.message} required>
                <input
                  {...pasteForm.register('name')}
                  placeholder="e.g. Petstore API v3"
                  className="form-input"
                  disabled={isPending}
                />
              </Field>

              <Field label="Description" error={pasteForm.formState.errors.description?.message}>
                <textarea
                  {...pasteForm.register('description')}
                  placeholder="Optional description..."
                  rows={2}
                  className="form-input resize-none"
                  disabled={isPending}
                />
              </Field>

              <Field label="Format">
                <select
                  {...pasteForm.register('fileFormat')}
                  className="form-input appearance-none cursor-pointer"
                  disabled={isPending}
                >
                  <option value="auto">Auto-detect</option>
                  <option value="json">JSON</option>
                  <option value="yaml">YAML</option>
                </select>
              </Field>

              <Field label="Spec Content" error={pasteForm.formState.errors.specContent?.message} required>
                <textarea
                  {...pasteForm.register('specContent')}
                  placeholder='Paste your OpenAPI / Swagger JSON or YAML here...'
                  rows={10}
                  className="form-input resize-none font-mono text-[11px] leading-relaxed"
                  disabled={isPending}
                />
              </Field>

              {pasteError?.message && (
                <ErrorBanner message={pasteError.message} />
              )}
            </form>
          ) : (
            <form id="file-form" onSubmit={fileForm.handleSubmit(handleFileSubmit)} className="space-y-4">
              <Field label="Name" error={fileForm.formState.errors.name?.message} required>
                <input
                  {...fileForm.register('name')}
                  placeholder="e.g. Petstore API v3"
                  className="form-input"
                  disabled={isPending}
                />
              </Field>

              <Field label="Description" error={fileForm.formState.errors.description?.message}>
                <textarea
                  {...fileForm.register('description')}
                  placeholder="Optional description..."
                  rows={2}
                  className="form-input resize-none"
                  disabled={isPending}
                />
              </Field>

              {/* Drop zone */}
              <Field label="Spec File" required>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={handleDrop}
                  onClick={() => !isPending && fileInputRef.current?.click()}
                  className={`relative flex flex-col items-center justify-center py-10 px-4 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
                    dragActive
                      ? 'border-brand bg-brand-soft'
                      : selectedFile
                        ? 'border-success bg-success-soft'
                        : 'border-border-medium bg-glass-1 hover:border-brand hover:bg-brand-soft'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,.yaml,.yml"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={isPending}
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
                      <p className="text-xs text-text-muted mt-1">
                        .json, .yaml, .yml — max 10 MB
                      </p>
                    </>
                  )}
                </div>
              </Field>

              {fileError?.message && (
                <ErrorBanner message={fileError.message} />
              )}
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border-subtle bg-glass-1">
          <button
            type="button"
            onClick={handleClose}
            disabled={isPending}
            className="px-4 py-2.5 rounded-lg text-sm font-semibold text-text-secondary hover:text-text-primary hover:bg-glass-2 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            form={tab === 'paste' ? 'paste-form' : 'file-form'}
            disabled={isPending || (tab === 'file' && !selectedFile)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-br from-brand to-brand-dark text-sm font-bold text-white hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Parsing...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" strokeWidth={1.8} />
                Upload & Parse
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ───

function detectFormat(content: string): string {
  const trimmed = content.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return 'json';
  return 'yaml';
}

function isValidSpecFile(file: File): boolean {
  const validTypes = ['.json', '.yaml', '.yml'];
  const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
  return validTypes.includes(ext) && file.size <= 10 * 1024 * 1024;
}

// ─── Sub-components ───

function Field({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-text-secondary mb-1.5">
        {label}
        {required && <span className="text-danger ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-danger mt-1">{error}</p>}
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-danger-soft border border-[rgba(244,63,94,0.15)]">
      <AlertCircle className="w-4 h-4 text-danger flex-shrink-0 mt-0.5" strokeWidth={1.8} />
      <p className="text-xs text-danger font-medium">{message}</p>
    </div>
  );
}
