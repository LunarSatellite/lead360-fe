import axios from "axios";
import { apiClient } from "@/shared/lib/api-client";
import { env } from "@/shared/config/env";
import type {
  CrmContactCardDto,
  CrmContactCardPayloadDto,
  CrmContactCardScanStatsDto,
  UpdateCrmContactCardRequest,
} from "../types/contact-cards.types";

const BASE = "/v1/crm/team-cards";

// Note: apiClient.get/post/patch return AxiosResponse<T> by axios's static
// signature, but the api-client response interceptor unwraps the
// {success, data} wrapper at runtime and returns the inner payload. We
// cast through `as Promise<T>` so callers (queries/pages) get the
// unwrapped DTO shape in TypeScript too.

export const contactCardsApi = {
  // GET /api/v1/crm/team-cards → CrmContactCardDto[]
  list: (): Promise<CrmContactCardDto[]> =>
    apiClient.get<CrmContactCardDto[]>(BASE) as unknown as Promise<CrmContactCardDto[]>,

  // GET /api/v1/crm/team-cards/{userId} → CrmContactCardDto
  get: (userId: string): Promise<CrmContactCardDto> =>
    apiClient.get<CrmContactCardDto>(`${BASE}/${userId}`) as unknown as Promise<CrmContactCardDto>,

  // POST /api/v1/crm/team-cards/{userId}/regenerate-token → CrmContactCardDto
  regenerateToken: (userId: string): Promise<CrmContactCardDto> =>
    apiClient.post<CrmContactCardDto>(`${BASE}/${userId}/regenerate-token`) as unknown as Promise<CrmContactCardDto>,

  // PATCH /api/v1/crm/team-cards/{userId} → CrmContactCardDto
  update: (userId: string, data: UpdateCrmContactCardRequest): Promise<CrmContactCardDto> =>
    apiClient.patch<CrmContactCardDto>(`${BASE}/${userId}`, data) as unknown as Promise<CrmContactCardDto>,

  // GET /api/v1/crm/team-cards/{userId}/stats → CrmContactCardScanStatsDto
  stats: (userId: string): Promise<CrmContactCardScanStatsDto> =>
    apiClient.get<CrmContactCardScanStatsDto>(`${BASE}/${userId}/stats`) as unknown as Promise<CrmContactCardScanStatsDto>,

  // GET /api/v1/crm/team-cards/{userId}/payload → CrmContactCardPayloadDto
  payload: (userId: string): Promise<CrmContactCardPayloadDto> =>
    apiClient.get<CrmContactCardPayloadDto>(`${BASE}/${userId}/payload`) as unknown as Promise<CrmContactCardPayloadDto>,

  // GET /api/v1/crm/team-cards/{userId}/qr.png?size=N → image/png blob
  //
  // We use a dedicated raw-axios instance for binary endpoints so the
  // api-client response/error interceptors don't rewrite the response or
  // throw an ApiError before we see the blob. The interceptor treats every
  // non-2xx as an immediate ApiError throw — exactly what we DON'T want
  // for a binary download.
  qrPng: async (userId: string, size = 512): Promise<Blob> =>
    unwrapImageBlob(
      await rawBlobClient.get<Blob>(`${BASE}/${userId}/qr.png`, {
        params: { size },
        responseType: "blob",
      }),
      `${userId}-qr.png`,
    ),

  // GET /api/v1/crm/team-cards/{userId}/qr.svg → image/svg+xml blob
  qrSvg: async (userId: string): Promise<Blob> =>
    unwrapImageBlob(
      await rawBlobClient.get<Blob>(`${BASE}/${userId}/qr.svg`, {
        responseType: "blob",
      }),
      `${userId}-qr.svg`,
    ),
};

/**
 * Dedicated axios instance for binary downloads. It shares the auth/tenant
 * headers from the shared api-client but has NO response/error interceptors —
 * binary callers need to inspect the raw response themselves to read
 * non-image error bodies.
 */
const rawBlobClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 120_000,
  responseType: "blob",
  headers: { "Content-Type": "application/json" },
});

rawBlobClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("omniflow_token");
  const tenantId = localStorage.getItem("omniflow_tenant_id");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (tenantId) config.headers["X-Tenant-Id"] = tenantId;
  return config;
});

/**
 * Extracts a Blob from an axios blob response, or throws an Error that
 * includes the decoded JSON error body if the server returned something
 * other than an image.
 */
async function unwrapImageBlob(
  response: { data: Blob; status: number },
  fallbackName: string,
): Promise<Blob> {
  const blob = response.data;
  if (blob instanceof Blob && blob.type.startsWith("image/")) return blob;
  let detail = `HTTP ${response.status}`;
  try {
    const text = blob instanceof Blob ? await blob.text() : String(blob);
    const json: unknown = JSON.parse(text);
    if (json && typeof json === "object") {
      const obj = json as Record<string, unknown>;
      detail = `${obj.message ?? obj.Message ?? detail}`;
      if (Array.isArray(obj.errors)) {
        detail += " — " + (obj.errors as unknown[]).join("; ");
      }
    } else {
      detail = text.slice(0, 200);
    }
  } catch {
    /* keep detail as-is */
  }
  throw new Error(`QR endpoint returned non-image for ${fallbackName} (${detail})`);
}

/** Save a Blob to the user's machine via an object URL + invisible anchor. */
export function saveBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => window.URL.revokeObjectURL(url), 1000);
}

/** Build a safe filename for a card's QR (e.g. "Jane-Doe-qr.png"). */
export function cardFilename(
  card: Pick<CrmContactCardDto, "firstName" | "lastName">,
  extension: "png" | "svg",
): string {
  return `${card.firstName}-${card.lastName}-qr.${extension}`
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "-");
}

/** Resolve a public, fully-qualified URL from a server-relative scan/vCard URL. */
export function absolutePublicUrl(serverRelativeUrl: string): string {
  const base = env.apiBaseUrl.replace(/\/api\/?$/, "").replace(/\/$/, "");
  const path = serverRelativeUrl.startsWith("/")
    ? serverRelativeUrl
    : `/${serverRelativeUrl}`;
  return `${base}${path}`;
}