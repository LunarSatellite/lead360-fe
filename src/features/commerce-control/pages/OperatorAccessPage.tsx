import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  Ban,
  Info,
  KeyRound,
  Loader2,
  Monitor,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import {
  ADMIN_ROLE_DESCRIPTION,
  ADMIN_ROLE_LABEL,
  AdminAccountState,
  LEAD360_SUBJECT_PREFIX,
  stylemintAdminsApi,
  type AdminAccount,
} from '../api/stylemint-admins.api';

/**
 * Who can do what on the commerce platform, and what sessions they have open.
 *
 * Since operator tokens became per-operator, a Lead360 operator arrives on the commerce platform
 * with no roles and is refused by the role filters until a SuperAdmin grants them. That is the
 * intended security posture, but it left nobody able to answer "why am I getting 403?" without
 * reading the database. This page answers it.
 *
 * **It is read-only, and that is not an oversight.** Every mutating action on this surface —
 * granting or revoking a role, disabling an account, revoking sessions, clearing MFA — carries
 * `[RequireStepUpMfa]`, checked against `LastStepUpUtc` on the caller's admin session inside a
 * five-minute window. Lead360-issued sessions never set it, because the token issuer asserts no
 * MFA factor: the operator authenticated to Lead360, not to the admin identity provider, and
 * claiming a factor that was never presented is exactly what step-up exists to prevent. Those
 * calls would 403 every time, so the page shows the boundary instead of hiding buttons behind it.
 */
export function OperatorAccessPage() {
  const [selected, setSelected] = useState<AdminAccount | null>(null);

  const accounts = useQuery({
    queryKey: ['stylemint-admin-accounts'],
    queryFn: () => stylemintAdminsApi.list({ pageSize: 100 }),
  });

  return (
    <div className="mx-auto max-w-[1500px] space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-brand">
            Stylemint commerce platform
          </p>
          <h1 className="mt-2 flex items-center gap-2 text-2xl font-black tracking-tight text-text-primary">
            <KeyRound className="h-5 w-5 text-brand" strokeWidth={1.6} />
            Operator access
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Which commerce roles each operator holds, and what sessions they have open.
          </p>
        </div>
        <button
          onClick={() => accounts.refetch()}
          className="flex items-center gap-2 rounded-card border-thin border-border-subtle px-3 py-2 text-xs font-bold text-text-secondary hover:text-brand"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${accounts.isFetching ? 'animate-spin' : ''}`}
            strokeWidth={1.6}
          />
          Refresh
        </button>
      </div>

      <div className="flex items-start gap-3 rounded-frame border-thin border-sky-400/25 bg-sky-400/5 p-4">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" strokeWidth={1.6} />
        <div className="text-xs leading-5 text-text-secondary">
          <p className="font-bold text-text-primary">Changing access happens in the admin console</p>
          <p className="mt-1">
            Granting a role, disabling an account, revoking sessions and clearing MFA all require a
            step-up MFA challenge taken within the last five minutes. A Lead360 sign-in does not
            provide one — deliberately, since you authenticated here and not to the admin identity
            provider. This page reads the current state; the changes are made in the Stylemint
            admin console.
          </p>
        </div>
      </div>

      {accounts.isError && (
        <div className="flex items-start gap-3 rounded-frame border-thin border-rose-400/25 bg-rose-400/5 p-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" strokeWidth={1.6} />
          <p className="text-sm text-text-secondary">{(accounts.error as Error).message}</p>
        </div>
      )}

      {accounts.isLoading ? (
        <div className="flex items-center gap-3 rounded-frame border-thin border-border-subtle bg-bg-card p-8 text-sm text-text-muted">
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.6} /> Loading operators…
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="overflow-hidden rounded-frame border-thin border-border-subtle bg-bg-card">
            {(accounts.data?.items ?? []).map((account) => (
              <AccountRow
                key={account.id}
                account={account}
                active={selected?.id === account.id}
                onClick={() => setSelected(account)}
              />
            ))}
            {(accounts.data?.items.length ?? 0) === 0 && !accounts.isError && (
              <p className="p-10 text-center text-sm text-text-muted">No operator accounts yet.</p>
            )}
          </div>

          <SessionPanel account={selected} />
        </div>
      )}
    </div>
  );
}

function AccountRow({
  account,
  active,
  onClick,
}: {
  account: AdminAccount;
  active: boolean;
  onClick: () => void;
}) {
  const disabled = account.state === AdminAccountState.Disabled;
  // Accounts the Lead360 token issuer created, rather than ones from the admin IdP.
  const fromLead360 = account.ssoSubject.startsWith(LEAD360_SUBJECT_PREFIX);

  return (
    <button
      onClick={onClick}
      className={`w-full border-b border-border-subtle px-4 py-3 text-left last:border-b-0 hover:bg-bg-elevated ${
        active ? 'bg-brand-soft' : ''
      }`}
    >
      <div className="flex items-center gap-2">
        <p className="min-w-0 flex-1 truncate text-sm font-bold text-text-primary">
          {account.displayName}
        </p>
        {fromLead360 && (
          <span className="shrink-0 rounded-sm border-thin border-border-subtle px-2 py-0.5 text-[10px] font-black text-text-muted">
            via Lead360
          </span>
        )}
        {disabled && (
          <span className="flex shrink-0 items-center gap-1 rounded-sm border-thin border-rose-400/25 bg-rose-400/10 px-2 py-0.5 text-[10px] font-black text-rose-300">
            <Ban className="h-3 w-3" strokeWidth={1.6} /> Disabled
          </span>
        )}
      </div>

      <p className="mt-0.5 truncate text-[11px] text-text-muted">{account.email}</p>

      <div className="mt-1.5 flex flex-wrap gap-1">
        {account.roles.length === 0 ? (
          <span className="rounded-sm border-thin border-amber-400/25 bg-amber-400/10 px-2 py-0.5 text-[10px] font-black text-amber-300">
            No roles — refused on every commerce action
          </span>
        ) : (
          account.roles.map((assignment) => (
            <span
              key={assignment.id}
              title={ADMIN_ROLE_DESCRIPTION[assignment.role]}
              className="rounded-sm border-thin border-emerald-400/25 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-black text-emerald-300"
            >
              {ADMIN_ROLE_LABEL[assignment.role] ?? `Role ${assignment.role}`}
            </span>
          ))
        )}
      </div>
    </button>
  );
}

function SessionPanel({ account }: { account: AdminAccount | null }) {
  const sessions = useQuery({
    queryKey: ['stylemint-admin-sessions', account?.id],
    queryFn: () => stylemintAdminsApi.sessions(account!.id),
    enabled: !!account,
  });

  if (!account) {
    return (
      <div className="rounded-frame border-thin border-border-subtle bg-bg-card p-8 text-center">
        <ShieldCheck className="mx-auto h-8 w-8 text-text-muted" strokeWidth={1.6} />
        <p className="mt-3 text-sm text-text-muted">
          Pick an operator to see their roles and open sessions.
        </p>
      </div>
    );
  }

  const now = Date.now();
  const live = (sessions.data ?? []).filter(
    (session) => !session.revokedUtc && new Date(session.expiresUtc).getTime() > now,
  );

  return (
    <div className="space-y-3 rounded-frame border-thin border-border-subtle bg-bg-card p-4">
      <div>
        <p className="text-sm font-bold text-text-primary">{account.displayName}</p>
        <p className="mt-0.5 font-mono text-[11px] text-text-muted">{account.ssoSubject}</p>
      </div>

      <div>
        <p className="text-[10px] font-extrabold uppercase tracking-wider text-text-muted">Roles</p>
        {account.roles.length === 0 ? (
          <p className="mt-1 text-xs text-text-secondary">
            None. This operator authenticates upstream but every commerce action is refused by the
            role filters.
          </p>
        ) : (
          <ul className="mt-1 space-y-1">
            {account.roles.map((assignment) => (
              <li key={assignment.id} className="text-xs text-text-secondary">
                <span className="font-bold text-text-primary">
                  {ADMIN_ROLE_LABEL[assignment.role] ?? assignment.role}
                </span>
                {' — '}
                {ADMIN_ROLE_DESCRIPTION[assignment.role] ?? 'No description'}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-text-muted">
          <Monitor className="h-3 w-3" strokeWidth={1.6} /> Open sessions
        </p>

        {sessions.isLoading ? (
          <p className="mt-1 flex items-center gap-2 text-xs text-text-muted">
            <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.6} /> Loading…
          </p>
        ) : sessions.isError ? (
          <p className="mt-1 text-xs text-rose-300">{(sessions.error as Error).message}</p>
        ) : live.length === 0 ? (
          <p className="mt-1 text-xs text-text-muted">No live sessions.</p>
        ) : (
          <ul className="mt-1 space-y-1.5">
            {live.map((session) => (
              <li
                key={session.id}
                className="rounded-card border-thin border-border-subtle bg-bg-elevated p-2.5"
              >
                <p className="text-[11px] text-text-secondary">
                  Issued {new Date(session.issuedUtc).toLocaleString()}
                </p>
                <p className="mt-0.5 text-[10px] text-text-muted">
                  Expires {new Date(session.expiresUtc).toLocaleTimeString()}
                  {session.sourceIp ? ` · ${session.sourceIp}` : ''}
                </p>
                <p className="mt-0.5 text-[10px] text-text-muted">
                  {session.mfaAssertedUtc
                    ? 'MFA asserted'
                    : 'No MFA assertion — step-up actions refused'}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export { OperatorAccessPage as Component };
