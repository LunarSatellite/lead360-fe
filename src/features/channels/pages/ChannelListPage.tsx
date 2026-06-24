import { useState } from 'react';
import { Radio, Plus, Loader2, Phone } from 'lucide-react';
import { useChannels, useChannelStats, useHasActiveChannel } from '../api/channels.queries';
import { ChannelConnectionCard } from '../components/ChannelConnectionCard';
import { AvailableChannelCard } from '../components/AvailableChannelCard';
import { CreateChannelDialog } from '../components/CreateChannelDialog';
import { ChannelConnectModal } from '../components/ChannelConnectModal';
import type { ChannelConnectionDto, ChannelStatsResponse, ChannelTypeValue } from '../types/channels.types';
import { ChannelType, ChannelConnectionStatus } from '../types/channels.types';

const ALL_CHANNEL_TYPES: ChannelTypeValue[] = [
  ChannelType.WhatsApp,
  ChannelType.Messenger,
  ChannelType.Instagram,
  ChannelType.Telegram,
  ChannelType.SMS,
  ChannelType.Voice,
  ChannelType.WebChat,
  ChannelType.Email,
  ChannelType.Viber,
];

export function Component() {
  const [createOpen, setCreateOpen] = useState(false);
  const [connectType, setConnectType] = useState<ChannelTypeValue | null>(null);
  const tenantId = localStorage.getItem('omniflow_tenant_id') ?? '';

  const { data: connectionsRaw, isLoading } = useChannels();
  const { data: statsRaw } = useChannelStats();
  useHasActiveChannel();

  const connections = (connectionsRaw as unknown as ChannelConnectionDto[]) ?? [];
  const stats = (statsRaw as unknown as ChannelStatsResponse) ?? null;

  const activeConns = connections.filter((c) => c.status === ChannelConnectionStatus.Active);
  const pausedConns = connections.filter((c) => c.status !== ChannelConnectionStatus.Active);
  const activeCount = activeConns.length;

  const connectedTypes = new Set(connections.map((c) => c.channelType));
  const availableTypes = ALL_CHANNEL_TYPES.filter((t) => !connectedTypes.has(t));

  const sortedActive = [...activeConns].sort((a, b) => {
    const aTime = a.lastMessageReceivedAt ? new Date(a.lastMessageReceivedAt).getTime() : 0;
    const bTime = b.lastMessageReceivedAt ? new Date(b.lastMessageReceivedAt).getTime() : 0;
    return bTime - aTime;
  });

  const heroConn = sortedActive[0] || null;
  const secondaryConns = sortedActive.slice(1);

  return (
    <div className="space-y-4">

      {/* ─── Header ─── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-sm bg-brand-soft border-thin border-border-glow flex items-center justify-center">
            <Radio className="w-4 h-4 text-brand" strokeWidth={1.6} />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-text-primary tracking-tight leading-none">Channels</h1>
            <div className="flex items-center gap-1.5 mt-1">
              {activeCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs bg-glass-1 border-thin border-border-subtle text-2xs font-semibold text-success">
                  <span className="w-1 h-1 rounded-full bg-success inline-block" />
                  {activeCount} live
                </span>
              )}
              {pausedConns.length > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs bg-glass-1 border-thin border-border-subtle text-2xs font-semibold text-warning">
                  {pausedConns.length} paused
                </span>
              )}
              {stats && connections.length > 0 && (
                <span className="text-2xs text-text-muted">{connections.length} total</span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-sm bg-brand text-bg text-sm font-bold hover:bg-brand-light transition-all"
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          Add channel
        </button>
      </div>

      {/* ─── Zone 1: Your channels ─── */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-brand animate-spin" />
        </div>
      ) : connections.length === 0 ? (
        <div className="relative rounded-frame bg-bg-shell border-thin border-border-subtle p-16 flex flex-col items-center justify-center text-center overflow-hidden">
          <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full blur-3xl bg-brand/5" />
          <div className="w-12 h-12 rounded-card bg-glass-2 border-thin border-border-subtle flex items-center justify-center mb-4">
            <Phone className="w-6 h-6 text-text-muted" strokeWidth={1.6} />
          </div>
          <p className="text-base font-extrabold text-text-primary">No channels connected</p>
          <p className="text-sm text-text-secondary mt-1.5 max-w-sm leading-relaxed">
            Choose from the available connectors below to start receiving messages on any platform.
          </p>
        </div>
      ) : (
        <div className="rounded-frame bg-bg-shell border-thin border-border-subtle p-4">
          <div className="flex items-center gap-2 mb-4 px-1">
            <span className="w-1.5 h-1.5 rounded-full bg-success flex-shrink-0" />
            <span className="text-sm font-semibold text-text-primary">Your channels</span>
            <span className="text-xs text-text-muted">{connections.length} connected</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {sortedActive.map((conn) => (
              <div key={conn.id}>
                <ChannelConnectionCard connection={conn} variant="medium" />
              </div>
            ))}
            {pausedConns.map((conn) => (
              <div key={conn.id} className="col-span-2">
                <ChannelConnectionCard connection={conn} variant="bar" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Zone 2: Available channels ─── */}
      {availableTypes.length > 0 && (
        <div className="rounded-frame bg-bg-shell border-thin border-border-subtle p-4">
          <div className="flex items-center gap-2 mb-4 px-1">
            <Plus className="w-3.5 h-3.5 text-text-muted" strokeWidth={1.5} />
            <span className="text-sm font-semibold text-text-secondary">Available to connect</span>
            <span className="text-xs text-text-muted">{availableTypes.length} channels</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {availableTypes.map((type) => (
              <AvailableChannelCard key={type} channelType={type} onConnect={(ct) => setConnectType(ct)} />
            ))}
          </div>
        </div>
      )}

      <CreateChannelDialog tenantId={tenantId} open={createOpen} onClose={() => setCreateOpen(false)} />
      {connectType !== null && (
        <ChannelConnectModal
          open={true}
          onClose={() => setConnectType(null)}
          tenantId={tenantId}
          channelType={connectType}
        />
      )}
    </div>
  );
}
