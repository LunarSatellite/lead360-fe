import { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Globe, Copy, Check, RefreshCw, Loader2, Key, Code2, X, Zap,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/shared/lib/api-client';

// ─── API ──────────────────────────────────────────────────────────────────────

interface EventIngestionKeyDto {
  Key: string;
  SnippetUrl: string;
}

const eventsApi = {
  getKey: () =>
    apiClient.get<EventIngestionKeyDto | { Key: null; Message: string }>('/v1/events/key'),
  generateKey: () =>
    apiClient.post<EventIngestionKeyDto>('/v1/events/key', {}),
};

const EI_KEYS = {
  key: ['events', 'key'] as const,
};

function useEventIngestionKey() {
  return useQuery({
    queryKey: EI_KEYS.key,
    queryFn: () => eventsApi.getKey(),
  });
}

function useGenerateEventIngestionKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => eventsApi.generateKey(),
    onSuccess: () => {
      toast.success('Tracking key generated');
      qc.invalidateQueries({ queryKey: EI_KEYS.key });
    },
    onError: () => toast.error('Failed to generate key'),
  });
}

// ─── Copy button ──────────────────────────────────────────────────────────────

function CopyButton({ value, label = 'Copy' }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border-subtle text-xs text-text-secondary hover:bg-bg-elevated hover:text-text-primary transition-all"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-brand" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? 'Copied!' : label}
    </button>
  );
}

// ─── Confirm regenerate modal ─────────────────────────────────────────────────

function ConfirmModal({ onConfirm, onClose, loading }: { onConfirm: () => void; onClose: () => void; loading: boolean }) {
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-bg shadow-2xl rounded-2xl border border-border-subtle">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
          <h3 className="font-bold text-text-primary">Regenerate Key?</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-text-secondary">
            This will <span className="font-semibold text-danger-DEFAULT">invalidate your current key immediately</span>.
            Any website using the old snippet will stop tracking until updated.
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-xl border border-border-subtle text-sm text-text-secondary hover:bg-bg-elevated transition-all"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-danger-DEFAULT/10 border border-danger-DEFAULT/30 text-danger-DEFAULT text-sm font-semibold hover:bg-danger-DEFAULT/20 transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Regenerate
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Code block ───────────────────────────────────────────────────────────────

function CodeBlock({ code, label }: { code: string; label: string }) {
  return (
    <div className="rounded-xl border border-border-subtle bg-bg-elevated overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border-subtle bg-glass-1">
        <span className="text-xs font-mono text-text-muted">{label}</span>
        <CopyButton value={code} />
      </div>
      <pre className="px-4 py-3 text-xs font-mono text-text-secondary overflow-x-auto whitespace-pre-wrap break-all">
        {code}
      </pre>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function Component() { return <EventIngestionPage />; }

function EventIngestionPage() {
  const [showConfirm, setShowConfirm] = useState(false);
  const { data, isLoading } = useEventIngestionKey();
  const generate = useGenerateEventIngestionKey();

  const responseData = data as unknown as EventIngestionKeyDto | { Key: null; Message: string } | undefined;
  const keyData = responseData && 'Key' in responseData && responseData.Key
    ? responseData as EventIngestionKeyDto
    : null;
  const hasKey = !!keyData;

  const handleGenerate = async () => {
    await generate.mutateAsync();
    setShowConfirm(false);
  };

  const embedTag = keyData ? `<script src="${keyData.SnippetUrl}" async></script>` : '';
  const usageExample = hasKey
    ? `<!-- Place this before </body> -->
${embedTag}

<!-- Then track events anywhere on the page -->
<script>
  omniflow('track', 'page.viewed', {
    email: 'user@example.com',
    name: 'Jane Smith',
    page: window.location.pathname
  });

  omniflow('track', 'purchase.completed', {
    email: 'user@example.com',
    amount: 99.00,
    product: 'Pro Plan'
  });
</script>`
    : '';

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-teal-DEFAULT/10 border border-teal-DEFAULT/20">
          <Globe className="w-5 h-5 text-teal-DEFAULT" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-text-primary">Website Event Tracking</h1>
          <p className="text-sm text-text-muted">
            Track visitor events on external websites and trigger CRM workflows automatically
          </p>
        </div>
      </div>

      {/* How it works */}
      <div className="glass-surface rounded-2xl p-5">
        <h2 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-brand" />
          How it works
        </h2>
        <ol className="space-y-2 text-sm text-text-secondary">
          <li className="flex gap-2.5">
            <span className="w-5 h-5 rounded-full bg-brand/10 border border-brand/20 text-brand text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
            Generate a unique tracking key for your workspace below.
          </li>
          <li className="flex gap-2.5">
            <span className="w-5 h-5 rounded-full bg-brand/10 border border-brand/20 text-brand text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
            Embed the one-line script tag on your website (before <code className="bg-bg-elevated px-1 rounded text-xs">&lt;/body&gt;</code>).
          </li>
          <li className="flex gap-2.5">
            <span className="w-5 h-5 rounded-full bg-brand/10 border border-brand/20 text-brand text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
            Call <code className="bg-bg-elevated px-1 rounded text-xs">omniflow('track', 'event.name', &#123; email, ...props &#125;)</code> on any action.
          </li>
          <li className="flex gap-2.5">
            <span className="w-5 h-5 rounded-full bg-brand/10 border border-brand/20 text-brand text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">4</span>
            CRM workflows with an <strong>Event Ingestion</strong> trigger fire automatically — matching contacts by email.
          </li>
        </ol>
      </div>

      {/* Key card */}
      <div className="glass-surface rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
            <Key className="w-4 h-4 text-text-muted" />
            Tracking Key
          </h2>
          {hasKey && (
            <button
              onClick={() => setShowConfirm(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-subtle text-xs text-text-secondary hover:bg-bg-elevated hover:text-text-primary transition-all"
            >
              <RefreshCw className="w-3 h-3" />
              Regenerate
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-text-muted py-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading key…
          </div>
        ) : hasKey ? (
          <div className="space-y-3">
            {/* Key value */}
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 rounded-xl bg-bg-elevated border border-border-subtle text-sm font-mono text-brand truncate">
                {keyData!.Key}
              </code>
              <CopyButton value={keyData!.Key} />
            </div>
            {/* Snippet URL */}
            <div>
              <p className="text-xs font-semibold text-text-muted mb-1.5">Snippet URL</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 rounded-xl bg-bg-elevated border border-border-subtle text-xs font-mono text-text-secondary truncate">
                  {keyData!.SnippetUrl}
                </code>
                <CopyButton value={keyData!.SnippetUrl} />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 py-6">
            <p className="text-sm text-text-secondary text-center">
              No tracking key yet. Generate one to start embedding the tracker on your website.
            </p>
            <button
              onClick={() => handleGenerate()}
              disabled={generate.isPending}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand text-bg text-sm font-semibold hover:bg-brand-light transition-all disabled:opacity-50"
            >
              {generate.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
              Generate Tracking Key
            </button>
          </div>
        )}
      </div>

      {/* Embed code */}
      {hasKey && (
        <div className="glass-surface rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
            <Code2 className="w-4 h-4 text-text-muted" />
            Embed on your website
          </h2>
          <CodeBlock code={usageExample} label="HTML + JavaScript" />
          <p className="text-xs text-text-muted">
            The tracker uses <code className="bg-bg-elevated px-1 rounded">navigator.sendBeacon</code> with an XHR fallback.
            Page performance is not affected — events fire asynchronously and never block navigation.
          </p>
        </div>
      )}

      {/* Confirm modal */}
      {showConfirm && (
        <ConfirmModal
          onConfirm={handleGenerate}
          onClose={() => setShowConfirm(false)}
          loading={generate.isPending}
        />
      )}
    </div>
  );
}
