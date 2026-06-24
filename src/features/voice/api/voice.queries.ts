// ═══════════════════════════════════════════════════════════════
// Voice Feature — TanStack Query Hooks
// ═══════════════════════════════════════════════════════════════

import { useMutation } from '@tanstack/react-query';
import { voiceApi } from './voice.api';
import { toast } from 'sonner';
import { ApiError } from '@/shared/lib/api-client';
import type { TtsVoiceValue } from '../types/voice.types';

// ─── Query Keys ───

export const voiceKeys = {
  all: ['voice'] as const,
  transcriptions: () => [...voiceKeys.all, 'transcription'] as const,
  synthesis: () => [...voiceKeys.all, 'synthesis'] as const,
  messages: () => [...voiceKeys.all, 'message'] as const,
} as const;

// ─── Mutations ───

/** Transcribe audio blob → text */
export function useTranscribeAudio() {
  return useMutation({
    mutationFn: ({ audio, language }: { audio: Blob; language?: string }) =>
      voiceApi.transcribe(audio, language),
    onError: (err: ApiError) =>
      toast.error(err.message || 'Failed to transcribe audio.'),
  });
}

/** Synthesize text → audio blob */
export function useSynthesizeSpeech() {
  return useMutation({
    mutationFn: ({ text, voice }: { text: string; voice?: TtsVoiceValue }) =>
      voiceApi.synthesize({ Text: text, Voice: voice }),
    onError: (err: ApiError) =>
      toast.error(err.message || 'Failed to synthesize speech.'),
  });
}

/** Full voice message: audio → transcribe → flow → optional TTS back */
export function useSendVoiceMessage() {
  return useMutation({
    mutationFn: ({
      audio,
      sessionId,
      returnAudio,
      voice,
      language,
    }: {
      audio: Blob;
      sessionId: string;
      returnAudio: boolean;
      voice?: TtsVoiceValue;
      language?: string;
    }) => voiceApi.sendVoiceMessage(audio, sessionId, returnAudio, voice, language),
    onError: (err: ApiError) =>
      toast.error(err.message || 'Voice message failed.'),
  });
}
