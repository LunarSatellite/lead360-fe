// ═══════════════════════════════════════════════════════════════
// VoiceSettingsPanel — Voice config section for tenant settings
// Toggle voice input, TTS, select voice/model/speed with preview
// ═══════════════════════════════════════════════════════════════

import { useState, useCallback, useRef, useEffect } from 'react';
import { Mic, Volume2, Play, Pause, Loader2, AlertTriangle } from 'lucide-react';
import { voiceApi } from '../api/voice.api';
import {
  TtsVoice,
  TtsModel,
  TTS_VOICE_LABEL,
  TTS_VOICE_DESC,
  TTS_MODEL_LABEL,
  TTS_SPEED_OPTIONS,
  DEFAULT_VOICE_SETTINGS,
  type VoiceSettings,
  type TtsVoiceValue,
  type TtsModelValue,
} from '../types/voice.types';

interface VoiceSettingsPanelProps {
  settings: VoiceSettings;
  onChange: (settings: VoiceSettings) => void;
}

export function VoiceSettingsPanel({ settings, onChange }: VoiceSettingsPanelProps) {
  const s = { ...DEFAULT_VOICE_SETTINGS, ...settings };

  const update = (patch: Partial<VoiceSettings>) => {
    onChange({ ...s, ...patch });
  };

  return (
    <div className="space-y-5">
      {/* Section header */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-brand-soft flex items-center justify-center">
          <Mic className="w-4 h-4 text-brand" strokeWidth={1.8} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-text-primary">Voice Settings</h3>
          <p className="text-[10px] text-text-muted">Configure voice input and text-to-speech for your chatbot</p>
        </div>
      </div>

      {/* Toggle: Enable voice input */}
      <ToggleRow
        label="Enable voice input"
        description="Allow users to send voice messages in the WebChat widget"
        checked={s.enableVoiceInput}
        onChange={(v) => update({ enableVoiceInput: v })}
      />

      {/* Toggle: Enable TTS responses */}
      <ToggleRow
        label="Enable voice responses (TTS)"
        description="Bot replies will include audio playback"
        checked={s.enableVoiceResponses}
        onChange={(v) => update({ enableVoiceResponses: v })}
        warning={s.enableVoiceResponses ? 'TTS incurs additional API costs per message.' : undefined}
      />

      {/* TTS settings (only shown when TTS is enabled) */}
      {s.enableVoiceResponses && (
        <div className="ml-1 pl-4 border-l border-l-border-subtle space-y-4">
          {/* Voice selector */}
          <VoiceSelector
            value={s.ttsVoice}
            onChange={(v) => update({ ttsVoice: v })}
          />

          {/* Model selector */}
          <SelectRow
            label="TTS Model"
            value={s.ttsModel}
            options={Object.values(TtsModel).map((v) => ({
              value: v,
              label: TTS_MODEL_LABEL[v as TtsModelValue],
            }))}
            onChange={(v) => update({ ttsModel: v as TtsModelValue })}
          />

          {/* Speed selector */}
          <SelectRow
            label="Speech Speed"
            value={String(s.ttsSpeed)}
            options={TTS_SPEED_OPTIONS.map((o) => ({
              value: String(o.value),
              label: o.label,
            }))}
            onChange={(v) => update({ ttsSpeed: parseFloat(v) })}
          />
        </div>
      )}
    </div>
  );
}

// ─── Toggle Row ───

function ToggleRow({
  label,
  description,
  checked,
  onChange,
  warning,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  warning?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 p-3 rounded-xl bg-glass-1 border border-border-subtle">
      <div className="flex-1 min-w-0">
        <div className="text-xs font-bold text-text-primary">{label}</div>
        <div className="text-[10px] text-text-muted mt-0.5">{description}</div>
        {warning && (
          <div className="flex items-center gap-1.5 mt-1.5">
            <AlertTriangle className="w-3 h-3 text-warning flex-shrink-0" strokeWidth={2} />
            <span className="text-[9px] font-semibold text-warning">{warning}</span>
          </div>
        )}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5.5 rounded-full transition-all duration-200 flex-shrink-0 mt-0.5
          ${checked ? 'bg-brand' : 'bg-glass-3'}`}
        style={{ minHeight: 22 }}
      >
        <span
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200
            ${checked ? 'translate-x-[22px]' : 'translate-x-0.5'}`}
        />
      </button>
    </div>
  );
}

// ─── Select Row ───

function SelectRow({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-1.5 rounded-lg bg-glass-2 border border-border-subtle text-xs text-text-primary
                   font-medium focus:outline-none focus:border-brand transition-all appearance-none cursor-pointer"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-bg-shell text-text-primary">
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// ─── Voice Selector with Preview ───

function VoiceSelector({
  value,
  onChange,
}: {
  value: TtsVoiceValue;
  onChange: (v: TtsVoiceValue) => void;
}) {
  const [previewingVoice, setPreviewingVoice] = useState<TtsVoiceValue | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  const handlePreview = useCallback(async (voice: TtsVoiceValue) => {
    // Stop current playback
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    if (previewingVoice === voice) {
      setPreviewingVoice(null);
      return;
    }

    setPreviewingVoice(voice);
    setIsLoadingPreview(true);

    try {
      const blob = await voiceApi.synthesize({
        Text: `Hi there! I'm the ${TTS_VOICE_LABEL[voice]} voice. How can I help you today?`,
        Voice: voice,
        Model: 'tts-1',
        Speed: 1.0,
      });

      const url = URL.createObjectURL(blob);
      objectUrlRef.current = url;

      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => setPreviewingVoice(null);
      audio.onerror = () => setPreviewingVoice(null);
      await audio.play();
    } catch {
      setPreviewingVoice(null);
    } finally {
      setIsLoadingPreview(false);
    }
  }, [previewingVoice]);

  const voices = Object.values(TtsVoice) as TtsVoiceValue[];

  return (
    <div>
      <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block mb-2">
        TTS Voice
      </span>
      <div className="space-y-1.5">
        {voices.map((v) => {
          const isSelected = v === value;
          const isPreviewing = v === previewingVoice;

          return (
            <div
              key={v}
              onClick={() => onChange(v)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg border cursor-pointer transition-all duration-150
                ${isSelected
                  ? 'bg-brand-soft border-brand/20'
                  : 'bg-glass-1 border-border-subtle hover:bg-glass-2 hover:border-border-medium'
                }`}
            >
              {/* Radio dot */}
              <div
                className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center flex-shrink-0
                  ${isSelected ? 'border-brand' : 'border-border-medium'}`}
              >
                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-brand" />}
              </div>

              {/* Label */}
              <div className="flex-1 min-w-0">
                <div className={`text-xs font-bold ${isSelected ? 'text-brand' : 'text-text-primary'}`}>
                  {TTS_VOICE_LABEL[v]}
                </div>
                <div className="text-[9px] text-text-muted">{TTS_VOICE_DESC[v]}</div>
              </div>

              {/* Preview button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePreview(v);
                }}
                className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all
                  ${isPreviewing
                    ? 'bg-brand text-white'
                    : 'bg-glass-2 text-text-muted hover:text-brand hover:bg-brand-soft'
                  }`}
                title={isPreviewing ? 'Stop preview' : 'Preview voice'}
              >
                {isPreviewing && isLoadingPreview ? (
                  <Loader2 className="w-3 h-3 animate-spin" strokeWidth={2} />
                ) : isPreviewing ? (
                  <Pause className="w-3 h-3" strokeWidth={2} />
                ) : (
                  <Play className="w-3 h-3 ml-0.5" strokeWidth={2} />
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
