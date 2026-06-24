// ═══════════════════════════════════════════════════════════════
// Agents Feature — API functions (matches backend spec)
// Source: /api/v1/agents/*  (9 endpoints, see Operations Manager §4)
//
// All functions return unwrapped data — the apiClient response
// interceptor strips the ServiceResult<T> envelope. Errors throw
// ApiError so TanStack Query mutation onError receives a usable msg.
// ═══════════════════════════════════════════════════════════════

import { apiClient } from '@/shared/lib/api-client';
import type {
  AgentDto,
  AgentDetailDto,
  AgentRunDto,
  AgentRunDetailDto,
  CreateAgentRequest,
  UpdateAgentRequest,
  FireAgentRequest,
  RespondToRunRequest,
  CancelRunRequest,
  AgentTypeValue,
  AgentRunListFilters,
} from '../types/agents.types';

// ─── Filters for list endpoint ─────────────────────────────────

export interface AgentListFilters {
  botId?: string;
  agentType?: AgentTypeValue;
  enabled?: boolean;
}

// Build a clean params object (axios serialises undefined fields
// as `key=undefined` strings on some configs — strip them first).
// Returns plain Record so axios's params can swallow it without
// us widening every filter interface with an index signature.
function cleanParams(p: object): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(p)) {
    if (v !== undefined && v !== null && v !== '') {
      out[k] = v;
    }
  }
  return out;
}

/* ──────────────────────────────────────────────────────────────
   The shared api-client.ts response interceptor unwraps the
   ServiceResult<T> envelope at runtime, returning T directly —
   but axios's static return type is still Promise<AxiosResponse<T>>
   (the interceptor uses `as never` to silence the mismatch). The
   rest of the codebase compensates with `as unknown as Foo` casts
   at every consumer site.

   We do that cast once, here, at the boundary. Result: the queries
   layer and pages get accurate Promise<T> types without per-site
   gymnastics. The runtime behaviour is unchanged.
   ────────────────────────────────────────────────────────────── */
function unwrap<T>(p: Promise<unknown>): Promise<T> {
  return p as Promise<T>;
}

// ─── Endpoint surface ──────────────────────────────────────────

export const agentsApi = {
  // GET /api/v1/agents?botId=&agentType=&enabled=
  list: (filters: AgentListFilters = {}) =>
    unwrap<AgentDto[]>(apiClient.get('/v1/agents', { params: cleanParams(filters) })),

  // GET /api/v1/agents/{agentId}
  getById: (agentId: string) =>
    unwrap<AgentDetailDto>(apiClient.get(`/v1/agents/${agentId}`)),

  // POST /api/v1/agents
  create: (data: CreateAgentRequest) =>
    unwrap<AgentDto>(apiClient.post('/v1/agents', data)),

  // PUT /api/v1/agents/{agentId}
  update: (agentId: string, data: UpdateAgentRequest) =>
    unwrap<AgentDto>(apiClient.put(`/v1/agents/${agentId}`, data)),

  // DELETE /api/v1/agents/{agentId}
  delete: (agentId: string) =>
    unwrap<void>(apiClient.delete(`/v1/agents/${agentId}`)),

  // POST /api/v1/agents/{agentId}/fire
  fire: (agentId: string, data: FireAgentRequest = {}) =>
    unwrap<AgentRunDto>(apiClient.post(`/v1/agents/${agentId}/fire`, data)),

  // GET /api/v1/agents/runs?agentId=&sessionId=&status=&since=&take=
  listRuns: (filters: AgentRunListFilters = {}) =>
    unwrap<AgentRunDto[]>(apiClient.get('/v1/agents/runs', { params: cleanParams(filters) })),

  // GET /api/v1/agents/runs/pending?take=
  listPendingRuns: (take?: number) =>
    unwrap<AgentRunDto[]>(
      apiClient.get('/v1/agents/runs/pending', { params: cleanParams({ take }) }),
    ),

  // GET /api/v1/agents/runs/{runId}
  getRun: (runId: string) =>
    unwrap<AgentRunDetailDto>(apiClient.get(`/v1/agents/runs/${runId}`)),

  // POST /api/v1/agents/runs/{runId}/respond
  respondToRun: (runId: string, data: RespondToRunRequest) =>
    unwrap<AgentRunDto>(apiClient.post(`/v1/agents/runs/${runId}/respond`, data)),

  // POST /api/v1/agents/runs/{runId}/cancel
  cancelRun: (runId: string, data: CancelRunRequest = {}) =>
    unwrap<AgentRunDto>(apiClient.post(`/v1/agents/runs/${runId}/cancel`, data)),
} as const;
