import axios from 'axios';
import { env } from '@/shared/config/env';
import type {
  AgentHaltView,
  GovernanceErrorBody,
  GovernedAgentActionView,
  HaltScopeValue,
} from '../types/governance.types';

/**
 * Client for the governed agent action surface.
 *
 * Two things shape it:
 *
 * 1. **Transport.** These routes live on the Stylemint admin API at the root
 *    `v1/admin/agent-actions`, not under Lead360's own `/api` prefix, and the
 *    admin credential stays server-side. Lead360 already re-hosts that whole
 *    surface through the operator pass-through
 *    (`api/v1/stylemint/operations/{**path}`), which is how
 *    `stylemint-operations.api.ts` reaches `v1/admin/*` today. We go the same
 *    way rather than inventing a second route into the admin API.
 *
 * 2. **Errors are the product here.** The shared `apiClient` turns a non-2xx
 *    into a thrown `ApiError` and — on this surface specifically — drops the
 *    `errorCode`: its ProblemDetails branch matches `ErrorResponseVm` on
 *    `title` and passes `undefined` for the code. Every `governance.*` refusal
 *    would be lost exactly where this console needs it most, and all of them
 *    are HTTP 400, so the status tells us nothing. We therefore keep our own
 *    instance with `validateStatus: () => true` and read the body verbatim.
 */
const rawClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 60_000,
  validateStatus: () => true,
});

rawClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('omniflow_token');
  const tenantId = localStorage.getItem('omniflow_tenant_id');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (tenantId) config.headers['X-Tenant-Id'] = tenantId;
  return config;
});

/** Upstream admin path, forwarded through the operator pass-through. */
const ADMIN = 'v1/admin/agent-actions';
const via = (path: string) => `/v1/stylemint/operations/${path}`;

/** A refusal we can show, rather than an exception we cannot read. */
export class GovernanceError extends Error {
  readonly errorCode?: string;
  readonly status: number;
  readonly field?: string | null;
  readonly correlationId?: string;

  constructor(body: GovernanceErrorBody | undefined, status: number) {
    super(body?.title?.trim() || `The request failed (HTTP ${status}).`);
    this.name = 'GovernanceError';
    this.errorCode = body?.errorCode;
    this.status = status;
    this.field = body?.field;
    this.correlationId = body?.correlationId;
  }
}

function unwrap<T>(response: { status: number; data: unknown }): T {
  if (response.status >= 400) {
    throw new GovernanceError(response.data as GovernanceErrorBody | undefined, response.status);
  }
  return response.data as T;
}

/**
 * Every write on this controller accepts an optional `Idempotency-Key`, and a
 * replay is echoed rather than re-run. A decision that a flaky network made
 * twice must not become two decisions.
 */
const idempotent = () => ({ headers: { 'Idempotency-Key': crypto.randomUUID() } });

/**
 * The queue feed. There is **no list endpoint on the backend today** — the
 * controller exposes only single-id reads — so this resolves to `unavailable`
 * rather than to an empty queue, and the page says so. An empty list and a
 * missing feed are not the same claim to make to someone whose job is to
 * approve things.
 */
export type QueueFeed =
  | { kind: 'ok'; items: GovernedAgentActionView[] }
  | { kind: 'unavailable'; status: number; detail: string };

export const agentGovernanceApi = {
  queue: async (): Promise<QueueFeed> => {
    const response = await rawClient.get(via(ADMIN));
    if (response.status === 404 || response.status === 405) {
      return {
        kind: 'unavailable',
        status: response.status,
        detail: `GET ${ADMIN} is not exposed by the API (HTTP ${response.status}).`,
      };
    }
    if (response.status >= 400) {
      throw new GovernanceError(response.data as GovernanceErrorBody, response.status);
    }
    const data = response.data as GovernedAgentActionView[] | { items?: GovernedAgentActionView[] };
    const items = Array.isArray(data) ? data : (data.items ?? []);
    return { kind: 'ok', items };
  },

  get: async (id: string): Promise<GovernedAgentActionView> =>
    unwrap(await rawClient.get(via(`${ADMIN}/${encodeURIComponent(id)}`))),

  approve: async (id: string): Promise<GovernedAgentActionView> =>
    unwrap(await rawClient.post(via(`${ADMIN}/${encodeURIComponent(id)}/approve`), {}, idempotent())),

  reject: async (id: string, reason: string): Promise<GovernedAgentActionView> =>
    unwrap(
      await rawClient.post(
        via(`${ADMIN}/${encodeURIComponent(id)}/reject`),
        { reason },
        idempotent(),
      ),
    ),

  execute: async (id: string): Promise<GovernedAgentActionView> =>
    unwrap(await rawClient.post(via(`${ADMIN}/${encodeURIComponent(id)}/execute`), {}, idempotent())),

  rollback: async (id: string): Promise<GovernedAgentActionView> =>
    unwrap(await rawClient.post(via(`${ADMIN}/${encodeURIComponent(id)}/rollback`), {}, idempotent())),

  halts: async (): Promise<AgentHaltView[]> => unwrap(await rawClient.get(via(`${ADMIN}/halts`))),

  engageHalt: async (body: {
    scope: HaltScopeValue;
    scopeKey: string | null;
    reason: string;
  }): Promise<AgentHaltView> => unwrap(await rawClient.post(via(`${ADMIN}/halt`), body)),

  clearHalt: async (body: {
    scope: HaltScopeValue;
    scopeKey: string | null;
    reason: string;
  }): Promise<AgentHaltView> => unwrap(await rawClient.post(via(`${ADMIN}/halt/clear`), body)),

  /**
   * Whether this operator's forwarded admin credential holds SuperAdmin.
   *
   * There is no admin identity endpoint, and the Lead360 session role
   * (`Owner`/`Admin`/`Agent`) is a different role system from the Stylemint
   * admin roles the governance service checks — guessing one from the other
   * would be a fabrication. So we ask the server a read-only question it
   * already answers: `GET {id}` is SuperAdmin-only, so a nonexistent id returns
   * 404 to a SuperAdmin and 403 to anyone else. Nothing is written either way,
   * and the server still enforces every decision regardless of the answer.
   *
   * Returns the roles we can *prove*, or `null` for "not known" — which is
   * treated as granting nothing.
   */
  provenAdminRoles: async (): Promise<string[] | null> => {
    const probeId = '00000000-0000-0000-0000-000000000000';
    const response = await rawClient.get(via(`${ADMIN}/${probeId}`));
    if (response.status === 403 || response.status === 401) return null;
    if (response.status === 404 || response.status < 300) return ['SuperAdmin'];
    return null;
  },
};
