import { useState, useRef, useEffect } from 'react';
import { List, X, Phone, Video, MoreVertical, Smile, Paperclip, Mic, ChevronLeft, Check, CheckCheck } from 'lucide-react';

export interface WaMenuItem {
  label: string;
  value: string;
  icon?: string;
  description?: string;
  section?: string;
}

export interface WaMessage {
  role: 'user' | 'bot';
  text: string;
  items?: WaMenuItem[];
  imageUrl?: string;
  isVoice?: boolean;
  ts?: number; // unix ms — set when message is created
}

interface WhatsAppPreviewProps {
  messages: WaMessage[];
  onButtonClick: (value: string, label: string) => void;
  botName?: string;
}

interface BottomSheetState {
  open: boolean;
  items: WaMenuItem[];
}

// WhatsApp SVG background pattern (subtle cross-stitch)
const WA_BG = `url("data:image/svg+xml,%3Csvg width='304' height='304' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='p' width='76' height='76' patternUnits='userSpaceOnUse'%3E%3Cpath d='M38 2 L38 74 M2 38 L74 38' stroke='%23b2b0a9' stroke-width='0.4' opacity='0.35'/%3E%3Ccircle cx='38' cy='38' r='1.5' fill='%23b2b0a9' opacity='0.25'/%3E%3Ccircle cx='2' cy='2' r='1' fill='%23b2b0a9' opacity='0.2'/%3E%3Ccircle cx='74' cy='2' r='1' fill='%23b2b0a9' opacity='0.2'/%3E%3Ccircle cx='2' cy='74' r='1' fill='%23b2b0a9' opacity='0.2'/%3E%3Ccircle cx='74' cy='74' r='1' fill='%23b2b0a9' opacity='0.2'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='304' height='304' fill='%23e5ddd5'/%3E%3Crect width='304' height='304' fill='url(%23p)'/%3E%3C/svg%3E")`;

function fmtTime(ts?: number): string {
  const d = ts ? new Date(ts) : new Date();
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

export function WhatsAppPreview({ messages, onButtonClick, botName = 'Business Bot' }: WhatsAppPreviewProps) {
  const [sheet, setSheet] = useState<BottomSheetState>({ open: false, items: [] });
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const openSheet = (items: WaMenuItem[]) => setSheet({ open: true, items });
  const closeSheet = () => setSheet(s => ({ ...s, open: false }));
  const handleSelect = (value: string, label: string) => {
    closeSheet();
    onButtonClick(value, label);
  };

  const groupBySections = (items: WaMenuItem[]) =>
    Object.entries(
      items.reduce<Record<string, WaMenuItem[]>>((acc, item) => {
        const key = item.section ?? 'Options';
        (acc[key] ??= []).push(item);
        return acc;
      }, {})
    );

  return (
    <div
      className="flex flex-col h-full relative overflow-hidden"
      style={{ fontFamily: '-apple-system, "Helvetica Neue", Arial, sans-serif' }}
    >
      {/* ── Status bar ── */}
      <div
        className="flex items-center justify-between px-3 py-0.5 flex-shrink-0"
        style={{ background: '#055C4B', fontSize: 9, color: 'rgba(255,255,255,0.85)' }}
      >
        <span style={{ fontWeight: 600 }}>9:41</span>
        <div className="flex items-center gap-1.5">
          <svg width="10" height="8" viewBox="0 0 10 8" fill="currentColor" opacity={0.9}>
            <rect x="0" y="4" width="2" height="4" rx="0.5"/>
            <rect x="2.5" y="2.5" width="2" height="5.5" rx="0.5"/>
            <rect x="5" y="1" width="2" height="7" rx="0.5"/>
            <rect x="7.5" y="0" width="2" height="8" rx="0.5"/>
          </svg>
          <svg width="11" height="8" viewBox="0 0 11 8" fill="currentColor" opacity={0.9}>
            <path d="M5.5 1.5C3.2 1.5 1.2 2.5 0 4.1l1.1 1.1C2.1 3.8 3.7 3 5.5 3s3.4.8 4.4 2.2L11 4.1C9.8 2.5 7.8 1.5 5.5 1.5z"/>
            <circle cx="5.5" cy="6.5" r="1.2"/>
          </svg>
          <svg width="16" height="8" viewBox="0 0 16 8" fill="currentColor" opacity={0.9}>
            <rect x="0" y="1" width="13" height="6" rx="1.5" stroke="currentColor" strokeWidth="0.8" fill="none"/>
            <rect x="13.5" y="2.5" width="1.5" height="3" rx="0.8"/>
            <rect x="1" y="2" width="9" height="4" rx="0.8"/>
          </svg>
        </div>
      </div>

      {/* ── Header ── */}
      <div className="flex items-center gap-2 px-2 py-1.5 flex-shrink-0" style={{ background: '#075E54' }}>
        <ChevronLeft className="w-4 h-4 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.85)' }} strokeWidth={2.5} />
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 font-bold"
          style={{ background: '#25D366', color: '#fff' }}
        >
          🤖
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-semibold text-white truncate leading-tight">{botName}</div>
          <div className="text-[9px] leading-tight" style={{ color: 'rgba(255,255,255,0.6)' }}>online</div>
        </div>
        <Video className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.8)' }} />
        <Phone className="w-3.5 h-3.5 flex-shrink-0 ml-1.5" style={{ color: 'rgba(255,255,255,0.8)' }} />
        <MoreVertical className="w-3.5 h-3.5 flex-shrink-0 ml-1.5" style={{ color: 'rgba(255,255,255,0.8)' }} />
      </div>

      {/* ── Chat area ── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto py-2 px-2 space-y-1"
        style={{ background: WA_BG, backgroundSize: '304px 304px' }}
      >
        {messages.length === 0 && (
          <div className="flex justify-center mt-6">
            <div
              className="px-3 py-1.5 rounded-full text-[9px]"
              style={{ background: 'rgba(225,221,216,0.92)', color: '#5a5a5a', boxShadow: '0 1px 2px rgba(0,0,0,.12)' }}
            >
              Messages are end-to-end encrypted
            </div>
          </div>
        )}

        {messages.map((m, i) => {
          const isBot = m.role === 'bot';
          const count = m.items?.length ?? 0;
          const isList = isBot && count > 3;
          const isButtons = isBot && count > 0 && count <= 3;
          const time = fmtTime(m.ts);

          return (
            <div key={i} className={`flex ${isBot ? 'justify-start' : 'justify-end'} items-end gap-0.5`}>
              <div style={{ maxWidth: '85%', position: 'relative' }}>

                {/* Image header */}
                {isBot && m.imageUrl && (
                  <div className="rounded-t-lg overflow-hidden" style={{ maxHeight: 110 }}>
                    <img
                      src={m.imageUrl}
                      alt=""
                      className="w-full object-cover"
                      style={{ maxHeight: 110 }}
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                )}

                {/* Bubble tail (pseudo-triangle) */}
                {!m.imageUrl && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      ...(isBot
                        ? { left: -5, borderWidth: '0 6px 6px 0', borderColor: 'transparent #fff transparent transparent' }
                        : { right: -5, borderWidth: '0 0 6px 6px', borderColor: 'transparent transparent transparent #075E54' }),
                      width: 0,
                      height: 0,
                      borderStyle: 'solid',
                    }}
                  />
                )}

                {/* Bubble */}
                <div
                  className="overflow-hidden"
                  style={{
                    background: isBot ? '#fff' : '#075E54',
                    borderRadius: m.imageUrl
                      ? '0 0 8px 8px'
                      : isBot
                        ? '0 8px 8px 8px'
                        : '8px 0 8px 8px',
                    boxShadow: '0 1px 1px rgba(0,0,0,.12)',
                  }}
                >
                  {/* Text + meta row */}
                  <div className="px-2.5 pt-1.5 pb-1 text-[11px] leading-[1.45] whitespace-pre-wrap" style={{ color: isBot ? '#111' : '#ffffff' }}>
                    {m.isVoice && isBot && <span className="mr-1 text-[9px] text-gray-400">🎙</span>}
                    {m.text}

                    {/* Inline timestamp + ticks — floats to bottom-right of text */}
                    <span className="select-none" style={{ display: 'inline-block', minWidth: isBot ? 26 : 38, float: 'right', marginLeft: 4, marginTop: 2, textAlign: 'right' }}>
                      <span className="text-[9px]" style={{ color: isBot ? '#8a8a8a' : 'rgba(255,255,255,0.6)' }}>{time}</span>
                      {!isBot && (
                        <CheckCheck
                          className="inline ml-0.5"
                          style={{ width: 11, height: 11, color: '#53bdeb', verticalAlign: 'middle' }}
                          strokeWidth={2.5}
                        />
                      )}
                    </span>
                    {/* Clearfix */}
                    <span style={{ display: 'block', clear: 'both', height: 0 }} />
                  </div>

                  {/* Reply buttons (≤3) */}
                  {isButtons && (
                    <div style={{ borderTop: '1px solid #e8e8e8' }}>
                      {(m.items ?? []).map((btn, j) => (
                        <div key={j}>
                          <button
                            onClick={() => onButtonClick(btn.value, btn.icon ? `${btn.icon} ${btn.label}` : btn.label)}
                            className="w-full py-1.5 text-[11px] font-semibold text-center transition-colors"
                            style={{ color: '#0484d5', background: 'transparent' }}
                            onMouseEnter={e => (e.currentTarget.style.background = '#f5f5f5')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                          >
                            {btn.icon ? `${btn.icon} ${btn.label}` : btn.label}
                          </button>
                          {j < (m.items?.length ?? 0) - 1 && (
                            <div style={{ borderTop: '1px solid #efefef' }} />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* List trigger (4+ items) */}
                  {isList && (
                    <div style={{ borderTop: '1px solid #e8e8e8' }}>
                      <button
                        onClick={() => openSheet(m.items ?? [])}
                        className="w-full py-1.5 text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors"
                        style={{ color: '#0484d5', background: 'transparent' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#f5f5f5')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <List className="w-3 h-3" strokeWidth={2.5} />
                        View Options
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Cosmetic WhatsApp input bar ── */}
      <div
        className="flex items-center gap-1.5 px-2 py-1.5 flex-shrink-0"
        style={{ background: '#F0F0F0', borderTop: '1px solid #ddd' }}
      >
        <div
          className="flex-1 flex items-center gap-1.5 px-2.5 py-1"
          style={{ background: '#fff', borderRadius: 20, minWidth: 0 }}
        >
          <Smile className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#919191' }} />
          <span className="flex-1 text-[10px]" style={{ color: '#a0a0a0' }}>Message</span>
          <Paperclip className="w-3 h-3 flex-shrink-0" style={{ color: '#919191' }} />
        </div>
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: '#25D366' }}
        >
          <Mic className="w-3.5 h-3.5 text-white" />
        </div>
      </div>

      {/* ── Bottom sheet backdrop ── */}
      {sheet.open && (
        <div
          className="absolute inset-0 z-20"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={closeSheet}
        />
      )}

      {/* ── Bottom sheet drawer ── */}
      <div
        className="absolute left-0 right-0 bottom-0 z-30 flex flex-col"
        style={{
          background: '#fff',
          borderRadius: '16px 16px 0 0',
          maxHeight: '72%',
          transform: sheet.open ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.26s cubic-bezier(0.32, 0.72, 0, 1)',
          boxShadow: '0 -4px 24px rgba(0,0,0,.2)',
        }}
      >
        {/* Handle + header */}
        <div className="flex-shrink-0 px-4 pt-3 pb-2">
          <div className="mx-auto mb-3 rounded-full" style={{ width: 36, height: 4, background: '#d1d1d1' }} />
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-bold" style={{ color: '#111' }}>Select an option</span>
            <button onClick={closeSheet} className="p-1 rounded-full" style={{ background: '#f2f2f2' }}>
              <X className="w-3.5 h-3.5" style={{ color: '#666' }} strokeWidth={2.5} />
            </button>
          </div>
        </div>
        <div style={{ borderTop: '1px solid #efefef' }} />

        {/* Sections + rows */}
        <div className="overflow-y-auto flex-1">
          {groupBySections(sheet.items).map(([title, sectionItems], si, arr) => (
            <div key={si}>
              <div
                className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest"
                style={{ color: '#8a8a8a', background: '#f7f7f7', borderBottom: '1px solid #efefef' }}
              >
                {title}
              </div>
              {sectionItems.map((item, ri) => (
                <div key={ri}>
                  <button
                    onClick={() => handleSelect(item.value, item.label)}
                    className="w-full px-4 py-2.5 flex items-center gap-3 text-left transition-colors"
                    style={{ background: 'transparent' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f5f5f5')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    {item.icon && <span className="text-base flex-shrink-0">{item.icon}</span>}
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-medium truncate" style={{ color: '#111' }}>{item.label}</div>
                      {item.description && (
                        <div className="text-[10px] mt-0.5 truncate" style={{ color: '#8a8a8a' }}>{item.description}</div>
                      )}
                    </div>
                    {/* WhatsApp radio circle */}
                    <div
                      className="flex-shrink-0 rounded-full border-2"
                      style={{ width: 16, height: 16, borderColor: '#25D366' }}
                    />
                  </button>
                  {ri < sectionItems.length - 1 && (
                    <div className="mx-4" style={{ borderTop: '1px solid #f0f0f0' }} />
                  )}
                </div>
              ))}
              {si < arr.length - 1 && <div style={{ borderTop: '4px solid #f0f0f0' }} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
