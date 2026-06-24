import { useEffect, useState } from 'react';
import { Loader2, CheckCircle, XCircle, RefreshCw, Plug, Terminal, Wifi } from 'lucide-react';
import { useTestChannelStatus, useTestChannelConnection } from '../api/test-channel.queries';
import { StatusBadge } from '@/shared/components';

interface TestChannelSetupProps {
  tenantId: string;
  onReady: (connectionId: string) => void;
}

type SetupStatus = 'checking' | 'connecting' | 'ready' | 'error';

/**
 * Manages only the connection lifecycle:
 *
 * 1. GET /test-channel/status          → Is the backend available?
 * 2. GET /test-channel/connection/{id} → Get or auto-create a ChannelConnection
 * 3. → onReady(connectionId)           → Parent enables the chat UI
 *
 * Session is NOT started here — it starts lazily when the user sends their first message.
 */
export function TestChannelSetup({ tenantId, onReady }: TestChannelSetupProps) {
  const [setupStatus, setSetupStatus] = useState<SetupStatus>('checking');
  const [errorMsg, setErrorMsg] = useState('');

  // Step 1: Check backend status
  const statusQuery = useTestChannelStatus();

  // Step 2: Get or create connection (only after status check passes)
  const connectionQuery = useTestChannelConnection(statusQuery.isSuccess ? tenantId : undefined);

  // Drive the state machine
  useEffect(() => {
    // Step 1
    if (statusQuery.isLoading) {
      setSetupStatus('checking');
      return;
    }
    if (statusQuery.isError) {
      setSetupStatus('error');
      setErrorMsg('Test channel service is unavailable. Make sure the backend is running.');
      return;
    }

    // Step 2
    if (connectionQuery.isLoading) {
      setSetupStatus('connecting');
      return;
    }
    if (connectionQuery.isError) {
      setSetupStatus('error');
      setErrorMsg('Failed to create test channel connection. Check backend logs.');
      return;
    }

    // Done — we have a connection ID
    const connectionId = connectionQuery.data as unknown as string;
    if (!connectionId) {
      setSetupStatus('connecting');
      return;
    }

    if (setupStatus !== 'ready') {
      setSetupStatus('ready');
      onReady(connectionId);
    }
  }, [
    statusQuery.isLoading,
    statusQuery.isSuccess,
    statusQuery.isError,
    connectionQuery.isLoading,
    connectionQuery.isError,
    connectionQuery.data,
    onReady,
    setupStatus,
  ]);

  const handleRetry = () => {
    setSetupStatus('checking');
    setErrorMsg('');
    statusQuery.refetch();
  };

  // Ready — show nothing (parent takes over)
  if (setupStatus === 'ready') return null;

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="bg-glass-1 border border-border-subtle rounded-2xl p-8 space-y-6">
          {/* Header */}
          <div className="text-center">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-brand to-success flex items-center justify-center mx-auto mb-4">
              <Terminal className="w-7 h-7 text-white" strokeWidth={1.8} />
            </div>
            <h2 className="text-xl font-extrabold text-text-primary tracking-tight">
              Setting up test channel
            </h2>
            <p className="text-sm text-text-secondary mt-1">Connecting to the conversation engine...</p>
          </div>

          {/* Steps */}
          <div className="space-y-2">
            <SetupStep
              label="Check engine status"
              status={
                statusQuery.isLoading
                  ? 'loading'
                  : statusQuery.isError
                    ? 'error'
                    : statusQuery.isSuccess
                      ? 'done'
                      : 'pending'
              }
            />
            <SetupStep
              label="Create channel connection"
              status={
                !statusQuery.isSuccess
                  ? 'pending'
                  : connectionQuery.isLoading
                    ? 'loading'
                    : connectionQuery.isError
                      ? 'error'
                      : connectionQuery.data
                        ? 'done'
                        : 'pending'
              }
            />
          </div>

          {/* Connection info */}
          {connectionQuery.data && (
            <div className="px-3 py-2.5 rounded-lg bg-glass-1 border border-border-subtle">
              <div className="flex items-center gap-2">
                <Plug className="w-3.5 h-3.5 text-success" strokeWidth={1.6} />
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                  Connection ID
                </span>
              </div>
              <div className="text-[10px] font-mono text-text-secondary mt-1 truncate">
                {String(connectionQuery.data)}
              </div>
            </div>
          )}

          {/* Error state */}
          {setupStatus === 'error' && (
            <div className="space-y-3">
              <div className="px-4 py-3 rounded-lg bg-danger-soft border border-[rgba(244,63,94,0.15)]">
                <div className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-danger flex-shrink-0 mt-0.5" strokeWidth={1.6} />
                  <p className="text-xs text-danger leading-relaxed">{errorMsg}</p>
                </div>
              </div>
              <button
                onClick={handleRetry}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-glass-2 border border-border-medium
                           text-sm font-semibold text-text-secondary hover:text-text-primary hover:bg-glass-3 transition-all"
              >
                <RefreshCw className="w-4 h-4" strokeWidth={1.6} />
                Retry setup
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Setup Step Row ───

type StepStatus = 'pending' | 'loading' | 'done' | 'error';

function SetupStep({ label, status }: { label: string; status: StepStatus }) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border transition-all duration-200 ${
        status === 'done'
          ? 'bg-success-soft border-[rgba(16,185,129,0.15)]'
          : status === 'loading'
            ? 'bg-brand-soft border-brand'
            : status === 'error'
              ? 'bg-danger-soft border-[rgba(244,63,94,0.15)]'
              : 'bg-glass-1 border-border-subtle opacity-40'
      }`}
    >
      <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
        {status === 'loading' && <Loader2 className="w-4 h-4 text-brand animate-spin" />}
        {status === 'done' && <CheckCircle className="w-4 h-4 text-success" strokeWidth={2} />}
        {status === 'error' && <XCircle className="w-4 h-4 text-danger" strokeWidth={2} />}
        {status === 'pending' && <Wifi className="w-4 h-4 text-text-muted" strokeWidth={1.6} />}
      </div>
      <span
        className={`text-xs font-semibold flex-1 ${
          status === 'done'
            ? 'text-success'
            : status === 'loading'
              ? 'text-brand'
              : status === 'error'
                ? 'text-danger'
                : 'text-text-muted'
        }`}
      >
        {label}
      </span>
      {status === 'done' && <StatusBadge variant="success">Connected</StatusBadge>}
      {status === 'loading' && <StatusBadge variant="brand">Connecting...</StatusBadge>}
      {status === 'error' && <StatusBadge variant="danger">Failed</StatusBadge>}
    </div>
  );
}
