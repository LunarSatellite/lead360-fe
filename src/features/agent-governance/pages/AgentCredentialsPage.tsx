import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Check,
  Copy,
  KeyRound,
  Loader2,
  Plus,
  RefreshCw,
  ShieldOff,
  X,
} from 'lucide-react';
import {
  AGENT_CREDENTIAL_STATUS_LABEL,
  AgentCredentialStatus,
  DEFAULT_LIFETIME_DAYS,
  MAXIMUM_LIFETIME_DAYS,
  agentCredentialsApi,
  isExpired,
  type AgentCredential,
  type IssuedAgentCredential,
} from '../api/agent-credentials.api';

/**
 * Agent credentials — the secrets an autonomous agent redeems for a short-lived token.
 *
 * The secret is shown exactly once, in the response to issuing it. It is stored only as a hash
 * and no endpoint can return it again, so the page says so before issuing and keeps the value
 * on screen until it is explicitly dismissed rather than clearing it on the next render.
 *
 * Revoking is deliberately available to PayoutsOps and ContentMod as well as SuperAdmin: the
 * roles that supervise an agent's work can pull its credential without waiting for someone else.
 */
export function AgentCredentialsPage() {
  const client = useQueryClient();
  const [issuing, setIssuing] = useState(false);
  const [justIssued, setJustIssued] = useState<IssuedAgentCredential | null>(null);

  const credentials = useQuery({
    queryKey: ['agent-credentials'],
    queryFn: () => agentCredentialsApi.list(),
  });

  const refresh = () => client.invalidateQueries({ queryKey: ['agent-credentials'] });

  return (
    <div className="mx-auto max-w-[1500px] space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-brand">
            Agent governance
          </p>
          <h1 className="mt-2 flex items-center gap-2 text-2xl font-black tracking-tight text-text-primary">
            <KeyRound className="h-5 w-5 text-brand" strokeWidth={1.6} />
            Agent credentials
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            What an agent redeems to act as itself. Issuing and revoking are both audited.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIssuing(true)}
            className="flex items-center gap-1.5 rounded-card bg-brand px-3 py-2 text-xs font-bold text-bg hover:bg-brand-light"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={1.6} /> Issue credential
          </button>
          <button
            onClick={() => credentials.refetch()}
            className="flex items-center gap-2 rounded-card border-thin border-border-subtle px-3 py-2 text-xs font-bold text-text-secondary hover:text-brand"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${credentials.isFetching ? 'animate-spin' : ''}`}
              strokeWidth={1.6}
            />
            Refresh
          </button>
        </div>
      </div>

      {justIssued && (
        <SecretOnce issued={justIssued} onDismiss={() => setJustIssued(null)} />
      )}

      {issuing && (
        <IssueForm
          onCancel={() => setIssuing(false)}
          onIssued={(issued) => {
            setIssuing(false);
            setJustIssued(issued);
            refresh();
          }}
        />
      )}

      {credentials.isError && (
        <div className="flex items-start gap-3 rounded-frame border-thin border-rose-400/25 bg-rose-400/5 p-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" strokeWidth={1.6} />
          <p className="text-sm text-text-secondary">{(credentials.error as Error).message}</p>
        </div>
      )}

      {credentials.isLoading ? (
        <div className="flex items-center gap-3 rounded-frame border-thin border-border-subtle bg-bg-card p-8 text-sm text-text-muted">
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.6} /> Loading credentials…
        </div>
      ) : (credentials.data?.length ?? 0) === 0 ? (
        <div className="rounded-frame border-thin border-border-subtle bg-bg-card p-10 text-center">
          <KeyRound className="mx-auto h-7 w-7 text-text-muted" strokeWidth={1.6} />
          <p className="mt-3 text-sm text-text-secondary">No agent credentials have been issued.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {credentials.data!.map((credential) => (
            <CredentialRow key={credential.id} credential={credential} onChanged={refresh} />
          ))}
        </div>
      )}
    </div>
  );
}

function SecretOnce({
  issued,
  onDismiss,
}: {
  issued: IssuedAgentCredential;
  onDismiss: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(issued.secret);
      setCopied(true);
    } catch {
      // Clipboard can be blocked; the value is on screen to copy by hand.
      setCopied(false);
    }
  };

  return (
    <div className="rounded-frame border-thin border-border-glow bg-brand-soft p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-black text-text-primary">
            Secret for {issued.label} — shown once
          </p>
          <p className="mt-0.5 text-[11px] text-text-muted">
            It is stored only as a hash. Nothing can show it again; re-issue if it is lost.
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="shrink-0 rounded-sm border-thin border-border-medium px-2.5 py-1 text-xs font-bold text-text-secondary hover:bg-glass-2"
        >
          Dismiss
        </button>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <code className="min-w-0 flex-1 break-all rounded-sm border-thin border-border-subtle bg-bg-input p-2.5 font-mono text-[11px] text-text-primary">
          {issued.secret}
        </code>
        <button
          onClick={copy}
          className="flex shrink-0 items-center gap-1.5 rounded-sm bg-brand px-3 py-2 text-xs font-bold text-bg hover:bg-brand-light"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5" strokeWidth={1.6} />
          ) : (
            <Copy className="h-3.5 w-3.5" strokeWidth={1.6} />
          )}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      <p className="mt-2 font-mono text-[11px] text-text-muted">
        agent key {issued.agentKey} · expires {new Date(issued.expiresUtc).toLocaleString()}
      </p>
    </div>
  );
}

function IssueForm({
  onCancel,
  onIssued,
}: {
  onCancel: () => void;
  onIssued: (issued: IssuedAgentCredential) => void;
}) {
  const [agentKey, setAgentKey] = useState('');
  const [label, setLabel] = useState('');
  const [lifetime, setLifetime] = useState(DEFAULT_LIFETIME_DAYS);
  const [error, setError] = useState<string | null>(null);

  const issue = useMutation({
    mutationFn: () => agentCredentialsApi.issue(agentKey.trim(), label.trim(), lifetime),
    onSuccess: (issued) => {
      setError(null);
      onIssued(issued);
    },
    onError: (caught: unknown) =>
      setError(caught instanceof Error ? caught.message : 'The credential could not be issued.'),
  });

  const lifetimeValid = lifetime > 0 && lifetime <= MAXIMUM_LIFETIME_DAYS;
  const valid = agentKey.trim() && label.trim() && lifetimeValid;

  return (
    <div className="rounded-frame border-thin border-border-glow bg-brand-soft p-4">
      <p className="text-sm font-black text-text-primary">Issue a credential</p>
      <p className="mt-0.5 text-[11px] text-text-muted">
        The secret is returned once and never again. Have somewhere to put it before you issue.
      </p>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <label className="block">
          <span className="text-[11px] font-bold uppercase tracking-wide text-text-secondary">
            Agent key
          </span>
          <input
            value={agentKey}
            onChange={(e) => setAgentKey(e.target.value)}
            placeholder="pricing-advisor"
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="text-[11px] font-bold uppercase tracking-wide text-text-secondary">
            Label
          </span>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="What this credential is for"
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="text-[11px] font-bold uppercase tracking-wide text-text-secondary">
            Lifetime (days)
          </span>
          <input
            type="number"
            value={lifetime}
            onChange={(e) => setLifetime(Number(e.target.value))}
            className={inputClass}
          />
        </label>
      </div>

      {!lifetimeValid && (
        <p className="mt-1 text-[11px] text-rose-300">
          Lifetime must be between 1 and {MAXIMUM_LIFETIME_DAYS} days.
        </p>
      )}
      {error && <p className="mt-2 text-xs text-rose-300">{error}</p>}

      <div className="mt-3 flex items-center gap-2">
        <button
          disabled={!valid || issue.isPending}
          onClick={() => issue.mutate()}
          className="flex items-center gap-1.5 rounded-sm bg-brand px-3 py-1.5 text-xs font-bold text-bg hover:bg-brand-light disabled:opacity-40"
        >
          {issue.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.6} />
          ) : (
            <KeyRound className="h-3.5 w-3.5" strokeWidth={1.6} />
          )}
          Issue
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 rounded-sm border-thin border-border-medium px-3 py-1.5 text-xs font-bold text-text-secondary hover:bg-glass-2 hover:text-text-primary"
        >
          <X className="h-3.5 w-3.5" strokeWidth={1.6} /> Cancel
        </button>
      </div>
    </div>
  );
}

function CredentialRow({
  credential,
  onChanged,
}: {
  credential: AgentCredential;
  onChanged: () => void;
}) {
  const [revoking, setRevoking] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const revoke = useMutation({
    mutationFn: () => agentCredentialsApi.revoke(credential.id, reason.trim()),
    onSuccess: () => {
      setRevoking(false);
      setReason('');
      setError(null);
      onChanged();
    },
    onError: (caught: unknown) =>
      setError(caught instanceof Error ? caught.message : 'The credential could not be revoked.'),
  });

  const expired = isExpired(credential);
  const active = credential.status === AgentCredentialStatus.Active && !expired;

  return (
    <div className="rounded-card border-thin border-border-subtle bg-glass-1 p-3.5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-xs border-thin px-1.5 py-0.5 text-[10px] font-bold ${
                credential.status === AgentCredentialStatus.Revoked
                  ? 'border-rose-400/25 bg-rose-400/5 text-rose-300'
                  : expired
                    ? 'border-amber-400/25 bg-amber-400/5 text-amber-300'
                    : 'border-border-glow bg-brand-soft text-brand'
              }`}
            >
              {expired
                ? 'Expired'
                : (AGENT_CREDENTIAL_STATUS_LABEL[credential.status] ?? credential.status)}
            </span>
            <span className="text-sm font-bold text-text-primary">{credential.label}</span>
            <span className="font-mono text-[11px] text-text-muted">{credential.agentKey}</span>
          </div>
          <p className="mt-1 text-[11px] text-text-muted">
            Issued {new Date(credential.issuedUtc).toLocaleString()} · expires{' '}
            {new Date(credential.expiresUtc).toLocaleString()}
            {credential.lastUsedUtc
              ? ` · last used ${new Date(credential.lastUsedUtc).toLocaleString()}`
              : ' · never used'}
          </p>
          {credential.revocationReason && (
            <p className="mt-1 text-xs text-rose-300">
              Revoked{credential.revokedUtc ? ` ${new Date(credential.revokedUtc).toLocaleString()}` : ''}{' '}
              — {credential.revocationReason}
            </p>
          )}
        </div>

        {active && (
          <button
            onClick={() => {
              setRevoking(true);
              setError(null);
            }}
            className="flex shrink-0 items-center gap-1.5 rounded-sm border-thin border-border-medium px-3 py-1.5 text-xs font-bold text-text-secondary hover:bg-glass-2 hover:text-rose-300"
          >
            <ShieldOff className="h-3.5 w-3.5" strokeWidth={1.6} /> Revoke
          </button>
        )}
      </div>

      {revoking && (
        <div className="mt-3 rounded-sm border-thin border-rose-400/25 bg-rose-400/5 p-3">
          <p className="text-xs font-bold text-text-primary">Revoke this credential</p>
          <p className="mt-0.5 text-[11px] text-text-muted">
            Enforced on every call and cancels the agent's in-flight executions. The reason is
            recorded in the evidence log.
          </p>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason"
            className={`mt-2 ${inputClass}`}
          />
          {error && <p className="mt-2 text-xs text-rose-300">{error}</p>}
          <div className="mt-2 flex items-center gap-2">
            <button
              disabled={!reason.trim() || revoke.isPending}
              onClick={() => revoke.mutate()}
              className="flex items-center gap-1.5 rounded-sm bg-rose-400/20 px-3 py-1.5 text-xs font-bold text-rose-200 hover:bg-rose-400/30 disabled:opacity-40"
            >
              {revoke.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.6} />}
              Confirm revoke
            </button>
            <button
              onClick={() => {
                setRevoking(false);
                setReason('');
                setError(null);
              }}
              className="rounded-sm border-thin border-border-medium px-3 py-1.5 text-xs font-bold text-text-secondary hover:bg-glass-2 hover:text-text-primary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && !revoking && <p className="mt-2 text-xs text-rose-300">{error}</p>}
    </div>
  );
}

const inputClass =
  'mt-1 w-full rounded-sm border-thin border-border-subtle bg-bg-input px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:border-border-glow focus:outline-none';

export { AgentCredentialsPage as Component };
