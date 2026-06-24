// ═══════════════════════════════════════════════════════════════
// VoiceButton — Mic recording button for chat input areas
// States: idle (mic icon), recording (pulsing red + timer), processing (spinner)
// Sizes: xs (compact simulator), sm (standard chat), lg (standalone voice mode)
// ═══════════════════════════════════════════════════════════════

import { useEffect, useCallback } from 'react';
import { Mic, MicOff, Square, Loader2, X } from 'lucide-react';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';

type VoiceButtonSize = 'xs' | 'sm' | 'lg';

interface VoiceButtonProps {
  /** Called with the recorded audio blob when recording stops */
  onRecordingComplete: (blob: Blob) => void;
  /** Called when recording starts (to disable text input) */
  onRecordingStart?: () => void;
  /** Called when recording is cancelled */
  onRecordingCancel?: () => void;
  /** Externally set processing state (e.g. while API call is in flight) */
  isProcessing?: boolean;
  /** Disable the button entirely */
  disabled?: boolean;
  /** Size variant: xs for compact panels, sm for standard chat, lg for standalone */
  size?: VoiceButtonSize;
  /** Tooltip override for permission denied */
  permissionDeniedText?: string;
}

const SIZE_CONFIG = {
  xs: { btn: 'w-7 h-7', icon: 'w-3 h-3', stopIcon: 'w-2.5 h-2.5', cancel: 'w-5 h-5', cancelIcon: 'w-2 h-2', radius: 'rounded-md' },
  sm: { btn: 'w-10 h-10', icon: 'w-4 h-4', stopIcon: 'w-3.5 h-3.5', cancel: 'w-7 h-7', cancelIcon: 'w-3 h-3', radius: 'rounded-lg' },
  lg: { btn: 'w-12 h-12', icon: 'w-5 h-5', stopIcon: 'w-4 h-4', cancel: 'w-8 h-8', cancelIcon: 'w-3.5 h-3.5', radius: 'rounded-lg' },
} as const;

export function VoiceButton({
  onRecordingComplete,
  onRecordingStart,
  onRecordingCancel,
  isProcessing = false,
  disabled = false,
  size = 'sm',
  permissionDeniedText,
}: VoiceButtonProps) {
  const recorder = useVoiceRecorder();
  const s = SIZE_CONFIG[size];

  // When recorder produces a blob, fire the callback
  useEffect(() => {
    if (recorder.audioBlob && recorder.state === 'idle') {
      onRecordingComplete(recorder.audioBlob);
      recorder.reset();
    }
  }, [recorder.audioBlob, recorder.state, onRecordingComplete, recorder]);

  // Don't render if browser doesn't support recording
  if (!recorder.isSupported) return null;

  const isRecording = recorder.state === 'recording';
  const isTranscribing = isProcessing || recorder.state === 'processing';

  const handleClick = useCallback(() => {
    if (isTranscribing || disabled) return;

    if (isRecording) {
      recorder.stopRecording();
    } else {
      recorder.startRecording();
      onRecordingStart?.();
    }
  }, [isRecording, isTranscribing, disabled, recorder, onRecordingStart]);

  const handleCancel = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    recorder.cancelRecording();
    onRecordingCancel?.();
  }, [recorder, onRecordingCancel]);

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isCompact = size === 'xs';

  // ─── Processing state ───
  if (isTranscribing) {
    return (
      <div className="flex items-center gap-1.5">
        <div
          className={`${s.btn} ${s.radius} bg-glass-2 border border-border-subtle
                      flex items-center justify-center flex-shrink-0`}
        >
          <Loader2 className={`${s.icon} text-brand animate-spin`} strokeWidth={2} />
        </div>
        {!isCompact && (
          <span className="text-[10px] font-semibold text-brand animate-pulse whitespace-nowrap">
            Transcribing...
          </span>
        )}
      </div>
    );
  }

  // ─── Recording state ───
  if (isRecording) {
    if (isCompact) {
      // xs: single red button with pulsing dot + tap to stop
      return (
        <div className="flex items-center gap-1">
          <button
            onClick={handleCancel}
            className={`${s.cancel} ${s.radius} bg-glass-2 border border-border-subtle
                       flex items-center justify-center text-text-muted
                       hover:bg-danger-soft hover:text-danger transition-all duration-150 flex-shrink-0`}
            title="Cancel"
          >
            <X className={s.cancelIcon} strokeWidth={2} />
          </button>
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[rgba(244,63,94,0.08)] border border-[rgba(244,63,94,0.15)]">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-danger" />
            </span>
            <span className="text-[9px] font-bold text-danger tabular-nums">
              {formatDuration(recorder.duration)}
            </span>
          </div>
          <button
            onClick={handleClick}
            className={`${s.btn} ${s.radius} bg-danger flex items-center justify-center
                        text-white hover:brightness-110 transition-all duration-150 flex-shrink-0`}
            title="Stop"
          >
            <Square className={s.stopIcon} strokeWidth={2} fill="currentColor" />
          </button>
        </div>
      );
    }

    // sm / lg: full recording UI
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={handleCancel}
          className={`${s.cancel} ${s.radius} bg-glass-2 border border-border-subtle
                     flex items-center justify-center text-text-muted
                     hover:bg-danger-soft hover:text-danger hover:border-[rgba(244,63,94,0.15)]
                     transition-all duration-150 flex-shrink-0`}
          title="Cancel recording"
        >
          <X className={s.cancelIcon} strokeWidth={2} />
        </button>

        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[rgba(244,63,94,0.08)] border border-[rgba(244,63,94,0.15)]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-danger" />
          </span>
          <span className="text-[10px] font-bold text-danger tabular-nums">
            {formatDuration(recorder.duration)}
          </span>
        </div>

        <button
          onClick={handleClick}
          className={`${s.btn} ${s.radius} bg-danger flex items-center justify-center
                      text-white hover:brightness-110 transition-all duration-150 flex-shrink-0`}
          title="Stop recording"
        >
          <Square className={s.stopIcon} strokeWidth={2} fill="currentColor" />
        </button>
      </div>
    );
  }

  // ─── Idle state ───
  return (
    <div className="relative group flex-shrink-0">
      <button
        onClick={handleClick}
        disabled={disabled}
        className={`${s.btn} ${s.radius} bg-glass-2 border border-border-subtle
                    flex items-center justify-center transition-all duration-150
                    ${disabled
                      ? 'opacity-40 cursor-not-allowed'
                      : 'text-text-muted hover:text-brand hover:bg-brand-soft hover:border-brand/20'
                    }`}
        title="Record voice message"
      >
        {recorder.error ? (
          <MicOff className={s.icon} strokeWidth={1.8} />
        ) : (
          <Mic className={s.icon} strokeWidth={1.8} />
        )}
      </button>

      {/* Error tooltip */}
      {recorder.error && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg
                        bg-bg-shell border border-border-subtle text-[10px] text-danger
                        font-medium whitespace-nowrap opacity-0 group-hover:opacity-100
                        transition-opacity duration-150 pointer-events-none z-50">
          {permissionDeniedText || recorder.error}
        </div>
      )}
    </div>
  );
}
