import { Mic } from 'lucide-react';

interface Message {
  role: 'user' | 'bot';
  text: string;
  buttons?: { label: string; value: string }[];
  isVoice?: boolean;
}

interface SmsPreviewProps {
  messages: Message[];
  onButtonClick: (value: string, label: string) => void;
}

export function SmsPreview({ messages, onButtonClick }: SmsPreviewProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-bg-elevated text-white">
        <div className="text-xs font-semibold">📱 SMS</div>
        <div className="flex-1" />
        <div className="text-[10px] opacity-60">Lead360 Bot</div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-3 space-y-2 bg-bg-shell">
        {messages.length === 0 && (
          <div className="text-center py-6 text-[10px] text-text-muted">Send a message to preview SMS</div>
        )}
        {messages.map((m, i) => (
          <div key={i}>
            {m.role === 'bot' ? (
              <div className="bg-bg-card rounded-2xl px-3 py-2 text-[11px] leading-relaxed max-w-[90%] whitespace-pre-wrap text-text-primary border border-border-subtle">
                {m.text}
                {m.buttons && m.buttons.length > 0 && (
                  <div className="mt-1.5 pt-1.5 border-t border-border-subtle">
                    {m.buttons.map((b, j) => (
                      <div key={j} className="text-[10px] text-text-secondary">
                        <button
                          onClick={() => onButtonClick(b.value, b.label)}
                          className="hover:text-brand cursor-pointer"
                        >
                          {j + 1}. {b.label}
                        </button>
                      </div>
                    ))}
                    <div className="text-[9px] text-text-muted mt-1 italic">Reply with a number</div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex justify-end">
                <div className="bg-[#007AFF] text-white rounded-2xl px-3 py-2 text-[11px] max-w-[80%] whitespace-pre-wrap">
                  {m.isVoice && (
                    <span className="inline-flex items-center gap-0.5 mr-1 text-[8px] font-bold opacity-60">
                      <Mic className="w-2 h-2" strokeWidth={2} />
                    </span>
                  )}
                  {m.text}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
