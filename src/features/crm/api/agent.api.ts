import { apiClient } from '@/shared/lib/api-client';
import { camelizeKeys } from '@/features/chat/api/chat.api';

/** One streamed progress frame from the agent loop. */
export interface AgentProgress {
  kind: 'tool_call' | 'tool_result' | 'final' | string;
  toolName?: string;
  detail?: string;
  success?: boolean;
}

/** Final agent turn result (mirrors backend AgentRuntimeResult; status is the numeric enum). */
export interface AgentResult {
  status: number; // 0 Completed · 1 AwaitingConfirmation · 2 MaxIterations · 3 Error · 4 Disabled
  response: string;
  confirmationPrompt?: string | null;
  pendingToolName?: string | null;
  toolTrace?: { toolName: string; success: boolean; summary: string; latencyMs: number }[];
}

export const AgentStatus = {
  Completed: 0,
  AwaitingConfirmation: 1,
  MaxIterations: 2,
  Error: 3,
  Disabled: 4,
} as const;

interface StreamHandlers {
  onProgress?: (p: AgentProgress) => void;
  onResult?: (r: AgentResult) => void;
}

/**
 * Stream one agent turn over SSE (POST /api/v1/agent-runtime/message/stream).
 * Emits `event: progress` frames while the loop runs, then one `event: result` frame.
 * Mirrors the builder-chat SSE parser (CRLF-normalized, multi-line data, partial-frame buffering).
 */
export async function streamAgentMessage(
  sessionId: string,
  message: string,
  confirmed: boolean,
  handlers: StreamHandlers,
  signal?: AbortSignal,
): Promise<void> {
  const token = localStorage.getItem('omniflow_token');
  const tenantId = localStorage.getItem('omniflow_tenant_id');

  const res = await fetch(`${apiClient.defaults.baseURL}/v1/agent-runtime/message/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(tenantId ? { 'X-Tenant-Id': tenantId } : {}),
    },
    body: JSON.stringify({ sessionId, message, confirmed }),
    signal,
  });

  if (!res.ok || !res.body) {
    throw new Error(`Agent stream failed: ${res.status} ${res.statusText || 'unknown'}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    buffer = buffer.replace(/\r\n/g, '\n');

    const frames = buffer.split('\n\n');
    buffer = frames.pop() ?? '';

    for (const frame of frames) {
      let eventName = 'message';
      const dataLines: string[] = [];
      for (const line of frame.split('\n')) {
        if (line.startsWith('event:')) eventName = line.slice(6).trim();
        else if (line.startsWith('data:')) dataLines.push(line.slice(5).replace(/^ /, ''));
      }
      const payload = dataLines.join('\n').trim();
      if (!payload) continue;

      try {
        const parsed = camelizeKeys(JSON.parse(payload));
        if (eventName === 'progress') handlers.onProgress?.(parsed as AgentProgress);
        else if (eventName === 'result') handlers.onResult?.(parsed as AgentResult);
      } catch {
        // skip malformed frame, keep the stream alive
      }
    }
  }
}
