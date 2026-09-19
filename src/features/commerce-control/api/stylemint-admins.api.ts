import { stylemintOperationsApi } from './stylemint-operations.api';

/**
 * Typed client for the Stylemint admin accounts surface — who holds which commerce roles, and
 * what sessions they have open.
 *
 * **Reads only, on purpose.** Every mutating action on this surface
 * (`POST/DELETE .../roles/{role}`, `disable`, `enable`, `sessions/revoke-all`, `DELETE .../mfa`)
 * carries `[RequireStepUpMfa]`, which checks `LastStepUpUtc` on the caller's admin session inside
 * a five-minute window. A Lead360-issued operator session never sets it — the token issuer
 * deliberately asserts no MFA factor, because the operator authenticated to Lead360 and not to
 * the admin identity provider. So those calls would 403 every time, and shipping them as buttons
 * would be shipping a broken page.
 */

export const ADMIN_ROLE_LABEL: Record<number, string> = {
  1: 'SuperAdmin',
  2: 'KycReviewer',
  3: 'ContentMod',
  4: 'SupportAgent',
  5: 'PayoutsOps',
  6: 'Readonly',
};

/** What each role lets an operator actually do, for the people granting them. */
export const ADMIN_ROLE_DESCRIPTION: Record<number, string> = {
  1: 'Everything, including granting roles',
  2: 'Creator and vendor application review',
  3: 'Content moderation queue',
  4: 'Support tickets; read-only order and customer info',
  5: 'Payout holds and manual refunds',
  6: 'Analytics and lookups, no writes',
};

export const AdminAccountState = { Active: 1, Disabled: 2 } as const;

export type AdminRoleAssignment = {
  id: string;
  adminAccountId: string;
  role: number;
  assignedUtc: string;
  assignedByAdminId: string;
};

export type AdminAccount = {
  id: string;
  ssoSubject: string;
  email: string;
  displayName: string;
  state: number;
  lastLoginUtc: string;
  createdUtc: string;
  roles: AdminRoleAssignment[];
};

export type AdminSession = {
  id: string;
  adminAccountId: string;
  jti: string;
  issuedUtc: string;
  expiresUtc: string;
  lastSeenUtc: string;
  sourceIp: string;
  userAgent: string;
  mfaAssertedUtc?: string | null;
  revokedUtc?: string | null;
  lastStepUpUtc?: string | null;
};

export type AdminAccountPage = {
  items: AdminAccount[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
};

const BASE = 'v1/admin/admins';

/** The prefix the Lead360 token issuer registers operators under. */
export const LEAD360_SUBJECT_PREFIX = 'lead360:';

function unwrap<T>(response: { status: number; body: unknown }): T {
  if (response.status >= 200 && response.status < 300) return response.body as T;

  const body = response.body as { title?: string; message?: string } | undefined;
  const detail = body?.title ?? body?.message;

  // This surface is SuperAdmin-only, even to read.
  if (response.status === 403) {
    throw new Error(
      detail ??
        'Reading operator access needs the Stylemint SuperAdmin role. ' +
          'Ask an administrator to grant it.',
    );
  }
  throw new Error(detail ?? `The operator access surface returned HTTP ${response.status}.`);
}

export const stylemintAdminsApi = {
  list: async (params: { pageNumber?: number; pageSize?: number } = {}): Promise<AdminAccountPage> => {
    const query = new URLSearchParams({
      pageNumber: String(params.pageNumber ?? 1),
      pageSize: String(params.pageSize ?? 50),
    });
    return unwrap<AdminAccountPage>(
      await stylemintOperationsApi.invoke({ method: 'GET', path: BASE, query: query.toString() }),
    );
  },

  sessions: async (adminAccountId: string): Promise<AdminSession[]> =>
    unwrap<AdminSession[]>(
      await stylemintOperationsApi.invoke({
        method: 'GET',
        path: `${BASE}/${encodeURIComponent(adminAccountId)}/sessions`,
      }),
    ),
};
