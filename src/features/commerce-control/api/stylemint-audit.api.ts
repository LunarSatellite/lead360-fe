import { stylemintOperationsApi } from './stylemint-operations.api';

/**
 * Typed client for the commerce admin audit trail — every privileged action an operator
 * took, with who, what, when and from where.
 *
 * Read-only by design: the trail is append-only and written by the services themselves.
 * Gated on SuperAdmin or Readonly, and no step-up MFA, so it works from Lead360.
 *
 * `payloadJson` is stored encrypted at rest and decrypted on read, so treat it as
 * sensitive when displaying.
 */

export type AuditEntry = {
  id: string;
  adminAccountId: string;
  action: string;
  targetKind: string;
  targetId: string;
  reason?: string | null;
  payloadJson: string;
  sourceIp: string;
  userAgent: string;
  occurredUtc: string;
};

export type AuditPage = {
  items: AuditEntry[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
};

export type AuditFilters = {
  adminAccountId?: string;
  action?: string;
  targetKind?: string;
  targetId?: string;
  fromUtc?: string;
  toUtc?: string;
  pageNumber?: number;
  pageSize?: number;
};

/** Mirrors AdminAuditActions — the only values the trail ever records. */
export const AUDIT_ACTIONS = [
  'kyc.assigned',
  'kyc.decided.approved',
  'kyc.decided.rejected_retryable',
  'kyc.decided.rejected_terminal',
  'moderation.assigned',
  'moderation.decided',
  'payment.refund.issued',
  'payout.held',
  'payout.released',
  'payout.force_marked_paid',
  'payout.force_marked_failed',
  'feature_flag.upserted',
  'feature_flag.override.set',
  'feature_flag.override.cleared',
  'platform_config.updated',
  'admin.sso_login',
  'admin.role.assigned',
  'admin.role.revoked',
  'admin.account.disabled',
  'admin.account.enabled',
  'admin.session.opened',
  'admin.session.revoked',
  'admin.session.revoked_all',
  'admin.mfa.enrolled',
  'admin.mfa.confirmed',
  'admin.mfa.verified',
  'admin.mfa.failed',
  'admin.mfa.removed',
  'admin.mfa.force_removed',
  'privacy.data_rights.identity_verified',
  'privacy.data_rights.started',
  'privacy.data_rights.completed',
  'privacy.data_rights.rejected',
  'support.return_evidence.viewed',
] as const;

/** Mirrors AdminAuditTargetKinds. */
export const AUDIT_TARGET_KINDS = [
  'CreatorApplication',
  'VendorApplication',
  'KycReviewItem',
  'ModerationItem',
  'PaymentIntent',
  'Payout',
  'FeatureFlag',
  'PlatformConfig',
  'AdminAccount',
  'AdminSession',
  'AdminMfaCredential',
  'DataRightsRequest',
  'ReturnRequest',
] as const;

/** Groups an action for display, e.g. `payout.held` -> `payout`. */
export function auditActionGroup(action: string): string {
  return action.split('.')[0] ?? action;
}

function unwrap<T>(response: { status: number; body: unknown }): T {
  if (response.status >= 200 && response.status < 300) return response.body as T;

  const body = response.body as { title?: string; message?: string } | undefined;
  const detail = body?.title ?? body?.message;

  if (response.status === 403) {
    throw new Error(
      detail ??
        'Reading the audit trail takes the Stylemint SuperAdmin or Readonly role. ' +
          'An administrator grants it.',
    );
  }
  throw new Error(detail ?? `The audit surface returned HTTP ${response.status}.`);
}

export const stylemintAuditApi = {
  query: async (filters: AuditFilters): Promise<AuditPage> => {
    const query = new URLSearchParams();
    if (filters.adminAccountId) query.set('adminAccountId', filters.adminAccountId);
    if (filters.action) query.set('action', filters.action);
    if (filters.targetKind) query.set('targetKind', filters.targetKind);
    if (filters.targetId) query.set('targetId', filters.targetId);
    if (filters.fromUtc) query.set('fromUtc', filters.fromUtc);
    if (filters.toUtc) query.set('toUtc', filters.toUtc);
    query.set('pageNumber', String(filters.pageNumber ?? 1));
    query.set('pageSize', String(filters.pageSize ?? 50));

    return unwrap<AuditPage>(
      await stylemintOperationsApi.invoke({
        method: 'GET',
        path: 'v1/admin/audit',
        query: query.toString(),
      }),
    );
  },
};
