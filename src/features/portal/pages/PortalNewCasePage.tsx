import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Send } from 'lucide-react';
import { usePortalOpenCase } from '../api/portal.queries';

export function Component() {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const openCase = usePortalOpenCase();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim()) return;
    openCase.mutate({
      subject: subject.trim(),
      description: description.trim() || undefined,
    });
  }

  return (
    <div className="max-w-lg mx-auto">
      <Link
        to="/portal/cases"
        className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-all mb-4"
      >
        <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.6} />
        Back to cases
      </Link>

      <div className="bg-glass-1 border-thin border-border-subtle rounded-card p-5">
        <h1 className="text-base font-extrabold text-text-primary mb-4">Open a New Case</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">
              Subject <span className="text-danger-400">*</span>
            </label>
            <input
              type="text"
              required
              minLength={3}
              maxLength={200}
              placeholder="Brief summary of your issue"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-sm bg-bg-input border-thin border-border-subtle text-text-primary placeholder:text-text-muted focus:border-border-glow focus:bg-glass-1 outline-none transition-all text-sm"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">
              Description
            </label>
            <textarea
              rows={4}
              placeholder="Describe your issue in detail (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-sm bg-bg-input border-thin border-border-subtle text-text-primary placeholder:text-text-muted focus:border-border-glow focus:bg-glass-1 outline-none transition-all text-sm resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={openCase.isPending || !subject.trim()}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-sm bg-brand text-bg font-bold hover:bg-brand-light transition-all disabled:opacity-30 text-sm"
          >
            {openCase.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Send className="w-3.5 h-3.5" strokeWidth={1.8} />
                Submit Case
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
