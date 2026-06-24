// ═══════════════════════════════════════════════════════════════
// API Specs Sub-Feature — Type Definitions (matches backend DTOs)
// Source: /api/v1/api-specs/*
// ═══════════════════════════════════════════════════════════════

// ─── ApiSpecStatus (backend enum 1-5) ───

export const ApiSpecStatus = {
  Pending: 1,
  Parsing: 2,
  Parsed: 3,
  Failed: 4,
  Superseded: 5,
} as const;
export type ApiSpecStatusValue = (typeof ApiSpecStatus)[keyof typeof ApiSpecStatus];

export const API_SPEC_STATUS_LABEL: Record<ApiSpecStatusValue, string> = {
  [ApiSpecStatus.Pending]: 'Pending',
  [ApiSpecStatus.Parsing]: 'Parsing',
  [ApiSpecStatus.Parsed]: 'Parsed',
  [ApiSpecStatus.Failed]: 'Failed',
  [ApiSpecStatus.Superseded]: 'Superseded',
};

export const API_SPEC_STATUS_COLOR: Record<
  ApiSpecStatusValue,
  'warning' | 'info' | 'success' | 'danger' | 'muted'
> = {
  [ApiSpecStatus.Pending]: 'warning',
  [ApiSpecStatus.Parsing]: 'info',
  [ApiSpecStatus.Parsed]: 'success',
  [ApiSpecStatus.Failed]: 'danger',
  [ApiSpecStatus.Superseded]: 'muted',
};

// ─── HTTP Method Color Map ───

export const HTTP_METHOD_COLOR: Record<string, 'success' | 'info' | 'warning' | 'danger' | 'brand'> = {
  GET: 'success',
  POST: 'info',
  PUT: 'warning',
  DELETE: 'danger',
  PATCH: 'brand',
};

// ─── ApiSpecificationDto (list response — no raw content) ───

export interface ApiSpecificationDto {
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
  status: ApiSpecStatusValue;
  parseError: string | null;
  endpointCount: number;
  parsedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
}

// ─── ApiSpecificationDetailDto (single spec with endpoints + raw content) ───

export interface ApiSpecificationDetailDto extends ApiSpecificationDto {
  rawSpecContent: string | null;
  endpoints: ApiEndpointDto[];
}

// ─── ApiEndpointDto ───

export interface ApiEndpointDto {
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

// ─── Upload Requests ───

export interface ApiSpecUploadRequest {
  name: string;
  description?: string;
  specContent: string;
  fileFormat?: string;
  fileName?: string;
}

// ─── Helpers ───

export function parseJsonField<T>(json: string | null): T | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}
