// ═══════════════════════════════════════════════════════════════
// Voice Feature — API Functions
// POST /api/v1/voice/transcribe, /voice/synthesize, /voice/message
// ═══════════════════════════════════════════════════════════════

import { apiClient } from '@/shared/lib/api-client';
import type {
  TranscribeResponse,
  SynthesizeRequest,
  VoiceMessageResponse,
  TtsVoiceValue,
} from '../types/voice.types';

const VOICE_TIMEOUT = 120_000; // 2 min — transcription + LLM can be slow

export const voiceApi = {
  /**
   * POST /api/v1/voice/transcribe
   * Upload audio blob → get text back
   */
  transcribe: async (audio: Blob, language?: string, prompt?: string): Promise<TranscribeResponse> => {
    const formData = new FormData();
    formData.append('audio', audio, `recording.${getAudioExtension(audio)}`);
    if (language) formData.append('language', language);
    if (prompt) formData.append('prompt', prompt);

    return apiClient.post('/v1/voice/transcribe', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: VOICE_TIMEOUT,
    }) as unknown as TranscribeResponse;
  },

  /**
   * POST /api/v1/voice/synthesize
   * Send text → get audio blob back (binary response)
   */
  synthesize: async (request: SynthesizeRequest): Promise<Blob> => {
    const response = await apiClient.post('/v1/voice/synthesize', request, {
      responseType: 'blob',
      timeout: VOICE_TIMEOUT,
      // Override the ServiceResult interceptor — this returns raw binary
      transformResponse: [(data: unknown) => data],
    });
    return response as unknown as Blob;
  },

  /**
   * POST /api/v1/voice/message
   * Upload audio → transcribe → flow runtime → optional TTS response
   */
  sendVoiceMessage: async (
    audio: Blob,
    sessionId: string,
    returnAudio: boolean,
    voice?: TtsVoiceValue,
    language?: string,
  ): Promise<VoiceMessageResponse> => {
    const formData = new FormData();
    formData.append('audio', audio, `recording.${getAudioExtension(audio)}`);
    formData.append('sessionId', sessionId);
    formData.append('returnAudio', String(returnAudio));
    if (voice) formData.append('voice', voice);
    if (language) formData.append('language', language);

    return apiClient.post('/v1/voice/message', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: VOICE_TIMEOUT,
    }) as unknown as VoiceMessageResponse;
  },
} as const;

// ─── Helpers ───

function getAudioExtension(blob: Blob): string {
  if (blob.type.includes('webm')) return 'webm';
  if (blob.type.includes('mp4')) return 'mp4';
  if (blob.type.includes('ogg')) return 'ogg';
  return 'webm'; // default fallback
}
