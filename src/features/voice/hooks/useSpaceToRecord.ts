// ═══════════════════════════════════════════════════════════════
// useSpaceToRecord — Hold Space to record voice when input focused
// Attach to any chat input: pass inputRef and recorder controls
// ═══════════════════════════════════════════════════════════════

import { useEffect, useRef, useCallback } from 'react';

interface UseSpaceToRecordOptions {
  /** Ref to the text input element (only triggers when focused) */
  inputRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
  /** Whether recording is currently in progress */
  isRecording: boolean;
  /** Start recording function */
  startRecording: () => Promise<void> | void;
  /** Stop recording function */
  stopRecording: () => void;
  /** Whether the feature is enabled */
  enabled?: boolean;
}

/**
 * Hold Space to record voice when the chat input is focused and empty.
 * - Only activates when the input has focus and contains no text
 * - Prevents the default space character from being typed
 * - Release to stop and send
 */
export function useSpaceToRecord({
  inputRef,
  isRecording,
  startRecording,
  stopRecording,
  enabled = true,
}: UseSpaceToRecordOptions) {
  const isHoldingRef = useRef(false);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;
      if (e.code !== 'Space' || e.repeat) return;

      const input = inputRef.current;
      if (!input) return;

      // Only activate when focused on the input and it's empty
      if (document.activeElement !== input) return;
      if (input.value.trim().length > 0) return;

      // Prevent space character from being typed
      e.preventDefault();

      if (!isHoldingRef.current && !isRecording) {
        isHoldingRef.current = true;
        startRecording();
      }
    },
    [enabled, inputRef, isRecording, startRecording],
  );

  const handleKeyUp = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;
      if (e.code !== 'Space') return;

      if (isHoldingRef.current) {
        isHoldingRef.current = false;
        if (isRecording) {
          stopRecording();
        }
      }
    },
    [enabled, isRecording, stopRecording],
  );

  useEffect(() => {
    if (!enabled) return;
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [enabled, handleKeyDown, handleKeyUp]);
}
