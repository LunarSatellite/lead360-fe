import { apiClient } from '@/shared/lib/api-client';
import type {
  ApiSpecDto,
  ApiSpecDetailDto,
  EndpointDto,
  SpecUploadRequest,
  CapabilityMapDto,
  CapabilitySummaryDto,
  AnalysisDto,
  ReadinessDto,
  EndpointTestResult,
  ApiHealthDto,
} from '../types/api-connection.types';

// ─── Spec API ───

export const specApi = {
  upload: (data: SpecUploadRequest) => apiClient.post<ApiSpecDetailDto>('/v1/api-specs/upload', data),
  getAll: () => apiClient.get<ApiSpecDto[]>('/v1/api-specs'),
  getById: (id: string) => apiClient.get<ApiSpecDetailDto>(`/v1/api-specs/${id}`),
  getEndpoints: (id: string) => apiClient.get<EndpointDto[]>(`/v1/api-specs/${id}/endpoints`),
  delete: (id: string) => apiClient.delete<void>(`/v1/api-specs/${id}`),
} as const;

// ─── Capability API ───

export const capabilityApi = {
  generate: (specId: string) => apiClient.post<CapabilityMapDto>(`/v1/capability-map/${specId}/generate`),
  get: (specId: string) => apiClient.get<CapabilityMapDto>(`/v1/capability-map/${specId}`),
  getSummary: (specId: string) => apiClient.get<CapabilitySummaryDto>(`/v1/capability-map/${specId}/summary`),
} as const;

// ─── Analysis API ───

export const analysisApi = {
  analyze: (specId: string) => apiClient.post<AnalysisDto>(`/v1/api-analysis/${specId}/analyze`),
  get: (specId: string) => apiClient.get<AnalysisDto>(`/v1/api-analysis/${specId}`),
  submitAnswers: (analysisId: string, answers: { questionId: string; answer: string }[]) =>
    apiClient.post<AnalysisDto>(`/v1/api-analysis/${analysisId}/answers`, { answers }),
  getReadiness: (specId: string) => apiClient.get<ReadinessDto>(`/v1/api-analysis/${specId}/readiness`),
} as const;

// ─── Executor API ───

export const executorApi = {
  test: (endpointId: string, params: Record<string, string>) =>
    apiClient.post<EndpointTestResult>(`/v1/api-executor/test/${endpointId}`, params),
  health: () => apiClient.get<ApiHealthDto>('/v1/api-executor/health'),
} as const;

// ─── Spec API (additional) ───

export const specApiExtra = {
  uploadFile: (formData: FormData) =>
    apiClient.post<ApiSpecDetailDto>('/v1/api-specs/upload-file', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getAllEndpoints: () => apiClient.get<EndpointDto[]>('/v1/api-specs/endpoints/all'),
  reparse: (id: string) => apiClient.post<ApiSpecDetailDto>(`/v1/api-specs/${id}/reparse`),
} as const;

// ─── Capability API (additional) ───

export const capabilityApiExtra = {
  delete: (specId: string) => apiClient.delete<void>(`/v1/capability-map/${specId}`),
  getLlmContext: () => apiClient.get<unknown>('/v1/capability-map/llm-context'),
} as const;

// ─── Analysis API (additional) ───

export const analysisApiExtra = {
  getEnrichedContext: () => apiClient.get<unknown>('/v1/api-analysis/enriched-context'),
} as const;

// ─── Executor API (additional) ───

export const executorApiExtra = {
  execute: (data: {
    capabilityId?: string;
    apiEndpointId?: string;
    parameters?: Record<string, string>;
    requestBody?: string;
  }) => apiClient.post<EndpointTestResult>('/v1/api-executor/execute', data),
  getLogs: (limit = 50) => apiClient.get<unknown[]>(`/v1/api-executor/logs?limit=${limit}`),
} as const;

// ─── Intent Gate API ───

export const intentGateApi = {
  evaluate: (data: { message: string }) => apiClient.post<unknown>('/v1/intent-gate/evaluate', data),
  rebuildIndex: () => apiClient.post<boolean>('/v1/intent-gate/rebuild-index'),
} as const;

// ─── Intent Classifier API ───

export const intentClassifierApi = {
  classify: (data: {
    message: string;
    conversationHistory?: string[];
    sessionId?: string;
    confidenceThreshold?: number;
  }) => apiClient.post<unknown>('/v1/intent-classifier/classify', data),
  disambiguate: (data: {
    message: string;
    conversationHistory?: string[];
    sessionId?: string;
    confidenceThreshold?: number;
  }) => apiClient.post<unknown>('/v1/intent-classifier/disambiguate', data),
} as const;

// ─── Cross-Reference API ───

export const crossReferenceApi = {
  getReport: () => apiClient.get<unknown>('/v1/cross-reference/report'),
  validateIntent: (intentId: string) => apiClient.get<unknown>(`/v1/cross-reference/validate/${intentId}`),
  getCoverage: () => apiClient.get<unknown>('/v1/cross-reference/coverage'),
} as const;

// ─── Token Budget API ───

export const tokenBudgetApi = {
  check: (sessionId?: string, estimatedTokens = 500) =>
    apiClient.get<unknown>(
      `/v1/token-budget/check?estimatedTokens=${estimatedTokens}${sessionId ? `&sessionId=${sessionId}` : ''}`,
    ),
  getUsage: () => apiClient.get<unknown>('/v1/token-budget/usage'),
  getSessionUsage: (sessionId: string) => apiClient.get<unknown>(`/v1/token-budget/session/${sessionId}`),
  reset: () => apiClient.post<boolean>('/v1/token-budget/reset'),
} as const;

// ─── Response Validator API ───

export const responseValidatorApi = {
  validate: (data: {
    response: string;
    context?: {
      intentName?: string;
      customerMessage?: string;
      channelType?: string;
      maxResponseLength?: number;
    };
  }) => apiClient.post<unknown>('/v1/response-validator/validate', data),
} as const;
