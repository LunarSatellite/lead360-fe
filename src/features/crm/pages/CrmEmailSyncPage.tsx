import { AlertTriangle, Loader2, Mail, RefreshCw, Unplug } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import {
  useDisconnectEmailIntegration,
  useEmailIntegrations,
  useSyncEmailIntegration,
} from '../api/crm-email-sync.queries';
import {
  EMAIL_PROVIDER_LABEL,
  EMAIL_STATUS_LABEL,
  EmailIntegrationStatus,
  type EmailIntegrationSummaryDto,
} from '../types/crm-email-sync.types';

const STATUS_CLASS: Record<EmailIntegrationStatus, string> = {
  [EmailIntegrationStatus.Active]: 'text-success bg-success-soft border-success/20',
  [EmailIntegrationStatus.Paused]: 'text-warning bg-warning-soft border-warning/20',
  [EmailIntegrationStatus.Error]: 'text-danger bg-danger-soft border-danger/20',
  [EmailIntegrationStatus.Disconnected]:
    'text-text-muted bg-bg-elevated border-border-subtle',
};

export function Component() {
  const { data, isLoading } = useEmailIntegrations();
  const disconnect = useDisconnectEmailIntegration();
  const sync = useSyncEmailIntegration();

  const rows = (data ?? []) as EmailIntegrationSummaryDto[];
  const stale = rows.filter(
    (r) => r.status === EmailIntegrationStatus.Error
  );

  return (
    <div className="py-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-brand-soft border border-border-glow flex items-center justify-center">
          <Mail className="w-6 h-6 text-brand" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-text-primary">Email sync</h1>
          <p className="text-sm text-text-muted">
            Connected mailboxes, and when each last brought messages into the CRM.
          </p>
        </div>
      </div>

      {stale.length > 0 && (
        <p
          className="rounded-2xl border border-danger/20 bg-danger-soft px-5 py-4 text-sm text-text-secondary"
          data-testid="email-sync-error-banner"
        >
          <span className="font-semibold text-text-primary">
            {stale.length} {stale.length === 1 ? 'mailbox has' : 'mailboxes have'}{' '}
            stopped syncing.
          </span>{' '}
          Mail from {stale.length === 1 ? 'it' : 'them'} is not reaching the CRM, and
          nothing on a contact's timeline will say so — reconnect, or the gap reads
          as "this customer went quiet".
        </p>
      )}

      {/* Connecting is an OAuth round trip through the provider, which this
          console cannot complete on the user's behalf — the server hands back
          a consent URL and the provider redirects to the callback. Until that
          redirect target is configured for this deployment there is nothing
          honest to put behind a "Connect" button, so the page manages what is
          already connected and says where connecting happens. */}
      <p className="text-sm text-text-muted">
        Mailboxes are connected from the provider's consent screen. Ask an
        administrator to run the connect flow for a new account.
      </p>

      <div className="rounded-2xl border border-border-subtle bg-bg-card px-5 py-4">
        {isLoading ? (
          <div className="flex justify-center py-12 text-text-muted">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-12">
            No mailbox connected — reps' one-to-one email never reaches the CRM.
          </p>
        ) : (
          <ul className="divide-y divide-border-subtle">
            {rows.map((r) => (
              <li key={r.id} className="py-3 flex items-center gap-3 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <p className="text-sm text-text-primary font-medium">{r.email}</p>
                  <p className="text-xs text-text-muted mt-0.5">
                    {EMAIL_PROVIDER_LABEL[r.provider] ?? 'Unknown provider'}
                    {' · '}
                    {r.lastSyncedAt ? (
                      <>
                        synced{' '}
                        {formatDistanceToNow(parseISO(r.lastSyncedAt), {
                          addSuffix: true,
                        })}
                      </>
                    ) : (
                      <span className="text-warning">never synced</span>
                    )}
                  </p>
                </div>

                {r.status === EmailIntegrationStatus.Error && (
                  <AlertTriangle className="w-4 h-4 text-danger" />
                )}
                <span
                  className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${STATUS_CLASS[r.status]}`}
                >
                  {EMAIL_STATUS_LABEL[r.status] ?? 'Unknown'}
                </span>

                <button
                  onClick={() => sync.mutate(r.id)}
                  disabled={
                    sync.isPending || r.status === EmailIntegrationStatus.Disconnected
                  }
                  className="flex items-center gap-1.5 rounded-xl border border-border-medium px-3 py-1.5 text-xs font-semibold text-text-secondary hover:border-border-glow disabled:opacity-40"
                >
                  <RefreshCw className="w-3 h-3" /> Sync now
                </button>
                <button
                  aria-label={`Disconnect ${r.email}`}
                  onClick={() => disconnect.mutate(r.id)}
                  disabled={disconnect.isPending}
                  className="rounded-xl border border-border-medium p-1.5 text-text-muted hover:text-danger hover:border-danger/20 disabled:opacity-40"
                >
                  <Unplug className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
