import { useRef, useEffect } from 'react';
import { Mic, Smile, Paperclip, Send } from 'lucide-react';

interface Message {
  role: 'user' | 'bot';
  text: string;
  buttons?: { label: string; value: string }[];
  isVoice?: boolean;
}

interface WebChatPreviewProps {
  messages: Message[];
  onButtonClick: (value: string, label: string) => void;
  botName?: string;
}

export function WebChatPreview({ messages, onButtonClick, botName = 'OmniFlow Support' }: WebChatPreviewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  return (
    <div className="flex flex-col h-full" style={{ fontFamily: 'system-ui, sans-serif', background: '#fff' }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-2.5 py-2 flex-shrink-0" style={{ background: '#6C63FF', boxShadow: '0 2px 8px rgba(108,99,255,0.3)' }}>
        <div className="relative flex-shrink-0">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs" style={{ background: 'rgba(255,255,255,0.25)' }}>🤖</div>
          <div className="absolute bottom-0 right-0 w-2 h-2 rounded-full border border-[#6C63FF]" style={{ background: '#4ade80' }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-semibold text-white truncate leading-tight">{botName}</div>
          <div className="text-[9px] leading-tight" style={{ color: 'rgba(255,255,255,0.7)' }}>● Online</div>
        </div>
        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="rgba(255,255,255,0.7)" strokeWidth={2}>
          <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
        </svg>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-2.5 space-y-2" style={{ background: '#F9F9FB' }}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-6 gap-1">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-base" style={{ background: '#EEE' }}>👋</div>
            <span className="text-[10px]" style={{ color: '#aaa' }}>How can we help?</span>
          </div>
        )}
        {messages.map((m, i) => {
          const isUser = m.role === 'user';
          const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
          return (
            <div key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'} items-end gap-1.5`}>
              {!isUser && (
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] flex-shrink-0 mb-0.5" style={{ background: '#6C63FF' }}>🤖</div>
              )}
              <div style={{ maxWidth: '82%' }}>
                <div
                  className="px-2.5 py-2 text-[11px] leading-[1.45] whitespace-pre-wrap"
                  style={
                    isUser
                      ? { background: '#6C63FF', color: '#fff', borderRadius: '14px 14px 4px 14px', boxShadow: '0 1px 3px rgba(108,99,255,0.25)' }
                      : { background: '#fff', color: '#1a1a1a', borderRadius: '14px 14px 14px 4px', border: '1px solid #eee', boxShadow: '0 1px 3px rgba(0,0,0,.06)' }
                  }
                >
                  {isUser && m.isVoice && (
                    <span className="inline-flex items-center gap-0.5 mr-1 text-[8px] font-bold" style={{ opacity: 0.7 }}>
                      <Mic className="w-2 h-2" strokeWidth={2} />
                      Voice
                    </span>
                  )}
                  {m.text}
                </div>
                {/* Quick-reply chips — wrap naturally for any count */}
                {m.buttons && m.buttons.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {m.buttons.map((b, j) => (
                      <button
                        key={j}
                        onClick={() => onButtonClick(b.value, b.label)}
                        className="px-2.5 py-1 text-[10px] font-medium transition-colors truncate"
                        style={{
                          background: '#fff',
                          color: '#6C63FF',
                          border: '1px solid #6C63FF',
                          borderRadius: 20,
                          maxWidth: 130,
                        }}
                        onMouseEnter={e => { (e.currentTarget.style.background = '#6C63FF'); (e.currentTarget.style.color = '#fff'); }}
                        onMouseLeave={e => { (e.currentTarget.style.background = '#fff'); (e.currentTarget.style.color = '#6C63FF'); }}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                )}
                <div className="mt-0.5 px-0.5 text-[9px]" style={{ color: '#bbb', textAlign: isUser ? 'right' : 'left' }}>{time}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input bar (cosmetic) */}
      <div className="flex items-center gap-1.5 px-2 py-1.5 flex-shrink-0" style={{ background: '#fff', borderTop: '1px solid #eee' }}>
        <Smile className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#bbb' }} />
        <div className="flex-1 text-[10px] px-2 py-1 rounded-full" style={{ background: '#F0F0F5', color: '#aaa' }}>
          Type a message…
        </div>
        <Paperclip className="w-3 h-3 flex-shrink-0" style={{ color: '#bbb' }} />
        <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#6C63FF' }}>
          <Send className="w-3 h-3 text-white" />
        </div>
      </div>
    </div>
  );
}
