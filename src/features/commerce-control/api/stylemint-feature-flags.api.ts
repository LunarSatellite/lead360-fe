import { stylemintOperationsApi } from './stylemint-operations.api';

/**
 * Typed client for Stylemint feature flags — the platform switches, and the per-role or
 * per-account overrides layered on top of them.
 *
 * Reading takes any admin role; every write takes SuperAdmin. No step-up MFA, so the writes
 * work from Lead360.
 */

export const FlagAudience = { Role: 1, Account: 2 } as const;
export const AUDIENCE_LABEL: Record<number, string> = { 1: 'Role', 2: 'Account' };

export const FlagRoleKind = { Customer: 1, Creator: 2, Vendor: 3 } as const;
export const ROLE_KIND_LABEL: Record<number, string> = {
  1: 'Customer',
  2: 'Creator',
  3: 'Vendor',
};
/** The API takes the role kind as its name, not its number. */
export const ROLE_KIND_NAME: Record<number, string> = {
  1: 'Customer',
  2: 'Creator',
  3: 'Vendor',
};

export type FeatureFlagOverride = {
  id: string;
  featureFlagId: string;
  audience: number;
  roleKind?: number | null;
  accountId?: string | null;
  enabled: boolean;
};

export type FeatureFlag = {
  id: string;
  key: string;
  defaultEnabled: boolean;
  description?: string | null;
  createdUtc: string;
  updatedUtc: string;
  overrides: FeatureFlagOverride[];
};

const BASE = 'v1/admin/feature-flags';

function unwrap<T>(response: { status: number; body: unknown }): T {
  if (response.status >= 200 && response.status < 300) return response.body as T;

  const body = response.body as { title?: string; message?: string } | undefined;
  const detail = body?.title ?? body?.message;

  if (response.status === 403) {
    throw new Error(
      detail ??
        'Changing feature flags takes the Stylemint SuperAdmin role; reading takes any admin role.',
    );
  }
  throw new Error(detail ?? `The feature flag surface returned HTTP ${response.status}.`);
}

export const stylemintFeatureFlagsApi = {
  list: async (): Promise<FeatureFlag[]> =>
    unwrap<FeatureFlag[]>(await stylemintOperationsApi.invoke({ method: 'GET', path: BASE })),

  /** Creates the flag when the key is new, updates it when it exists. */
  upsert: async (
    key: string,
    defaultEnabled: boolean,
    description?: string | null,
  ): Promise<FeatureFlag> =>
    unwrap<FeatureFlag>(
      await stylemintOperationsApi.invoke({
        method: 'PUT',
        path: `${BASE}/${encodeURIComponent(key)}`,
        body: JSON.stringify({ defaultEnabled, description: description || null }),
      }),
    ),

  /** Sets a role-wide or single-account override on top of the default. */
  setOverride: async (
    key: string,
    override: { roleKind?: string | null; accountId?: string | null; enabled: boolean },
  ): Promise<FeatureFlag> =>
    unwrap<FeatureFlag>(
      await stylemintOperationsApi.invoke({
        method: 'PUT',
        path: `${BASE}/${encodeURIComponent(key)}/overrides`,
        body: JSON.stringify({
          roleKind: override.roleKind ?? null,
          accountId: override.accountId ?? null,
          enabled: override.enabled,
        }),
      }),
    ),

  /** Removes an override, so that audience falls back to the flag default. */
  clearOverride: async (
    key: string,
    override: { roleKind?: string | null; accountId?: string | null },
  ): Promise<FeatureFlag> =>
    unwrap<FeatureFlag>(
      await stylemintOperationsApi.invoke({
        method: 'DELETE',
        path: `${BASE}/${encodeURIComponent(key)}/overrides`,
        // DELETE carries a body here: the endpoint identifies the override by audience, not by id.
        body: JSON.stringify({
          roleKind: override.roleKind ?? null,
          accountId: override.accountId ?? null,
          enabled: false,
        }),
      }),
    ),
};
