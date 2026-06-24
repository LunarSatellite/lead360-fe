import { useRef, useEffect } from 'react';
import { Bot, User, Mic } from 'lucide-react';
import type { ChatBubble, TestInteractiveItem, TestProductCard } from '../types/test-channel.types';
import { ROUTING_PATH_COLOR } from '../types/test-channel.types';
import { AudioMessage } from '@/features/voice/components/AudioMessage';

interface ChatMessageAreaProps {
  messages: ChatBubble[];
  onButtonClick: (item: TestInteractiveItem) => void;
  onListSelect: (item: TestInteractiveItem) => void;
  selectedMessageId: string | null;
  onSelectMessage: (id: string | null) => void;
}

export function ChatMessageArea({
  messages,
  onButtonClick,
  onListSelect,
  selectedMessageId,
  onSelectMessage,
}: ChatMessageAreaProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-glass-2 flex items-center justify-center mx-auto mb-3">
            <Bot className="w-6 h-6 text-text-muted" strokeWidth={1.6} />
          </div>
          <p className="text-sm font-semibold text-text-secondary">No messages yet</p>
          <p className="text-xs text-text-muted mt-1">Send a message or pick a scenario to start testing</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {messages.map((msg) => {
        const isUser = msg.role === 'user';
        const isSelected = msg.id === selectedMessageId;
        const pathColor = msg.debug?.routingPath
          ? ROUTING_PATH_COLOR[msg.debug.routingPath] ?? 'muted'
          : undefined;

        return (
          <div
            key={msg.id}
            className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
          >
            <div
              onClick={() => !isUser && onSelectMessage(isSelected ? null : msg.id)}
              className={`max-w-[80%] group ${!isUser ? 'cursor-pointer' : ''}`}
            >
              {/* Avatar + bubble row */}
              <div className={`flex items-start gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
                {/* Avatar */}
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isUser
                      ? 'bg-gradient-to-br from-brand to-pink-500'
                      : 'bg-gradient-to-br from-success to-[#059669]'
                  }`}
                >
                  {isUser ? (
                    <User className="w-3.5 h-3.5 text-text-primary" strokeWidth={2} />
                  ) : (
                    <Bot className="w-3.5 h-3.5 text-text-primary" strokeWidth={2} />
                  )}
                </div>

                {/* Bubble */}
                <div
                  className={`rounded-xl px-4 py-2.5 text-sm leading-relaxed border transition-all duration-150 ${
                    isUser
                      ? 'bg-brand-soft border-brand text-text-primary rounded-tr-sm'
                      : isSelected
                        ? 'bg-glass-2 border-border-medium text-text-primary rounded-tl-sm'
                        : 'bg-glass-1 border-border-subtle text-text-primary rounded-tl-sm group-hover:border-border-medium'
                  }`}
                >
                  {/* Voice input label for user messages */}
                  {isUser && msg.isVoice && (
                    <div className="flex items-center gap-1 mb-1">
                      <Mic className="w-2.5 h-2.5 text-brand-light" strokeWidth={2} />
                      <span className="text-[8px] font-bold text-brand-light uppercase tracking-wider">Voice</span>
                    </div>
                  )}

                  {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}

                  {/* Audio player for bot TTS responses */}
                  {!isUser && msg.audioData && (
                    <div className="mt-2 -mx-1">
                      <AudioMessage
                        audioData={msg.audioData}
                        audioMimeType={msg.audioMimeType}
                        compact
                      />
                    </div>
                  )}

                  {/* Buttons */}
                  {msg.buttons && msg.buttons.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {msg.buttons.map((btn) => (
                        <button
                          key={btn.id ?? btn.title}
                          onClick={(e) => {
                            e.stopPropagation();
                            onButtonClick(btn);
                          }}
                          className="px-3 py-1.5 rounded-lg border border-brand bg-brand-soft text-xs font-semibold
                                     text-brand hover:bg-glass-3 hover:brightness-110 transition-all"
                        >
                          {btn.title}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* List items */}
                  {msg.listItems && msg.listItems.length > 0 && (
                    <div className="mt-2.5 space-y-1">
                      {msg.listItems.map((item, idx) => (
                        <button
                          key={item.id ?? idx}
                          onClick={(e) => {
                            e.stopPropagation();
                            onListSelect(item);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg bg-glass-1 border border-border-subtle
                                     hover:bg-glass-2 hover:border-border-medium transition-all text-left"
                        >
                          <span className="w-5 h-5 rounded-md bg-glass-3 flex items-center justify-center text-[10px] font-extrabold text-text-muted flex-shrink-0">
                            {idx + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-text-primary truncate">{item.title}</div>
                            {item.description && (
                              <div className="text-[10px] text-text-muted truncate">{item.description}</div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Product cards */}
                  {msg.products && msg.products.length > 0 && (
                    <div className="mt-2.5 space-y-2">
                      {msg.products.map((product) => (
                        <ProductCardInline key={product.id ?? product.title} product={product} />
                      ))}
                    </div>
                  )}

                  {/* Routing path mini-badge (bot messages only) */}
                  {!isUser && msg.debug?.routingPath && (
                    <div className="mt-2 flex items-center gap-2">
                      <span
                        className={`inline-block w-1.5 h-1.5 rounded-full ${
                          pathColor === 'success' ? 'bg-success' :
                          pathColor === 'brand' ? 'bg-brand' :
                          pathColor === 'info' ? 'bg-info' :
                          pathColor === 'warning' ? 'bg-warning' :
                          pathColor === 'danger' ? 'bg-danger' : 'bg-text-muted'
                        }`}
                      />
                      <span className="text-[9px] font-semibold text-text-muted uppercase tracking-wider">
                        {msg.debug.routingPath}
                      </span>
                      {msg.debug.processingTimeMs > 0 && (
                        <span className="text-[9px] text-text-muted">{msg.debug.processingTimeMs}ms</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}

// ─── Inline Product Card ───

function ProductCardInline({ product }: { product: TestProductCard }) {
  return (
    <div className="flex gap-3 p-2.5 rounded-lg bg-glass-1 border border-border-subtle">
      {product.imageUrl && (
        <div className="w-14 h-14 rounded-lg bg-glass-2 overflow-hidden flex-shrink-0">
          <img
            src={product.imageUrl}
            alt={product.title ?? ''}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-xs font-bold text-text-primary truncate">{product.title}</div>
        {product.description && (
          <div className="text-[10px] text-text-muted mt-0.5 line-clamp-2">{product.description}</div>
        )}
        {product.price && (
          <div className="text-xs font-extrabold text-success mt-1">{product.price}</div>
        )}
      </div>
    </div>
  );
}
