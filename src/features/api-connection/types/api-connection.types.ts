import { z } from 'zod';

// ═══════════════════════════════════════════════════════════════
// P2-017: API Connection — Types + Zod Schemas
// ═══════════════════════════════════════════════════════════════

// ─── Spec Status ───

export const SpecStatus = {
  Pending: 1,
  Parsing: 2,
  Parsed: 3,
  Failed: 4,
  Superseded: 5,
} as const;
export type SpecStatusValue = (typeof SpecStatus)[keyof typeof SpecStatus];

export const SPEC_STATUS_LABEL: Record<SpecStatusValue, string> = {
  1: 'Pending', 2: 'Parsing', 3: 'Parsed', 4: 'Failed', 5: 'Superseded',
};
export const SPEC_STATUS_COLOR: Record<SpecStatusValue, 'warning' | 'info' | 'success' | 'danger' | 'muted'> = {
  1: 'warning', 2: 'info', 3: 'success', 4: 'danger', 5: 'muted',
};

// ─── Analysis Status ───

export const AnalysisStatus = {
  Pending: 1, InProgress: 2, Complete: 3, Failed: 4,
} as const;
export type AnalysisStatusValue = (typeof AnalysisStatus)[keyof typeof AnalysisStatus];

export const ANALYSIS_STATUS_LABEL: Record<AnalysisStatusValue, string> = {
  1: 'Pending', 2: 'Analyzing', 3: 'Complete', 4: 'Failed',
};

// ─── DTOs ───

export interface ApiSpecDto {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  specVersion: string | null;
  apiTitle: string | null;
  apiVersion: string | null;
  baseUrlsJson: string | null;
  securitySchemesJson: string | null;
  originalFileName: string | null;
  fileFormat: string | null;
  status: SpecStatusValue;
  parseError: string | null;
  endpointCount: number;
  parsedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface ApiSpecDetailDto extends ApiSpecDto {
  rawSpecContent: string | null;
  endpoints: EndpointDto[];
}

export interface EndpointDto {
  id: string;
  tenantId: string;
  apiSpecificationId: string;
  httpMethod: string;
  path: string;
  operationId: string | null;
  summary: string | null;
  description: string | null;
  tagsJson: string | null;
  pathParametersJson: string | null;
  queryParametersJson: string | null;
  headerParametersJson: string | null;
  requestBodyJson: string | null;
  requestContentType: string | null;
  responseSchemasJson: string | null;
  securityRequirementsJson: string | null;
  isDeprecated: boolean;
  humanReadableSummary: string | null;
  createdAt: string;
}

export interface CapabilityMapDto {
  groups: CapabilityGroupDto[];
}

export interface CapabilityGroupDto {
  id: string;
  name: string;
  capabilities: CapabilityDto[];
}

export interface CapabilityDto {
  id: string;
  name: string;
  httpMethod: string;
  endpointPath: string;
  operationType: string;
  complexity: number;
  requiresAuth: boolean;
  llmContextLine: string;
}

export interface CapabilitySummaryDto {
  totalCapabilities: number;
  readCount: number;
  createCount: number;
  updateCount: number;
  deleteCount: number;
}

export interface AnalysisDto {
  id: string;
  status: AnalysisStatusValue;
  businessContextSummary: string | null;
  readinessScore: number;
  readinessBreakdownJson: string | null;
  gapsJson: string | null;
  questionsJson: string | null;
  answers: AnalysisAnswerDto[];
}

export interface AnalysisAnswerDto {
  questionId: string;
  answer: string;
}

export interface ReadinessBreakdownItem {
  category: string;
  score: number;
  maxScore: number;
}

export interface GapItem {
  severity: 'critical' | 'important' | 'minor';
  title: string;
  description: string;
  suggestion: string;
}

export interface QuestionItem {
  id: string;
  question: string;
  context: string;
}

export interface ReadinessDto {
  readinessScore: number;
  breakdownJson: string | null;
}

export interface EndpointTestResult {
  success: boolean;
  statusCode: number;
  data: unknown;
  responseTimeMs: number;
}

export interface ApiHealthDto {
  status: string;
  responseTimeMs: number;
  successRate24h: number;
}

// ─── Upload ───

export interface SpecUploadRequest {
  name: string;
  specContent: string;
  fileFormat: 'json' | 'yaml';
}

// ─── Zod Schemas ───

export const specUploadSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  specContent: z.string().min(1, 'Spec content is required'),
  fileFormat: z.enum(['json', 'yaml']).default('json'),
});
export type SpecUploadFormData = z.infer<typeof specUploadSchema>;

export const testEndpointSchema = z.object({
  endpointId: z.string().min(1, 'Select an endpoint'),
  parameters: z.record(z.string()).optional(),
});
export type TestEndpointFormData = z.infer<typeof testEndpointSchema>;

export const answerSchema = z.object({
  questionId: z.string(),
  answer: z.string().min(1, 'Answer is required'),
});

// ─── Helpers ───

export function parseJson<T>(json: string | null | undefined | T): T | null {
  if (!json) return null;
  if (typeof json !== 'string') return json as T;
  try { return JSON.parse(json) as T; } catch { return null; }
}

// ─── Pipeline Steps ───

export type PipelineStep = 'upload' | 'endpoints' | 'capability' | 'analysis' | 'test' | 'suggestions';

export const PIPELINE_STEPS: { id: PipelineStep; label: string; num: number }[] = [
  { id: 'upload', label: 'Upload Spec', num: 1 },
  { id: 'endpoints', label: 'Review Endpoints', num: 2 },
  { id: 'capability', label: 'Capability Map', num: 3 },
  { id: 'analysis', label: 'AI Analysis', num: 4 },
  { id: 'test', label: 'Test', num: 5 },
  { id: 'suggestions', label: 'Intent Suggestions', num: 6 },
];
