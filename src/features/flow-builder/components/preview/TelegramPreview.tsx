import { useRef, useEffect } from 'react';
import { Mic } from 'lucide-react';

interface Message {
  role: 'user' | 'bot';
  text: string;
  buttons?: { label: string; value: string }[];
  isVoice?: boolean;
}

interface TelegramPreviewProps {
  messages: Message[];
  onButtonClick: (value: string, label: string) => void;
}

export function TelegramPreview({ messages, onButtonClick }: TelegramPreviewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  return (
    <div className="flex flex-col h-full" style={{ fontFamily: 'system-ui, sans-serif' }}>
      {/* Status bar */}
      <div className="flex items-center justify-between px-3 py-0.5 flex-shrink-0" style={{ background: '#427794', fontSize: 9, color: 'rgba(255,255,255,0.85)' }}>
        <span style={{ fontWeight: 600 }}>9:41</span>
        <span style={{ opacity: 0.7 }}>●●● WiFi 🔋</span>
      </div>

      {/* Header */}
      <div className="flex items-center gap-2 px-2.5 py-1.5 flex-shrink-0" style={{ background: '#517DA2' }}>
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0 font-bold" style={{ background: '#65B9F4' }}>🤖</div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-semibold text-white truncate leading-tight">OmniFlow Bot</div>
          <div className="text-[9px] leading-tight" style={{ color: 'rgba(255,255,255,0.6)' }}>bot</div>
        </div>
        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="rgba(255,255,255,0.7)" strokeWidth={2}>
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <svg className="w-3.5 h-3.5 flex-shrink-0 ml-2" fill="none" viewBox="0 0 24 24" stroke="rgba(255,255,255,0.7)" strokeWidth={2}>
          <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
        </svg>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 space-y-1.5" style={{ background: '#17212B' }}>
        {messages.length === 0 && (
          <div className="text-center py-6 text-[10px]" style={{ color: '#6C7883' }}>Send a message to start</div>
        )}
        {messages.map((m, i) => {
          const isUser = m.role === 'user';
          const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
          return (
            <div key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div style={{ maxWidth: '85%' }}>
                <div
                  className="px-2.5 py-1.5 text-[11px] leading-[1.45] whitespace-pre-wrap"
                  style={{
                    background: isUser ? '#2B5278' : '#182533',
                    color: '#fff',
                    borderRadius: isUser ? '8px 2px 8px 8px' : '2px 8px 8px 8px',
                    boxShadow: '0 1px 2px rgba(0,0,0,.3)',
                  }}
                >
                  {isUser && m.isVoice && (
                    <span className="inline-flex items-center gap-0.5 mr-1 text-[8px] font-bold opacity-60">
                      <Mic className="w-2 h-2" strokeWidth={2} />
                    </span>
                  )}
                  {m.text}
                  <span className="float-right ml-2 mt-0.5 text-[9px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    {time}
                    {isUser && <span className="ml-0.5">✓✓</span>}
                  </span>
                  <span style={{ display: 'block', clear: 'both', height: 0 }} />
                </div>
                {/* Inline keyboard buttons — grid 2-wide, scrollable if many */}
                {m.buttons && m.buttons.length > 0 && (
                  <div
                    className="mt-0.5 grid gap-px"
                    style={{
                      gridTemplateColumns: m.buttons.length === 1 ? '1fr' : '1fr 1fr',
                      maxHeight: 120,
                      overflowY: m.buttons.length > 6 ? 'auto' : 'visible',
                    }}
                  >
                    {m.buttons.map((b, j) => (
                      <button
                        key={j}
                        onClick={() => onButtonClick(b.value, b.label)}
                        className="py-1.5 px-2 text-[10px] font-medium text-center truncate transition-colors"
                        style={{
                          color: '#6AB3F3',
                          background: '#182533',
                          border: '1px solid #2B5278',
                          borderRadius: 4,
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#2B5278')}
                        onMouseLeave={e => (e.currentTarget.style.background = '#182533')}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Input bar (cosmetic) */}
      <div className="flex items-center gap-2 px-2 py-1.5 flex-shrink-0" style={{ background: '#17212B', borderTop: '1px solid #0d1821' }}>
        <div className="flex-1 flex items-center px-2.5 py-1" style={{ background: '#212D3B', borderRadius: 20, border: '1px solid #2B3A4A' }}>
          <span className="flex-1 text-[10px]" style={{ color: '#5A6A7A' }}>Message</span>
          <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="#5A6A7A" strokeWidth={2}>
            <path d="M14.5 10c-.83 0-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5z"/>
            <path d="M12 19v-3M19 10.5c0 3.87-3.13 7-7 7s-7-3.13-7-7"/>
          </svg>
        </div>
      </div>
    </div>
  );
}
