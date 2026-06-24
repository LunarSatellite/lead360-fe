// ═══════════════════════════════════════════════════════════════
// Voice Feature — Public API (barrel export)
// ═══════════════════════════════════════════════════════════════

// Types
export type {
  VoiceSettings,
  VoiceMessageResponse,
  TranscribeResponse,
  TtsVoiceValue,
  TtsModelValue,
} from './types/voice.types';
export {
  TtsVoice,
  TtsModel,
  TTS_VOICE_LABEL,
  TTS_MODEL_LABEL,
  TTS_SPEED_OPTIONS,
  DEFAULT_VOICE_SETTINGS,
} from './types/voice.types';

// API
export { voiceApi } from './api/voice.api';

// Query hooks
export {
  useTranscribeAudio,
  useSynthesizeSpeech,
  useSendVoiceMessage,
} from './api/voice.queries';

// Hooks
export { useVoiceRecorder } from './hooks/useVoiceRecorder';
export { useSpaceToRecord } from './hooks/useSpaceToRecord';

// Components
export { VoiceButton } from './components/VoiceButton';
export { AudioMessage } from './components/AudioMessage';
export { VoiceSettingsPanel } from './components/VoiceSettingsPanel';
