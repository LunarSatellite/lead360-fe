import axios from 'axios';
import { env } from '@/shared/config/env';

/**
 * Client for the Stylemint operator pass-through
 * (`api/v1/stylemint/operations`), which reaches the whole commerce
 * administration and vendor-operations surface rather than the curated subset
 * `stylemint-commerce.api.ts` wraps.
 *
 * This uses its own axios instance rather than the shared `apiClient`, because the
 * shared one exists to hide transport detail: its response interceptor unwraps the
 * ServiceResult envelope and turns any non-2xx into a thrown `ApiError`. An operations
 * console needs the opposite — the verbatim upstream body AND its status code, with a
 * 4xx being a result to display rather than an exception. The auth header is attached
 * the same way, so both clients stay on one session.
 */
const rawClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 120_000,
  // Every status is a result to render, never a throw.
  validateStatus: () => true,
});

rawClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('omniflow_token');
  const tenantId = localStorage.getItem('omniflow_tenant_id');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (tenantId) config.headers['X-Tenant-Id'] = tenantId;
  return config;
});

export type OperationMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type StylemintOperation = {
  /** Upstream path with `{parameter}` placeholders, e.g. `v1/admin/customers/{customerId}`. */
  path: string;
  method: OperationMethod;
  summary?: string | null;
  /** Grouping key, e.g. `admin/kyc`. */
  area: string;
  /** Which server-side credential Lead360 forwards this call with. */
  credential: 'admin' | 'vendor';
};

export type StylemintOperationArea = {
  area: string;
  operationCount: number;
  operations: StylemintOperation[];
};

export type StylemintOperationsCatalog = {
  areaCount: number;
  operationCount: number;
  areas: StylemintOperationArea[];
};

export type OperationResponse = {
  status: number;
  /** Parsed JSON when the response was JSON, otherwise the raw text. */
  body: unknown;
  correlationId?: string;
  durationMs: number;
};

const OPERATIONS_BASE = '/v1/stylemint/operations';

/** Placeholder segments in an operation path, e.g. `customerId` in `{customerId}`. */
export function pathParameters(path: string): string[] {
  return [...path.matchAll(/\{([^}]+)\}/g)].map((match) => match[1]);
}

/** Substitutes `{parameter}` placeholders, URL-encoding each supplied value. */
export function resolvePath(path: string, values: Record<string, string>): string {
  return path.replace(/\{([^}]+)\}/g, (match, name: string) => {
    const value = values[name];
    return value ? encodeURIComponent(value) : match;
  });
}

/** True when the operation changes state, so the console must confirm before running it. */
export function isMutation(method: OperationMethod): boolean {
  return method !== 'GET';
}

export const stylemintOperationsApi = {
  /**
   * Every operation an operator can drive, derived server-side from the live OpenAPI
   * document — so the console reflects what the backend actually exposes today.
   */
  catalog: async (): Promise<StylemintOperationsCatalog> => {
    const response = await rawClient.get(`/v1/stylemint/operations-catalog`);
    if (response.status >= 400) {
      throw new Error(
        `Could not load the operations catalogue (HTTP ${response.status}). ` +
          `You may not have the Stylemint operator role.`,
      );
    }
    return response.data as StylemintOperationsCatalog;
  },

  /** Runs one operation and returns the upstream response as data, never as a throw. */
  invoke: async (params: {
    method: OperationMethod;
    /** Resolved path, no leading slash, e.g. `v1/admin/customers`. */
    path: string;
    /** Raw query string without the leading `?`. */
    query?: string;
    /** Raw JSON request body. Ignored for GET. */
    body?: string;
    signal?: AbortSignal;
  }): Promise<OperationResponse> => {
    const startedAt = performance.now();
    const url =
      `${OPERATIONS_BASE}/${params.path.replace(/^\/+/, '')}` +
      (params.query ? `?${params.query.replace(/^\?/, '')}` : '');

    // DELETE included: clearing a feature-flag override identifies it by audience in the body
    // rather than by id in the path, so dropping the body would send an empty request.
    const sendsBody = params.method !== 'GET';

    const response = await rawClient.request({
      url,
      method: params.method,
      data: sendsBody && params.body ? params.body : undefined,
      headers: sendsBody && params.body ? { 'Content-Type': 'application/json' } : undefined,
      // The body is already a JSON string from the editor; axios must not re-encode it,
      // and a malformed draft should reach the server as-is so its error is the real one.
      transformRequest: [(data) => data],
      signal: params.signal,
    });

    return {
      status: response.status,
      body: response.data,
      correlationId: response.headers['x-correlation-id'] as string | undefined,
      durationMs: Math.round(performance.now() - startedAt),
    };
  },
};
