// ═══════════════════════════════════════════════════════════════
// Flow Runtime — API (POST /flow-runtime/message, GET /flow-runtime/entry-menu)
// ═══════════════════════════════════════════════════════════════

import { apiClient } from '@/shared/lib/api-client';
import type { FlowRuntimeResult, FlowMessageRequest } from '../types/flow-runtime.types';

const LLM_TIMEOUT = 120_000;

export const flowRuntimeApi = {
  processMessage: async (data: FlowMessageRequest): Promise<FlowRuntimeResult> =>
    apiClient.post('/v1/flow-runtime/message', data, { timeout: LLM_TIMEOUT }) as unknown as FlowRuntimeResult,

  getEntryMenu: async (): Promise<FlowRuntimeResult> =>
    apiClient.get('/v1/flow-runtime/entry-menu') as unknown as FlowRuntimeResult,

  getGraph: async () =>
    apiClient.get('/v1/flow-runtime/graph'),

  resetPosition: async (sessionId: string): Promise<boolean> =>
    apiClient.post(`/v1/flow-runtime/reset/${sessionId}`) as unknown as boolean,
} as const;
