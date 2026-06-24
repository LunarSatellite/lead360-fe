import { useState, useRef, useEffect, useCallback } from 'react';
import { Loader2, Send, Mic as MicIcon } from 'lucide-react';
import { useChatModifyFlow } from '../api/flow.queries';
import { useTranscribeAudio } from '@/features/voice/api/voice.queries';
import { VoiceButton } from '@/features/voice/components/VoiceButton';
import type { FlowDto, LlmConversationEntry } from '../types/flow.types';

interface AiChatPanelProps {
  flowId: string | null;
  llmConversationJson: string | null;
  onFlowUpdated: (flow: FlowDto) => void;
}

interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
  isVoice?: boolean;
}

export function AiChatPanel({ flowId, llmConversationJson, onFlowUpdated }: AiChatPanelProps) {
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatModify = useChatModifyFlow();
  const transcribe = useTranscribeAudio();

  // Parse conversation history from backend
  const history: ChatMsg[] = (() => {
    if (!llmConversationJson) return [];
    try {
      const parsed = JSON.parse(llmConversationJson) as LlmConversationEntry[];
      return parsed.map((e) => ({ role: e.role === 'user' ? 'user' as const : 'assistant' as const, content: e.content }));
    } catch {
      return [];
    }
  })();

  const [localMsgs, setLocalMsgs] = useState<ChatMsg[]>([
    { role: 'assistant', content: '👋 Hi! I can modify your flow. Try:\n• "Add error handling"\n• "Add a welcome message"\n• "Route complaints to agents"\n\n💡 Tap the mic to speak your instructions.' },
  ]);

  // Merge backend history + local
  const allMessages = [...history, ...localMsgs];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allMessages.length]);

  /** Send a text message to the AI flow modifier */
  const sendText = useCallback((msg: string, isVoice = false) => {
    if (!msg.trim() || !flowId || chatModify.isPending) return;
    setLocalMsgs((p) => [...p, { role: 'user', content: msg, isVoice }]);
    setInput('');

    chatModify.mutate(
      { id: flowId, data: { Message: msg } },
      {
        onSuccess: (flow) => {
          setLocalMsgs((p) => [
            ...p,
            {
              role: 'assistant',
              content: `✅ Flow updated to v${flow.version} (${flow.nodeCount} nodes, ${flow.connectionCount} connections)`,
            },
          ]);
          onFlowUpdated(flow);
        },
        onError: () => {
          setLocalMsgs((p) => [
            ...p,
            { role: 'assistant', content: "❌ Sorry, I couldn't process that. Try rephrasing." },
          ]);
        },
      },
    );
  }, [flowId, chatModify, onFlowUpdated]);

  const handleSend = () => sendText(input);

  /** Voice → transcribe → send through same chatModify text endpoint */
  const handleVoiceRecording = useCallback(async (blob: Blob) => {
    setIsRecording(false);
    if (!flowId || chatModify.isPending || transcribe.isPending) return;

    try {
      const result = await transcribe.mutateAsync({ audio: blob });
      const text = result.text?.trim();
      if (!text) {
        setLocalMsgs((p) => [...p, { role: 'assistant', content: 'Could not understand the audio. Please try again.' }]);
        return;
      }
      sendText(text, true);
    } catch {
      setLocalMsgs((p) => [...p, { role: 'assistant', content: '❌ Voice transcription failed.' }]);
    }
  }, [flowId, chatModify.isPending, transcribe, sendText]);

  const isProcessing = chatModify.isPending || transcribe.isPending;
  const isInputDisabled = !flowId || isProcessing || isRecording;

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-auto px-3 py-2">
        {allMessages.map((m, i) => (
          <div key={i} className={`mb-2 ${m.role === 'user' ? 'text-right' : ''}`}>
            <div
              className="inline-block max-w-[90%] px-3 py-2 text-2xs leading-relaxed whitespace-pre-wrap"
              style={{
                borderRadius: 10,
                ...(m.role === 'user'
                  ? {
                      background: 'linear-gradient(135deg,#059669,#10B981)',
                      color: '#fff',
                      borderBottomRightRadius: 3,
                    }
                  : { background: '#F1F5F9', color: '#475569', borderBottomLeftRadius: 3 }),
              }}
            >
              {m.role === 'user' && m.isVoice && (
                <span className="inline-flex items-center gap-0.5 mr-1 text-[8px] font-bold opacity-70">
                  <MicIcon className="w-2 h-2" strokeWidth={2} />
                </span>
              )}
              {m.content}
            </div>
          </div>
        ))}

        {chatModify.isPending && (
          <div className="mb-2">
            <div
              className="inline-block px-3 py-2 text-2xs rounded-[10px]"
              style={{
                background: 'linear-gradient(90deg,#F3E8FF,#FCE7F3,#F3E8FF)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 2s linear infinite',
              }}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-xs">🧠</span>
                <span className="text-[#7C3AED] font-semibold">Modifying flow...</span>
              </div>
            </div>
          </div>
        )}
        {transcribe.isPending && (
          <div className="mb-2">
            <div className="inline-block px-3 py-2 text-2xs rounded-[10px] bg-bg-card border border-border-subtle text-text-secondary">
              <Loader2 className="w-3 h-3 animate-spin text-brand inline mr-1" />
              Transcribing...
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="flex items-center gap-1.5 p-2.5 border-t border-border-subtle">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={
            isRecording ? 'Recording...'
              : !flowId ? 'Generate a flow first'
              : 'Ask AI to modify...'
          }
          disabled={isInputDisabled}
          className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg bg-glass-1 border border-border-subtle text-2xs text-text-primary outline-none focus:border-brand disabled:opacity-50"
        />
        <VoiceButton
          onRecordingComplete={handleVoiceRecording}
          onRecordingStart={() => setIsRecording(true)}
          onRecordingCancel={() => setIsRecording(false)}
          isProcessing={transcribe.isPending}
          disabled={!flowId || chatModify.isPending}
          size="xs"
        />
        <button
          onClick={handleSend}
          disabled={!flowId || !input.trim() || isProcessing || isRecording}
          className="w-7 h-7 rounded-md flex items-center justify-center text-white border-none cursor-pointer disabled:opacity-40 flex-shrink-0"
          style={{ background: '#059669' }}
        >
          {chatModify.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
        </button>
      </div>
    </div>
  );
}
