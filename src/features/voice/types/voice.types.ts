// ═══════════════════════════════════════════════════════════════
// Voice Feature — Type Definitions (matches backend VoiceController)
// ═══════════════════════════════════════════════════════════════

// ─── TTS Voice Options ───

export const TtsVoice = {
  Alloy: 'alloy',
  Echo: 'echo',
  Fable: 'fable',
  Onyx: 'onyx',
  Nova: 'nova',
  Shimmer: 'shimmer',
} as const;
export type TtsVoiceValue = (typeof TtsVoice)[keyof typeof TtsVoice];

export const TTS_VOICE_LABEL: Record<TtsVoiceValue, string> = {
  alloy: 'Alloy',
  echo: 'Echo',
  fable: 'Fable',
  onyx: 'Onyx',
  nova: 'Nova',
  shimmer: 'Shimmer',
};

export const TTS_VOICE_DESC: Record<TtsVoiceValue, string> = {
  alloy: 'Neutral & balanced',
  echo: 'Warm & conversational',
  fable: 'Expressive & British',
  onyx: 'Deep & authoritative',
  nova: 'Friendly & upbeat',
  shimmer: 'Clear & gentle',
};

// ─── TTS Model Options ───

export const TtsModel = {
  Standard: 'tts-1',
  Hd: 'tts-1-hd',
} as const;
export type TtsModelValue = (typeof TtsModel)[keyof typeof TtsModel];

export const TTS_MODEL_LABEL: Record<TtsModelValue, string> = {
  'tts-1': 'Standard (fast)',
  'tts-1-hd': 'HD (high quality)',
};

// ─── Speed Options ───

export const TTS_SPEED_OPTIONS = [
  { value: 0.5, label: '0.5x' },
  { value: 0.75, label: '0.75x' },
  { value: 1.0, label: '1.0x' },
  { value: 1.25, label: '1.25x' },
  { value: 1.5, label: '1.5x' },
] as const;

// ─── Recording States ───

export const RecordingState = {
  Idle: 'idle',
  Recording: 'recording',
  Processing: 'processing',
} as const;
export type RecordingStateValue = (typeof RecordingState)[keyof typeof RecordingState];

// ─── Transcribe Response (POST /voice/transcribe) ───
// Response fields are camelCase (ASP.NET default JSON serialization)

export interface TranscribeResponse {
  text: string;
  detectedLanguage: string;
  durationMs: number;
  processingTimeMs: number;
}

// ─── Synthesize Request (POST /voice/synthesize) ───
// Request fields are PascalCase (ASP.NET model binding)

export interface SynthesizeRequest {
  Text: string;
  Voice?: TtsVoiceValue;
  Model?: TtsModelValue;
  Speed?: number;
  OutputFormat?: string;
}

// ─── Voice Message Flow Result (subset of flow runtime) ───

export interface VoiceFlowResult {
  status: number;
  response: string;
  menuItems?: Array<{ label: string; value: string; icon?: string }>;
  currentNodeKey?: string;
  nodeType?: string;
  intentName?: string;
  audioData?: string;      // base64
  audioMimeType?: string;
}

// ─── Voice Message Response (POST /voice/message) ───

export interface VoiceMessageResponse {
  transcribedText: string;
  flowResult: VoiceFlowResult;
  audioData: string | null;      // base64 TTS audio
  audioMimeType: string | null;
  transcriptionTimeMs: number;
  synthesisTimeMs: number;
  totalTimeMs: number;
}

// ─── Voice Settings (stored in tenant config) ───

export interface VoiceSettings {
  enableVoiceInput: boolean;
  enableVoiceResponses: boolean;
  ttsVoice: TtsVoiceValue;
  ttsModel: TtsModelValue;
  ttsSpeed: number;
}

export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  enableVoiceInput: true,
  enableVoiceResponses: false,
  ttsVoice: 'nova',
  ttsModel: 'tts-1',
  ttsSpeed: 1.0,
};
