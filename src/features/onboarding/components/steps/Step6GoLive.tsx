import { Loader2, Check, X, ExternalLink } from 'lucide-react';
import { useGoLiveChecklist, useActivateChannel, useActivateAll } from '@/features/flow-builder/api/flow.queries';
import type { GoLiveChecklistResponse } from '@/features/flow-builder/types/flow.types';

interface Step6Props {
  onComplete: () => void;
}

export function Step6GoLive({ onComplete }: Step6Props) {
  const { data: checklistRaw, isLoading } = useGoLiveChecklist();
  const checklist = checklistRaw as unknown as GoLiveChecklistResponse | undefined;
  const activateChannel = useActivateChannel();
  const activateAll = useActivateAll();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-brand" />
      </div>
    );
  }

  if (!checklist) {
    return <div className="text-center py-12 text-sm text-text-muted">Unable to load checklist.</div>;
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="text-center mb-6">
        <div className="text-3xl mb-2">🚀</div>
        <h2 className="text-lg font-bold text-text-primary">Go Live</h2>
        <p className="text-sm text-text-muted mt-1">
          {checklist.isReady
            ? 'Everything looks good! You\'re ready to go live.'
            : 'Review the checklist below and fix any issues.'}
        </p>
      </div>

      {/* Checklist */}
      <div className="rounded-xl border border-border-subtle overflow-hidden mb-6">
        <div className="px-4 py-3 bg-glass-1 border-b border-border-subtle flex items-center justify-between">
          <span className="text-xs font-bold text-text-primary">Pre-flight Checklist</span>
          <span className={`text-xs font-bold ${checklist.isReady ? 'text-brand' : 'text-warning'}`}>
            {checklist.requiredPassed}/{checklist.requiredTotal} required
          </span>
        </div>
        <div className="divide-y divide-border-subtle">
          {checklist.items.map((item, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-2.5">
              <span className="text-sm flex-shrink-0">
                {item.passed ? <Check className="w-4 h-4 text-brand" /> : <X className="w-4 h-4 text-danger" />}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-text-primary">{item.name}</div>
                <div className="text-[10px] text-text-muted">{item.detail}</div>
              </div>
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                item.category === 'required' ? 'bg-danger-soft text-danger' : 'bg-glass-1 text-text-muted'
              }`}>
                {item.category}
              </span>
              {item.fixLink && (
                <a href={item.fixLink} className="text-brand">
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Channel activation */}
      <div className="rounded-xl border border-border-subtle overflow-hidden mb-6">
        <div className="px-4 py-3 bg-glass-1 border-b border-border-subtle">
          <span className="text-xs font-bold text-text-primary">Channel Activation</span>
        </div>
        <div className="divide-y divide-border-subtle">
          {checklist.channels.map((ch, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-2.5">
              <div className="flex-1">
                <div className="text-xs font-medium text-text-primary">{ch.displayName || ch.channelType}</div>
                <div className="text-[10px] text-text-muted">
                  {ch.isConnected ? 'Connected' : 'Not connected'}
                  {ch.isLive && ' • 🟢 Live'}
                </div>
              </div>
              {ch.isConnected && !ch.isLive && (
                <button
                  onClick={() => activateChannel.mutate(ch.channelType)}
                  disabled={!checklist.isReady || activateChannel.isPending}
                  className="px-3 py-1.5 rounded-lg text-2xs font-bold text-white disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg,#059669,#10B981)' }}
                >
                  Activate
                </button>
              )}
              {ch.isLive && (
                <span className="px-2 py-1 rounded-lg text-[10px] font-bold text-white bg-brand">LIVE</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-center gap-3">
        {checklist.isReady && (
          <button
            onClick={() => activateAll.mutate(undefined, { onSuccess: onComplete })}
            disabled={activateAll.isPending}
            className="px-6 py-2.5 rounded-lg text-sm font-bold text-white flex items-center gap-2 disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg,#059669,#10B981)' }}
          >
            {activateAll.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : '🚀'}
            Activate All Channels
          </button>
        )}
      </div>
    </div>
  );
}
