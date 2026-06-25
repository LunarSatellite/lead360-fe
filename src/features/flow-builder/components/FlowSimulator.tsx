import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Loader2, RotateCcw, Mic as MicIcon } from 'lucide-react';
import { useFlowRuntimeMessage, useFlowRuntimeReset } from '../api/flow.queries';
import { FlowRuntimeStatus, type FlowRuntimeResult, type FlowMenuItemDto } from '../types/flow-runtime.types';
import { VoiceButton } from '@/features/voice/components/VoiceButton';
import { AudioMessage } from '@/features/voice/components/AudioMessage';
import { useTranscribeAudio } from '@/features/voice/api/voice.queries';

interface SimMsg {
  role: 'user' | 'bot';
  text: string;
  buttons?: FlowMenuItemDto[];
  debug?: FlowRuntimeResult;
  isVoice?: boolean;
  audioData?: string | null;
  audioMimeType?: string | null;
}

export function FlowSimulator() {
  const [msgs, setMsgs] = useState<SimMsg[]>([]);
  const [input, setInput] = useState('');
  const [sessionId] = useState(() => crypto.randomUUID());
  const [lastDebug, setLastDebug] = useState<FlowRuntimeResult | null>(null);
  const [isCollectingParam, setIsCollectingParam] = useState(false);
  const [isHandedOff, setIsHandedOff] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showDebug, setShowDebug] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const flowMessage = useFlowRuntimeMessage();
  const flowReset = useFlowRuntimeReset();
  const transcribe = useTranscribeAudio();

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs.length]);

  const handleFlowResponse = (result: FlowRuntimeResult) => {
    setLastDebug(result);
    setIsCollectingParam(false);

    switch (result.status) {
      case FlowRuntimeStatus.Response:
        setMsgs(p => [...p, {
          role: 'bot', text: result.response,
          buttons: result.menuItems?.length ? result.menuItems : undefined,
          debug: result,
        }]);
        break;

      case FlowRuntimeStatus.CollectingParams:
        setMsgs(p => [...p, { role: 'bot', text: result.response, debug: result }]);
        setIsCollectingParam(true);
        break;

      case FlowRuntimeStatus.Greeting:
        setMsgs(p => [...p, {
          role: 'bot', text: result.response,
          buttons: result.menuItems?.length ? result.menuItems : undefined,
          debug: result,
        }]);
        break;

      case FlowRuntimeStatus.AgentHandoff:
        setMsgs(p => [...p, { role: 'bot', text: result.response, debug: result }]);
        setIsHandedOff(true);
        break;

      case FlowRuntimeStatus.NoActiveFlow:
        setMsgs(p => [
          ...p,
          { role: 'bot', text: result.response, debug: result },
          { role: 'bot', text: '⚠️ Please configure and activate a flow in the Flow Builder first.' },
        ]);
        break;

      case FlowRuntimeStatus.Error:
        setMsgs(p => [...p, {
          role: 'bot', text: result.response || '❌ An error occurred.',
          buttons: result.menuItems?.length ? result.menuItems : undefined,
          debug: result,
        }]);
        break;

      default:
        setMsgs(p => [...p, { role: 'bot', text: result.response || 'Unknown response', debug: result }]);
    }
  };

  const sendMessage = (text: string) => {
    if (!text.trim() || flowMessage.isPending || isHandedOff) return;
    const msg = text.trim();
    setMsgs(p => [...p, { role: 'user', text: msg }]);
    setInput('');

    flowMessage.mutate(
      { SessionId: sessionId, Message: msg },
      {
        onSuccess: handleFlowResponse,
        onError: () => setMsgs(p => [...p, { role: 'bot', text: '❌ Connection failed.' }]),
      },
    );
  };

  const handleMenuClick = (item: FlowMenuItemDto) => {
    setMsgs(p => [...p, { role: 'user', text: item.label }]);
    flowMessage.mutate(
      { SessionId: sessionId, Message: item.value, ButtonLabel: item.label },
      {
        onSuccess: handleFlowResponse,
        onError: () => setMsgs(p => [...p, { role: 'bot', text: '❌ Connection failed.' }]),
      },
    );
  };

  // ─── Voice → transcribe → send through same /flow-runtime/message text endpoint ───
  // Mirrors the text-input path exactly, just with a transcription step first
  const handleVoiceRecording = useCallback(async (blob: Blob) => {
    setIsRecording(false);
    if (flowMessage.isPending || transcribe.isPending || isHandedOff) return;

    try {
      // Step 1: Transcribe audio → text
      const result = await transcribe.mutateAsync({ audio: blob });
      const text = result.text?.trim();

      if (!text) {
        setMsgs(p => [...p, { role: 'bot', text: 'Could not understand the audio. Please try again.' }]);
        return;
      }

      // Step 2: Add voice-tagged user bubble
      setMsgs(p => [...p, { role: 'user', text, isVoice: true }]);

      // Step 3: Send through the SAME flow-runtime text endpoint
      flowMessage.mutate(
        { SessionId: sessionId, Message: text },
        {
          onSuccess: handleFlowResponse,
          onError: () => setMsgs(p => [...p, { role: 'bot', text: '❌ Connection failed.' }]),
        },
      );
    } catch {
      setMsgs(p => [...p, { role: 'bot', text: '❌ Voice transcription failed.' }]);
    }
  }, [sessionId, flowMessage, transcribe, isHandedOff]);

  const handleReset = () => {
    flowReset.mutate(sessionId);
    setMsgs([]);
    setLastDebug(null);
    setIsCollectingParam(false);
    setIsHandedOff(false);
    setIsRecording(false);
  };

  const isProcessing = flowMessage.isPending || transcribe.isPending;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Chat header ── */}
      <div
        className="px-3 py-2 flex items-center gap-2 text-white flex-shrink-0"
        style={{ background: 'linear-gradient(135deg,#059669,#10B981)' }}
      >
        <div className="w-6 h-6 bg-[rgba(255,255,255,.2)] rounded-full flex items-center justify-center text-[10px]">🤖</div>
        <h4 className="text-2xs font-semibold flex-1 truncate">Lead360 Bot</h4>
        <button onClick={handleReset} className="p-1 rounded-md hover:bg-[rgba(255,255,255,.2)]" title="Reset session">
          <RotateCcw className="w-3 h-3" />
        </button>
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto p-2.5 min-h-0">
        {msgs.length === 0 && (
          <div className="text-2xs text-text-muted text-center py-6">
            Send a message or tap the mic to test the bot engine
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={`mb-2 ${m.role === 'user' ? 'text-right' : ''}`}>
            <div
              className="inline-block max-w-[92%] px-2.5 py-1.5 text-2xs leading-relaxed whitespace-pre-wrap"
              style={{
                borderRadius: 10,
                ...(m.role === 'user'
                  ? { background: 'linear-gradient(135deg,#059669,#10B981)', color: '#fff', borderBottomRightRadius: 3 }
                  : { background: '#0D1410', color: '#E8F0EC', borderBottomLeftRadius: 3, border: '1px solid #1E2E26' }),
              }}
            >
              {m.role === 'user' && m.isVoice && (
                <span className="inline-flex items-center gap-0.5 mr-1 text-[8px] font-bold opacity-70">
                  <MicIcon className="w-2 h-2" strokeWidth={2} />
                </span>
              )}
              {m.text}
              {m.role === 'bot' && m.audioData && (
                <div className="mt-1 -mx-0.5">
                  <AudioMessage audioData={m.audioData} audioMimeType={m.audioMimeType} compact autoPlay />
                </div>
              )}
            </div>
            {m.buttons && m.buttons.length > 0 && m.role === 'bot' && (
              <div className="mt-1 space-y-0.5" style={{ maxWidth: '92%' }}>
                {m.buttons.map((b, j) => (
                  <button key={j} onClick={() => handleMenuClick(b)}
                    className="block w-full py-1 px-2 rounded-md bg-brand-soft border border-brand/20 text-[10px] font-medium text-brand hover:bg-[rgba(0,217,126,0.12)] transition-colors text-left truncate">
                    {b.icon && <span className="mr-1">{b.icon}</span>}
                    {b.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        {isProcessing && (
          <div className="mb-2">
            <div className="inline-block px-2.5 py-1.5 text-2xs rounded-lg bg-bg-card border border-border-subtle text-text-secondary">
              <Loader2 className="w-3 h-3 animate-spin text-brand inline mr-1" />
              {transcribe.isPending ? 'Voice...' : 'Processing...'}
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* ── Input bar ── */}
      <div className="px-2.5 py-2 border-t border-border-subtle flex-shrink-0">
        {isHandedOff ? (
          <div className="px-2 py-1.5 text-2xs text-text-muted italic">
            Handed off to agent.{' '}
            <button onClick={handleReset} className="text-brand font-semibold underline">Reset</button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
              placeholder={
                isRecording ? 'Recording...'
                  : isCollectingParam ? 'Enter value...'
                  : 'Type a message...'
              }
              disabled={isRecording || isProcessing}
              className="flex-1 min-w-0 px-2.5 py-1.5 border border-border-subtle rounded-lg text-2xs outline-none focus:border-brand bg-bg-shell text-text-primary placeholder:text-text-muted disabled:opacity-40"
            />
            <VoiceButton
              onRecordingComplete={handleVoiceRecording}
              onRecordingStart={() => setIsRecording(true)}
              onRecordingCancel={() => setIsRecording(false)}
              isProcessing={transcribe.isPending}
              disabled={isProcessing}
              size="xs"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isProcessing || isRecording}
              className="w-7 h-7 rounded-md flex items-center justify-center text-white disabled:opacity-40 flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#059669,#10B981)' }}
            >
              <Send className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* ── Debug — collapsible, capped height ── */}
      <div className="border-t border-border-subtle flex-shrink-0">
        <button
          onClick={() => setShowDebug(d => !d)}
          className="w-full px-2.5 py-1.5 flex items-center justify-between text-2xs hover:bg-glass-1 transition-colors"
        >
          <span className="text-brand font-bold">🔍 Debug</span>
          <span className="text-text-muted text-[9px]">{showDebug ? '▾' : '▸'}</span>
        </button>
        {showDebug && (
          <div className="px-2.5 pb-2 space-y-0.5 text-2xs max-h-[120px] overflow-y-auto">
            <Row label="Status" value={lastDebug ? statusLabel(lastDebug.status) : '-'} />
            <Row label="Intent" value={lastDebug?.intentName || '-'} />
            <Row label="Confidence" value={lastDebug ? `${(lastDebug.intentConfidence * 100).toFixed(0)}%` : '-'} />
            <Row label="Node" value={lastDebug?.currentNodeKey || '-'} />
            <Row label="Type" value={lastDebug?.nodeType || '-'} />
            <Row label="Total" value={lastDebug ? `${lastDebug.totalTimeMs}ms` : '-'} />
            <Row label="Path" value={lastDebug?.flowPath?.join(' → ') || '-'} />
            {lastDebug?.apiCall && (
              <Row label="API" value={`${lastDebug.apiCall.statusCode} (${lastDebug.apiCall.responseTimeMs}ms) ${lastDebug.apiCall.success ? '✅' : '❌'}`} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-text-secondary flex-shrink-0">{label}</span>
      <span className="font-medium truncate text-right text-text-primary">{value}</span>
    </div>
  );
}

function statusLabel(status: number): string {
  switch (status) {
    case 1: return 'Response';
    case 2: return 'Collecting Params';
    case 3: return 'Greeting';
    case 4: return 'Agent Handoff';
    case 5: return 'No Active Flow';
    case 6: return 'Error';
    default: return `Unknown (${status})`;
  }
}
