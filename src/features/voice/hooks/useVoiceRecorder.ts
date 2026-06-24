// ═══════════════════════════════════════════════════════════════
// useVoiceRecorder — Browser audio recording via MediaRecorder
// ═══════════════════════════════════════════════════════════════

import { useState, useRef, useCallback, useEffect } from 'react';
import type { RecordingStateValue } from '../types/voice.types';

const MAX_RECORDING_SECONDS = 120; // backend limit

interface UseVoiceRecorderReturn {
  /** Current state: idle | recording | processing */
  state: RecordingStateValue;
  /** The recorded audio blob (available after stop) */
  audioBlob: Blob | null;
  /** Live duration in seconds while recording */
  duration: number;
  /** Error message if something went wrong */
  error: string | null;
  /** Whether the browser supports MediaRecorder */
  isSupported: boolean;
  /** Start recording (requests mic permission on first call) */
  startRecording: () => Promise<void>;
  /** Stop recording and produce the blob */
  stopRecording: () => void;
  /** Cancel recording and discard data */
  cancelRecording: () => void;
  /** Reset to idle (clear blob and error) */
  reset: () => void;
}

/**
 * Detect the best supported MIME type for audio recording.
 * Chrome/Edge prefer webm, Safari prefers mp4.
 */
function getSupportedMimeType(): string {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
  ];
  for (const mime of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(mime)) {
      return mime;
    }
  }
  return 'audio/webm'; // fallback
}

export function useVoiceRecorder(): UseVoiceRecorderReturn {
  const [state, setState] = useState<RecordingStateValue>('idle');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const isSupported = typeof window !== 'undefined'
    && typeof navigator?.mediaDevices?.getUserMedia === 'function'
    && typeof MediaRecorder !== 'undefined';

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupStream();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const cleanupStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    if (!isSupported) {
      setError('Your browser does not support audio recording.');
      return;
    }

    setError(null);
    setAudioBlob(null);
    setDuration(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });
      streamRef.current = stream;

      const mimeType = getSupportedMimeType();
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        setState('idle');
        cleanupStream();
      };

      recorder.onerror = () => {
        setError('Recording failed. Please try again.');
        setState('idle');
        cleanupStream();
      };

      recorder.start(250); // collect data every 250ms
      startTimeRef.current = Date.now();
      setState('recording');

      // Live duration timer
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setDuration(elapsed);

        // Auto-stop at max
        if (elapsed >= MAX_RECORDING_SECONDS) {
          recorder.stop();
        }
      }, 250);
    } catch (err) {
      const msg = err instanceof DOMException && err.name === 'NotAllowedError'
        ? 'Microphone access is required for voice input. Please enable it in browser settings.'
        : 'Could not access microphone. Please check your device settings.';
      setError(msg);
      setState('idle');
      cleanupStream();
    }
  }, [isSupported, cleanupStream]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setState('processing');
    }
  }, []);

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    cleanupStream();
    setAudioBlob(null);
    setDuration(0);
    setState('idle');
  }, [cleanupStream]);

  const reset = useCallback(() => {
    cleanupStream();
    setAudioBlob(null);
    setDuration(0);
    setError(null);
    setState('idle');
  }, [cleanupStream]);

  return {
    state,
    audioBlob,
    duration,
    error,
    isSupported,
    startRecording,
    stopRecording,
    cancelRecording,
    reset,
  };
}
