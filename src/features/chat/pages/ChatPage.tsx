import { useEffect, useRef, useState, useCallback, useMemo, Fragment } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Send,
  Sparkles,
  Paperclip,
  Loader2,
  Globe,
  ExternalLink,
  MessageSquare,
  ShoppingBag,
  Code2,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Check,
  X,
  Plus,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  Mic,
  MicOff,
  Square,
  FileText,
  Info,
  GitBranch,
} from 'lucide-react';
import { useChatThread, parseInlineCard } from '../hooks/useChatThread';
import { useVoiceRecorder } from '@/features/voice/hooks/useVoiceRecorder';
import { useTranscribeAudio } from '@/features/voice/api/voice.queries';
import { AgentCreatedCardRenderer } from '@/features/agents';
import type { AgentCreatedCard } from '@/features/agents';
import { HttpMethodBadge } from '@/shared/components';
import {
  ChatMessageRole,
  ChatSessionMode,
  ONBOARDING_SECTIONS,
  ACCELERATOR_ACCEPT,
  parseOnboardingProgress,
  stripProgressLine,
  type ChatMessageDto,
  type ChatSessionDto,
  type InlineCard,
  type InputCardVariant,
  type OnboardingProgress,
  type WebsiteExtractionDraftsCard,
  type DocumentExtractionDraftsCard,
  type ProposedBotMenuCard,
} from '../types/chat.types';
import { InputCard } from '../components/inline-cards/InputControls';

/* ═══════════════════════════════════════════════════════════════════════════
   Chat (primary surface)
   First thing the user sees after login. Welcome block sits at top of the
   scrolling area and fades away as the user scrolls. Below it, the bot's
   first message is pre-seeded so the conversation has already started.
   ═══════════════════════════════════════════════════════════════════════ */
export function Component() {
  const thread = useChatThread();
  const navigate = useNavigate();
  const [draft, setDraft] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const transcribe = useTranscribeAudio();
  const recorder = useVoiceRecorder();
  const isRecording = recorder.state === 'recording';
  const isTranscribing = transcribe.isPending;

  // Deep-link support: /dashboard/chat?prefill=... drops the text into
  // the composer so the user can review and send. Used by Home page
  // setup-status items and any "open chat with this question" shortcuts.
  useEffect(() => {
    const prefill = searchParams.get('prefill');
    if (prefill) {
      setDraft(prefill);
      // Clean the URL so the prefill doesn't re-apply on re-render.
      searchParams.delete('prefill');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const endRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Ghost text from the AI's suggestedAnswer in the last emitTurn response.
  // Set when a new assistant message arrives with suggestedAnswer; cleared on any typing or Tab-accept.
  const [ghostText, setGhostText] = useState<string | null>(null);

  // Auto-scroll to bottom when new messages arrive.
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread.messages.length, thread.isSending]);

  // When a new assistant message arrives carrying a suggestedAnswer in its
  // inlineCardJson, show it as ghost text in the composer. Tab accepts; any
  // typing dismisses.
  useEffect(() => {
    const msgs = thread.messages;
    for (let i = msgs.length - 1; i >= 0; i--) {
      const m = msgs[i];
      if (m.role !== ChatMessageRole.Assistant) continue;
      if (!m.inlineCardJson) break; // no card on last assistant msg → no suggestion
      try {
        const parsed = JSON.parse(m.inlineCardJson) as Record<string, unknown>;
        const sa = parsed?.suggestedAnswer;
        if (typeof sa === 'string' && sa.trim()) {
          setGhostText(sa.trim());
        }
      } catch { /* ignore malformed JSON */ }
      break;
    }
  }, [thread.messages]);

  // Which onboarding section to view in isolation (null = live / all messages).
  const [viewingSection, setViewingSection] = useState<number | null>(null);

  // Map each message.id → the section number it belongs to.
  // We scan forward and bump the section whenever an assistant message
  // carries a new section marker.
  const sectionIndex = useMemo(() => {
    const map = new Map<string, number>();
    let section = 1;
    for (const msg of thread.messages) {
      if (msg.role === ChatMessageRole.Assistant) {
        const parsed = parseOnboardingProgress(msg.content ?? '');
        if (parsed) section = parsed.currentSection;
      }
      map.set(msg.id, section);
    }
    return map;
  }, [thread.messages]);

  // Messages shown in the Thread — filtered when the user is browsing a
  // specific section, otherwise the full live thread.
  const visibleMessages =
    viewingSection !== null
      ? thread.messages.filter((m) => sectionIndex.get(m.id) === viewingSection)
      : thread.messages;

  const submit = () => {
    if (!draft.trim() || thread.isSending) return;
    if (thread.isHydrating) return;
    if (isRecording || isTranscribing) return;
    if (thread.rateLimitedUntil && Date.now() < thread.rateLimitedUntil) return;
    thread.send(draft);
    setDraft('');
    setGhostText(null);
    // Return to live view after sending so the user sees the bot's reply.
    setViewingSection(null);
  };

  // Tick every second so the rate-limit countdown updates without a
  // dedicated timer effect.
  const [, setNow] = useState(0);
  useEffect(() => {
    if (!thread.rateLimitedUntil) return;
    const id = setInterval(() => setNow((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [thread.rateLimitedUntil]);

  const rateLimitSecondsLeft =
    thread.rateLimitedUntil && Date.now() < thread.rateLimitedUntil
      ? Math.ceil((thread.rateLimitedUntil - Date.now()) / 1000)
      : 0;
  const isRateLimited = rateLimitSecondsLeft > 0;

  // ─── Onboarding progress (spec §7) ─────────────────────────────
  // When session.mode === Onboarding, render the 8-section progress
  // strip at the top of the chat. Progress is parsed from the latest
  // assistant message's trailing marker "— Section 3/8 · 7/39 answered —".
  // First message (greeting) has no marker, so fallback to Section 1.
  // Also treat the pre-session state (first-ever visit, no session yet)
  // as onboarding so the section strip shows immediately on load.
  const isOnboarding =
    thread.currentSession?.mode === ChatSessionMode.Onboarding ||
    (!thread.isHydrating && !thread.sessionId);

  // True when we've seen at least one real section marker in this thread.
  // Used to keep the progress bar visible after onboarding completes
  // (mode switches to Builder but we still want to show "all done").
  const hasSeenOnboarding = thread.messages.some(
    (m) => m.role === ChatMessageRole.Assistant && parseOnboardingProgress(m.content ?? '') !== null,
  );

  const onboardingProgress: OnboardingProgress | null = (() => {
    for (let i = thread.messages.length - 1; i >= 0; i--) {
      const msg = thread.messages[i];
      if (msg.role !== ChatMessageRole.Assistant) continue;
      const parsed = parseOnboardingProgress(msg.content ?? '');
      if (parsed) return parsed;
    }
    // No marker yet (first greeting) → show Section 1 as current.
    return { currentSection: 1, answered: 0, total: 0 };
  })();

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab' && ghostText) {
      e.preventDefault();
      setDraft(draft + ghostText);
      setGhostText(null);
      return;
    }
    if (e.key === 'Escape' && ghostText) {
      setGhostText(null);
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
      return;
    }
    if (e.key === 'Enter' && e.shiftKey) {
      const el = e.currentTarget;
      const cursor = el.selectionStart;
      const textBeforeCursor = draft.slice(0, cursor);
      const lastNewline = textBeforeCursor.lastIndexOf('\n');
      const currentLine = textBeforeCursor.slice(lastNewline + 1);
      const match = currentLine.match(/^(\d+)\.\s/);
      if (match) {
        e.preventDefault();
        const insertion = '\n' + (parseInt(match[1], 10) + 1) + '. ';
        setDraft(draft.slice(0, cursor) + insertion + draft.slice(el.selectionEnd));
        requestAnimationFrame(() => {
          el.selectionStart = el.selectionEnd = cursor + insertion.length;
        });
      }
    }
  };

  // Voice → transcribe → send through the same text path thread.send uses.
  // No separate voice endpoint; the backend stream handler never learns the
  // message started as audio. Mirrors the pattern in flow-builder previews.
  // Watches the recorder for a finalized blob — fires once per stop, then
  // resets the recorder so it's ready for the next turn.
  useEffect(() => {
    if (!recorder.audioBlob || recorder.state !== 'idle') return;
    const blob = recorder.audioBlob;
    recorder.reset();
    if (
      thread.isHydrating ||
      thread.isSending ||
      transcribe.isPending ||
      isRateLimited ||
      !!thread.costLimitError
    ) {
      return;
    }
    (async () => {
      try {
        const result = await transcribe.mutateAsync({ audio: blob });
        const text = result.text?.trim();
        if (!text) return;
        thread.send(text);
      } catch {
        // useTranscribeAudio surfaces the error via sonner.
      }
    })();
  }, [recorder, thread, transcribe, isRateLimited]);

  const startRecording = () => {
    if (isRecording || isTranscribing) return;
    if (thread.isHydrating || thread.costLimitError || isRateLimited) return;
    void recorder.startRecording();
  };

  const onChip = (text: string) => {
    setDraft(text);
  };

  // ─── Shortcut handlers (left panel) ─────────────────────────────
  // Three quick actions surfaced in the onboarding sidebar. They reuse
  // the existing composer plumbing rather than introducing new flows:
  // - Upload triggers the same file picker as the paperclip button.
  // - Website prefills the composer with a stub the user completes.
  // - Example sends a message asking the bot for a sample answer for
  //   the current section. Different from prefill — the user wants the
  //   bot to demonstrate, not to type their own answer.
  const onShortcutUpload = useCallback(() => {
    if (thread.isUploading) return;
    fileInputRef.current?.click();
  }, [thread.isUploading]);

  const onShortcutPasteUrl = useCallback(() => {
    setDraft("Here's my website: ");
  }, []);

  // Card actions handed down to InlineCardRenderer. Defined at this scope so
  // the renderer doesn't need its own access to the navigate / thread hooks.
  const cardActions: CardActions = {
    onNavigate: (path) => {
      // The backend's RedirectToPage card already includes a leading slash.
      navigate(path);
    },
    onConfirm: () => {
      thread.send('yes, confirm');
    },
    onCancel: () => {
      thread.send('no, cancel');
    },
    onPasteManually: () => {
      // Fallback for WebsiteIngestionFailed — push a phrase into the composer
      // so the user can keep typing menu items inline.
      setDraft("Let's add the menu manually. First item: ");
    },
    onReply: (value, displayText) => {
      void thread.send(value, displayText);
    },
  };

  return (
    <div className="flex flex-col h-full -m-4 md:-m-6 relative">
      {/* ─── Ambient gradient orbs (per spec) ─── */}
      <AmbientOrbs />

      {/* ─── Top controls row (right-aligned) ───────────────────────
          Undo always (when a session exists). Session dropdown is now
          shown in BOTH onboarding and builder mode so the full chat
          list is always one click away. The onboarding left panel only
          surfaces the top 3 recent chats — the dropdown is the escape
          hatch for everything older. */}
      {!thread.isHydrating && thread.sessionId && (
        <div className="absolute top-4 right-4 md:top-5 md:right-6 z-30 flex items-center gap-2">
          <UndoButton onUndo={thread.undoLast} />
          <SessionDropdown
            sessions={thread.sessions}
            currentSessionId={thread.sessionId}
            onNewChat={() => void thread.createSession()}
            onSwitch={(id) => void thread.switchSession(id)}
          />
        </div>
      )}

      {/* ─── Onboarding progress strip ─── */}
      {!thread.isHydrating && (isOnboarding || hasSeenOnboarding) && (
        <OnboardingProgressBar
          progress={onboardingProgress}
          isComplete={!isOnboarding && hasSeenOnboarding}
          selectedSection={viewingSection}
          onSelectSection={setViewingSection}
        />
      )}

      {/* ─── Main surface — two-panel always ─── */}
      <div className="flex-1 min-h-0 grid grid-cols-[360px_1fr] relative z-10">
        <LeftInfoPanel
          progress={onboardingProgress}
          isOnboarding={isOnboarding}
          isComplete={!isOnboarding && hasSeenOnboarding}
          messages={thread.messages}
          sessions={thread.sessions}
          currentSessionId={thread.sessionId}
          onNewChat={() => void thread.createSession()}
          onSwitch={(id) => void thread.switchSession(id)}
          onUploadClick={onShortcutUpload}
          onPasteUrl={onShortcutPasteUrl}
          isUploading={thread.isUploading}
        />
        {/* Right column — scroll fills the column, composer floats at bottom */}
        <div className="flex flex-col min-h-0 relative">
          {/* Section filter banner — shown when viewing a past section in isolation */}
          {viewingSection !== null && (
            <div className="shrink-0 z-20 px-4 pt-3">
              <div className="max-w-[780px] mx-auto flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-sm bg-brand-soft border-thin border-border-glow text-xs">
                  <span className="text-text-muted font-medium">Viewing section {viewingSection}:</span>
                  <span className="font-bold text-text-primary">
                    {ONBOARDING_SECTIONS[viewingSection - 1]?.title}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingSection(null)}
                  className="h-8 px-3 rounded-sm border-thin border-border-medium text-text-secondary text-xs font-bold hover:bg-glass-2 hover:text-text-primary transition-colors flex items-center gap-1.5 shrink-0"
                >
                  <X className="w-3 h-3" strokeWidth={2} />
                  Live view
                </button>
              </div>
            </div>
          )}
          <div ref={scrollRef} className="flex-1 overflow-y-auto">
            <Thread
              messages={visibleMessages}
              longRunningTool={viewingSection !== null ? null : thread.longRunningTool}
              onChip={onChip}
              cardActions={cardActions}
              endRef={endRef}
              wideLayout
            />
          </div>

          {/* Cost-limit banner — sits between scroll and composer, no hard bg */}
          {thread.costLimitError && (
            <div className="relative z-20 px-4 py-2">
              <div className="max-w-[780px] mx-auto flex items-start gap-2.5 rounded-card border-thin border-[rgba(244,63,94,0.25)] bg-[rgba(244,63,94,0.06)] px-3.5 py-3">
                <AlertCircle
                  className="w-4 h-4 mt-0.5 shrink-0"
                  strokeWidth={1.6}
                  style={{ color: '#F43F5E' }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-text-primary mb-1">Chat paused</div>
                  <div className="text-xs text-text-secondary leading-relaxed whitespace-pre-wrap">
                    {thread.costLimitError}
                  </div>
                  <div className="mt-2.5 flex gap-2">
                    <button
                      type="button"
                      onClick={() => thread.reset()}
                      className="h-7 px-2.5 rounded-sm border-thin border-border-medium text-text-secondary hover:text-text-primary hover:bg-glass-2 text-[11px] font-bold transition-colors"
                    >
                      Start a new chat
                    </button>
                    {thread.costLimitError.startsWith('Your tenant has reached its daily') && (
                      <button
                        type="button"
                        onClick={() => navigate('/dashboard/settings/billing')}
                        className="h-7 px-2.5 rounded-sm text-bg text-[11px] font-bold transition-all hover:brightness-110 flex items-center gap-1"
                        style={{ background: 'linear-gradient(135deg, #00FFAA 0%, #00B368 100%)' }}
                      >
                        Open billing <ArrowRight className="w-3 h-3" strokeWidth={2} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Floating composer — gradient fade above hides the scroll edge */}
          <div className="relative z-20 px-4 pb-4 pt-1">
            {/* Gradient that fades scroll content into the composer */}
            {!thread.costLimitError && (
              <div
                className="absolute -top-10 inset-x-0 h-10 pointer-events-none"
                style={{ background: 'linear-gradient(to bottom, transparent, #0D1410)' }}
              />
            )}
            <div className="max-w-[780px] mx-auto">
              {isRecording ? (
                <RecordingBar
                  seconds={recorder.duration}
                  onCancel={recorder.cancelRecording}
                  onStop={recorder.stopRecording}
                />
              ) : isTranscribing ? (
                <TranscribingBar />
              ) : (
                <>
                  {thread.isUploading && (
                    <div className="mb-2 flex items-center gap-2 rounded-sm border-thin border-border-subtle bg-glass-1 px-3 py-2 text-[11px] text-text-secondary">
                      <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" strokeWidth={1.8} />
                      <span>Reading your document — this can take 5 to 30 seconds.</span>
                    </div>
                  )}
                  {thread.uploadFlash && (
                    <div
                      className={
                        'mb-2 flex items-start gap-2 rounded-sm border-thin px-3 py-2 text-[11px] leading-relaxed ' +
                        (thread.uploadFlash.kind === 'error'
                          ? 'border-[rgba(244,63,94,0.35)] bg-[rgba(244,63,94,0.08)] text-text-primary'
                          : 'border-border-subtle bg-glass-1 text-text-secondary')
                      }
                    >
                      {thread.uploadFlash.kind === 'error' ? (
                        <AlertCircle
                          className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[#F43F5E]"
                          strokeWidth={1.8}
                        />
                      ) : (
                        <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" strokeWidth={1.8} />
                      )}
                      <span className="flex-1">{thread.uploadFlash.text}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 bg-bg-elevated border-thin border-border-subtle focus-within:border-border-glow rounded-xl px-3 py-2.5 transition-colors shadow-[0_0_0_1px_rgba(0,0,0,0.3),0_4px_24px_rgba(0,0,0,0.4)]">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={ACCELERATOR_ACCEPT}
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void thread.uploadDocument(file);
                        e.target.value = '';
                      }}
                    />
                    <button
                      type="button"
                      aria-label="Attach a PDF or DOCX about your business"
                      title="Attach a PDF or DOCX (max 10 MB)"
                      onClick={() => {
                        if (!thread.isUploading) fileInputRef.current?.click();
                      }}
                      disabled={thread.isUploading}
                      className="w-8 h-8 flex items-center justify-center rounded-sm text-text-muted hover:text-text-secondary hover:bg-glass-2 transition-colors shrink-0 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                    >
                      <Paperclip className="w-4 h-4" strokeWidth={1.6} />
                    </button>
                    {/* Ghost text composer — relative wrapper with mirror div overlay */}
                    <div className="relative flex-1 overflow-hidden" style={{ minHeight: 22 }}>
                      {/* Mirror div: typed text (invisible) + ghost text (muted), sitting behind the textarea */}
                      {ghostText && (
                        <div
                          aria-hidden="true"
                          className="absolute inset-0 text-sm font-mono leading-[22px] whitespace-pre-wrap break-words pointer-events-none select-none overflow-hidden"
                        >
                          {/* typed text — same color as normal so it stays visible */}
                          <span className="text-text-primary">{draft}</span>
                          {/* ghost suggestion — clearly visible but distinguished */}
                          <span style={{ color: 'rgba(160,160,160,0.75)' }}>{ghostText}</span>
                        </div>
                      )}
                      <textarea
                        value={draft}
                        onChange={(e) => {
                          const v = e.target.value;
                          setDraft(v);
                          if (ghostText) setGhostText(null);
                        }}
                        onKeyDown={onKey}
                        placeholder={
                          ghostText
                            ? undefined
                            : thread.isHydrating
                              ? 'Loading your last conversation…'
                              : thread.isUploading
                                ? 'Reading your document — please wait.'
                                : thread.costLimitError
                                  ? 'Chat paused — start a new chat to continue.'
                                  : 'Tell me about your business, paste a URL, anything…'
                        }
                        rows={1}
                        disabled={thread.isHydrating || thread.isUploading || !!thread.costLimitError}
                        className="w-full bg-transparent border-0 outline-none resize-none text-sm font-mono max-h-32 disabled:cursor-not-allowed leading-[22px] placeholder:text-text-muted"
                        style={{
                          minHeight: 22,
                          height: Math.min(128, Math.max(22, draft.split('\n').length * 22)),
                          // When ghost is showing: hide textarea text (mirror renders it) but keep caret visible
                          color: ghostText ? 'transparent' : undefined,
                          caretColor: '#e2e8f0',
                        }}
                      />
                    </div>
                    {draft.trim() ? (
                      <button
                        onClick={submit}
                        disabled={
                          thread.isSending ||
                          thread.isHydrating ||
                          thread.isUploading ||
                          isRateLimited ||
                          !!thread.costLimitError
                        }
                        aria-label="Send"
                        className="w-8 h-8 flex items-center justify-center rounded-sm text-bg disabled:bg-glass-2 disabled:text-text-muted disabled:cursor-not-allowed transition-all shrink-0 hover:brightness-110"
                        style={{
                          background:
                            !isRateLimited &&
                            !thread.isHydrating &&
                            !thread.isSending &&
                            !thread.isUploading &&
                            !thread.costLimitError
                              ? 'linear-gradient(135deg, #00FFAA 0%, #00B368 100%)'
                              : undefined,
                        }}
                      >
                        <Send className="w-3.5 h-3.5" strokeWidth={2} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={startRecording}
                        disabled={
                          thread.isHydrating ||
                          !!thread.costLimitError ||
                          isRateLimited ||
                          !recorder.isSupported
                        }
                        aria-label={recorder.error ? 'Microphone blocked' : 'Record voice message'}
                        title={recorder.error ?? 'Record voice message'}
                        className="w-8 h-8 flex items-center justify-center rounded-sm text-text-muted hover:text-brand hover:bg-brand-soft disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
                      >
                        {recorder.error ? (
                          <MicOff className="w-4 h-4" strokeWidth={1.8} />
                        ) : (
                          <Mic className="w-4 h-4" strokeWidth={1.8} />
                        )}
                      </button>
                    )}
                  </div>
                </>
              )}
              <p className="text-[10px] text-text-muted text-center mt-2">
                {isRateLimited
                  ? `Too many messages — try again in ${rateLimitSecondsLeft}s.`
                  : isRecording
                    ? 'Tap the square to send, or × to cancel.'
                    : isTranscribing
                      ? 'Converting your voice to text…'
                      : 'Lead360 deploys to WhatsApp · Messenger · Instagram · SMS · Web chat'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    // </div>
  );
}

/* ─── Recording bar ────────────────────────────────────────────────────
   Full-width replacement for the composer row while the user is dictating.
   Left: pulsing red dot + mono timer. Right: cancel (×) and stop (■).
   ──────────────────────────────────────────────────────────────────── */
function RecordingBar({
  seconds,
  onCancel,
  onStop,
}: {
  seconds: number;
  onCancel: () => void;
  onStop: () => void;
}) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const timer = `${mins}:${secs.toString().padStart(2, '0')}`;
  return (
    <div className="flex items-center gap-3 bg-bg-input border-thin border-[rgba(244,63,94,0.25)] rounded-card px-3.5 py-2.5">
      <span className="relative flex h-2 w-2 shrink-0">
        <span
          className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
          style={{ background: '#F43F5E' }}
        />
        <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: '#F43F5E' }} />
      </span>
      <span className="text-xs font-bold font-mono tabular-nums" style={{ color: '#F43F5E' }}>
        {timer}
      </span>
      <span className="flex-1 text-xs text-text-secondary truncate">Listening…</span>
      <button
        type="button"
        onClick={onCancel}
        aria-label="Cancel recording"
        className="w-8 h-8 flex items-center justify-center rounded-sm text-text-muted hover:text-text-primary hover:bg-glass-2 transition-colors shrink-0"
      >
        <X className="w-4 h-4" strokeWidth={1.8} />
      </button>
      <button
        type="button"
        onClick={onStop}
        aria-label="Stop and send"
        className="w-8 h-8 flex items-center justify-center rounded-sm text-bg hover:brightness-110 transition-all shrink-0"
        style={{ background: '#F43F5E' }}
      >
        <Square className="w-3 h-3" strokeWidth={2.2} fill="currentColor" />
      </button>
    </div>
  );
}

/* ─── Transcribing bar ────────────────────────────────────────────── */
function TranscribingBar() {
  return (
    <div className="flex items-center gap-3 bg-bg-input border-thin border-border-subtle rounded-card px-3.5 py-2.5">
      <Loader2 className="w-4 h-4 text-brand animate-spin shrink-0" strokeWidth={1.8} />
      <span className="text-sm text-text-secondary">Transcribing your message…</span>
    </div>
  );
}

/* ─── Ambient orbs backdrop ───────────────────────────────────────── */
function AmbientOrbs() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      <div
        className="absolute"
        style={{
          width: 640,
          height: 640,
          top: -180,
          left: '40%',
          background: 'radial-gradient(circle, rgba(0,255,170,0.10) 0%, transparent 65%)',
          filter: 'blur(60px)',
        }}
      />
      <div
        className="absolute"
        style={{
          width: 560,
          height: 560,
          top: '30%',
          left: -180,
          background: 'radial-gradient(circle, rgba(0,217,126,0.05) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />
      <div
        className="absolute"
        style={{
          width: 480,
          height: 480,
          bottom: -120,
          right: '15%',
          background: 'radial-gradient(circle, rgba(0,179,104,0.09) 0%, transparent 65%)',
          filter: 'blur(70px)',
        }}
      />
    </div>
  );
}

/* ─── Session dropdown (top-right) ──────────────────────────────────────
   Always visible (both onboarding and builder mode). During onboarding the
   left panel surfaces only the top 3 recent chats — this dropdown is the
   way to reach everything older.
   ──────────────────────────────────────────────────────────────────── */
function SessionDropdown({
  sessions,
  currentSessionId,
  onNewChat,
  onSwitch,
}: {
  sessions: ChatSessionDto[];
  currentSessionId: string | null;
  onNewChat: () => void;
  onSwitch: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const current = sessions.find((s) => s.id === currentSessionId);
  const label = current?.title?.trim() || 'New chat';
  const recent = sessions.slice(0, 10);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="h-8 pl-3 pr-2 rounded-sm border-thin border-border-medium bg-bg-shell/80 backdrop-blur-sm text-text-secondary hover:text-text-primary hover:bg-glass-2 hover:border-border-glow text-[11px] font-bold transition-colors flex items-center gap-1.5 max-w-[220px]"
      >
        <span className="truncate">{label}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          strokeWidth={1.8}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-1.5 w-72 rounded-card border-thin border-border-medium bg-bg-elevated overflow-hidden"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onNewChat();
            }}
            className="w-full px-3.5 py-2.5 flex items-center gap-2 text-[12px] font-bold text-text-primary hover:bg-glass-2 transition-colors border-b border-thin border-border-subtle"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2} />
            New chat
          </button>

          {recent.length === 0 ? (
            <div className="px-3.5 py-3 text-[11px] text-text-muted">No previous chats yet.</div>
          ) : (
            <div className="max-h-[320px] overflow-y-auto">
              {recent.map((s) => {
                const isCurrent = s.id === currentSessionId;
                const title = s.title?.trim() || 'Untitled chat';
                return (
                  <button
                    key={s.id}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setOpen(false);
                      if (!isCurrent) onSwitch(s.id);
                    }}
                    className={`w-full px-3.5 py-2.5 flex items-center gap-2 text-[11px] text-left transition-colors ${
                      isCurrent
                        ? 'bg-glass-1 text-text-primary cursor-default'
                        : 'text-text-secondary hover:text-text-primary hover:bg-glass-2'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5 shrink-0" strokeWidth={1.6} />
                    <span className="truncate flex-1 font-medium">{title}</span>
                    <span className="text-[10px] text-text-muted shrink-0">
                      {formatRelative(s.lastActivityAt ?? s.createdAt)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Tiny relative-time formatter. Used by the dropdown, recent-chats list,
// and auto-saved footer. Ranges chosen to read naturally on one line.
function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const d = Math.floor(hr / 24);
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

/* ─── Undo button (direct endpoint, spec §9) ────────────────────── */
function UndoButton({
  onUndo,
}: {
  onUndo: () => Promise<{ undone: boolean; summary: string | null } | null>;
}) {
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  const click = async () => {
    if (busy) return;
    setBusy(true);
    setFlash(null);
    try {
      const result = await onUndo();
      if (!result) {
        setFlash('Undo failed. Try again.');
      } else {
        setFlash(result.summary ?? (result.undone ? 'Undone.' : 'Nothing to undo.'));
      }
    } finally {
      setBusy(false);
      setTimeout(() => setFlash(null), 4000);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => void click()}
        disabled={busy}
        aria-label="Undo last change"
        title="Undo last change"
        className="h-8 px-2.5 rounded-sm border-thin border-border-medium bg-bg-shell/80 backdrop-blur-sm text-text-secondary hover:text-text-primary hover:bg-glass-2 hover:border-border-glow text-[11px] font-bold transition-colors flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {busy ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={1.8} />
        ) : (
          <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.8} />
        )}
        Undo
      </button>
      {flash && (
        <div className="absolute right-0 top-full mt-1.5 w-64 rounded-sm border-thin border-border-medium bg-bg-elevated px-3 py-2 text-[11px] text-text-secondary leading-snug">
          {flash}
        </div>
      )}
    </div>
  );
}

/* ─── Onboarding progress bar (spec §7) ─────────────────────────────
   Full-width step cards connected by a progress line. Done sections =
   green check + full green line, active = brand highlight + 30% brand
   line, upcoming = dim opacity-40. Format the user picked — do not swap
   back to a thin 8-segment bar. Earlier iterations did and got reverted.
   ──────────────────────────────────────────────────────────────────── */
function OnboardingProgressBar({
  progress,
  isComplete = false,
  selectedSection,
  onSelectSection,
}: {
  progress: OnboardingProgress;
  isComplete?: boolean;
  selectedSection: number | null;
  onSelectSection: (n: number | null) => void;
}) {
  // When isComplete (mode flipped to Builder after all sections done), use n=9
  // so every section satisfies isDone = s.n < n and shows a green check.
  const n = isComplete ? 9 : Math.max(1, Math.min(8, progress.currentSection));
  return (
    <div className="relative z-20 border-b border-border-medium bg-bg-elevated px-4 md:px-6 py-4">
      <div className="flex items-center">
        {ONBOARDING_SECTIONS.map((s, i) => {
          const isDone = s.n < n;
          const isActive = s.n === n && !isComplete;
          const isSelected = selectedSection === s.n;
          const isClickable = isDone || isComplete;
          return (
            <Fragment key={s.n}>
              <button
                type="button"
                disabled={!isClickable}
                onClick={() => isClickable && onSelectSection(isSelected ? null : s.n)}
                title={isClickable ? `View ${s.title}` : s.title}
                className={
                  'relative px-3 py-2.5 rounded-card overflow-hidden transition-all duration-200 shrink-0 w-[calc((100%-7*8px)/8)] text-left ' +
                  (isSelected
                    ? 'bg-brand-soft border border-brand ring-1 ring-brand/20'
                    : isDone || isComplete
                      ? 'bg-glass-2 border border-[rgba(6,214,160,0.2)] hover:bg-brand-soft hover:border-brand cursor-pointer'
                      : isActive
                        ? 'bg-brand-soft border border-brand cursor-default'
                        : 'bg-glass-1 border border-border-subtle opacity-60 cursor-default')
                }
              >
                <div
                  className={
                    'w-6 h-6 rounded-xs flex items-center justify-center text-xs font-extrabold mb-1.5 ' +
                    (isDone || isComplete
                      ? 'bg-[rgba(6,214,160,0.15)] text-success'
                      : isActive
                        ? 'bg-brand text-bg'
                        : 'bg-glass-2 text-text-muted')
                  }
                >
                  {isDone || isComplete ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : s.n}
                </div>
                <div className="text-xs font-bold text-text-primary leading-tight truncate">{s.title}</div>
                <div className="text-[10px] text-text-muted leading-tight truncate mt-0.5">{s.subtitle}</div>
                <div
                  className={
                    'absolute bottom-0 left-0 h-[2px] transition-all duration-500 ' +
                    (isSelected
                      ? 'bg-brand w-full'
                      : isDone || isComplete
                        ? 'bg-success w-full'
                        : isActive
                          ? 'bg-brand w-[40%]'
                          : 'bg-transparent w-0')
                  }
                />
              </button>
              {i < ONBOARDING_SECTIONS.length - 1 && (
                <div
                  className={
                    'flex-1 h-px mx-0.5 transition-colors duration-300 ' +
                    (isDone || isComplete ? 'bg-success' : 'bg-border-medium')
                  }
                />
              )}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Left info panel (onboarding-only)
   Stack: header → live bot preview → up next → shortcuts → recent chats
   → auto-saved footer. Auto-saved is the only sticky element; everything
   above scrolls together if the panel exceeds viewport height. This avoids
   the previous problem of nested scrolling competing with the chat thread.
   ═══════════════════════════════════════════════════════════════════════ */

/* ─── Bot fact extraction ───────────────────────────────────────────
   Pulls structured facts about the user's business from the message
   thread. Source priority:
     1. WebsiteExtractionDrafts / DocumentExtractionDrafts inline cards
        (most authoritative — LLM-extracted from a real source)
     2. Session title (set on creation from the first user message)
        sources panel below.
   ──────────────────────────────────────────────────────────────────── */
type SourceItem =
  | (WebsiteExtractionDraftsCard & { kind: 'website'; label: string; subtitle: string })
  | (DocumentExtractionDraftsCard & { kind: 'document'; label: string; subtitle: string });

function extractSources(messages: ChatMessageDto[]): SourceItem[] {
  const seen = new Set<string>();
  const sources: SourceItem[] = [];
  for (const msg of messages) {
    const card = parseInlineCard(msg);
    if (!card) continue;
    if (card.type === 'WebsiteExtractionDrafts') {
      const c = card as unknown as WebsiteExtractionDraftsCard;
      if (seen.has(c.ingestionId)) continue;
      seen.add(c.ingestionId);
      let label = c.url;
      try { label = new URL(c.url).hostname.replace(/^www\./, ''); } catch { /* noop */ }
      const parts = [`${c.pagesFetched} page${c.pagesFetched !== 1 ? 's' : ''}`];
      if (c.productCount) parts.push(`${c.productCount} products`);
      if (c.topicCount) parts.push(`${c.topicCount} topics`);
      sources.push({ ...c, kind: 'website', label, subtitle: parts.join(' · ') });
    } else if (card.type === 'DocumentExtractionDrafts') {
      const c = card as unknown as DocumentExtractionDraftsCard;
      if (seen.has(c.ingestionId)) continue;
      seen.add(c.ingestionId);
      const parts = [`${c.pagesParsed} page${c.pagesParsed !== 1 ? 's' : ''}`];
      if (c.productCount) parts.push(`${c.productCount} products`);
      if (c.topicCount) parts.push(`${c.topicCount} topics`);
      sources.push({ ...c, kind: 'document', label: c.fileName, subtitle: parts.join(' · ') });
    }
  }
  return sources;
}

/* ─── Source row ────────────────────────────────────────────────── */
function SourceRow({ source, onPreview }: { source: SourceItem; onPreview: () => void }) {
  return (
    <button
      type="button"
      onClick={onPreview}
      className="w-full flex items-center gap-2.5 px-2 py-2 rounded-sm hover:bg-glass-2 transition-colors group text-left"
    >
      <div className="w-7 h-7 rounded-xs bg-glass-2 border-thin border-border-subtle flex items-center justify-center shrink-0 group-hover:border-border-glow transition-colors">
        {source.kind === 'website' ? (
          <Globe className="w-3.5 h-3.5 text-brand" strokeWidth={1.6} />
        ) : (
          <FileText className="w-3.5 h-3.5 text-brand" strokeWidth={1.6} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-text-primary truncate">{source.label}</div>
        <div className="text-[11px] text-text-muted">{source.subtitle}</div>
      </div>
      <ChevronRight
        className="w-3.5 h-3.5 text-text-muted shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        strokeWidth={1.6}
      />
    </button>
  );
}

/* ─── Source preview (inline detail view) ───────────────────────── */
function SourcePreview({ source, onBack }: { source: SourceItem; onBack: () => void }) {
  const isDoc = source.kind === 'document';
  const pageCount = isDoc
    ? (source as DocumentExtractionDraftsCard).pagesParsed
    : (source as WebsiteExtractionDraftsCard).pagesFetched;

  return (
    <div className="flex flex-col">
      {/* Back header */}
      <div className="px-3 py-2.5 flex items-center gap-2 border-b border-thin border-border-subtle">
        <button
          type="button"
          onClick={onBack}
          className="w-6 h-6 flex items-center justify-center rounded-xs hover:bg-glass-2 transition-colors text-text-muted hover:text-text-primary shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.6} />
        </button>
        <span className="flex-1 text-xs font-bold text-text-primary truncate min-w-0">{source.label}</span>
        {!isDoc && (
          <a
            href={(source as WebsiteExtractionDraftsCard).url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-6 h-6 flex items-center justify-center rounded-xs hover:bg-glass-2 transition-colors text-text-muted hover:text-text-primary shrink-0"
          >
            <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.6} />
          </a>
        )}
      </div>

      {/* Body */}
      <div className="px-3 py-3 flex flex-col gap-3">
        {/* Meta badges */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs bg-glass-2 border-thin border-border-subtle text-[11px] text-text-secondary font-medium">
            {isDoc ? (
              <>
                <FileText className="w-3 h-3" strokeWidth={1.6} />
                {(source as DocumentExtractionDraftsCard).format.toUpperCase()}
              </>
            ) : (
              <>
                <Globe className="w-3 h-3" strokeWidth={1.6} />
                Website
              </>
            )}
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-xs bg-glass-2 border-thin border-border-subtle text-[11px] text-text-secondary font-medium">
            {pageCount} page{pageCount !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Extracted business info */}
        {source.business && (source.business.name || source.business.description || source.business.type) && (
          <div className="bg-glass-1 border-thin border-border-subtle rounded-card p-3 flex flex-col gap-2.5">
            <div className="text-[10px] font-bold text-text-muted uppercase tracking-[1.2px]">Extracted</div>
            {source.business.name && (
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-text-muted">Business</span>
                <span className="text-xs font-semibold text-text-primary">{source.business.name}</span>
              </div>
            )}
            {source.business.type && (
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-text-muted">Type</span>
                <span className="text-xs font-semibold text-text-primary">{source.business.type}</span>
              </div>
            )}
            {source.business.description && (
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-text-muted">Description</span>
                <span className="text-[11px] text-text-secondary leading-relaxed">{source.business.description}</span>
              </div>
            )}
          </div>
        )}

        {/* Hours & Policies */}
        {(source.hours || source.policies) && (
          <div className="bg-glass-1 border-thin border-border-subtle rounded-card p-3 flex flex-col gap-2.5">
            {source.hours && (
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-text-muted">Hours</span>
                <span className="text-[11px] text-text-secondary leading-relaxed">{source.hours}</span>
              </div>
            )}
            {source.policies && (
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-text-muted">Policies</span>
                <span className="text-[11px] text-text-secondary leading-relaxed">{source.policies}</span>
              </div>
            )}
          </div>
        )}

        {/* Content counts */}
        {(source.productCount > 0 || source.topicCount > 0) && (
          <div className="bg-glass-1 border-thin border-border-subtle rounded-card p-3 flex gap-4">
            {source.productCount > 0 && (
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-text-muted">Products</span>
                <span className="text-sm font-bold text-text-primary tabular-nums">{source.productCount}</span>
              </div>
            )}
            {source.topicCount > 0 && (
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-text-muted">Topics</span>
                <span className="text-sm font-bold text-text-primary tabular-nums">{source.topicCount}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Sources panel ─────────────────────────────────────────────────
   NotebookLM-style source list. Empty state shows two CTA buttons.
   Clicking a row drills into an inline preview with extracted facts.
   ──────────────────────────────────────────────────────────────────── */
function SourcesPanel({
  sources,
  onUploadClick,
  onPasteUrl,
  isUploading,
}: {
  sources: SourceItem[];
  onUploadClick: () => void;
  onPasteUrl: () => void;
  isUploading: boolean;
}) {
  const [preview, setPreview] = useState<SourceItem | null>(null);

  return (
    <div className="border-b border-thin border-border-subtle">
      {/* Section header — always visible */}
      <div className="px-4 pt-3.5 pb-2 flex items-center justify-between">
        <div className="text-[11px] font-bold text-text-muted uppercase tracking-[1.5px]">
          Sources{sources.length > 0 && <span className="ml-1.5 text-text-muted font-normal normal-case tracking-normal">({sources.length})</span>}
        </div>
        {!preview && (
          <div className="flex gap-0.5">
            <button
              type="button"
              onClick={onUploadClick}
              disabled={isUploading}
              title="Upload PDF or DOCX"
              className="w-6 h-6 flex items-center justify-center rounded-xs text-text-muted hover:text-text-primary hover:bg-glass-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Paperclip className="w-3.5 h-3.5" strokeWidth={1.6} />
            </button>
            <button
              type="button"
              onClick={onPasteUrl}
              title="Add website URL"
              className="w-6 h-6 flex items-center justify-center rounded-xs text-text-muted hover:text-text-primary hover:bg-glass-2 transition-colors"
            >
              <Globe className="w-3.5 h-3.5" strokeWidth={1.6} />
            </button>
          </div>
        )}
      </div>

      {/* Preview drill-down */}
      {preview && <SourcePreview source={preview} onBack={() => setPreview(null)} />}

      {/* List / empty state */}
      {!preview && (
        <div className="pb-2">
          {sources.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-4 py-5 text-center">
              <div className="w-10 h-10 rounded-card bg-glass-2 border-thin border-border-subtle flex items-center justify-center">
                <FileText className="w-4 h-4 text-text-muted" strokeWidth={1.6} />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-semibold text-text-secondary">No sources yet</span>
                <span className="text-[11px] text-text-muted leading-relaxed">
                  Upload a PDF/DOCX or paste a website URL to extract info automatically
                </span>
              </div>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={onUploadClick}
                  disabled={isUploading}
                  className="flex items-center gap-1 h-7 px-2.5 rounded-xs border-thin border-border-medium text-[11px] font-bold text-text-secondary hover:text-text-primary hover:bg-glass-2 hover:border-border-glow transition-colors disabled:opacity-40"
                >
                  <Paperclip className="w-3 h-3" strokeWidth={1.6} />
                  Upload
                </button>
                <button
                  type="button"
                  onClick={onPasteUrl}
                  className="flex items-center gap-1 h-7 px-2.5 rounded-xs border-thin border-border-medium text-[11px] font-bold text-text-secondary hover:text-text-primary hover:bg-glass-2 hover:border-border-glow transition-colors"
                >
                  <Globe className="w-3 h-3" strokeWidth={1.6} />
                  Website
                </button>
              </div>
            </div>
          ) : (
            <div className="px-2 flex flex-col gap-0.5">
              {sources.map((s) => (
                <SourceRow key={s.ingestionId} source={s} onPreview={() => setPreview(s)} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Recent Chats (capped at 3) ───────────────────────────────────
   Top 3 most-recent sessions plus a "+ New chat" footer row. If the
   user has more than 3 sessions, the header shows "3 of N" and they
   reach the rest via the top-right SessionDropdown. This avoids two
   nested scrolling lists competing with the chat thread.
   ──────────────────────────────────────────────────────────────────── */
function RecentChatsList({
  sessions,
  currentSessionId,
  onSwitch,
  onNewChat,
  hasProgress,
}: {
  sessions: ChatSessionDto[];
  currentSessionId: string | null;
  onSwitch: (id: string) => void;
  onNewChat: () => void;
  hasProgress: boolean;
}) {
  const top = sessions.slice(0, 3);
  const totalCount = sessions.length;

  return (
    <div className="px-4 py-3 flex flex-col gap-1.5 border-t border-thin border-border-subtle shrink-0">
      <div className="flex items-center justify-between px-0.5 mb-0.5">
        <span className="text-[11px] font-bold text-text-muted uppercase tracking-[1.5px]">Recent chats</span>
        {totalCount > 3 && (
          <span className="text-[11px] text-text-muted font-medium">
            {top.length} of {totalCount}
          </span>
        )}
      </div>

      {top.map((s) => {
        const isCurrent = s.id === currentSessionId;
        const title = s.title?.trim() || 'Untitled';
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => !isCurrent && onSwitch(s.id)}
            className={
              'flex items-center gap-2 px-2 py-1.5 rounded-sm text-left transition-colors border-l-2 ' +
              (isCurrent
                ? 'bg-brand-soft border-brand cursor-default'
                : 'border-transparent hover:bg-glass-2')
            }
          >
            <span
              className={
                'w-1.5 h-1.5 rounded-full shrink-0 ' + (isCurrent ? 'bg-brand-light' : 'bg-text-muted')
              }
            />
            <span
              className={
                'flex-1 truncate text-xs font-medium ' +
                (isCurrent ? 'text-text-primary' : 'text-text-secondary')
              }
            >
              {title}
            </span>
            <span className="text-[11px] text-text-muted shrink-0">
              {formatRelative(s.lastActivityAt ?? s.createdAt)}
            </span>
          </button>
        );
      })}

      <NewChatButton onNewChat={onNewChat} isOnboarding hasProgress={hasProgress} />
    </div>
  );
}

/* ─── New chat button with onboarding warning ───────────────────────
   During onboarding, creating a new chat means losing interview
   progress and starting from Section 1 again. We show a 2-step
   confirmation so they don't do that accidentally. When `hasProgress`
   is false (brand new session, no user messages) there's nothing to
   warn about, so the button is single-click.
   ──────────────────────────────────────────────────────────────────── */
function NewChatButton({
  onNewChat,
  isOnboarding,
  hasProgress,
}: {
  onNewChat: () => void;
  isOnboarding: boolean;
  hasProgress: boolean;
}) {
  const [confirming, setConfirming] = useState(false);

  if (!isOnboarding || !hasProgress) {
    return (
      <button
        type="button"
        onClick={onNewChat}
        className="flex items-center justify-center gap-1.5 mt-1 py-1.5 rounded-sm border-thin border-dashed border-border-medium text-text-secondary text-[10px] font-bold hover:bg-glass-2 hover:text-text-primary hover:border-border-glow transition-colors"
      >
        <Plus className="w-3 h-3" strokeWidth={2} />
        New chat
      </button>
    );
  }

  if (confirming) {
    return (
      <div className="rounded-sm border-thin border-[rgba(244,63,94,0.25)] bg-[rgba(244,63,94,0.06)] px-2.5 py-2 flex flex-col gap-2 mt-1">
        <div className="text-[10.5px] text-text-primary font-bold leading-snug">
          This will restart your setup from Section 1 — your progress in this chat will be lost.
        </div>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => {
              setConfirming(false);
              onNewChat();
            }}
            className="flex-1 h-7 rounded-xs border-thin border-[rgba(244,63,94,0.35)] text-[10.5px] font-bold text-[#F43F5E] hover:bg-[rgba(244,63,94,0.1)] transition-colors"
          >
            Restart anyway
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="flex-1 h-7 rounded-xs border-thin border-border-medium text-[10.5px] font-bold text-text-secondary hover:bg-glass-2 transition-colors"
          >
            Keep going
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="flex items-center justify-center gap-1.5 mt-1 py-1.5 rounded-sm border-thin border-dashed border-border-medium text-text-secondary text-[10px] font-bold hover:bg-glass-2 hover:text-text-primary hover:border-border-glow transition-colors"
    >
      <Plus className="w-3 h-3" strokeWidth={2} />
      New chat
    </button>
  );
}

/* ─── Auto-saved footer ─────────────────────────────────────────────
   Sticky bottom strip. Shows the green dot + "Auto-saved" plus the
   relative time of the last message (which is when the backend last
   persisted state). Reassures users that progress is safe even if they
   close the tab. Stays out of the scroll context above so it's always
   visible.
   ──────────────────────────────────────────────────────────────────── */
function AutoSavedFooter({ messages }: { messages: ChatMessageDto[] }) {
  const lastSavedAt = messages[messages.length - 1]?.createdAt;
  return (
    <div className="border-t border-thin border-border-subtle px-4 py-2.5 flex items-center gap-1.5 shrink-0">
      <span className="w-1.5 h-1.5 rounded-full bg-brand shrink-0" />
      <span className="text-xs text-text-secondary">Auto-saved</span>
      {lastSavedAt && (
        <span className="text-[11px] text-text-muted ml-auto">{formatRelative(lastSavedAt)}</span>
      )}
    </div>
  );
}

/* ─── LeftInfoPanel ─────────────────────────────────────────────────
   Composes the five sections + sticky footer. The outer flex column
   makes the auto-saved footer always visible; the inner div is the
   scroll container that everything else stacks inside. If content fits
   the viewport, no scrollbar appears. If it doesn't, only the panel
   scrolls — never nested with the chat thread on the right.
   ──────────────────────────────────────────────────────────────────── */
function LeftInfoPanel({
  progress,
  isOnboarding,
  isComplete,
  messages,
  sessions,
  currentSessionId,
  onNewChat,
  onSwitch,
  onUploadClick,
  onPasteUrl,
  isUploading,
}: {
  progress: OnboardingProgress | null;
  isOnboarding: boolean;
  isComplete: boolean;
  messages: ChatMessageDto[];
  sessions: ChatSessionDto[];
  currentSessionId: string | null;
  onNewChat: () => void;
  onSwitch: (id: string) => void;
  onUploadClick: () => void;
  onPasteUrl: () => void;
  isUploading: boolean;
}) {
  const sectionN = progress?.currentSection ?? 1;
  const answered = progress?.total ? progress.answered : 0;
  const total = progress?.total || null;

  const sources = useMemo(() => extractSources(messages), [messages]);
  const hasProgress = messages.some((m) => m.role === ChatMessageRole.User);
  const activeSection = ONBOARDING_SECTIONS[Math.max(0, Math.min(7, sectionN - 1))];

  return (
    <div className="bg-bg-shell border-r border-thin border-border-subtle flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto min-h-0">
        {/* Active-section header — compact strip with live progress bar */}
        {(isOnboarding || isComplete) && (
          <div className="px-4 py-3.5 border-b border-thin border-border-subtle">
            {isComplete ? (
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-brand shrink-0" strokeWidth={2.5} />
                <span className="text-sm font-bold text-brand">Setup complete!</span>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-light animate-pulse" />
                  <span className="text-[10px] font-bold text-brand uppercase tracking-[1.5px]">
                    Section {sectionN} of 8 · in progress
                  </span>
                </div>
                <div className="text-sm font-bold text-text-primary leading-tight">{activeSection.title}</div>
                <div className="text-xs text-text-secondary leading-relaxed mt-0.5">
                  {activeSection.subtitle}
                </div>
                {total !== null && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1 rounded-xs bg-glass-2 overflow-hidden">
                      <div
                        className="h-full bg-brand transition-all duration-500"
                        style={{ width: `${Math.min(100, (answered / Math.max(1, total)) * 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-text-muted font-bold tabular-nums">
                      {answered}/{total}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        <SourcesPanel
          sources={sources}
          onUploadClick={onUploadClick}
          onPasteUrl={onPasteUrl}
          isUploading={isUploading}
        />
      </div>

      <RecentChatsList
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSwitch={onSwitch}
        onNewChat={onNewChat}
        hasProgress={hasProgress}
      />
      <AutoSavedFooter messages={messages} />
    </div>
  );
}

const FIRST_MESSAGE_CHIPS: ReadonlyArray<{
  label: string;
  fill: string;
  Icon: typeof Globe;
}> = [
  { label: 'I have a website', fill: "Here's my website: ", Icon: Globe },
  { label: 'I have an API', fill: "Here's my Swagger URL: ", Icon: Code2 },
  { label: "I'll describe it", fill: '', Icon: MessageSquare },
  { label: 'From Shopify', fill: 'I sell on Shopify. Store URL: ', Icon: ShoppingBag },
];

/* ─── Thread ──────────────────────────────────────────────────────── */
function Thread({
  messages,
  longRunningTool,
  onChip,
  cardActions,
  endRef,
  wideLayout = false,
}: {
  messages: ChatMessageDto[];
  longRunningTool: { name: string; label: string; stage?: string } | null;
  onChip: (text: string) => void;
  cardActions: CardActions;
  endRef: React.RefObject<HTMLDivElement | null>;
  wideLayout?: boolean;
}) {
  const isEmpty = messages.length === 0;

  // A card is "consumed" (locked, non-interactive) once the user has sent
  // any message after it. Walk backwards: the moment we see a user message,
  // all prior assistant cards are locked.
  const consumedIds = useMemo(() => {
    const s = new Set<string>();
    let seenUser = false;
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.role === ChatMessageRole.User) {
        seenUser = true;
      } else if (seenUser && m.role === ChatMessageRole.Assistant && m.inlineCardJson) {
        s.add(m.id);
      }
    }
    return s;
  }, [messages]);

  if (wideLayout) {
    return (
      <div className="px-4 pb-16 pt-4 relative">
        <div className="max-w-[780px] mx-auto">
          {isEmpty && <EmptyChatHints onChip={onChip} />}
          {messages.map((m) => {
            if (m.role === ChatMessageRole.User) return <DocUserBlock key={m.id} msg={m} />;
            if (m.role === ChatMessageRole.System) return <SystemRow key={m.id} msg={m} cardActions={cardActions} />;
            return (
              <DocAssistantBlock
                key={m.id}
                msg={m}
                cardActions={cardActions}
                consumed={consumedIds.has(m.id)}
                hideIfEmpty={!!longRunningTool}
              />
            );
          })}
          {longRunningTool && <DocLongRunningLine label={longRunningTool.label} stage={longRunningTool.stage} />}
          <div ref={endRef} />
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-6 pb-8 pt-2">
      <div className="max-w-2xl mx-auto flex flex-col gap-4">
        {isEmpty && <EmptyChatHints onChip={onChip} />}
        {messages.map((m) => {
          if (m.role === ChatMessageRole.User) return <UserBubble key={m.id} msg={m} />;
          if (m.role === ChatMessageRole.System) return <SystemRow key={m.id} msg={m} cardActions={cardActions} />;
          return (
            <AssistantBubble
              key={m.id}
              msg={m}
              cardActions={cardActions}
              consumed={consumedIds.has(m.id)}
              hideIfEmpty={!!longRunningTool}
            />
          );
        })}
        {longRunningTool && <LongRunningLine label={longRunningTool.label} stage={longRunningTool.stage} />}
        <div ref={endRef} />
      </div>
    </div>
  );
}

/* ─── Doc-style message blocks (onboarding wide layout) ─────────── */

function DocUserBlock({ msg }: { msg: ChatMessageDto }) {
  return (
    <div data-msg-id={msg.id} className="flex items-start gap-3.5 pt-5 pb-1 justify-end">
      <div className="flex flex-col items-end min-w-0 max-w-[85%]">
        <div className="text-[10.5px] font-bold text-text-muted uppercase tracking-[1.5px] mb-2">You</div>
        <div className="bg-brand-soft border-thin border-border-glow rounded-card px-4 py-3 text-[15px] leading-[1.75] text-text-primary whitespace-pre-wrap">
          {msg.content}
        </div>
      </div>
      <div className="w-7 h-7 rounded-full bg-glass-2 border-thin border-border-medium flex items-center justify-center shrink-0 mt-0.5">
        <span className="text-[10px] font-black text-text-muted select-none">U</span>
      </div>
    </div>
  );
}

function DocAssistantBlock({
  msg,
  cardActions,
  consumed = false,
  hideIfEmpty = false,
}: {
  msg: ChatMessageDto;
  cardActions: CardActions;
  consumed?: boolean;
  hideIfEmpty?: boolean;
}) {
  const isStreamingEmpty = !msg.content;
  const card = parseInlineCard(msg);
  if (isStreamingEmpty && !card && hideIfEmpty) return null;

  return (
    <div className="flex items-start gap-3.5 pt-5 pb-1">
      <div
        className="w-7 h-7 rounded-sm flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: 'linear-gradient(135deg, #00FFAA 0%, #00B368 100%)' }}
      >
        <Sparkles className="w-3.5 h-3.5" strokeWidth={2} style={{ color: '#0A0F0D' }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10.5px] font-bold text-text-muted uppercase tracking-[1.5px] mb-2">
          Lead360
        </div>
        {isStreamingEmpty && !card ? (
          <div className="flex items-center gap-1.5 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-pulse" />
            <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-pulse [animation-delay:150ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-pulse [animation-delay:300ms]" />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {(() => {
              const stripped = stripProgressLine(msg.content ?? '');
              return stripped ? (
                <div className="text-[15px] leading-[1.85] text-text-primary whitespace-pre-wrap">
                  {stripped}
                </div>
              ) : null;
            })()}
            {card && <InlineCardRenderer card={card} actions={cardActions} consumed={consumed} />}
          </div>
        )}
      </div>
    </div>
  );
}

function DocLongRunningLine({ label, stage }: { label: string; stage?: string }) {
  return (
    <div className="flex items-start gap-3.5 pt-5 pb-1">
      <div
        className="w-7 h-7 rounded-sm flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: 'linear-gradient(135deg, #00FFAA 0%, #00B368 100%)' }}
      >
        <Sparkles className="w-3.5 h-3.5" strokeWidth={2} style={{ color: '#0A0F0D' }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10.5px] font-bold text-text-muted uppercase tracking-[1.5px] mb-2">
          Lead360
        </div>
        <WebsiteProgress label={label} stage={stage} />
      </div>
    </div>
  );
}

function EmptyChatHints({ onChip }: { onChip: (text: string) => void }) {
  return (
    <div className="pt-8 pb-4 flex flex-col items-center text-center">
      {/* Welcome mark */}
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
        style={{ background: 'linear-gradient(135deg, #00FFAA 0%, #00B368 100%)' }}
      >
        <Sparkles className="w-5 h-5" strokeWidth={2} style={{ color: '#0A0F0D' }} />
      </div>

      <h2 className="text-xl font-extrabold text-text-primary mb-1.5 leading-tight">
        Let's build your chatbot
      </h2>
      <p className="text-sm text-text-secondary max-w-xs leading-relaxed mb-7">
        Tell me about your business and I'll set everything up — ready to deploy in minutes.
      </p>

      {/* Quick-start chips */}
      <div className="text-[10px] text-text-muted uppercase tracking-[2px] mb-2.5 font-bold">
        — quick start —
      </div>
      <div className="flex flex-wrap justify-center gap-1.5">
        {FIRST_MESSAGE_CHIPS.map((c) => (
          <button
            key={c.label}
            type="button"
            onClick={() => onChip(c.fill)}
            className="h-8 px-3 rounded-sm bg-glass-1 border-thin border-border-subtle text-text-secondary text-xs font-bold flex items-center gap-1.5 transition-colors hover:bg-brand-soft hover:border-border-glow hover:text-text-primary"
          >
            <c.Icon className="w-3.5 h-3.5" strokeWidth={1.6} />
            {c.label}
          </button>
        ))}
      </div>
      <p className="text-[11px] text-text-muted mt-3">Tap a shortcut, or just type below.</p>
    </div>
  );
}

function BotAvatar() {
  return (
    <div
      className="w-7 h-7 rounded-sm flex items-center justify-center shrink-0"
      style={{ background: 'linear-gradient(135deg, #00FFAA 0%, #00B368 100%)' }}
    >
      <Sparkles className="w-3.5 h-3.5" strokeWidth={2} style={{ color: '#0A0F0D' }} />
    </div>
  );
}

function UserBubble({ msg }: { msg: ChatMessageDto }) {
  return (
    <div className="flex justify-end" data-msg-id={msg.id}>
      <div className="max-w-[80%] bg-brand-soft border-thin border-border-glow rounded-card px-3.5 py-2.5 text-sm text-text-primary whitespace-pre-wrap">
        {msg.content}
      </div>
    </div>
  );
}

function AssistantBubble({
  msg,
  cardActions,
  consumed = false,
  hideIfEmpty = false,
}: {
  msg: ChatMessageDto;
  cardActions: CardActions;
  consumed?: boolean;
  hideIfEmpty?: boolean;
}) {
  const isStreamingEmpty = !msg.content;
  const card = parseInlineCard(msg);

  if (isStreamingEmpty && !card && hideIfEmpty) return null;

  return (
    <div className="flex gap-2.5">
      <BotAvatar />
      <div className="flex-1 max-w-[540px] flex flex-col gap-2">
        {isStreamingEmpty && !card ? (
          <div className="flex items-center gap-1 py-2">
            <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-pulse" />
            <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-pulse [animation-delay:150ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-pulse [animation-delay:300ms]" />
          </div>
        ) : (
          (() => {
            const stripped = stripProgressLine(msg.content ?? '');
            return stripped ? (
              <div className="text-sm leading-relaxed text-text-primary whitespace-pre-wrap">{stripped}</div>
            ) : null;
          })()
        )}
        {card && <InlineCardRenderer card={card} actions={cardActions} consumed={consumed} />}
      </div>
    </div>
  );
}

const INGESTION_STEPS = [
  { key: 'crawling',     label: 'Fetching pages',          detail: 'Loading website content' },
  { key: 'extracting',  label: 'Extracting content',       detail: 'Reading text, products, hours' },
  { key: 'understanding',label: 'AI analysis',             detail: 'Understanding your business' },
] as const;

function stageToIdx(stage: string): number {
  if (stage === 'playwright') return 0; // playwright = still in crawling step
  return INGESTION_STEPS.findIndex((s) => s.key === stage);
}

function WebsiteProgress({ label, stage }: { label: string; stage?: string }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const activeIdx = stage ? stageToIdx(stage) : -1;
  const isError = stage === 'error';

  return (
    <div className="rounded-xl border border-border bg-surface-1 p-3.5 space-y-3">
      {/* header */}
      <div className="flex items-center gap-2">
        <Globe className="w-4 h-4 text-primary shrink-0" strokeWidth={1.8} />
        <span className="text-sm font-semibold text-text-primary">Analyzing your website</span>
        <span className="ml-auto text-xs tabular-nums text-text-muted">{elapsed}s</span>
      </div>

      {/* steps */}
      {!isError && (
        <div className="space-y-2">
          {INGESTION_STEPS.map((step, i) => {
            const isDone   = activeIdx > i;
            const isActive = activeIdx === i;
            const isPending = activeIdx < i;
            return (
              <div key={step.key} className={`flex items-start gap-2.5 ${isPending ? 'opacity-35' : ''}`}>
                <div className="mt-0.5 w-4 shrink-0 flex justify-center">
                  {isDone   && <Check    className="w-4 h-4 text-emerald-400" strokeWidth={2.5} />}
                  {isActive && <Loader2  className="w-4 h-4 text-primary animate-spin" strokeWidth={2} />}
                  {isPending && <div className="w-3 h-3 rounded-full border border-border mt-0.5" />}
                </div>
                <div className="min-w-0">
                  <div className={`text-sm leading-snug ${isDone ? 'text-text-secondary line-through decoration-text-muted/40' : isActive ? 'text-text-primary font-medium' : 'text-text-muted'}`}>
                    {step.label}
                  </div>
                  {isActive && (
                    <div className="text-xs text-text-muted mt-0.5 leading-relaxed">{label}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* fallback before first stage event */}
      {!isError && activeIdx === -1 && (
        <div className="flex items-center gap-2 text-sm text-text-secondary italic">
          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" strokeWidth={1.6} />
          {label}
        </div>
      )}

      {/* error state */}
      {isError && (
        <div className="flex items-start gap-2 text-sm text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={2} />
          <span>{label}</span>
        </div>
      )}
    </div>
  );
}

function LongRunningLine({ label, stage }: { label: string; stage?: string }) {
  return (
    <div className="flex gap-2.5">
      <BotAvatar />
      <div className="flex-1 min-w-0">
        <WebsiteProgress label={label} stage={stage} />
      </div>
    </div>
  );
}

/* ─── Inline cards ──────────────────────────────────────────────── */

interface CardActions {
  onNavigate: (path: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  onPasteManually: () => void;
  onReply: (value: string, displayText?: string) => void;
}

function InlineCardRenderer({
  card,
  actions,
  consumed = false,
}: {
  card: InlineCard;
  actions: CardActions;
  consumed?: boolean;
}) {
  switch (card.type) {
    case 'MenuItemCreated':
      return <MenuItemCreatedCard card={card} />;
    case 'WebsiteIngestionPreview':
      return <WebsiteIngestionPreviewCard card={card} actions={actions} />;
    case 'WebsiteIngestionFailed':
      return <WebsiteIngestionFailedCard card={card} actions={actions} />;
    case 'RedirectToPage':
      return <RedirectToPageCard card={card} actions={actions} />;
    case 'OpenFlowCanvas':
      return <OpenFlowCanvasCard card={card} actions={actions} />;
    case 'Confirmation':
      return <ConfirmationCard card={card} actions={actions} />;
    case 'WebsiteExtractionDrafts':
      return <WebsiteExtractionDraftsCardRenderer card={card as unknown as WebsiteExtractionDraftsCard} />;
    case 'DocumentExtractionDrafts':
      return <DocumentExtractionDraftsCardRenderer card={card as unknown as DocumentExtractionDraftsCard} />;
    case 'ProposedBotMenu':
      return <ProposedBotMenuCardRenderer card={card as unknown as ProposedBotMenuCard} actions={actions} />;
    case 'AgentCreated':
      return <AgentCreatedCardRenderer card={card as unknown as AgentCreatedCard} />;
    case 'FreeText':
      // Plain text answers are handled by the global composer at the bottom
      // of the chat — rendering an extra input box per assistant turn is
      // redundant. We still accept the card from the LLM (it signals "expecting
      // a typed answer next") but we don't render it. The composer's placeholder
      // could be enhanced later to read the card's `placeholder` field if useful.
      return null;
    case 'Radio':
    case 'Dropdown':
    case 'MultiSelect':
    case 'Slider':
    case 'Date':
    case 'ButtonRow':
      return (
        <InputCard
          card={card as unknown as InputCardVariant}
          onSubmit={actions.onReply}
          consumed={consumed}
        />
      );
    default:
      return <GenericDoneCard card={card} />;
  }
}

function MenuItemCreatedCard({ card }: { card: InlineCard }) {
  const name = String(card.name ?? 'Item');
  const price = card.price as number | null | undefined;
  const currency = (card.currency as string | null | undefined) ?? '';
  const category = card.category as string | null | undefined;
  return (
    <div className="bg-glass-1 border-thin border-border-subtle rounded-card px-3.5 py-2.5 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold text-text-primary truncate">{name}</div>
        {category && <div className="text-xs text-text-muted truncate">{category}</div>}
      </div>
      {price != null && (
        <div className="text-sm font-bold text-brand shrink-0">
          {currency} {price}
        </div>
      )}
    </div>
  );
}

function WebsiteIngestionPreviewCard({ card, actions }: { card: InlineCard; actions: CardActions }) {
  const url = String(card.url ?? '');
  const pages = Number(card.pagesFetched ?? 0);
  const products = Number(card.productsCreated ?? 0);
  const topics = Number(card.topicsCreated ?? 0);
  const draftFlowId = card.draftFlowId as string | null | undefined;
  return (
    <div className="bg-glass-1 border-thin border-border-glow rounded-card p-3.5">
      <div className="flex items-center gap-2 mb-2">
        <Globe className="w-3.5 h-3.5 text-brand" strokeWidth={1.8} />
        <div className="text-[10px] font-bold text-brand uppercase tracking-[1.5px]">Website read</div>
      </div>
      <div className="text-xs text-text-secondary break-all mb-3">{url}</div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <Stat label="pages" value={pages} />
        <Stat label="products" value={products} />
        <Stat label="topics" value={topics} />
      </div>
      {draftFlowId && (
        <button
          type="button"
          onClick={() => actions.onNavigate(`/dashboard/flows/${draftFlowId}`)}
          className="mt-3 w-full flex items-center justify-center gap-1.5 rounded-sm border-thin border-border-medium hover:bg-glass-2 px-3 py-2 text-xs font-bold text-text-primary transition-colors"
        >
          Open flow canvas
          <ExternalLink className="w-3 h-3" strokeWidth={1.8} />
        </button>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-bg-shell border-thin border-border-subtle rounded-sm py-1.5">
      <div className="text-sm font-bold text-text-primary">{value}</div>
      <div className="text-[10px] text-text-muted uppercase tracking-wider">{label}</div>
    </div>
  );
}

function GenericDoneCard({ card }: { card: InlineCard }) {
  const summary = (card.summary as string | undefined) ?? (card.type as string);
  return (
    <div className="bg-glass-1 border-thin border-border-subtle rounded-card px-3 py-2 text-xs text-text-secondary">
      ✓ {summary}
    </div>
  );
}

function WebsiteIngestionFailedCard({ card, actions }: { card: InlineCard; actions: CardActions }) {
  const status = (card.status as string | undefined) ?? 'Failed';
  const url = String(card.url ?? '');
  const message =
    (card.message as string | null | undefined) ??
    "I couldn't read that website. We can add things manually instead.";

  const statusLabel =
    status === 'RobotsTxtBlocked'
      ? 'Site blocks crawlers'
      : status === 'RateLimited'
        ? 'Site rate-limited us'
        : 'Could not read site';

  return (
    <div
      className="rounded-card p-3.5"
      style={{
        background: 'rgba(245, 158, 11, 0.06)',
        border: '0.5px solid rgba(245, 158, 11, 0.25)',
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <AlertCircle className="w-3.5 h-3.5" strokeWidth={1.8} style={{ color: '#F59E0B' }} />
        <div className="text-[10px] font-bold uppercase tracking-[1.5px]" style={{ color: '#F59E0B' }}>
          {statusLabel}
        </div>
      </div>
      {url && <div className="text-xs text-text-secondary break-all mb-2">{url}</div>}
      <div className="text-xs text-text-primary leading-relaxed mb-3 whitespace-pre-wrap">{message}</div>
      <button
        type="button"
        onClick={actions.onPasteManually}
        className="w-full flex items-center justify-center gap-1.5 rounded-sm border-thin border-border-medium hover:bg-glass-2 px-3 py-2 text-xs font-bold text-text-primary transition-colors"
      >
        Add menu manually instead
        <ArrowRight className="w-3 h-3" strokeWidth={1.8} />
      </button>
    </div>
  );
}

function RedirectToPageCard({ card, actions }: { card: InlineCard; actions: CardActions }) {
  const path = String(card.path ?? '/dashboard');
  const label = (card.label as string | undefined) ?? 'Open the right page';
  const reason = card.reason as string | null | undefined;

  return (
    <div className="bg-glass-1 border-thin border-border-glow rounded-card p-3.5">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-8 h-8 rounded-sm bg-brand-soft border-thin border-border-glow flex items-center justify-center shrink-0">
          <ArrowRight className="w-3.5 h-3.5 text-brand" strokeWidth={1.8} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-text-primary mb-0.5">That's better handled on {label}</div>
          {reason && <div className="text-xs text-text-secondary leading-relaxed">{reason}</div>}
        </div>
      </div>
      <button
        type="button"
        onClick={() => actions.onNavigate(path)}
        className="w-full flex items-center justify-center gap-1.5 rounded-sm text-bg px-3 py-2 text-xs font-bold transition-all hover:brightness-110"
        style={{ background: 'linear-gradient(135deg, #00FFAA 0%, #00B368 100%)' }}
      >
        Go to {label}
        <ExternalLink className="w-3 h-3" strokeWidth={1.8} />
      </button>
    </div>
  );
}

function ProposedBotMenuCardRenderer({ card, actions }: { card: ProposedBotMenuCard; actions: CardActions }) {
  return (
    <div className="bg-glass-1 border-thin border-border-glow rounded-card p-3.5">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-8 h-8 rounded-sm bg-brand-soft border-thin border-border-glow flex items-center justify-center shrink-0">
          <GitBranch className="w-3.5 h-3.5 text-brand" strokeWidth={1.8} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-text-primary mb-0.5">Proposed bot menu from {card.specName}</div>
          <div className="text-xs text-text-secondary">
            {card.topics.length} topic{card.topics.length === 1 ? '' : 's'} mapped from {card.endpointCount} endpoint(s)
          </div>
        </div>
      </div>

      <div className="space-y-2.5 mb-3.5">
        {card.topics.map((topic) => (
          <div key={topic.name} className="rounded-sm bg-bg-elevated border-thin border-border-subtle p-2.5">
            <div className="text-xs font-bold text-text-primary mb-1.5">{topic.name}</div>
            {topic.description && (
              <div className="text-[11px] text-text-muted mb-1.5">{topic.description}</div>
            )}
            <div className="flex flex-wrap gap-1.5">
              {topic.endpoints.map((ep, i) => (
                <span key={i} className="inline-flex items-center gap-1">
                  <HttpMethodBadge method={ep.method as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'} />
                  <code className="text-[10.5px] text-text-secondary">{ep.path}</code>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={actions.onConfirm}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-sm text-bg px-3 py-2 text-xs font-bold transition-all hover:brightness-110"
          style={{ background: 'linear-gradient(135deg, #00FFAA 0%, #00B368 100%)' }}
        >
          Build this menu
        </button>
        <button
          type="button"
          onClick={() => actions.onNavigate(card.reviewPath)}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-sm border-thin border-border-glow text-text-secondary px-3 py-2 text-xs font-bold transition-all hover:bg-glass-2"
        >
          Review endpoints
          <ExternalLink className="w-3 h-3" strokeWidth={1.8} />
        </button>
      </div>
    </div>
  );
}

function OpenFlowCanvasCard({ card, actions }: { card: InlineCard; actions: CardActions }) {
  const flowId = card.flowId as string | null | undefined;
  const path = flowId ? `/dashboard/flows/${flowId}` : '/dashboard/flows';

  return (
    <button
      type="button"
      onClick={() => actions.onNavigate(path)}
      className="w-full flex items-center justify-between gap-3 bg-glass-1 hover:bg-glass-2 border-thin border-border-glow rounded-card px-3.5 py-3 transition-colors group"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-sm bg-brand-soft border-thin border-border-glow flex items-center justify-center shrink-0">
          <ExternalLink className="w-3.5 h-3.5 text-brand" strokeWidth={1.8} />
        </div>
        <div className="text-left min-w-0">
          <div className="text-sm font-bold text-text-primary">Open flow canvas</div>
          <div className="text-[11px] text-text-muted">See the conversation flow visually</div>
        </div>
      </div>
      <ArrowRight
        className="w-4 h-4 text-text-muted group-hover:text-brand-light transition-colors shrink-0"
        strokeWidth={1.8}
      />
    </button>
  );
}

function ConfirmationCard({ card, actions }: { card: InlineCard; actions: CardActions }) {
  const summary = (card.summary as string | undefined) ?? 'Are you sure?';
  return (
    <div
      className="rounded-card p-3.5"
      style={{
        background: 'rgba(244, 63, 94, 0.06)',
        border: '0.5px solid rgba(244, 63, 94, 0.25)',
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <AlertCircle className="w-3.5 h-3.5" strokeWidth={1.8} style={{ color: '#F43F5E' }} />
        <div className="text-[10px] font-bold uppercase tracking-[1.5px]" style={{ color: '#F43F5E' }}>
          Confirm action
        </div>
      </div>
      <div className="text-xs text-text-primary leading-relaxed mb-3">{summary}</div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={actions.onConfirm}
          className="flex-1 h-8 rounded-sm text-bg text-xs font-bold flex items-center justify-center gap-1.5 transition-all hover:brightness-110"
          style={{ background: 'linear-gradient(135deg, #00FFAA 0%, #00B368 100%)' }}
        >
          <Check className="w-3.5 h-3.5" strokeWidth={2.2} />
          Yes, confirm
        </button>
        <button
          type="button"
          onClick={actions.onCancel}
          className="flex-1 h-8 rounded-sm border-thin border-border-medium text-text-secondary hover:text-text-primary hover:bg-glass-2 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
        >
          <X className="w-3.5 h-3.5" strokeWidth={2.2} />
          Cancel
        </button>
      </div>
    </div>
  );
}

function SystemRow({ msg, cardActions }: { msg: ChatMessageDto; cardActions: CardActions }) {
  const card = parseInlineCard(msg);

  let summary: string | null = null;
  if (card?.type === 'DocumentExtractionDrafts') {
    const d = card as unknown as DocumentExtractionDraftsCard;
    summary = `You uploaded ${d.fileName} — extracted ${d.productCount} products, ${d.topicCount} topics.`;
  } else if (card?.type === 'WebsiteExtractionDrafts') {
    const w = card as unknown as WebsiteExtractionDraftsCard;
    summary = `Read ${w.url} — extracted ${w.productCount} products, ${w.topicCount} topics.`;
  } else if (card?.type === 'RedirectToPage') {
    summary = (card.reason as string | undefined) ?? 'Detected an API spec in the uploaded file.';
  } else if (card?.type === 'ProposedBotMenu') {
    const m = card as unknown as ProposedBotMenuCard;
    summary = `${m.topics.length} menu topic(s) proposed from ${m.endpointCount} endpoint(s) in ${m.specName}.`;
  }
  if (!summary) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-[11px] text-text-muted px-1">
        <Info className="w-3 h-3 shrink-0" strokeWidth={1.6} />
        <span>{summary}</span>
      </div>
      {card && (
        <div className="ml-5">
          <InlineCardRenderer card={card} actions={cardActions} />
        </div>
      )}
    </div>
  );
}

function WebsiteExtractionDraftsCardRenderer({ card }: { card: WebsiteExtractionDraftsCard }) {
  let host = card.url;
  try {
    host = new URL(card.url).hostname;
  } catch {
    /* leave url as-is if it's not parseable */
  }
  return (
    <ExtractionDraftsBody
      icon={<Globe className="w-4 h-4 shrink-0" strokeWidth={1.6} />}
      sourceLabel={host}
      sourceMeta={`web · ${card.pagesFetched} ${card.pagesFetched === 1 ? 'page' : 'pages'}`}
      business={card.business}
      hours={card.hours}
      policies={card.policies}
      productCount={card.productCount}
      topicCount={card.topicCount}
    />
  );
}

function DocumentExtractionDraftsCardRenderer({ card }: { card: DocumentExtractionDraftsCard }) {
  return (
    <ExtractionDraftsBody
      icon={<FileText className="w-4 h-4 shrink-0" strokeWidth={1.6} />}
      sourceLabel={card.fileName}
      sourceMeta={`${card.format} · ${card.pagesParsed} ${card.pagesParsed === 1 ? 'page' : 'pages'}`}
      business={card.business}
      hours={card.hours}
      policies={card.policies}
      productCount={card.productCount}
      topicCount={card.topicCount}
    />
  );
}

function ExtractionDraftsBody({
  icon,
  sourceLabel,
  sourceMeta,
  business,
  hours,
  policies,
  productCount,
  topicCount,
}: {
  icon: React.ReactNode;
  sourceLabel: string;
  sourceMeta: string;
  business: { name?: string; description?: string; type?: string } | null;
  hours: string | null;
  policies: string | null;
  productCount: number;
  topicCount: number;
}) {
  return (
    <div className="rounded-card border-thin border-border-subtle bg-glass-1 p-3.5 max-w-[480px]">
      <div className="flex items-center gap-2 text-text-secondary mb-3">
        {icon}
        <span className="text-xs font-bold text-text-primary truncate">{sourceLabel}</span>
        <span className="text-[10px] text-text-muted shrink-0">· {sourceMeta}</span>
      </div>

      <div className="flex flex-col gap-1.5 text-[11px]">
        {business?.name && <DraftRow label="Business" value={business.name} />}
        {business?.description && <DraftRow label="About" value={business.description} clamp />}
        {hours && <DraftRow label="Hours" value={hours} />}
        {policies && <DraftRow label="Policies" value={policies} clamp />}
        {(productCount > 0 || topicCount > 0) && (
          <div className="flex gap-4 mt-1.5 pt-2 border-t border-thin border-border-subtle">
            <span className="text-text-muted">
              <span className="font-bold text-text-primary">{productCount}</span> products drafted
            </span>
            <span className="text-text-muted">
              <span className="font-bold text-text-primary">{topicCount}</span> topics drafted
            </span>
          </div>
        )}
      </div>

      <div className="mt-3 text-[10px] text-text-muted leading-relaxed">
        These are drafts. The bot will confirm each one with you in the chat.
      </div>
    </div>
  );
}

function DraftRow({ label, value, clamp = false }: { label: string; value: string; clamp?: boolean }) {
  return (
    <div className="flex gap-2">
      <span className="text-text-muted w-16 shrink-0 uppercase text-[9px] tracking-wider font-bold pt-0.5">
        {label}
      </span>
      <span className={'flex-1 text-text-primary leading-relaxed ' + (clamp ? 'line-clamp-2' : '')}>
        {value}
      </span>
    </div>
  );
}
