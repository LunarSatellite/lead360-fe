import { useState, useEffect, useRef, useCallback } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  TrendingUp, Sparkles, ArrowLeft, Phone, ShoppingBag, MessageSquare,
  Utensils, Headphones,
} from 'lucide-react';

// ─── Chatbot preview types ───
type ProductCard = { name: string; price: string; was: string; bg: string };
type CardRow = { label: string; value: string };
type ChatMsg =
  | { kind: 'bot'; text: string }
  | { kind: 'user'; text: string }
  | { kind: 'buttons'; opts: string[] }
  | { kind: 'products'; items: ProductCard[] }
  | { kind: 'card'; title: string; badge: string; accentColor: string; rows: CardRow[] };

interface ScriptStep { msg: ChatMsg; pause: number; }

const DEMO_SCRIPT: ScriptStep[] = [
  { msg: { kind: 'bot', text: 'Hey! Welcome to Zova ✨ What are you shopping for today?' }, pause: 900 },
  { msg: { kind: 'buttons', opts: ['New Arrivals', 'Dresses', 'Sneakers', 'Track Order'] }, pause: 400 },
  { msg: { kind: 'user', text: 'Dresses' }, pause: 1800 },
  { msg: { kind: 'bot', text: "Love it! What's your usual size?" }, pause: 900 },
  { msg: { kind: 'user', text: 'Small / UK 8' }, pause: 1500 },
  { msg: { kind: 'bot', text: 'Just for you — 3 new drops this week in your size:' }, pause: 700 },
  {
    msg: {
      kind: 'products',
      items: [
        { name: 'Linen Wrap Dress', price: '£45', was: '£68', bg: 'linear-gradient(145deg,#f9a8d4,#be185d)' },
        { name: 'Floral Midi',      price: '£52', was: '£79', bg: 'linear-gradient(145deg,#c4b5fd,#6d28d9)' },
        { name: 'Satin Slip',       price: '£39', was: '£55', bg: 'linear-gradient(145deg,#fcd34d,#d97706)' },
      ],
    },
    pause: 500,
  },
  { msg: { kind: 'buttons', opts: ['Shop Now', 'Save to Wishlist', 'Main Menu'] }, pause: 400 },
];

const BELLA_SCRIPT: ScriptStep[] = [
  { msg: { kind: 'bot', text: 'Hi! Welcome to La Bella 🍝 I can help with reservations, the menu, and more.' }, pause: 800 },
  { msg: { kind: 'buttons', opts: ['Book a Table', "Today's Specials", 'Opening Hours'] }, pause: 400 },
  { msg: { kind: 'user', text: 'Book a Table' }, pause: 1600 },
  { msg: { kind: 'bot', text: 'How many guests will be dining?' }, pause: 900 },
  { msg: { kind: 'user', text: '2 people' }, pause: 1400 },
  { msg: { kind: 'bot', text: 'What date and time would you like?' }, pause: 800 },
  { msg: { kind: 'user', text: 'Tonight at 7:30 pm' }, pause: 1800 },
  {
    msg: {
      kind: 'card',
      title: 'Reservation Confirmed',
      badge: 'Booked',
      accentColor: '#F59E0B',
      rows: [
        { label: 'Restaurant', value: 'La Bella'    },
        { label: 'Date',       value: 'Tonight'     },
        { label: 'Time',       value: '7:30 PM'     },
        { label: 'Guests',     value: '2 people'    },
        { label: 'Table',      value: 'Window seat' },
      ],
    },
    pause: 500,
  },
  { msg: { kind: 'buttons', opts: ['Add Special Request', 'Cancel', 'Main Menu'] }, pause: 400 },
];

const ARIA_SCRIPT: ScriptStep[] = [
  { msg: { kind: 'bot', text: "Hello! I'm Aria from support. How can I help you today?" }, pause: 800 },
  { msg: { kind: 'buttons', opts: ['Track My Order', 'Start a Return', 'Talk to Agent'] }, pause: 400 },
  { msg: { kind: 'user', text: 'Track My Order' }, pause: 1600 },
  { msg: { kind: 'bot', text: "Sure! Share your order number and I'll look it up." }, pause: 900 },
  { msg: { kind: 'user', text: 'ORD-7823' }, pause: 1400 },
  { msg: { kind: 'bot', text: "Found it! Here's your current order status:" }, pause: 700 },
  {
    msg: {
      kind: 'card',
      title: 'Order #ORD-7823',
      badge: 'In Transit',
      accentColor: '#3B82F6',
      rows: [
        { label: 'Status',       value: 'Out for delivery' },
        { label: 'Carrier',      value: 'FedEx Express'    },
        { label: 'Est. arrival', value: 'Today by 6 PM'    },
        { label: 'Last update',  value: '3 stops away'     },
      ],
    },
    pause: 500,
  },
  { msg: { kind: 'buttons', opts: ['Track Live', 'Contact Driver', 'Need Help?'] }, pause: 400 },
];

const LOOP_PAUSE = 3200;

// ─── Generic animated chat demo ───
interface ChatDemoProps {
  script: ScriptStep[];
  botName: string;
  botColor: string;
  loop?: boolean;
  onComplete?: () => void;
}

function ChatDemo({ script, botName, botColor, loop = false, onComplete }: ChatDemoProps) {
  const [shown, setShown] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [shown, isTyping]);

  useEffect(() => {
    if (shown === script.length) {
      if (loop) {
        const t = window.setTimeout(() => setShown(0), LOOP_PAUSE);
        return () => clearTimeout(t);
      }
      onCompleteRef.current?.();
      return;
    }
    const step = script[shown];
    const isBot = step.msg.kind === 'bot' || step.msg.kind === 'products' || step.msg.kind === 'card';
    if (isBot) {
      setIsTyping(true);
      const t = window.setTimeout(() => { setIsTyping(false); setShown((s) => s + 1); }, step.pause);
      return () => clearTimeout(t);
    }
    const t = window.setTimeout(() => setShown((s) => s + 1), step.pause);
    return () => clearTimeout(t);
  }, [shown, script, loop]);

  const visible = script.slice(0, shown);

  return (
    <div className="rounded-2xl overflow-hidden border border-border-medium">
      {/* WhatsApp-style header */}
      <div className="bg-[#202C33] px-4 py-3 flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
          style={{ background: botColor + '22', border: `1px solid ${botColor}44` }}
        >
          <Sparkles className="w-4 h-4" style={{ color: botColor }} strokeWidth={1.6} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white leading-none">{botName}</p>
          <p className="text-[11px] font-medium mt-0.5" style={{ color: botColor }}>online</p>
        </div>
        <Phone className="w-4 h-4 text-[#8696A0]" strokeWidth={1.6} />
      </div>

      {/* Messages */}
      <div className="bg-[#0B141A] px-3 py-3 space-y-1.5 overflow-y-auto" style={{ maxHeight: '300px' }}>
        {visible.map((step, i) => {
          if (step.msg.kind === 'bot') {
            return (
              <div key={i} className="flex items-end max-w-[85%]">
                <div className="bg-[#202C33] rounded-lg rounded-tl-none px-3 py-2">
                  {step.msg.text.split('\n').map((line, j) => (
                    <p key={j} className="text-sm text-[#E9EDEF] leading-snug">{line}</p>
                  ))}
                  <p className="text-[10px] text-[#8696A0] text-right mt-1">just now</p>
                </div>
              </div>
            );
          }
          if (step.msg.kind === 'user') {
            return (
              <div key={i} className="flex justify-end">
                <div className="bg-[#005C4B] rounded-lg rounded-tr-none px-3 py-2 max-w-[75%]">
                  <p className="text-sm text-[#E9EDEF] leading-snug">{step.msg.text}</p>
                  <p className="text-[10px] text-[#8696A0] text-right mt-1">just now</p>
                </div>
              </div>
            );
          }
          if (step.msg.kind === 'buttons') {
            return (
              <div key={i} className="flex flex-wrap gap-1.5 pt-1 pb-0.5">
                {step.msg.opts.map((opt) => (
                  <div
                    key={opt}
                    className="px-3 py-1.5 rounded-full text-[11px] font-medium"
                    style={{ border: `1px solid ${botColor}`, color: botColor }}
                  >
                    {opt}
                  </div>
                ))}
              </div>
            );
          }
          if (step.msg.kind === 'products') {
            return (
              <div key={i} className="flex gap-2 overflow-x-auto pb-1" style={{ maxWidth: '96%', scrollbarWidth: 'none' }}>
                {step.msg.items.map((item) => (
                  <div
                    key={item.name}
                    className="rounded-2xl overflow-hidden shrink-0 w-[110px]"
                    style={{ background: '#1A2730', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    <div
                      className="relative flex flex-col items-center justify-end pb-3"
                      style={{ height: '130px', background: item.bg }}
                    >
                      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 38% 22%, rgba(255,255,255,0.25), transparent 58%)' }} />
                      <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)' }}>
                        <span style={{ fontSize: 8, fontWeight: 900, color: '#fff', letterSpacing: '2px', textTransform: 'uppercase' }}>NEW</span>
                      </div>
                      <ShoppingBag className="relative z-10 text-white" style={{ width: 38, height: 38, filter: 'drop-shadow(0 3px 12px rgba(0,0,0,0.45))' }} strokeWidth={1.2} />
                      <div className="relative z-10 flex gap-px mt-1.5">
                        {[0, 1, 2, 3].map((s) => <span key={s} style={{ fontSize: 10, color: 'rgba(255,255,255,0.95)', lineHeight: 1 }}>★</span>)}
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', lineHeight: 1 }}>★</span>
                      </div>
                    </div>
                    <div className="px-2.5 pt-2 pb-2.5">
                      <p className="text-[10px] font-bold leading-snug" style={{ color: '#E9EDEF' }}>{item.name}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[13px] font-extrabold" style={{ color: botColor }}>{item.price}</span>
                        <span className="text-[9px]" style={{ color: '#8696A0', textDecoration: 'line-through' }}>{item.was}</span>
                      </div>
                      <div className="mt-2 w-full text-center rounded-lg py-1.5" style={{ background: 'linear-gradient(135deg,#00FFAA,#00A884)', color: '#0B1F17', fontSize: 9, fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                        Shop Now
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          }
          if (step.msg.kind === 'card') {
            return (
              <div key={i} className="flex items-end max-w-[88%]">
                <div className="rounded-lg rounded-tl-none overflow-hidden" style={{ background: '#1E2C34', border: `1px solid ${step.msg.accentColor}33` }}>
                  <div className="px-3 py-2 flex items-center justify-between gap-3" style={{ borderBottom: `1px solid ${step.msg.accentColor}22`, background: step.msg.accentColor + '12' }}>
                    <span className="text-[11px] font-extrabold text-white">{step.msg.title}</span>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0" style={{ background: step.msg.accentColor + '25', color: step.msg.accentColor }}>
                      {step.msg.badge}
                    </span>
                  </div>
                  <div className="px-3 py-2.5 space-y-1.5">
                    {step.msg.rows.map((row) => (
                      <div key={row.label} className="flex items-center justify-between gap-6">
                        <span className="text-[10px] text-[#8696A0]">{row.label}</span>
                        <span className="text-[10px] font-semibold text-[#E9EDEF]">{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          }
          return null;
        })}

        {isTyping && (
          <div className="flex items-end max-w-[85%]">
            <div className="bg-[#202C33] rounded-lg rounded-tl-none px-3.5 py-3 flex items-center gap-1">
              {[0, 1, 2].map((dot) => (
                <div key={dot} className="w-1.5 h-1.5 rounded-full bg-[#8696A0] animate-bounce" style={{ animationDelay: `${dot * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

// Register panel — loops forever
function ChatbotPreview() {
  return <ChatDemo script={DEMO_SCRIPT} botName="Zova Bot" botColor="#00A884" loop />;
}

// ─── Industry showcase for login panel ───
const INDUSTRY_DEMOS: Array<{ id: string; label: string; Icon: LucideIcon; botName: string; botColor: string; script: ScriptStep[] }> = [
  { id: 'ecommerce',  label: 'E-Commerce', Icon: ShoppingBag, botName: 'Zova Bot',     botColor: '#00A884', script: DEMO_SCRIPT  },
  { id: 'restaurant', label: 'Restaurant',  Icon: Utensils,    botName: 'Bella Bot',    botColor: '#F59E0B', script: BELLA_SCRIPT },
  { id: 'support',    label: 'Support',     Icon: Headphones,  botName: 'Aria Support', botColor: '#3B82F6', script: ARIA_SCRIPT  },
];

function IndustryShowcase() {
  const [active, setActive] = useState(0);
  const [resetKey, setResetKey] = useState(0);

  const handleComplete = useCallback(() => {
    window.setTimeout(() => {
      setActive((a) => (a + 1) % INDUSTRY_DEMOS.length);
      setResetKey((k) => k + 1);
    }, 1800);
  }, []);

  const demo = INDUSTRY_DEMOS[active];

  return (
    <div>
      <div className="mb-4">
        <p className="text-2xs font-bold uppercase tracking-[3px] text-brand mb-2">See it in action</p>
        <h2 className="text-[26px] font-black text-text-primary leading-tight">
          Your bot, any industry.<br />Every channel.
        </h2>
      </div>

      <div className="flex items-center gap-2 mb-4">
        {INDUSTRY_DEMOS.map((d, i) => {
          const DIcon = d.Icon;
          const isActive = active === i;
          return (
            <button
              key={d.id}
              onClick={() => { setActive(i); setResetKey((k) => k + 1); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-semibold transition-all"
              style={isActive
                ? { background: d.botColor + '18', border: `0.5px solid ${d.botColor}55`, color: d.botColor }
                : { background: 'transparent', border: '0.5px solid #253D32', color: '#665C1A' }}
            >
              <DIcon className="w-3.5 h-3.5" strokeWidth={1.6} />
              {d.label}
            </button>
          );
        })}
      </div>

      <ChatDemo
        key={`${demo.id}-${resetKey}`}
        script={demo.script}
        botName={demo.botName}
        botColor={demo.botColor}
        onComplete={handleComplete}
      />

      <div className="grid grid-cols-3 gap-2 mt-3 mb-6">
        {[
          { label: 'Channels',   value: '6+'     },
          { label: 'Setup time', value: '<5 min' },
          { label: 'Industries', value: '12+'    },
        ].map(({ label, value }) => (
          <div key={label} className="text-center py-2 rounded-sm" style={{ background: 'rgba(0,217,126,0.05)', border: '0.5px solid #1E2E26' }}>
            <p className="text-sm font-extrabold text-brand">{value}</p>
            <p className="text-[10px] text-text-muted mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex -space-x-2.5">
          {(['#3B82F6', '#F59E0B', '#8B5CF6'] as const).map((c, i) => (
            <div key={i} className="w-8 h-8 rounded-full border-2 border-bg-card flex items-center justify-center text-2xs font-bold text-white" style={{ background: c }}>
              {['AK', 'SR', 'JP'][i]}
            </div>
          ))}
        </div>
        <span className="text-xs text-text-muted">
          <span className="text-brand font-bold">50+</span> teams already building
        </span>
      </div>
    </div>
  );
}

// ─── Carousel: IndustryShowcase ↔ LoginPanel ───
const PANEL_LABELS = ['Product Demo', 'Live Dashboard'] as const;

function LoginPanelCarousel() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActive((i) => (i + 1) % 2), 30000);
    return () => clearInterval(t);
  }, []);

  return (
    <div>
      <div className="relative" style={{ minHeight: 540 }}>
        {([<IndustryShowcase />, <LoginPanel />] as const).map((panel, i) => (
          <div
            key={i}
            className="transition-all duration-500 ease-in-out"
            style={{
              opacity: active === i ? 1 : 0,
              transform: `translateY(${active === i ? 0 : active > i ? -10 : 10}px)`,
              position: active === i ? 'relative' : 'absolute',
              top: 0, left: 0, right: 0,
              pointerEvents: active === i ? 'auto' : 'none',
            }}
          >
            {panel}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2.5 mt-4">
        {PANEL_LABELS.map((label, i) => (
          <button
            key={label}
            onClick={() => setActive(i)}
            aria-label={`Show ${label}`}
            className="flex items-center gap-2 transition-all duration-300"
          >
            <span
              className="rounded-full transition-all duration-300"
              style={{ display: 'block', width: active === i ? 20 : 6, height: 6, background: active === i ? '#00D97E' : '#253D32' }}
            />
            {active === i && <span className="text-[11px] font-semibold text-brand">{label}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Login panel data ───
const LIVE_FEED = [
  { color: '#25D366', init: 'P', name: 'Priya M.',  ch: 'WhatsApp', msg: "My order hasn't arrived yet",   ago: 'just now' },
  { color: '#3B82F6', init: 'J', name: 'James K.',  ch: 'Web',      msg: 'Can I change my plan?',          ago: '6s ago'   },
  { color: '#F59E0B', init: 'A', name: 'Aisha R.',  ch: 'SMS',      msg: 'Delivery confirmation needed',   ago: '14s ago'  },
  { color: '#25D366', init: 'M', name: 'Marco S.',  ch: 'WhatsApp', msg: 'Need my tracking number please', ago: '21s ago'  },
  { color: '#3B82F6', init: 'L', name: 'Lena C.',   ch: 'Web',      msg: 'Where is the size guide?',       ago: '29s ago'  },
  { color: '#25D366', init: 'R', name: 'Ravi T.',   ch: 'WhatsApp', msg: 'Cancel my last order please',   ago: '37s ago'  },
];
const SPARK = [22, 35, 28, 50, 43, 66, 58, 80, 71, 90, 82, 100];

function useCountUp(target: number, duration = 1300) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const steps = Math.round(duration / 16);
    let i = 0;
    const t = setInterval(() => {
      i++;
      setVal(Math.round(target * Math.min(i / steps, 1)));
      if (i >= steps) clearInterval(t);
    }, 16);
    return () => clearInterval(t);
  }, [target, duration]);
  return val;
}

function LoginPanel() {
  const convCount = useCountUp(143, 1200);
  const resRate   = useCountUp(91,  1500);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 2800);
    return () => clearInterval(t);
  }, []);

  const feed = [0, 1, 2].map((off) => LIVE_FEED[(tick + off) % LIVE_FEED.length]);

  return (
    <>
      <style>{`
        @keyframes omni-slide-down {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes omni-bar-grow {
          from { transform: scaleY(0); }
          to   { transform: scaleY(1); }
        }
      `}</style>

      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-2xs font-bold uppercase tracking-[3px] text-brand mb-2">Welcome back</p>
          <h2 className="text-[28px] font-black text-text-primary leading-tight">
            Your chatbot's<br />been busy
          </h2>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-soft border border-border-glow mt-1 shrink-0">
          <div className="relative w-2 h-2">
            <div className="absolute inset-0 rounded-full bg-brand animate-ping" style={{ opacity: 0.55 }} />
            <div className="relative w-2 h-2 rounded-full bg-brand" />
          </div>
          <span className="text-[11px] font-extrabold text-brand tracking-widest">LIVE</span>
        </div>
      </div>

      <div className="bg-bg rounded-2xl border border-border-subtle p-4 mb-3">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-[52px] font-black text-text-primary leading-none tracking-tighter">{convCount}</p>
            <p className="text-xs text-text-secondary mt-1">conversations today</p>
          </div>
          <div className="text-right pt-1">
            <div className="flex items-center gap-1 justify-end">
              <TrendingUp className="w-3.5 h-3.5 text-success" strokeWidth={2.5} />
              <span className="text-sm font-extrabold text-success">+12%</span>
            </div>
            <p className="text-[10px] text-text-muted mt-0.5">vs yesterday</p>
          </div>
        </div>
        <div className="flex items-end gap-[3px]" style={{ height: 44 }}>
          {SPARK.map((v, i) => {
            const isLast = i === SPARK.length - 1;
            return (
              <div
                key={i}
                className="flex-1 rounded-sm"
                style={{
                  height: `${v}%`,
                  transformOrigin: 'bottom',
                  animation: `omni-bar-grow 0.5s ease-out ${i * 0.04}s both`,
                  background: isLast
                    ? 'linear-gradient(to top, #00D97E, #00FFAA)'
                    : `rgba(0,217,126,${0.12 + (i / SPARK.length) * 0.38})`,
                }}
              />
            );
          })}
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[9px] text-text-muted">12 days ago</span>
          <span className="text-[9px] font-bold text-brand">today</span>
        </div>
      </div>

      <div className="bg-bg rounded-2xl border border-border-subtle p-4 mb-3 overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-3.5 h-3.5 text-text-muted" strokeWidth={1.6} />
            <span className="text-[11px] font-bold uppercase tracking-[1.5px] text-text-muted">Live feed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            <span className="text-[11px] font-bold text-success">23 active</span>
          </div>
        </div>
        <div className="space-y-3">
          {feed.map((item, i) => (
            <div
              key={`${tick}-${i}`}
              className="flex items-center gap-2.5"
              style={{ animation: i === 0 ? 'omni-slide-down 0.32s ease-out' : undefined, opacity: 1 - i * 0.18 }}
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-extrabold text-white shrink-0" style={{ background: item.color }}>
                {item.init}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-xs font-bold text-text-primary truncate">{item.name}</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0" style={{ background: item.color + '28', color: item.color }}>
                    {item.ch}
                  </span>
                </div>
                <p className="text-[11px] text-text-muted truncate">{item.msg}</p>
              </div>
              <span className="text-[10px] text-text-muted shrink-0 tabular-nums">{item.ago}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5 mb-7">
        {[
          { label: 'Today',        value: String(convCount) },
          { label: 'Bot resolved', value: `${resRate}%`     },
          { label: 'Avg response', value: '1.4s'            },
        ].map((stat) => (
          <div key={stat.label} className="bg-bg rounded-xl border border-border-subtle p-3 text-center">
            <p className="text-xl font-extrabold text-text-primary leading-none mb-1">{stat.value}</p>
            <p className="text-[10px] text-text-muted leading-tight">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex -space-x-2.5">
          {(['#3B82F6', '#F59E0B', '#8B5CF6'] as const).map((c, i) => (
            <div key={i} className="w-8 h-8 rounded-full border-2 border-bg-card flex items-center justify-center text-2xs font-bold text-white" style={{ background: c }}>
              {['AK', 'SR', 'JP'][i]}
            </div>
          ))}
        </div>
        <span className="text-xs text-text-muted">
          <span className="text-brand font-bold">50+</span> teams already building
        </span>
      </div>
    </>
  );
}

// ─── Main layout ───
export function AuthLayout() {
  const location = useLocation();
  const isRegister = location.pathname.includes('register');

  return (
    <div className="bg-bg lg:h-screen lg:flex lg:overflow-hidden">
      {/* ─── FORM PANEL ─── */}
      <div className="w-full lg:w-1/2 lg:h-screen lg:overflow-y-auto relative">
        <div
          className="absolute top-[-200px] right-[-100px] w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] rounded-full pointer-events-none opacity-40"
          style={{ background: 'radial-gradient(circle, rgba(0,217,126,0.04), transparent 70%)' }}
        />
        <div className="px-5 sm:px-8 md:px-12 lg:px-16 xl:px-20 pt-6 sm:pt-8 lg:pt-12 pb-32 sm:pb-32 lg:pb-12 relative z-10">
          <div className="flex items-center justify-between mb-8 sm:mb-10 lg:mb-12">
            <Link to="/" className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-10 sm:w-11 h-10 sm:h-11 rounded-xl bg-[#050808] flex items-center justify-center p-1 shrink-0">
                <img src="/Lead360logo/1.png" alt="Lead360" className="w-full h-full object-contain" />
              </div>
              <div className="min-w-0">
                <span className="text-lg sm:text-xl font-extrabold text-text-primary tracking-tight block leading-tight">Lead360</span>
                <p className="text-[10px] sm:text-2xs text-text-muted">CRM & automation</p>
              </div>
            </Link>
            <Link to="/" className="lg:hidden flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.8} />
              Home
            </Link>
          </div>

          <div className={`w-full ${isRegister ? 'lg:max-w-lg' : 'lg:max-w-md'} mx-auto lg:mx-0`}>
            <Outlet />
          </div>
        </div>
      </div>

      {/* ─── MARKETING PANEL ─── */}
      <div className="hidden lg:block lg:w-1/2 lg:h-screen lg:overflow-y-auto bg-bg-card border-l border-border-subtle">
        <div className="px-16 xl:px-20 py-12 relative min-h-full flex flex-col justify-center">
          <div className="absolute inset-0 opacity-30 pointer-events-none overflow-hidden">
            <svg width="100%" height="100%">
              <defs>
                <pattern id="auth-grid" width="50" height="50" patternUnits="userSpaceOnUse">
                  <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(0,217,126,0.03)" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#auth-grid)" />
            </svg>
          </div>

          <div className="relative z-10">
            {isRegister ? (
              <>
                <p className="text-2xs font-bold uppercase tracking-[3px] text-brand mb-3">See it in action</p>
                <h2 className="text-2xl font-extrabold text-text-primary leading-tight mb-2">This is what you'll build</h2>
                <p className="text-sm text-text-secondary mb-6 max-w-md">
                  A fully automated chatbot live on WhatsApp, Web, and SMS — set up through a conversation
                  with our AI. No code, no integrations, no forms.
                </p>
                <ChatbotPreview />
                <p className="text-[11px] text-text-muted mt-3 mb-6 text-center">Live demo — loops automatically</p>
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2.5">
                    {['#3B82F6', '#F59E0B', '#8B5CF6'].map((c, i) => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-bg-card flex items-center justify-center text-2xs font-bold text-white" style={{ background: c }}>
                        {['AK', 'SR', 'JP'][i]}
                      </div>
                    ))}
                  </div>
                  <span className="text-xs text-text-muted">
                    <span className="text-brand font-bold">50+</span> teams already building
                  </span>
                </div>
              </>
            ) : (
              <LoginPanelCarousel />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
