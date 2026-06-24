// ═══════════════════════════════════════════════════════════════
// AudioMessage — Inline audio player for chat bubbles
// Plays base64 audio data or audio URLs from TTS responses
// ═══════════════════════════════════════════════════════════════

import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';

interface AudioMessageProps {
  /** Base64-encoded audio data (from voice/message response) */
  audioData?: string | null;
  /** MIME type of the audio (e.g. "audio/mpeg") */
  audioMimeType?: string | null;
  /** Direct URL to audio file (alternative to base64) */
  audioUrl?: string | null;
  /** Auto-play when mounted */
  autoPlay?: boolean;
  /** Compact mode for small bubbles */
  compact?: boolean;
}

export function AudioMessage({
  audioData,
  audioMimeType,
  audioUrl,
  autoPlay = false,
  compact = false,
}: AudioMessageProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const objectUrlRef = useRef<string | null>(null);

  // Build audio source
  const audioSrc = audioData
    ? `data:${audioMimeType || 'audio/mpeg'};base64,${audioData}`
    : audioUrl ?? null;

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  // Auto-play
  useEffect(() => {
    if (autoPlay && audioRef.current && audioSrc) {
      audioRef.current.play().catch(() => {
        // Auto-play blocked by browser — ignore
      });
    }
  }, [autoPlay, audioSrc]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
    }
  }, [isPlaying]);

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const cur = audioRef.current.currentTime;
    const dur = audioRef.current.duration;
    setCurrentTime(cur);
    if (dur && isFinite(dur)) {
      setProgress((cur / dur) * 100);
    }
  };

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    const dur = audioRef.current.duration;
    if (dur && isFinite(dur)) setDuration(dur);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audioRef.current.currentTime = pct * duration;
  };

  if (!audioSrc) return null;

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`flex items-center gap-2 ${compact ? 'py-1' : 'py-1.5'}`}>
      <audio
        ref={audioRef}
        src={audioSrc}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        preload="metadata"
      />

      {/* Play/Pause button */}
      <button
        onClick={togglePlay}
        className={`flex-shrink-0 rounded-full flex items-center justify-center transition-all duration-150
          ${compact ? 'w-7 h-7' : 'w-8 h-8'}
          ${isPlaying
            ? 'bg-brand text-white'
            : 'bg-glass-2 text-text-secondary hover:bg-glass-3 hover:text-text-primary'
          }`}
      >
        {isPlaying ? (
          <Pause className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} strokeWidth={2} />
        ) : (
          <Play className={compact ? 'w-3 h-3 ml-0.5' : 'w-3.5 h-3.5 ml-0.5'} strokeWidth={2} />
        )}
      </button>

      {/* Progress bar */}
      <div className="flex-1 min-w-0">
        <div
          onClick={handleSeek}
          className="relative h-1.5 rounded-full bg-glass-2 cursor-pointer group"
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-brand transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
          {/* Thumb dot on hover */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-brand
                       opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ left: `calc(${progress}% - 5px)` }}
          />
        </div>
      </div>

      {/* Duration / Time */}
      <span className={`flex-shrink-0 font-semibold text-text-muted tabular-nums ${compact ? 'text-[9px]' : 'text-[10px]'}`}>
        {duration > 0 ? (
          isPlaying || currentTime > 0
            ? `${formatTime(currentTime)} / ${formatTime(duration)}`
            : formatTime(duration)
        ) : (
          <Volume2 className="w-3 h-3 text-text-muted" strokeWidth={1.6} />
        )}
      </span>
    </div>
  );
}
