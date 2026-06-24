import { useState, useCallback, useRef } from 'react';
import { useSendTestMessage, useResetTestSession, useStartTestSession } from '../api/test-channel.queries';
import { testChannelApi } from '../api/test-channel.api';
import { voiceApi } from '@/features/voice/api/voice.api';
import type {
  ChatBubble,
  MessageDebugInfo,
  TestMessageResponse,
  TestSessionStateResponse,
  TestChatMessage,
} from '../types/test-channel.types';

interface UseTestChatOptions {
  tenantId: string;
  senderId: string;
}

export interface SessionSnapshot {
  mode: string | null;
  status: string | null;
  currentFlowPosition: string | null;
  collectedVariables: Record<string, string> | null;
  messageCount: number;
  totalTokensUsed: number;
}

interface UseTestChatReturn {
  messages: ChatBubble[];
  sessionId: string | null;
  connectionId: string | null;
  sessionState: SessionSnapshot | null;
  isReady: boolean;
  isSending: boolean;
  isStartingSession: boolean;
  isVoiceProcessing: boolean;
  sendMessage: (text: string, interactiveReplyId?: string) => void;
  /** Send a voice recording — transcribes then sends through text pipeline */
  sendVoiceMessage: (audioBlob: Blob) => void;
  resetSession: () => void;
  initializeConnection: (connectionId: string) => void;
  selectedMessageId: string | null;
  selectMessage: (id: string | null) => void;
}

let bubbleCounter = 0;
function nextBubbleId(): string {
  bubbleCounter += 1;
  return `bubble-${bubbleCounter}-${Date.now()}`;
}

function isEmptyGuid(id: string | null | undefined): boolean {
  if (!id) return true;
  return /^0{8}-0{4}-0{4}-0{4}-0{12}$/.test(id.trim());
}

function historyToBubbles(history: TestChatMessage[]): ChatBubble[] {
  return history.map((msg) => ({
    id: nextBubbleId(),
    role: msg.role === 'user' ? ('user' as const) : ('bot' as const),
    text: msg.content ?? '',
    debug:
      msg.role !== 'user'
        ? {
            routingPath: msg.routingPath,
            matchedIntent: null,
            responseType: msg.responseType,
            processingTimeMs: 0,
            tokensUsed: 0,
            conversationMode: null,
            currentFlowPosition: null,
            sessionStatus: null,
            collectedVariables: null,
          }
        : undefined,
    timestamp: msg.timestamp,
  }));
}

export function useTestChat({ tenantId, senderId }: UseTestChatOptions): UseTestChatReturn {
  const [messages, setMessages] = useState<ChatBubble[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [sessionState, setSessionState] = useState<SessionSnapshot | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isVoiceProcessing, setIsVoiceProcessing] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);

  const sessionIdRef = useRef<string | null>(null);
  sessionIdRef.current = sessionId;

  const startingSessionRef = useRef(false);

  const sendMutation = useSendTestMessage();
  const resetMutation = useResetTestSession();
  const startSessionMutation = useStartTestSession();

  // ─── Called by TestChannelSetup once connection is established ───
  const initializeConnection = useCallback((newConnectionId: string) => {
    setConnectionId(newConnectionId);
    setIsReady(true);
  }, []);

  // ─── Process a bot response into a bubble ───
  const applyBotResponse = useCallback((res: TestMessageResponse) => {
    if (!isEmptyGuid(res.sessionId)) {
      setSessionId(res.sessionId);
      sessionIdRef.current = res.sessionId;
    }

    const debug: MessageDebugInfo = {
      routingPath: res.routingPath,
      matchedIntent: res.matchedIntent,
      responseType: res.responseType,
      processingTimeMs: res.processingTimeMs,
      tokensUsed: res.tokensUsed,
      conversationMode: res.conversationMode,
      currentFlowPosition: res.currentFlowPosition,
      sessionStatus: res.sessionStatus,
      collectedVariables: res.collectedVariables,
    };

    const botBubble: ChatBubble = {
      id: nextBubbleId(),
      role: 'bot',
      text: res.replyText ?? '',
      buttons: res.buttons ?? undefined,
      listItems: res.listItems ?? undefined,
      products: res.products ?? undefined,
      mediaUrl: res.mediaUrl,
      debug,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, botBubble]);
    setSelectedMessageId(botBubble.id);

    setSessionState({
      mode: res.conversationMode,
      status: res.sessionStatus,
      currentFlowPosition: res.currentFlowPosition,
      collectedVariables: res.collectedVariables,
      messageCount: res.messageCount,
      totalTokensUsed: res.tokensUsed,
    });
  }, []);

  // ─── Send a message (handles both first-message and subsequent) ───
  const sendMessage = useCallback(
    async (text: string, interactiveReplyId?: string) => {
      if (!tenantId || !isReady) return;
      if (startingSessionRef.current) return;
      if (isSending) return;

      // Add user bubble immediately
      const userBubble: ChatBubble = {
        id: nextBubbleId(),
        role: 'user',
        text,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userBubble]);
      setIsSending(true);

      try {
        let justStartedSession = false;

        // If no session yet, start one first
        if (isEmptyGuid(sessionIdRef.current)) {
          startingSessionRef.current = true;

          const sessionRaw = await testChannelApi.startSession({
            tenantId,
            senderId: senderId || undefined,
          });
          const sessionRes = sessionRaw as unknown as TestSessionStateResponse;

          if (!isEmptyGuid(sessionRes.sessionId)) {
            setSessionId(sessionRes.sessionId);
            sessionIdRef.current = sessionRes.sessionId;
          }

          if (sessionRes.history && sessionRes.history.length > 0) {
            setMessages((prev) => [...historyToBubbles(sessionRes.history!), ...prev]);
          }

          setSessionState({
            mode: sessionRes.mode,
            status: sessionRes.status,
            currentFlowPosition: sessionRes.currentFlowPosition,
            collectedVariables: sessionRes.collectedVariables,
            messageCount: sessionRes.messageCount,
            totalTokensUsed: sessionRes.totalTokensUsed,
          });

          startingSessionRef.current = false;
          justStartedSession = true;
        }

        // Small delay after session start to let backend commit
        // Only needed for the first message in a new session
        if (justStartedSession) {
          await new Promise((r) => setTimeout(r, 300));
        }

        // Now send the message
        const msgRaw = await testChannelApi.sendMessage({
          tenantId,
          senderId,
          text,
          interactiveReplyId: interactiveReplyId ?? undefined,
        });
        const msgRes = msgRaw as unknown as TestMessageResponse;
        applyBotResponse(msgRes);
      } catch (err) {
        startingSessionRef.current = false;
        console.error('[useTestChat] Error:', err);
        // Add error bubble
        setMessages((prev) => [
          ...prev,
          {
            id: nextBubbleId(),
            role: 'bot',
            text: '❌ Failed to send message. Please try again.',
            timestamp: new Date().toISOString(),
          },
        ]);
      } finally {
        setIsSending(false);
      }
    },
    [tenantId, senderId, isReady, isSending, applyBotResponse],
  );

  // ─── Reset session ───
  const resetSession = useCallback(() => {
    const sid = sessionIdRef.current;

    const clearState = () => {
      setMessages([]);
      setSessionId(null);
      sessionIdRef.current = null;
      startingSessionRef.current = false;
      setSessionState(null);
      setSelectedMessageId(null);
      setIsSending(false);
      setIsVoiceProcessing(false);
      // isReady stays true — connection is still valid
    };

    if (isEmptyGuid(sid)) {
      clearState();
      return;
    }

    resetMutation.mutate(sid!, {
      onSuccess: () => clearState(),
      onError: () => clearState(),
    });
  }, [resetMutation]);

  // ─── Send voice message: transcribe → send as text ───
  const sendVoiceMessage = useCallback(
    async (audioBlob: Blob) => {
      if (!tenantId || !isReady || isSending || isVoiceProcessing) return;

      setIsVoiceProcessing(true);

      try {
        // Step 1: Transcribe audio to text
        const transcription = await voiceApi.transcribe(audioBlob);
        const transcribedText = transcription.text?.trim();

        if (!transcribedText) {
          setMessages((prev) => [
            ...prev,
            {
              id: nextBubbleId(),
              role: 'bot',
              text: 'Could not understand the audio. Please try again.',
              timestamp: new Date().toISOString(),
            },
          ]);
          setIsVoiceProcessing(false);
          return;
        }

        setIsVoiceProcessing(false);

        // Step 2: Add user bubble with voice flag and transcribed text
        const userBubble: ChatBubble = {
          id: nextBubbleId(),
          role: 'user',
          text: transcribedText,
          isVoice: true,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, userBubble]);
        setIsSending(true);

        // Step 3: Start session if needed (same logic as sendMessage)
        let justStartedSession = false;
        if (isEmptyGuid(sessionIdRef.current)) {
          startingSessionRef.current = true;

          const sessionRaw = await testChannelApi.startSession({
            tenantId,
            senderId: senderId || undefined,
          });
          const sessionRes = sessionRaw as unknown as TestSessionStateResponse;

          if (!isEmptyGuid(sessionRes.sessionId)) {
            setSessionId(sessionRes.sessionId);
            sessionIdRef.current = sessionRes.sessionId;
          }

          if (sessionRes.history && sessionRes.history.length > 0) {
            setMessages((prev) => [...historyToBubbles(sessionRes.history!), ...prev]);
          }

          setSessionState({
            mode: sessionRes.mode,
            status: sessionRes.status,
            currentFlowPosition: sessionRes.currentFlowPosition,
            collectedVariables: sessionRes.collectedVariables,
            messageCount: sessionRes.messageCount,
            totalTokensUsed: sessionRes.totalTokensUsed,
          });

          startingSessionRef.current = false;
          justStartedSession = true;
        }

        if (justStartedSession) {
          await new Promise((r) => setTimeout(r, 300));
        }

        // Step 4: Send transcribed text through existing text pipeline
        const msgRaw = await testChannelApi.sendMessage({
          tenantId,
          senderId,
          text: transcribedText,
        });
        const msgRes = msgRaw as unknown as TestMessageResponse;
        applyBotResponse(msgRes);
      } catch (err) {
        startingSessionRef.current = false;
        console.error('[useTestChat] Voice error:', err);
        setMessages((prev) => [
          ...prev,
          {
            id: nextBubbleId(),
            role: 'bot',
            text: '❌ Voice message failed. Please try again.',
            timestamp: new Date().toISOString(),
          },
        ]);
      } finally {
        setIsSending(false);
        setIsVoiceProcessing(false);
      }
    },
    [tenantId, senderId, isReady, isSending, isVoiceProcessing, applyBotResponse],
  );

  return {
    messages,
    sessionId,
    connectionId,
    sessionState,
    isReady,
    isSending: isSending || sendMutation.isPending,
    isStartingSession: startSessionMutation.isPending || startingSessionRef.current,
    isVoiceProcessing,
    sendMessage,
    sendVoiceMessage,
    resetSession,
    initializeConnection,
    selectedMessageId,
    selectMessage: setSelectedMessageId,
  };
}