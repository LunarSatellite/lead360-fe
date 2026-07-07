import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Send, CheckCircle2 } from 'lucide-react';
import { usePortalCase, usePortalReplyToCase, usePortalResolveCase } from '../api/portal.queries';
import type { PortalCaseDetailDto, PortalCaseMessageDto } from '../types/portal.types';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export function Component() {
  const { id } = useParams<{ id: string }>();
  const { data, isPending } = usePortalCase(id!);
  const detail = data as PortalCaseDetailDto | undefined;

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 text-brand animate-spin" />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-text-secondary">Case not found</p>
      </div>
    );
  }

  const isResolved = detail.status === 'Resolved' || detail.status === 'Closed';

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back link + header */}
      <Link
        to="/portal/cases"
        className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-all mb-4"
      >
        <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.6} />
        Back to cases
      </Link>

      <div className="bg-glass-1 border-thin border-border-subtle rounded-card p-4 mb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-base font-extrabold text-text-primary">{detail.subject}</h1>
            {detail.description && (
              <p className="text-xs text-text-secondary mt-1">{detail.description}</p>
            )}
            <p className="text-xs text-text-muted mt-1.5">Opened {formatDate(detail.createdAt)}</p>
          </div>
          <StatusBadge status={detail.status} />
        </div>
      </div>

      {/* Message thread */}
      <div className="flex flex-col gap-2.5 mb-4">
        {(detail.messages ?? []).map((msg: PortalCaseMessageDto) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
      </div>

      {/* Reply / resolve */}
      {!isResolved ? (
        <ReplySection caseId={id!} />
      ) : (
        <div className="bg-glass-1 border-thin border-border-subtle rounded-card p-3.5 text-center">
          <p className="text-xs text-text-muted">This case has been resolved.</p>
        </div>
      )}
    </div>
  );
}

function MessageBubble({ message }: { message: PortalCaseMessageDto }) {
  const isCustomer = message.from === 'customer';

  return (
    <div className={`flex ${isCustomer ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-card px-3.5 py-2.5 border-thin ${
          isCustomer
            ? 'bg-brand-soft border-border-glow'
            : 'bg-glass-1 border-border-subtle'
        }`}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xs font-semibold text-text-muted">
            {isCustomer ? 'You' : 'Support'}
          </span>
          <span className="text-2xs text-text-muted">{formatDate(message.sentAt)}</span>
        </div>
        <p className="text-sm text-text-primary whitespace-pre-wrap">{message.body}</p>
      </div>
    </div>
  );
}

function ReplySection({ caseId }: { caseId: string }) {
  const [body, setBody] = useState('');
  const reply = usePortalReplyToCase(caseId);
  const resolve = usePortalResolveCase(caseId);

  function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    reply.mutate({ body: body.trim() }, { onSuccess: () => setBody('') });
  }

  return (
    <div className="space-y-2">
      <form onSubmit={handleReply} className="flex gap-2">
        <textarea
          rows={2}
          placeholder="Type your reply..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="flex-1 px-3.5 py-2.5 rounded-sm bg-bg-input border-thin border-border-subtle text-text-primary placeholder:text-text-muted focus:border-border-glow focus:bg-glass-1 outline-none transition-all text-sm resize-none"
        />
        <button
          type="submit"
          disabled={reply.isPending || !body.trim()}
          className="self-end flex items-center gap-1.5 px-4 py-2.5 rounded-sm bg-brand text-bg font-bold hover:bg-brand-light transition-all disabled:opacity-30 text-xs shrink-0"
        >
          {reply.isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Send className="w-3.5 h-3.5" strokeWidth={1.8} />
          )}
          Reply
        </button>
      </form>

      <button
        onClick={() => resolve.mutate(undefined)}
        disabled={resolve.isPending}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm border-thin border-border-medium text-text-secondary hover:text-text-primary hover:bg-glass-2 transition-all text-xs"
      >
        {resolve.isPending ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.6} />
        )}
        Mark as resolved
      </button>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Open: 'bg-warning-500/10 text-warning-400',
    InProgress: 'bg-info-500/10 text-info-400',
    Resolved: 'bg-success-500/10 text-success-400',
    Closed: 'bg-glass-2 text-text-muted',
  };
  const cls = styles[status] ?? 'bg-glass-2 text-text-muted';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-xs text-2xs font-semibold ${cls} border-thin border-transparent shrink-0`}>
      {status === 'InProgress' ? 'In Progress' : status}
    </span>
  );
}
