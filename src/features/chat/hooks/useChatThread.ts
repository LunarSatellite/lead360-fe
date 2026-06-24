// ═══════════════════════════════════════════════════════════════
// Chat Feature — Thread hook
// Manages one session's message thread. Creates the session on first
// send, streams assistant replies, falls back to non-streaming on error.
// ═══════════════════════════════════════════════════════════════

import { useCallback, useEffect, useRef, useState } from 'react';
import { chatApi, camelizeKeys } from '../api/chat.api';
import {
  ChatMessageRole,
  RateLimitError,
  isCostLimitError,
  type ChatMessageDto,
  type ChatSessionDto,
  type ChatStreamEvent,
  type InlineCard,
} from '../types/chat.types';

interface UseChatThreadResult {
  sessionId: string | null;
  /**
   * The currently-selected session object (or null during hydration or
   * for a brand-new chat that hasn't been created yet). Exposed so the
   * page can read session.mode to switch between Onboarding UX and the
   * regular Builder chrome.
   */
  currentSession: ChatSessionDto | null;
  messages: ChatMessageDto[];
  isSending: boolean;
  hasStarted: boolean;
  /**
   * List of this user's chat sessions, newest first. Used by the session
   * dropdown in the chat UI. Refreshed on mount and updated optimistically
   * whenever createSession / switchSession run.
   */
  sessions: ChatSessionDto[];
  /**
   * True only on initial mount while we look up the user's sessions and
   * hydrate the most-recent one's history. Disables composer and shows
   * a loading state in the dropdown so the user doesn't accidentally
   * start a brand new session that immediately gets clobbered when
   * hydration finishes.
   */
  isHydrating: boolean;
  /**
   * Non-null while a long-running tool (currently just learnFromWebsite) is
   * mid-execution. UI uses this to show a single friendly line — backend
   * doesn't emit per-stage progress in V1.
   */
  longRunningTool: { name: string; label: string; stage?: string } | null;
  /**
   * Set when the backend returns 429. Value is a UTC timestamp (ms) after
   * which the UI can re-enable the composer. Null otherwise.
   */
  rateLimitedUntil: number | null;
  /**
   * Set when the backend returns a session-cost or tenant-budget Error event.
   * These are NOT retryable — the user must take action (start a new session
   * or top up billing). The composer should be permanently disabled while set.
   */
  costLimitError: string | null;
  send: (content: string, displayText?: string) => Promise<void>;
  /** Create a new session and switch to it. Used by the "+ New chat" button. */
  createSession: () => Promise<void>;
  /** Load a different session's thread by id. No-op if already current. */
  switchSession: (id: string) => Promise<void>;
  /**
   * One-click undo of the last reversible action in the current session.
   * Returns the backend's UndoResultDto so the UI can show the user-facing
   * summary string (per spec §9 — summary is always user-facing). Wraps
   * chatApi.undoLastChange so callers don't need to import chatApi.
   */
  undoLast: () => Promise<{ undone: boolean; summary: string | null } | null>;
  /**
   * Upload a PDF/DOCX during onboarding (separate spec — onboarding
   * accelerator). Backend extracts business facts and appends a System
   * note to the thread; on return we re-fetch the session detail so the
   * new message + its inline card render. Soft failures (status:Failed,
   * status:RateLimited) arrive in the 200 body — they are NOT errors;
   * the `summary`/`message` is surfaced via uploadFlash for the UI.
   */
  uploadDocument: (file: File) => Promise<void>;
  /** True while a document upload is in flight. Composer should be disabled. */
  isUploading: boolean;
  /**
   * Last upload's user-facing message (success summary, soft-fail reason,
   * or client-side validation error). Auto-clears after a few seconds.
   * Drives the inline note shown next to the composer.
   */
  uploadFlash: { kind: 'info' | 'soft-fail' | 'error'; text: string } | null;
  reset: () => void;
}

// ─── Message sort: ascending by time, user before assistant on same timestamp ─
function sortMessages(list: ChatMessageDto[]): ChatMessageDto[] {
  return [...list].sort((a, b) => {
    const ta = new Date(a.createdAt).getTime();
    const tb = new Date(b.createdAt).getTime();
    if (ta !== tb) return ta - tb;
    return a.role - b.role; // User=0 before Assistant=1
  });
}

// ─── Sort helper (most-recent activity first) ───────────────────
// Used by both the bootstrap effect and createSession to keep the sessions
// list in a stable order. Backend already returns in this order but we
// re-sort defensively in case that ever changes.
function sortByRecency(list: ChatSessionDto[]): ChatSessionDto[] {
  return [...list].sort((a, b) => {
    const ta = new Date(a.lastActivityAt ?? a.createdAt).getTime();
    const tb = new Date(b.lastActivityAt ?? b.createdAt).getTime();
    return tb - ta;
  });
}

export function useChatThread(): UseChatThreadResult {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [sessions, setSessions] = useState<ChatSessionDto[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [longRunningTool, setLongRunningTool] = useState<UseChatThreadResult['longRunningTool']>(null);
  const [rateLimitedUntil, setRateLimitedUntil] = useState<number | null>(null);
  const [costLimitError, setCostLimitError] = useState<string | null>(null);
  const [isHydrating, setIsHydrating] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFlash, setUploadFlash] = useState<UseChatThreadResult['uploadFlash']>(null);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const assistantDraftRef = useRef<string>('');
  // Stable ref to the latest `send` so uploadDocument can trigger an
  // auto-reply turn after upload without listing `send` in its deps
  // array (which would force uploadDocument to recreate on every send
  // change). Kept current via the useEffect after `send` is defined.
  const sendRef = useRef<((content: string) => Promise<void>) | null>(null);

  // ─── Hydrate sessions list + most-recent thread on mount ────────
  // The backend is the source of truth — no client storage. We list the
  // user's active sessions, store them for the dropdown, pick the most
  // recent one, and load its full thread via getSession (which returns
  // the session with its messages embedded).
  //
  // No session yet (first-ever user, all archived) → leave empty so the
  // "+ New chat" dropdown entry can take over. The composer's first send
  // still creates a session via ensureSession, same as before.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await chatApi.listSessions();
        if (cancelled) return;
        const sorted = sortByRecency(list);
        setSessions(sorted);
        if (sorted.length === 0) return;
        const detail = await chatApi.getSession(sorted[0].id);
        if (cancelled) return;
        setSessionId(detail.id);
        setMessages(sortMessages(detail.messages ?? []));
      } catch (err) {
        console.warn('[chat] hydration failed (silent):', err);
      } finally {
        if (!cancelled) setIsHydrating(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // Run once on mount only — re-running would clobber a session that the
    // user just created via the "+ New chat" button or first send.
  }, []);

  const ensureSession = useCallback(
    async (firstText: string) => {
      if (sessionId) return sessionId;
      // apiClient's response interceptor already unwraps ServiceResult / returns
      // the raw body — for POST /sessions the response body IS ChatSessionDto,
      // so `session.id` is read directly (no `.data` wrapper).
      const session = await chatApi.createSession({
        title: firstText.slice(0, 60),
      });
      setSessionId(session.id);
      setSessions((prev) => [session, ...prev.filter((s) => s.id !== session.id)]);
      return session.id;
    },
    [sessionId],
  );

  const send = useCallback(
    async (content: string, displayText?: string) => {
      const trimmed = content.trim();
      if (!trimmed || isSending) return;
      if (rateLimitedUntil && Date.now() < rateLimitedUntil) return;

      setIsSending(true);
      setLongRunningTool(null);
      assistantDraftRef.current = '';

      // Optimistic user bubble — show displayText (button label) if provided,
      // otherwise fall back to the raw content sent to the API.
      const optimisticUserMsg: ChatMessageDto = {
        id: `optimistic-${crypto.randomUUID()}`,
        sessionId: sessionId ?? '',
        role: ChatMessageRole.User,
        content: displayText?.trim() || trimmed,
        createdAt: new Date().toISOString(),
      };
      setMessages((m) => [...m, optimisticUserMsg]);

      // Placeholder assistant bubble that fills as tokens stream in.
      const assistantPlaceholderId = `streaming-${crypto.randomUUID()}`;
      setMessages((m) => [
        ...m,
        {
          id: assistantPlaceholderId,
          sessionId: sessionId ?? '',
          role: ChatMessageRole.Assistant,
          content: '',
          createdAt: new Date().toISOString(),
        },
      ]);

      try {
        const sid = await ensureSession(trimmed);

        // Try streaming first; fall back to non-stream on transport failure.
        let streamed = false;
        try {
          for await (const evt of chatApi.sendMessageStream(sid, {
            content: trimmed,
            displayContent: displayText?.trim() || undefined,
          })) {
            streamed = true;
            applyStreamEvent(
              evt,
              assistantPlaceholderId,
              assistantDraftRef,
              setMessages,
              setLongRunningTool,
              setCostLimitError,
              setSessions,
              sid,
            );
          }
        } catch (streamErr) {
          // 429 short-circuits everything — don't fall back to non-stream.
          if (streamErr instanceof RateLimitError) {
            setRateLimitedUntil(Date.now() + streamErr.retryAfterSeconds * 1000);
            setMessages((m) =>
              m.map((msg) =>
                msg.id === assistantPlaceholderId
                  ? {
                      ...msg,
                      content: `You're sending messages too fast. I'll be ready again in ${streamErr.retryAfterSeconds} seconds.`,
                    }
                  : msg,
              ),
            );
            return;
          }
          // Otherwise stream transport failed — fall through to non-streaming.
        }

        if (!streamed) {
          const assistantMsg = await chatApi.sendMessage(sid, { content: trimmed, displayContent: displayText?.trim() || undefined });
          setMessages((m) => m.map((msg) => (msg.id === assistantPlaceholderId ? assistantMsg : msg)));
        }
      } catch (err) {
        // Replace the placeholder with an error bubble so the user knows.
        setMessages((m) =>
          m.map((msg) =>
            msg.id === assistantPlaceholderId
              ? {
                  ...msg,
                  content: 'Something went wrong on my side. Try again in a moment.',
                }
              : msg,
          ),
        );
        // Keep err available for future toast wiring.
        void err;
      } finally {
        setIsSending(false);
        setLongRunningTool(null);
      }
    },
    [ensureSession, isSending, rateLimitedUntil, sessionId],
  );

  // Keep sendRef pointing at the latest `send`. uploadDocument calls
  // sendRef.current(...) so it always invokes the current closure
  // (with current sessionId etc.) without forcing uploadDocument to
  // recreate when send changes.
  useEffect(() => {
    sendRef.current = send;
  }, [send]);

  // Clears only transient UI state (rate limits, cost limit, drafts). The
  // session itself stays selected. Used internally by createSession and
  // switchSession to give the user a clean slate when they change threads.
  const clearTransientState = useCallback(() => {
    setLongRunningTool(null);
    setRateLimitedUntil(null);
    setCostLimitError(null);
    assistantDraftRef.current = '';
  }, []);

  // Kept for API compatibility with older callers — not used by the new
  // dropdown UI. Wipes everything back to a no-session state (next send
  // creates a new session via ensureSession).
  const reset = useCallback(() => {
    setMessages([]);
    setSessionId(null);
    clearTransientState();
  }, [clearTransientState]);

  // Create a brand new session and switch to it. Used by the dropdown's
  // "+ New chat" entry. Unlike the previous version this does NOT no-op
  // when a session already exists — clicking "+ New chat" should always
  // produce a fresh conversation.
  const createSession = useCallback(async () => {
    try {
      // Response body IS ChatSessionDto — apiClient's interceptor already
      // unwraps any ServiceResult envelope.
      const session = await chatApi.createSession({ title: 'New chat' });
      setSessionId(session.id);
      setMessages([]);
      // Prepend to the dropdown list so the user sees the new session
      // at the top immediately — backend also orders by recency but we
      // don't want to round-trip just to refresh the list.
      setSessions((prev) => [session, ...prev.filter((s) => s.id !== session.id)]);
      clearTransientState();
    } catch (err) {
      console.warn('[chat] createSession failed:', err);
    }
  }, [clearTransientState]);

  // Switch to a different existing session. Loads the thread via
  // getSession so history is visible immediately. No-op if already on
  // the requested session.
  const switchSession = useCallback(
    async (id: string) => {
      if (id === sessionId) return;
      try {
        const detail = await chatApi.getSession(id);
        setSessionId(detail.id);
        setMessages(sortMessages(detail.messages ?? []));
        clearTransientState();
      } catch (err) {
        console.warn('[chat] switchSession failed:', err);
      }
    },
    [sessionId, clearTransientState],
  );

  // Direct undo endpoint (spec §9). Reversible for addTopic + addMenuItem.
  // For anything else the backend returns `undone: false` with an explanatory
  // summary that we hand back to the UI for display. No-op when there's no
  // active session (button should already be disabled in that case).
  const undoLast = useCallback(async () => {
    if (!sessionId) return null;
    try {
      const result = await chatApi.undoLastChange(sessionId);
      return { undone: result.undone, summary: result.summary };
    } catch (err) {
      console.warn('[chat] undoLast failed:', err);
      return null;
    }
  }, [sessionId]);

  // Schedules a flash message to auto-clear after 6s (long enough for the
  // user to read a soft-fail explanation, short enough to not linger).
  // Cancels any prior timer so consecutive flashes don't overlap.
  const setFlash = useCallback((flash: UseChatThreadResult['uploadFlash']) => {
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    setUploadFlash(flash);
    if (flash) {
      flashTimerRef.current = setTimeout(() => setUploadFlash(null), 6000);
    }
  }, []);

  // ─── Upload PDF/DOCX during onboarding (separate spec §2/§4) ────
  // Per spec §4: upload disables composer + shows progress, then we
  // refetch the session detail to pick up the new System message that
  // the backend appended (it contains the DocumentExtractionDrafts
  // inline card we render in the thread).
  //
  // After the refetch we trigger a follow-up turn so the bot reacts to
  // the document immediately (otherwise the System note sits unread
  // until the user types something). We call through sendRef so this
  // doesn't need to live in the deps array — keeps uploadDocument
  // stable across send-rerenders.
  //
  // Soft failures (status: Failed / RateLimited) come back inside a
  // 200 body. They are NOT errors — show the `message`/`summary` as a
  // neutral note and leave the composer enabled so the interview can
  // continue manually (spec §2 + §7).
  const uploadDocument = useCallback(
    async (file: File) => {
      if (isUploading) return;
      setIsUploading(true);
      setFlash(null);
      try {
        // Create a session on first upload if none exists yet (same as send).
        const sid = await ensureSession(file.name.replace(/\.[^.]+$/, ''));
        const result = await chatApi.uploadDocument(sid, file);

        if (result.status === 'Completed') {
          // Refetch the session detail to pick up the new System message
          // (and its inline DocumentExtractionDrafts card). Per spec §4
          // we could "rely on the next stream" but refetching is more
          // reliable — the user might never send another message.
          try {
            const detail = await chatApi.getSession(sid);
            setMessages(sortMessages(detail.messages ?? []));
          } catch (err) {
            console.warn('[chat] refresh after upload failed:', err);
          }
          setFlash({
            kind: 'info',
            text:
              result.summary ??
              `Read ${result.fileName} — ${result.productDraftCount} products, ${result.topicDraftCount} topics drafted.`,
          });

          // Trigger the LLM to react to the document. Without this the
          // bot just sits silent — the upload endpoint persists a System
          // note but never invokes the orchestrator. The system prompt's
          // post-upload phase recognises this trigger and replies with a
          // section-mapped summary + first missing-required question.
          // Null-safe: if sendRef hasn't synced yet (effectively never
          // — the useEffect runs synchronously after send is created),
          // upload still completes successfully — we just lose the
          // auto-reply, and the user can type anything to wake the bot.
          if (sendRef.current) {
            void sendRef.current("Use what's in my document — what do you need from me?");
          }
        } else {
          // Soft failure inside 200. Backend did NOT append a thread note.
          // Show message as neutral system note next to the composer.
          setFlash({
            kind: 'soft-fail',
            text:
              result.message ??
              (result.status === 'RateLimited'
                ? "You've already read three sources in the last day. Let's just go through the questions — we can upload more tomorrow if you want."
                : "I couldn't read that file. Want to describe your business manually instead?"),
          });
        }
      } catch (err) {
        // Hard failure — client-side validation rejection or network/HTTP error.
        // The Error message from validateAcceleratorFile is already user-facing.
        const text = err instanceof Error ? err.message : 'Upload failed. Try again.';
        setFlash({ kind: 'error', text });
      } finally {
        setIsUploading(false);
      }
    },
    [ensureSession, isUploading, setFlash],
  );

  // Cleanup the flash timer if the hook unmounts mid-flash. Avoids a
  // stray setState on an unmounted component if the user navigates away.
  useEffect(
    () => () => {
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    },
    [],
  );

  // Derived: the currently-selected session object, for quick access to
  // session.mode (Onboarding vs Builder) without threading sessionId +
  // sessions list through every consumer.
  const currentSession = sessions.find((s) => s.id === sessionId) ?? null;

  return {
    sessionId,
    currentSession,
    messages,
    isSending,
    hasStarted: messages.length > 0,
    sessions,
    isHydrating,
    longRunningTool,
    rateLimitedUntil,
    costLimitError,
    send,
    createSession,
    switchSession,
    undoLast,
    uploadDocument,
    isUploading,
    uploadFlash,
    reset,
  };
}

// ─── Apply one SSE event to state ────────────────────────────────
// Event names and payload shapes match the backend integration guide exactly.
function applyStreamEvent(
  evt: ChatStreamEvent,
  assistantPlaceholderId: string,
  draftRef: React.MutableRefObject<string>,
  setMessages: React.Dispatch<React.SetStateAction<ChatMessageDto[]>>,
  setLongRunningTool: React.Dispatch<React.SetStateAction<UseChatThreadResult['longRunningTool']>>,
  setCostLimitError: React.Dispatch<React.SetStateAction<string | null>>,
  setSessions: React.Dispatch<React.SetStateAction<ChatSessionDto[]>>,
  currentSessionId: string | null,
): void {
  switch (evt.eventType) {
    case 'ToolCallStarted': {
      // Surface a friendly loading line for the single long-running tool.
      // Every other tool finishes fast enough that no UI hint is needed.
      if (evt.payload.name === 'learnFromWebsite') {
        setLongRunningTool({
          name: evt.payload.name,
          label: 'Reading your website — this takes up to a minute.',
        });
      }
      break;
    }
    case 'IngestionProgress': {
      setLongRunningTool((prev) =>
        prev ? { ...prev, label: evt.payload.message, stage: evt.payload.stage } : null,
      );
      break;
    }
    case 'ToolCallCompleted': {
      setLongRunningTool(null);

      // Onboarding → Builder mode flip (spec §7). When completeOnboarding
      // fires its OnboardingCompleted card, the backend has already flipped
      // session.mode to Builder server-side. Mirror it locally so the UI
      // transitions from onboarding chrome (sidebar, progress bar) to the
      // regular builder layout without waiting for a refetch.
      const card = evt.payload.result.inlineCard as { type?: string } | null;
      if (card && card.type === 'OnboardingCompleted' && currentSessionId) {
        setSessions((prev) =>
          prev.map((s) => (s.id === currentSessionId ? { ...s, mode: 1 /* Builder */ } : s)),
        );
      }

      // Confirmation flow (§5 of integration guide). When the backend asks
      // for confirmation, success=false but it's NOT an error — synthesize a
      // Confirmation inline card so the UI can render Confirm/Cancel buttons.
      // This takes precedence over any other card the backend might have
      // included on the same event.
      if (evt.payload.result.requiresConfirmation) {
        const confirmationCard = {
          type: 'Confirmation',
          summary: evt.payload.result.summary,
          toolName: evt.payload.name,
        };
        setMessages((m) =>
          m.map((msg) =>
            msg.id === assistantPlaceholderId
              ? {
                  ...msg,
                  content: evt.payload.result.summary,
                  inlineCardJson: JSON.stringify(confirmationCard),
                }
              : msg,
          ),
        );
        break;
      }

      // If the tool produced an inline card, attach it to the placeholder
      // message so the AssistantBubble can render it.
      const inlineCard = evt.payload.result.inlineCard;
      if (inlineCard) {
        setMessages((m) =>
          m.map((msg) =>
            msg.id === assistantPlaceholderId ? { ...msg, inlineCardJson: JSON.stringify(inlineCard) } : msg,
          ),
        );
      }
      // Summary shown above assistant text when there's no final content yet
      // (e.g. successful tool with empty assistant reply). Skip for `attachUi`
      // because its summary ("UI attached: Radio") is internal log text — the
      // real assistant text streams via AssistantDone right after.
      if (!draftRef.current && evt.payload.result.summary && evt.payload.name !== 'attachUi') {
        draftRef.current = evt.payload.result.summary;
        setMessages((m) =>
          m.map((msg) =>
            msg.id === assistantPlaceholderId ? { ...msg, content: evt.payload.result.summary } : msg,
          ),
        );
      }
      break;
    }
    case 'AssistantTokens': {
      // Backend doesn't emit these in V1 — prepared for when it does.
      draftRef.current += evt.payload.delta;
      const current = draftRef.current;
      setMessages((m) =>
        m.map((msg) => (msg.id === assistantPlaceholderId ? { ...msg, content: current } : msg)),
      );
      break;
    }
    case 'AssistantDone': {
      // Replace the placeholder with the canonical persisted message.
      // Preserve any inline card we attached during ToolCallCompleted in
      // case the backend didn't echo it back on AssistantDone.
      setMessages((m) =>
        m.map((msg) =>
          msg.id === assistantPlaceholderId
            ? {
                ...evt.payload,
                inlineCardJson: evt.payload.inlineCardJson ?? msg.inlineCardJson,
              }
            : msg,
        ),
      );
      break;
    }
    case 'Error': {
      // Cost-limit errors are NOT retryable — escalate to a banner. Other
      // errors stay inline in the bubble (LLM failure, session not found).
      const msg = evt.payload.message;
      if (isCostLimitError(msg)) {
        setCostLimitError(msg);
        // Replace the placeholder bubble with a short stub; the banner
        // shown above the composer carries the real explanation.
        setMessages((m) =>
          m.map((mm) =>
            mm.id === assistantPlaceholderId
              ? { ...mm, content: 'I had to stop — see the notice below.' }
              : mm,
          ),
        );
      } else {
        setMessages((m) => m.map((mm) => (mm.id === assistantPlaceholderId ? { ...mm, content: msg } : mm)));
      }
      break;
    }
  }
}

/** Parse a message's stringified inlineCardJson into a structured card.
 *
 * inlineCardJson arriving via AssistantDone is a raw backend JSON string
 * that was never passed through camelizeKeys (which only processes object
 * nodes in the SSE event tree, not string-valued fields). Cards that came
 * via ToolCallCompleted were camelized before being stringified, so they
 * are already camelCase. Applying camelizeKeys after JSON.parse is safe in
 * both cases: it is a no-op on already-camelCase keys.
 */
export function parseInlineCard(msg: ChatMessageDto): InlineCard | null {
  if (!msg.inlineCardJson) return null;
  try {
    const raw = JSON.parse(msg.inlineCardJson) as unknown;
    const card = camelizeKeys(raw) as InlineCard;
    console.log('[parseInlineCard] msgId:', msg.id, '→ card:', card);
    return card;
  } catch {
    console.warn('[parseInlineCard] failed to parse inlineCardJson:', msg.inlineCardJson);
    return null;
  }
}