import { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { VoiceButton } from '@/features/voice/components/VoiceButton';
import { useVoiceRecorder } from '@/features/voice/hooks/useVoiceRecorder';
import { useSpaceToRecord } from '@/features/voice/hooks/useSpaceToRecord';

interface ChatInputProps {
  onSend: (text: string) => void;
  /** Called when a voice recording is ready to be sent as audio */
  onVoiceRecording?: (blob: Blob) => void;
  disabled?: boolean;
  isSending?: boolean;
  /** External voice-processing state (transcription in flight) */
  isVoiceProcessing?: boolean;
  placeholder?: string;
  /** Enable/disable voice button (defaults to true) */
  enableVoice?: boolean;
}

export function ChatInput({
  onSend,
  onVoiceRecording,
  disabled,
  isSending,
  isVoiceProcessing = false,
  placeholder = 'Type a message...',
  enableVoice = true,
}: ChatInputProps) {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Space-to-record: internal recorder used only for the keyboard shortcut
  const spaceRecorder = useVoiceRecorder();

  useSpaceToRecord({
    inputRef,
    isRecording: spaceRecorder.state === 'recording',
    startRecording: () => {
      setIsRecording(true);
      spaceRecorder.startRecording();
    },
    stopRecording: () => {
      spaceRecorder.stopRecording();
    },
    enabled: enableVoice && !disabled && !isSending && !isVoiceProcessing,
  });

  // When space-recorder produces a blob, forward it
  useEffect(() => {
    if (spaceRecorder.audioBlob && spaceRecorder.state === 'idle') {
      setIsRecording(false);
      onVoiceRecording?.(spaceRecorder.audioBlob);
      spaceRecorder.reset();
    }
  }, [spaceRecorder.audioBlob, spaceRecorder.state, onVoiceRecording, spaceRecorder]);

  useEffect(() => {
    if (!isSending && !isRecording) inputRef.current?.focus();
  }, [isSending, isRecording]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled || isSending) return;
    onSend(trimmed);
    setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleVoiceComplete = (blob: Blob) => {
    setIsRecording(false);
    onVoiceRecording?.(blob);
  };

  const isInputDisabled = disabled || isSending || isRecording || isVoiceProcessing;

  return (
    <div className="flex items-center gap-2 p-3 border-t border-t-border-subtle">
      <input
        ref={inputRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={
          isRecording ? 'Recording... release Space to send'
            : isVoiceProcessing ? 'Transcribing...'
            : enableVoice ? `${placeholder} (hold Space for voice)`
            : placeholder
        }
        disabled={isInputDisabled}
        className="flex-1 px-4 py-2.5 rounded-lg bg-glass-2 border border-border-subtle text-sm text-text-primary
                   placeholder:text-text-muted focus:outline-none focus:border-brand transition-all
                   disabled:opacity-40"
      />

      {/* Voice button */}
      {enableVoice && (
        <VoiceButton
          onRecordingComplete={handleVoiceComplete}
          onRecordingStart={() => setIsRecording(true)}
          onRecordingCancel={() => setIsRecording(false)}
          isProcessing={isVoiceProcessing}
          disabled={disabled || isSending}
          size="sm"
        />
      )}

      {/* Send button */}
      <button
        onClick={handleSend}
        disabled={!text.trim() || isInputDisabled}
        className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center
                   text-text-primary hover:brightness-110 disabled:opacity-40 transition-all flex-shrink-0"
      >
        {isSending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Send className="w-4 h-4" strokeWidth={1.8} />
        )}
      </button>
    </div>
  );
}
