import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Video, CheckCircle2, Link2, Loader2, Star, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { env } from '@/shared/config/env';
import {
  useVideoConferencingStatus,
  useConnectVideoProvider,
  useDisconnectVideoProvider,
  useSetDefaultVideoProvider,
} from '../api/videoConferencing.queries';
import { PROVIDER_LABELS, type VideoProvider } from '../api/videoConferencing.api';

const PROVIDER_ICONS: Record<number, string> = {
  1: '🔵', // Zoom
  2: '🟢', // Google Meet
  3: '🟣', // Teams
  4: '🔷', // Webex
  5: '🟡', // GoToMeeting
};

const PROVIDER_DESCRIPTIONS: Record<number, string> = {
  1: 'Connect your Zoom account to auto-create Zoom meeting links when booking meetings.',
  2: 'Connect your Google account to auto-create Google Meet links via Google Calendar.',
  3: 'Connect your Microsoft account to auto-create Teams meeting links.',
  4: 'Connect your Webex account to auto-create Webex meeting links.',
  5: 'Connect your GoToMeeting account to auto-create GoToMeeting links.',
};

type ProviderState = 'connected' | 'available' | 'not-configured';

function ProviderCard({
  provider,
  state,
  isDefault,
  email,
  accountName,
  totalMeetings,
  lastUsed,
  onConnect,
  onDisconnect,
  onSetDefault,
  isConnecting,
  isDisconnecting,
  isSettingDefault,
}: {
  provider: VideoProvider;
  state: ProviderState;
  isDefault: boolean;
  email?: string;
  accountName?: string;
  totalMeetings?: number;
  lastUsed?: string;
  onConnect: () => void;
  onDisconnect: () => void;
  onSetDefault: () => void;
  isConnecting: boolean;
  isDisconnecting: boolean;
  isSettingDefault: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const connected = state === 'connected';

  return (
    <div className={`rounded-xl border transition-all ${
      connected
        ? 'border-[rgba(99,102,241,0.4)] bg-[rgba(99,102,241,0.05)]'
        : state === 'not-configured'
          ? 'border-border-subtle bg-bg-elevated opacity-50'
          : 'border-border-subtle bg-bg-elevated'
    }`}>
      <div className="flex items-center gap-3 p-4">
        <span className="text-2xl">{PROVIDER_ICONS[provider]}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-semibold ${state === 'not-configured' ? 'text-text-muted' : 'text-text-primary'}`}>
              {PROVIDER_LABELS[provider]}
            </span>
            {connected && (
              <span className="flex items-center gap-1 text-xs font-medium text-green-400 bg-green-400/10 border border-green-400/20 rounded-full px-2 py-0.5">
                <CheckCircle2 className="w-3 h-3" /> Connected
              </span>
            )}
            {isDefault && connected && (
              <span className="flex items-center gap-1 text-xs font-medium text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-full px-2 py-0.5">
                <Star className="w-3 h-3 fill-amber-400" /> Default
              </span>
            )}
            {state === 'not-configured' && (
              <span className="text-xs font-medium text-text-muted bg-bg-card border border-border-subtle rounded-full px-2 py-0.5">
                Not available
              </span>
            )}
          </div>
          {connected && (email || accountName) && (
            <p className="text-xs text-text-muted mt-0.5 truncate">{accountName ?? email}</p>
          )}
          {!connected && state !== 'not-configured' && (
            <p className="text-xs text-text-muted mt-0.5">{PROVIDER_DESCRIPTIONS[provider]}</p>
          )}
          {state === 'not-configured' && (
            <p className="text-xs text-text-muted mt-0.5">Contact your administrator to enable this integration.</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {connected ? (
            <>
              <button
                onClick={() => setExpanded(e => !e)}
                className="p-1.5 rounded-lg hover:bg-bg-card text-text-muted hover:text-text-primary transition-colors"
                title="Details"
              >
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {!isDefault && (
                <button
                  onClick={onSetDefault}
                  disabled={isSettingDefault}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border-subtle text-text-muted hover:text-text-primary hover:border-border-glow transition-colors disabled:opacity-50"
                >
                  {isSettingDefault ? <Loader2 className="w-3 h-3 animate-spin" /> : <Star className="w-3 h-3" />}
                  Set default
                </button>
              )}
              <button
                onClick={onDisconnect}
                disabled={isDisconnecting}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
              >
                {isDisconnecting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                Disconnect
              </button>
            </>
          ) : state === 'available' ? (
            <button
              onClick={onConnect}
              disabled={isConnecting}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[rgba(99,102,241,0.15)] text-[#818CF8] border border-[rgba(99,102,241,0.3)] hover:bg-[rgba(99,102,241,0.25)] transition-colors disabled:opacity-50"
            >
              {isConnecting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Link2 className="w-3 h-3" />}
              Connect
            </button>
          ) : null}
        </div>
      </div>

      {expanded && connected && (
        <div className="px-4 pb-4 pt-0 border-t border-border-subtle mt-0">
          <div className="grid grid-cols-3 gap-3 mt-3 text-xs">
            {email && (
              <div>
                <p className="text-text-muted font-medium uppercase tracking-wider mb-0.5">Account Email</p>
                <p className="text-text-primary truncate">{email}</p>
              </div>
            )}
            <div>
              <p className="text-text-muted font-medium uppercase tracking-wider mb-0.5">Meetings Created</p>
              <p className="text-text-primary">{totalMeetings ?? 0}</p>
            </div>
            {lastUsed && (
              <div>
                <p className="text-text-muted font-medium uppercase tracking-wider mb-0.5">Last Used</p>
                <p className="text-text-primary">{new Date(lastUsed).toLocaleDateString()}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function Component() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: status, isLoading, refetch } = useVideoConferencingStatus();
  const connectMutation       = useConnectVideoProvider();
  const disconnectMutation    = useDisconnectVideoProvider();
  const setDefaultMutation    = useSetDefaultVideoProvider();

  const allProviders: VideoProvider[] = [1, 2, 3, 4, 5];

  // Backend handles the OAuth callback and redirects back here with ?vc_connected or ?vc_error
  const backendCallbackUrl = `${env.apiBaseUrl.replace(/\/$/, '')}/v1/video-conferencing/callback`;

  useEffect(() => {
    const connected = searchParams.get('vc_connected');
    const error     = searchParams.get('vc_error');

    if (connected) {
      const name = PROVIDER_LABELS[Number(connected) as VideoProvider] ?? 'Provider';
      toast.success(`${name} connected successfully!`);
      refetch();
      setSearchParams({}, { replace: true });
    } else if (error) {
      toast.error(`Connection failed: ${error.replace(/_/g, ' ')}`);
      setSearchParams({}, { replace: true });
    }
  }, []);

  const connectedMap      = new Map(status?.connected.map(c => [c.provider, c]) ?? []);
  const notConfiguredSet  = new Set(status?.notConfigured ?? []);

  function providerState(provider: VideoProvider): ProviderState {
    if (connectedMap.has(provider))     return 'connected';
    if (notConfiguredSet.has(provider)) return 'not-configured';
    return 'available';
  }

  function handleConnect(provider: VideoProvider) {
    connectMutation.mutate({ provider, redirectUri: backendCallbackUrl });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-text-muted" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-8 px-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-[rgba(99,102,241,0.1)]">
          <Video className="w-5 h-5 text-[#818CF8]" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-text-primary">Video Conferencing</h1>
          <p className="text-sm text-text-muted">
            Connect your preferred video provider. Meeting links are auto-generated when CRM meetings are booked and included in calendar invites sent to all parties.
          </p>
        </div>
      </div>

      {status?.defaultProvider && (
        <div className="p-3 rounded-xl bg-green-500/5 border border-green-500/20 text-sm text-green-400 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>
            <strong>{PROVIDER_LABELS[status.defaultProvider]}</strong> is your default — meeting links are auto-generated on this platform when a meeting is booked.
          </span>
        </div>
      )}

      {!status?.connected.length && (
        <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-sm text-amber-400">
          No provider connected yet. Connect one below and meeting links will be automatically created and sent to everyone when a meeting is booked.
        </div>
      )}

      <div className="space-y-3">
        {allProviders.map(provider => {
          const conn  = connectedMap.get(provider);
          const pState = providerState(provider);
          return (
            <ProviderCard
              key={provider}
              provider={provider}
              state={pState}
              isDefault={status?.defaultProvider === provider}
              email={conn?.providerEmail}
              accountName={conn?.providerAccountName}
              totalMeetings={conn?.totalMeetingsCreated}
              lastUsed={conn?.lastUsedAt}
              onConnect={() => handleConnect(provider)}
              onDisconnect={() => disconnectMutation.mutate(provider)}
              onSetDefault={() => setDefaultMutation.mutate(provider)}
              isConnecting={connectMutation.isPending && connectMutation.variables?.provider === provider}
              isDisconnecting={disconnectMutation.isPending && disconnectMutation.variables === provider}
              isSettingDefault={setDefaultMutation.isPending && setDefaultMutation.variables === provider}
            />
          );
        })}
      </div>

      <div className="p-4 rounded-xl bg-bg-elevated border border-border-subtle text-xs text-text-muted space-y-1">
        <p className="font-semibold text-text-primary mb-1">How it works</p>
        <p>• Connect your preferred provider using the OAuth button above.</p>
        <p>• When a CRM meeting is booked, a video link is automatically created and included in the calendar invite sent to the contact.</p>
        <p>• You can connect multiple providers and set one as the default.</p>
        <p>• Credentials are encrypted at rest — Lead360 only stores the OAuth access token, never your password.</p>
      </div>
    </div>
  );
}