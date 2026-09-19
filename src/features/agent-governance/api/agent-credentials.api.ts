import { stylemintOperationsApi } from '@/features/commerce-control/api/stylemint-operations.api';

/**
 * Typed client for agent credentials — the secrets an autonomous agent redeems for a short-lived
 * token that puts its `agent_key` onto a principal.
 *
 * Issuance is itself a governed, audited act: every issue and every revoke lands in the same
 * append-only evidence log as the actions the credential goes on to propose.
 *
 * Issuing takes SuperAdmin; revoking also allows PayoutsOps and ContentMod, so the roles that
 * supervise an agent's work can pull its credential without waiting for a SuperAdmin. Reading
 * additionally allows Readonly.
 *
 * The secret is returned exactly once, on issue. It is never stored in a readable form and no
 * endpoint can show it again.
 */

export const AgentCredentialStatus = { Active: 1, Revoked: 2 } as const;
export const AGENT_CREDENTIAL_STATUS_LABEL: Record<number, string> = {
  1: 'Active',
  2: 'Revoked',
};

export type AgentCredential = {
  id: string;
  agentKey: string;
  label: string;
  status: number;
  issuedByAccountId: string;
  issuedUtc: string;
  expiresUtc: string;
  revokedByAccountId?: string | null;
  revokedUtc?: string | null;
  revocationReason?: string | null;
  lastUsedUtc?: string | null;
};

/** Only ever seen once, in the response to an issue. */
export type IssuedAgentCredential = {
  id: string;
  agentKey: string;
  label: string;
  issuedUtc: string;
  expiresUtc: string;
  secret: string;
};

const BASE = 'v1/admin/agent-credentials';

/** Mirrors AgentCredential.DefaultLifetimeDays / MaximumLifetimeDays. */
export const DEFAULT_LIFETIME_DAYS = 30;
export const MAXIMUM_LIFETIME_DAYS = 365;

function unwrap<T>(response: { status: number; body: unknown }): T {
  if (response.status >= 200 && response.status < 300) return response.body as T;

  const body = response.body as { title?: string; message?: string } | undefined;
  const detail = body?.title ?? body?.message;

  if (response.status === 403) {
    throw new Error(
      detail ??
        'Issuing an agent credential takes the Stylemint SuperAdmin role. ' +
          'Revoking also allows PayoutsOps and ContentMod.',
    );
  }
  throw new Error(detail ?? `The agent-credential surface returned HTTP ${response.status}.`);
}

/** Active but past its expiry — the list shows this separately from Revoked. */
export function isExpired(credential: AgentCredential): boolean {
  return (
    credential.status === AgentCredentialStatus.Active &&
    new Date(credential.expiresUtc).getTime() <= Date.now()
  );
}

export const agentCredentialsApi = {
  list: async (): Promise<AgentCredential[]> =>
    unwrap<AgentCredential[]>(
      await stylemintOperationsApi.invoke({ method: 'GET', path: BASE }),
    ),

  issue: async (
    agentKey: string,
    label: string,
    lifetimeDays?: number,
  ): Promise<IssuedAgentCredential> =>
    unwrap<IssuedAgentCredential>(
      await stylemintOperationsApi.invoke({
        method: 'POST',
        path: BASE,
        body: JSON.stringify({ agentKey, label, lifetimeDays: lifetimeDays ?? null }),
      }),
    ),

  /** Revocation is enforced on every call and cancels the agent's in-flight executions. */
  revoke: async (credentialId: string, reason: string): Promise<AgentCredential> =>
    unwrap<AgentCredential>(
      await stylemintOperationsApi.invoke({
        method: 'POST',
        path: `${BASE}/${encodeURIComponent(credentialId)}/revoke`,
        body: JSON.stringify({ reason }),
      }),
    ),
};
