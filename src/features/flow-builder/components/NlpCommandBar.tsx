import { useState, useRef } from 'react';
import {
  Sparkles, ArrowRight, Upload, FileText, X, Loader2,
} from 'lucide-react';

interface NlpCommandBarProps {
  onSubmit: (text: string) => void;
  onFileUpload: (file: File, text: string) => void;
  isThinking: boolean;
  thinkingSteps: { label: string; status: 'pending' | 'active' | 'done' }[];
}

const HINTS = [
  'Build order tracking with status updates',
  'Product menu with categories and search',
  'Customer support with complaint handling',
  'Appointment booking flow',
  'Main menu: Products, Orders, Support, FAQ',
];

export function NlpCommandBar({ onSubmit, onFileUpload, isThinking, thinkingSteps }: NlpCommandBarProps) {
  const [text, setText] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if (!text.trim() && !uploadedFile) return;
    if (uploadedFile) {
      onFileUpload(uploadedFile, text);
    } else {
      onSubmit(text.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setUploadedFile(file);
  };

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[620px] z-50">
      <div className="bg-white border border-border-medium rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
        {/* Input row */}
        <div className="flex items-center gap-2 p-2">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand to-brand-light flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-white" strokeWidth={1.8} />
          </div>

          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder='Describe your flow... "Main menu with Products, Cart, Complaints"'
            disabled={isThinking}
            className="flex-1 bg-transparent border-none outline-none text-sm text-text-primary placeholder:text-text-muted px-2 py-3"
          />

          {/* Upload button */}
          <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.txt,.csv,.json" onChange={handleFileChange} className="hidden" />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={isThinking}
            className="w-10 h-10 rounded-xl bg-glass-2 border border-border-subtle flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-glass-3 transition-all disabled:opacity-30 flex-shrink-0"
            title="Upload document"
          >
            <Upload className="w-4 h-4" strokeWidth={1.6} />
          </button>

          {/* Send button */}
          <button
            onClick={handleSubmit}
            disabled={isThinking || (!text.trim() && !uploadedFile)}
            className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center text-white hover:brightness-110 transition-all disabled:opacity-30 flex-shrink-0"
          >
            {isThinking ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <ArrowRight className="w-5 h-5" strokeWidth={2} />
            )}
          </button>
        </div>

        {/* Uploaded file indicator */}
        {uploadedFile && (
          <div className="px-4 pb-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-success-soft border border-[rgba(6,214,160,0.15)]">
              <FileText className="w-3.5 h-3.5 text-success" strokeWidth={1.6} />
              <span className="text-2xs font-semibold text-success truncate flex-1">{uploadedFile.name}</span>
              <button onClick={() => { setUploadedFile(null); if (fileRef.current) fileRef.current.value = ''; }} className="text-success/60 hover:text-success">
                <X className="w-3 h-3" strokeWidth={2} />
              </button>
            </div>
          </div>
        )}

        {/* AI Thinking animation */}
        {isThinking && thinkingSteps.length > 0 && (
          <div className="px-4 pb-4 pt-2 border-t border-t-border-subtle bg-gradient-to-r from-[rgba(5,150,105,0.06)] to-[rgba(16,185,129,0.06)]">
            <div className="flex items-center gap-2.5 mb-2.5">
              <span className="text-lg">🧠</span>
              <span className="text-xs font-bold text-brand">AI designing your flow...</span>
            </div>
            <div className="space-y-1">
              {thinkingSteps.map((step, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-2 text-2xs transition-all ${
                    step.status === 'done'
                      ? 'text-success'
                      : step.status === 'active'
                      ? 'text-brand font-semibold'
                      : 'text-text-muted'
                  }`}
                >
                  <span className="w-4 text-center">
                    {step.status === 'done' ? '✓' : step.status === 'active' ? '●' : '○'}
                  </span>
                  {step.label}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hint chips (hidden when thinking) */}
        {!isThinking && (
          <div className="px-4 pb-3 pt-1 border-t border-t-border-subtle bg-glass-1">
            <p className="text-[11px] font-bold uppercase tracking-[1.5px] text-text-muted mb-2">✨ Try these</p>
            <div className="flex flex-wrap gap-1.5">
              {HINTS.map((hint) => (
                <button
                  key={hint}
                  onClick={() => { setText(hint); }}
                  className="px-3 py-1.5 rounded-lg bg-glass-2 border border-border-subtle text-2xs text-text-secondary hover:text-brand hover:border-brand hover:bg-brand-soft transition-all"
                >
                  {hint}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
