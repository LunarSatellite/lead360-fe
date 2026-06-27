import { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Globe, Copy, Check, RefreshCw, Loader2, Key, Code2, X, Zap, Activity,
  Mail, Workflow, Clock, ChevronDown, ChevronUp,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { apiClient } from '@/shared/lib/api-client';
import { crmApi } from '../api/crm.api';
import type { WebEventSummaryDto } from '../types/crm.types';

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
  list: (page: number) => ['events', 'list', page] as const,
};

function useEventIngestionKey() {
  return useQuery({ queryKey: EI_KEYS.key, queryFn: () => eventsApi.getKey() });
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

function useWebEvents(page: number) {
  return useQuery({
    queryKey: EI_KEYS.list(page),
    queryFn: () => crmApi.getWebEvents(page, 20),
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function ConfirmModal({ onConfirm, onClose, loading }: { onConfirm: () => void; onClose: () => void; loading: boolean }) {
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-bg shadow-2xl rounded-2xl border border-border-subtle">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
          <h3 className="font-bold text-text-primary">Regenerate Key?</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-text-secondary">
            This will <span className="font-semibold text-danger-DEFAULT">invalidate your current key immediately</span>.
            Any website using the old snippet will stop tracking until updated.
          </p>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 px-4 py-2 rounded-xl border border-border-subtle text-sm text-text-secondary hover:bg-bg-elevated transition-all">
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

// ─── Event row ────────────────────────────────────────────────────────────────

function EventRow({ event }: { event: WebEventSummaryDto }) {
  const [expanded, setExpanded] = useState(false);

  let props: Record<string, unknown> | null = null;
  if (event.propertiesJson) {
    try {
      const meta = JSON.parse(event.propertiesJson);
      props = meta.properties ?? null;
    } catch { /* ignore */ }
  }

  return (
    <div className="rounded-xl border border-border-subtle bg-bg-elevated overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="w-8 h-8 rounded-lg bg-teal-DEFAULT/10 border border-teal-DEFAULT/20 flex items-center justify-center shrink-0">
          <Activity className="w-4 h-4 text-teal-DEFAULT" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text-primary truncate">{event.eventType}</p>
          <div className="flex items-center gap-3 mt-0.5">
            {event.contactEmail && (
              <span className="flex items-center gap-1 text-xs text-text-muted">
                <Mail className="w-3 h-3" />{event.contactEmail}
              </span>
            )}
            <span className="flex items-center gap-1 text-xs text-text-muted">
              <Workflow className="w-3 h-3" />{event.workflowsTriggered} workflow{event.workflowsTriggered !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="flex items-center gap-1 text-xs text-text-muted">
            <Clock className="w-3 h-3" />
            {format(parseISO(event.receivedAt), 'MMM d, HH:mm')}
          </span>
          {props && Object.keys(props).length > 0 && (
            <button
              onClick={() => setExpanded(v => !v)}
              className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-subtle transition-all"
            >
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>
      {expanded && props && (
        <div className="border-t border-border-subtle px-4 py-3 bg-bg-subtle">
          <p className="text-xs font-semibold text-text-muted mb-1.5">Properties</p>
          <pre className="text-xs font-mono text-text-secondary whitespace-pre-wrap">
            {JSON.stringify(props, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

// ─── Events list ──────────────────────────────────────────────────────────────

function EventsList() {
  const [page, setPage] = useState(1);
  const { data, isLoading, refetch, isFetching } = useWebEvents(page);

  const items: WebEventSummaryDto[] = (data as any)?.items ?? [];
  const total: number = (data as any)?.totalCount ?? 0;
  const totalPages = Math.ceil(total / 20);

  return (
    <div className="glass-surface rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
          <Activity className="w-4 h-4 text-teal-DEFAULT" />
          Received Events
          {total > 0 && (
            <span className="px-1.5 py-0.5 rounded-md bg-bg-elevated border border-border-subtle text-xs text-text-muted font-normal">
              {total}
            </span>
          )}
        </h2>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border-subtle text-xs text-text-secondary hover:bg-bg-elevated hover:text-text-primary transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-5 h-5 animate-spin text-text-muted" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-text-muted gap-2">
          <Activity className="w-8 h-8 opacity-30" strokeWidth={1.2} />
          <p className="text-sm">No events received yet</p>
          <p className="text-xs text-center max-w-xs">
            Once you embed the tracking snippet and fire <code className="bg-bg-elevated px-1 rounded">omniflow('track', ...)</code> calls, events will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(e => <EventRow key={e.id} event={e} />)}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 rounded-lg border border-border-subtle text-xs text-text-secondary disabled:opacity-40 hover:bg-bg-elevated transition-all"
          >
            Previous
          </button>
          <span className="text-xs text-text-muted">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 rounded-lg border border-border-subtle text-xs text-text-secondary disabled:opacity-40 hover:bg-bg-elevated transition-all"
          >
            Next
          </button>
        </div>
      )}
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
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 rounded-xl bg-bg-elevated border border-border-subtle text-sm font-mono text-brand truncate">
                {keyData!.Key}
              </code>
              <CopyButton value={keyData!.Key} />
            </div>
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

      {/* Events list */}
      <EventsList />

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
