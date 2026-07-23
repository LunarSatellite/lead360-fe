import { apiClient } from "@/shared/lib/api-client";
import { env } from "@/shared/config/env";
import type { PagedResult } from "@/shared/types/common.types";
import type {
  CrmWebFormFilter,
  CreateWebFormFieldRequest,
  CreateWebFormRequest,
  WebFormDto,
  WebFormFieldDto,
  WebFormSubmissionDetailDto,
  WebFormSubmissionDto,
  WebFormSubmissionFilter,
  WebFormSubmissionFileDto,
} from "../types/webforms.types";

// Single source of truth for every CRM WebForms call. The API wraps responses in
// ServiceResult<T>; our axios interceptor already unwraps to `data` and throws
// ApiError on failure. So every method below returns the unwrapped `data`.

const BASE = "/v1/crm/webforms";

export const webformsApi = {
  // ── Forms CRUD ───────────────────────────────────────────────────────────
  listForms(filter: CrmWebFormFilter = {}) {
    return apiClient.get<PagedResult<WebFormDto>>(BASE, { params: filter });
  },
  getForm(id: string) {
    return apiClient.get<WebFormDto>(`${BASE}/${id}`);
  },
  createForm(payload: CreateWebFormRequest) {
    return apiClient.post<WebFormDto>(BASE, payload);
  },
  updateForm(id: string, payload: CreateWebFormRequest) {
    return apiClient.put<WebFormDto>(`${BASE}/${id}`, payload);
  },
  deleteForm(id: string) {
    return apiClient.delete(`${BASE}/${id}`);
  },

  // ── Publish / embed ──────────────────────────────────────────────────────
  publishForm(id: string) {
    return apiClient.get<string>(`${BASE}/${id}/embed`);
  },

  // ── Fields (incremental save) ────────────────────────────────────────────
  // The builder keeps a local field list; on Save we replace the form wholesale
  // (PUT). These helpers exist for future in-place field ops; left here so the
  // builder can switch to per-field PATCH later without changing the import surface.
  addField(formId: string, payload: CreateWebFormFieldRequest) {
    return apiClient.post<WebFormFieldDto>(`${BASE}/${formId}/fields`, payload);
  },
  removeField(formId: string, fieldId: string) {
    return apiClient.delete(`${BASE}/${formId}/fields/${fieldId}`);
  },

  // ── Submissions list (paged) ─────────────────────────────────────────────
  listSubmissions(formId: string, filter: WebFormSubmissionFilter = {}) {
    return apiClient.get<PagedResult<WebFormSubmissionDto>>(
      `${BASE}/${formId}/submissions`,
      { params: filter },
    );
  },
  getSubmissionDetail(formId: string, submissionId: string) {
    return apiClient.get<WebFormSubmissionDetailDto>(
      `${BASE}/${formId}/submissions/${submissionId}`,
    );
  },

  // ── File downloads (staff side) ──────────────────────────────────────────
  mintDownloadToken(blobId: string) {
    return apiClient.post<{ token: string; expiresAt: string }>(
      `${BASE}/files/${blobId}/token`,
      {},
    );
  },
  buildDownloadUrl(token: string): string {
    return `${env.apiBaseUrl}${BASE}/files/download?token=${encodeURIComponent(token)}`;
  },

  // ── Public surfaces (no auth) ────────────────────────────────────────────
  // Tests preview the public form inside an <iframe>; we avoid fetching embed.js
  // from the same domain as the CMS host to dodge third-party-cookie pain.
  buildPublicEmbedScriptUrl(apiBaseUrl = env.apiBaseUrl): string {
    return `${apiBaseUrl.replace(/\/v1$/, "")}/embed.js`;
  },
};

// Helper for the builder preview iframe — points at the embed-config endpoint,
// which returns the schema JSON our embed.js expects. Stripped-down URL the
// browser can hit directly even when it has no tenant token.
export function buildPreviewHtml(formId: string, apiBaseUrl = env.apiBaseUrl): string {
  const base = apiBaseUrl.replace(/\/v1$/, "");
  return `<!doctype html>
<html><head><meta charset="utf-8"><title>Preview</title></head>
<body style="font-family:system-ui;padding:24px;background:#f8fafc;">
  <div data-omniflow-form="${formId}"></div>
  <script src="${base}/embed.js"></script>
</body></html>`;
}

// Helper to construct the embed snippet the customer copies onto their site.
export function buildEmbedSnippet(formId: string, tenantId: string | null): string {
  const tAttr = tenantId ? ` data-tenant="${tenantId}"` : "";
  return `<div data-omniflow-form="${formId}"${tAttr}></div>
<script src="${env.apiBaseUrl.replace(/\/v1$/, "")}/embed.js"></script>`;
}

// Friendly preview of a web form submission file (CV, attachment) in the staff UI.
export function inferFilePreview(file: WebFormSubmissionFileDto): boolean {
  const name = file.originalFileName.toLowerCase();
  return (
    /\.(pdf|png|jpe?g|gif|webp)$/.test(name) ||
    file.contentType.startsWith("image/") ||
    file.contentType === "application/pdf"
  );
}

// Build a shareable hosted URL for a form. Salesforce/HubSpot-style:
// the visitor opens this URL and sees the form on the OmniFlow domain
// without needing to install embed.js on their own site.
//
// The public hosted endpoints live at /f/{formId} and /f/s/{slug} on the
// backend root - NOT under the /api/v1 API surface. The apiBaseUrl we get
// from VITE_API_BASE_URL always ends with /api (or /api/v1) so we strip both.
export function buildHostedUrl(formId: string, slug?: string | null, apiBaseUrl = env.apiBaseUrl): string {
  const base = apiBaseUrl.replace(/\/v1$/, "").replace(/\/api$/, "");
  if (slug) return `${base}/f/s/${encodeURIComponent(slug)}`;
  return `${base}/f/${formId}`;
}
