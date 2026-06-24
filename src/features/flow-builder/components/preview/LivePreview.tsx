import { useState, useCallback } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { WhatsAppPreview, type WaMessage } from './WhatsAppPreview';
import { TelegramPreview } from './TelegramPreview';
import { WebChatPreview } from './WebChatPreview';
import { SmsPreview } from './SmsPreview';
import { useFlowRuntimeMessage } from '../../api/flow.queries';
import { useTranscribeAudio } from '@/features/voice/api/voice.queries';
import { VoiceButton } from '@/features/voice/components/VoiceButton';
import type { FlowMenuItemDto } from '../../types/flow-runtime.types';

/** Shared message shape for non-WhatsApp channels (buttons only) */
interface SimpleMessage {
  role: 'user' | 'bot';
  text: string;
  buttons?: { label: string; value: string }[];
  isVoice?: boolean;
}

const CHANNELS = ['WhatsApp', 'Telegram', 'WebChat', 'SMS'] as const;

export function LivePreview() {
  const [input, setInput] = useState('');
  const [sessionId] = useState(() => crypto.randomUUID());
  const [isRecording, setIsRecording] = useState(false);
  const [waMessages, setWaMessages] = useState<WaMessage[]>([]);
  const [channelMessages, setChannelMessages] = useState<Record<string, SimpleMessage[]>>({
    Telegram: [], WebChat: [], SMS: [],
  });

  const flowMessage = useFlowRuntimeMessage();
  const transcribe = useTranscribeAudio();

  const sendMessage = useCallback(
    (text: string, isVoice = false, displayText?: string) => {
      if (!text.trim() || flowMessage.isPending) return;
      const msg = text.trim();
      const display = displayText?.trim() || msg;

      // Add user message — WhatsApp uses its own state
      setWaMessages(prev => [...prev, { role: 'user', text: display, isVoice, ts: Date.now() }]);
      setChannelMessages(prev => {
        const next = { ...prev };
        for (const ch of ['Telegram', 'WebChat', 'SMS'] as const)
          next[ch] = [...(next[ch] || []), { role: 'user' as const, text: display, isVoice }];
        return next;
      });
      setInput('');

      // Single call to flow-runtime — menuItems included in response
      flowMessage.mutate(
        { SessionId: sessionId, Message: msg },
        {
          onSuccess: (res) => {
            const toWaItems = (items: FlowMenuItemDto[]) =>
              items.map(item => ({
                label:       item.label,
                value:       item.value,
                icon:        item.icon,
                description: item.description,
                section:     item.section,
              }));

            const botTs = Date.now();
            // Product cards that appear BEFORE the main list (catalog items view)
            const extraWaMsgs = (res.additionalMessages ?? []).map(m => ({
              role: 'bot' as const,
              text: m.response || '',
              items: m.menuItems && m.menuItems.length > 0 ? toWaItems(m.menuItems) : undefined,
              imageUrl: m.imageUrl,
              ts: botTs,
            }));

            // Main bot message (list anchor or regular response)
            const waItems = toWaItems(res.menuItems ?? []);
            setWaMessages(prev => [
              ...prev,
              ...extraWaMsgs,
              {
                role: 'bot',
                text: res.response || 'No response',
                items: waItems.length > 0 ? waItems : undefined,
                imageUrl: res.imageUrl,
                ts: botTs,
              },
            ]);

            // Other channels: product cards as simple button sets, then main response
            const toSimpleButtons = (items: FlowMenuItemDto[]) =>
              items.map(item => ({
                label: item.icon ? `${item.icon} ${item.label}` : item.label,
                value: item.value,
              }));

            setChannelMessages(prev => {
              const next = { ...prev };
              for (const ch of ['Telegram', 'WebChat', 'SMS'] as const) {
                const extraMsgs = (res.additionalMessages ?? []).map(m => ({
                  role: 'bot' as const,
                  text: m.response || '',
                  buttons: m.menuItems && m.menuItems.length > 0 ? toSimpleButtons(m.menuItems) : undefined,
                }));
                const simpleButtons = toSimpleButtons(res.menuItems ?? []);
                next[ch] = [
                  ...(next[ch] || []),
                  ...extraMsgs,
                  {
                    role: 'bot' as const,
                    text: res.response || 'No response',
                    buttons: simpleButtons.length > 0 ? simpleButtons : undefined,
                  },
                ];
              }
              return next;
            });
          },
          onError: () => {
            const errMsg = { role: 'bot' as const, text: '❌ Execution error' };
            setWaMessages(prev => [...prev, errMsg]);
            setChannelMessages(prev => {
              const next = { ...prev };
              for (const ch of ['Telegram', 'WebChat', 'SMS'] as const)
                next[ch] = [...(next[ch] || []), errMsg];
              return next;
            });
          },
        },
      );
    },
    [flowMessage, sessionId],
  );

  const handleButtonClick = useCallback(
    (value: string, label: string) => {
      sendMessage(value, false, label);
    },
    [sendMessage],
  );

  // ─── Voice → transcribe → send through normal sendMessage (which all channels see) ───
  const handleVoiceRecording = useCallback(
    async (blob: Blob) => {
      setIsRecording(false);
      if (flowMessage.isPending || transcribe.isPending) return;

      try {
        const result = await transcribe.mutateAsync({ audio: blob });
        const text = result.text?.trim();
        if (!text) {
          const errMsg = { role: 'bot' as const, text: 'Could not understand the audio.' };
          setWaMessages(prev => [...prev, errMsg]);
          setChannelMessages(prev => {
            const next = { ...prev };
            for (const ch of ['Telegram', 'WebChat', 'SMS'] as const)
              next[ch] = [...(next[ch] || []), errMsg];
            return next;
          });
          return;
        }
        sendMessage(text, true);
      } catch {
        const errMsg = { role: 'bot' as const, text: '❌ Voice transcription failed' };
        setWaMessages(prev => [...prev, errMsg]);
        setChannelMessages(prev => {
          const next = { ...prev };
          for (const ch of ['Telegram', 'WebChat', 'SMS'] as const)
            next[ch] = [...(next[ch] || []), errMsg];
          return next;
        });
      }
    },
    [flowMessage.isPending, transcribe, sendMessage],
  );

  const isProcessing = flowMessage.isPending || transcribe.isPending;

  return (
    <div className="flex flex-col h-full">
      {/* Channel Previews Grid */}
      <div className="flex-1 grid grid-cols-4 gap-2 p-3 overflow-hidden">
        {CHANNELS.map((ch) => (
          <div key={ch} className="flex flex-col rounded-xl overflow-hidden border border-border-subtle bg-white min-h-0">
            <div className="text-center text-[10px] font-bold uppercase tracking-wider py-1 bg-glass-1 text-text-muted border-b border-border-subtle">
              {ch}
            </div>
            <div className="flex-1 overflow-hidden">
              {ch === 'WhatsApp' && <WhatsAppPreview messages={waMessages} onButtonClick={handleButtonClick} />}
              {ch === 'Telegram' && <TelegramPreview messages={channelMessages.Telegram || []} onButtonClick={handleButtonClick} />}
              {ch === 'WebChat' && <WebChatPreview messages={channelMessages.WebChat || []} onButtonClick={handleButtonClick} />}
              {ch === 'SMS' && <SmsPreview messages={channelMessages.SMS || []} onButtonClick={handleButtonClick} />}
            </div>
          </div>
        ))}
      </div>

      {/* Shared Input */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-border-subtle bg-white">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
          placeholder={isRecording ? 'Recording...' : 'Type a message (sends to all channels)...'}
          disabled={isRecording || isProcessing}
          className="flex-1 px-3 py-2 border border-border-subtle rounded-lg text-sm outline-none focus:border-brand disabled:opacity-40"
        />
        <VoiceButton
          onRecordingComplete={handleVoiceRecording}
          onRecordingStart={() => setIsRecording(true)}
          onRecordingCancel={() => setIsRecording(false)}
          isProcessing={transcribe.isPending}
          disabled={isProcessing}
          size="sm"
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || isProcessing || isRecording}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-40 flex items-center gap-1.5"
          style={{ background: 'linear-gradient(135deg,#059669,#10B981)' }}
        >
          {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Send
        </button>
      </div>
    </div>
  );
}
