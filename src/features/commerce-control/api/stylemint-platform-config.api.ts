import { stylemintOperationsApi } from './stylemint-operations.api';

/**
 * Typed client for platform configuration — the key/value settings the commerce platform
 * reads at runtime, each holding a JSON value.
 *
 * Read is open to every operator role; writing takes SuperAdmin. No step-up MFA, so the
 * edit works from Lead360. Every write lands in the audit trail as `platform_config.updated`.
 */

export type PlatformConfigEntry = {
  id: string;
  key: string;
  valueJson: string;
  description: string;
  createdUtc: string;
  updatedUtc: string;
  rowVersion?: string | null;
};

const BASE = 'v1/admin/platform-config';

function unwrap<T>(response: { status: number; body: unknown }): T {
  if (response.status >= 200 && response.status < 300) return response.body as T;

  const body = response.body as { title?: string; message?: string } | undefined;
  const detail = body?.title ?? body?.message;

  if (response.status === 403) {
    throw new Error(
      detail ??
        'Changing platform configuration takes the Stylemint SuperAdmin role. ' +
          'Reading it does not — an administrator grants the write.',
    );
  }
  throw new Error(detail ?? `The platform-config surface returned HTTP ${response.status}.`);
}

/**
 * Whether a string parses as JSON. The backend stores `valueJson` verbatim, so an invalid
 * value is only rejected on save — checking here turns that into an inline message.
 */
export function isValidJson(value: string): boolean {
  if (value.trim() === '') return false;
  try {
    JSON.parse(value);
    return true;
  } catch {
    return false;
  }
}

/** Pretty-prints for the editor; returns the input unchanged when it is not valid JSON. */
export function formatJson(value: string): string {
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
}

export const stylemintPlatformConfigApi = {
  list: async (): Promise<PlatformConfigEntry[]> =>
    unwrap<PlatformConfigEntry[]>(
      await stylemintOperationsApi.invoke({ method: 'GET', path: BASE }),
    ),

  get: async (key: string): Promise<PlatformConfigEntry> =>
    unwrap<PlatformConfigEntry>(
      await stylemintOperationsApi.invoke({
        method: 'GET',
        path: `${BASE}/${encodeURIComponent(key)}`,
      }),
    ),

  /** Creates the key when it does not exist, updates it when it does. */
  set: async (key: string, valueJson: string, description?: string): Promise<PlatformConfigEntry> =>
    unwrap<PlatformConfigEntry>(
      await stylemintOperationsApi.invoke({
        method: 'PUT',
        path: `${BASE}/${encodeURIComponent(key)}`,
        body: JSON.stringify({ valueJson, description: description || null }),
      }),
    ),
};
