// ═══════════════════════════════════════════════════════════════
// Chat Feature — API Functions (matches backend spec)
// Source: /api/v1/chat/* (ChatOrchestrationController)
//
// Backend is in active development. When an endpoint isn't live yet
// the call will return the standard 404/501 and React Query will
// surface it as an error — callers should handle `isError`.
// ═══════════════════════════════════════════════════════════════

import { apiClient } from '@/shared/lib/api-client';
import {
  RateLimitError,
  type ChatSessionDto,
  type ChatSessionDetailDto,
  type ChatMessageDto,
  type ChatActivityItemDto,
  type CreateSessionRequest,
  type SendMessageRequest,
  type ChatStreamEvent,
  type QuickStart,
  type ToolDescriptorDto,
  type UndoResultDto,
  type DocumentUploadResultDto,
  validateAcceleratorFile,
} from '../types/chat.types';

// ─── PascalCase → camelCase normalizer ─────────────────────────
// Used by the SSE stream parser only. The .NET SSE writer emits PascalCase
// JSON (EventType, Payload, Id, SessionId, Content, …) while the rest of
// the API returns camelCase via its normal JSON serializer pipeline. Rather
// than teach every consumer to handle both shapes, we recursively camelize
// the parsed event tree right after JSON.parse so downstream code only
// sees camelCase. Arrays are walked, primitives are passed through, and
// `null` is treated as a primitive (typeof null === 'object' would
// otherwise crash on `Object.entries`).
function lowerFirst(s: string): string {
  return s.length === 0 ? s : s[0].toLowerCase() + s.slice(1);
}
export function camelizeKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(camelizeKeys);
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[lowerFirst(k)] = camelizeKeys(v);
    }
    return out;
  }
  return value;
}

// ─── Quick-start options ────────────────────────────────────────
// These stay client-side because they're the empty-state scaffolding
// shown before the user has any session. They're not fake data —
// they map 1:1 to real onboarding paths the backend understands
// (website ingestion, API upload, catalog describe).

const QUICK_STARTS: QuickStart[] = [
  {
    id: 'website',
    title: 'I have a website',
    subtitle: "I'll read it to set up your bot",
    promptText: "Here's my website — read through it and set up my bot automatically:\n",
  },
  {
    id: 'api',
    title: 'I have an API',
    subtitle: 'Connect Swagger or OpenAPI spec',
    promptText: "I have an API. Here's the Swagger URL:\n",
  },
  {
    id: 'describe',
    title: "I'll describe my business",
    subtitle: "Tell me in your own words and I'll build it",
    promptText: '',
  },
  {
    id: 'platform',
    title: 'Import from Shopify',
    subtitle: 'Or another online store',
    promptText: 'I sell on Shopify. My store URL is:\n',
  },
];

export const chatApi = {
  // ─── Quick-starts (client-side constant, always available) ───
  getQuickStarts: (): QuickStart[] => QUICK_STARTS,

  // ─── Sessions ────────────────────────────────────────────────
  // Note on return types: apiClient's response interceptor unwraps any
  // ServiceResult envelope and returns the raw payload. Axios's default
  // typing claims AxiosResponse<T> (so callers would write `res.data`),
  // but at runtime callers receive `T` directly. Each method's return
  // type below is annotated to reflect the runtime shape, not axios's
  // default — without this, `await chatApi.createSession(...)` would
  // typecheck as AxiosResponse<ChatSessionDto> and the `.id` access
  // would compile against a property that doesn't exist at runtime.

  // GET /api/v1/chat/sessions → ChatSessionDto[]
  listSessions: (): Promise<ChatSessionDto[]> =>
    apiClient.get<ChatSessionDto[]>('/v1/chat/sessions') as unknown as Promise<ChatSessionDto[]>,

  // GET /api/v1/chat/sessions/{id} → ChatSessionDetailDto (session + full thread)
  getSession: (id: string): Promise<ChatSessionDetailDto> =>
    apiClient.get<ChatSessionDetailDto>(
      `/v1/chat/sessions/${id}`,
    ) as unknown as Promise<ChatSessionDetailDto>,

  // POST /api/v1/chat/sessions → ChatSessionDto (200)
  createSession: (data: CreateSessionRequest): Promise<ChatSessionDto> =>
    apiClient.post<ChatSessionDto>('/v1/chat/sessions', data) as unknown as Promise<ChatSessionDto>,

  // DELETE /api/v1/chat/sessions/{id} → void
  archiveSession: (id: string): Promise<void> =>
    apiClient.delete<void>(`/v1/chat/sessions/${id}`) as unknown as Promise<void>,

  // ─── Messages ────────────────────────────────────────────────

  // GET /api/v1/chat/sessions/{id}/messages → ChatMessageDto[]
  listMessages: (sessionId: string): Promise<ChatMessageDto[]> =>
    apiClient.get<ChatMessageDto[]>(`/v1/chat/sessions/${sessionId}/messages`) as unknown as Promise<
      ChatMessageDto[]
    >,

  // POST /api/v1/chat/sessions/{id}/messages → ChatMessageDto
  // Non-streaming send. Used as a fallback when SSE isn't available.
  sendMessage: (sessionId: string, data: SendMessageRequest): Promise<ChatMessageDto> =>
    apiClient.post<ChatMessageDto>(
      `/v1/chat/sessions/${sessionId}/messages`,
      data,
    ) as unknown as Promise<ChatMessageDto>,

  // ─── Onboarding accelerator ──────────────────────────────────
  // POST /api/v1/chat/sessions/{id}/documents — multipart upload of a
  // PDF/DOCX. Backend extracts business facts via LLM and:
  //   - in onboarding: appends a System-role message + audit row, returns
  //     drafts in the response (nothing persisted to topics/menu)
  //   - in builder: writes drafts directly (legacy path)
  //
  // Validates client-side first so we don't waste a multipart round-trip on
  // an obviously-bad file. Soft failures (status: Failed / RateLimited)
  // arrive INSIDE a 200 OK body — callers should switch on `status`, not
  // assume success means usable extraction.
  //
  // axios sets the multipart Content-Type with boundary itself when the
  // request body is a FormData; do not pre-set it manually or the boundary
  // is lost and the backend rejects the request.
  uploadDocument: async (sessionId: string, file: File): Promise<DocumentUploadResultDto> => {
    const reason = validateAcceleratorFile(file);
    if (reason) throw new Error(reason);
    const fd = new FormData();
    fd.append('file', file);
    return apiClient.post<DocumentUploadResultDto>(`/v1/chat/sessions/${sessionId}/documents`, fd, {
      // Override the apiClient's default `Content-Type: application/json`.
      // For FormData uploads, the browser must set Content-Type to
      // `multipart/form-data; boundary=...` itself — the boundary token
      // is generated when the body is serialised. If we leave the JSON
      // header in place, the server sees a multipart body declared as
      // JSON and returns 415 Unsupported Media Type. Setting it to
      // undefined here removes the inherited default; axios then lets
      // the browser fill in the proper multipart header with boundary.
      headers: { 'Content-Type': undefined },
    }) as unknown as Promise<DocumentUploadResultDto>;
  },

  // POST /api/v1/chat/sessions/{id}/messages/stream → text/event-stream
  // Streaming send. Returns an async iterator of ChatStreamEvents.
  //
  // Usage:
  //   for await (const evt of chatApi.sendMessageStream(sessionId, data)) {
  //     switch (evt.type) { ... }
  //   }
  sendMessageStream: async function* (
    sessionId: string,
    data: SendMessageRequest,
  ): AsyncGenerator<ChatStreamEvent, void, void> {
    const token = localStorage.getItem('omniflow_token');
    const tenantId = localStorage.getItem('omniflow_tenant_id');

    const res = await fetch(`${apiClient.defaults.baseURL}/v1/chat/sessions/${sessionId}/messages/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(tenantId ? { 'X-Tenant-Id': tenantId } : {}),
      },
      body: JSON.stringify(data),
    });

    if (res.status === 429) {
      const retry = Number(res.headers.get('Retry-After') ?? '60');
      throw new RateLimitError(retry);
    }
    if (!res.ok || !res.body) {
      throw new Error(`Stream failed: ${res.status} ${res.statusText || 'unknown'}`);
    }
    console.log('response', res);
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) return;
        buffer += decoder.decode(value, { stream: true });

        // Normalize CRLF → LF up front. ASP.NET (and several other SSE
        // servers) send CRLF line endings; the previous version of this
        // parser only split on `\n\n`, never matched, and silently dropped
        // every event while the network tab showed a perfectly healthy
        // response — looked like nothing was happening in the UI.
        buffer = buffer.replace(/\r\n/g, '\n');

        // SSE frames are separated by a blank line (double-newline after
        // normalization). Anything left over after the last `\n\n` is a
        // partial frame — push it back into the buffer for the next chunk.
        const frames = buffer.split('\n\n');
        buffer = frames.pop() ?? '';

        for (const frame of frames) {
          // A frame can have multiple `data:` lines that the spec says to
          // join with `\n` — concatenate them all instead of just taking
          // the first one. Comments (`:` prefix) and other fields like
          // `event:` / `id:` are skipped.
          const dataLines = frame
            .split('\n')
            .filter((l) => l.startsWith('data:'))
            .map((l) => l.slice(5).replace(/^ /, '')); // strip leading space if present

          if (dataLines.length === 0) continue;
          const payload = dataLines.join('\n').trim();
          if (!payload || payload === '[DONE]') continue;

          // ── DEBUG: log every raw SSE frame ──────────────────────
          console.log('[SSE raw frame]', payload);

          try {
            // Backend envelope: { eventType, payload, timestamp }.
            // The SSE serializer on the .NET side currently emits PascalCase
            // (EventType, Payload, Id, SessionId, Content, …) while the rest
            // of the API returns camelCase via axios + the response interceptor.
            // We normalize the parsed event tree to camelCase here so the rest
            // of the codebase (hook, types, switch statements) only ever has
            // to know one shape.
            const rawParsed = JSON.parse(payload) as unknown;
            const normalized = camelizeKeys(rawParsed) as {
              eventType: string;
              payload: unknown;
            };

            // ── DEBUG: log normalized event + inlineCardJson if present ─
            console.log('[SSE normalized event]', normalized.eventType, normalized.payload);
            if (
              normalized.eventType === 'AssistantDone' &&
              (normalized.payload as Record<string, unknown>)?.inlineCardJson
            ) {
              const cardStr = (normalized.payload as Record<string, unknown>).inlineCardJson as string;
              console.log('[SSE inlineCardJson raw string]', cardStr);
              try {
                console.log('[SSE inlineCardJson parsed]', JSON.parse(cardStr));
              } catch {
                console.log('[SSE inlineCardJson] failed to parse as JSON');
              }
            }
            if (
              normalized.eventType === 'ToolCallCompleted' &&
              (normalized.payload as Record<string, unknown>)?.result
            ) {
              const result = (normalized.payload as Record<string, unknown>).result as Record<
                string,
                unknown
              >;
              if (result?.inlineCard) {
                console.log('[SSE ToolCallCompleted inlineCard]', result.inlineCard);
              }
            }

            yield normalized as ChatStreamEvent;
          } catch {
            // Malformed frame — skip, keep stream going.
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  },

  // POST /api/v1/chat/sessions/{id}/undo → UndoResultDto
  // `undone: false` is not an error — it just means the last action wasn't
  // reversible. Always show `summary` to the user; the backend writes it
  // to be user-facing.
  undoLastChange: (sessionId: string): Promise<UndoResultDto> =>
    apiClient.post<UndoResultDto>(`/v1/chat/sessions/${sessionId}/undo`) as unknown as Promise<UndoResultDto>,

  // ─── Tools (optional discoverability) ─────────────────────────
  // GET /api/v1/chat/tools → ToolDescriptorDto[]
  // The 25 tools available to the current user's role. Used to surface
  // common tools as chips in the composer if you want; the LLM picks tools
  // from natural language regardless of what chips you show.
  listTools: (): Promise<ToolDescriptorDto[]> =>
    apiClient.get<ToolDescriptorDto[]>('/v1/chat/tools') as unknown as Promise<ToolDescriptorDto[]>,

  // ─── Activity feed (multi-user tenants) ───────────────────────
  // GET /api/v1/chat/activity?limit=&sessionId=&userId=
  // Tenant-wide list of mutating chat actions ("who added this"). Backend
  // already filters out failures and read-only tools. Don't stream — poll
  // on demand or refresh on local SSE ToolCallCompleted.
  getActivity: (params?: {
    limit?: number;
    sessionId?: string;
    userId?: string;
  }): Promise<ChatActivityItemDto[]> => {
    const search = new URLSearchParams();
    if (params?.limit != null) search.set('limit', String(params.limit));
    if (params?.sessionId) search.set('sessionId', params.sessionId);
    if (params?.userId) search.set('userId', params.userId);
    const query = search.toString();
    return apiClient.get<ChatActivityItemDto[]>(
      `/v1/chat/activity${query ? `?${query}` : ''}`,
    ) as unknown as Promise<ChatActivityItemDto[]>;
  },

};
